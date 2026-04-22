# 04 — Typography

> The editorial voice for non-map surfaces. Adapted for this project
> from the `liaskos.eu` calligraphic system (original preserved at
> [`_archive/webgis-typography.md`](../_archive/webgis-typography.md)).

---

## 0. Scope

This system dresses the **editorial surfaces** — landing, About,
Methods, References, Credits, and the song detail panel. **Do not
apply it to the map UI itself.** The map wants tool typography:
small, neutral, tabular.

Three voices coexist in this project:
1. **Editorial voice** — hero, chapter heads, ledes, body prose,
   pull quotes (this document, §§ 2–5).
2. **Map-tool voice** — popups, legends, filter chips, coordinate
   badges (§ 6).
3. **Song-panel voice** — a hybrid: serif for the song title and
   alt-title (per Vaggelis' `Title……. [Alternative Title…….]`
   pattern), Inter for everything else in the panel so readers can
   skim a stack of songs quickly (§ 7).

---

## 1. Project-specific adjustments (deltas from the original)

### 1.1 Greek-first
- **Inter must include the `greek` subset.** Non-negotiable — the
  entire UI is in Greek.
- **EB Garamond has incomplete Greek coverage.** We keep it **only
  for Latin display moments** — e.g. the English gloss "Journey to
  Tradition" under a Greek hero, or a Latin epigraph. We **do not**
  set Greek display text in EB Garamond; glyph substitution is
  visible and jarring.
- For **Greek display text**, substitute one of:
  - **GFS Didot** (classic Greek didone, scholarly feel)
  - **Neuton** (humanist serif with full Greek)
  - **Inter Display** (sans fallback — neutral, always available)

  Candidate files and a side-by-side comparison happen in **Phase 3**
  once we see the hero set against real headline text.

### 1.2 Line-height note for Greek
Greek has taller accents than Latin; add **~0.05** to every
line-height when a block is Greek-heavy. In particular:
```css
.display-title { line-height: 0.92; /* was 0.86 in liaskos.eu */ }
.chapter-title { line-height: 1.05; /* was 1.0 */ }
```
Tune during Phase 3.

### 1.3 Numerals
`font-variant-numeric: tabular-nums` on **every** instance of:
- Song counter `11/15`
- Coordinates in map popups
- Year / century in metadata
- Page numbers in PDFs (if we ever produce them)

---

## 2. Font loading (Next.js App Router)

```ts
// app/layout.tsx
import { Inter, EB_Garamond } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'greek'],        // ← both, always
  display: 'swap',
  variable: '--font-sans',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],                 // no 'greek'; we don't set Greek in Garamond
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['500'],                    // one weight only
  variable: '--font-serif',
})

export default function RootLayout({ children }) {
  return (
    <html lang="el">
      <body className={`${inter.variable} ${ebGaramond.variable}`}>
        {children}
      </body>
    </html>
  )
}
```

- Inter is the default via `--font-sans`.
- EB Garamond is opt-in through `var(--font-serif)` — summon it only
  for Latin display moments (see §1.1).

---

## 3. `:root` tokens

```css
:root {
  /* — Monochrome palette, warmer than pure grey — */
  --ink:      #000000;   /* h1, song title */
  --charcoal: #1a1a1a;   /* body */
  --slate:    #404040;   /* descriptions */
  --stone:    #666666;   /* secondary meta */
  --ash:      #888888;   /* tertiary meta: dates, locations, the 11/15 counter */
  --mist:     #b0b0b0;   /* underline colour, decorative */
  --fog:      #e0e0e0;   /* hairline borders */
  --paper:    oklch(0.962 0.015 85);  /* panel surface, one step deeper than bg */
  --white:    oklch(0.982 0.011 85);  /* body background — creamy off-white */

  /* — Type scale (1.2 Minor Third) — */
  --text-2xs: 0.694rem;   /* 11.1px — footnotes, tracked labels */
  --text-xs:  0.833rem;   /* 13.3px — meta info */
  --text-sm:  0.889rem;   /* 14.2px — dense lists */
  --text-base: 1rem;      /* 16px — body */
  --text-md:  1.125rem;   /* 18px — emphasized body */
  --text-lg:  1.2rem;     /* 19.2px — subtitles */
  --text-xl:  1.44rem;    /* 23px */
  --text-2xl: 1.728rem;   /* 27.6px */
  --text-3xl: 2.074rem;   /* 33.2px */

  /* — 8px vertical rhythm — */
  --space-1: 0.5rem;  --space-2: 1rem;   --space-3: 1.5rem;
  --space-4: 2rem;    --space-5: 2.5rem; --space-6: 3rem;   --space-8: 4rem;

  /* — Line heights (Greek-tuned; see §1.2) — */
  --leading-tight:   1.25;    /* was 1.2 */
  --leading-snug:    1.4;     /* was 1.35 */
  --leading-normal:  1.55;    /* was 1.5 */
  --leading-relaxed: 1.7;     /* was 1.65 */
  --leading-loose:   1.85;    /* was 1.8 */
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 16px;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--white);
  color: var(--charcoal);
  line-height: var(--leading-relaxed);
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

---

## 4. Signature patterns — editorial voice

Port as-is (adapted line-heights and font-variables from §§ 1–3).

```css
/* --- Display title (italic serif for Latin; sans for Greek) --- */
.display-title {
  font-family: var(--font-serif), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: clamp(3.5rem, 9vw, 8rem);
  line-height: 0.92;                    /* Greek-tuned */
  letter-spacing: -0.035em;
  color: var(--ink);
}
.display-title[lang="el"] {
  font-family: var(--font-sans);        /* no Greek in Garamond */
  font-style: normal;
  font-weight: 500;
  letter-spacing: -0.03em;
}
.display-title > span { display: block; }
.display-title > span:last-child {
  padding-left: clamp(var(--space-2), 2vw, var(--space-4));
}

/* --- Chapter / section head (roman numeral + title, print feel) --- */
.chapter-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  column-gap: clamp(var(--space-3), 3vw, var(--space-5));
  align-items: baseline;
  padding-bottom: clamp(var(--space-2), 1.5vw, var(--space-3));
  border-bottom: 1px solid var(--fog);
}
.chapter-num, .chapter-title {
  font-family: var(--font-serif), Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: clamp(1.75rem, 2vw + 1rem, 3rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.chapter-num { color: var(--ash); font-variant-numeric: tabular-nums; }

/* --- Lede / italic subtitle under a title --- */
.lede {
  font-family: var(--font-serif), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.1rem, 0.4vw + 1rem, 1.5rem);
  line-height: 1.45;
  color: var(--charcoal);
  max-width: 34ch;
}

/* --- Tracked uppercase label (eyebrow, meta caps) --- */
.label-tracked {
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.26em;
  color: var(--ash);
}

/* --- Entry title (serif, not italic) — used in index lists --- */
.entry-title {
  font-family: var(--font-serif), Georgia, serif;
  font-style: normal;
  font-weight: 500;
  font-size: clamp(1.05rem, 0.4vw + 0.9rem, 1.3rem);
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--ink);
}

/* --- Body prose, optimal measure --- */
.prose {
  font-size: clamp(0.95rem, 0.35vw + 0.9rem, 1.1rem);
  line-height: 1.7;
  color: var(--slate);
  max-width: 68ch;
}

/* --- Link style --- */
.prose a, a.link {
  color: var(--charcoal);
  text-decoration-line: underline;
  text-decoration-color: var(--mist);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: text-decoration-color 0.15s ease;
}
.prose a:hover, a.link:hover {
  color: var(--ink);
  text-decoration-color: var(--ink);
}

/* --- Pull quote / blockquote --- */
.pullquote {
  font-family: var(--font-serif), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.25rem, 0.6vw + 1.1rem, 1.75rem);
  line-height: 1.45;
  color: var(--charcoal);
  max-width: 42ch;
  border-left: 1px solid var(--fog);
  padding-left: clamp(var(--space-2), 2vw, var(--space-4));
}

/* --- Lyrics block — Vaggelis asked for centred, breathing space --- */
.lyrics {
  font-family: var(--font-serif), Georgia, serif;
  font-style: normal;
  font-weight: 500;
  font-size: clamp(1rem, 0.4vw + 0.9rem, 1.2rem);
  line-height: 1.8;
  color: var(--charcoal);
  text-align: center;
  max-width: 46ch;
  margin-inline: auto;
}
.lyrics p + p { margin-top: var(--space-3); }

/* --- Meta line (date, location, small type) --- */
.meta {
  font-size: var(--text-xs);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  color: var(--ash);
  white-space: nowrap;
}

/* --- Rules --- */
.rule-dotted   { border-top: 1px dotted var(--fog); }
.rule-hairline { border-top: 1px solid var(--fog); }
```

---

## 5. The ten tricks (why it reads "considered")

Carried forward from the original. Memorize these — they are the
moves that make editorial text look intentional.

1. **Italic serif ONLY for Latin display and quotes.** Everything
   functional and everything Greek stays in Inter. The restraint is
   the whole voice.
2. **One serif weight: 500.** Not 400 (too fragile italic), not 700
   (too shouty).
3. **Negative tracking on display.** `-0.025em` for mid display,
   `-0.035em` for the hero. Big italic letters look better packed.
4. **Wide tracking + uppercase on small meta.** `0.14em`–`0.28em`.
   Reserve `0.26em`+ for the most capital moments.
5. **`font-variant-numeric: tabular-nums`** on every number.
6. **`clamp()` everywhere for type.** Mobile min → viewport
   mid → desktop max.
7. **Reading measures: 34ch / 46ch / 68ch.** 34 for ledes, 46 for
   lyrics/descriptions, 68 for body.
8. **Hairlines over cards.** Never put borders around content.
9. **Link underlines at mist colour.** Underlines that whisper.
10. **Second-line indent for staggered names / two-line titles.**

---

## 6. Map-tool typography (do NOT use editorial here)

Applies to: map popups, filter chips, legend, the attribution
footer, scale bar, coordinate readouts, the `11/15` song counter on
the panel top-bar.

```css
.map-ui {
  font-family: var(--font-sans);
  font-size: 13px;                      /* 13px, not clamp — never scale tool UI */
  line-height: 1.4;
  color: var(--slate);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  font-style: normal;
}
.map-ui .counter { color: var(--ash); }
.map-ui .coord   { color: var(--stone); white-space: nowrap; }
.map-ui button   { font-weight: 500; }
```

**Rules:**
- No italics, no serif, no clamp-based sizing.
- No tracked caps (feels ceremonial where we want neutral).
- Height: icon-button 32px, chip 28px, popup max-width 280px.

---

## 7. Song-panel typography (hybrid)

The floating right-side panel in Vaggelis' sketch is a reading
surface (the song's description, lyrics, comments), but it is
*inside* an app context. We split the difference:

- **Song title** — `.entry-title` + optional italic alt-title
  rendered inline: `Title……. [Alternative Title……..]`.
- **Metadata block** (rhythm, dance, recording, language, sources)
  — `.meta` bullets separated by middle dots.
- **Description** — `.prose`.
- **Lyrics** — `.lyrics` (centred).
- **Comments** — smaller prose, indented from lyrics, `color:
  var(--stone)`.
- **Cross-references** — chips styled like `.map-ui` chips but with
  serif label, to hint at "this navigates away to another song".
- **Audio** — native `<audio controls>` styled minimally (`border:
  1px solid var(--fog); border-radius: 0`).

```tsx
<aside className="song-panel">
  <header className="flex items-baseline gap-3">
    <span className="label-tracked">{code}</span>
    <span className="meta">{counter}/{total}</span>
  </header>
  <h2 className="entry-title">
    {title}
    {altTitle && <em className="alt"> [{altTitle}]</em>}
  </h2>
  <dl className="meta grid gap-1 mt-2">…</dl>
  <p className="prose mt-4">{description}</p>
  <section className="lyrics mt-6">{lyrics}</section>
  <aside className="comments mt-4">{comments}</aside>
  <footer className="mt-6 rule-hairline pt-4">
    <audio controls src={audioUrl} />
    <ul className="xrefs mt-3">{…}</ul>
  </footer>
</aside>
```

---

## Usage rule (unchanged from original)

Use `var(--font-serif)` **sparingly** — roughly **4 places per
page** is the limit (hero title, a chapter head, a pull quote, a
rare lede). Past that, it stops feeling like a gesture and starts
feeling like a theme.

For this project specifically, on public pages with Greek-only text,
`--font-serif` usage will often be **zero or one** per page (the
Latin gloss, if present). That is correct — the Greek hero set in
Inter with tight negative tracking is the default.
