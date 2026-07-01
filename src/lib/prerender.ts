import { type Event } from './types.ts';
import { absoluteUrl } from './site.ts';

export function serializeInitialData(data: { events: Event[] }): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script>window.__UVT_DATA__=${json}</script>`;
}

export function buildSitemap(routes: string[], lastmod: string): string {
  const urls = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${absoluteUrl(r)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderDocument(opts: {
  template: string;
  appHtml: string;
  headHtml: string;
  dataScript: string;
}): string {
  return opts.template
    .replace('<div id="app"></div>', `<div id="app">${opts.appHtml}</div>`)
    .replace('</head>', `${opts.headHtml}\n${opts.dataScript}\n</head>`);
}
