import { useEffect, useState } from 'react';
import { fmt, readAccount, servedFromCache, type AccountState } from './chain';
import { GAMES, type Game, type Slug } from './games';
import { LOADERS, type Panel, type TickerLine } from './loaders';

/** Phones get the "built for desktop" warning on Cabinet-only games, desktops the reverse. */
export const isPhone = matchMedia('(pointer: coarse) and (max-width: 900px)').matches;
/** Reduced motion: the bulbs and the ticker stand still. */
export const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** `cached`: some or all of it is the last good read, because the chain didn't answer this time. */
export type PanelState = { status: 'ok'; panel: Panel; cached?: boolean } | { status: 'error' };

/** The last panel each game showed, kept for this browser session. */
function savedPanel(slug: Slug): Panel | null {
  try {
    const raw = sessionStorage.getItem(`arcade:panel:${slug}`);
    return raw ? (JSON.parse(raw) as Panel) : null;
  } catch {
    return null;
  }
}

function savePanel(slug: Slug, panel: Panel) {
  try {
    sessionStorage.setItem(`arcade:panel:${slug}`, JSON.stringify(panel));
  } catch {
    /* blocked or full */
  }
}

export type AccountRow = { game: Game; id: string; role: string; contract: boolean } & (
  | ({ missing?: false } & AccountState)
  | { missing: true }
);

/**
 * Runs every game's loader once. Ticker lines keep the order their loaders answered in. A loader that
 * fails shows the panel this session last read, marked cached, rather than an empty board.
 */
export function usePanels() {
  const [panels, setPanels] = useState<Partial<Record<Slug, PanelState>>>({});
  useEffect(() => {
    let live = true;
    for (const g of GAMES) {
      const ids = g.accounts.map(([id]) => id);
      LOADERS[g.slug]().then(
        (panel) => {
          const cached = servedFromCache(ids);
          if (!cached) savePanel(g.slug, panel);
          if (live) setPanels((p) => ({ ...p, [g.slug]: { status: 'ok', panel, cached } }));
        },
        () => {
          const panel = savedPanel(g.slug);
          if (live) setPanels((p) => ({ ...p, [g.slug]: panel ? { status: 'ok', panel, cached: true } : { status: 'error' } }));
        },
      );
    }
    return () => { live = false; };
  }, []);
  return panels;
}

/** Every game account's balance (and, for contracts, what is still free for storage). */
export function useAccounts() {
  const [rows, setRows] = useState<AccountRow[] | null>(null);
  useEffect(() => {
    let live = true;
    const wanted = GAMES.flatMap((game: Game) => game.accounts.map(([id, role, contract]) => ({ game, id, role, contract: !!contract })));
    Promise.all(
      wanted.map((r) => readAccount(r.id).then((a): AccountRow => ({ ...r, ...a }), (): AccountRow => ({ ...r, missing: true }))),
    ).then((list) => live && setRows(list));
    return () => { live = false; };
  }, []);
  return rows;
}

/** The ticker: every game's lines in the order they arrived, then the NEAR held by all game accounts. */
export function tickerLines(panels: Partial<Record<Slug, PanelState>>, accounts: AccountRow[] | null) {
  const lines: TickerLine[] = [];
  for (const s of Object.values(panels)) if (s?.status === 'ok') lines.push(...s.panel.ticker);
  if (accounts) {
    const live = accounts.filter((r) => !r.missing);
    const total = live.reduce((a, r) => a + (r.missing ? 0 : r.balance), 0);
    lines.push({ b: `${fmt(total, 1)} NEAR`, text: `held by ${live.length} game accounts` });
  }
  const settled = Object.keys(panels).length === GAMES.length;
  return { lines, failed: settled && !lines.length };
}
