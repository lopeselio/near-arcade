import { explorer, fmt } from '../chain';
import type { AccountRow } from '../hooks';

/** The game's accounts inside its cabinet, with a storage gauge on each contract. */
export function CoinBox({ rows }: { rows: AccountRow[] | null }) {
  return (
    <details className="coinbox">
      <summary>
        Game accounts on NEAR: <b>{rows ? `${fmt(rows.reduce((a, r) => a + (r.missing ? 0 : r.balance), 0), 2)} NEAR` : '…'}</b>
      </summary>
      <ul>
        {rows?.map((r) => (
          <li className="acct" key={r.id}>
            <a href={explorer(r.id)} target="_blank" rel="noopener">
              {r.id}
            </a>
            <em>
              {r.missing ? 'n/a' : `${fmt(r.balance, 2)} NEAR`}
              {!r.missing && r.cached && <small className="cached" title="Last good read; the chain didn't answer just now">cached</small>}
            </em>
            <small>{r.contract && !r.missing ? `${r.role}, ${fmt(Math.max(0, r.free), 2)} NEAR free for storage` : r.role}</small>
            {r.contract && !r.missing && r.balance > 0 && (
              <div className="gauge" title="Share of the balance still free for storage">
                <i style={{ width: `${Math.max(2, Math.min(100, (r.free / r.balance) * 100))}%` }} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
