import { GAMES, type Game } from '../games';
import { TRACKS, trackDoc, type TrackId } from '../tracks';

/** One chip per hackathon track; pressing one lights the cabinets that prove it (pressing it again clears it). */
export function TrackBar({ track, onPick }: { track: TrackId | null; onPick: (id: TrackId | null) => void }) {
  const sel = TRACKS.find((t) => t.id === track);
  const count = sel ? GAMES.filter((g: Game) => g.tracks[sel.id]).length : 0;
  return (
    <section className="tracks" aria-labelledby="tracks-h">
      <h2 id="tracks-h">Hackathon tracks</h2>
      <div className="chips">
        {TRACKS.map((t) => (
          <button key={t.id} className="chip" aria-pressed={track === t.id} onClick={() => onPick(track === t.id ? null : t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="track-note" aria-live="polite">
        {sel ? (
          <>
            <b>{sel.label}:</b> {sel.claim}{' '}
            {sel.id === 'thesis' ? (
              <a href="/thesis">See the live numbers</a>
            ) : (
              <span>{`${count} cabinet${count === 1 ? '' : 's'} lit below.`}</span>
            )}{' '}
            <a href={trackDoc(sel.id)} target="_blank" rel="noopener">
              Evidence
            </a>
          </>
        ) : (
          'Pick a track to light up the cabinets that prove it, each with a one-line note on where to look.'
        )}
      </p>
    </section>
  );
}
