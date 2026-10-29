import type { ComponentType } from 'react';
import { HomeScreen } from '@screens/HomeScreen.tsx';
import { EventsScreen } from '@screens/EventsScreen.tsx';
import { AboutScreen } from '@screens/AboutScreen.tsx';
import { CodeOfConductScreen } from '@screens/CodeOfConductScreen.tsx';
import { NotFoundScreen } from '@screens/NotFoundScreen.tsx';
import { normalizePath } from './seo.ts';

interface Route {
  Screen: ComponentType;
  active?: string;
}

const ROUTES: Record<string, Route> = {
  '/': { Screen: HomeScreen },
  '/events': { Screen: EventsScreen, active: '/events' },
  '/about': { Screen: AboutScreen, active: '/about' },
  '/code-of-conduct': { Screen: CodeOfConductScreen },
};

export function resolveRoute(pathname: string): Route {
  return ROUTES[normalizePath(pathname)] ?? { Screen: NotFoundScreen };
}

/**
 * The real path for a pre-prerendering hash URL such as `#/events`, or null when
 * the hash is not one. Old links and bookmarks still use that form.
 */
export function legacyHashPath(hash: string): string | null {
  return hash.startsWith('#/') ? hash.slice(1) : null;
}
