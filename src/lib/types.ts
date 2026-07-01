// Shared types used across components, screens, and data.

/** The async-lifecycle status shared by Button, EmailCapture, and the subscribe hook. */
export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface AgendaItem {
  time: string;
  speaker?: string;
  description: string;
  open?: boolean;
}

export interface Event {
  id: string;
  date: string; // ISO "YYYY-MM-DD" — drives past/upcoming logic
  title: string;
  location: string;
  time: string; // display time, e.g. "6:30 PM"
  rsvpHref?: string;
  meta?: string[]; // featured card sub-lines, e.g. ["Doors 6:30 · Talks 7:00"]
  agenda?: AgendaItem[];
  attendees?: string; // past events only, e.g. "12 here"
}
