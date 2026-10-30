import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EventsScreen } from '@screens/EventsScreen.tsx';
import { useEvents } from '@lib/useEvents.ts';
import { type Event } from '@lib/types.ts';

vi.mock('@lib/useEvents.ts', () => ({ useEvents: vi.fn() }));
const mockUseEvents = vi.mocked(useEvents);

const now = new Date('2026-07-01T12:00:00');
const next: Event = {
  id: 'jul',
  date: '2026-07-16',
  title: 'July Meetup',
  location: 'Lebanon, NH',
  time: '6:30 PM',
  rsvpHref: 'https://example.com/jul',
};
const later: Event = {
  id: 'aug',
  date: '2026-08-20',
  title: 'August Meetup',
  location: 'Hanover, NH',
  time: '6:30 PM',
  rsvpHref: 'https://example.com/aug',
};
const past: Event = {
  id: 'jun',
  date: '2026-06-18',
  title: 'June Meetup',
  location: 'Lebanon, NH',
  time: '6:30 PM',
  rsvpHref: 'https://example.com/jun',
  attendees: '18 here',
  agenda: [{ time: '7:05', description: 'Running models on the edge' }],
};

const scrollIntoView = vi.fn();

function featuredTitle() {
  return screen.getByRole('heading', { level: 3 }).textContent;
}

beforeEach(() => {
  mockUseEvents.mockReturnValue({ events: [past, next, later], status: 'success', now });
  // jsdom implements neither.
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});

describe('EventsScreen', () => {
  it('given no selection, features the next meetup with its RSVP', () => {
    render(<EventsScreen />);
    expect(featuredTitle()).toBe('July Meetup');
    expect(screen.getByText(/^Next meetup ·/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'RSVP' })).toHaveAttribute('href', next.rsvpHref);
  });

  it('given an upcoming row is clicked, features that event without RSVP', () => {
    // given
    render(<EventsScreen />);
    // when
    fireEvent.click(screen.getByRole('button', { name: /August Meetup/ }));
    // then
    expect(featuredTitle()).toBe('August Meetup');
    expect(screen.getByText(/^Next meetup ·/)).not.toBeVisible();
    expect(screen.queryByRole('link', { name: 'RSVP' })).toBeNull();
    expect(screen.getByRole('button', { name: /August Meetup/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('given a past row is clicked, features it with attendees and agenda', () => {
    // given
    render(<EventsScreen />);
    // when
    fireEvent.click(screen.getByRole('button', { name: /June Meetup/ }));
    // then
    expect(featuredTitle()).toBe('June Meetup');
    expect(screen.getByText(/^Past ·/)).toBeVisible();
    expect(screen.getByText('Running models on the edge')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'RSVP' })).toBeNull();
  });

  it('stacks every event card in one cell so the layout keeps the tallest height', () => {
    render(<EventsScreen />);
    const cards = screen.getAllByText(/Meetup$/, { selector: 'h3' });
    expect(cards).toHaveLength(3);
    const visible = cards.filter((card) => getComputedStyle(card).visibility === 'visible');
    expect(visible.map((card) => card.textContent)).toEqual(['July Meetup']);
  });

  it('separates an agenda speaker from the description with a dash', () => {
    // given
    const talk = { time: '7:00', speaker: 'Ada', description: 'Compilers' };
    mockUseEvents.mockReturnValue({
      events: [{ ...next, agenda: [talk] }],
      status: 'success',
      now,
    });
    // when
    render(<EventsScreen />);
    // then
    expect(screen.getByText('Ada').parentElement).toHaveTextContent(/^Ada - Compilers$/);
  });

  it('given another event is featured, goes back to the next meetup', () => {
    // given
    render(<EventsScreen />);
    fireEvent.click(screen.getByRole('button', { name: /August Meetup/ }));
    // when
    fireEvent.click(screen.getByRole('button', { name: /Back to next meetup/ }));
    // then
    expect(featuredTitle()).toBe('July Meetup');
    expect(screen.queryByRole('button', { name: /Back to next meetup/ })).toBeNull();
  });
});
