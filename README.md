# Upper Valley Tech — Website

The site for the Upper Valley (NH + VT) monthly tech meetup. Vite + React +
TypeScript single-page app that fetches events at runtime from the events API.

Live: <https://uppervalleytech.org>

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

The site reads events from `VITE_EVENTS_API_URL` (root `.env`, gitignored,
defaults to `http://localhost:8799`). For a full local stack, also run the events API —
[`upper-valley-tech-events-mcp`](https://github.com/lvampa/upper-valley-tech-events-mcp) — on :8799.

## Commands

| Command         | What                             |
| --------------- | -------------------------------- |
| `npm run dev`   | dev server                       |
| `npm run build` | production build → `dist/`       |
| `npm test`      | tests (Vitest + Testing Library) |
| `npm run lint`  | ESLint                           |
| `npm run ladle` | component explorer               |

## Structure

```
src/
  components/   design-system components (core, brand, events, navigation)
  screens/      Home / Events / About / Code of conduct
  lib/          API client, hooks, env, constants, types
  data/         event selectors
  styles/       design tokens + global styles
docs/           deploy + design docs
.env            local dev config (gitignored)
```

Tests live next to the code they cover (`*.test.ts[x]`).

## Docs

- **Deploy & environment** → [`docs/deploy.md`](docs/deploy.md)
- **Events API** → [`upper-valley-tech-events-mcp`](https://github.com/lvampa/upper-valley-tech-events-mcp)

## License

See [`LICENSE`](LICENSE).
