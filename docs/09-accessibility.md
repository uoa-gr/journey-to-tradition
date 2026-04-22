# 09 — Accessibility (WCAG 2.1 AA)

> Accessibility is not a bolt-on. The commitments below are in
> scope for v1; a pass-through audit with real assistive-tech
> testing happens in Phase 11 before public launch.

---

## 1. Commitment

**Target: WCAG 2.1 AA**, without POUR (Perceivable / Operable /
Understandable / Robust) regressions between releases.

Double-A only — we do not claim AAA, which has rules (e.g. sign
language interpretation, very high contrast throughout) we are not
engineered to meet at v1.

## 2. Language and pronunciation

- `<html lang="el">` always.
- Latin gloss text (`"Journey to Tradition"`, English excerpts) is
  wrapped in `<span lang="en">…</span>` so screen readers switch
  voices.
- Song lyrics keep `lang="el"` by default; bilingual sections mark
  the non-Greek portion with a nested `<span lang="tr">`,
  `<span lang="pnt">` (Pontic Greek), etc.

## 3. Keyboard

- Every interactive element reachable with **Tab** in visible
  order; **Shift+Tab** reverses.
- Focus ring visible at all times (`:focus-visible` with high
  contrast against `--white` background).
- Keyboard map interaction:
  - **Tab** cycles through focusable regions on the map (region
    polygons, village markers, filter chips, song-panel controls).
  - **Enter** / **Space** selects the focused item.
  - **Esc** closes popovers and unpins the song panel.
  - Arrow keys inside a combobox behave per WAI-ARIA combobox
    pattern.
- No mouse-only controls. No drag-only controls (leaflet-geoman's
  vertex drag is paired with keyboard insert/delete for admins).

## 4. Screen reader

- Semantic HTML first: `<nav>`, `<main>`, `<aside>`, `<article>`,
  `<dialog>`. ARIA only where no native element fits.
- Map has a **non-map fallback** linked from the page: a
  tabular view with region → subregion → song counts + links.
  This is the primary navigation path for screen-reader users.
- Region polygons carry `aria-label` equal to `name_el`; marker
  villages carry `aria-label` of `name_el + region name`.
- The `11/15` counter is `aria-live="polite"` and announces
  "Τραγούδι 11 από 15" on change.
- Audio player uses native `<audio controls>`; keyboard-accessible
  and SR-readable out of the box.
- Modal dialogs implement focus-trap + `aria-modal="true"` +
  initial focus on the first interactive element.

## 5. Colour and contrast

- Body text `--charcoal` (#1a1a1a) on `--white` (≈ #fdfcf6) —
  **19:1**, well above AA's 4.5:1.
- Secondary text `--slate` (#404040) on `--white` — **10:1**, AA+.
- Tertiary text `--stone` (#666666) on `--white` — **6:1**, AA.
- **`--ash` (#888888) on `--white` ≈ 3.5:1 — FAILS AA for body
  text.** Restricted to **decorative meta** (dates,
  coordinates, the `11/15` counter) that is not essential for
  comprehension — repeated elsewhere as accessible name or hidden
  from AT.
- **`--mist` (#b0b0b0) on `--white` ≈ 2.3:1 — decorative only**
  (underline-tints, hairline borders). Never used as text.
- No information is conveyed by colour alone. Categories get
  icons / labels, map regions get distinct fills paired with
  labels on hover/focus.

Contrast checked automatically via `axe-core` in Playwright and in
Biome's a11y rules.

## 6. Motion

- `@media (prefers-reduced-motion: reduce)` disables
  - map pan/zoom animation,
  - panel slide-in,
  - hover micro-transitions beyond 150 ms,
  - any `scroll-behavior: smooth`.
- No auto-playing video. Audio is opt-in (click to play).
- No parallax, no carousel with auto-advance.

## 7. Text

- Base font-size 16 px; `rem` / `clamp()` scaling respects user
  root font-size preference.
- Line-length 68ch on body prose (see
  [04-typography.md §5](04-typography.md)).
- No all-caps for long text (already enforced by the typography
  system; all-caps is reserved for tracked labels ≤ 4 words).
- Text resize up to 200% without loss of functionality (tested in
  Lighthouse + manual).

## 8. Forms

- Every form control has a visible `<label>` (not a placeholder
  label).
- Required fields marked with text `*` and `aria-required="true"`.
- Validation errors surface inline with `aria-invalid="true"` +
  `aria-describedby` pointing at the error element. Errors written
  in Greek, not jargon.
- Form submission is not solely a click — Enter inside a field
  submits the form (or triggers the natural default per the form).

## 9. The map — particular attention

The map is the hardest surface to make accessible. Our approach:

1. **Alternative data view.** A link from the main page (always
   visible, not hidden in a menu) leads to a tabular,
   keyboard-navigable "Songs list" page. This is a full substitute
   for the map for screen-reader and keyboard-only users.
2. **Map itself supports basic keyboard** via Leaflet's built-in
   keyboard navigation. We do not try to make the map SR-usable
   (few maps are).
3. **Labels exposed** — region polygons on hover/focus show the
   name in a tooltip that is also SR-readable.
4. **Colours + patterns** — selected region differs by fill
   (opacity) AND stroke width AND label weight, not colour alone.

## 10. Automation and manual testing

- **`axe-core` via `@axe-core/playwright`** runs on every e2e
  test; fails CI on "serious" or "critical" violations.
- **Lighthouse CI** a11y score ≥ 95 gate on every PR.
- **Biome** lint rules `a11y/*` enforced (`alt` text required,
  label for control, no positive tabindex, …).
- Manual: one NVDA pass on Windows, one VoiceOver pass on macOS
  per release.

## 11. Documents

Downloadable PDFs (if we ship them in Phase 11+) are **tagged
PDFs** with an outline, language metadata, and alternative text
on figures.
