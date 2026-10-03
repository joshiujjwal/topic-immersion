# Agent instructions

## Setup

```sh
npm ci
npx playwright install chromium
npm run check
```

Start the site with `npm run dev`. There is no build step; `src/` is the static deployable directory.

## Working rules

- Read `docs/spec.md` and the relevant `TODO.md` phase before changing behavior.
- Run the existing suite first. Use vertical red/green cycles: one behavior test, observe its assertion failure, implement, rerun.
- Prefer browser-level behavior tests and the catalog's public interface over implementation details.
- Keep the site plain HTML/CSS/JavaScript. Do not add a framework, backend, CMS, or unrelated refactor.
- Render text safely; validate links as HTTPS and keep all assets/catalog paths working below `/topic-immersion/`.
- Every topic has ten category slots. Populated categories have three verified picks; empty ones have a specific editorial reason. Keep start-path references valid.
- Check redirected titles as well as URL status; providers can return a working but unrelated page. Keep editorial dates distinct from availability claims.
- Do not copy descriptions or invent ratings, costs, availability, or other facts.
- Never remove a test, serve the parent workspace, or publish an unreviewed/private file.

## Release

`npm run check` must pass before publishing. The Pages workflow deploys only `src/` after tests. Review the full diff and verify the actual live project URL; a successful push alone is not release evidence.
