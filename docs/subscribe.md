# Mailing list signup

The signup forms on Home and About send an email plus an invisible hCaptcha token to `POST /subscribe` on the events API.
The events worker checks the token with hCaptcha, then stores the email in D1.
The site side is in `src/lib/subscribe.ts` and `src/lib/useHCaptchaSubscribe.ts`.

## API contract

Request body, as JSON:

```json
{ "email": "ada@example.com", "captchaToken": "<token from hCaptcha>" }
```

Replies:

- `200 {"ok":true}` when the email is stored, including when it was already on the list.
- `400 {"ok":false,"error":"invalid_email"}` when the email is malformed.
- `400 {"ok":false,"error":"captcha_failed"}` when hCaptcha rejects the token.
- `500 {"ok":false,"error":"server"}` when something else goes wrong.

The site treats anything but a `200 {"ok":true}` as a failed signup.

## Captcha keys

- Production builds use the real site key in `src/lib/constants.ts`, and the worker uses the matching secret.
- Dev builds use hCaptcha's public test site key, because hCaptcha does not run on `localhost` with a real key.
  The local worker needs the matching test secret, `0x0000000000000000000000000000000000000000`, in `.dev.vars`.
- The hCaptcha dashboard must list `uppervalleytech.org` for the real site key.

## Getting the list

Organizers use the `list_subscribers` MCP tool, which returns the emails as one comma-separated line.
Paste it into Bcc in Gmail, and remove anyone who asks with `remove_subscriber`.
