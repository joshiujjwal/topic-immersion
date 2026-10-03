# Topic Immersion

An editorial, HTML-first guide to learning a subject from first principles, with a human-curated trail through books, videos, courses, podcasts, essays, communities, and screen stories.

**Status:** Working MVP

**Live site:** https://joshiujjwal.github.io/topic-immersion/

## Stack

- Semantic HTML, CSS, and browser-native JavaScript
- A checked-in JSON resource catalog; no backend or runtime framework
- Node.js 22, `node:test`, Playwright, ESLint, and Prettier for development
- GitHub Pages for static hosting

## Getting started

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open the address printed by the development server. Run the checks with:

```sh
npm run check
```

`npm run check` includes formatting, lint, catalog tests, and browser tests. There is no build step. The site is served from `src/`; the Pages workflow deploys that directory as-is.

## Initial topics

Sales, Business Strategy, Large Language Models, Violin, and Painting. Search covers those curated subjects and their aliases; it does not generate or fetch arbitrary-topic recommendations.

## Project structure

```text
src/                         Deployable static site
  data/topics.json           Curated topics and recommendations
  catalog.js                 Catalog validation and search
  app.js                     Browser interaction and rendering
tests/                       Catalog and browser behavior tests
docs/spec.md                 Product and editorial contract
docs/adr/                    Architecture decision records
.github/workflows/           Checks and GitHub Pages deployment
```

## Contributing

Start by running the existing checks. For each behavior, write one test, observe the expected assertion failure, implement the smallest complete change, then rerun the relevant tests. Review the complete diff and recommendation sources before publishing.

Do not add speculative recommendations or copied publisher descriptions. Each populated category has exactly three verified picks; explain why an inapplicable category is omitted. Pull requests must include test output and manual evidence for accessibility or visual changes. Never publish secrets or unreviewed content.

## Content maintenance

Each topic has ten stable category slots. A populated slot has exactly three directly linked, annotated resources; an empty slot has an editorial reason. Resource records carry a verification date, and three different in-topic resources form the suggested starting path. Recheck links and access claims when revising recommendations.

The launch collection has 138 recommendations across the five subjects. Dates represent
editorial source review, not a guarantee of continued availability. Some providers block
automated access, require accounts, or change terms; no prices, ratings, or streaming
availability are inferred. Movies and television are cultural context, not instruction.

To add or update a topic, edit `src/data/topics.json`, preserve the ten category IDs
and their order, provide a primer and sources, and point `startHere` at three distinct
resource IDs. Use direct provider destinations and original annotations. Run
`npm run check`, review the rendered topic at mobile and desktop widths, and recheck
the linked material before committing.

## Publishing

GitHub Actions checks changes before packaging only `src/` for Pages. A successful push is not proof of deployment; confirm the live page and its project-prefixed asset and catalog URLs.

### Verification evidence

The automated suite covers catalog invariants, all five guides, aliases, ambiguous
and unknown queries, retryable catalog errors, explicit loading states, narrow-screen
layout, safe text rendering, and resource-text contrast. Desktop/mobile screenshots
and provider-link checks are recorded in the development session, outside the Pages
artifact. A human editorial and assistive-technology review is still recommended;
automated checks are not a substitute for either.
