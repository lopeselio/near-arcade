// Every cabinet on the floor. Adding a game = one entry here plus its loader in loaders.ts
// (the type of LOADERS makes a missing loader a compile error).

/** Where a cabinet plays. Set `play` only when the other kind of device can't run the game. */
export type Play = 'any' | 'desktop' | 'mobile';

/** [account id, role, true if it is a contract (gets the free-for-storage column)] */
export type Account = readonly [id: string, role: string, contract?: boolean];

export interface Game {
  title: string;
  /** The game's path on the arcade (/<slug>) and its key in LOADERS. */
  slug: string;
  /** Cabinet glow colour. */
  glow: string;
  /** Dark marquee text where the glow is bright. */
  light?: boolean;
  badge: string;
  thumb: string;
  url: string;
  repo: string;
  blurb: string;
  accounts: readonly Account[];
  play?: Play;
}

export const GAMES = [
  { title: 'Sushi Sabotage', slug: 'sushi', glow: '#ff6a3c', badge: '1–4 players', thumb: '/thumbs/sushi.webp',
    url: 'https://sushi.lopeselio.online/', repo: 'https://github.com/lopeselio/sushi-sabotage',
    blurb: 'A three-minute sushi kitchen race. Wreck rivals’ dishes in secret; the sabotage log is sealed onchain and opened when the shift ends.',
    accounts: [['sushi-sabotage.testnet', 'Game contract', true], ['sushi-sabotage-ref.testnet', 'Referee'], ['sushi-sabotage-relay.testnet', 'Relay']] },
  { title: 'Bazaar of Liars', slug: 'bazaar', glow: '#ffc53d', light: true, badge: 'solo, in a walkable New York', thumb: '/thumbs/bazaar.webp',
    url: 'https://bazaar.lopeselio.online/', repo: 'https://github.com/lopeselio/bazaar-of-liars',
    blurb: 'Haggle with AI merchants who bluff. Read their tells, call their lies, buy low and sell high; the chain proves every bluff was fair.',
    accounts: [['v3.bazaar-liars.testnet', 'Game contract', true], ['bazaar-server.testnet', 'Game server'], ['bazaar-intents.testnet', 'NEAR Intents verifier', true], ['bazaar-funds-1108.testnet', 'Pays the agents’ gas']] },
  { title: 'Realm Ledger', slug: 'realm', glow: '#7c8cff', badge: 'turn-based conquest', thumb: '/thumbs/realm.webp',
    url: 'https://realm.lopeselio.online/', repo: 'https://github.com/lopeselio/realm-ledger',
    blurb: 'Conquest on a living war table. Rival realms are ruled by AI agents with wallets; every season all rulers seal their orders at once.',
    accounts: [['realm-ledger.testnet', 'Game contract', true], ['realm-ledger-ops.testnet', 'Referee']] },
  { title: 'Parkwright', slug: 'parkwright', glow: '#3ee0b0', light: true, badge: 'theme-park builder', thumb: '/thumbs/parkwright.webp',
    url: 'https://parkwright.lopeselio.online/', repo: 'https://github.com/lopeselio/parkwright',
    blurb: 'Lay paths, raise rides and coasters, keep the crowds happy. Visitors are paid for by agents with their own NEAR wallets; claim your park and withdraw what it earns.',
    accounts: [['park.parkwright.testnet', 'Game contract', true], ['parkwright.testnet', 'Server and admin'], ['g0.parkwright.testnet', 'Visitor-group agent']] },
  { title: 'Fogwater', slug: 'fogwater', glow: '#5aa8ff', badge: '1v1 against an AI or a friend', thumb: '/thumbs/fogwater.webp',
    url: 'https://fogwater.lopeselio.online/', repo: 'https://github.com/lopeselio/fogwater',
    blurb: 'A night sea battle in voxels. Your fleet is sealed onchain as a Merkle root; every hit or miss is proven against it until the last ship sinks.',
    accounts: [['fogwater.testnet', 'Game contract', true], ['fogwater-ref.testnet', 'Referee'], ['fogwater-relay.testnet', 'Relay']] },
  { title: 'Emberfall', slug: 'emberfall', glow: '#ff9a3c', badge: 'torchlit arena, up to 6', thumb: '/thumbs/emberfall.webp',
    url: 'https://emberfall.lopeselio.online/', repo: 'https://github.com/lopeselio/emberfall',
    blurb: 'You see only what your torch lights while the dark closes in. Every Warden is an NFT carrying its own EMBER purse; EMBER burns for the fallen and mints only for embers carried out.',
    accounts: [['emberfall.testnet', 'Game contract', true], ['emberfall-ref.testnet', 'Referee'], ['emberfall-relay.testnet', 'Relay'], ['brannoc.emberfall.testnet', 'AI Warden']] },
  { title: 'Inside Job', slug: 'inside-job', glow: '#5b8cff', badge: 'social deduction, 5 seats', thumb: '/thumbs/inside-job.webp',
    url: 'https://inside-job.lopeselio.online/', repo: 'https://github.com/lopeselio/inside-job',
    blurb: 'Five council members run a DAO treasury through the night; one is secretly draining it. Every spend is a real Sputnik DAO proposal, roles and votes are sealed onchain, and the AI council can vote but never move money.',
    accounts: [['inside-job.testnet', 'Game contract', true], ['dao.inside-job.testnet', 'Treasury (Sputnik DAO)'], ['inside-job-ref.testnet', 'Referee'], ['seat1.inside-job.testnet', 'AI council desk']] },
  { title: 'Kraterra', slug: 'kraterra', glow: '#ff7a45', badge: 'voxel artillery, 1v1 or vs an AI tank', thumb: '/thumbs/kraterra.webp',
    url: 'https://kraterra.lopeselio.online/', repo: 'https://github.com/lopeselio/kraterra',
    blurb: 'Turn-based tank duels that carve craters in voxel hills. NEAR’s block randomness draws the map and the weapon pool, you draft munitions (rare ones are NFTs you own), and every shot is recorded and replayed onchain.',
    accounts: [['kraterra.testnet', 'Game contract', true], ['kraterra-ref.testnet', 'Referee'], ['kraterra-relay.testnet', 'Relay'], ['basalt.kraterra.testnet', 'AI tank']] },
  { title: 'Clawtide', slug: 'clawtide', glow: '#2fd6c4', light: true, badge: 'minesweeper royale, up to 4 crabs', thumb: '/thumbs/clawtide.webp',
    url: 'https://clawtide.lopeselio.online/', repo: 'https://github.com/lopeselio/clawtide',
    blurb: 'Hermit crabs race across a sandbar to dig up pearls and pry open clams; every tile tells you how many urchins are buried around it. NEAR’s block randomness lays out each sandbar, every hop is sealed onchain, and you raid rivals’ rockpools for PEARL.',
    accounts: [['clawtide.testnet', 'Game contract (PEARL)', true], ['clawtide-ref.testnet', 'Referee'], ['clawtide-relay.testnet', 'Relay'], ['kelpie.clawtide.testnet', 'AI crab']] },
] as const satisfies readonly Game[];

export type Slug = (typeof GAMES)[number]['slug'];

export const ARCADE_REPO = 'https://github.com/lopeselio/near-arcade';

export const PLATES: Record<Play, readonly [label: string, tip: string, icon: string]> = {
  any: ['Pocket + Cabinet', 'Plays on phones (touch controls) and on desktop browsers', '📱🖥'],
  desktop: ['Cabinet only', 'Desktop only: needs a keyboard, a mouse and a big screen', '🖥'],
  mobile: ['Pocket only', 'Phone only: built for touch', '📱'],
};

/** The game whose path (or legacy #hash) is in the address bar, if any. */
export function gameFromLocation(loc: Pick<Location, 'pathname' | 'hash'> = location): Game | undefined {
  const path = loc.pathname.replace(/^\/|\/$/g, '');
  return GAMES.find((g) => path === g.slug || loc.hash === `#${g.slug}`);
}
