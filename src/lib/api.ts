import { env } from '@lib/env.ts';
import { type AgendaItem, type Event } from './types.ts';

// Defensive runtime validation of the /events response. The API is trusted to
// return the Event shape, but we narrow `unknown` with type guards (never `as`)
// so a malformed payload fails loudly instead of corrupting the UI.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isAgendaItem(value: unknown): value is AgendaItem {
  return (
    isRecord(value) &&
    typeof value.time === 'string' &&
    typeof value.description === 'string' &&
    isOptionalString(value.speaker) &&
    (value.open === undefined || typeof value.open === 'boolean')
  );
}

function isAgenda(value: unknown): value is AgendaItem[] {
  return value === undefined || (Array.isArray(value) && value.every(isAgendaItem));
}

function isEvent(value: unknown): value is Event {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    typeof value.title === 'string' &&
    typeof value.location === 'string' &&
    typeof value.time === 'string' &&
    isOptionalString(value.rsvpHref) &&
    (value.meta === undefined || isStringArray(value.meta)) &&
    isAgenda(value.agenda) &&
    isOptionalString(value.attendees)
  );
}

function isEventsPayload(value: unknown): value is { events: Event[] } {
  return isRecord(value) && Array.isArray(value.events) && value.events.every(isEvent);
}

/** Fetch the canonical events list from the HTTP API. Throws on a bad shape. */
export async function fetchEvents(): Promise<Event[]> {
  const base = env.VITE_EVENTS_API_URL;
  const res = await fetch(`${base}/events`);
  if (!res.ok) {
    throw new Error(`Events request failed: ${String(res.status)} ${res.statusText}`);
  }

  const body: unknown = await res.json();
  if (!isEventsPayload(body)) {
    throw new Error('Events response did not match the expected shape.');
  }
  return body.events;
}
