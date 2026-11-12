// NEAR testnet reads: public RPC, no keys. Requests rotate across several providers, a provider that
// rate-limits or errors sits out for a while, and every read keeps its last good answer so a busy
// network shows a slightly older value (marked as cached) instead of nothing.

/**
 * Public testnet endpoints from https://docs.near.org/api/rpc/providers (rpc.testnet.near.org is
 * deprecated and answers 429). In Node, NEAR_RPC_URL goes first if set.
 */
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
export const RPCS = [...new Set([
  ...(env?.NEAR_RPC_URL ? [env.NEAR_RPC_URL] : []),
  'https://rpc.testnet.fastnear.com',
  'https://near-testnet.drpc.org',
  'https://testnet-rpc.intea.rs',
  'https://test.rpc.fastnear.com',
  'https://api.zan.top/near-testnet',
])];

type QueryParams = Record<string, unknown> & { request_type: string };

/** An answer from the chain itself (unknown account, a view that panicked): retrying elsewhere won't change it. */
class ChainError extends Error {}

/** A provider said "slow down" (HTTP 429, a -429/limit error in the body) or failed on its side (5xx). */
class BusyError extends Error {
  /** ms the provider asked us to wait (Retry-After), 0 if it didn't say. */
  retryAfter: number;
  constructor(msg: string, retryAfter = 0) {
    super(msg);
    this.retryAfter = retryAfter;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Per endpoint: benched until this time (ms), and how many times in a row it has been busy. */
const bench = new Map<string, { until: number; strikes: number }>();
/** Round-robin start, so parallel reads spread over the providers instead of all hitting the first. */
let turn = 0;

function strike(url: string, retryAfterMs: number) {
  const b = bench.get(url) ?? { until: 0, strikes: 0 };
  b.strikes++;
  b.until = Date.now() + Math.max(retryAfterMs, Math.min(30_000, 1000 * 2 ** b.strikes));
  bench.set(url, b);
}

async function post(url: string, params: QueryParams): Promise<unknown> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'arcade', method: 'query', params: { finality: 'final', ...params } }),
    signal: AbortSignal.timeout(8000),
  });
  if (r.status === 429 || r.status >= 500) throw new BusyError(`HTTP ${r.status}`, Number(r.headers.get('retry-after')) * 1000 || 0);
  const b = await r.json();
  if (b.result?.error) throw new ChainError(JSON.stringify(b.result.error));
  if (b.error) {
    const msg = JSON.stringify(b.error);
    if (/UNKNOWN_ACCOUNT|NO_CONTRACT_CODE|CONTRACT_EXECUTION_ERROR|MethodNotFound/.test(msg)) throw new ChainError(msg);
    if (/-429|rate limit|Rate limits/i.test(msg)) throw new BusyError(msg);
    throw new Error(msg);
  }
  return b.result;
}

/**
 * Tries the providers in turn, starting from the next one in the rotation and skipping benched ones
 * (unless all are benched). If every provider fails, waits with exponential backoff and jitter and goes
 * round again, up to 4 rounds.
 */
async function rpc<T>(params: QueryParams): Promise<T> {
  let last: unknown;
  for (let round = 0; round < 4; round++) {
    if (round) await sleep(500 * 2 ** round + Math.random() * 400);
    // an explicit NEAR_RPC_URL is always tried first; otherwise start from the next provider in turn
    const start = env?.NEAR_RPC_URL ? 0 : turn++ % RPCS.length;
    const order = RPCS.map((_, i) => RPCS[(start + i) % RPCS.length]);
    const now = Date.now();
    const ready = order.filter((u) => (bench.get(u)?.until ?? 0) <= now);
    for (const url of ready.length ? ready : order) {
      try {
        const out = (await post(url, params)) as T;
        bench.delete(url);
        return out;
      } catch (e) {
        if (e instanceof ChainError) throw e;
        strike(url, e instanceof BusyError ? e.retryAfter : 0);
        last = e;
      }
    }
  }
  throw last;
}

// ── last-good cache ───────────────────────────────────────────────────────
// In the browser it also lives in sessionStorage, so a reload during a rate-limit storm still has numbers.

const memory = new Map<string, unknown>();
/** Keys whose latest answer came from the cache rather than the chain. */
const servedStale = new Set<string>();

function store(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

function remember(key: string, value: unknown) {
  memory.set(key, value);
  servedStale.delete(key);
  try {
    store()?.setItem(`arcade:${key}`, JSON.stringify(value));
  } catch {
    /* full or blocked: the memory copy is enough */
  }
}

function recall(key: string): { value: unknown } | null {
  if (memory.has(key)) return { value: memory.get(key) };
  try {
    const raw = store()?.getItem(`arcade:${key}`);
    if (raw != null) return { value: JSON.parse(raw) };
  } catch {
    /* blocked or corrupt */
  }
  return null;
}

/** Runs a read; on success keeps the answer, and if the network fails falls back to the last good one. */
async function cached<T>(key: string, read: () => Promise<T>): Promise<T> {
  try {
    const v = await read();
    remember(key, v);
    return v;
  } catch (e) {
    const hit = !(e instanceof ChainError) && recall(key);
    if (!hit) throw e;
    servedStale.add(key);
    return hit.value as T;
  }
}

/** True if any read of these accounts was last answered from the cache. */
export function servedFromCache(accountIds: readonly string[]): boolean {
  for (const k of servedStale) if (accountIds.some((id) => k.startsWith(`${id}|`))) return true;
  return false;
}

/** Calls a contract view method and parses its JSON result. */
export async function view<T = any>(accountId: string, method: string, args: Record<string, unknown> = {}): Promise<T> {
  const argJson = JSON.stringify(args);
  return cached(`${accountId}|view|${method}|${argJson}`, async () => {
    const r = await rpc<{ result: number[] }>({
      request_type: 'call_function',
      account_id: accountId,
      method_name: method,
      args_base64: btoa(argJson),
    });
    return JSON.parse(new TextDecoder().decode(new Uint8Array(r.result)));
  });
}

export interface AccountState {
  /** NEAR, to 6 decimals. */
  balance: number;
  /** Bytes of storage used. */
  storage: number;
  /** Balance minus what the storage costs (1e-5 NEAR per byte). */
  free: number;
  /** The read failed and this is the last good answer. */
  cached?: boolean;
}

export async function readAccount(id: string): Promise<AccountState> {
  const key = `${id}|account`;
  const a = await cached(key, () => rpc<{ amount: string; storage_usage: number }>({ request_type: 'view_account', account_id: id }));
  const balance = Number(BigInt(a.amount) / 10n ** 18n) / 1e6;
  return { balance, storage: a.storage_usage, free: balance - a.storage_usage * 1e-5, ...(servedStale.has(key) ? { cached: true } : {}) };
}

/** One access key: full access, or a function-call key limited to one receiver, some methods and a gas allowance. */
export interface KeyInfo {
  full: boolean;
  receiver?: string;
  /** Empty means any method on the receiver. */
  methods?: string[];
  /** NEAR left to spend on gas; null means no allowance limit. */
  allowance?: number | null;
}

type Permission = 'FullAccess' | { FunctionCall: { receiver_id: string; method_names: string[]; allowance: string | null } };

/** Every access key on an account (view_access_key_list). */
export async function accessKeys(id: string): Promise<KeyInfo[]> {
  const r = await cached(`${id}|keys`, () => rpc<{ keys: { access_key: { permission: Permission } }[] }>({ request_type: 'view_access_key_list', account_id: id }));
  return r.keys.map(({ access_key: { permission: p } }): KeyInfo => {
    if (p === 'FullAccess') return { full: true };
    const fc = p.FunctionCall;
    return { full: false, receiver: fc.receiver_id, methods: fc.method_names, allowance: fc.allowance == null ? null : Number(BigInt(fc.allowance) / 10n ** 18n) / 1e6 };
  });
}

export const fmt = (n: number | string, d = 0) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

export const explorer = (id: string) => `https://testnet.nearblocks.io/address/${id}`;

/** Readable player names: agents by name, guests and implicit accounts shortened. */
export function who(id: string): string {
  const agent = id.match(/^([a-z]+)(?:-\d+)?\.v3\.bazaar-liars\.testnet$/);
  if (agent) return `${agent[1][0].toUpperCase()}${agent[1].slice(1)} (AI)`;
  if (/^guest-/.test(id)) return `Guest ${id.slice(6, 10)}`;
  if (/^[0-9a-f]{64}$/.test(id)) return `${id.slice(0, 5)}…${id.slice(-4)}`;
  return id.replace(/\.testnet$/, '');
}
