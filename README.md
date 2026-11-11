# NEAR Arcade

One page that launches our NEAR HACKATHON games (Sushi Sabotage, Bazaar of Liars, Realm Ledger, Parkwright, Fogwater, Emberfall, Inside Job, Kraterra, Clawtide). Each game is its own project with its own repo, contract and server; this page only links to and embeds them.

The page reads everything live from NEAR testnet in the browser (public RPC, no keys, no server): each game's high scores and stats from its contract's views, and the balance of every game account (contracts also show how much of their balance is still free for storage). The cabinet screens are short animated captures in `public/thumbs/`. A plate under each marquee says where it plays: **Pocket + Cabinet** (phone touch controls and desktop), or **Cabinet only** / **Pocket only** for a game that needs a desktop or a phone (a game's `play` field); on the wrong kind of device that cabinet also carries a short warning.

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
