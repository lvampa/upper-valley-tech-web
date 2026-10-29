// Per-route SEO: titles, meta, canonical, Open Graph/Twitter, and JSON-LD.
// Consumed at build time (renderHeadTags → injected into static HTML) and on
// the client (syncClientHead → sets <title> on load, for dev and cold renders).
import type { Event } from './types.ts';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  FOUNDER,
  FOUNDING_YEAR,
  ORG_EMAIL,
  REGION_PHRASE,
  OG_IMAGE,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  absoluteUrl,
} from './site.ts';

export interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
}

export const SITE_ROUTES = ['/', '/events', '/about', '/code-of-conduct'];

const META: Record<string, { title: string; description: string; robots?: string }> = {
  '/': {
    title: 'Upper Valley Tech - Monthly Tech Meetup in NH & VT',
    description:
      'Upper Valley Tech is a community-driven monthly meetup connecting developers, founders, and technology professionals across the Upper Valley of New Hampshire and Vermont. Founded 2025.',
  },
  '/events': {
    title: 'Events - Upper Valley Tech',
    description:
      'Upcoming and past Upper Valley Tech meetups: dates, locations, and agendas for developers, founders, and tech professionals in the NH & VT Upper Valley.',
  },
  '/about': {
    title: 'About - Upper Valley Tech',
    description:
      'About Upper Valley Tech: a community organization founded in 2025 by Connor Abdelnoor to build and support the tech community across the Upper Valley of New Hampshire and Vermont.',
  },
  '/code-of-conduct': {
    title: 'Code of Conduct - Upper Valley Tech',
    description:
      'The Upper Valley Tech code of conduct: our standards for a respectful, inclusive community at every meetup and event.',
  },
  '/404': {
    title: 'Page Not Found - Upper Valley Tech',
    description: 'The page you were looking for could not be found.',
    robots: 'noindex, follow',
  },
};

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const stripped = pathname.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

export function getRouteMeta(pathname: string): RouteMeta {
  const path = normalizePath(pathname);
  const key = path in META ? path : '/404';
  const entry = META[key];
  return {
    title: entry.title,
    description: entry.description,
    canonical: absoluteUrl(key),
    robots: entry.robots ?? 'index, follow',
  };
}

const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}${OG_IMAGE}`,
  email: ORG_EMAIL,
  foundingDate: FOUNDING_YEAR,
  founder: { '@type': 'Person', name: FOUNDER },
  areaServed: { '@type': 'Place', name: 'Upper Valley, New Hampshire and Vermont' },
  description: `${SITE_NAME} - ${SITE_TAGLINE}. A community organization for ${REGION_PHRASE}.`,
});

const eventLd = (e: Event) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: e.title,
  startDate: e.date,
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: { '@type': 'Place', name: e.location },
  organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  url: e.rsvpHref ?? absoluteUrl('/events'),
});

export function buildJsonLd(pathname: string, events: Event[]): object[] {
  const path = normalizePath(pathname);
  switch (path) {
    case '/':
      return [
        { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        organizationLd(),
      ];
    case '/events':
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: getRouteMeta(path).title,
          url: getRouteMeta(path).canonical,
        },
        ...events.map(eventLd),
      ];
    case '/about':
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: getRouteMeta(path).title,
          url: getRouteMeta(path).canonical,
        },
        organizationLd(),
      ];
    case '/code-of-conduct':
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: getRouteMeta(path).title,
          url: getRouteMeta(path).canonical,
        },
      ];
    default:
      return [];
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function meta(attr: 'name' | 'property', key: string, content: string): string {
  return `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
}

function jsonLdScript(obj: object): string {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function renderHeadTags(pathname: string, events: Event[]): string {
  const m = getRouteMeta(pathname);
  const image = `${SITE_URL}${OG_IMAGE}`;
  const lines = [
    `<title>${escapeAttr(m.title)}</title>`,
    meta('name', 'description', m.description),
    `<link rel="canonical" href="${escapeAttr(m.canonical)}" />`,
    meta('name', 'robots', m.robots),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:title', m.title),
    meta('property', 'og:description', m.description),
    meta('property', 'og:url', m.canonical),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
    meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
    meta('property', 'og:image:type', 'image/png'),
    meta('property', 'og:image:alt', `${SITE_NAME} - ${SITE_TAGLINE}`),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', m.title),
    meta('name', 'twitter:description', m.description),
    meta('name', 'twitter:image', image),
    ...buildJsonLd(pathname, events).map(jsonLdScript),
  ];
  return lines.join('\n');
}

/** Client-side: set the document title for pages that were not prerendered. */
export function syncClientHead(pathname: string): void {
  if (typeof document === 'undefined') return;
  document.title = getRouteMeta(pathname).title;
}
