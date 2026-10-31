import { z } from 'zod';

// The shape of the events API's GET /events response. Event and AgendaItem in
// types.ts are inferred from these, so the type and its validation can't drift.

export const agendaItemSchema = z.object({
  time: z.string(),
  speaker: z.string().optional(),
  description: z.string(),
  open: z.boolean().optional(),
});

export const eventSchema = z.object({
  id: z.string(),
  /** ISO "YYYY-MM-DD"; drives past/upcoming logic. */
  date: z.string(),
  title: z.string(),
  location: z.string(),
  /** Display time, e.g. "6:30 PM". */
  time: z.string(),
  rsvpHref: z.string().optional(),
  /** Featured card sub-lines, e.g. ["Doors 6:30 · Talks 7:00"]. */
  meta: z.array(z.string()).optional(),
  agenda: z.array(agendaItemSchema).optional(),
});

export const eventsPayloadSchema = z.object({ events: z.array(eventSchema) });
