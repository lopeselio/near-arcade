import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { NotFound } from './components/NotFound';
import { Thesis } from './components/Thesis';
import { GAMES } from './games';
import './styles.css';

// `/` (and /index.html) is the floor, `/<slug>` opens a game over it, /thesis is a page of its own;
// anything else gets a real not-found page instead of a silent floor.
const path = location.pathname.replace(/\/+$/, '').replace(/^\/index\.html$/, '') || '/';
const page = path === '/thesis' ? <Thesis /> : path === '/' || GAMES.some((g) => path === `/${g.slug}`) ? <App /> : <NotFound path={path} />;

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
