import { Cabinet } from './components/Cabinet';
import { ChangeMachine } from './components/ChangeMachine';
import { Footer } from './components/Footer';
import { GameScreen } from './components/GameScreen';
import { Sign } from './components/Sign';
import { Ticker } from './components/Ticker';
import { GAMES, type Game, type Slug } from './games';
import { tickerLines, useAccounts, usePanels } from './hooks';
import { useGameScreen } from './useGameScreen';

export function App() {
  const panels = usePanels();
  const accounts = useAccounts();
  const ticker = tickerLines(panels, accounts);
  const screen = useGameScreen();
  return (
    <>
      {/* inert while a game is on screen: the arcade behind it can't take focus */}
      <div className="wrap" inert={!!screen.game}>
        <Sign />
        <Ticker lines={ticker.lines} failed={ticker.failed} />
        <main className="floor" id="floor" aria-label="Games">
          {GAMES.map((g: Game) => (
            <Cabinet key={g.slug} game={g} panel={panels[g.slug as Slug]} accounts={accounts} onPlay={screen.open} />
          ))}
        </main>
        <ChangeMachine rows={accounts} />
        <Footer />
      </div>
      <GameScreen game={screen.game} onClose={screen.close} />
    </>
  );
}
