import { z } from 'zod';
import { env } from '@lib/env.ts';

const subscribeReplySchema = z.object({ ok: z.boolean(), error: z.string().optional() });

/** Add an email to the mailing list via the events API. Throws if it isn't added. */
export async function submitSubscription(email: string, captchaToken: string): Promise<void> {
  const res = await fetch(`${env.VITE_EVENTS_API_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, captchaToken }),
  });

  const reply = subscribeReplySchema.safeParse(await res.json().catch(() => null));
  if (res.ok && reply.success && reply.data.ok) return;

  const reason = reply.success ? (reply.data.error ?? 'unknown') : `HTTP ${String(res.status)}`;
  throw new Error(`Subscribe failed: ${reason}`);
}
