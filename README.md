# NEAR Arcade

One page that launches our NEAR HACKATHON games (Sushi Sabotage, Bazaar of Liars, Realm Ledger, Parkwright, Fogwater, Emberfall, Inside Job, Kraterra, Clawtide). Each game is its own project with its own repo, contract and server; this page only links to and embeds them.

The page reads everything live from NEAR testnet in the browser (public RPC, no keys, no server): each game's high scores and stats from its contract's views, and the balance of every game account (contracts also show how much of their balance is still free for storage). The cabinet screens are short animated captures in `public/thumbs/`. A plate under each marquee says where it plays: **Pocket + Cabinet** (phone touch controls and desktop), or **Cabinet only** / **Pocket only** for a game that needs a desktop or a phone (a game's `play` field); on the wrong kind of device that cabinet also carries a short warning.

A row of **track chips** lights up the cabinets that prove each hackathon track, with a one-line note on where to look (`?track=privacy` links straight to it). **[/thesis](https://arcade.lopeselio.online/thesis)** is a live data page: 57 agent accounts and their key permissions, play recorded, tokens minted and burned, NFTs and contract storage, all read from the nine contracts, plus the written case for why agent-run game economies are demand for NEAR. The evidence for every track is in **[TRACKS.md](TRACKS.md)**.

## The problem

Onchain games usually show the chain to the player (wallet pop-ups, gas, seed phrases) while hiding the parts players would actually want proven: what an opponent's hidden move was, whether the board was rigged, whether an AI rival or the server cheated. And their in-game economies rarely do anything on their own.

These nine games flip that. Players start as guests with no wallet; the chain works underneath them. Hidden moves, secret rolls and boards are committed onchain before play and opened afterwards, so anyone can check them with a `pnpm verify` command. AI rivals hold their own NEAR accounts with capped spending, and the games' NFTs and tokens carry real balances and rules. This page puts them in one place and reads their state live from NEAR testnet.

## Try it (do X, see Y)

1. Open **https://arcade.lopeselio.online**. You see nine cabinets; each one's high scores, stats and NEAR accounts are read live from testnet in your browser.
2. Press **Insert coin** on any cabinet: the game opens in the page at its own path (e.g. `/fogwater`); **Escape** or **Back** returns to the floor. **Open in a new tab** plays it full screen (wallet sign-in works best there).
3. Every game plays as a guest with no wallet; **Sign in with NEAR** (any testnet wallet) to be ranked and to own NFTs.
4. Press a **track chip** under the ticker (e.g. **Privacy**): the cabinets that prove it light up, each with a note naming the contract method to look at, and the rest dim. The address bar shows `?track=privacy`; press the chip again to clear it.
5. Open **https://arcade.lopeselio.online/thesis**: the numbers first show a dimmed snapshot, then turn bright as live reads arrive (about 10–30 s on public RPC). Open **Every agent account and what its keys may do**: each one has only function-call keys.
6. Each game's README has its own do-X-see-Y steps and a verify command (`pnpm verify …` in most; Parkwright's is `/api/parks/<id>/verify`) that re-checks a finished match against its contract.

## The games

| Game | Play | Code | Contract (testnet) | In one line |
|---|---|---|---|---|
| Sushi Sabotage | [sushi.lopeselio.online](https://sushi.lopeselio.online) | [repo](https://github.com/lopeselio/sushi-sabotage) | `sushi-sabotage.testnet` | Kitchen race with secret sabotage, sealed onchain and opened at the bell; AI chefs with wallets; chef NFTs that hold their purse |
| Bazaar of Liars | [bazaar.lopeselio.online](https://bazaar.lopeselio.online) | [repo](https://github.com/lopeselio/bazaar-of-liars) | `v3.bazaar-liars.testnet` | Haggle with bluffing AI merchants whose secrets are committed onchain and whose lines are TEE-signed |
| Realm Ledger | [realm.lopeselio.online](https://realm.lopeselio.online) | [repo](https://github.com/lopeselio/realm-ledger) | `realm-ledger.testnet` | Conquest where AI rulers with wallets and every player seal their orders at once |
| Parkwright | [parkwright.lopeselio.online](https://parkwright.lopeselio.online) | [repo](https://github.com/lopeselio/parkwright) | `park.parkwright.testnet` | Theme-park builder; guests are agents with wallets; parks settled by replay and claimable onchain |
| Fogwater | [fogwater.lopeselio.online](https://fogwater.lopeselio.online) | [repo](https://github.com/lopeselio/fogwater) | `fogwater.testnet` | Sea battle where your fleet is a Merkle root and every hit or miss is proven against it |
| Emberfall | [emberfall.lopeselio.online](https://emberfall.lopeselio.online) | [repo](https://github.com/lopeselio/emberfall) | `emberfall.testnet` | Torchlit arena; Warden NFTs carry their own EMBER purse; EMBER burns for the fallen |
| Inside Job | [inside-job.lopeselio.online](https://inside-job.lopeselio.online) | [repo](https://github.com/lopeselio/inside-job) | `inside-job.testnet`, `dao.inside-job.testnet` | Social deduction over a real Sputnik DAO treasury; AI council members can vote but never move money |
| Kraterra | [kraterra.lopeselio.online](https://kraterra.lopeselio.online) | [repo](https://github.com/lopeselio/kraterra) | `kraterra.testnet` | Artillery duel in destructible voxels; terrain and wind from NEAR's VRF plus a committed secret |
| Clawtide | [clawtide.lopeselio.online](https://clawtide.lopeselio.online) | [repo](https://github.com/lopeselio/clawtide) | `clawtide.testnet` | Competitive crab minesweeper; boards from NEAR's VRF; PEARL earned, pooled and raided |

## Tracks: where to see each one

We list a track only where a game shows it working on testnet. **[TRACKS.md](TRACKS.md)** has the evidence for each: contract methods, standards, transactions you can open, commands you can run, and an honest strength note. On the site, the chips do the same job (`/?track=<id>`).

| Track | Where it shows | What to look at | Strength |
|---|---|---|---|
| **games**: Games With Real Economies | all nine | Full game loops. AI rivals and NPCs have their own NEAR accounts; players own NFTs and tokens; guests play without seeing the chain (gasless relayers, NEAR sign-in only to own something) | strong (Fogwater and Kraterra have no token) |
| **privacy**: Privacy & Private AI | Bazaar of Liars, Fogwater, Realm Ledger, Sushi Sabotage, Emberfall, Inside Job, Clawtide (+ Parkwright for AI) | Hidden information is committed onchain and opened later: merchant floors, Merkle-root fleets, sealed orders, sabotage logs, sealed play, roles and votes, sealed hops. AI lines are TEE-signed on NEAR AI Cloud | strong for sealed moves; TEE signatures fully checked only in Bazaar |
| **agents**: Agent Economy | Bazaar of Liars, Realm Ledger, Sushi Sabotage, Parkwright, Emberfall, Clawtide | 57 agent sub-accounts that pay, earn, hire and bid: merchants authorizing spends and paying each other, rulers hiring into escrow, AI chefs buying cards and reports, patrons paying parks | strong |
| **nfts**: NFTs That Do Something | Sushi Sabotage, Emberfall, Bazaar of Liars, Kraterra | Chef and Warden NFTs hold their own purse, inventory and record (transfer the NFT, the money goes with it). Recipe scrolls earn royalties. Stall deeds hold stock and a till and get an ETH-signed certificate via Chain Signatures. Munition packs gate weapons | strong (Kraterra partial) |
| **security**: AI Security & Defense | Inside Job, Bazaar of Liars, Sushi Sabotage, Realm Ledger, Emberfall, Parkwright | Every agent holds only function-call keys scoped to one contract, with onchain spend caps. Inside Job adds a spend policy and audit log that flag lookalike payees, new payees and bursts | strong |
| **swarms**: AI Swarms | Bazaar of Liars, Realm Ledger, Sushi Sabotage | Many agents in one market: sealed-bid cargo auctions, paid orders, hiring, treaties, barter through NEAR Intents | partial (Bazaar is the real one) |
| **memecoins**: Memecoins With Mechanics | Emberfall, Clawtide | EMBER: 15% of a pot burns per fallen Warden, and it mints only for embers carried out (40/match, 2 000/day). PEARL: minted only by settled rounds, moved by raids | partial |
| **social**: Social Money | Inside Job | The match treasury is a real Sputnik DAO: only the game contract may propose spends, only the five council desks vote, more than half approves | partial (one game) |
| **defi**: Unstoppable DeFi | Bazaar of Liars | Agents barter NEP-245 goods with signed `token_diff` intents through our own testnet deploy of the NEAR Intents verifier | partial (no official Intents testnet) |
| **thesis**: Thesis | [/thesis](https://arcade.lopeselio.online/thesis) | A live data page and a written case that AI agents running game economies are long-term demand for NEAR; `node scripts/thesis-data.mjs` re-runs every number | partial (testnet scale) |
| **open**: Open Innovation | Parkwright, the arcade itself | An in-game AI modding terminal and an MCP bridge that lets an AI play the park; nine independent onchain games read live by one static page | strong |

Not claimed: business, realworld (see [Signalfire](#other-submission)).

## Judge it in 10 minutes

1. **(1 min) The floor.** Open https://arcade.lopeselio.online. Nine cabinets, each showing high scores and three stats read from its contract in your browser. The **Change machine** at the bottom lists every game account with its live balance.
2. **(2 min) Play one as a guest.** Press **Insert coin** on **Bazaar of Liars** and haggle with a merchant, or on **Emberfall** and survive one match. You never see a wallet; the moves are sealed onchain underneath.
3. **(1 min) Tracks.** Press each chip. For example, **Security** lights six cabinets; each note names the method that enforces the rule (`file_spend`, `register_agent`, `set_policy`, `charge_cap`).
4. **(3 min) Thesis.** Open https://arcade.lopeselio.online/thesis. Wait for the dimmed numbers to turn bright (live). Open the agent table and pick any account, e.g. `seat1.inside-job.testnet`: it can call only `commit_vote` on the game and `act_proposal` on the DAO.
5. **(2 min) Check it yourself.** Run the `curl` commands at the top of [TRACKS.md](TRACKS.md) (agent keys, EMBER supply), or `node scripts/thesis-data.mjs` in this repo. Open two transactions from TRACKS.md: the [Intents barter](https://testnet.nearblocks.io/txns/J7xBcKD5mszMkgEQo8tViw9SAGdWAsezr7HkJxP2ZH4x) and the [Chain Signatures deed certificate](https://testnet.nearblocks.io/txns/GReHCPKNjxnFmNiL9z51DZ3Zn9tdehRrCyd3VrPoaUVf).
6. **(1 min) One verify.** Each game's README has a verify command that replays a finished match against its contract, e.g. Bazaar of Liars' `pnpm verify:haggle examples/sample-haggle.json` (no keys).

## Run it

A small React + TypeScript app built with Vite (Node 22+, pnpm):

```sh
pnpm install
pnpm dev        # http://localhost:5173, live data from testnet
pnpm build      # typecheck, then the static site in dist/
pnpm preview    # serves dist/ at http://localhost:8891 (try /fogwater: the game opens over the floor; /thesis; /?track=agents)
node scripts/thesis-data.mjs   # Node 22.18+: re-reads the /thesis numbers, writes data/thesis.json and data/thesis-{stats,agents,contracts}.csv
```

The script needs no keys and no install beyond Node. It prints a summary, e.g. `agent accounts: 57 in 8 games; function-call keys only: 57`. Reads that public RPC drops after retries are listed as failed and left out.

## Deploy

- **Vercel** (project `near-arcade`, live at https://arcade.lopeselio.online): `vercel deploy --prod --yes --scope lopeselios-projects`. `vercel.json` builds with Vite into `dist/`, sends every one-segment path (`/sushi`, `/fogwater`, …) to the app, caches the hashed files in `/assets` forever and revalidates everything else.
- **Azure Storage static website** (mirror): `./deploy.sh` builds and uploads `dist/` (hashed assets immutable, `index.html` no-cache; the 404 page is the app, so deep links work).
- `./domains.sh records|check|bind` puts the arcade and each game on its lopeselio.online subdomain.

## Layout

| File | What it holds |
| --- | --- |
| `src/games.ts` | the cabinets: title, slug (its path), glow, badge, thumbnail, URLs, blurb, accounts, `play`, `tracks` (a note per track it proves) |
| `src/tracks.ts`, `src/useTrack.ts` | the track list and the `?track=` chip state |
| `src/thesis.ts` | the /thesis collector: agent keys, contract storage, per-game counts (shared with `scripts/thesis-data.mjs`) |
| `data/` | the last snapshot of those numbers (JSON and CSV); the page shows it until live reads arrive |
| `TRACKS.md` | the evidence for each claimed track |
| `src/chain.ts` | NEAR testnet reads: RPC failover with backoff, contract views, account balances, access keys |
| `src/loaders.ts` | one loader per game: its high-score board, three stats and ticker lines |
| `src/hooks.ts` | runs the loaders and the balance reads |
| `src/useGameScreen.ts` | the game screen at `/<slug>`: history, Back, Escape, focus |
| `src/components/` | Sign, Ticker, TrackBar, Cabinet, LivePanel, CoinBox, ChangeMachine, Footer, GameScreen, Thesis (the /thesis page) |
| `src/styles.css` | the whole look |

## Add a game

1. Add one entry to `GAMES` in `src/games.ts` (set `light: true` if the glow is bright, `play: 'desktop'` or `'mobile'` only if the other kind of device can't run it, and `tracks` with a one-line note for each track it proves).
2. Add its loader to `LOADERS` in `src/loaders.ts`, keyed by the slug (the build fails until it exists).
3. Drop a short animated capture (about 480×300, it is cropped to 16:10) at `public/thumbs/<slug>.webp`.

Its path `/<slug>` works on Vercel and Azure with no config change (any slug but `thesis`). To count its agents on /thesis, add them to `AGENT_ROSTER` and its contract to `CONTRACTS` in `src/thesis.ts`. For a new subdomain, add the game to the lists in `domains.sh`.

## Other submission

The same author also submitted **Signalfire** ([github.com/lopeselio/signalfire](https://github.com/lopeselio/signalfire)), a separate, independent project: attention tokens whose trading fees can only fund a startup's marketing, with sealed-bid creator campaigns, a Sputnik DAO treasury and a spend policy on NEAR testnet. It shares no contract, rules or server with any game here.
