import type { CSSProperties } from 'react';
import { PLATES, type Game } from '../games';
import { isPhone, type AccountRow, type PanelState } from '../hooks';
import { CoinBox } from './CoinBox';
import { LivePanel } from './LivePanel';

interface Props {
  game: Game;
  panel: PanelState | undefined;
  accounts: AccountRow[] | null;
  onPlay: (g: Game) => void;
}

/** One game on the floor: marquee, device plate, CRT screen, control deck, blurb, live board, coin box. */
export function Cabinet({ game: g, panel, accounts, onPlay }: Props) {
  const play = () => onPlay(g);
  const [label, tip, icon] = PLATES[g.play ?? 'any'];
  const warning =
    g.play === 'desktop' && isPhone
      ? 'Full-size cabinet: this one needs a desktop. Bookmark it for the big screen, or press Insert coin anyway.'
      : g.play === 'mobile' && !isPhone
        ? 'Pocket cabinet: built for a phone. Open it on your phone, or press Insert coin anyway.'
        : null;
  return (
    // light: dark marquee text where the glow is bright
    <article className={`cab${g.light ? ' light' : ''}`} id={`cab-${g.slug}`} style={{ '--glow': g.glow } as CSSProperties}>
      <header className="marquee">
        <h2>{g.title}</h2>
        <small>{g.badge}</small>
        <span className={`plate${g.play && g.play !== 'any' ? ' solo' : ''}`} title={tip}>
          {icon} {label}
        </span>
      </header>
      {warning && <p className="warn">{warning}</p>}
      <div className="bezel">
        <div className="crt">
          <img src={g.thumb} alt={`${g.title} in play`} loading="lazy" width={480} height={300} />
          {/* mouse shortcut; the Insert coin button is the keyboard path */}
          <button className="play-over" onClick={play} tabIndex={-1} aria-hidden="true" />
        </div>
      </div>
      <div className="deck">
        <span className="stick" aria-hidden="true" />
        <span className="pads" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <button className="start" onClick={play} aria-label={`Insert coin: play ${g.title}`}>
          Insert coin
        </button>
      </div>
      <div className="about">
        <p>{g.blurb}</p>
        <div className="links">
          <a href={g.url} target="_blank" rel="noopener">
            Open in a new tab
          </a>
          <a href={g.repo} target="_blank" rel="noopener">
            Code on GitHub
          </a>
        </div>
      </div>
      <LivePanel state={panel} />
      <CoinBox rows={accounts && accounts.filter((r) => r.game.slug === g.slug)} />
    </article>
  );
}
