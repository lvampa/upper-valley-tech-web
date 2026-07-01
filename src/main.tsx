import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App.tsx';
import { type Event } from './lib/types.ts';

declare global {
  interface Window {
    __UVT_DATA__?: { events: Event[] };
  }
}

const root = document.getElementById('app');
if (!root) throw new Error('Root element #app not found');

const initialEvents = window.__UVT_DATA__?.events ?? null;
const tree = (
  <StrictMode>
    <App location={window.location.pathname} initialEvents={initialEvents} />
  </StrictMode>
);

// Prerendered pages ship server markup to hydrate; dev/cold pages render fresh.
if (root.hasChildNodes()) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
