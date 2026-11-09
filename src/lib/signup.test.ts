import { describe, it, expect, afterEach, vi } from 'vitest';
import { rsvpPath, submitSignup } from '@lib/signup.ts';
import { env } from '@lib/env.ts';

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

describe('submitting a signup', () => {
  it('posts the email and captcha token as JSON to the events API', async () => {
    // given
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
    // when
    await submitSignup('/subscribe', 'ada@example.com', 'token-123');
    // then
    expect(fetchMock).toHaveBeenCalledWith(`${env.VITE_EVENTS_API_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', captchaToken: 'token-123' }),
    });
  });

  it('posts an RSVP to the endpoint for that event', async () => {
    // given
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
    // when
    await submitSignup(rsvpPath('2026-07-16'), 'ada@example.com', 'token-123');
    // then
    expect(fetchMock).toHaveBeenCalledWith(
      `${env.VITE_EVENTS_API_URL}/events/2026-07-16/rsvp`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('escapes the event id in the RSVP path', () => {
    expect(rsvpPath('a/b c')).toBe('/events/a%2Fb%20c/rsvp');
  });

  it('throws with not_found when the RSVP event is gone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ ok: false, error: 'not_found' }, false, 404))),
    );
    await expect(submitSignup(rsvpPath('old'), 'ada@example.com', 'token')).rejects.toThrow(
      'not_found',
    );
  });

  it('resolves when the API confirms the signup', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ ok: true }))),
    );
    await expect(submitSignup('/subscribe', 'ada@example.com', 'token')).resolves.toBeUndefined();
  });

  it('throws with the API error code when it rejects the captcha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(jsonResponse({ ok: false, error: 'captcha_failed' }, false, 400)),
      ),
    );
    await expect(submitSignup('/subscribe', 'ada@example.com', 'bad')).rejects.toThrow(
      'captcha_failed',
    );
  });

  it('throws on a server error with no JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 502,
          json: () => Promise.reject(new SyntaxError('Unexpected token <')),
        } as Response),
      ),
    );
    await expect(submitSignup('/subscribe', 'ada@example.com', 'token')).rejects.toThrow(
      'HTTP 502',
    );
  });

  it('throws on an OK response whose body is not the expected shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ events: [] }))),
    );
    await expect(submitSignup('/subscribe', 'ada@example.com', 'token')).rejects.toThrow();
  });
});
