import { useState, useEffect, type ComponentType } from 'react';
import { Shell } from './Shell.tsx';
import { HomeScreen } from '@screens/HomeScreen.tsx';
import { EventsScreen } from '@screens/EventsScreen.tsx';
import { AboutScreen } from '@screens/AboutScreen.tsx';
import { CodeOfConductScreen } from '@screens/CodeOfConductScreen.tsx';

interface Route {
  active?: string;
  screen: ComponentType;
}

const ROUTES: Record<string, Route> = {
  '#/': { active: undefined, screen: HomeScreen },
  '#/events': { active: '#/events', screen: EventsScreen },
  '#/about': { active: '#/about', screen: AboutScreen },
  '#/code-of-conduct': { active: undefined, screen: CodeOfConductScreen },
};

function stripSubscribe(hash: string): string {
  return hash.split('#subscribe')[0];
}

function getRoute(hash: string): Route {
  const key = stripSubscribe(hash) || '#/';
  return ROUTES[key] ?? ROUTES['#/'];
}

export function App() {
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash || '#/');
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const route = getRoute(hash);
  const Screen = route.screen;

  return (
    <Shell active={route.active} key={stripSubscribe(hash)}>
      <Screen />
    </Shell>
  );
}
