import { GAMES } from '../games';

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

export function Sign() {
  const count = WORDS[GAMES.length] ?? String(GAMES.length);
  return (
    <header className="sign">
      <div className="bulbs" aria-hidden="true"></div>
      <h1>
        NEAR <span>Arcade</span>
      </h1>
      <div className="sign-line">
        {count} browser games on NEAR testnet, every score read live from the chain.{' '}
        <details className="more">
          <summary>More</summary>
          Your rivals are AI agents with their own wallets, and hidden moves are sealed onchain and opened later. Play as a guest, or sign in with a NEAR
          wallet.
        </details>
      </div>
    </header>
  );
}
