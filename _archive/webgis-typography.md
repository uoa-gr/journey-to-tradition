# Calligraphic Typography System — for a WebGIS's non-map pages

The text character from **liaskos.eu**, ported for the editorial
surfaces of a WebGIS (landing, About, Methods, References, Credits).
Don't apply this to the map UI itself — the map wants tool typography,
not editorial.

---

## 1. Fonts

```ts
// app/layout.tsx
import { Inter, EB_Garamond } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'greek'],
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${ebGaramond.variable}`}>
        {children}
      </body>
    </html>
  )
}
```

- **Inter** is the default via `.className` (wraps everything).
- **EB Garamond** is opt-in through `var(--font-serif)` — you only
  summon it for display moments. That restraint is what keeps it
  feeling calligraphic rather than decorative.

---

## 2. The whole `:root`

```css
:root {
  /* — Monochrome palette, warmer than pure grey — */
  --ink:      #000000;   /* name, h1 */
  --charcoal: #1a1a1a;   /* body */
  --slate:    #404040;   /* descriptions */
  --stone:    #666666;   /* org / org-adjacent */
  --ash:      #888888;   /* meta: dates, locations */
  --mist:     #b0b0b0;   /* underline colour, decorative */
  --fog:      #e0e0e0;   /* hairline borders */
  --paper:    oklch(0.962 0.015 85);  /* accent surface, one step deeper */
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
  --space-1: 0.5rem; --space-2: 1rem;  --space-3: 1.5rem;
  --space-4: 2rem;   --space-5: 2.5rem; --space-6: 3rem;   --space-8: 4rem;

  /* — Line heights — */
  --leading-tight:   1.2;
  --leading-snug:    1.35;
  --leading-normal:  1.5;
  --leading-relaxed: 1.65;
  --leading-loose:   1.8;
}

* , *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; text-size-adjust: 100%; scroll-behavior: smooth; }

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--white);
  color: var(--charcoal);
  line-height: var(--leading-relaxed);
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

---

## 3. The signature patterns — what makes text *look* calligraphic

These classes are the whole voice. Port them as-is.

```css
/* --- Display title (italic serif, staggered line if desired) --- */
.display-title {
  font-family: var(--font-serif), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: clamp(3.5rem, 9vw, 8rem);
  line-height: 0.86;
  letter-spacing: -0.035em;
  color: var(--ink);
}
.display-title > span { display: block; }
.display-title > span:last-child {
  padding-left: clamp(var(--space-2), 2vw, var(--space-4)); /* staggered indent */
}

/* --- Chapter/section head (roman numeral + title, print feel) --- */
.chapter-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  column-gap: clamp(var(--space-3), 3vw, var(--space-5));
  align-items: baseline;
  padding-bottom: clamp(var(--space-2), 1.5vw, var(--space-3));
  border-bottom: 1px solid var(--fog);
}
.chapter-num,
.chapter-title {
  font-family: var(--font-serif), Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: clamp(1.75rem, 2vw + 1rem, 3rem);
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.chapter-num { color: var(--ash); font-variant-numeric: tabular-nums; }

/* --- Lede / italic-serif subtitle under a title --- */
.lede {
  font-family: var(--font-serif), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.1rem, 0.4vw + 1rem, 1.5rem);
  line-height: 1.4;
  color: var(--charcoal);
  max-width: 34ch;
}

/* --- Tracked uppercase label (eyebrow, meta caps) --- */
.label-tracked {
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.26em;   /* 0.14–0.28em depending on confidence */
  color: var(--ash);
}

/* --- Entry title (serif, not italic — a tonal subvariant) --- */
.entry-title {
  font-family: var(--font-serif), Georgia, serif;
  font-style: normal;      /* roman this time */
  font-weight: 500;
  font-size: clamp(1.05rem, 0.4vw + 0.9rem, 1.3rem);
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--ink);
}

/* --- Body prose, optimal measure --- */
.prose {
  font-size: clamp(0.95rem, 0.35vw + 0.9rem, 1.1rem);
  line-height: 1.65;
  color: var(--slate);
  max-width: 68ch;
}

/* --- Link style: understated, hairline underline --- */
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

/* --- Pull quote / blockquote (italic serif, print feel) --- */
.pullquote {
  font-family: var(--font-serif), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.25rem, 0.6vw + 1.1rem, 1.75rem);
  line-height: 1.4;
  color: var(--charcoal);
  max-width: 42ch;
  border-left: 1px solid var(--fog);
  padding-left: clamp(var(--space-2), 2vw, var(--space-4));
}

/* --- Meta line (date, location, small type) --- */
.meta {
  font-size: var(--text-xs);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  color: var(--ash);
  white-space: nowrap;
}

/* --- Dotted row separator (print feel, not a card border) --- */
.rule-dotted   { border-top: 1px dotted var(--fog); }
.rule-hairline { border-top: 1px solid var(--fog); }
```

---

## 4. The 10 tricks doing the heavy lifting

Memorize these. They're the moves that make text read "considered" in
any project.

1. **Italic serif ONLY for display and quotes.** Everything functional
   stays in Inter. The restraint is the whole voice.
2. **One serif weight: 500.** Not 400 (too fragile italic), not 700
   (too shouty). 500 italic is the sweet spot.
3. **Negative tracking on display.** `letter-spacing: -0.025em` for
   mid display, `-0.035em` for the hero. Big italic letters look
   better packed.
4. **Wide tracking + uppercase on small meta.** `letter-spacing:
   0.14em` to `0.28em` — the wider, the more "typographic" it reads.
   Reserve 0.26em+ for the most capital moments (section eyebrows, dt
   labels).
5. **`font-variant-numeric: tabular-nums`** on every date, coordinate,
   scale indicator, page number. Invisible until you notice numbers
   aren't aligned elsewhere.
6. **`clamp()` everywhere for type.** Mobile min → viewport-
   proportional middle → desktop max. No media-query jumps, type
   always fits its frame.
7. **Reading measures: 34ch / 46ch / 68ch.** 34 for ledes, 46 for
   descriptions, 68 for body. These are the print-research sweet
   spots.
8. **Hairlines over cards.** `1px solid var(--fog)` or `1px dotted
   var(--fog)` between things. Never put borders around content — let
   it breathe.
9. **Link underlines at mist colour.** `text-decoration-color:
   var(--mist); text-decoration-thickness: 1px; text-underline-offset:
   2–4px`. Underlines that whisper.
10. **Second-line indent for staggered names.** The `padding-left:
    clamp(...)` on `span:last-child` trick. Works for "Alexandros /
    P. Liaskos", "Natural Hazards / of Greece", any two-line italic
    title. Instant editorial flourish.

---

## 5. Bonus — True small caps via OpenType

If you want real small caps on the tracked labels (instead of CSS
uppercase), EB Garamond supports them:

```css
.label-true-smallcaps {
  font-family: var(--font-serif), Georgia, serif;
  font-variant-caps: all-small-caps;
  letter-spacing: 0.06em;
  font-size: var(--text-xs);
  color: var(--ash);
}
```

Use for the most elevated "Volume I — Methods" kind of headers.

---

## Usage rule

Use `var(--font-serif)` **sparingly** — roughly **4 places per page**
is the limit (hero title, a chapter head, a pull quote, a rare lede).
Past that, it stops feeling like a gesture and starts feeling like a
theme.
