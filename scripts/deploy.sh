#!/usr/bin/env bash
# Manual deploy from local. Normal deploys run in CI on merge to `production`
# (.github/workflows/ci.yml). Use this to deploy the current working tree
# without pushing. Requires `wrangler login` (or CLOUDFLARE_API_TOKEN set).
#
# The production API URL is injected here (not stored in a committed .env file);
# the root .env holds only the local dev value.
set -e
cd "$(dirname "$0")/.." # run from repo root regardless of where it's invoked
VITE_EVENTS_API_URL=https://api.uppervalleytech.org npm run build
npx wrangler pages deploy dist --project-name=uppervalley-tech --branch=production
