# NEAR Arcade

One page that launches our NEAR HACKATHON games (Sushi Sabotage, Bazaar of Liars, Realm Ledger, Parkwright, Fogwater, Emberfall, Inside Job, Kraterra, Clawtide). Each game is its own project with its own repo, contract and server; this page only links to and embeds them.

The page reads everything live from NEAR testnet in the browser (public RPC, no keys, no server): each game's high scores and stats from its contract's views, and the balance of every game account (contracts also show how much of their balance is still free for storage). The cabinet screens are short animated captures in `public/thumbs/`. A plate under each marquee says where it plays: **Pocket + Cabinet** (phone touch controls and desktop), or **Cabinet only** / **Pocket only** for a game that needs a desktop or a phone (a game's `play` field); on the wrong kind of device that cabinet also carries a short warning.

## The problem

Onchain games usually show the chain to the player (wallet pop-ups, gas, seed phrases) while hiding the parts players would actually want proven: what an opponent's hidden move was, whether the board was rigged, whether an AI rival or the server cheated. And their in-game economies rarely do anything on their own.

These nine games flip that. Players start as guests with no wallet; the chain works underneath them. Hidden moves, secret rolls and boards are committed onchain before play and opened afterwards, so anyone can check them with a `pnpm verify` command. AI rivals hold their own NEAR accounts with capped spending, and the games' NFTs and tokens carry real balances and rules. This page puts them in one place and reads their state live from NEAR testnet.

## Try it (do X, see Y)

1. Open **https://arcade.lopeselio.online**. You see nine cabinets; each one's high scores, stats and NEAR accounts are read live from testnet in your browser.
2. Press **Insert coin** on any cabinet: the game opens in the page at its own path (e.g. `/fogwater`); **Escape** or **Back** returns to the floor. **Open in a new tab** plays it full screen (wallet sign-in works best there).
3. Every game plays as a guest with no wallet; **Sign in with NEAR** (any testnet wallet) to be ranked and to own NFTs.
4. Each game's README has its own do-X-see-Y steps and a `pnpm verify` command that re-checks a finished match against its contract without trusting our server.

## The games

| Game | Play | Code | Contract (testnet) | In one line |
|---|---|---|---|---|
| Sushi Sabotage | [sushi.lopeselio.online](https://sushi.lopeselio.online) | [repo](https://github.com/lopeselio/sushi-sabotage) | `sushi-sabotage.testnet` | Kitchen race with secret sabotage, sealed onchain and opened at the bell; AI chefs with wallets; chef NFTs that hold their purse |
| Bazaar of Liars | [bazaar.lopeselio.online](https://bazaar.lopeselio.online) | [repo](https://github.com/lopeselio/bazaar-of-liars) | `v3.bazaar-liars.testnet` | Haggle with bluffing AI merchants whose secrets are committed onchain and whose lines are TEE-signed |
| Realm Ledger | [realm.lopeselio.online](https://realm.lopeselio.online) | [repo](https://github.com/lopeselio/realm-ledger) | see repo | Conquest where AI rulers with wallets and every player seal their orders at once |
| Parkwright | [parkwright.lopeselio.online](https://parkwright.lopeselio.online) | [repo](https://github.com/lopeselio/parkwright) | `park.parkwright.testnet` | Theme-park builder; guests are agents with wallets; parks settled by replay and claimable onchain |
| Fogwater | [fogwater.lopeselio.online](https://fogwater.lopeselio.online) | [repo](https://github.com/lopeselio/fogwater) | `fogwater.testnet` | Sea battle where your fleet is a Merkle root and every hit or miss is proven against it |
| Emberfall | [emberfall.lopeselio.online](https://emberfall.lopeselio.online) | [repo](https://github.com/lopeselio/emberfall) | `emberfall.testnet` | Torchlit arena; Warden NFTs carry their own EMBER purse; EMBER burns for the fallen |
| Inside Job | [inside-job.lopeselio.online](https://inside-job.lopeselio.online) | [repo](https://github.com/lopeselio/inside-job) | `inside-job.testnet`, `dao.inside-job.testnet` | Social deduction over a real Sputnik DAO treasury; AI council members can vote but never move money |
| Kraterra | [kraterra.lopeselio.online](https://kraterra.lopeselio.online) | [repo](https://github.com/lopeselio/kraterra) | `kraterra.testnet` | Artillery duel in destructible voxels; terrain and wind from NEAR's VRF plus a committed secret |
| Clawtide | [clawtide.lopeselio.online](https://clawtide.lopeselio.online) | [repo](https://github.com/lopeselio/clawtide) | `clawtide.testnet` | Competitive crab minesweeper; boards from NEAR's VRF; PEARL earned, pooled and raided |

## Tracks: where to see each one

We list a track only where a game shows it working on testnet; the game's own README has the details and the verify command.

| Track | Where it shows | What to look at |
|---|---|---|
| **games** — Games With Real Economies | all nine | AI rivals and NPCs with their own NEAR accounts; player-owned NFTs and tokens; guests play without ever seeing the chain (gasless relayers, sign-in only when you want to own something) |
| **privacy** — Privacy & Private AI | Bazaar of Liars, Realm Ledger, Fogwater, Sushi Sabotage, Inside Job, Parkwright | Hidden information sealed onchain and opened later (merchant floors, sealed orders, fleets as Merkle roots, sabotage logs, roles and votes); AI lines from TEE models on NEAR AI Cloud, signed and kept in proof bundles |
| **agents** — Agent Economy | Bazaar of Liars, Sushi Sabotage, Realm Ledger, Parkwright, Inside Job | Agents that earn and spend from their own accounts: merchants trading and delivering, AI chefs paying entry fees and buying cards and scout reports, park guests paying for rides |
| **swarms** — AI Swarms | Bazaar of Liars, Sushi Sabotage | Many agents in one economy: merchants, customers and couriers trading, bidding in sealed auctions and bartering through NEAR Intents; an AI chef league with paced budgets |
| **nfts** — NFTs That Do Something | Sushi Sabotage, Emberfall, Bazaar of Liars, Kraterra | Chef and Warden NFTs that hold their own purse, inventory and record (transfer the NFT, the money goes with it); stall deeds traded on a deed market; munition packs |
| **memecoins** — Memecoins With Mechanics | Emberfall, Clawtide | EMBER: 15% of a match pot burns per fallen Warden and EMBER mints only for embers carried out, capped per match and per day; PEARL: minted only by settled rounds, pooled in rockpools and raided |
| **social** — Social Money | Inside Job | The match treasury is a real Sputnik DAO: only the game contract may propose spends, only the five council desks vote, 3 of 5 approve |
| **security** — AI Security & Defense | Inside Job, Sushi Sabotage, Bazaar of Liars | Agents hold only function-call keys with onchain spending caps; a spend policy and audit log flag lookalike payees and bursts; budgets paced so agents can't drain themselves |
| **defi** — Unstoppable DeFi | Bazaar of Liars | Agents barter NEP-245 goods through our own testnet deploy of the NEAR Intents verifier (token_diff intents, solver-relayed) |
| **open** — Open Innovation | Parkwright, the arcade itself | An in-game AI modding terminal and an MCP bridge that lets an AI play the park; nine independent onchain games read live by one static page |

Not claimed: thesis, business, realworld.

## Run it

A small React + TypeScript app built with Vite (Node 22+, pnpm):

```sh
pnpm install
pnpm dev        # http://localhost:5173, live data from testnet
pnpm build      # typecheck, then the static site in dist/
pnpm preview    # serves dist/ at http://localhost:8891 (try /fogwater: the game opens over the floor)
```

## Deploy

- **Vercel** (project `near-arcade`, live at https://arcade.lopeselio.online): `vercel deploy --prod --yes --scope lopeselios-projects`. `vercel.json` builds with Vite into `dist/`, sends every one-segment path (`/sushi`, `/fogwater`, …) to the app, caches the hashed files in `/assets` forever and revalidates everything else.
- **Azure Storage static website** (mirror): `./deploy.sh` builds and uploads `dist/` (hashed assets immutable, `index.html` no-cache; the 404 page is the app, so deep links work).
- `./domains.sh records|check|bind` puts the arcade and each game on its lopeselio.online subdomain.

## Layout

| File | What it holds |
| --- | --- |
| `src/games.ts` | the cabinets: title, slug (its path), glow, badge, thumbnail, URLs, blurb, accounts, `play` |
| `src/chain.ts` | NEAR testnet reads: RPC failover, contract views, account balances |
| `src/loaders.ts` | one loader per game: its high-score board, three stats and ticker lines |
| `src/hooks.ts` | runs the loaders and the balance reads |
| `src/useGameScreen.ts` | the game screen at `/<slug>`: history, Back, Escape, focus |
| `src/components/` | Sign, Ticker, Cabinet, LivePanel, CoinBox, ChangeMachine, Footer, GameScreen |
| `src/styles.css` | the whole look |

## Add a game

1. Add one entry to `GAMES` in `src/games.ts` (set `light: true` if the glow is bright, `play: 'desktop'` or `'mobile'` only if the other kind of device can't run it).
2. Add its loader to `LOADERS` in `src/loaders.ts`, keyed by the slug (the build fails until it exists).
3. Drop a short animated capture (about 480×300, it is cropped to 16:10) at `public/thumbs/<slug>.webp`.

Its path `/<slug>` works on Vercel and Azure with no config change. For a new subdomain, add the game to the lists in `domains.sh`.

## Other submission

The same author also submitted **Signalfire** ([github.com/lopeselio/signalfire](https://github.com/lopeselio/signalfire)), a separate, independent project: attention tokens whose trading fees can only fund a startup's marketing, with sealed-bid creator campaigns, a Sputnik DAO treasury and a spend policy on NEAR testnet. It shares no contract, rules or server with any game here.
