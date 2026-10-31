# Mailing list signup

The signup forms on Home and About send an email plus an invisible hCaptcha token to a Google Apps Script web app.
The script checks the token with hCaptcha, then adds the email to a Google Sheet.
The code is in `google/subscribe.gs`, and the site side is in `src/lib/subscribe.ts`.

## Set up the Sheet and script

1. Create a Google Sheet, and put `Subscribed at` in A1 and `Email` in B1.
2. In the Sheet, open Extensions, then Apps Script.
3. Replace the contents of `Code.gs` with `google/subscribe.gs`, and save.
4. Open Project Settings, then Script Properties, and add `HCAPTCHA_SECRET` with the secret from the hCaptcha dashboard.
5. Click Deploy, then New deployment, and choose Web app.
6. Set Execute as to Me, and set Who has access to Anyone.
   "Anyone with a Google account" will not work, because visitors get a login page instead of JSON.
7. Authorize the script when asked, and copy the web app URL that ends in `/exec`.
8. Set `SUBSCRIBE_URL` in `src/lib/constants.ts` to that URL.

## Check it

Test the script without a browser:

```sh
curl -sL -d email=test@example.com -d h-captcha-response=bad "$SUBSCRIBE_URL"
```

It should print `{"ok":false,"error":"captcha"}`.
Anything else, such as an HTML page, means the deployment or its access setting is wrong.

Then sign up once on the live site, and check that the row shows up in the Sheet.

## Things to know

- The hCaptcha dashboard must list `uppervalleytech.org` for the site key.
- hCaptcha does not run on `localhost`, so test real signups on the deployed site.
- Editing the script needs a new deployment version (Deploy, then Manage deployments, then Edit, then New version).
  The URL stays the same.
- Signups are lowercased, and an email already in column B is not added again.
- Nothing here sends email.
  Email the list from Gmail, or move to a newsletter service when it outgrows that.
