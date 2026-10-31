# Deploy & Environment

## Environment

The site needs one runtime variable, **`VITE_EVENTS_API_URL`** — the base URL of
the events API (no trailing slash). It's validated at startup by
[`src/lib/env.ts`](../src/lib/env.ts) (t3-env), so a missing/invalid value fails
the build loudly rather than shipping broken.

There is a single **`.env`** at the repo root, **gitignored** — it holds only
the local dev value. Create it once:

```bash
echo 'VITE_EVENTS_API_URL=http://localhost:8799' > .env
```

No `.env` files are committed. The value used elsewhere is injected at build
time, not read from a file:

- **Production build** — `scripts/deploy.sh` and the CI deploy job set
  `VITE_EVENTS_API_URL=https://api.uppervalleytech.org`.
- **Tests / CI checks** — the workflow sets a placeholder URL (t3-env just needs
  a valid one).

## Hosting

The site is a static SPA on **Cloudflare Pages** (a Direct-Upload project named `uppervalley-tech`).
It is **not** git-integrated, so Cloudflare has no access to the GitHub repo.
Deploys run from GitHub Actions with a scoped Cloudflare API token instead, so trust flows one way (GitHub → Cloudflare).

### Automated deploy (CI)

Two workflows:

- **`.github/workflows/ci.yml`** runs on every PR: format, lint, typecheck, and test.
  If those pass, it deploys a preview with `--branch=<pr branch>`, served at `<pr branch>.uppervalley-tech.pages.dev`.
  The link is in the run summary.
- **`.github/workflows/deploy.yml`** runs on push to **`main`**.
  It runs the same checks, then builds and deploys to production:

  ```
  wrangler pages deploy dist --project-name=uppervalley-tech --branch=main
  ```

`main` is the Pages project's production branch, and Direct Upload projects can't change it.
Any other `--branch` value uploads a preview, and the custom domain won't update.

Previews call the production events API from the browser, which only allows `https://uppervalleytech.org`.
So a preview keeps the events baked in at build time, since the browser's own fetch is blocked.

**Required GitHub repo secrets** (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN`: a custom token scoped to **Account · Cloudflare Pages · Edit**, restricted to your account.
  Nothing broader.
- `CLOUDFLARE_ACCOUNT_ID`: from Workers & Pages → account overview.

The custom domain serves the latest production deployment.

**Branch protection** (Settings → Branches → add a rule for `main`):

- Require a pull request before merging.
- Require status checks to pass, and pick `checks`.

### Manual deploy (from local)

```bash
./scripts/deploy.sh   # npm run build + wrangler pages deploy dist
```

This uses your `wrangler login` session, so **no API token or secrets are needed locally**.
The secrets above are only for CI.

### Custom domain

Add **`uppervalleytech.org`** in the Pages project → Custom domains.
Since the zone is on Cloudflare, it auto-creates the DNS record and TLS cert (SSL is automatic).
This repoints the apex to Pages.

## Events API

The events API (read endpoint + organizer MCP) is a separate service, [`upper-valley-tech-events-mcp`](https://github.com/lvampa/upper-valley-tech-events-mcp), with its own deploy checklist.

## Events auto-rebuild

The site is pre-rendered.
At build time `scripts/prerender.mjs` fetches the events list and bakes it into each page (plus `Event` JSON-LD on `dist/events.html`), so search engines and non-JS AI crawlers see real event content.
That snapshot is only as fresh as the last build.
If the fetch fails, the build still succeeds and bakes no snapshot; the pages then load events in the browser as usual.

To refresh it when events change, the events service triggers a rebuild via a GitHub **`repository_dispatch`** event:

```
POST https://api.github.com/repos/<owner>/<repo>/dispatches
Authorization: Bearer <token>
Accept: application/vnd.github+json
Content-Type: application/json

{ "event_type": "events-updated" }
```

- `<token>` is a fine-grained PAT scoped to this repo with **Contents: write** (the permission the dispatch endpoint requires), or a classic PAT with the `repo` scope.
  Store it as a secret in the events service, never in this repo.
- This fires the `repository_dispatch: events-updated` trigger in `.github/workflows/deploy.yml`.
  It checks out `main` and runs the same checks, build, and deploy as a push to `main`, re-baking the snapshot.
- The **sender** lives in the separate `upper-valley-tech-events-mcp` service and is out of scope for this repo.
  This section documents the contract only.
- Browsers still get live data regardless.
  The client re-fetches events on load and replaces the baked snapshot, so the rebuild only matters for crawlers.
