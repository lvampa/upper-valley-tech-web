import { describe, it, expect } from 'vitest';
import { render } from './entry-server.tsx';
import type { Event } from './lib/types.ts';

const events: Event[] = [
  {
    id: 'e1',
    date: '2099-09-01',
    title: 'September Meetup',
    location: 'Lebanon, NH',
    time: '6:30 PM',
  },
];

describe('render', () => {
  it('renders the events page with baked event content and Event JSON-LD', () => {
    const { appHtml, headHtml } = render('/events', { events, asOf: '2026-07-01T00:00:00.000Z' });
    expect(appHtml).toContain('September Meetup');
    expect(headHtml).toContain('"@type":"Event"');
    expect(headHtml).toContain('September Meetup');
  });

  it('renders home with Organization JSON-LD and no crash', () => {
    const { appHtml, headHtml } = render('/', { events: [], asOf: '2026-07-01T00:00:00.000Z' });
    expect(appHtml.length).toBeGreaterThan(0);
    expect(headHtml).toContain('"@type":"Organization"');
  });
});
