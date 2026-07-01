import { describe, it, expect } from 'vitest';
import { SITE_ROUTES, getRouteMeta, buildJsonLd, renderHeadTags } from './seo.ts';
import type { Event } from './types.ts';

const sampleEvents: Event[] = [
  {
    id: 'e1',
    date: '2099-09-01',
    title: 'September Meetup',
    location: 'Lebanon, NH',
    time: '6:30 PM',
  },
];

describe('seo route metadata', () => {
  it('lists the four public routes', () => {
    expect(SITE_ROUTES).toEqual(['/', '/events', '/about', '/code-of-conduct']);
  });

  it('gives every route a unique, non-empty title and description', () => {
    const metas = [...SITE_ROUTES, '/404'].map(getRouteMeta);
    for (const m of metas) {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.canonical.startsWith('https://uppervalleytech.org')).toBe(true);
    }
    const titles = metas.map((m) => m.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('marks 404 as noindex and everything else indexable', () => {
    expect(getRouteMeta('/404').robots).toBe('noindex, follow');
    expect(getRouteMeta('/').robots).toBe('index, follow');
  });
});

describe('buildJsonLd', () => {
  it('emits WebSite + Organization for home', () => {
    const types = buildJsonLd('/', []).map((o) => (o as { '@type': string })['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('Organization');
  });

  it('emits one Event object per baked event on /events', () => {
    const ld = buildJsonLd('/events', sampleEvents);
    const events = ld.filter((o) => (o as { '@type': string })['@type'] === 'Event');
    expect(events).toHaveLength(1);
    expect((events[0] as { name: string }).name).toBe('September Meetup');
    expect((events[0] as { startDate: string }).startDate).toBe('2099-09-01');
  });
});

describe('renderHeadTags', () => {
  it('includes title, canonical, og:image and JSON-LD', () => {
    const head = renderHeadTags('/events', sampleEvents);
    expect(head).toContain('<title>');
    expect(head).toContain('rel="canonical"');
    expect(head).toContain('/og-image.png');
    expect(head).toContain('application/ld+json');
    expect(head).toContain('September Meetup');
  });

  it('does not emit undefined attribute values', () => {
    const head = renderHeadTags('/', []);
    expect(head).not.toContain('content="undefined"');
  });
});
