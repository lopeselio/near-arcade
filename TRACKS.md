# Tracks: the evidence

What each claimed track rests on: which games, the contract and method, the standard, a transaction you can open, and a command you can run. Each track ends with a strength note, so you can see where a claim is only partial. All accounts are on NEAR testnet. All code is in the game's own repo (links in the [README](README.md#the-games)).

**One copy-paste proof per track**, with real match ids and the output to expect, is in the README: [Check every track yourself](README.md#check-every-track-yourself-no-keys).

On the site, the track chips light up the cabinets behind a track, e.g. [arcade.lopeselio.online/?track=privacy](https://arcade.lopeselio.online/?track=privacy). The live numbers are on [/thesis](https://arcade.lopeselio.online/thesis).

**Checks that need nothing but `curl`** (public RPC, no keys):

```sh
# the keys on any agent account: function-call only, one receiver, a few methods, an allowance
curl -s https://rpc.testnet.fastnear.com -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"view_access_key_list","finality":"final","account_id":"seat1.inside-job.testnet"}}'

# any view: args_base64 "e30=" is {}. Example: Emberfall's EMBER supply (minted, burned, matches settled)
curl -s https://rpc.testnet.fastnear.com -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"call_function","finality":"final","account_id":"emberfall.testnet","method_name":"ember_supply","args_base64":"e30="}}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.result?.result?Buffer.from(j.result.result).toString():s)})'

# everything on /thesis at once (Node 22.18+): writes data/thesis.json and data/thesis-*.csv
node scripts/thesis-data.mjs
```

Public RPC rate-limits bursts. If a call answers `-429`, wait a few seconds, or swap the endpoint for `https://near-testnet.drpc.org` or `https://testnet-rpc.intea.rs` (both listed on [docs.near.org's RPC providers page](https://docs.near.org/api/rpc/providers)).

---

## games

**Games With Real Economies.** All nine. Each is a complete game loop first: a kitchen race, haggling, conquest, a park builder, a sea battle, an arena, social deduction, artillery, minesweeper royale. You play as a guest with no wallet. The chain runs underneath: relayed or gasless transactions (NEP-366 delegate actions through each game's relayer account), and NEAR sign-in (NEP-413) only when you want to be ranked or own something.

| Game | What's onchain | See it |
|---|---|---|
| Sushi Sabotage | entry fees, a prize split, chef NFTs with purses, NEP-245 cards; players pay real NEAR for energy (`buy_energy`, 0.1 NEAR) | [buy_energy tx](https://testnet.nearblocks.io/txns/D3C2ZruhMjZHRPB2euMVZMHE5ddii1jPx92Pf4REfxDd) |
| Bazaar of Liars | coins, NEP-245 goods, stall deeds, auctions and orders, all in `v3.bazaar-liars.testnet`; `stats` counts haggles | [deed sale tx](https://testnet.nearblocks.io/txns/DV1ziN37eu3E4D7Entrow2j8CzZ45WHGQKoBzZ5ivGxr) |
| Emberfall | EMBER (NEP-141) pots, burns and mints; Warden NFTs | [settle_match tx](https://testnet.nearblocks.io/txns/RRQxP6fWCefonQk5JUSPs9eWcLXAZBY96Yw1dmaNu85) |
| Clawtide | PEARL (NEP-141) minted by settled rounds, moved by raids | [settle_round tx](https://testnet.nearblocks.io/txns/Du3wyMGeKF4655h78WCkb1Ys3462HYHrgRw1FJSSN6FX) |
| Parkwright | CR (NEP-141) paid by patron agents into parks you can claim and withdraw from | `list_parks`, `audit` on `park.parkwright.testnet` |
| Kraterra | munition-pack NFTs (NEP-171) you own and draft into a duel to unlock their rare weapon; duels drawn from NEAR's VRF, every shot recorded and replayed | `nft_total_supply`, `leaderboard` on `kraterra.testnet`; `pnpm verify em5cqa --host https://kraterra.lopeselio.online` |
| Realm Ledger, Inside Job, Fogwater | sealed orders and escrowed hires, a DAO treasury, Merkle-sealed fleets | sections below |

**Strength: strong** for the loop and for hiding the chain. *Partial* on "real economies" for Fogwater and Kraterra: they record play and stats onchain but have no token or money flow. Sign-in is NEAR-wallet only, with no social login.

## privacy

**Privacy & Private AI.**

**Sealed moves.** Hidden information is committed onchain as a hash before play and opened afterwards. Anyone can check it.

| Game | Commit → open (contract methods) |
|---|---|
| Bazaar of Liars | merchant's floor price: `open_haggle` → `close_haggle`. A haggle never revealed is counted in `stats().unrevealed` (0 right now). Sealed-bid auctions: `commit_bid` → `reveal_bid`. |
| Fogwater | the fleet is a Merkle root: `commit_fleet`. Each answer is checked against it in `play`; `reveal_fleet` rebuilds it. |
| Realm Ledger | season orders: `seal` → `reveal`. `finish_campaign` checks every commitment. |
| Sushi Sabotage | sabotage log: `seal` (up to 96 per match) → `settle_match` checks each opening in order |
| Emberfall | seed hash at `create_match`. Every 3 s of play goes into a hash chain with `seal`, and `open_chunks` rebuilds it ([open tx](https://testnet.nearblocks.io/txns/AYcjkV6DepsXKfXjLFyAY3JLHMoQe2Y1hTrK3Lo9djd7)). |
| Inside Job | roles, votes and who filed each spend: `create_match` role commits, `commit_vote` → `tally_meeting`, `settle` |
| Clawtide | per-seat hop seals: `seal` → `open_chunks`. Rockpool layouts: `build_rockpool` → `reveal_pool`. |

**Private AI.** AI dialogue comes from models running in TEEs on NEAR AI Cloud. Each response's signature and the enclave attestation are fetched. Bazaar of Liars checks them fully: `pnpm verify:model` (in its repo; needs a free NEAR AI Cloud key) checks the Intel TDX quote (dcap-qvl), NVIDIA's attestation and the response signature. Realm Ledger and Parkwright recover the signer and match it to the attestation's signing address.

**Strength: strong** for sealed moves, in seven games. *Partial* for private AI:
- Sushi, Fogwater, Emberfall, Inside Job, Kraterra and Clawtide store and count the TEE signatures but don't check them cryptographically.
- Referees post most seals, so the server sees the moves it seals. Each game's README says so.

## agents

**Agent Economy.** 57 AI agents hold their own NEAR sub-accounts and sign their own transactions. The [/thesis](https://arcade.lopeselio.online/thesis) table lists every one with its keys.

| Game | Agents | They earn / spend / pay by |
|---|---|---|
| Bazaar of Liars | 13: merchants, a wholesaler, traders, a runner, customers, a cab (listed by the `agents` view) | `authorize_spend`, `pay_agent` (e.g. hiring the runner), `post_order` (a customer locks a bounty): [rex authorize_spend](https://testnet.nearblocks.io/txns/Ahqq76i9rnJnLNkM9sogZtJxeSvLfmsNCaehjope1TiM), [teahouse post_order](https://testnet.nearblocks.io/txns/65P5peFBVz3xzqpNPm85Mqss3LdAzgUTAsXhow6T8kpS) |
| Realm Ledger | 14: `ruler0`–`ruler7`, chancellor, mercenary and spy companies, the guest seat | `hire` (price escrowed from the realm treasury), `deliver`, `settle_job`; treaties with tribute (`propose_treaty` / `accept_treaty`) |
| Sushi Sabotage | 6: four AI chefs, the Fixer, the Scout | `accept_offer` buys a card from the Fixer, `buy_scout` buys a report (5 ryo), entry fees, `claim_daily` |
| Parkwright | 8 patrons `g0`–`g7` | each signs `settle_day`, paying CR into the parks its visitors used |
| Emberfall | 5 AI Wardens | pay entry fees (`approve_fee`), win prizes and mints, burn EMBER (`offer_to_dark`) |
| Clawtide | 5 AI crabs | earn PEARL from settled rounds that include a signed-in player, `build_rockpool` |

**Strength: strong.** The agents transact for real, with their own keys and under onchain caps. Limits:
- Each game's server holds its agents' keys and runs their logic.
- Clawtide's crabs earn but never spend.
- Inside Job's AI desks vote, but they don't pay or earn.

## nfts

**NFTs That Do Something.**

- **Sushi Sabotage**
  - Chef NFTs (NEP-171) carry their own purse and gear. `move_purse` moves money between chefs.
  - Recipe scrolls earn a 2-ryo royalty for every dish of theirs that is delivered, capped at 30% of the pot.
  - Cards are NEP-245 multi-tokens. They are minted when bought and burned when brought to a match.
- **Emberfall:** a Warden NFT holds an EMBER purse, loot and a lifetime record. `nft_transfer` moves all of it. `fund_purse` and `withdraw_purse` move EMBER in and out. The SVG and metadata are regenerated from state.
- **Bazaar of Liars**
  - Stall deeds (`corner-1`…`corner-4`, NEP-171) hold stock and a till (`stock_stall`, `collect_till`) and trade on a deed market (`list_deed`, `buy_deed`).
  - `certify_deed` asks NEAR's MPC signer (`v1.signer-prod.testnet`, Chain Signatures) for an Ethereum-signed ownership certificate: [certify tx](https://testnet.nearblocks.io/txns/GReHCPKNjxnFmNiL9z51DZ3Zn9tdehRrCyd3VrPoaUVf), [deed page](https://testnet.nearblocks.io/nft-token/v3.bazaar-liars.testnet/corner-1).
- **Kraterra:** munition-pack NFTs (NEP-171/177/181) carry access. `create_match` checks that you own a pack before you can draft its rare weapon.

**Strength: strong** for Sushi, Emberfall and Bazaar. *Partial* for Kraterra, whose packs hold no value. None of them implement NEP-178 approvals or NEP-199 payouts, and none is an NFT-owned sub-account.

## security

**AI Security & Defense.**

- **Sandboxed agent wallets.** All 57 agent accounts hold only function-call keys. Each key has one receiver (the game contract, or for Inside Job's desks also the DAO), a short method list and, except Parkwright's patrons, a gas allowance.
  - For Sushi, Emberfall, Realm, Inside Job and Clawtide, the contract creates the key itself with `add_access_key_allowance`.
  - Check any agent with the `curl` above. `node scripts/thesis-data.mjs` checks all of them.
- **Spend policy engine** (Inside Job). `file_spend` enforces several rules on every spend:
  - the payee must be on the list
  - 1–15 credits per spend, a 100-credit budget, at most 16 spends
  - ticks never go back
  - it flags `lookalike` (edit distance ≤ 2 from a vendor on file), `new_payee`, `over_cap`, `vault_terminal` and `burst` into `audit_log(match_id)`

  Lookalike payees such as `lumen-powr` and `night0wl-guard` are real accounts in the game: spotting the scam is the gameplay. See the [file_spend tx](https://testnet.nearblocks.io/txns/AAByrdLuAzkvrVEdgKfrSDr2JWTk8XRGcLTnnUAvgY26).
- **Onchain caps**
  - `register_agent` day and match caps in Sushi Sabotage and Emberfall (enforced in `spend`)
  - `set_policy` season and campaign caps in Realm Ledger (enforced in `hire`)
  - `charge_cap` daily caps in Bazaar of Liars
  - Parkwright: per-patron per-park-day, per-park-day and per-24 h mint caps

  An agent's own chef or Warden can't be transferred away.
- **Monitoring.** Bazaar's watchdog (`/api/health/economy`, a GitHub workflow that opens an issue every 3 h when the economy needs attention). Realm Ledger's ops watch.

**Strength: strong** on scoped keys and onchain policies. Limits:
- The servers hold the agent keys.
- The DAO keeps a full-access key (Inside Job's README says so).
- No TEE holds keys.

## swarms

**AI Swarms.**

- **Bazaar of Liars:** 13 agents in one market:
  - Every agent's purse, goods, daily cap and today's spend are one contract view (`agents`; the README has the command).
  - Sealed-bid cargo auctions: `ship_arrives` → `commit_bid` → `reveal_bid` → `settle_auction`. Merchants, traders and the wholesaler decide their own bids.
  - Customers post paid orders that traders fill (`orders`), and merchants hire the runner.
  - Merchants barter with the wholesaler through NEAR Intents (see defi).
- **Realm Ledger:** eight AI rulers plus mercenary and spy companies. Rulers hire companies with escrowed pay, companies deliver, and treaties carry tribute.
- **Sushi Sabotage:** four AI chefs buy from two seller agents.

**Strength: partial.** Bazaar is a real multi-agent market. The others are small, and no agent coordinates collective purchases. Activity depends on the agents' purses: on 12 Nov 2026 the customers were posting and paying for orders, while the last twelve cargo lots closed unsold because most merchants and traders were short of coins.

## memecoins

**Memecoins With Mechanics.**

- **EMBER** (Emberfall, NEP-141 with `ft_transfer_call`):
  - 15% of the match pot burns per fallen Warden, up to 75%.
  - It mints only 1 per ember a living Warden carries out, capped at 40 per match and 2 000 per day.
  - `offer_to_dark` burns from a purse.
  - Live: `ember_supply`, curl above.
- **PEARL** (Clawtide, NEP-141 core): minted only by `settle_round` (at most 60 per seat per round) and by the 2-PEARL defence bounty when a raid fails. Since 12 Nov 2026 a round with no signed-in player mints nothing to anyone, so the AI crabs bank PEARL only in rounds against a real wallet. A won raid moves 10% of the target's PEARL (capped at 20) to the raider ([settle_raid tx](https://testnet.nearblocks.io/txns/HmzT68WxzdcepujAqFw8VNfAR2a5VVyfVCLm8CZSjM1b)).

**Strength: partial.**
- EMBER's burn and mint rules are real. Its 30-EMBER starter per Warden sits outside the daily cap.
- PEARL has no burn.
- The AI crabs banked PEARL in guest rounds before 12 Nov, so an AI crab holds the biggest hoard and the Pearl Crown today; those rounds stay onchain and still verify, and the hoard is what players raid.
- Neither is traded on a market.

## social

**Social Money.** Inside Job's match treasury is a real Sputnik DAO v2 (`dao.inside-job.testnet`):
- Only the game contract may add proposals (role `terminal`).
- Only the five council desks vote (role `council`), and more than half must approve (RoleWeight, threshold 1/2).
- The proposals are real NEAR transfers.

AI desks vote with keys limited to `act_proposal` on the DAO: [seat 2 votes](https://testnet.nearblocks.io/txns/4rTMy5BS8YKEkhjFrgdG849VruWmVKQcFewaAjFLmNri). `settle` reads every proposal back from the DAO, so the game can't misreport what was paid out.

Check the policy with the curl above: account `dao.inside-job.testnet`, method `get_policy`.

**Strength: partial.** It's one game, and it uses Sputnik as built rather than a new shared-budget product.

## defi

**Unstoppable DeFi.** In Bazaar of Liars, merchants and the wholesaler barter NEP-245 goods through NEAR Intents:
1. Each side signs its own `token_diff` intent (NEP-413).
2. The verifier's `execute_intents` settles both sides or neither: [barter tx](https://testnet.nearblocks.io/txns/J7xBcKD5mszMkgEQo8tViw9SAGdWAsezr7HkJxP2ZH4x).

Stall deeds get Ethereum-signed certificates through Chain Signatures (see nfts).

**Strength: partial, the weakest claim.**
- NEAR Intents has no official testnet, so `bazaar-intents.testnet` is our own deploy of the verifier contract.
- The assets are game goods.
- The Chain Signatures certificate is a signature, not a cross-chain asset move.

## thesis

**Thesis.** [arcade.lopeselio.online/thesis](https://arcade.lopeselio.online/thesis) makes the long-term case that AI agents running game economies are a demand driver for NEAR:
- Function-call keys and sub-accounts make sandboxed agent wallets.
- Storage staking turns game state into locked NEAR.
- Commit/reveal, VRF and TEE-signed AI make agents auditable.
- Contract-held token rules keep monetary policy away from the operator.
- Chain Signatures, Intents and gasless meta-transactions connect it all.

Every claim is tied to a number the page reads live from the nine contracts. The numbers: agent accounts and their key permissions, play recorded, tokens minted and burned, NFTs, storage and the NEAR it locks.

`node scripts/thesis-data.mjs` re-runs the same reads and writes `data/thesis.json` and CSVs (a snapshot is committed).

**Strength: partial.** These are testnet numbers at hackathon scale, and the page says so in its "Limits and risks".

## open

**Open Innovation.**
- **Parkwright**
  - An in-game AI modding terminal: `mod ai` writes a mod, and it is validated and sandboxed to vetoes and cost multipliers.
  - An MCP bridge: the `bridge` command gives a link that lets Claude Code play your park (`claude mcp add --transport http parkwright <link>`).
- **The arcade itself:** one static page reads nine independent contracts live, with no server and no keys.

**Strength: strong** as a catch-all.

---

**Not claimed:** business and realworld (see [Signalfire](https://github.com/lopeselio/signalfire), a separate submission).
