// Shared types used across components, screens, and data.
import { type z } from 'zod';
import { type agendaItemSchema, type eventSchema } from './eventSchema.ts';

/** The async-lifecycle status shared by Button, EmailCapture, and the subscribe hook. */
export type Status = 'idle' | 'loading' | 'success' | 'error';

export type AgendaItem = z.infer<typeof agendaItemSchema>;
export type Event = z.infer<typeof eventSchema>;

/**
 * The build-time events data baked into each prerendered page. `events` is null
 * when the build could not fetch them. `asOf` is the build time, used as "now"
 * until hydration so past/upcoming matches the server markup.
 */
export interface EventsSnapshot {
  events: Event[] | null;
  asOf: string;
}
