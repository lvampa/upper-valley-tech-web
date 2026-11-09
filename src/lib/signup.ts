import { z } from 'zod';
import { env } from '@lib/env.ts';

const signupReplySchema = z.object({ ok: z.boolean(), error: z.string().optional() });

export type SignupPath = '/subscribe' | `/events/${string}/rsvp`;

export function rsvpPath(eventId: string): SignupPath {
  return `/events/${encodeURIComponent(eventId)}/rsvp`;
}

/** Send an email to a signup endpoint on the events API. Throws if it isn't stored. */
export async function submitSignup(
  path: SignupPath,
  email: string,
  captchaToken: string,
): Promise<void> {
  const res = await fetch(`${env.VITE_EVENTS_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, captchaToken }),
  });

  const reply = signupReplySchema.safeParse(await res.json().catch(() => null));
  if (res.ok && reply.success && reply.data.ok) return;

  const reason = reply.success ? (reply.data.error ?? 'unknown') : `HTTP ${String(res.status)}`;
  throw new Error(`Signup failed: ${reason}`);
}
