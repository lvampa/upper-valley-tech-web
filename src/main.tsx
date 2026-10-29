import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App.tsx';
import { legacyHashPath } from './lib/router.tsx';
import { syncClientHead } from './lib/seo.ts';
import { type EventsSnapshot } from './lib/types.ts';

declare global {
  interface Window {
    __UVT_DATA__?: EventsSnapshot;
  }
}

const hashPath = legacyHashPath(window.location.hash);
if (hashPath) {
  // A full load, not replaceState, so the browser gets that route's prerendered HTML.
  window.location.replace(hashPath);
} else {
  start();
}

function start() {
  const root = document.getElementById('app');
  if (!root) throw new Error('Root element #app not found');

  const pathname = window.location.pathname;
  syncClientHead(pathname);
  const tree = (
    <StrictMode>
      <App location={pathname} snapshot={window.__UVT_DATA__ ?? null} />
    </StrictMode>
  );

  // Prerendered pages ship server markup to hydrate; dev/cold pages render fresh.
  if (root.hasChildNodes()) {
    hydrateRoot(root, tree);
  } else {
    createRoot(root).render(tree);
  }
}
