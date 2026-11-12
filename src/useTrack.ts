import { useCallback, useEffect, useState } from 'react';
import { TRACKS, type TrackId } from './tracks';

/** The track named by `?track=` in the address bar, if it is one we know. */
export function trackFromLocation(loc: Pick<Location, 'search'> = location): TrackId | null {
  const id = new URLSearchParams(loc.search).get('track');
  return TRACKS.some((t) => t.id === id) ? (id as TrackId) : null;
}

/**
 * The selected track chip, kept in `?track=` so a link can open the floor with it lit.
 * Picking replaces the history entry (chips aren't pages); the path is left alone, so /<slug> game routes are untouched.
 */
export function useTrack() {
  const [track, setTrack] = useState<TrackId | null>(() => trackFromLocation());

  const pick = useCallback((id: TrackId | null) => {
    const url = new URL(location.href);
    if (id) url.searchParams.set('track', id);
    else url.searchParams.delete('track');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    setTrack(id);
  }, []);

  useEffect(() => {
    const onPop = () => setTrack(trackFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return { track, pick };
}
