import { useEffect, useState } from 'react';
import { fmt, who } from '../chain';
import { loadPassport, savedAccount } from '../passport/client';

/** The arcade header's way in to /passport: "🔥 2 · 85 pts" once an account is known, else an invite to connect. */
export function PassportLink() {
  const saved = savedAccount();
  const [score, setScore] = useState<{ streak: number; points: number } | null>(null);
  useEffect(() => {
    if (!saved) return;
    let on = true;
    loadPassport(saved.account, { apiOnly: true }).then(
      ({ passport: p }) => on && setScore({ streak: p.streak.current, points: p.points.total }),
      () => {},
    );
    return () => { on = false; };
  }, [saved?.account]);
  return (
    <nav className="pp-entry" aria-label="Arcade Passport">
      <a href={saved ? `/passport?account=${encodeURIComponent(saved.account)}` : '/passport'}>
        <span className="ico" aria-hidden="true">{saved ? '🔥' : '🎟'}</span>
        {saved ? (
          score ? (
            <>
              <b>{score.streak}</b> <span className="sep">·</span> <span className="pts">{fmt(score.points)}</span> pts <span className="sep">·</span> {who(saved.account)}
            </>
          ) : (
            <>Passport · <b>{who(saved.account)}</b></>
          )
        ) : (
          <>Your streak &amp; points · <b>Connect</b></>
        )}
      </a>
    </nav>
  );
}
