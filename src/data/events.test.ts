import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { selectNext, selectUpcoming, selectPast, eventDateParts } from '@data/events.ts';
import { type Event } from '@lib/types.ts';

function ev(id: string, date: string): Event {
  return { id, date, title: id, location: 'Lebanon, NH', time: '6:30 PM' };
}

// Freeze "now" so past/upcoming is deterministic regardless of run date.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-07-01T12:00:00'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('selecting the next event', () => {
  describe('given a mix of past and future events', () => {
    it('returns the soonest future event', () => {
      // given
      const events = [
        ev('past', '2025-05-10'),
        ev('soon', '2025-07-16'),
        ev('later', '2025-09-01'),
      ];
      // when
      const next = selectNext(events);
      // then
      expect(next?.id).toBe('soon');
    });
  });
  describe('given only past events', () => {
    it('returns undefined', () => {
      expect(selectNext([ev('a', '2025-01-01')])).toBeUndefined();
    });
  });
});

describe('selecting upcoming events', () => {
  it('given future events, excludes the next one', () => {
    // given
    const events = [ev('soon', '2025-07-16'), ev('later', '2025-09-01')];
    // when
    const upcoming = selectUpcoming(events);
    // then
    expect(upcoming.map((e) => e.id)).toEqual(['later']);
  });
});

describe('selecting past events', () => {
  it('given past and future events, returns only past, most-recent first', () => {
    // given
    const events = [
      ev('older', '2025-05-01'),
      ev('newer', '2025-06-18'),
      ev('future', '2025-08-01'),
    ];
    // when
    const past = selectPast(events);
    // then
    expect(past.map((e) => e.id)).toEqual(['newer', 'older']);
  });
});

describe('deriving display date parts', () => {
  it('given an ISO date, returns month/day/weekday/rowDay', () => {
    // given / when
    const parts = eventDateParts('2025-07-16');
    // then
    expect(parts).toEqual({ month: 'Jul', day: '16', weekday: 'Wed', rowDay: 'Wed, Jul 16' });
  });
  it('given a first-of-month date, does not drift across the day boundary', () => {
    // noon-local construction must keep the calendar day stable
    expect(eventDateParts('2025-08-01').day).toBe('1');
  });
});
