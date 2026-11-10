# NEAR Arcade

One page that launches our NEAR HACKATHON games (Sushi Sabotage, Bazaar of Liars, Realm Ledger, Parkwright, Fogwater, Emberfall, Inside Job). Each game is its own project with its own repo, contract and server; this page only links to and embeds them.

The page reads everything live from NEAR testnet in the browser (public RPC, no keys, no server): each game's high scores and stats from its contract's views, and the balance of every game account (contracts also show how much of their balance is still free for storage). The cabinet screens are short animated captures in `thumbs/`. A plate under each marquee says where it plays: **Pocket + Cabinet** (phone touch controls and desktop), or **Cabinet only** / **Pocket only** for a game that needs a desktop or a phone (a game's `play` field); opening a desktop-only cabinet on a phone shows a warning first.

Deploy: `./deploy.sh` (Azure Storage static website) or Vercel (project `near-arcade`).
