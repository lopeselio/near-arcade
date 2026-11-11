import { useState } from 'react';
import { still } from '../hooks';
import type { TickerLine } from '../loaders';

/** One strip of real chain numbers, scrolling unless the visitor prefers reduced motion. */
export function Ticker({ lines, failed }: { lines: TickerLine[]; failed: boolean }) {
  const [paused, setPaused] = useState(false);
  const line = (t: TickerLine, i: number, copy = false) => (
    <li key={`${copy ? 'c' : 'o'}${i}`} aria-hidden={copy || undefined}>
      <b>{t.b}</b> {t.text}
    </li>
  );
  return (
    <section className={`ticker${paused ? ' paused' : ''}`} aria-label="Live numbers from NEAR testnet">
      <ul id="ticker">
        {lines.length ? (
          <>
            {lines.map((t, i) => line(t, i))}
            {/* The second copy only makes the scroll loop seamlessly: hidden from screen readers, skipped when still. */}
            {!still && lines.map((t, i) => line(t, i, true))}
          </>
        ) : (
          <li>{failed ? 'NEAR testnet didn’t answer. Reload to try again.' : 'Reading the chain…'}</li>
        )}
      </ul>
      <button className="pause" aria-pressed={paused} hidden={still} onClick={() => setPaused((p) => !p)}>
        {paused ? 'Play' : 'Pause'}
      </button>
    </section>
  );
}
