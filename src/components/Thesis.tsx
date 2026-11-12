import { useEffect, useState, type ReactNode } from 'react';
import { explorer, fmt } from '../chain';
import { GAMES } from '../games';
import { collectThesis, fillGaps, summarize, type Stat, type ThesisData } from '../thesis.ts';
import snapshotJson from '../../data/thesis.json';

const SNAPSHOT = snapshotJson as ThesisData;
const REPO = 'https://github.com/lopeselio/near-arcade';
const glow = (game: string) => GAMES.find((g) => g.title === game)?.glow ?? '#3cf2ff';

type State = { data: ThesisData & { filled: string[] }; live: 'reading' | 'done' };

/** The thesis page at /thesis: every number is read from NEAR testnet in the browser; the snapshot only fills reads that fail. */
export function Thesis() {
  const [state, setState] = useState<State>({ data: { ...SNAPSHOT, filled: [] }, live: 'reading' });
  useEffect(() => {
    document.title = 'Thesis · NEAR Arcade';
    let on = true;
    collectThesis(4).then((live) => on && setState({ data: fillGaps(live, SNAPSHOT), live: 'done' }));
    return () => { on = false; };
  }, []);

  const { data, live } = state;
  const s = summarize(data);
  const stale = (key: string) => live === 'reading' || data.filled.includes(key);
  /** A number in the text: live when read, marked when it is still the snapshot's. */
  const N = ({ v, k, d = 0 }: { v: number | undefined; k?: string; d?: number }) => (
    <b className={`n${stale(k ?? '') ? ' stale' : ''}`}>{v == null ? '—' : fmt(v, d)}</b>
  );
  const stat = (key: string) => s.stat(key);
  const byGame = (rows: Stat[]) => rows.map((r): [string, number, string, string] => [`${r.game}: ${r.label}`, r.value, glow(r.game), r.source]);

  const agentsPerGame = [...new Set(data.agents.map((a) => a.game))].map((game): [string, number, string, string] => [
    game,
    data.agents.filter((a) => a.game === game && a.exists).length,
    glow(game),
    `${data.agents.filter((a) => a.game === game && a.fullKeys > 0).length} with a full-access key`,
  ]);

  return (
    <div className="wrap thesis">
      <nav className="thesis-nav">
        <a href="/">← The arcade</a>
        <a href={`${REPO}/blob/main/TRACKS.md#thesis`} target="_blank" rel="noopener">Evidence (TRACKS.md)</a>
        <a href={`${REPO}/blob/main/scripts/thesis-data.mjs`} target="_blank" rel="noopener">Re-run it</a>
      </nav>
      <header className="thesis-head">
        <h1>Agents running game economies are demand for NEAR</h1>
        <p className="lede">
          Nine games on NEAR testnet, read live from your browser with public RPC and no keys. Every number on this page comes from a contract view or an
          account query named next to it; <code>node scripts/thesis-data.mjs</code> re-reads the same numbers and writes them to <code>data/</code>.
        </p>
        <p className="status" aria-live="polite">
          {live === 'reading'
            ? `Reading testnet… (showing the snapshot of ${new Date(SNAPSHOT.at).toUTCString()} until it answers)`
            : `Read live at ${new Date(data.at).toUTCString()}.${data.filled.length ? ` ${data.filled.length} read(s) didn't answer and show the snapshot of ${new Date(SNAPSHOT.at).toUTCString()} (dimmed).` : ''}`}
        </p>
      </header>

      <section className="tiles" aria-label="Headline numbers">
        <Tile n={<N v={s.agents} />} label={`agent accounts in ${s.gamesWithAgents} games, each a named NEAR sub-account`} src="view_access_key_list on each" />
        <Tile n={<N v={s.fcOnly} />} label={`of them hold only function-call keys (${s.withFull} hold a full-access key)`} src="view_access_key_list" />
        <Tile n={<N v={s.played} />} label="haggles, games, rounds, shifts and park-days recorded onchain (the counts below, added)" src="contract views, below" />
        <Tile n={<N v={s.nfts} />} label="NFTs in existence (chefs, scrolls, deeds, Wardens, munitions)" src="nft_total_supply × 4" />
        <Tile n={<N v={s.storageBytes / 1e6} d={2} />} label={`MB of state in ${s.contracts} contracts (code included)`} src="view_account storage_usage" />
        <Tile n={<N v={s.storageNear} d={1} />} label="NEAR locked by storage staking for that state (1 NEAR per 100 kB)" src="storage_usage × 10⁻⁵" />
      </section>

      <section className="chart">
        <h2>Agent accounts per game</h2>
        <p>Every agent is a sub-account of its game (like <code>kenji.sushi-sabotage.testnet</code>) whose keys can call only that game's contract.</p>
        <Bars rows={agentsPerGame} />
        <details className="keys">
          <summary>Every agent account and what its keys may do</summary>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Keys</th>
                  <th>May call</th>
                  <th>Gas allowance left</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((a) => (
                  <tr key={a.id} className={stale(a.id) ? 'stale' : undefined}>
                    <td>
                      <span className="dot" style={{ background: glow(a.game) }} />
                      <a href={explorer(a.id)} target="_blank" rel="noopener">{a.id}</a>
                    </td>
                    <td>{a.exists ? `${a.fcKeys} function-call${a.fullKeys ? `, ${a.fullKeys} full access` : ''}` : 'no account'}</td>
                    <td className="methods">{a.receivers.map((r) => `${r}: `).join('')}{a.methods.join(', ')}</td>
                    <td className="num">{a.allowance == null ? 'no limit' : `${fmt(a.allowance, 3)} NEAR`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="chart">
        <h2>Play recorded onchain</h2>
        <p>Each bar is one count from one contract view, named under it. Bars use a log scale.</p>
        <Bars log rows={byGame(data.stats.filter((r) => r.kind === 'played'))} stale={stale} keys={data.stats.filter((r) => r.kind === 'played').map((r) => r.key)} />
      </section>

      <section className="chart">
        <h2>Tokens whose supply follows the rules</h2>
        <p>Different tokens with different units, so read the numbers, not the bar lengths across tokens (log scale).</p>
        <Bars log rows={byGame(data.stats.filter((r) => ['minted', 'burned', 'supply'].includes(r.kind)))} stale={stale} keys={data.stats.filter((r) => ['minted', 'burned', 'supply'].includes(r.kind)).map((r) => r.key)} />
      </section>

      <section className="chart">
        <h2>NFTs and other activity</h2>
        <p>Log scale.</p>
        <Bars log rows={byGame(data.stats.filter((r) => r.kind === 'nfts' || r.kind === 'other'))} stale={stale} keys={data.stats.filter((r) => r.kind === 'nfts' || r.kind === 'other').map((r) => r.key)} />
      </section>

      <section className="chart">
        <h2>State each contract pays for</h2>
        <p>Storage in kB, code plus game state. Every 100 kB keeps 1 NEAR of the contract's balance locked.</p>
        <Bars
          rows={data.contracts.map((c): [string, number, string, string] => [c.id, c.storageBytes / 1000, glow(c.game), `${fmt(c.balance, 2)} NEAR held`])}
          stale={stale}
          keys={data.contracts.map((c) => c.id)}
          unit=" kB"
        />
      </section>

      <article className="essay">
        <h2>The thesis</h2>
        <p>
          Games are where autonomous agents will first transact at volume. Every match needs opponents, shopkeepers, referees and counterparties, around the
          clock, and players won't wait for other humans. In these nine games <N v={s.agents} /> AI agents already hold their own NEAR accounts and sign
          their own transactions: merchants that authorize spends and pay each other, chefs that buy cards and scouting reports, rulers that hire mercenaries
          into escrow, patrons that pay parks, council desks that vote on a DAO treasury. Each agent is an account that needs gas, keys and storage. Demand
          for NEAR then grows with the number of agents, not the number of humans.
        </p>
        <p>
          <strong>Sandboxed wallets are built into the protocol.</strong> <N v={s.fcOnly} /> of the <N v={s.agents} /> agent accounts above have no
          full-access key at all: each holds function-call keys limited to its game's contract, a short list of methods and, for most, a gas allowance (see
          the table). On chains without native account abstraction this takes a smart-wallet contract per agent; on NEAR it is one <code>AddKey</code>{' '}
          action, and named sub-accounts make every agent readable. Spending caps live in the game contracts: <code>register_agent</code> day and match
          caps in Sushi Sabotage and Emberfall, <code>set_policy</code> in Realm Ledger, <code>charge_cap</code> in Bazaar of Liars, and a spend policy with
          an audit log in Inside Job. A leaked agent key can lose its allowance, not the treasury.
        </p>
        <p>
          <strong>Game state is paid for in NEAR.</strong> The {fmt(s.contracts)} contracts hold <N v={s.storageBytes / 1e6} d={2} /> MB, which keeps{' '}
          <N v={s.storageNear} d={1} /> NEAR locked under storage staking for as long as the state exists. Agent economies write state continuously:{' '}
          <N v={stat('bazaar_haggles')} k="bazaar_haggles" /> haggles committed and revealed, <N v={stat('ij_proposals')} k="ij_proposals" /> DAO spend
          proposals, <N v={stat('park_days')} k="park_days" /> park-days settled by patron agents, <N v={s.nfts} /> NFTs. More agents means more bytes,
          which means more NEAR held off the market.
        </p>
        <p>
          <strong>Agents are tolerable opponents only if they can be audited.</strong> Hidden moves are committed before play and opened after:{' '}
          <N v={stat('bazaar_unrevealed')} k="bazaar_unrevealed" /> of Bazaar's haggles were never revealed, Emberfall settled{' '}
          <N v={stat('ember_matches')} k="ember_matches" /> matches whose every three seconds of play was sealed, and Kraterra and Clawtide mix NEAR's block
          randomness (<code>env::random_seed</code>) with a committed secret. The agents' dialogue comes from models running in TEEs on NEAR AI Cloud, and
          Bazaar's verifier checks the Intel TDX quote, the NVIDIA attestation and the signature.
        </p>
        <p>
          <strong>The contract holds monetary policy, not the operator.</strong> EMBER: <N v={stat('ember_minted')} k="ember_minted" /> minted only for
          embers carried out (at most 40 a match, 2 000 a day) and <N v={stat('ember_burned')} k="ember_burned" /> burned for fallen Wardens. PEARL:{' '}
          <N v={stat('claw_pearl')} k="claw_pearl" /> in existence, minted only by <N v={stat('claw_rounds')} k="claw_rounds" /> settled rounds this season.
          When agents are economic actors, rules they can't talk their way around have to be onchain.
        </p>
        <p>
          <strong>Other chains and other assets come through the same accounts.</strong> A Bazaar stall deed carries an Ethereum-signed certificate from
          NEAR's MPC signer (Chain Signatures), agents barter goods by signing <code>token_diff</code> intents, and gasless meta-transactions (NEP-366) let
          guests play while a relayer pays. Players never have to see the chain.
        </p>
        <h3>Limits and risks</h3>
        <ul>
          <li>This is testnet. The counts are hundreds, not millions, and much of the play is our own testing and AI agents playing each other.</li>
          <li>Each game's server holds its agents' keys. Function-call keys and caps bound the damage; they don't remove custody.</li>
          <li>In most games a referee posts the moves. Contracts check commitments and caps, not every rule of the game (each game's README says where).</li>
          <li>TEE signatures are checked cryptographically in Bazaar of Liars (quote, GPU attestation, signature) and partly in Realm Ledger and Parkwright (signer against the attestation); the other games store and count them.</li>
          <li>NEAR Intents has no official testnet: Bazaar runs its own deploy of the verifier contract.</li>
          <li>Storage locked per game is small. The thesis is about the slope, and only mainnet usage can show it.</li>
        </ul>
      </article>

      <section className="method">
        <h2>Method</h2>
        <p>
          Agent lists come from each game's setup script (Bazaar's from its contract's <code>agents</code> view). Keys come from{' '}
          <code>view_access_key_list</code>, balances and storage from <code>view_account</code>, and every other number from the view named beside it.
          Fogwater runs no agent accounts (its AI admirals are seats), so it adds play but no agents. Reads that fail are retried, then left out or shown
          from the snapshot, never guessed.
        </p>
        <pre>
          <code>{'git clone https://github.com/lopeselio/near-arcade && cd near-arcade\nnode scripts/thesis-data.mjs   # Node 22.18+; writes data/thesis.json and data/thesis-*.csv'}</code>
        </pre>
        {data.failed.length > 0 && live === 'done' && <p className="status">Didn't answer this time: {data.failed.join(', ')}.</p>}
      </section>
    </div>
  );
}

function Tile({ n, label, src }: { n: ReactNode; label: string; src: string }) {
  return (
    <div className="total tile">
      {n}
      <span>{label}</span>
      <small>{src}</small>
    </div>
  );
}

/** A horizontal bar chart: [label, value, colour, note]. Bars scale to the largest value in the chart (log10 with `log`). */
function Bars({ rows, stale, keys, unit = '', log = false }: { rows: [string, number, string, string][]; stale?: (k: string) => boolean; keys?: string[]; unit?: string; log?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  /** Log scale for counts that span orders of magnitude, so small games still show. */
  const share = (v: number) => (log ? Math.log10(v + 1) / Math.log10(max + 1) : v / max);
  return (
    <ul className="bars">
      {rows.map(([label, value, color, note], i) => (
        <li key={label} className={keys && stale?.(keys[i]) ? 'stale' : undefined}>
          <span className="bar-label">{label}</span>
          <span className="bar-track" aria-hidden="true">
            <i style={{ width: `${Math.max(1.5, share(value) * 100)}%`, background: color }} />
          </span>
          <b className="bar-value">{`${fmt(value, value < 10 && value % 1 ? 2 : 0)}${unit}`}</b>
          <small className="bar-note">{note}</small>
        </li>
      ))}
    </ul>
  );
}
