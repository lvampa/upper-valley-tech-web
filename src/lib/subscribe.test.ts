import { describe, it, expect, afterEach, vi } from 'vitest';
import { submitSubscription } from '@lib/subscribe.ts';
import { SUBSCRIBE_URL } from '@lib/constants.ts';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('submitting a subscription', () => {
  it('posts the email and captcha token as a form body', async () => {
    // given
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
    // when
    await submitSubscription('ada@example.com', 'token-123');
    // then
    expect(fetchMock).toHaveBeenCalledWith(SUBSCRIBE_URL, {
      method: 'POST',
      body: new URLSearchParams({ email: 'ada@example.com', 'h-captcha-response': 'token-123' }),
    });
  });

  it('resolves when the endpoint confirms the signup', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ ok: true }))),
    );
    await expect(submitSubscription('ada@example.com', 'token')).resolves.toBeUndefined();
  });

  it('throws when the endpoint rejects the captcha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ ok: false, error: 'captcha' }))),
    );
    await expect(submitSubscription('ada@example.com', 'bad')).rejects.toThrow('captcha');
  });

  it('throws on a non-OK HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(null, false, 500))),
    );
    await expect(submitSubscription('ada@example.com', 'token')).rejects.toThrow();
  });

  it('throws on a reply that is not the expected shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse('<html>sign in</html>'))),
    );
    await expect(submitSubscription('ada@example.com', 'token')).rejects.toThrow();
  });
});
