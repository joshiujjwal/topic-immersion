# Product Specification: Topic Immersion

## Overview

Topic Immersion is a one-page, beginner-first editorial website. A reader chooses or searches a topic, gets a concise explanation of its underlying ideas, and follows a small curated learning path through external resources.

The launch catalog covers Sales, Business Strategy, Large Language Models (LLMs), Violin, and Painting. Search is local against those five reviewed entries. Unknown topics receive an explicit no-match message, not generated or scraped content.

## Problem

Useful learning material is scattered across books, videos, classes, essays, podcasts, and communities. Beginners may not know what concepts matter, which sources to trust, or where to start. The site should provide enough original framing to make the recommendations navigable without pretending to replace them.

## User journey

1. A visitor sees a short introduction, a labeled search form, and five topic choices; no topic is selected initially.
2. The visitor selects a topic or searches its title or alias.
3. The page presents an original foundations primer, key concepts, a reasoned three-step path, and in-page navigation for relevant content categories.
4. The visitor opens source-linked recommendation cards.
5. An unknown query displays a helpful no-match state and does not preserve unrelated recommendations as if they matched.

## Requirements

### Functional

- [ ] Show exactly the five approved topics and a labeled, keyboard-operable search form.
- [ ] Match titles and explicit aliases case-insensitively, ignoring surrounding and repeated whitespace. Match substrings when no exact match exists.
- [ ] Select one match, show selectable choices for multiple matches, and show an honest no-match for zero matches.
- [ ] Empty search and reset return to the unselected topic chooser.
- [ ] Provide an original overview, relevant key concepts, source references, and a three-step path referencing three distinct resources within the selected topic.
- [ ] Present ten possible resource sections: foundations, books, YouTube, podcasts, open lectures, courses, blogs and essays, creators, communities and subreddits, and movies and TV together.
- [ ] Each populated section contains exactly three recommendations. Each omitted section gives an editorial reason.
- [ ] Each recommendation has a descriptive title, original learning/relevance annotation, source, HTTPS URL, and verification date. Additional factual metadata is included only when checked.
- [ ] Reject invalid catalog content and expose catalog request, response, parse, and validation failures with an actionable retry. Log useful errors; do not silently substitute sample content.
- [ ] Render user query and catalog strings as text, never as executable HTML.
- [ ] Use IMDb title pages for screen works. Any optional Netflix links must be checked and must not imply universal availability.
- [ ] Work beneath GitHub Pages' `/topic-immersion/` project prefix.

### Non-functional

- [ ] No framework, backend, CMS, runtime account, data collection, or external search dependency.
- [ ] Semantic HTML, keyboard operation, visible focus, announced state changes, and readable contrast.
- [ ] Responsive one-page layout with no horizontal overflow at mobile widths or text zoom.
- [ ] Compact newspaper-style typography and ruled columns rather than oversized boxed cards. At 1440×900, the chooser fits within one screen and complete guides stay below 3400px in height. At 375×812, the chooser stays below 1250px; all topic descriptions remain visible.
- [ ] Keep complete recommendation text visible, with no nested scroll areas. Reflow category columns to the available width and text size.
- [ ] System typography and lightweight assets; no required third-party fonts, tracking scripts, or media embeds.
- [ ] CI tests the static site without relying on live third-party resource availability.
- [ ] Publishing uploads only `src/` after required quality checks pass.

## Topics and aliases

| Topic                 | Example aliases                 |
| --------------------- | ------------------------------- |
| Sales                 | selling                         |
| Business Strategy     | strategy, business strategy     |
| Large Language Models | LLM, LLMs, large language model |
| Violin                | violin                          |
| Painting              | painting, visual painting       |

Aliases are deliberate editorial entries, not fuzzy matches. Exact alias collisions across topics are invalid. `brain-computer interfaces` is an example unsupported query, not a launch topic.

## Data model

- **Topic:** stable ID, title, unique aliases, short summary, original first-principles overview, key concepts, source references, three starting-path steps, and one section for each category.
- **Section:** stable category ID and display title, exactly three resources or an empty list with a nonempty omission explanation.
- **Resource:** topic-unique ID, title, HTTPS destination, source/author where applicable, original learning and relevance notes, and `YYYY-MM-DD` verification date.
- **Starting-path step:** an existing resource ID from the same topic and a distinct, original reason for that step.

All ten section IDs must appear exactly once for every topic in canonical order. The starting path references three different resources. Sources are nonempty and use valid HTTPS URLs. Resource IDs are unique within a topic.

## Category order

1. Foundations
2. Books
3. YouTube
4. Podcasts
5. Open lectures
6. Courses
7. Blogs and essays
8. Creators to follow
9. Communities and subreddits
10. Movies and TV

These sections are an editorial taxonomy, not quotas by provider. A relevant category is populated only when three distinct useful recommendations can be verified. Fictional screen works are explicitly labeled as context, not instruction.

## Interfaces

### Catalog module

`createCatalog(raw).search(query)` validates and indexes the catalog once, then returns topic records matching an empty query (all topics), exact title/alias, or normalized substring. Invalid records throw a descriptive error. No match is an empty array.

### Browser page

The browser loads `data/topics.json` relative to the JavaScript module URL. It exposes search, topic selection, reset, section navigation, and a retry action for catalog load failures. In-memory selection is not persisted across reloads.

## Editorial policy

- Write original summaries, primers, concepts, and annotations. Do not copy publisher marketing copy.
- Link to a direct, stable primary source where feasible. Verify both reachability and topical relevance; a working generic home page is not sufficient evidence.
- Cite substantive foundational claims with sources in the topic record.
- Do not invent duration, access, ratings, rankings, availability, credentials, popularity, or pricing.
- Record a verification date for each recommendation. Date stamps document a check, not a guarantee that third-party pages remain available.
- Do not duplicate a resource merely to fill the starting path or a section.
- Explain genuinely inapplicable sections; lack of research is not an acceptable omission reason.
- Cite optional external recommendations without representing them as owned or endorsed content.

## Error, accessibility, and security states

- Loading: visibly announced while the catalog is requested.
- Load/parse/validation error: plain-language explanation, retry button, diagnostic logged.
- No match: announce that the topic is outside the current curated list; offer reset.
- Ambiguous partial match: render distinct topic choices.
- Empty search: restore chooser.
- Use a skip link, landmarks, associated search label, semantic headings, button controls, visible focus, announced result/status updates, and descriptive link names.
- Only allow validated HTTPS URLs for resources. Render untrusted text with DOM text APIs. Never interpolate search input into HTML.
- Provide a `noscript` notice.

## Test plan

- Catalog interface: title/alias matching, whitespace/case normalization, substring results, no match, all-topics empty query, malformed structures, duplicate IDs/aliases, section counts/omissions, HTTPS validation, starting-path references, and date checks.
- Browser integration: initial chooser, search, alias, ambiguous match, no-match after a selection, reset, section links, safe text rendering, retry after failed/malformed catalog, and real content.
- Pages-prefix test: run the real site at `/topic-immersion/` and verify HTML, module, stylesheet, and JSON load correctly.
- Manual review: keyboard-only traversal, mobile layout, zoom, contrast, and outgoing-link editorial verification.
- Do not require a live provider to pass CI.

## Acceptance criteria

- Five topics and approved aliases work locally.
- Each has original foundations copy and a valid three-step resource path.
- Each category contains exactly three verified recommendations or a specific omission reason.
- A missing topic never receives fabricated or stale results.
- Loading failures are visible and recoverable.
- Keyboard and mobile behavior are usable; there is no horizontal overflow.
- All local checks pass and the browser test exercises the literal GitHub Pages subpath.
- Publishing creates/uses the intended public repo only after availability checks and serves the live site successfully.

## Out of scope

Arbitrary-topic recommendations, AI generation, scraping, live aggregation, user accounts, bookmarks, saved progress, CMS, embedded players, payments, analytics, separate topic pages, and automatic Netflix/regional streaming availability.

## Open questions

None for the approved MVP. The repository name and GitHub Pages permissions are external release prerequisites to verify before publishing.
