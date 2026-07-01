import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents } from '@lib/useEvents.ts';
import { fetchEvents } from '@lib/api.ts';
import { type Event } from '@lib/types.ts';

vi.mock('@lib/api.ts', () => ({ fetchEvents: vi.fn() }));
const mockFetch = vi.mocked(fetchEvents);

const sample: Event[] = [
  { id: 'a', date: '2025-07-16', title: 'T', location: 'L', time: '6:30 PM' },
];

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useEvents', () => {
  describe('given the fetch resolves', () => {
    it('ends in success with the events', async () => {
      // given
      mockFetch.mockResolvedValue(sample);
      // when
      const { result } = renderHook(() => useEvents());
      // then
      expect(result.current.status).toBe('loading');
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
      expect(result.current.events).toEqual(sample);
    });
  });

  describe('given the fetch rejects', () => {
    it('ends in error with no events', async () => {
      // given
      mockFetch.mockRejectedValue(new Error('boom'));
      // when
      const { result } = renderHook(() => useEvents());
      // then
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
      expect(result.current.events).toEqual([]);
    });
  });
});
