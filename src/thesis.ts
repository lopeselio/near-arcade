// The numbers behind /thesis, read from NEAR testnet with public RPC and no keys.
// Shared by the page (src/components/Thesis.tsx) and the re-runnable script (scripts/thesis-data.mjs),
// so it only imports chain.ts (with its extension, for Node) and uses no TypeScript that Node can't strip.
import { accessKeys, readAccount, view, type KeyInfo } from './chain.ts';

/** The agent accounts each game runs, from each game's setup script (the file is named in `source`). */
export const AGENT_ROSTER: { game: string; source: string; ids: string[] }[] = [
  { game: 'Sushi Sabotage', source: 'sushi-sabotage: apps/server/src/agents.ts', ids: ['kenji', 'mei', 'hana', 'tomo', 'fixer', 'scout'].map((a) => `${a}.sushi-sabotage.testnet`) },
  // Bazaar's list comes from its contract's `agents` view (see collectThesis); these are the fallback.
  { game: 'Bazaar of Liars', source: 'v3.bazaar-liars.testnet: agents view', ids: [] },
  {
    game: 'Realm Ledger',
    source: 'realm-ledger: apps/server/src/config.ts',
    ids: [...[0, 1, 2, 3, 4, 5, 6, 7].map((n) => `ruler${n}`), 'player', 'chancellor', 'merc0', 'merc1', 'spy0', 'spy1'].map((a) => `${a}.realm-ledger.testnet`),
  },
  { game: 'Parkwright', source: 'parkwright: packages/chain/src/index.ts (PATRON_GROUPS = 8)', ids: [0, 1, 2, 3, 4, 5, 6, 7].map((n) => `g${n}.parkwright.testnet`) },
  { game: 'Emberfall', source: 'emberfall: apps/server/src/agents.ts', ids: ['brannoc', 'gloam', 'wick', 'moth', 'tallow'].map((a) => `${a}.emberfall.testnet`) },
  { game: 'Inside Job', source: 'inside-job: contract desk_of (seat1–seat5)', ids: [1, 2, 3, 4, 5].map((n) => `seat${n}.inside-job.testnet`) },
  { game: 'Kraterra', source: 'kraterra: apps/server/src/ai-account.ts', ids: ['basalt.kraterra.testnet'] },
  { game: 'Clawtide', source: 'clawtide: apps/server/src/agents.ts', ids: ['pincer', 'barnacle', 'kelpie', 'coral', 'skitter'].map((a) => `${a}.clawtide.testnet`) },
];

/** Every game contract (Fogwater has no agent accounts: its AI admirals are seats, not accounts). */
export const CONTRACTS: { game: string; id: string }[] = [
  { game: 'Sushi Sabotage', id: 'sushi-sabotage.testnet' },
  { game: 'Bazaar of Liars', id: 'v3.bazaar-liars.testnet' },
  { game: 'Bazaar of Liars', id: 'bazaar-intents.testnet' },
  { game: 'Realm Ledger', id: 'realm-ledger.testnet' },
  { game: 'Parkwright', id: 'park.parkwright.testnet' },
  { game: 'Fogwater', id: 'fogwater.testnet' },
  { game: 'Emberfall', id: 'emberfall.testnet' },
  { game: 'Inside Job', id: 'inside-job.testnet' },
  { game: 'Inside Job', id: 'dao.inside-job.testnet' },
  { game: 'Kraterra', id: 'kraterra.testnet' },
  { game: 'Clawtide', id: 'clawtide.testnet' },
];

export interface AgentRow {
  game: string;
  id: string;
  exists: boolean;
  fullKeys: number;
  fcKeys: number;
  /** Contracts its function-call keys may call. */
  receivers: string[];
  methods: string[];
  /** NEAR of gas allowance left across its keys; null if any key has no limit. */
  allowance: number | null;
}

export interface ContractRow {
  game: string;
  id: string;
  balance: number;
  storageBytes: number;
}

/** What a number counts, for the charts and totals. */
export type StatKind = 'played' | 'nfts' | 'minted' | 'burned' | 'supply' | 'other';

export interface Stat {
  game: string;
  key: string;
  kind: StatKind;
  label: string;
  value: number;
  /** The contract view it came from. */
  source: string;
}

export interface ThesisData {
  at: string;
  agents: AgentRow[];
  contracts: ContractRow[];
  stats: Stat[];
  /** Reads that failed (left out of every total). */
  failed: string[];
}

/** Runs async jobs a few at a time, so public RPC rate limits don't drop reads. */
async function pool<T, R>(items: T[], n: number, job: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await job(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

const num = (x: unknown) => Number(x);

/** Realm Ledger has no count view: campaign ids run from 0, so find the newest by doubling, then binary search. */
async function realmCampaigns(): Promise<number> {
  const has = async (n: number) => !!(await view('realm-ledger.testnet', 'get_campaign', { campaign: n }));
  if (!(await has(0))) return 0;
  let lo = 0;
  let hi = 1;
  while (hi < 1e6 && (await has(hi))) { lo = hi; hi *= 2; }
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (await has(mid)) lo = mid; else hi = mid; }
  return lo + 1;
}

async function parkStats() {
  const parks: { settlements: number }[] = [];
  for (let from = 0; from < 5000; from += 100) {
    const page = await view('park.parkwright.testnet', 'list_parks', { from_index: from, limit: 100 });
    parks.push(...page);
    if (page.length < 100) break;
  }
  return { parks: parks.length, days: parks.reduce((a, p) => a + num(p.settlements), 0) };
}

type StatJob = () => Promise<Omit<Stat, 'source' | 'game'>[]>;

/** One job per game: [game, view(s) it reads, the stats it makes]. A job that fails leaves out only its own numbers. */
const STAT_JOBS: [game: string, source: string, job: StatJob][] = [
  ['Sushi Sabotage', 'sushi-sabotage.testnet nft_total_supply', async () => [
    { key: 'sushi_nfts', kind: 'nfts', label: 'chef and recipe-scroll NFTs', value: num(await view('sushi-sabotage.testnet', 'nft_total_supply')) },
  ]],
  ['Sushi Sabotage', 'sushi-sabotage.testnet get_economy', async () => [
    { key: 'sushi_treasury', kind: 'other', label: 'NEAR paid by players for energy and gear', value: Number(BigInt((await view('sushi-sabotage.testnet', 'get_economy')).treasury) / 10n ** 18n) / 1e6 },
  ]],
  ['Bazaar of Liars', 'v3.bazaar-liars.testnet stats', async () => {
    const s = await view('v3.bazaar-liars.testnet', 'stats');
    return [
      { key: 'bazaar_haggles', kind: 'played', label: 'haggles committed and revealed', value: num(s.deals) + num(s.no_deals) },
      { key: 'bazaar_unrevealed', kind: 'other', label: 'haggles never revealed', value: num(s.unrevealed) },
      { key: 'bazaar_deliveries', kind: 'other', label: 'customer orders delivered', value: num(s.deliveries) },
      { key: 'bazaar_burned', kind: 'burned', label: 'coins burned (licences, commission)', value: num(s.burned) },
    ];
  }],
  ['Bazaar of Liars', 'v3.bazaar-liars.testnet nft_total_supply', async () => [
    { key: 'bazaar_deeds', kind: 'nfts', label: 'stall deed NFTs', value: num(await view('v3.bazaar-liars.testnet', 'nft_total_supply')) },
  ]],
  ['Realm Ledger', 'realm-ledger.testnet get_campaign (probed)', async () => [
    { key: 'realm_campaigns', kind: 'played', label: 'campaigns on the ledger', value: await realmCampaigns() },
  ]],
  ['Parkwright', 'park.parkwright.testnet list_parks', async () => {
    const p = await parkStats();
    return [
      { key: 'park_days', kind: 'played', label: 'park-days settled by patron agents', value: p.days },
      { key: 'park_parks', kind: 'other', label: 'parks on chain', value: p.parks },
    ];
  }],
  ['Parkwright', 'park.parkwright.testnet audit', async () => [
    { key: 'park_cr', kind: 'supply', label: 'CR (NEP-141) in circulation', value: num((await view('park.parkwright.testnet', 'audit')).total_supply) / 100 },
  ]],
  ['Fogwater', 'fogwater.testnet get_config', async () => [
    { key: 'fog_games', kind: 'played', label: 'games created', value: num((await view('fogwater.testnet', 'get_config'))[2]) },
  ]],
  ['Emberfall', 'emberfall.testnet ember_supply', async () => {
    const s = await view('emberfall.testnet', 'ember_supply');
    return [
      { key: 'ember_matches', kind: 'played', label: 'matches settled', value: num(s.matches_settled) },
      { key: 'ember_minted', kind: 'minted', label: 'EMBER minted', value: num(s.minted) },
      { key: 'ember_burned', kind: 'burned', label: 'EMBER burned', value: num(s.burned) },
      { key: 'ember_supply', kind: 'supply', label: 'EMBER in existence', value: num(s.total_supply) },
    ];
  }],
  ['Emberfall', 'emberfall.testnet nft_total_supply', async () => [
    { key: 'ember_wardens', kind: 'nfts', label: 'Warden NFTs', value: num(await view('emberfall.testnet', 'nft_total_supply')) },
  ]],
  ['Inside Job', 'inside-job.testnet info', async () => [
    { key: 'ij_shifts', kind: 'played', label: 'shifts settled', value: num((await view('inside-job.testnet', 'info')).played) },
  ]],
  ['Inside Job', 'dao.inside-job.testnet get_last_proposal_id', async () => [
    { key: 'ij_proposals', kind: 'other', label: 'Sputnik DAO spend proposals', value: num(await view('dao.inside-job.testnet', 'get_last_proposal_id')) },
  ]],
  ['Kraterra', 'kraterra.testnet get_config', async () => [
    { key: 'krat_duels', kind: 'played', label: 'duels created', value: num((await view('kraterra.testnet', 'get_config'))[2]) },
  ]],
  ['Kraterra', 'kraterra.testnet nft_total_supply', async () => [
    { key: 'krat_packs', kind: 'nfts', label: 'munition-pack NFTs', value: num(await view('kraterra.testnet', 'nft_total_supply')) },
  ]],
  ['Clawtide', 'clawtide.testnet season_info', async () => {
    const s = await view('clawtide.testnet', 'season_info');
    return [
      { key: 'claw_rounds', kind: 'played', label: 'rounds settled this season', value: num(s.rounds_settled) },
      { key: 'claw_raids', kind: 'other', label: 'rockpool raids this season', value: num(s.raids) },
      { key: 'claw_pearl', kind: 'supply', label: 'PEARL in existence (no burn rule)', value: num(s.supply) },
    ];
  }],
];

function agentRow(game: string, id: string, keys: KeyInfo[] | null): AgentRow {
  if (!keys) return { game, id, exists: false, fullKeys: 0, fcKeys: 0, receivers: [], methods: [], allowance: null };
  const fc = keys.filter((k) => !k.full);
  return {
    game,
    id,
    exists: true,
    fullKeys: keys.length - fc.length,
    fcKeys: fc.length,
    receivers: [...new Set(fc.map((k) => k.receiver ?? ''))],
    methods: [...new Set(fc.flatMap((k) => k.methods ?? []))],
    allowance: fc.some((k) => k.allowance == null) ? null : Math.round(fc.reduce((a, k) => a + (k.allowance ?? 0), 0) * 1e6) / 1e6,
  };
}

/** Reads everything. Never throws: failed reads are listed in `failed` and left out. */
export async function collectThesis(concurrency = 2): Promise<ThesisData> {
  const failed: string[] = [];
  const roster = AGENT_ROSTER.map((r) => ({ ...r, ids: [...r.ids] }));
  try {
    const list: { account: string }[] = await view('v3.bazaar-liars.testnet', 'agents', { good_ids: [] });
    roster[1].ids = list.map((a) => a.account);
  } catch {
    failed.push('v3.bazaar-liars.testnet agents');
  }
  const wanted = roster.flatMap((r) => r.ids.map((id) => ({ game: r.game, id })));
  const agents = await pool(wanted, concurrency, async ({ game, id }) => {
    try {
      return agentRow(game, id, await accessKeys(id));
    } catch (e) {
      // An account that doesn't exist answers UNKNOWN_ACCOUNT; anything else is a failed read.
      if (/UNKNOWN_ACCOUNT|does not exist/i.test(String(e))) return agentRow(game, id, null);
      failed.push(`${id} keys`);
      return null;
    }
  });
  const contracts = await pool(CONTRACTS, concurrency, async (c) => {
    try {
      const a = await readAccount(c.id);
      return { ...c, balance: a.balance, storageBytes: a.storage };
    } catch {
      failed.push(`${c.id} account`);
      return null;
    }
  });
  const stats = await pool(STAT_JOBS, concurrency, async ([game, source, job]) => {
    try {
      return (await job()).map((s) => ({ ...s, game, source }));
    } catch {
      failed.push(source);
      return [];
    }
  });
  return {
    at: new Date().toISOString(),
    agents: agents.filter((a): a is AgentRow => !!a),
    contracts: contracts.filter((c): c is ContractRow => !!c),
    stats: stats.flat(),
    failed,
  };
}

/**
 * Live data with any failed read filled from an earlier snapshot (data/thesis.json), so the page is never blank.
 * `filled` names what came from the snapshot; the page marks those numbers.
 */
export function fillGaps(live: ThesisData, snap: ThesisData): ThesisData & { filled: string[] } {
  const filled: string[] = [];
  const stats = [...live.stats];
  for (const s of snap.stats) if (!stats.some((x) => x.key === s.key)) { stats.push(s); filled.push(s.key); }
  const agents = [...live.agents];
  for (const a of snap.agents) if (!agents.some((x) => x.id === a.id)) { agents.push(a); filled.push(a.id); }
  const contracts = [...live.contracts];
  for (const c of snap.contracts) if (!contracts.some((x) => x.id === c.id)) { contracts.push(c); filled.push(c.id); }
  return { ...live, stats, agents, contracts, filled };
}

/** Headline numbers derived from the raw rows (the page and the script both print these). */
export function summarize(d: ThesisData) {
  const live = d.agents.filter((a) => a.exists);
  const sum = (kind: StatKind) => d.stats.filter((s) => s.kind === kind).reduce((a, s) => a + s.value, 0);
  const stat = (key: string) => d.stats.find((s) => s.key === key)?.value;
  const storageBytes = d.contracts.reduce((a, c) => a + c.storageBytes, 0);
  return {
    agents: live.length,
    fcOnly: live.filter((a) => a.fullKeys === 0 && a.fcKeys > 0).length,
    withFull: live.filter((a) => a.fullKeys > 0).length,
    gamesWithAgents: new Set(live.map((a) => a.game)).size,
    receivers: new Set(live.flatMap((a) => a.receivers)).size,
    played: sum('played'),
    nfts: sum('nfts'),
    contracts: d.contracts.length,
    contractNear: d.contracts.reduce((a, c) => a + c.balance, 0),
    storageBytes,
    /** NEAR locked by storage staking: 1e-5 NEAR per byte (100 kB per NEAR). */
    storageNear: storageBytes * 1e-5,
    stat,
  };
}

const csvCell = (v: unknown) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

/** Flat CSV files: stats, agents, contracts. */
export function toCsv(d: ThesisData) {
  return {
    stats: csv([['game', 'key', 'kind', 'label', 'value', 'source', 'read_at'], ...d.stats.map((s) => [s.game, s.key, s.kind, s.label, s.value, s.source, d.at])]),
    agents: csv([
      ['game', 'account', 'exists', 'full_access_keys', 'function_call_keys', 'receivers', 'methods', 'allowance_near_left'],
      ...d.agents.map((a) => [a.game, a.id, a.exists, a.fullKeys, a.fcKeys, a.receivers.join(' '), a.methods.join(' '), a.allowance ?? 'unlimited']),
    ]),
    contracts: csv([['game', 'contract', 'balance_near', 'storage_bytes'], ...d.contracts.map((c) => [c.game, c.id, c.balance, c.storageBytes])]),
  };
}
