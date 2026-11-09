# NEAR Arcade

One page that launches our NEAR HACKATHON games (Sushi Sabotage, Bazaar of Liars, Realm Ledger, Parkwright, Fogwater). Each game is its own project with its own repo, contract and server; this page only links to and embeds them.

The page reads everything live from NEAR testnet in the browser (public RPC, no keys, no server): each game's high scores and stats from its contract's views, and the balance of every game account (contracts also show how much of their balance is still free for storage). The cabinet screens are short animated captures in `thumbs/`.

Deploy: `./deploy.sh` (Azure Storage static website) or Vercel (project `near-arcade`).
