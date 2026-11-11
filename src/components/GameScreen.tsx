import { useEffect, useRef } from 'react';
import type { Game } from '../games';

/** The game in a full-window frame over the floor. Always mounted; `game` null hides it and blanks the frame. */
export function GameScreen({ game, onClose }: { game: Game | null; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (game) closeBtn.current?.focus();
  }, [game]);
  return (
    <div id="screen" className={game ? 'on' : undefined} role="dialog" aria-modal="true" aria-label="Game">
      <nav>
        <b id="screenTitle">{game?.title}</b>
        <small>Wallet sign-in works best in a full tab</small>
        <a id="screenOpen" href={game?.url} target="_blank" rel="noopener">
          Open full tab
        </a>
        <button id="screenClose" ref={closeBtn} onClick={onClose}>
          Back to the arcade
        </button>
      </nav>
      <iframe id="screenFrame" title="Game" src={game?.url ?? 'about:blank'} allow="fullscreen; clipboard-write; autoplay" allowFullScreen />
    </div>
  );
}
