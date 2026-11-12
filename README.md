# NEAR Arcade

**This submission is nine games.** Each one is its own repo, NEAR testnet contract and hosted server, listed below. This repo is only their launcher: one static page (https://arcade.lopeselio.online) that embeds the nine games and reads their contracts live. To judge the games, use the table and the [proof commands](#check-every-track-yourself-no-keys); to judge the arcade, read on.

| Game | Repo | Contract (testnet) | Play it | In one line |
|---|---|---|---|---|
| Sushi Sabotage | [lopeselio/sushi-sabotage](https://github.com/lopeselio/sushi-sabotage) | `sushi-sabotage.testnet` | [sushi.lopeselio.online](https://sushi.lopeselio.online) | Kitchen race with secret sabotage, sealed onchain and opened at the bell; AI chefs with wallets; chef NFTs that hold their purse |
| Bazaar of Liars | [lopeselio/bazaar-of-liars](https://github.com/lopeselio/bazaar-of-liars) | `v3.bazaar-liars.testnet` | [bazaar.lopeselio.online](https://bazaar.lopeselio.online) | Haggle with bluffing AI merchants whose secrets are committed onchain and whose lines are TEE-signed |
| Realm Ledger | [lopeselio/realm-ledger](https://github.com/lopeselio/realm-ledger) | `realm-ledger.testnet` | [realm.lopeselio.online](https://realm.lopeselio.online) | Conquest where AI rulers with wallets and every player seal their orders at once |
| Parkwright | [lopeselio/parkwright](https://github.com/lopeselio/parkwright) | `park.parkwright.testnet` | [parkwright.lopeselio.online](https://parkwright.lopeselio.online) | Theme-park builder; guests are agents with wallets; parks settled by replay and claimable onchain |
| Fogwater | [lopeselio/fogwater](https://github.com/lopeselio/fogwater) | `fogwater.testnet` | [fogwater.lopeselio.online](https://fogwater.lopeselio.online) | Sea battle where your fleet is a Merkle root and every hit or miss is proven against it |
| Emberfall | [lopeselio/emberfall](https://github.com/lopeselio/emberfall) | `emberfall.testnet` | [emberfall.lopeselio.online](https://emberfall.lopeselio.online) | Torchlit arena; Warden NFTs carry their own EMBER purse; EMBER burns for the fallen |
| Inside Job | [lopeselio/inside-job](https://github.com/lopeselio/inside-job) | `inside-job.testnet`, `dao.inside-job.testnet` | [inside-job.lopeselio.online](https://inside-job.lopeselio.online) | Social deduction over a real Sputnik DAO treasury; AI council members can vote but never move money |
| Kraterra | [lopeselio/kraterra](https://github.com/lopeselio/kraterra) | `kraterra.testnet` | [kraterra.lopeselio.online](https://kraterra.lopeselio.online) | Munition-pack NFTs you own unlock rare weapons in voxel artillery duels; terrain and wind from NEAR's VRF plus a committed secret |
| Clawtide | [lopeselio/clawtide](https://github.com/lopeselio/clawtide) | `clawtide.testnet` | [clawtide.lopeselio.online](https://clawtide.lopeselio.online) | Competitive crab minesweeper; boards from NEAR's VRF; PEARL earned, pooled and raided |

## The arcade page

The page reads everything live from NEAR testnet in the browser (public RPC, no keys, no server): each game's high scores and stats from its contract's views, and the balance of every game account (contracts also show how much of their balance is still free for storage). It rotates across five public testnet RPCs from [docs.near.org's provider list](https://docs.near.org/api/rpc/providers), benches one that rate-limits, backs off and retries, and keeps the last good answer for each read in the browser session, so a busy network shows a slightly older number marked *cached* rather than a blank panel. Leaderboards leave out our own test players (`E2E …`, `e2e-…`, `claimtest-…`) and say under the board how many were hidden. The cabinet screens are short animated captures in `public/thumbs/`. A plate under each marquee says where it plays: **Pocket + Cabinet** (phone touch controls and desktop), or **Cabinet only** / **Pocket only** for a game that needs a desktop or a phone (a game's `play` field); on the wrong kind of device that cabinet also carries a short warning.

A row of **track chips** lights up the cabinets that prove each hackathon track, with a one-line note on where to look (`?track=privacy` links straight to it). **[/thesis](https://arcade.lopeselio.online/thesis)** is a live data page: 57 agent accounts and their key permissions, play recorded, tokens minted and burned, NFTs and contract storage, all read from the nine contracts, plus the written case for why agent-run game economies are demand for NEAR. The evidence for every track is in **[TRACKS.md](TRACKS.md)**.

## The problem

Onchain games usually show the chain to the player (wallet pop-ups, gas, seed phrases) while hiding the parts players would actually want proven: what an opponent's hidden move was, whether the board was rigged, whether an AI rival or the server cheated. And their in-game economies rarely do anything on their own.

These nine games flip that. Players start as guests with no wallet; the chain works underneath them. Hidden moves, secret rolls and boards are committed onchain before play and opened afterwards, so anyone can check them with a `pnpm verify` command. AI rivals hold their own NEAR accounts with capped spending, and the games' NFTs and tokens carry real balances and rules. This page puts them in one place and reads their state live from NEAR testnet.

## Try it (do X, see Y)

1. Open **https://arcade.lopeselio.online**. You see nine cabinets; each one's high scores, stats and NEAR accounts are read live from testnet in your browser.
2. Press **Insert coin** on any cabinet: the game opens in the page at its own path (e.g. `/fogwater`); **Escape** or **Back** returns to the floor. **Open in a new tab** plays it full screen (wallet sign-in works best there). Every plate reads **Pocket + Cabinet** except Bazaar of Liars, **Cabinet only**: its walkable city's haggle and trade prompts need a keyboard; on a phone its cabinet links the classic desert bazaar (`bazaar.lopeselio.online/?classic`), which plays by touch.
3. Every game plays as a guest with no wallet; **Sign in with NEAR** (any testnet wallet) to be ranked and to own NFTs.
4. Press a **track chip** under the ticker (e.g. **Privacy**): the cabinets that prove it light up, each with a note naming the contract method to look at, and the rest dim. The address bar shows `?track=privacy`; press the chip again to clear it.
5. Open **https://arcade.lopeselio.online/thesis**: the numbers first show a dimmed snapshot, then turn bright as live reads arrive (about 10–30 s on public RPC). Open **Every agent account and what its keys may do**: each one has only function-call keys.
6. Each game's README has its own do-X-see-Y steps and a verify command (`pnpm verify …` in most; Parkwright's is `/api/parks/<id>/verify`) that re-checks a finished match against its contract. [Check every track yourself](#check-every-track-yourself-no-keys) has one ready-to-paste command per track, with real match ids and the output to expect.
7. Open **https://arcade.lopeselio.online/no-such-game**: an *Out of order* page says there's no cabinet there and links all nine games, the floor and /thesis.

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

## Check every track yourself (no keys)

One command per track, against the hosted games and public testnet RPC. You need Node 22+, pnpm and git; nothing else, no `.env`. The `pnpm verify` commands fetch a finished match's proof bundle from the hosted game and check it against the contract. The ids below are real matches played on the hosted games (re-checked 12 Nov 2026); most games' result screens show the same command for your own match. The `curl` commands need only `curl` and `node`.

Public RPC rate-limits bursts. If one answers `-429` or "rate limit", run it again in a minute or swap the RPC URL for another public testnet one: `https://near-testnet.drpc.org`, `https://testnet-rpc.intea.rs`, `https://rpc.testnet.fastnear.com`.

**games** (Emberfall: a ranked match's EMBER pot, burn and mint, replayed tick by tick)

```sh
git clone https://github.com/lopeselio/emberfall && cd emberfall && pnpm install
pnpm verify m-mwdf0yat-b30568 --host https://emberfall.lopeselio.online --rpc https://near-testnet.drpc.org
# ✓ pot 20 EMBER: 9 burned (3 fell), 11 to the winner
# ✓ minted for embers carried out: [0, 0, 0, 40] (capped)
# all checks passed
```

**privacy** (Fogwater: every answer opens the Merkle-root fleet sealed before the first shot)

```sh
git clone https://github.com/lopeselio/fogwater && cd fogwater && pnpm install
pnpm verify f1859e8a4aa4 https://fogwater.lopeselio.online
# ✓ both fleet roots match the contract (fogwater.testnet)
# ✓ all 48 answers open the sealed roots (Merkle proofs checked)
# ✓ winner: seat 2 (seat 1 ran out of time); hits 4/17 vs 12/17
```

**agents** (Realm Ledger: the chancellor agent (`chancellor.realm-ledger.testnet`) hired the spy agent `spy1` through the contract's escrow; the report was false, so the contract refunded the fee)

```sh
git clone https://github.com/lopeselio/realm-ledger && cd realm-ledger && pnpm install
NEAR_RPC_URL=https://testnet-rpc.intea.rs pnpm verify:campaign https://realm.lopeselio.online/api/campaigns/60/proof
# ✓ job 12 (spy, season 0): paid only if the report matched the truth  (report false)
# ✓ job 12: onchain it is Refunded, at the price and delivery in the bundle
# all 64 checks passed: campaign 60 on realm-ledger.testnet
```

**nfts** (Bazaar of Liars: a stall deed's Ethereum-signed ownership certificate from Chain Signatures)

```sh
git clone https://github.com/lopeselio/bazaar-of-liars && cd bazaar-of-liars && pnpm install
pnpm verify:deed corner-1
# ✓ Signature recovers to the bazaar's Ethereum address
# ✓ The certified owner still owns the deed
# ✓ Certificate verified: any EVM chain's ecrecover gives the same address.
```

**security** (Inside Job: an AI council desk's keys, read from the chain. Function-call only: one method on the game, one on the DAO)

```sh
curl -s https://near-testnet.drpc.org -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"view_access_key_list","finality":"final","account_id":"seat1.inside-job.testnet"}}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const k of JSON.parse(s).result.keys){const p=k.access_key.permission;console.log(p==="FullAccess"?"FULL ACCESS":`function-call key: ${p.FunctionCall.receiver_id} -> ${p.FunctionCall.method_names.join(", ")}`)}})'
# function-call key: inside-job.testnet -> commit_vote
# function-call key: dao.inside-job.testnet -> act_proposal
```

**swarms** (Bazaar of Liars: the 13 agent accounts in one market, each with its own purse and an onchain daily cap; numbers change as they trade)

```sh
curl -s https://near-testnet.drpc.org -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"call_function","finality":"final","account_id":"v3.bazaar-liars.testnet","method_name":"agents","args_base64":"eyJnb29kX2lkcyI6WyJydWciLCJzYWZmcm9uIiwibGFtcCJdfQ=="}}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(Buffer.from(JSON.parse(s).result.result));for(const x of a)console.log(`${x.account}  ${x.kind}  ${x.coins} coins  spent ${x.spent_today}/${x.daily_cap} today`);console.log(a.length+" agent accounts in one market")})'
# wu.v3.bazaar-liars.testnet  wholesaler  979 coins  spent 0/400 today
# vesey-3.v3.bazaar-liars.testnet  customer  202 coins  spent 102/500 today
# …
# 13 agent accounts in one market
```

**memecoins** (Clawtide: PEARL minted only by a settled round, which the verifier replays from the opened log)

```sh
git clone https://github.com/lopeselio/clawtide && cd clawtide && pnpm install
pnpm verify r-mwahfr6v-ab6271 --host https://clawtide.lopeselio.online --rpc https://near-testnet.drpc.org
# ✓ the contract settled it
# ✓ PEARL minted per seat: [6, 9, 4, 6]
# all checks passed
```

**social** (Inside Job: the Sputnik DAO holds exactly the council votes the replay says were cast)

```sh
git clone https://github.com/lopeselio/inside-job && cd inside-job && pnpm install
pnpm verify m-mwdiwv95-5ab546 https://inside-job.lopeselio.online
# ✓ all 8 spends in the audit log match the replay, flags included; every sealed filer opens (5 filed by the Insider)
# ✓ the Sputnik DAO (dao.inside-job.testnet) holds the same 27 council votes and statuses as the replay
# ✓ the contract settled it: crew win by ejected, Insider seat 3, 15 credits drained
```

**defi** (Bazaar of Liars: two agents' signed `token_diff` intents settled together by `execute_intents`; an archival RPC, since the transaction is older than a few days)

```sh
curl -s https://archival-rpc.testnet.fastnear.com -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tx","params":{"tx_hash":"J7xBcKD5mszMkgEQo8tViw9SAGdWAsezr7HkJxP2ZH4x","sender_account_id":"bazaar-funds-1108.testnet","wait_until":"NONE"}}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).result;console.log(r.transaction.receiver_id,Object.keys(r.status)[0]);for(const o of r.receipts_outcome)for(const l of o.outcome.logs)if(l.startsWith("EVENT_JSON:"))console.log(" ",o.outcome.executor_id,JSON.parse(l.slice(11)).event)})'
# bazaar-intents.testnet SuccessValue
#   bazaar-intents.testnet token_diff
#   bazaar-intents.testnet token_diff
#   bazaar-intents.testnet intents_executed
#   v3.bazaar-liars.testnet mt_transfer
```

**thesis** (this repo: every /thesis number re-read from the nine contracts)

```sh
git clone https://github.com/lopeselio/near-arcade && cd near-arcade
node scripts/thesis-data.mjs      # Node 22.18+; no install needed
# agent accounts: 57 in 8 games; function-call keys only: 57; with a full-access key: 0
```

**open** (Parkwright: the server replays every build action of a published park and reproduces the save; the contract shows what visitor agents paid into it)

```sh
curl -s https://parkwright.lopeselio.online/api/parks/5646276b0bfcba1a/verify
# {"id":"5646276b0bfcba1a","version":9,"verified":true,"reason":"replay matches the save",…}
curl -s https://parkwright.lopeselio.online/api/parks/5646276b0bfcba1a/chain
# {"enabled":true,"contract":"park.parkwright.testnet","park":{…,"name":"Judge Park","earned":"39420","settlements":53,…},…}
```

The other three games have the same kind of check: `pnpm verify em5cqa --host https://kraterra.lopeselio.online --rpc https://near-testnet.drpc.org` in Kraterra (a duel replayed shot by shot, scores 144 – 54), `pnpm verify:haggle examples/sample-haggle.json` in Bazaar of Liars (50 checks of one haggle's commitment and reveal), and `pnpm verify <matchId>` in Sushi Sabotage (see its README).

## Judge it in 10 minutes

1. **(1 min) The floor.** Open https://arcade.lopeselio.online. Nine cabinets, each showing high scores and three stats read from its contract in your browser. The **Change machine** at the bottom lists every game account with its live balance.
2. **(2 min) Play one as a guest.** Press **Insert coin** on **Bazaar of Liars** and haggle with a merchant, or on **Emberfall** and survive one match. You never see a wallet; the moves are sealed onchain underneath.
3. **(1 min) Tracks.** Press each chip. For example, **Security** lights six cabinets; each note names the method that enforces the rule (`file_spend`, `register_agent`, `set_policy`, `charge_cap`).
4. **(3 min) Thesis.** Open https://arcade.lopeselio.online/thesis. Wait for the dimmed numbers to turn bright (live). Open the agent table and pick any account, e.g. `seat1.inside-job.testnet`: it can call only `commit_vote` on the game and `act_proposal` on the DAO.
5. **(2 min) Check it yourself.** Run the `curl` commands at the top of [TRACKS.md](TRACKS.md) (agent keys, EMBER supply), or `node scripts/thesis-data.mjs` in this repo. Open two transactions from TRACKS.md: the [Intents barter](https://testnet.nearblocks.io/txns/J7xBcKD5mszMkgEQo8tViw9SAGdWAsezr7HkJxP2ZH4x) and the [Chain Signatures deed certificate](https://testnet.nearblocks.io/txns/GReHCPKNjxnFmNiL9z51DZ3Zn9tdehRrCyd3VrPoaUVf).
6. **(1 min) One verify.** Run any command from [Check every track yourself](#check-every-track-yourself-no-keys), e.g. Fogwater's `pnpm verify f1859e8a4aa4 https://fogwater.lopeselio.online` (no keys).

## Run it

A small React + TypeScript app built with Vite (Node 22+, pnpm):

```sh
pnpm install
pnpm dev        # http://localhost:5173, live data from testnet
pnpm build      # typecheck, then the static site in dist/
pnpm preview    # serves dist/ at http://localhost:8891 (try /fogwater: the game opens over the floor; /thesis; /?track=agents)
node scripts/thesis-data.mjs   # Node 22.18+: re-reads the /thesis numbers, writes data/thesis.json and data/thesis-{stats,agents,contracts}.csv (--rpc URL to try one RPC first)
```

The script needs no keys and no install beyond Node. It prints a summary, e.g. `agent accounts: 57 in 8 games; function-call keys only: 57`. Reads that public RPC drops after retries are listed as failed and left out.

## Deploy

- **Vercel** (project `near-arcade`, live at https://arcade.lopeselio.online): `vercel deploy --prod --yes --scope lopeselios-projects`. `vercel.json` builds with Vite into `dist/`, sends every path except the built files to the app (`/sushi`, `/fogwater`, … open a game; an unknown path shows a not-found page with every game's link), caches the hashed files in `/assets` forever and revalidates everything else.
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
| `src/chain.ts` | NEAR testnet reads: RPC rotation with backoff, the last-good cache, contract views, account balances, access keys |
| `src/loaders.ts` | one loader per game: its high-score board, three stats and ticker lines |
| `src/hooks.ts` | runs the loaders and the balance reads |
| `src/useGameScreen.ts` | the game screen at `/<slug>`: history, Back, Escape, focus |
| `src/main.tsx` | which page a path gets: the floor, a game over it, /thesis, or the not-found page |
| `src/components/` | Sign, Ticker, TrackBar, Cabinet, LivePanel, CoinBox, ChangeMachine, Footer, GameScreen, Thesis (the /thesis page), NotFound |
| `src/styles.css` | the whole look |

## Add a game

1. Add one entry to `GAMES` in `src/games.ts` (set `light: true` if the glow is bright, `play: 'desktop'` or `'mobile'` only if the other kind of device can't run it, with `playNote` for the reason and `phoneUrl` for a version that does work on a phone, and `tracks` with a one-line note for each track it proves).
2. Add its loader to `LOADERS` in `src/loaders.ts`, keyed by the slug (the build fails until it exists).
3. Drop a short animated capture (about 480×300, it is cropped to 16:10) at `public/thumbs/<slug>.webp`.

Its path `/<slug>` works on Vercel and Azure with no config change (any slug but `thesis`). To count its agents on /thesis, add them to `AGENT_ROSTER` and its contract to `CONTRACTS` in `src/thesis.ts`. For a new subdomain, add the game to the lists in `domains.sh`.

## Other submission

The same author also submitted **Signalfire** ([github.com/lopeselio/signalfire](https://github.com/lopeselio/signalfire)), a separate, independent project: attention tokens whose trading fees can only fund a startup's marketing, with sealed-bid creator campaigns, a Sputnik DAO treasury and a spend policy on NEAR testnet. It shares no contract, rules or server with any game here.
