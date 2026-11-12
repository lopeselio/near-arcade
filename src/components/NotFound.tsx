import { useEffect } from 'react';
import { GAMES } from '../games';
import { Footer } from './Footer';

/** Any path that isn't the floor, a game's /<slug> or /thesis: say so, and offer every real door. */
export function NotFound({ path }: { path: string }) {
  useEffect(() => {
    document.title = 'Not found · NEAR Arcade';
    // a soft 404 (the host serves the app for every path): keep it out of search results
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.append(meta);
    return () => meta.remove();
  }, []);
  return (
    <div className="wrap notfound">
      <header className="sign">
        <div className="bulbs" aria-hidden="true"></div>
        <h1>
          Out of <span>order</span>
        </h1>
        <p>
          There's no cabinet at <code>{path}</code>. Pick one of the nine games below, or walk back onto the floor.
        </p>
      </header>
      <main>
        <ul className="nf-games">
          {GAMES.map((g) => (
            <li key={g.slug}>
              <a href={`/${g.slug}`} style={{ borderColor: g.glow }}>
                {g.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="nf-links">
          <a href="/">The arcade floor</a> · <a href="/thesis">The thesis</a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
