import { ARCADE_REPO, GAMES } from '../games';

export function Footer() {
  return (
    <footer>
      <p>Each game is its own project with its own repo, contract and server; this page only links to them. Testnet only.</p>
      <p>
        <a href="/thesis">The thesis</a>: why AI agents running game economies are demand for NEAR, with every number read live from these contracts.
      </p>
      <ul id="repos">
        {GAMES.map((g) => (
          <li key={g.slug}>
            <a href={g.repo} target="_blank" rel="noopener">
              {g.title} on GitHub
            </a>
          </li>
        ))}
        <li>
          <a href={ARCADE_REPO} target="_blank" rel="noopener">
            NEAR Arcade on GitHub
          </a>
        </li>
      </ul>
      <p className="credit">
        Made with{' '}
        <span className="heart" aria-label="love">
          ♥
        </span>{' '}
        by{' '}
        <a href="https://github.com/lopeselio" target="_blank" rel="noopener">
          lopeselio
        </a>{' '}
        · on X{' '}
        <a href="https://x.com/eliocodes" target="_blank" rel="noopener">
          @eliocodes
        </a>
      </p>
    </footer>
  );
}
