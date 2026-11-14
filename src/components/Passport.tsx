import { useEffect, useRef, useState, type FormEvent } from 'react';
import { fmt } from '../chain';
import { GAMES } from '../games';
import { still } from '../hooks';
import { POLL_MS, connectWallet, disconnectWallet, saveAccount, savedAccount, usePassport, type Via } from '../passport/client';
import { POINTS, addDays, dayOf, isAccountId, type Action, type GameEntry, type Passport as Data } from '../passport/core';

const NB = 'https://testnet.nearblocks.io';
const REPO = 'https://github.com/lopeselio/near-arcade';

/** The account in ?account=, else the one this browser remembered. */
function initialAccount(): { account: string | null; wallet: boolean } {
  const q = new URLSearchParams(location.search).get('account')?.trim().toLowerCase();
  if (q && isAccountId(q)) return { account: q, wallet: savedAccount()?.account === q && !!savedAccount()?.wallet };
  const s = savedAccount();
  return s && isAccountId(s.account) ? s : { account: null, wallet: false };
}

/** The Arcade Passport at /passport: one account's progress across all nine games, read-only. */
export function Passport() {
  const [{ account, wallet }, setWho] = useState(initialAccount);
  const [draft, setDraft] = useState(account ?? '');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const { passport, via, error, loading } = usePassport(account);

  useEffect(() => {
    document.title = account ? `${account} · Arcade Passport` : 'Arcade Passport · NEAR Arcade';
    const url = new URL(location.href);
    if (account) url.searchParams.set('account', account);
    else url.searchParams.delete('account');
    history.replaceState(null, '', url);
  }, [account]);

  const show = (id: string, viaWallet: boolean) => {
    setWho({ account: id, wallet: viaWallet });
    setDraft(id);
    saveAccount({ account: id, wallet: viaWallet });
  };

  const onView = (e: FormEvent) => {
    e.preventDefault();
    const id = draft.trim().toLowerCase();
    if (isAccountId(id)) show(id, false);
  };

  const onConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      show(await connectWallet(), true);
    } catch (e) {
      setConnectError((e as Error)?.message || 'the wallet closed without sharing an account');
    } finally {
      setConnecting(false);
    }
  };

  const onLeave = async () => {
    if (wallet) await disconnectWallet();
    saveAccount(null);
    setWho({ account: null, wallet: false });
    setDraft('');
  };

  const draftOk = isAccountId(draft.trim().toLowerCase());

  return (
    <div className="wrap passport">
      <nav className="thesis-nav">
        <a href="/">← The arcade</a>
        <a href="#how-points">How points work</a>
        <a href="#sources">Where the numbers come from</a>
      </nav>
      <header className="pp-head">
        <h1>
          Arcade <span>Passport</span>
        </h1>
        <p className="lede">
          Your progress across all nine games, a daily streak and points, read live from NEAR testnet. Connecting a wallet only tells this page your account
          name: nothing is signed, sent or stored onchain.
        </p>
      </header>

      <section className="pp-who" aria-label="Account">
        {account ? (
          <div className="pp-account">
            <span className="pp-chip" title={wallet ? 'connected with a NEAR wallet' : 'viewing a public account'}>
              {wallet ? '🔗' : '👁'} <b>{account}</b>
            </span>
            <a href={`${NB}/address/${account}`} target="_blank" rel="noopener">
              on NearBlocks
            </a>
            <button type="button" className="pp-btn ghost" onClick={onLeave}>
              {wallet ? 'Disconnect' : 'Clear'}
            </button>
          </div>
        ) : (
          <button type="button" className="pp-btn" onClick={onConnect} disabled={connecting}>
            {connecting ? 'Opening your wallet…' : 'Connect NEAR wallet'}
          </button>
        )}
        <form className="pp-view" onSubmit={onView}>
          <label htmlFor="pp-acct">{account ? 'View another account' : 'or view any account'}</label>
          <div>
            <input
              id="pp-acct"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="eliocodes.testnet"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
            />
            <button type="submit" className="pp-btn small" disabled={!draftOk}>
              View
            </button>
          </div>
          {!account && (
            <p className="pp-try">
              Try <button type="button" className="linkish" onClick={() => show('eliocodes.testnet', false)}>eliocodes.testnet</button> or{' '}
              <button type="button" className="linkish" onClick={() => show('sushiman1.testnet', false)}>sushiman1.testnet</button>
            </p>
          )}
        </form>
        {connectError && <p className="pp-err" role="alert">{connectError}</p>}
      </section>

      {account && <Status passport={passport} via={via} error={error} loading={loading} />}
      {passport && passport.account === account ? <Board p={passport} /> : account && !error && <p className="pp-loading">Reading nine contracts and NearBlocks…</p>}

      <Explainer />
    </div>
  );
}

function Status({ passport, via, error, loading }: { passport: Data | null; via: Via | null; error: string | null; loading: boolean }) {
  return (
    <p className="pp-status" aria-live="polite">
      <i className={`pp-dot${error ? ' bad' : ''}`} aria-hidden="true"></i>
      {error
        ? `Couldn’t read this time: ${error}. Retrying every ${POLL_MS / 1000} s.`
        : passport
          ? `Live: refreshes every ${POLL_MS / 1000} s while this tab is open. Last read ${new Date(passport.updatedAt).toUTCString().slice(17, 25)} UTC by ${via}${loading ? ' (refreshing…)' : ''}.`
          : 'Reading…'}
    </p>
  );
}

function Board({ p }: { p: Data }) {
  const today = dayOf(Date.now());
  const todays = p.activity.filter((a) => dayOf(a.at) === today);
  const played = p.games.filter((g) => g.played).length;
  return (
    <>
      <div className="pp-top">
        <Streak p={p} today={today} />
        <Points p={p} />
      </div>

      <section aria-labelledby="pp-cabs">
        <h2 id="pp-cabs" className="pp-h2">
          Cabinets played <b>{played}</b>/9
        </h2>
        <ul className="pp-cabs">
          {p.games.map((g) => (
            <Tile key={g.id} g={g} today={today} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="pp-feed" className="pp-feed">
        <h2 id="pp-feed" className="pp-h2">
          Today <small>{todays.length ? `${todays.length} onchain action${todays.length === 1 ? '' : 's'}` : 'nothing yet'}</small>
        </h2>
        {p.activityError && <p className="pp-warn">Activity dates are missing right now ({p.activityError}). Stats still come from the contracts; the streak may read low until the next refresh.</p>}
        {p.activity.length ? (
          <ol className="pp-acts">
            {(todays.length ? todays : p.activity).slice(0, 12).map((a, i) => (
              <Act key={`${a.tx}-${a.what}-${i}`} a={a} />
            ))}
          </ol>
        ) : (
          !p.activityError && <p className="pp-dim">No onchain actions from this account to a game contract yet. Guest play isn’t tied to an account, so sign in inside a game to have it count.</p>
        )}
        {!todays.length && p.activity.length > 0 && <p className="pp-dim">Nothing today yet; above are the most recent actions.</p>}
      </section>
    </>
  );
}

function Streak({ p, today }: { p: Data; today: string }) {
  const set = new Set(p.days);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const { current, best } = p.streak;
  return (
    <section className="pp-card pp-streak" aria-label="Streak">
      <div className="pp-fire">
        <span className={`pp-flame${current ? '' : ' out'}`} aria-hidden="true">🔥</span>
        <div>
          <b className="pp-big">{current}</b>
          <span>day streak</span>
        </div>
      </div>
      <ol className="pp-week" aria-label="The last seven days">
        {week.map((d) => {
          const on = set.has(d);
          const wd = new Date(`${d}T00:00:00Z`).toUTCString().slice(0, 2);
          return (
            <li key={d} className={`${on ? 'on' : ''}${d === today ? ' today' : ''}`} title={`${d}${on ? ': played' : ''}`}>
              <span className="pp-wd">{wd}</span>
              <span className="pp-day" aria-label={on ? 'played' : 'not played'}>{on ? '🔥' : ''}</span>
            </li>
          );
        })}
      </ol>
      <p className="pp-streak-msg">
        {p.streak.today
          ? 'You played today: streak extended. Come back tomorrow to keep it going.'
          : current
            ? 'Play today to keep your streak!'
            : 'Play any of the nine games today to start a streak.'}
      </p>
      <p className="pp-dim">Best streak: <b>{best}</b> day{best === 1 ? '' : 's'} · days are UTC</p>
    </section>
  );
}

/** Counts up to a new value (instantly with reduced motion). */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (still || from.current === value) { setShown(value); from.current = value; return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 900);
      setShown(Math.round(a + (value - a) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(shown)}</>;
}

function Points({ p }: { p: Data }) {
  const [bump, setBump] = useState(false);
  const last = useRef(p.points.total);
  useEffect(() => {
    if (p.points.total !== last.current) {
      last.current = p.points.total;
      if (!still) { setBump(true); const t = setTimeout(() => setBump(false), 1200); return () => clearTimeout(t); }
    }
  }, [p.points.total]);
  return (
    <section className="pp-card pp-points" aria-label="Points">
      <h2 className="pp-h3">Arcade points</h2>
      <div className={`pp-led${bump ? ' bump' : ''}`} aria-live="polite">
        <CountUp value={p.points.total} />
      </div>
      <ul className="pp-break">
        {p.points.breakdown.map((l) => (
          <li key={l.key} className={l.points ? '' : 'zero'}>
            <span>
              {l.key === 'allNine' ? (l.count ? 'Played all nine' : 'Play all nine for a bonus') : `${fmt(l.count)} ${l.label}`}
              <small> × {l.each}</small>
            </span>
            <b>{fmt(l.points)}</b>
          </li>
        ))}
      </ul>
      <p className="pp-dim">
        A display score for the arcade only: not a token, not stored onchain, not redeemable. <a href="#how-points">How points work</a>
      </p>
    </section>
  );
}

const fmtStat = (v: number | string) => (typeof v === 'number' ? fmt(v, Number.isInteger(v) ? 0 : 2) : v);

function Tile({ g, today }: { g: GameEntry; today: string }) {
  const game = GAMES.find((x) => x.slug === g.id);
  const stats = Object.entries(g.stats).filter(([, v]) => v !== 0 && v !== '—').slice(0, 4);
  return (
    <li className={`pp-cab${g.played ? ' lit' : ''}${game && 'light' in game && game.light ? ' light' : ''}`} style={{ ['--glow' as string]: g.glow }}>
      <div className="pp-marq">
        <h3>{g.name}</h3>
        <small>{g.played ? (g.lastPlayed ? (g.lastPlayed === today ? 'played today' : `last played ${g.lastPlayed}`) : 'played (no date recorded)') : 'not played yet'}</small>
      </div>
      <dl className="pp-stats">
        {g.wins !== undefined && g.played && (
          <div>
            <dt>wins</dt>
            <dd>{fmt(g.wins)}</dd>
          </div>
        )}
        {g.played &&
          stats.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{fmtStat(v)}</dd>
            </div>
          ))}
        {g.played && g.days.length > 0 && (
          <div>
            <dt>days played</dt>
            <dd>{g.days.length}</dd>
          </div>
        )}
      </dl>
      {g.error && <p className="pp-cab-err">Couldn’t read: {g.error}</p>}
      <details className="pp-dates">
        <summary>Where the dates come from</summary>
        <p>{g.dates}</p>
      </details>
      <a className="pp-play" href={g.url} target="_blank" rel="noopener">
        {g.played ? 'Play again' : 'Play'} ▸
      </a>
    </li>
  );
}

function Act({ a }: { a: Action }) {
  const g = GAMES.find((x) => x.slug === a.game);
  const t = new Date(a.at);
  return (
    <li style={{ ['--glow' as string]: g?.glow ?? '#3cf2ff' }}>
      <time dateTime={t.toISOString()}>{dayOf(a.at) === dayOf(Date.now()) ? t.toUTCString().slice(17, 22) : t.toISOString().slice(5, 10)}</time>
      <span className="pp-act-game">{g?.title ?? a.game}</span>
      <code>{a.what}</code>
      {a.tx && (
        <a href={`${NB}/txns/${a.tx}`} target="_blank" rel="noopener" aria-label={`${a.what} on NearBlocks`}>
          tx ↗
        </a>
      )}
    </li>
  );
}

function Explainer() {
  return (
    <>
      <section id="how-points" className="pp-explain">
        <h2 className="pp-h2">How points work</h2>
        <ul>
          <li><b>+{POINTS.gameDay}</b> per game-day: each game, on each UTC day you have a dated action in it. A game your account has a record in but no dated action counts once.</li>
          <li><b>+{POINTS.win}</b> per win, in the games whose contracts record wins (Sushi Sabotage, Realm Ledger, Fogwater, Emberfall, Inside Job, Kraterra, Clawtide).</li>
          <li><b>+{POINTS.streakDay}</b> × your current streak length.</li>
          <li><b>+{POINTS.allNine}</b> once you have played all nine games.</li>
        </ul>
        <p>
          Points are an arcade display score, worked out fresh from the chain every time this page reads it. They are not a token, are not stored onchain or
          anywhere else, and can’t be redeemed for anything.
        </p>
      </section>
      <section id="sources" className="pp-explain">
        <h2 className="pp-h2">Where the numbers come from</h2>
        <ul>
          <li><b>Stats and wins</b>: each game’s contract views, over public testnet RPC (e.g. <code>stats_of</code> on fogwater.testnet, inside-job.testnet and kraterra.testnet, <code>get_record</code> on clawtide.testnet, <code>warden_of</code> + <code>get_warden</code> on emberfall.testnet, <code>chef_of</code> + <code>get_token</code> on sushi-sabotage.testnet, <code>player_state</code> + <code>cred_of</code> on v3.bazaar-liars.testnet, <code>list_parks</code> on park.parkwright.testnet) and Realm Ledger’s campaign list.</li>
          <li><b>Days and the activity feed</b>: the NearBlocks testnet API. A day counts when your account sent a receipt to a game contract (a relayed, gasless move counts: its inner receipt comes from you, not the relayer) or was minted a game token (PEARL, EMBER, a chef, Warden or munition NFT). Sushi Sabotage’s daily claim, Bazaar of Liars’ cred streak and Parkwright’s park creation dates are read from the contracts.</li>
          <li><b>Not counted</b>: guest play (it isn’t tied to an account), moves the game server signs for you (Bazaar of Liars haggles, referee settlements) except where a game stores the day itself, AI agents’ actions, and receipts older than the last 300 NearBlocks lists for your account.</li>
          <li>Everything is read-only; the page never asks a wallet to sign. Source: <a href={`${REPO}/blob/main/src/passport/core.ts`} target="_blank" rel="noopener">src/passport/core.ts</a>.</li>
        </ul>
      </section>
    </>
  );
}
