// Arcade Passport: one account's progress across the nine games, read-only.
// Runs in two places with the same code: the Vercel function api/passport/[account].ts, and the
// browser when that function isn't reachable (the Azure mirror, local `vite`).
//
// Two kinds of source:
// - contract views per game (stats_of, get_record, warden_of + get_warden, chef_of + get_token, ...)
//   give what each game recorded for the account: matches, wins, coins, parks;
// - the NearBlocks testnet API (v3) gives *when*: receipts the account sent to a game contract
//   (relayed NEP-366 meta-transactions included: the inner receipt's predecessor is the player, not
//   the relayer), and game tokens minted or sent to it (PEARL, EMBER, chef / munition NFTs).
// A few games also store a day themselves (Sushi Sabotage's daily claim, Bazaar of Liars' cred streak,
// Parkwright's park creation time); those days count too. Nothing is estimated.
import { view } from '../chain.js';
import { GAMES, type Slug } from '../games.js';

export type Day = string; // YYYY-MM-DD, UTC

export interface Action {
  /** ms since epoch */
  at: number;
  game: Slug;
  /** What happened, e.g. "commit_fleet" or "minted 5 PEARL". */
  what: string;
  tx?: string;
  source: 'receipt' | 'ft' | 'nft';
}

export interface GameEntry {
  id: Slug;
  name: string;
  url: string;
  glow: string;
  played: boolean;
  lastPlayed: Day | null;
  /** Days with a dated action in this game. */
  days: Day[];
  stats: Record<string, number | string>;
  /** Only for games that record wins. */
  wins?: number;
  /** Where this game's activity dates come from, in words. */
  dates: string;
  error?: string;
  note?: string;
}

export interface PointsLine {
  key: 'gameDays' | 'wins' | 'streak' | 'allNine';
  label: string;
  count: number;
  each: number;
  points: number;
}

export interface Passport {
  account: string;
  games: GameEntry[];
  /** Every UTC day with a dated action in any game, ascending. */
  days: Day[];
  streak: { current: number; best: number; today: boolean };
  points: { total: number; breakdown: PointsLine[] };
  /** Newest first, at most 30. */
  activity: Action[];
  activityError?: string;
  updatedAt: number;
}

// ── helpers ───────────────────────────────────────────────

/** NEAR account id rules (2–64 chars, lowercase parts joined by . with - or _ inside). */
export const isAccountId = (s: string) =>
  s.length >= 2 && s.length <= 64 && /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(s);

export const dayOf = (ms: number): Day => new Date(ms).toISOString().slice(0, 10);
const DAY_MS = 86_400_000;
export const addDays = (d: Day, n: number): Day => dayOf(Date.parse(`${d}T00:00:00Z`) + n * DAY_MS);
/** A contract's "UTC day number" (ms / 86 400 000) as a date. */
const dayNumber = (n: number): Day => dayOf(n * DAY_MS);
const nsToMs = (ns: string | number) => Number(BigInt(String(ns).split('.')[0]) / 1_000_000n);
const num = (v: unknown) => Number(v ?? 0) || 0;

const isServer = typeof window === 'undefined';

/** Game contract → game. Only the accounts games.ts marks as contracts, so relayers and referees don't count. */
const CONTRACTS = new Map<string, Slug>(GAMES.flatMap((g) => g.accounts.filter((a) => a[2]).map((a) => [a[0], g.slug as Slug] as const)));

/** Small in-memory cache shared by every account (park list, ...) and per account (activity). */
const memo = new Map<string, { until: number; value: Promise<unknown> }>();
function remember<T>(key: string, ttlMs: number, read: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && hit.until > Date.now()) return hit.value as Promise<T>;
  const value = read();
  memo.set(key, { until: Date.now() + ttlMs, value });
  value.catch(() => memo.delete(key));
  if (memo.size > 500) for (const [k, v] of memo) if (v.until < Date.now()) memo.delete(k);
  return value;
}

// ── NearBlocks: when the account touched a game ─────────────

const NB = 'https://api-testnet.nearblocks.io/v3/accounts/';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** NearBlocks' free tier allows only a few calls a minute, so calls go out one at a time, spaced. */
let queue: Promise<unknown> = Promise.resolve();
function paced<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(() => sleep(400), () => sleep(400));
  return run;
}

function nearblocks(path: string, key?: string): Promise<{ data: any[]; meta?: { next_page?: string } }> {
  return paced(async () => {
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(NB + path, { headers: key ? { authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(12_000) });
      if (r.status === 429 && attempt < 1) {
        await sleep(Math.min(6000, (Number(r.headers.get('retry-after')) || 3) * 1000));
        continue;
      }
      if (!r.ok) throw new Error(r.status === 429 ? 'NearBlocks is rate-limiting right now' : `NearBlocks answered HTTP ${r.status}`);
      const b = await r.json();
      if (b.errors?.length) throw new Error(`NearBlocks: ${b.errors[0].message}`);
      return { data: b.data ?? [], meta: b.meta };
    }
  });
}

/** Receipts pages to walk (100 each): enough for a busy week of play, few requests. */
const RECEIPT_PAGES = 3;

/** Receipts the account sent to a game contract (directly, or as the inner sender of a relayed meta-transaction). */
async function readReceipts(account: string, key?: string): Promise<Action[]> {
  const out: Action[] = [];
  let next: string | undefined;
  for (let page = 0; page < RECEIPT_PAGES; page++) {
    const res = await nearblocks(`${account}/receipts?limit=100${next ? `&next=${encodeURIComponent(next)}` : ''}`, key);
    for (const r of res.data) {
      const game = CONTRACTS.get(r.receiver_account_id);
      if (!game || r.predecessor_account_id !== account || r.outcome?.status === false) continue;
      const call = (r.actions ?? []).find((a: any) => a.action === 'FUNCTION_CALL');
      out.push({ at: nsToMs(r.block?.block_timestamp ?? r.included_in_block_timestamp), game, what: call?.method ?? 'transaction', tx: r.transaction_hash, source: 'receipt' });
    }
    next = res.meta?.next_page;
    if (!next || res.data.length < 100) break;
  }
  return out;
}

/** Game tokens that reached the account: PEARL for a settled sandbar, a chef, Warden or munition NFT... */
async function readTokens(account: string, key?: string): Promise<Action[]> {
  const out: Action[] = [];
  for (const source of ['ft', 'nft'] as const) {
    const { data } = await nearblocks(`${account}/${source}-txns?limit=100`, key);
    for (const e of data) {
      const game = CONTRACTS.get(e.contract_account_id);
      if (!game || e.affected_account_id !== account || num(e.delta_amount) <= 0) continue;
      const sym = source === 'ft' ? e.meta?.symbol ?? 'tokens' : `${e.meta?.symbol ?? ''} NFT`.trim();
      const verb = e.cause === 'MINT' ? 'minted' : 'received';
      out.push({ at: nsToMs(e.block_timestamp ?? e.block?.block_timestamp), game, what: `${verb} ${source === 'ft' ? `${e.delta_amount} ` : ''}${sym}`, tx: e.transaction_hash, source });
    }
  }
  return out;
}

/** Last good answer per account and kind, served when NearBlocks says no. */
const lastGood = new Map<string, Action[]>();
async function withLastGood(key: string, ttl: number, read: () => Promise<Action[]>): Promise<{ actions: Action[]; error?: string }> {
  try {
    const actions = await remember(key, ttl, read);
    lastGood.set(key, actions);
    if (lastGood.size > 1000) lastGood.delete(lastGood.keys().next().value!);
    return { actions };
  } catch (e) {
    return { actions: lastGood.get(key) ?? [], error: lastGood.has(key) ? undefined : (e as Error).message };
  }
}

/** Receipts are re-read every 90 s; token events (rarer, and mostly the same days) every 10 min. */
async function readActivity(account: string, key?: string): Promise<{ actions: Action[]; error?: string }> {
  const rec = await withLastGood(`receipts|${account}`, 90_000, () => readReceipts(account, key));
  const tok = await withLastGood(`tokens|${account}`, 600_000, () => readTokens(account, key));
  const error = rec.error && tok.error ? rec.error : rec.error ? `receipts: ${rec.error}` : tok.error ? `token mints: ${tok.error}` : undefined;
  return { actions: [...rec.actions, ...tok.actions].sort((a, b) => b.at - a.at), ...(error ? { error } : {}) };
}

// ── per game: what the contract recorded for the account ──

interface Read {
  played: boolean;
  stats: Record<string, number | string>;
  wins?: number;
  /** Days the contract itself stores for the account. */
  days?: Day[];
  /** A known gap in what could be read, shown dimmed (not an error). */
  note?: string;
}

const DATES = { receipts: 'receipts you sent to the contract, relayed ones included' };

const READERS: Record<Slug, { dates: string; read: (a: string) => Promise<Read> }> = {
  sushi: {
    dates: `${DATES.receipts}; chef NFT mints; the daily-claim day stored on your chef`,
    async read(a): Promise<Read> {
      const chef: string | null = await view('sushi-sabotage.testnet', 'chef_of', { account_id: a });
      if (!chef) return { played: false, stats: {} };
      const [token, econ] = await Promise.all([
        view('sushi-sabotage.testnet', 'get_token', { token_id: chef }),
        view('sushi-sabotage.testnet', 'get_chef', { chef }).catch(() => null),
      ]);
      const c = token?.kind?.Chef;
      const s = c?.stats ?? {};
      const days = c?.last_claim_day > 0 ? [dayNumber(c.last_claim_day - 1)] : []; // stored as day + 1
      return {
        played: num(s.shifts) > 0,
        wins: num(s.wins),
        days,
        stats: { chef: c?.name ?? chef, shifts: num(s.shifts), 'best shift': num(s.shifts) ? num(s.best) : '—', 'dishes delivered': num(s.delivered), ...(econ ? { level: num(econ.level) } : {}) },
      };
    },
  },
  bazaar: {
    dates: 'the cred streak the contract keeps (days you earned XP); haggles are signed by the game server, so they leave no receipt of yours',
    async read(a): Promise<Read> {
      const [st, cred] = await Promise.all([
        view('v3.bazaar-liars.testnet', 'player_state', { player: a, good_ids: ['rug', 'saffron', 'lamp'] }),
        view('v3.bazaar-liars.testnet', 'cred_of', { player: a }),
      ]);
      const days: Day[] = [];
      if (num(cred.xp) > 0 && num(cred.last_day) > 0) for (let i = 0; i < Math.max(1, num(cred.streak)); i++) days.push(dayNumber(num(cred.last_day) - i));
      const goods = (st.goods ?? []).reduce((x: number, n: number) => x + num(n), 0);
      return { played: !!st.known, days, stats: { coins: num(st.coins), goods, 'cred XP': num(cred.xp), 'best cred streak': num(cred.best_streak) } };
    },
  },
  realm: {
    dates: `${DATES.receipts} (a wallet ruler seals its own orders), and campaign start times from the Realm Ledger server`,
    async read(a): Promise<Read> {
      // the Realm Ledger server only answers its own site cross-origin, so a browser read can't see campaigns
      if (!isServer) return { played: false, stats: {}, note: 'Campaign wins are read by the arcade server; this copy is reading from your browser, so only your receipts count here.' };
      const r = await fetch(`https://realm.lopeselio.online/api/campaigns?player=${encodeURIComponent(a)}`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`Realm Ledger server answered HTTP ${r.status}`);
      const list: { createdAt: number; phase: string; winner: number | null }[] = await r.json();
      // you always rule realm 0 in a campaign you start
      const wins = list.filter((c) => c.phase === 'over' && c.winner === 0).length;
      return {
        played: list.length > 0,
        wins,
        days: list.map((c) => dayOf(c.createdAt)),
        stats: { campaigns: list.length, finished: list.filter((c) => c.phase === 'over').length },
      };
    },
  },
  parkwright: {
    dates: `${DATES.receipts} (claiming, withdrawing), and when each of your parks was created`,
    async read(a): Promise<Read> {
      const parks = await remember('parks', 60_000, async () => {
        const all: any[] = [];
        for (let from = 0; from < 2000; from += 100) {
          const page = await view('park.parkwright.testnet', 'list_parks', { from_index: from, limit: 100 });
          all.push(...page);
          if (page.length < 100) break;
        }
        return all;
      });
      const mine = parks.filter((p) => p.owner === a);
      const bal = await view('park.parkwright.testnet', 'ft_balance_of', { account_id: a });
      return {
        played: mine.length > 0,
        days: mine.map((p) => dayOf(num(p.created_ms))).filter((d) => d > '2020'),
        stats: { parks: mine.length, 'CR earned': mine.reduce((x, p) => x + num(p.earned), 0) / 100, settlements: mine.reduce((x, p) => x + num(p.settlements), 0), 'CR balance': num(bal) / 100 },
      };
    },
  },
  fogwater: {
    dates: DATES.receipts,
    async read(a): Promise<Read> {
      const s = await view('fogwater.testnet', 'stats_of', { account_id: a });
      return { played: num(s.games) > 0, wins: num(s.wins), stats: { games: num(s.games), losses: num(s.losses), 'ships sunk': num(s.ships_sunk), 'fewest shots': num(s.best) || '—' } };
    },
  },
  emberfall: {
    dates: `${DATES.receipts}; Warden NFT and EMBER mints`,
    async read(a): Promise<Read> {
      const w: string | null = await view('emberfall.testnet', 'warden_of', { account_id: a });
      if (!w) return { played: false, stats: {} };
      const warden = await view('emberfall.testnet', 'get_warden', { warden: w });
      const r = warden?.record ?? {};
      return {
        played: num(r.matches) > 0,
        wins: num(r.wins),
        stats: { warden: warden?.name ?? w, matches: num(r.matches), kills: num(r.kills), 'embers out': num(r.embers_out), 'EMBER in purse': num(warden?.purse) },
      };
    },
  },
  'inside-job': {
    dates: DATES.receipts,
    async read(a): Promise<Read> {
      const s = await view('inside-job.testnet', 'stats_of', { account_id: a });
      return { played: num(s.games) > 0, wins: num(s.wins), stats: { shifts: num(s.games), losses: num(s.losses), 'insider caught': num(s.caught), 'as the insider': num(s.insider_games) } };
    },
  },
  kraterra: {
    dates: `${DATES.receipts}; munition-pack NFT mints`,
    async read(a): Promise<Read> {
      const [s, packs] = await Promise.all([
        view('kraterra.testnet', 'stats_of', { account_id: a }),
        view('kraterra.testnet', 'nft_supply_for_owner', { account_id: a }),
      ]);
      return { played: num(s.matches) > 0, wins: num(s.wins), stats: { duels: num(s.matches), losses: num(s.losses), 'best score': num(s.best), damage: num(s.damage), packs: num(packs) } };
    },
  },
  clawtide: {
    dates: `${DATES.receipts}; PEARL minted when your sandbar settles`,
    async read(a): Promise<Read> {
      const [r, bal] = await Promise.all([view('clawtide.testnet', 'get_record', { account_id: a }), view('clawtide.testnet', 'ft_balance_of', { account_id: a })]);
      return { played: num(r.rounds) > 0, wins: num(r.wins), stats: { rounds: num(r.rounds), 'pearls banked': num(r.pearls_banked), clams: num(r.clams), 'raids won': num(r.raids_won), PEARL: num(bal) } };
    },
  },
};

// ── streak and points ─────────────────────────────────────

export function streakOf(days: Iterable<Day>, today: Day = dayOf(Date.now())) {
  const set = new Set(days);
  let best = 0;
  let run = 0;
  let prev: Day | null = null;
  for (const d of [...set].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  // like Duolingo: a streak is still alive today if you played yesterday
  let cur = 0;
  let d = set.has(today) ? today : addDays(today, -1);
  while (set.has(d)) { cur++; d = addDays(d, -1); }
  return { current: cur, best, today: set.has(today) };
}

export const POINTS = { gameDay: 10, win: 25, streakDay: 5, allNine: 100 } as const;

export function pointsOf(games: GameEntry[], streak: number) {
  // a game with a record but no dated action still counts once
  const gameDays = games.reduce((x, g) => x + Math.max(g.days.length, g.played ? 1 : 0), 0);
  const wins = games.reduce((x, g) => x + (g.wins ?? 0), 0);
  const all = games.length > 0 && games.every((g) => g.played) ? 1 : 0;
  const breakdown: PointsLine[] = [
    { key: 'gameDays', label: 'game-days played', count: gameDays, each: POINTS.gameDay, points: gameDays * POINTS.gameDay },
    { key: 'wins', label: 'wins recorded onchain', count: wins, each: POINTS.win, points: wins * POINTS.win },
    { key: 'streak', label: 'days in your current streak', count: streak, each: POINTS.streakDay, points: streak * POINTS.streakDay },
    { key: 'allNine', label: 'played all nine games', count: all, each: POINTS.allNine, points: all * POINTS.allNine },
  ];
  return { total: breakdown.reduce((x, l) => x + l.points, 0), breakdown };
}

// ── the whole passport ────────────────────────────────────

export async function buildPassport(account: string, opts: { nearblocksKey?: string; now?: number } = {}): Promise<Passport> {
  if (!isAccountId(account)) throw new Error('not a NEAR account id');
  const now = opts.now ?? Date.now();
  const [act, ...reads] = await Promise.all([
    readActivity(account, opts.nearblocksKey),
    ...GAMES.map((g) => READERS[g.slug as Slug].read(account).then((value) => ({ status: 'fulfilled' as const, value }), (reason) => ({ status: 'rejected' as const, reason }))),
  ]);
  const activity = act.actions;
  const games: GameEntry[] = GAMES.map((g, i) => {
    const slug = g.slug as Slug;
    const res = reads[i] as PromiseSettledResult<Read>;
    const read = res.status === 'fulfilled' ? res.value : null;
    const mine = activity.filter((x) => x.game === slug);
    const days = [...new Set([...(read?.days ?? []), ...mine.map((x) => dayOf(x.at))])].filter((d) => d <= dayOf(now)).sort();
    return {
      id: slug,
      name: g.title,
      url: g.url,
      glow: g.glow,
      played: !!read?.played || days.length > 0,
      lastPlayed: days.at(-1) ?? null,
      days,
      stats: read?.stats ?? {},
      ...(read?.wins !== undefined ? { wins: read.wins } : {}),
      dates: READERS[slug].dates,
      ...(read?.note ? { note: read.note } : {}),
      ...(res.status === 'rejected' ? { error: String((res.reason as Error)?.message ?? res.reason).slice(0, 160) } : {}),
    };
  });
  const days = [...new Set(games.flatMap((g) => g.days))].sort();
  const streak = streakOf(days, dayOf(now));
  return {
    account,
    games,
    days,
    streak,
    points: pointsOf(games, streak.current),
    activity: activity.slice(0, 30),
    ...(act.error ? { activityError: act.error.slice(0, 160) } : {}),
    updatedAt: now,
  };
}
