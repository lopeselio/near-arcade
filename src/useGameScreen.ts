import { useCallback, useEffect, useRef, useState } from 'react';
import { gameFromLocation, type Game } from './games';

/**
 * Which game is on the screen, kept in the address bar: a game plays at its own path (/sushi, /bazaar, …),
 * so deep links and hard refreshes open it, and Back, Escape or the close button return to the floor.
 * Focus goes back to the button that opened the game.
 */
export function useGameScreen() {
  const [game, setGame] = useState<Game | null>(() => gameFromLocation() ?? null);
  const opener = useRef<Element | null>(null);
  const shown = useRef(game);

  const show = useCallback((g: Game | null) => {
    if (g && !shown.current) opener.current = document.activeElement;
    shown.current = g;
    setGame(g);
  }, []);

  const open = useCallback(
    (g: Game) => {
      history.pushState({ slug: g.slug }, '', `/${g.slug}`);
      show(g);
    },
    [show],
  );

  const close = useCallback(() => {
    // Opened from the floor: step back so the browser's Forward reopens it. Arrived by deep link: just go to /.
    if (history.state?.slug) history.back();
    else {
      history.replaceState(null, '', '/');
      show(null);
    }
  }, [show]);

  useEffect(() => {
    const onPop = () => show(gameFromLocation() ?? null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [show]);

  useEffect(() => {
    document.title = game ? `${game.title} · NEAR Arcade` : 'NEAR Arcade';
    if (!game) {
      const el = opener.current;
      if (el instanceof HTMLElement && document.contains(el)) el.focus();
      opener.current = null;
    }
  }, [game]);

  useEffect(() => {
    if (!game) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [game, close]);

  return { game, open, close };
}
