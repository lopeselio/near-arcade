// Every cabinet on the floor. Adding a game = one entry here plus its loader in loaders.ts
// (the type of LOADERS makes a missing loader a compile error).
import type { TrackId } from './tracks';

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
  /** Hackathon tracks this game proves, each with a one-line note on where to look (shown when that track chip is on). */
  tracks: Partial<Record<TrackId, string>>;
}

export const GAMES = [
  { title: 'Sushi Sabotage', slug: 'sushi', glow: '#ff6a3c', badge: '1–4 players', thumb: '/thumbs/sushi.webp',
    url: 'https://sushi.lopeselio.online/', repo: 'https://github.com/lopeselio/sushi-sabotage',
    blurb: 'A three-minute sushi kitchen race. Wreck rivals’ dishes in secret; the sabotage log is sealed onchain and opened when the shift ends.',
    accounts: [['sushi-sabotage.testnet', 'Game contract', true], ['sushi-sabotage-ref.testnet', 'Referee'], ['sushi-sabotage-relay.testnet', 'Relay']],
    tracks: {
      games: 'A 3-minute kitchen race against four AI chefs; guests play with no wallet, gasless NEP-366 mints when you sign in.',
      privacy: 'Every sabotage is sealed onchain as a hash during the shift (seal) and opened and checked at settle_match.',
      agents: 'Six agent accounts: AI chefs pay entry fees, buy cards from the Fixer (accept_offer) and reports from the Scout (buy_scout).',
      nfts: 'Chef NFTs carry their own purse and gear; recipe scrolls earn 2 ryo royalty per dish delivered; cards are NEP-245.',
      security: 'Agents hold one function-call key on the contract (0.5 NEAR gas); register_agent caps spend per day and per match.',
      swarms: 'Partial: a small market of 4 AI chefs buying cards and scouting reports from 2 seller agents.',
      thesis: 'Feeds /thesis: 6 agent accounts, NFT supply and NEAR paid into the treasury.',
    },
  },
  { title: 'Bazaar of Liars', slug: 'bazaar', glow: '#ffc53d', light: true, badge: 'solo, in a walkable New York', thumb: '/thumbs/bazaar.webp',
    url: 'https://bazaar.lopeselio.online/', repo: 'https://github.com/lopeselio/bazaar-of-liars',
    blurb: 'Haggle with AI merchants who bluff. Read their tells, call their lies, buy low and sell high; the chain proves every bluff was fair.',
    accounts: [['v3.bazaar-liars.testnet', 'Game contract', true], ['bazaar-server.testnet', 'Game server'], ['bazaar-intents.testnet', 'NEAR Intents verifier', true], ['bazaar-funds-1108.testnet', 'Pays the agents’ gas']],
    tracks: {
      games: 'Haggle with bluffing AI merchants in a walkable city; guests get 200 coins and never see a wallet.',
      privacy: 'Each merchant’s floor price is committed (open_haggle) and revealed (close_haggle); TEE quotes and signatures checked by pnpm verify.',
      agents: '13 agent sub-accounts with their own purses: they authorize spends, pay each other (pay_agent) and post paid orders.',
      nfts: 'Stall deeds (NEP-171) hold stock and a till, trade on a deed market, and get an ETH-signed certificate via Chain Signatures.',
      security: 'Agent keys allow only authorize_spend / pay_agent (/ post_order); charge_cap enforces each agent’s daily cap; watchdog issues.',
      swarms: 'Merchants, traders, customers and a runner bid in sealed-bid cargo auctions, hire each other and barter via Intents.',
      defi: 'Agents barter NEP-245 goods with signed token_diff intents on our own testnet deploy of the Intents verifier.',
      thesis: 'Feeds /thesis: 13 agent accounts, haggles sealed and revealed, coins burned, deed NFTs.',
    },
  },
  { title: 'Realm Ledger', slug: 'realm', glow: '#7c8cff', badge: 'turn-based conquest', thumb: '/thumbs/realm.webp',
    url: 'https://realm.lopeselio.online/', repo: 'https://github.com/lopeselio/realm-ledger',
    blurb: 'Conquest on a living war table. Rival realms are ruled by AI agents with wallets; every season all rulers seal their orders at once.',
    accounts: [['realm-ledger.testnet', 'Game contract', true], ['realm-ledger-ops.testnet', 'Referee']],
    tracks: {
      games: 'Turn-based conquest against AI rulers on a war table; every season all orders are sealed at once.',
      privacy: 'Orders sealed (seal) then revealed (reveal) per season; envoy lines’ NEAR AI signer recovered and matched to the attestation.',
      agents: '14 agent sub-accounts: rulers hire mercenaries and spies (hire, escrowed), workers deliver and get paid (settle_job).',
      security: 'set_policy gives each spender a season and campaign cap that hire enforces; agent keys are function-call only.',
      swarms: 'Eight AI rulers plus mercenary and spy companies: treaties, tribute and an escrowed hiring market between agents.',
      thesis: 'Feeds /thesis: 14 agent accounts and campaigns on the ledger.',
    },
  },
  { title: 'Parkwright', slug: 'parkwright', glow: '#3ee0b0', light: true, badge: 'theme-park builder', thumb: '/thumbs/parkwright.webp',
    url: 'https://parkwright.lopeselio.online/', repo: 'https://github.com/lopeselio/parkwright',
    blurb: 'Lay paths, raise rides and coasters, keep the crowds happy. Visitors are paid for by agents with their own NEAR wallets; claim your park and withdraw what it earns.',
    accounts: [['park.parkwright.testnet', 'Game contract', true], ['parkwright.testnet', 'Server and admin'], ['g0.parkwright.testnet', 'Visitor-group agent']],
    tracks: {
      games: 'A theme-park builder; visitors are paid for by agent wallets and your park’s earnings settle onchain.',
      privacy: 'Partial: the AI park manager’s replies are TEE-signed on NEAR AI Cloud and the signer is checked against the attestation.',
      agents: 'Eight patron agents (g0–g7) sign settle_day themselves, paying CR (NEP-141) into the parks their visitors rode.',
      security: 'Patron keys can call only settle_day; caps per patron per park-day, per park-day and per 24 h mint epoch.',
      thesis: 'Feeds /thesis: 8 patron accounts, parks and settlements, CR supply.',
      open: 'An in-game AI modding terminal and an MCP bridge that lets Claude Code play your park.',
    },
  },
  { title: 'Fogwater', slug: 'fogwater', glow: '#5aa8ff', badge: '1v1 against an AI or a friend', thumb: '/thumbs/fogwater.webp',
    url: 'https://fogwater.lopeselio.online/', repo: 'https://github.com/lopeselio/fogwater',
    blurb: 'A night sea battle in voxels. Your fleet is sealed onchain as a Merkle root; every hit or miss is proven against it until the last ship sinks.',
    accounts: [['fogwater.testnet', 'Game contract', true], ['fogwater-ref.testnet', 'Referee'], ['fogwater-relay.testnet', 'Relay']],
    tracks: {
      games: 'A 1v1 sea battle against an AI or a friend; guests play gasless, moves are relayed.',
      privacy: 'Each fleet is a Merkle root (commit_fleet); every hit or miss is proven against it, then reveal_fleet rebuilds it.',
      thesis: 'Feeds /thesis: games played on the contract.',
    },
  },
  { title: 'Emberfall', slug: 'emberfall', glow: '#ff9a3c', badge: 'torchlit arena, up to 6', thumb: '/thumbs/emberfall.webp',
    url: 'https://emberfall.lopeselio.online/', repo: 'https://github.com/lopeselio/emberfall',
    blurb: 'You see only what your torch lights while the dark closes in. Every Warden is an NFT carrying its own EMBER purse; EMBER burns for the fallen and mints only for embers carried out.',
    accounts: [['emberfall.testnet', 'Game contract', true], ['emberfall-ref.testnet', 'Referee'], ['emberfall-relay.testnet', 'Relay'], ['brannoc.emberfall.testnet', 'AI Warden']],
    tracks: {
      games: 'A torchlit arena for up to 6; guests play, signed-in players own a Warden NFT minted gaslessly.',
      privacy: 'The match seed is committed and every 3 s of play is sealed into a hash chain, opened and checked before settling.',
      agents: 'Five AI Wardens with their own accounts pay entry fees under caps, win prizes and burn EMBER (offer_to_dark).',
      nfts: 'Each Warden NFT carries its EMBER purse, loot and record; transfer the NFT and all of it goes with it.',
      security: 'AI Wardens’ keys allow only approve_fee and offer_to_dark; register_agent sets per-match and daily spend caps.',
      memecoins: 'EMBER (NEP-141): 15% of the pot burns per fallen Warden; mints only for embers carried out, capped 40/match, 2000/day.',
      thesis: 'Feeds /thesis: 5 agent accounts, EMBER minted and burned, matches settled, Warden NFTs.',
    },
  },
  { title: 'Inside Job', slug: 'inside-job', glow: '#5b8cff', badge: 'social deduction, 5 seats', thumb: '/thumbs/inside-job.webp',
    url: 'https://inside-job.lopeselio.online/', repo: 'https://github.com/lopeselio/inside-job',
    blurb: 'Five council members run a DAO treasury through the night; one is secretly draining it. Every spend is a real Sputnik DAO proposal, roles and votes are sealed onchain, and the AI council can vote but never move money.',
    accounts: [['inside-job.testnet', 'Game contract', true], ['dao.inside-job.testnet', 'Treasury (Sputnik DAO)'], ['inside-job-ref.testnet', 'Referee'], ['seat1.inside-job.testnet', 'AI council desk']],
    tracks: {
      games: 'Five-seat social deduction over a real treasury; guests take a desk, the AI council fills the rest.',
      privacy: 'Roles, votes and who filed each spend are sealed as hashes and checked when the shift settles.',
      security: 'file_spend enforces a spend policy and flags lookalike payees, new payees, bursts and big spends into an audit_log.',
      social: 'The treasury is a Sputnik DAO: only the game may propose, only the five council desks vote, more than half approves.',
      thesis: 'Feeds /thesis: 5 desk accounts, shifts played and DAO proposals.',
    },
  },
  { title: 'Kraterra', slug: 'kraterra', glow: '#ff7a45', badge: 'voxel artillery, 1v1 or vs an AI tank', thumb: '/thumbs/kraterra.webp',
    url: 'https://kraterra.lopeselio.online/', repo: 'https://github.com/lopeselio/kraterra',
    blurb: 'Turn-based tank duels that carve craters in voxel hills. NEAR’s block randomness draws the map and the weapon pool, you draft munitions (rare ones are NFTs you own), and every shot is recorded and replayed onchain.',
    accounts: [['kraterra.testnet', 'Game contract', true], ['kraterra-ref.testnet', 'Referee'], ['kraterra-relay.testnet', 'Relay'], ['basalt.kraterra.testnet', 'AI tank']],
    tracks: {
      games: 'Munition-pack NFTs you own unlock rare weapons in turn-based tank duels in destructible voxels, against a friend or the AI tank Basalt.',
      nfts: 'Partial: munition-pack NFTs carry access; only a pack’s owner can draft its rare weapon in a match.',
      thesis: 'Feeds /thesis: duels on the contract, munition NFTs, the AI tank’s scoped key.',
    },
  },
  { title: 'Clawtide', slug: 'clawtide', glow: '#2fd6c4', light: true, badge: 'minesweeper royale, up to 4 crabs', thumb: '/thumbs/clawtide.webp',
    url: 'https://clawtide.lopeselio.online/', repo: 'https://github.com/lopeselio/clawtide',
    blurb: 'Hermit crabs race across a sandbar to dig up pearls and pry open clams; every tile tells you how many urchins are buried around it. NEAR’s block randomness lays out each sandbar, every hop is sealed onchain, and you raid rivals’ rockpools for PEARL.',
    accounts: [['clawtide.testnet', 'Game contract (PEARL)', true], ['clawtide-ref.testnet', 'Referee'], ['clawtide-relay.testnet', 'Relay'], ['kelpie.clawtide.testnet', 'AI crab']],
    tracks: {
      games: 'Minesweeper royale for up to 4 crabs; boards from NEAR’s block randomness; guests play gasless.',
      privacy: 'Every hop is sealed per 3 s chunk and opened at the end; rockpool layouts are committed and revealed after a raid.',
      agents: 'Partial: five AI crabs earn PEARL from settled rounds and build rockpools with a key scoped to build_rockpool.',
      memecoins: 'PEARL (NEP-141): minted only by settled rounds (max 60 per seat), moved only by raids on rockpools; no other mint.',
      thesis: 'Feeds /thesis: 5 agent accounts, rounds settled, raids, PEARL supply.',
    },
  },
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
