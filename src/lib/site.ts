// Site identity + SEO constants: the single source of truth for anything that
// appears in <head>, JSON-LD, robots.txt, or the sitemap.
import { CONTACT_EMAIL } from './constants.ts';

export const SITE_URL = 'https://uppervalleytech.org';
export const SITE_NAME = 'Upper Valley Tech';
export const SITE_TAGLINE = "Building the Upper Valley's Tech Community";
export const FOUNDER = 'Connor Abdelnoor';
export const FOUNDING_YEAR = '2025';
export const ORG_EMAIL = CONTACT_EMAIL;
export const REGION_PHRASE = 'the Upper Valley region of New Hampshire and Vermont';

export const OG_IMAGE = '/og-image.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Absolute URL for a site-relative path. `/` stays `SITE_URL`. */
export function absoluteUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}
