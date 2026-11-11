import type { PanelState } from '../hooks';

/** The cabinet's high-score board (LED on black) and its three stats, read from the game's contract. */
export function LivePanel({ state }: { state: PanelState | undefined }) {
  const panel = state?.status === 'ok' ? state.panel : null;
  return (
    <>
      <div className="board">
        <h3>{panel?.title ?? 'High scores'}</h3>
        <ol>
          {!state ? (
            <li className="empty">Reading the chain…</li>
          ) : !panel ? (
            <li className="empty">The chain didn’t answer. Reload to try again.</li>
          ) : panel.rows.length ? (
            panel.rows.map(([name, score], i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <span title={name}>{name}</span>
                <span>{score}</span>
              </li>
            ))
          ) : (
            <li className="empty">{panel.empty ?? 'No scores yet.'}</li>
          )}
        </ol>
      </div>
      <div className="stats">
        {panel?.stats.map(([n, label], i) => (
          <div key={i}>
            <b>{n}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
