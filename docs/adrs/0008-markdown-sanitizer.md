# ADR 0008 — Markdown sanitizer and editor

**Status.** Accepted — 2026-04-22.

## Context

`songs.description_md`, `songs.lyrics_md`, `songs.comments_md`, and
`appendices.content_md` store Markdown authored by Vaggelis (and
future editors). They are rendered on public pages. Without
strict sanitization we have a stored-XSS vector, and without
editor-side validation we accept pastes from Word with tag
contamination.

## Decision

**Sanitize on save *and* on render**; **strict allow-list**;
**`MDXEditor` as the default rich-text editor** in admin, falling
back to a monospace textarea with preview.

### Allow-list (elements)

```
p
br
strong, em
a[href^="http" || href^="https" || href^="/"]   # rel = "noopener nofollow ugc" forced
ul, ol, li
blockquote
code, pre
h3, h4, h5
hr
sup, sub
```

Everything else is stripped. Explicitly rejected:

- `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`,
  `<form>`, `<input>`, `<svg>`, `<math>`
- `on*` event attributes
- `href` / `src` starting with `javascript:`, `data:`, `vbscript:`,
  or `file:`
- CSS `style` attributes
- Any HTML comment

### Pipeline

1. **Save**: `unified()` → `remark-parse` → `remark-gfm` →
   `remark-rehype` → `rehype-sanitize` (custom schema) →
   `rehype-stringify`. Server Action rejects if the sanitized
   output differs from the input beyond whitespace (loud failure
   for editors).
2. **Render**: same pipeline, different rehype plugins
   (`rehype-highlight` for code, `rehype-slug` for headings). No
   raw HTML injection APIs — sanitize runs first, always.
3. **Editor**: MDXEditor wraps a tiptap kernel with the allow-list
   enforced client-side.

### XSS fixture tests

20 canonical payloads must render as inert text. Vitest keeps
these as snapshot fixtures; any regression fails CI. Payload
categories:

- Script injection (`<script>alert(1)</script>`, encoded variants)
- Event-handler attributes (`<img onerror=…>`, `<body onload=…>`)
- Hostile URL schemes (`javascript:`, `data:text/html`, `vbscript:`)
- SVG-based payloads (`<svg onload=…>`, foreign-object injection)
- Encoded entities (double-encoded, mixed-case, nested)
- Markdown reference-style link to a hostile URL scheme
- Link with unicode homograph / bidi override
- CSS expression / `style="…"` injection
- Template-string injection (`${alert(1)}`)
- HTML comment abuse (`<!--[if IE]><script>…<![endif]-->`)

## Consequences

- **Positive.** One canonical allow-list, enforced at save + render.
  No surprise HTML ever reaches the DOM. Predictable copy-from-Word
  experience because the sanitizer is strict.
- **Negative.** No inline images in description / lyrics / comments
  at v1 (images must go in `appendices` where we render through a
  separate flow). We accept this; adding images later is adding
  one tag to the allow-list + an upload flow.

## References

- [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize)
- [MDXEditor](https://mdxeditor.dev/)
- [OWASP Cross-Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
