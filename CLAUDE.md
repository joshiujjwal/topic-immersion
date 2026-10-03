# Project context

This is an HTML-first one-page editorial guide. Read `docs/spec.md` and `TODO.md` before work.

## Commands

```sh
npm ci
npx playwright install chromium
npm run dev
npm run check
```

## Map

- `src/index.html`, `src/styles.css`: accessible responsive presentation
- `src/app.js`: browser state and safe DOM rendering
- `src/catalog.js`: catalog validation and local topic search
- `src/data/topics.json`: curated content
- `tests/`: Node catalog tests and Playwright behavior tests
- `.github/workflows/pages.yml`: quality checks and static deployment

## Workflow

Run existing tests first. For each behavior, write one failing assertion, implement the smallest change, and rerun it. Review the diff and evidence before updating `TODO.md`.

Do not add a framework or backend. Search only the five curated topics. Keep exactly three resources in populated sections, explain omissions, verify direct sources, and keep the deployed site working at `/topic-immersion/`.

The catalog intentionally rejects duplicate URLs within a topic. Replace duplicate
recommendations instead of weakening that invariant. The Pages test server stages a
fresh copy of `src/`; do not reuse a stale server. Review-date text must keep at least
4.5:1 contrast against the card background.
