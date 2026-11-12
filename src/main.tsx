import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Thesis } from './components/Thesis';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* /thesis is a page of its own; every other path is the floor (and /<slug> opens a game over it) */}
    {location.pathname.replace(/\/$/, '') === '/thesis' ? <Thesis /> : <App />}
  </StrictMode>,
);
