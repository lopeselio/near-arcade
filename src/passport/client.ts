// Getting a passport into the page. In order: this site's /api/passport (Vercel), the Vercel
// deployment by absolute URL (when this copy is the Azure mirror or local `vite`), and finally the
// same reads straight from the browser, so the page works with no server at all.
import { useEffect, useRef, useState } from 'react';
import type { NearConnector } from '@hot-labs/near-connect';
import { buildPassport, type Passport } from './core';

const VERCEL = 'https://arcade.lopeselio.online';
export type Via = 'arcade server' | 'arcade server (Vercel)' | 'your browser';

class NoApi extends Error {}
class BadAccount extends Error {}

async function fromApi(base: string, account: string): Promise<Passport> {
  const r = await fetch(`${base}/api/passport/${encodeURIComponent(account)}`, { signal: AbortSignal.timeout(25_000) }).catch((e) => {
    // cross-origin with no CORS answer (an older deployment without the API): treat as no API
    throw e instanceof TypeError && base ? new NoApi() : e;
  });
  // the SPA fallback (Azure's 404 page, vite dev) answers with index.html: no API here
  if (!(r.headers.get('content-type') ?? '').includes('application/json')) throw new NoApi();
  const b = await r.json();
  if (r.status === 400) throw new BadAccount(b.error ?? 'not a NEAR account id');
  if (!r.ok) throw new Error(b.error ?? `HTTP ${r.status}`);
  return b as Passport;
}

const ROUTES: [Via, (a: string) => Promise<Passport>][] = [
  ['arcade server', (a) => fromApi('', a)],
  ...(location.origin === VERCEL ? [] : [['arcade server (Vercel)', (a: string) => fromApi(VERCEL, a)] as [Via, (a: string) => Promise<Passport>]]),
  ['your browser', (a) => buildPassport(a)],
];
/** Routes that turned out to have no API behind them (asked once per page load). */
const missing = new Set<number>();

/** `apiOnly`: skip the in-browser read (for the arcade header, which shouldn't cost the floor dozens of extra reads). */
export async function loadPassport(account: string, { apiOnly = false } = {}): Promise<{ passport: Passport; via: Via }> {
  let last: unknown;
  for (let i = 0; i < ROUTES.length; i++) {
    if (missing.has(i) || (apiOnly && ROUTES[i][0] === 'your browser')) continue;
    try {
      return { passport: await ROUTES[i][1](account), via: ROUTES[i][0] };
    } catch (e) {
      if (e instanceof BadAccount) throw e;
      if (e instanceof NoApi) missing.add(i);
      last = e;
    }
  }
  throw last;
}

export const POLL_MS = 20_000;

/** The passport for `account`, refreshed every 20 s while the tab is visible. */
export function usePassport(account: string | null) {
  const [state, setState] = useState<{ passport: Passport | null; via: Via | null; error: string | null; loading: boolean }>({ passport: null, via: null, error: null, loading: false });
  const seq = useRef(0);
  useEffect(() => {
    if (!account) { setState({ passport: null, via: null, error: null, loading: false }); return; }
    const mine = ++seq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setState((s) => ({ passport: s.passport?.account === account ? s.passport : null, via: s.via, error: null, loading: true }));
    const tick = async () => {
      clearTimeout(timer);
      try {
        const { passport, via } = await loadPassport(account);
        if (seq.current === mine) setState({ passport, via, error: null, loading: false });
      } catch (e) {
        if (seq.current === mine) setState((s) => ({ ...s, error: (e as Error).message || 'could not read the chain', loading: false }));
      }
      if (seq.current === mine && document.visibilityState === 'visible') timer = setTimeout(tick, POLL_MS);
    };
    const onVis = () => { if (document.visibilityState === 'visible') tick(); else clearTimeout(timer); };
    tick();
    document.addEventListener('visibilitychange', onVis);
    return () => { seq.current++; clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); };
  }, [account]);
  return state;
}

// ── the account to show: ?account=, else the one remembered in this browser ──

const KEY = 'arcade:passport';
type Saved = { account: string; wallet: boolean };

export function savedAccount(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export function saveAccount(s: Saved | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* blocked: the URL still carries the account */
  }
}

// ── NEAR Connect: only to learn the account id; the passport never asks a wallet to sign ──

let connector: Promise<NearConnector> | null = null;
const picker = () =>
  (connector ??= import('@hot-labs/near-connect').then(({ NearConnector }) => new NearConnector({ network: 'testnet', features: { testnet: true } })));

/** Resolves to null when the player closes the wallet picker without choosing. */
export async function connectWallet(): Promise<string | null> {
  const c = await picker();
  const existing = await c.getConnectedWallet().catch(() => null);
  const wallet = existing?.wallet ?? (await c.connect().catch(ignoreDismissal));
  if (!wallet) return null;
  const [acc] = await wallet.getAccounts({ network: 'testnet' });
  if (!acc) throw new Error('the wallet did not share an account');
  return acc.accountId;
}

// NEAR Connect rejects with this message when its picker is closed.
const ignoreDismissal = (e: unknown) => {
  if ((e as Error)?.message === 'User rejected') return null;
  throw e;
};

export async function disconnectWallet() {
  if (!connector) return;
  await (await connector).disconnect().catch(() => {});
}
