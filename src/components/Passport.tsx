import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
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

/** A small ⓘ that opens a note in place (no JS: a <details>). */
function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="tip">
      <summary aria-label={label} title={label}>ⓘ</summary>
      <div className="tip-body">{children}</div>
    </details>
  );
}

/** The Arcade Passport at /passport: one account's progress across all nine games, read-only. */
export function Passport() {
  const [{ account, wallet }, setWho] = useState(initialAccount);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState('');
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
    setAsking(false);
    setDraft('');
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
      const id = await connectWallet();
      if (id) show(id, true);
    } catch (e) {
      setConnectError((e as Error)?.message || 'the wallet closed without sharing an account');
    } finally {
      setConnecting(false);
    }
  };
  const onLeave = async () => {
    if (wallet) await disconnectWallet();
    saveAccount(null);
    setAsking(false);
    setWho({ account: null, wallet: false });
  };

  const viewForm = (
    <form className="pp-view" onSubmit={onView}>
      <input
        aria-label="NEAR testnet account id"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="name.testnet"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
      />
      <button type="submit" className="pp-btn small" disabled={!isAccountId(draft.trim().toLowerCase())}>
        View
      </button>
    </form>
  );

  return (
    <div className="wrap passport">
      <header className="pp-bar">
        <a href="/" className="pp-back" aria-label="Back to the arcade">←</a>
        <h1>
          Arcade <span>Passport</span>
        </h1>
        {account && (
          <div className="pp-who">
            <span className="pp-chip" title={wallet ? 'Connected with a NEAR wallet' : 'Viewing a public account'}>
              {wallet ? '🔗' : '👁'} <b>{account}</b>
            </span>
            <button type="button" className="pp-btn ghost" onClick={() => setAsking((v) => !v)} aria-expanded={asking}>
              Change
            </button>
          </div>
        )}
      </header>

      {account && asking && (
        <div className="pp-change">
          {viewForm}
          {wallet ? (
            <button type="button" className="pp-btn ghost" onClick={onLeave}>Disconnect</button>
          ) : (
            <>
              <button type="button" className="pp-btn small amber" onClick={onConnect} disabled={connecting}>
                {connecting ? 'Opening wallet…' : 'Connect wallet'}
              </button>
              <button type="button" className="linkish" onClick={onLeave}>Clear</button>
            </>
          )}
        </div>
      )}

      {!account && (
        <section className="pp-empty">
          <span className="pp-flame big" aria-hidden="true">🔥</span>
          <h2>Your streak across nine games</h2>
          <p>Streak, points and cabinets for any NEAR testnet account. Read-only: nothing is signed.</p>
          <button type="button" className="pp-btn" onClick={onConnect} disabled={connecting}>
            {connecting ? 'Opening your wallet…' : 'Connect NEAR wallet'}
          </button>
          {asking ? viewForm : (
            <button type="button" className="linkish" onClick={() => setAsking(true)}>View any account</button>
          )}
          <p className="pp-try">
            Try <button type="button" className="linkish" onClick={() => show('eliocodes.testnet', false)}>eliocodes.testnet</button>
          </p>
        </section>
      )}
      {connectError && <p className="pp-err" role="alert">{connectError}</p>}

      {account && <Pill passport={passport} via={via} error={error} loading={loading} />}
      {passport && passport.account === account ? <Board p={passport} /> : account && !error && <Skeleton />}

      <About p={passport && passport.account === account ? passport : null} />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="pp-top" aria-label="Loading">
      <div className="pp-card pp-skel" />
      <div className="pp-card pp-skel" />
    </div>
  );
}

/** "● Live · updated 12 s ago", ticking. */
function Pill({ passport, via, error, loading }: { passport: Data | null; via: Via | null; error: string | null; loading: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ago = passport ? Math.max(0, Math.round((now - passport.updatedAt) / 1000)) : 0;
  const text = error ? 'Retrying…' : !passport ? 'Reading the chain…' : loading ? 'Refreshing…' : `Live · updated ${ago < 60 ? `${ago} s` : `${Math.round(ago / 60)} min`} ago`;
  return (
    <p className={`pp-pill${error ? ' bad' : ''}`} title={error ?? (via ? `Read by ${via}; refreshes every ${POLL_MS / 1000} s while this tab is open` : '')}>
      <i aria-hidden="true" /> {text}
    </p>
  );
}

function Board({ p }: { p: Data }) {
  const today = dayOf(Date.now());
  const partial = [...(p.activityError ? [`activity dates: ${p.activityError}`] : []), ...p.games.filter((g) => g.error).map((g) => `${g.name}: ${g.error}`)];
  return (
    <>
      <div className="pp-top">
        <Streak p={p} today={today} />
        <Points p={p} />
      </div>
      <Collection p={p} />
      {partial.length > 0 && (
        <details className="pp-partial">
          <summary>Some data is partial right now</summary>
          <ul>{partial.map((x) => <li key={x}>{x}</li>)}</ul>
        </details>
      )}
      <ul className="pp-cabs" aria-label="The nine games">
        {p.games.map((g) => <Tile key={g.id} g={g} today={today} />)}
      </ul>
      <Feed p={p} today={today} />
    </>
  );
}

function Streak({ p, today }: { p: Data; today: string }) {
  const set = new Set(p.days);
  // this week, Monday first (UTC)
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));
  const { current, best } = p.streak;
  return (
    <section className="pp-card pp-streak" aria-label={`${current}-day streak`}>
      <div className="pp-fire">
        <span className={`pp-flame${current ? '' : ' out'}`} aria-hidden="true">🔥</span>
        <div>
          <b className="pp-big">{current}</b>
          <span className="pp-label">day streak</span>
        </div>
        <span className="pp-best" title="Best streak">🏅 best {best}</span>
      </div>
      <ol className="pp-week">
        {week.map((d, i) => {
          const on = set.has(d);
          return (
            <li key={d} className={`${on ? 'on' : ''}${d === today ? ' today' : ''}${d > today ? ' future' : ''}`} title={`${d}${on ? ': played' : ''}`}>
              <span className="pp-bubble" aria-label={`${d}${on ? ', played' : ''}`}>{on ? '🔥' : ''}</span>
              <span className="pp-wd">{'MTWTFSS'[i]}</span>
            </li>
          );
        })}
      </ol>
      {!p.streak.today && <p className="pp-nudge">{current ? 'Play today to keep it alive' : 'Play today to start a streak'}</p>}
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

const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

function Points({ p }: { p: Data }) {
  const [bump, setBump] = useState(false);
  const last = useRef(p.points.total);
  useEffect(() => {
    if (p.points.total !== last.current) {
      last.current = p.points.total;
      if (!still) { setBump(true); const t = setTimeout(() => setBump(false), 1200); return () => clearTimeout(t); }
    }
  }, [p.points.total]);
  const line = (k: string) => p.points.breakdown.find((l) => l.key === k)!;
  const played = p.games.filter((g) => g.played).length;
  const chips: [string, number, string][] = [
    ['🕹', line('gameDays').points, plural(line('gameDays').count, 'game-day')],
    ['🏆', line('wins').points, plural(line('wins').count, 'win')],
    ['🔥', line('streak').points, `${line('streak').count}-day streak`],
    ['⭐', line('allNine').points, line('allNine').count ? 'all 9 played' : `${played}/9 → +${POINTS.allNine}`],
  ];
  return (
    <section className="pp-card pp-points" aria-label={`${p.points.total} arcade points`}>
      <div className="pp-points-head">
        <h2 className="pp-h3">Arcade points</h2>
        <Tip label="How points work">
          <b>How points work</b>
          <ul>
            <li>+{POINTS.gameDay} per game-day (a game, on a UTC day you played it)</li>
            <li>+{POINTS.win} per win recorded onchain</li>
            <li>+{POINTS.streakDay} × current streak</li>
            <li>+{POINTS.allNine} for playing all nine</li>
          </ul>
          <p>A display score only: not a token, not stored anywhere, not redeemable.</p>
        </Tip>
      </div>
      <div className={`pp-led${bump ? ' bump' : ''}`}>
        <CountUp value={p.points.total} />
        <small>pts</small>
      </div>
      <ul className="pp-chips">
        {chips.map(([icon, pts, label]) => (
          <li key={label} className={pts ? '' : 'zero'} title={`+${pts} points`}>
            <span aria-hidden="true">{icon}</span> {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The 9-game collection: one lit segment per game played, with the +100 bonus as the goal. */
function Collection({ p }: { p: Data }) {
  const played = p.games.filter((g) => g.played).length;
  const done = played === 9;
  return (
    <section className={`pp-collect${done ? ' done' : ''}`} aria-label={`${played} of 9 games played`}>
      <div className="pp-collect-head">
        <b>{played} of 9 played</b>
        <span>{done ? `🏆 Collection complete · +${POINTS.allNine}` : `🏆 ${9 - played} more for +${POINTS.allNine}`}</span>
      </div>
      <ol className="pp-segs">
        {p.games.map((g) => (
          <li key={g.id} className={g.played ? 'on' : ''} style={{ '--glow': g.glow } as CSSProperties} title={`${g.name}${g.played ? ' ✓' : ''}`} />
        ))}
      </ol>
    </section>
  );
}

/** The one or two numbers that say the most about a game. */
const PRIMARY: Record<string, [key: string, one: string, many?: string]> = {
  sushi: ['shifts', 'shift'],
  bazaar: ['coins', 'coin'],
  realm: ['campaigns', 'campaign'],
  parkwright: ['parks', 'park'],
  fogwater: ['games', 'game'],
  emberfall: ['matches', 'match', 'matches'],
  'inside-job': ['shifts', 'shift'],
  kraterra: ['duels', 'duel'],
  clawtide: ['rounds', 'round'],
};
const SECOND: Record<string, [key: string, one: string, many?: string]> = { bazaar: ['cred XP', 'XP', 'XP'], parkwright: ['CR earned', 'CR', 'CR'] };

function tinyStats(g: GameEntry): string {
  const out: string[] = [];
  const [k, one, many] = PRIMARY[g.id] ?? [];
  const v = k ? g.stats[k] : undefined;
  if (typeof v === 'number' && v > 0) out.push(plural(v, one, many));
  if (g.wins !== undefined && (g.wins > 0 || out.length)) out.push(plural(g.wins, 'win'));
  else if (SECOND[g.id]) {
    const [k2, o2, m2] = SECOND[g.id];
    const v2 = g.stats[k2];
    if (typeof v2 === 'number' && v2 > 0) out.push(plural(v2, o2, m2));
  }
  if (!out.length && g.days.length) out.push(plural(g.days.length, 'day'));
  return out.slice(0, 2).join(' · ');
}

function Tile({ g, today }: { g: GameEntry; today: string }) {
  const game = GAMES.find((x) => x.slug === g.id);
  return (
    <li className={`pp-cab${g.played ? ' lit' : ''}`} style={{ '--glow': g.glow } as CSSProperties}>
      <div className="pp-thumb">
        {game && <img src={game.thumb} alt="" loading="lazy" width={480} height={300} />}
        {g.played && <span className="pp-check" aria-label="played">✓</span>}
        {g.lastPlayed === today && <span className="pp-today">today</span>}
      </div>
      <div className="pp-cab-body">
        <h3>{g.name}</h3>
        <p className="pp-tiny">
          {g.played ? tinyStats(g) || 'played' : 'not played yet'}
          {g.error ? <span title={`Couldn’t read: ${g.error}`}> ⚠</span> : null}
        </p>
        <a className={`pp-play${g.played ? '' : ' first'}`} href={g.url} target="_blank" rel="noopener" aria-label={`Play ${g.name}`}>
          ▶ Play
        </a>
      </div>
    </li>
  );
}

const ICON: Record<Action['source'], string> = { receipt: '⚡', ft: '🪙', nft: '🎴' };

function Feed({ p, today }: { p: Data; today: string }) {
  const [all, setAll] = useState(false);
  const todays = p.activity.filter((a) => dayOf(a.at) === today);
  const rows = todays.length ? todays : p.activity;
  if (!rows.length) return null;
  const shown = rows.slice(0, all ? 20 : 5);
  return (
    <section className="pp-feed" aria-labelledby="pp-feed-h">
      <h2 id="pp-feed-h" className="pp-h2">
        {todays.length ? 'Today' : 'Latest'} <small>{plural(rows.length, 'action')}</small>
      </h2>
      <ol className="pp-acts">
        {shown.map((a, i) => {
          const g = GAMES.find((x) => x.slug === a.game);
          const t = new Date(a.at);
          const when = <time dateTime={t.toISOString()}>{dayOf(a.at) === today ? t.toUTCString().slice(17, 22) : t.toISOString().slice(5, 10)}</time>;
          return (
            <li key={`${a.tx}-${a.what}-${i}`} style={{ '--glow': g?.glow ?? '#3cf2ff' } as CSSProperties}>
              <span className="pp-act-icon" aria-hidden="true">{ICON[a.source]}</span>
              <span className="pp-act-main">
                <b>{g?.title ?? a.game}</b> <code>{a.what}</code>
              </span>
              {a.tx ? (
                <a href={`${NB}/txns/${a.tx}`} target="_blank" rel="noopener" title="Open the transaction on NearBlocks">
                  {when} ↗
                </a>
              ) : (
                when
              )}
            </li>
          );
        })}
      </ol>
      {rows.length > 5 && (
        <button type="button" className="linkish pp-more" onClick={() => setAll((v) => !v)}>
          {all ? 'Show less' : `Show ${Math.min(rows.length, 20) - 5} more`}
        </button>
      )}
    </section>
  );
}

/** Everything the main view leaves out: points rules, sources, gaps, per-game dates. */
function About({ p }: { p: Data | null }) {
  return (
    <details className="pp-about" id="about">
      <summary>About the data</summary>
      <ul>
        <li><b>Read-only.</b> A wallet is asked only for its account name; nothing is signed or stored.</li>
        <li><b>Points</b> are a display score: +{POINTS.gameDay} per game-day, +{POINTS.win} per win, +{POINTS.streakDay} × streak, +{POINTS.allNine} for all nine. Not a token, not stored onchain, not redeemable.</li>
        <li><b>Stats and wins</b> come from each game’s contract views over public testnet RPC.</li>
        <li><b>Days and the feed</b> come from NearBlocks: receipts you sent to a game contract (relayed, gasless moves count for you) and game tokens minted to you. Days are UTC; a streak survives until you miss a whole day.</li>
        <li><b>Not counted:</b> guest play, moves a game server or referee signs for you (unless the game stores the day), AI agents’ actions, receipts beyond your newest 300.</li>
      </ul>
      {p && (
        <dl className="pp-dates">
          {p.games.map((g) => (
            <div key={g.id}>
              <dt>{g.name}</dt>
              <dd>
                {g.dates}.{g.note ? ` ${g.note}` : ''}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p>
        Source: <a href={`${REPO}/blob/main/src/passport/core.ts`} target="_blank" rel="noopener">src/passport/core.ts</a> · JSON: <code>/api/passport/&lt;account&gt;</code>
      </p>
    </details>
  );
}
