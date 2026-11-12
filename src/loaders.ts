// Per-game high scores and stats, all from contract views. One loader per slug in games.ts.
import { fmt, view, who } from './chain';
import type { Slug } from './games';

/** One ticker line: a highlighted number, then the words after it. Built only from numbers, never from names read off the chain. */
export interface TickerLine {
  b: string;
  text: string;
}

export interface Panel {
  /** Heading of the high-score board. */
  title: string;
  /** [name, score] */
  rows: [string, string][];
  /** Shown when there are no rows. */
  empty?: string;
  /** A small line under the board, e.g. that test accounts are hidden. */
  note?: string;
  /** [number, label], three of them. */
  stats: [string, string][];
  ticker: TickerLine[];
}

const t = (b: string, text: string): TickerLine => ({ b, text });

/**
 * Our own test players: end-to-end runs ("E2E Chef", e2e-mwagm9c7.kraterra.testnet, buyer.e2e-….testnet),
 * claim tests (claimtest-….parkwright.testnet) and faucet-made test accounts. Matches a name or an account id.
 */
export const isTestAccount = (s: string | null | undefined) => !!s && (/(^|[^a-z0-9])e2e([^a-z0-9]|$)/i.test(s) || /^(claimtest|test|faucet)[-.]/i.test(s));

/** Drops test players from a board; the note says how many, so counts that change stay honest. */
function real<T>(rows: T[], ...keys: ((r: T) => string | null | undefined)[]): { rows: T[]; hidden: number; note?: string } {
  const kept = rows.filter((r) => !keys.some((k) => isTestAccount(k(r))));
  const hidden = rows.length - kept.length;
  return { rows: kept, hidden, note: hidden ? `${hidden} test account${hidden === 1 ? '' : 's'} hidden` : undefined };
}

export const LOADERS: Record<Slug, () => Promise<Panel>> = {
  async sushi() {
    const [rows, season, chefs] = await Promise.all([
      view('sushi-sabotage.testnet', 'leaderboard', { limit: 50 }),
      view('sushi-sabotage.testnet', 'get_season'),
      view('sushi-sabotage.testnet', 'nft_total_supply'),
    ]);
    const board = real<any>(rows, (r) => r.name, (r) => r.owner ?? r.account);
    return {
      title: 'Best shifts',
      rows: board.rows.slice(0, 5).map((r: any) => [r.name, fmt(r.best)]),
      note: board.note,
      stats: [[fmt(season), 'season'], [fmt(chefs), 'chef NFTs minted'], [fmt(board.rows.length), 'chefs ranked']],
      ticker: [t(fmt(chefs), 'chef NFTs minted in Sushi Sabotage')],
    };
  },

  async bazaar() {
    const [rows, s, deeds] = await Promise.all([
      view('v3.bazaar-liars.testnet', 'leaderboard'),
      view('v3.bazaar-liars.testnet', 'stats'),
      view('v3.bazaar-liars.testnet', 'nft_total_supply'),
    ]);
    const board = real<any>(rows, (r) => r.player);
    return {
      title: 'Peak purse',
      rows: board.rows.slice(0, 5).map((r: any) => [who(r.player), fmt(r.peak)]),
      note: board.note,
      stats: [[fmt(s.haggles), 'haggles sealed onchain'], [fmt(s.deals), 'deals closed'], [fmt(s.deliveries), 'deliveries']],
      ticker: [
        t(fmt(s.haggles), 'haggles sealed on NEAR in Bazaar of Liars'),
        t(fmt(s.burned), 'coins burned by the street'),
        t(fmt(deeds), `stall deed NFT${Number(deeds) === 1 ? '' : 's'}`),
      ],
    };
  },

  async realm() {
    // No count view: find the newest campaign id by doubling, then binary search.
    const has = async (n: number) => !!(await view('realm-ledger.testnet', 'get_campaign', { campaign: n }));
    // Ids start at 0; `lo` ends as the newest id (or -1 with no campaigns at all).
    let lo = -1;
    let hi = 1;
    if (await has(0)) {
      lo = 0;
      while (hi < 1e6 && (await has(hi))) { lo = hi; hi *= 2; }
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (await has(mid)) lo = mid; else hi = mid; }
    }
    const count = lo + 1;
    const ids = Array.from({ length: Math.min(24, count) }, (_, i) => lo - i);
    const camps = (await Promise.all(ids.map((n) => view('realm-ledger.testnet', 'get_campaign', { campaign: n }).catch(() => null)))).filter(Boolean);
    const done = camps.filter((c) => c.phase === 'Finished' && c.winner != null);
    const wins = new Map<string, number>();
    for (const c of done) {
      const ruler: string = c.realms[c.winner]?.ruler ?? '';
      const seat = ruler.match(/^ruler(\d)\./);
      const name = ruler.startsWith('player.') ? 'Human players' : seat ? `AI ruler ${seat[1]}` : who(ruler);
      wins.set(name, (wins.get(name) ?? 0) + 1);
    }
    const rows = [...wins].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, w]): [string, string] => [n, `${w} win${w === 1 ? '' : 's'}`]);
    return {
      title: `Wins in the last ${camps.length} campaigns`,
      rows,
      empty: 'No campaign has finished recently.',
      stats: [[fmt(count), 'campaigns on the ledger'], [fmt(done.length), 'finished recently'], [fmt(camps.reduce((a, c) => a + c.season, 0)), 'seasons sealed']],
      ticker: [t(fmt(count), 'campaigns on the Realm Ledger')],
    };
  },

  async parkwright() {
    const parks: any[] = [];
    for (let from = 0; from < 2000; from += 100) {
      const page = await view('park.parkwright.testnet', 'list_parks', { from_index: from, limit: 100 });
      parks.push(...page);
      if (page.length < 100) break;
    }
    const audit = await view('park.parkwright.testnet', 'audit');
    // claim tests and end-to-end parks are ours, not players'
    const testParks = parks.filter((p) => isTestAccount(p.owner) || isTestAccount(p.name)).length;
    const claimed = parks.filter((p) => p.owner !== 'parkwright.testnet' && !isTestAccount(p.owner) && !isTestAccount(p.name));
    const settled = parks.reduce((a, p) => a + Number(p.earned), 0) / 100;
    const rows = claimed
      .filter((p) => Number(p.earned) > 0)
      .sort((a, b) => Number(b.earned) - Number(a.earned))
      .slice(0, 5)
      .map((p): [string, string] => [p.name, `${fmt(Number(p.earned) / 100)} CR`]);
    return {
      title: 'Top claimed parks',
      rows,
      empty: 'No claimed park has earned yet. Publish yours, then press Claim on NEAR in the Parks panel.',
      note: testParks ? `${testParks} test park${testParks === 1 ? '' : 's'} not counted as claimed` : undefined,
      stats: [[fmt(parks.length), 'parks on chain'], [fmt(claimed.length), 'claimed by players'], [fmt(settled), 'CR paid by visitors']],
      ticker: [t(fmt(settled), 'CR paid into parks by visitor agents in Parkwright'), t(fmt(Number(audit.total_supply) / 100), 'CR in circulation')],
    };
  },

  async fogwater() {
    const all: [string, any][] = await view('fogwater.testnet', 'leaderboard', { limit: 50 });
    const board = real(all, ([id]) => id);
    const rows = board.rows.slice(0, 5);
    const games = rows.reduce((a, [, s]) => a + s.games, 0);
    const sunk = rows.reduce((a, [, s]) => a + s.ships_sunk, 0);
    return {
      title: 'Admirals’ ledger',
      rows: rows.map(([id, s]) => [who(id), `${s.wins}W ${s.losses}L`]),
      empty: 'No ranked wins yet. Sign in and sink a fleet to be first.',
      note: board.note,
      stats: [[fmt(board.rows.length), 'ranked captains'], [fmt(games), 'ranked games'], [fmt(sunk), 'ships sunk']],
      ticker: rows.length ? [t(fmt(sunk), 'ships sunk in Fogwater')] : [],
    };
  },

  async emberfall() {
    const [all, sup] = await Promise.all([view('emberfall.testnet', 'leaderboard', { limit: 50 }), view('emberfall.testnet', 'ember_supply', {})]);
    const board = real<any>(all, (r) => r.name, (r) => r.owner ?? r.account);
    return {
      title: 'Wardens’ ledger',
      rows: board.rows.slice(0, 5).map((r: any) => [r.name, `${r.wins}W · ${fmt(r.embers_out)} out`]),
      note: board.note,
      empty: 'No settled match yet. Carry an ember out of the dark to be first.',
      stats: [[fmt(Number(sup.total_supply)), 'EMBER in existence'], [fmt(Number(sup.burned)), 'lost to the dark'], [fmt(sup.matches_settled), 'matches settled']],
      ticker: [t(fmt(Number(sup.burned)), 'EMBER burned for fallen Wardens in Emberfall')],
    };
  },

  async 'inside-job'() {
    const [info, props, rows] = await Promise.all([
      view('inside-job.testnet', 'info', {}),
      view('dao.inside-job.testnet', 'get_last_proposal_id', {}),
      view('inside-job.testnet', 'leaderboard', { limit: 50 }),
    ]);
    const board = real<[string, any]>(rows, ([id]) => id);
    return {
      title: 'Ranked councillors',
      note: board.note,
      rows: board.rows.slice(0, 5).map(([id, s]: [string, any]) => [who(id), `${s.wins}W ${s.losses}L · ${s.caught} caught`]),
      empty: 'No ranked shifts yet. Sign in with NEAR and catch the Insider to be first.',
      stats: [[fmt(info.played), 'night shifts'], [fmt(props), 'DAO proposals voted'], ['3 of 5', 'votes to pass a spend']],
      ticker: [t(fmt(props), 'treasury proposals voted on the Inside Job DAO')],
    };
  },

  async kraterra() {
    const [all, cfg, packs] = await Promise.all([
      view('kraterra.testnet', 'leaderboard', { limit: 50 }),
      view('kraterra.testnet', 'get_config', {}),
      view('kraterra.testnet', 'nft_total_supply', {}),
    ]);
    const board = real<[string, any]>(all, ([id]) => id);
    const rows = board.rows.slice(0, 5);
    const dmg = rows.reduce((a: number, [, s]: [string, any]) => a + Number(s.damage), 0);
    return {
      title: 'Gunners’ ledger',
      rows: rows.map(([id, s]: [string, any]) => [id === 'basalt.kraterra.testnet' ? 'Basalt (AI)' : who(id), `${s.wins}W ${s.losses}L · best ${s.best}`]),
      empty: 'No duels settled yet. Fire the first shot.',
      note: board.note,
      stats: [[fmt(cfg[2]), 'duels on the chain'], [fmt(packs), 'munition pack NFTs'], [fmt(dmg), 'damage by the top gunners']],
      ticker: [t(fmt(cfg[2]), 'artillery duels recorded in Kraterra')],
    };
  },

  async clawtide() {
    const [all, season, crown] = await Promise.all([
      view('clawtide.testnet', 'leaderboard', { limit: 50 }),
      view('clawtide.testnet', 'season_info', {}),
      view('clawtide.testnet', 'get_crown', {}),
    ]);
    const board = real<any>(all, (r) => r.account, (r) => r.name);
    const rows = board.rows.slice(0, 5);
    const ai = (id: string) => /^[a-z]+\.clawtide\.testnet$/.test(id);
    return {
      title: `Season ${season.season} pearl hoards`,
      rows: rows.map((r: any) => [`${crown && crown.account === r.account ? '👑 ' : ''}${ai(r.account) ? `${r.name} (AI)` : who(r.account)}`, `${fmt(r.pearls)} PEARL`]),
      empty: 'No pearls banked yet. Dig the first sandbar.',
      note: board.note,
      stats: [[fmt(season.rounds_settled), 'sandbars settled onchain'], [fmt(season.raids), 'rockpool raids'], [fmt(season.supply), 'PEARL in existence']],
      ticker: [t(fmt(season.supply), 'PEARL dug up in Clawtide')],
    };
  },
};
