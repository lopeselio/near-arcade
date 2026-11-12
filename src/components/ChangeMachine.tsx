import { explorer, fmt } from '../chain';
import type { AccountRow } from '../hooks';

/** Every key account in one place: totals, then one row per account. */
export function ChangeMachine({ rows }: { rows: AccountRow[] | null }) {
  const live = rows?.flatMap((r) => (r.missing ? [] : [r])) ?? [];
  const contracts = live.filter((r) => r.contract);
  return (
    <section className="change" aria-labelledby="change-h">
      <h2 id="change-h">Change machine</h2>
      <p>
        The NEAR testnet accounts that run each game, with their balances right now. Contracts pay for their own storage, so the last column shows how
        much of each contract's balance is still free for new games.
      </p>
      <div className="totals" id="totals">
        {rows && (
          <>
            <div className="total">
              <b>{fmt(live.reduce((a, r) => a + r.balance, 0), 1)}</b>
              <span>{`NEAR held by ${live.length} game accounts`}</span>
            </div>
            <div className="total">
              <b>{fmt(contracts.length)}</b>
              <span>contracts running the games</span>
            </div>
            <div className="total">
              <b>{`${fmt(contracts.reduce((a, r) => a + r.storage, 0) / 1e6, 2)} MB`}</b>
              <span>of game state stored onchain</span>
            </div>
          </>
        )}
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th className="role">Role</th>
              <th>Game</th>
              <th>Balance</th>
              <th>Free for storage</th>
            </tr>
          </thead>
          <tbody id="accounts">
            {rows ? (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="dot" style={{ background: r.game.glow }} />
                    <a href={explorer(r.id)} target="_blank" rel="noopener">
                      {r.id}
                    </a>
                  </td>
                  <td className="role">{r.role}</td>
                  <td>{r.game.title}</td>
                  <td className="num">
                    {r.missing ? 'unavailable' : `${fmt(r.balance, 2)} NEAR`}
                    {!r.missing && r.cached && <small className="cached" title="Last good read; the chain didn't answer just now">cached</small>}
                  </td>
                  <td className="num">{r.contract && !r.missing ? `${fmt(Math.max(0, r.free), 2)} NEAR` : ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>Reading balances…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
