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
      <p>
        {count} browser games on NEAR testnet. Your rivals are AI agents with their own wallets, hidden moves are sealed onchain and opened later, and
        every score below is read live from the chain. Play as a guest, or sign in with a NEAR wallet.
      </p>
    </header>
  );
}
