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

The site is a static SPA on **Cloudflare Pages**, deployed via **git
integration**: pushing to `main` builds and deploys production; branches/PRs get
preview deployments. (Requires the repo to be pushed to GitHub.)

### One-time Pages setup

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
pick this repo, then set:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node version: from `.nvmrc` (`22`)
- `VITE_EVENTS_API_URL`: baked in from `config/.env.production` (or set as a
  Pages env var)

Then add the custom domain **`uppervalleytech.org`** in the Pages project.

### Manual deploy (fallback)

Deploy the current working tree without pushing:

```bash
./scripts/deploy.sh   # npm run build + wrangler pages deploy dist
```

## Events API

The events API (read endpoint + organizer MCP) is a separate service —
[`upper-valley-tech-events-mcp`](https://github.com/lvampa/upper-valley-tech-events-mcp) — with its
own deploy checklist.
