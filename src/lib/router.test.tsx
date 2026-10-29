import { describe, it, expect } from 'vitest';
import { resolveRoute, legacyHashPath } from './router.tsx';
import { HomeScreen } from '@screens/HomeScreen.tsx';
import { EventsScreen } from '@screens/EventsScreen.tsx';
import { NotFoundScreen } from '@screens/NotFoundScreen.tsx';

describe('resolveRoute', () => {
  it('maps / to HomeScreen with no active link', () => {
    expect(resolveRoute('/').Screen).toBe(HomeScreen);
    expect(resolveRoute('/').active).toBeUndefined();
  });

  it('maps /events (and trailing slash) to EventsScreen with active link', () => {
    expect(resolveRoute('/events').Screen).toBe(EventsScreen);
    expect(resolveRoute('/events/').Screen).toBe(EventsScreen);
    expect(resolveRoute('/events').active).toBe('/events');
  });

  it('falls back to NotFoundScreen for unknown paths', () => {
    expect(resolveRoute('/nope').Screen).toBe(NotFoundScreen);
  });
});

describe('legacyHashPath', () => {
  it('maps an old #/ URL to its real path', () => {
    expect(legacyHashPath('#/events')).toBe('/events');
    expect(legacyHashPath('#/code-of-conduct')).toBe('/code-of-conduct');
  });

  it('ignores in-page anchors and empty hashes', () => {
    expect(legacyHashPath('#subscribe')).toBeNull();
    expect(legacyHashPath('')).toBeNull();
  });
});
