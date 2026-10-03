---
applyTo: 'src/**/*'
---

- Preserve semantic HTML, keyboard interaction, visible focus, and announced state changes.
- Use DOM text APIs for catalog/query text; never interpolate untrusted strings as HTML.
- Keep assets and JSON module-relative so the site works at `/topic-immersion/`.
- Use the catalog module's public interface; do not duplicate topic matching in the browser.
- Never invent missing recommendations or silently replace malformed catalog data.
