import { savedAccount } from '../passport/client';
import { who } from '../chain';

/** The arcade header's way in to /passport: names the remembered account, else invites a connect. */
export function PassportLink() {
  const saved = savedAccount();
  return (
    <nav className="pp-entry" aria-label="Arcade Passport">
      <a href={saved ? `/passport?account=${encodeURIComponent(saved.account)}` : '/passport'}>
        <span aria-hidden="true">🎟</span> {saved ? <>Passport · <b>{who(saved.account)}</b></> : <>Passport · <b>Connect wallet</b></>}
      </a>
    </nav>
  );
}
