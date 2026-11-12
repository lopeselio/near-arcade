// The NEAR HACKATHON tracks this submission lists. Which game proves each one, and how, is the `tracks` field
// of that game in games.ts; the full evidence (contracts, methods, commands) is in TRACKS.md.

export const TRACKS = [
  { id: 'games', label: 'Games', claim: 'Real game loops; AI rivals with their own accounts; guests never see the chain.' },
  { id: 'privacy', label: 'Privacy', claim: 'Hidden moves sealed onchain as hashes and opened later; AI lines signed in a TEE on NEAR AI Cloud.' },
  { id: 'agents', label: 'Agents', claim: 'AI agents with their own NEAR accounts that pay, earn, bid, hire and vote.' },
  { id: 'nfts', label: 'NFTs', claim: 'NFTs that hold a purse, inventory or a record that travels with them.' },
  { id: 'security', label: 'Security', claim: 'Agent accounts hold only function-call keys scoped to one contract; spend caps and policies enforced onchain.' },
  { id: 'swarms', label: 'Swarms', claim: 'Many agents in one market: sealed-bid auctions, hiring, treaties and barter between agent accounts.' },
  { id: 'memecoins', label: 'Memecoins', claim: 'Tokens whose supply follows game rules: burned for the fallen, minted only by settled play.' },
  { id: 'social', label: 'Social', claim: 'A real Sputnik DAO treasury that the table runs together.' },
  { id: 'defi', label: 'DeFi', claim: 'Agents barter through NEAR Intents (token_diff) on our own testnet deploy of the verifier.' },
  { id: 'thesis', label: 'Thesis', claim: 'Live testnet numbers on why agent-run game economies are demand for NEAR.' },
  { id: 'open', label: 'Open', claim: 'Nine independent onchain games read live by one static page; an AI that plays and mods a park.' },
] as const;

export type TrackId = (typeof TRACKS)[number]['id'];

/** Where the evidence for a track is written up. */
export const trackDoc = (id: TrackId) => `https://github.com/lopeselio/near-arcade/blob/main/TRACKS.md#${id}`;
