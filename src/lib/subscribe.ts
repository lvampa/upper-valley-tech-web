import { z } from 'zod';
import { SUBSCRIBE_URL } from './constants.ts';

const subscribeReplySchema = z.object({ ok: z.boolean(), error: z.string().optional() });

/** Add an email to the mailing list via the Apps Script endpoint. Throws if it isn't added. */
export async function submitSubscription(email: string, captchaToken: string): Promise<void> {
  // A form-encoded body keeps this a simple CORS request, which Apps Script allows.
  const body = new URLSearchParams({ email, 'h-captcha-response': captchaToken });
  const res = await fetch(SUBSCRIBE_URL, { method: 'POST', body });
  if (!res.ok) {
    throw new Error(`Subscribe request failed: ${String(res.status)} ${res.statusText}`);
  }

  const reply = subscribeReplySchema.parse(await res.json());
  if (!reply.ok) {
    throw new Error(`Subscribe rejected: ${reply.error ?? 'unknown'}`);
  }
}
