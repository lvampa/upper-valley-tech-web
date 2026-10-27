import { describe, it, expect } from 'vitest';
import { serializeInitialData, buildSitemap, renderDocument } from './prerender.ts';

describe('serializeInitialData', () => {
  it('produces an assignable script body', () => {
    const out = serializeInitialData({ events: [] });
    expect(out).toContain('window.__UVT_DATA__');
  });

  it('escapes < so payload data cannot break out of the script tag', () => {
    const hostile = {
      events: [{ id: 'x', date: '2099-01-01', title: '</script>', location: 'L', time: 't' }],
    };
    const out = serializeInitialData(hostile);
    // Only the wrapper's own closing tag remains — the payload one is escaped.
    expect(out.match(/<\/script>/g)).toHaveLength(1);
    expect(out).toContain('\\u003c/script>');
  });
});

describe('buildSitemap', () => {
  it('lists each route as an absolute loc with lastmod', () => {
    const xml = buildSitemap(['/', '/events'], '2026-07-01');
    expect(xml).toContain('<loc>https://uppervalleytech.org</loc>');
    expect(xml).toContain('<loc>https://uppervalleytech.org/events</loc>');
    expect(xml).toContain('<lastmod>2026-07-01</lastmod>');
    expect(xml.startsWith('<?xml')).toBe(true);
  });
});

describe('renderDocument', () => {
  it('injects app html, head, and data script into the template', () => {
    const template = '<html><head></head><body><div id="app"></div></body></html>';
    const doc = renderDocument({
      template,
      appHtml: '<main>hi</main>',
      headHtml: '<title>T</title>',
      dataScript: '<script>window.__UVT_DATA__={}</script>',
    });
    expect(doc).toContain('<div id="app"><main>hi</main></div>');
    expect(doc).toContain('<title>T</title>');
    expect(doc).toContain('window.__UVT_DATA__');
  });
});
