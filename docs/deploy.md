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

The site is a static SPA on **Cloudflare Pages** (a Direct-Upload project named
`uppervalley-tech`). It is **not** git-integrated — Cloudflare has no access to
the GitHub repo. Instead, deploys run from GitHub Actions using a scoped
Cloudflare API token, so the trust flows one way (GitHub → Cloudflare).

### Automated deploy (CI)

Two workflows:

- **`.github/workflows/ci.yml`** — runs on every PR: format / lint / typecheck /
  test.
- **`.github/workflows/deploy.yml`** — runs on push to **`production`**: builds
  and deploys:

  ```
  wrangler pages deploy dist --project-name=uppervalley-tech --branch=production
  ```

Gating is via branch protection (below): PRs must pass `checks` before merging
to `production`, so only vetted code reaches the deploy workflow.

**Required GitHub repo secrets** (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — a custom token scoped to **Account · Cloudflare Pages
  · Edit**, restricted to your account. Nothing broader.
- `CLOUDFLARE_ACCOUNT_ID` — from Workers & Pages → account overview.

Also set the Pages project's **production branch to `production`** so
`--branch=production` deploys register as production (the custom domain serves
the latest production deployment). Recommended: branch-protect `production` to
require the `checks` job before merge.

### Manual deploy (from local)

```bash
./scripts/deploy.sh   # npm run build + wrangler pages deploy dist
```

This uses your `wrangler login` session — **no API token / secrets needed
locally**. The secrets above are only for CI.

### Custom domain

Add **`uppervalleytech.org`** in the Pages project → Custom domains. Since the
zone is on Cloudflare, it auto-creates the DNS record and TLS cert (SSL is
automatic); this repoints the apex to Pages.

## Events API

The events API (read endpoint + organizer MCP) is a separate service —
[`upper-valley-tech-events-mcp`](https://github.com/lvampa/upper-valley-tech-events-mcp) — with its
own deploy checklist.
