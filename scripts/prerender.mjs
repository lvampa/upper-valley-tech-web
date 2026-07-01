// Post-build static prerender. Runs after the client + SSR Vite builds.
// Reads the client template (dist/index.html), fetches events once, renders
// every route to a real dist/<route>/index.html, and writes sitemap.xml.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');

const server = await import(path.join(dist, 'server', 'entry-server.js'));
const { render, SITE_ROUTES, serializeInitialData, buildSitemap, renderDocument } = server;

async function loadEvents() {
  const base = process.env.VITE_EVENTS_API_URL;
  try {
    const res = await fetch(`${base}/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body || !Array.isArray(body.events)) throw new Error('bad shape');
    return body.events;
  } catch (err) {
    console.warn(`[prerender] events fetch failed (${String(err)}); baking empty snapshot`);
    return [];
  }
}

function outPath(route) {
  return route === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.replace(/^\//, ''), 'index.html');
}

const template = await readFile(path.join(dist, 'index.html'), 'utf-8');
const events = await loadEvents();
const data = { events };
const dataScript = serializeInitialData(data);

for (const route of SITE_ROUTES) {
  const { appHtml, headHtml } = render(route, data);
  const doc = renderDocument({ template, appHtml, headHtml, dataScript });
  const file = outPath(route);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, doc, 'utf-8');
  console.log(`[prerender] wrote ${path.relative(dist, file)}`);
}

// 404 page (Cloudflare Pages serves dist/404.html on unknown paths).
{
  const { appHtml, headHtml } = render('/404', data);
  await writeFile(
    path.join(dist, '404.html'),
    renderDocument({ template, appHtml, headHtml, dataScript }),
    'utf-8',
  );
  console.log('[prerender] wrote 404.html');
}

// Sitemap — build date from the Node runtime clock (ISO date only).
const lastmod = new Date().toISOString().slice(0, 10);
await writeFile(path.join(dist, 'sitemap.xml'), buildSitemap(SITE_ROUTES, lastmod), 'utf-8');
console.log('[prerender] wrote sitemap.xml');

// Drop the SSR bundle so it is not uploaded to the CDN.
await rm(path.join(dist, 'server'), { recursive: true, force: true });
console.log('[prerender] done');
