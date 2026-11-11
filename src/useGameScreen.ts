import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game } from './games';

/** Which game is on the screen; Escape closes it and focus goes back to the button that opened it. */
export function useGameScreen() {
  const [game, setGame] = useState<Game | null>(null);
  const opener = useRef<Element | null>(null);

  const open = useCallback((g: Game) => {
    setGame((cur) => {
      if (!cur) opener.current = document.activeElement;
      return g;
    });
  }, []);
  const close = useCallback(() => setGame(null), []);

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
