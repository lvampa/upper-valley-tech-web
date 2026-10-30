import { z } from 'zod';
import { env } from '@lib/env.ts';
import { type Event } from './types.ts';
import { eventsPayloadSchema } from './eventSchema.ts';

/** Fetch the canonical events list from the HTTP API. Throws on a bad shape. */
export async function fetchEvents(): Promise<Event[]> {
  const base = env.VITE_EVENTS_API_URL;
  const res = await fetch(`${base}/events`);
  if (!res.ok) {
    throw new Error(`Events request failed: ${String(res.status)} ${res.statusText}`);
  }

  const parsed = eventsPayloadSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error(
      `Events response did not match the expected shape: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data.events;
}
