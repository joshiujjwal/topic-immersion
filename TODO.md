# Topic Immersion — Task Breakdown

## How to use this file

For each behavior, write one test, observe the intended assertion failure, implement the smallest complete change, rerun the test, and review the diff. Start a session by running existing tests. Never treat a broken harness as a meaningful red phase.

Each phase is an evidence gate: passing checks and human review are required before release. Record test output and manual evidence; do not claim review that did not happen.

## Phase 0: Foundation

- [x] Confirm product scope and author the first specification.
- [x] Set up Node scripts, linting, formatting, and isolated test server.
- [x] Add an accessible HTML shell and prove it with a browser test.
- [x] Review AI context files and setup instructions.

## Phase 1: Core experience

- [x] Implement and test catalog validation/search through the public catalog interface.
- [x] Complete the Sales topic end-to-end before scaling the catalog.
- [x] Add search, reset, ambiguous match, no-match, and recoverable error behavior.
- [x] Render foundations, concepts, starting path, categories, and annotated cards.
- [x] Review all catalog sources and completeness constraints.

## Phase 2: Remaining topics

- [x] Curate Business Strategy and cover it with catalog and browser acceptance tests.
- [x] Curate LLMs and cover it with catalog and browser acceptance tests.
- [x] Curate Violin and cover it with catalog and browser acceptance tests.
- [x] Curate Painting and cover it with catalog and browser acceptance tests.
- [x] Verify every category is populated with three items or has an editorial omission reason.

## Phase 3: Polish and harden

- [x] Finish the responsive editorial design and automated accessibility checks.
- [x] Test all dependencies under `/topic-immersion/`.
- [x] Verify malformed catalog, fetch errors, unsafe URLs, and retry behavior.
- [x] Review keyboard path, focus, contrast, and mobile screenshots.
- [ ] Obtain human editorial and assistive-technology review before a formal v1 release.

## Phase 4: Ship

- [x] Gate GitHub Pages publication on all quality checks.
- [x] Confirm repository availability and GitHub authentication.
- [ ] Review the public diff and curate content before pushing.
- [ ] Verify the live site, assets, catalog, one search path, and external links.
- [ ] Update README, project instructions, and release evidence after verification.

## Parking lot

- Shareable topic URLs.
- Search topics beyond the five curated launch entries.
- Content editing interface or external catalog storage.

## Lessons learned

- Planning confirmed the workspace is not itself a Git repository; keep this project isolated in its own directory.
- Duplicate resource URLs reject the whole catalog intentionally. Replace duplicate picks rather than weakening validation.
- Provider pages can return HTTP 200 while pointing to the wrong book or video. Check the title and destination after redirects.
- The browser fixture must use a fresh isolated copy of `src/` so a reused server cannot test stale content.
- Subtle metadata needs the same 4.5:1 contrast as other small text; keep the browser contrast regression test.
