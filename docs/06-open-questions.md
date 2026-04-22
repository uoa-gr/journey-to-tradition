# 06 — Open questions for Vaggelis

> Send this as-is to Vaggelis. He replies (in the meeting he
> proposed), we update [01-requirements.md](01-requirements.md)
> accordingly, and we proceed to Phase 0.

---

## Q1 — Rename for *Επί μέρους υποπεριοχή*

**Context.** In your email you wrote that "Επί μέρους υποπεριοχή"
needs a better name. This is the tier between sub-region
(υποπεριοχή) and village — e.g. Thesprotia inside Epirus, Ηλεία
inside the Peloponnese.

**Options we've considered.**
1. **Περιφέρεια** — but this clashes with the official
   administrative term.
2. **Επαρχία** — historically loaded (pre-Καποδίστριας), might not
   fit the ethnomusicological cut.
3. **Τοπική ενότητα** — neutral but bureaucratic.
4. **Your own term** — likely best; you have the scholarly ear.

**Implementation note.** Our schema has a `label_override`
field on each specific-sub-region row, so we can tune individual
rows (e.g. "Θεσπρωτία" renders as "Θεσπρωτία", but
"Νομός Φλώρινας" as "Νομός"). The tier-level label is a single
setting we flip everywhere.

**Decision needed by:** before Phase 4 (map MVP).

---

## Q2 — Audio file naming convention

**Proposal.** `<region_code>/<song_code>.<ext>`, e.g.
`EPE/EPE-THS-001.mp3` for a Thesprotian song in Epirus.

- `region_code` — uppercase short code per region (we'll propose
  codes when we ingest your regions list).
- `song_code` — auto-generated per §4.1 of
  [01-requirements.md](01-requirements.md#41-code---κωδικός).
- `ext` — `mp3` preferred. `m4a` and `ogg` accepted as fallback.

**Alternative.** Flat `<song_code>.mp3` (no region subfolder). Fewer
directories; easier to paste into S3 browsers. Harder to scan by
region when downloading.

**Decision needed by:** before Phase 1 (schema).

---

## Q3 — Storage budget

We need rough numbers to pick the Supabase plan.

- **How many songs, total, over the next 2 years?** (100s? 1000s?)
- **Average song length?** (1 min, 3 min, 10 min)
- **Any higher-fidelity masters** (e.g. WAV) we should store
  alongside the streaming MP3?

**Implications.**
- Supabase Pro: 100 GB included. 1000 songs × 5 min × 128 kbps
  ≈ 5 GB. Well within Pro.
- If you want WAV masters (~60 MB per 5-min song): 1000 songs
  = 60 GB. Still fits Pro; tighter.
- Above 10,000 songs including masters → we consider Cloudflare R2
  as a cheaper archive tier while keeping streaming files on
  Supabase.

**Decision needed by:** before Phase 9 (audio).

---

## Q4 — Keyword search scope

In your email you mentioned the keyword search should look in
descriptions, lyrics and comments, and suggested options like
"match in lyrics, description, both".

**Proposal A (simple).** Always search all three fields; rank by
`tsvector` weights (title = A, alt-title = B, description/lyrics =
C, comments = D).

**Proposal B (scoped).** Add a segmented control above the search
input: "Όλα" | "Στίχοι" | "Περιγραφή" | "Σχόλια". Default to
"Όλα".

**Recommendation.** A for v1, add B later if you find yourself
wishing for it.

**Decision needed by:** before Phase 10 (search).

---

## Q5 — Greek-first for v1, English later?

**Confirmed this session** that the v1 UI is Greek-only. The schema
already has `name_en` columns so adding English later is a data
task, not a migration. Please confirm this is what you want — if
you'd like EN from day one, say so and we'll expand Phase 3.

---

## Q6 — Domain and DNS

You said hosting will link to your domain once you finish the
setup. What's the expected timeline? We need to know so we can:

1. Configure Vercel to serve the production branch on that domain.
2. Set up email (the Supabase magic-link sender will need DKIM/SPF
   on that domain or we use a Resend/Postmark subdomain).

**Decision needed by:** before Phase 11 (production deploy).

---

## Q7 — Categories: provide the canonical list

We haven't invented any categories. Please send us:
- The full list of categories you want pre-seeded (e.g.
  "Κλέφτικο", "Μοιρολόι", "Γαμήλιο", …).
- The description text for each (used as the hover tooltip in
  filters).

**Decision needed by:** before Phase 2 (data ingest).

---

## Q8 — Rhythms, dances, languages: provide the canonical lists

Same as Q7 but for:
- `rhythms` — with the appendix text for each, if you already have
  it.
- `dances` — simple names suffice.
- `languages` — short list; we'll use ISO-639 codes internally.

---

## Q9 — Cross-reference directionality

A cross-reference between two songs: should it be **symmetric**
(if song A links to song B with "melodic similarity", the link
appears on both song panels automatically) or **directional**
(you control each direction independently, e.g. A → B is "melodic",
B → A is "ancestor-of")?

**Recommendation.** Symmetric for `melodic` and `rhythmic` (those
are inherently bidirectional); directional for `lyrical` and
`thematic` (those can be "references", "parody of", etc.).

We can enforce this in code — Vaggelis never has to think about
"adding the other direction".

---

## Q10 — Information sources: link priority

For songs with both a link and a bibliographic entry, display
order in the panel?

**Proposal.** Link first (clickable, visible as URL), then
bibliography (italic serif, indented). One per line.

---

## Q11 — Audio legality fallback

You noted YouTube ToS as a concern if we ever embedded instead
of hosted. We're not embedding, so this is moot — but we should
note: for songs where we don't have the rights to self-host the
audio, we can:

1. **Show no audio** (field hidden per display rules).
2. **Show a plain text "Πηγή ήχου" entry** with the URL (no
   player), so visitors can click through to the source.

Which do you prefer?

---

## Non-urgent — for the post-v1 meeting

- **Printable song sheets** (PDF export of a song's panel) — worth
  the effort?
- **Playlists** / user-collected favourites — out of scope for v1;
  keep?
- **Public editorial essays** linking multiple songs — the
  appendices can host these; confirm?
- **Analytics opt-in** (Vercel Analytics is cookieless) — OK?

---

# Questions from the April-2026 review

These emerged from a structured audit of your email against
modern WebGIS practice (see
[07-review-findings.md](07-review-findings.md) for the full
rationale). Each is a place where your original suggestion still
works but we want to check whether an alternative serves you
better.

---

## Q12 — Content licence (critical — blocks public launch)

We need a licence model for two kinds of content:

- **Per-song audio**: we propose an `audio_license` enum
  (`public_domain`, `cc_by`, `cc_by_sa`, `cc_by_nc`, `cc_by_nc_sa`,
  `all_rights_reserved`, `uncleared`). Default `uncleared` — audio
  hidden until you set a licence. Does this model match your
  real-world collection's rights spread?
- **Site-wide text and metadata**: we propose **CC BY-NC 4.0**,
  attribution to *Evangelos Spyrou / NKUA*. OK?

Details in [11-content-policy.md](11-content-policy.md).

## Q13 — Categories: cap at 3 or unlimited with weights?

You proposed 1–3 categories per song, ranked. The 3 cap plus
ranking forces editorial decisions ("is this song *primarily* a
lament or *primarily* a dance song?") that may not reflect
reality. Alternatives:

- **Keep as-is**: 1–3 ranked categories. Simple, disciplined.
- **Unlimited categories, no ranking**: tag model. More flexible
  but loses "primary category" for UI pills / summaries.
- **Unlimited, with weights (0.1–1.0)**: most expressive, most
  complex to author.

Our recommendation: keep 1–3 ranked for v1; revisit if Vaggelis
finds himself fighting the cap.

## Q14 — Panel layout instead of table?

You mentioned a tabular layout for the 14 song fields, pending
revision. Our recommendation: your sketch's right-side **stacked
panel** is a better fit than a table for mixed-type content
(long prose, lyrics, arrays, audio, cross-refs). We'll build the
panel prototype first; you confirm or redirect.

## Q15 — Filter order — category / language before geography?

Your proposed filter order is geography-first (Region → Sub →
Specific Sub → Island → Village → Title → Category → Rhythm →
Dance → Language → Keywords). Many visitors arrive looking for
*genre* or *language* before geography ("show me all laments" /
"show me Pontic songs"). Should we surface Category and Language
higher?

Our recommendation: Region first (it's the only required field),
then Category, then Language, then the rest. Easy to test in
Phase 6.

## Q16 — Combobox instead of text-input + dropdown?

You proposed "text input + dropdown" combos on most filters.
Modern pattern: a single **combobox** (one input that combines
typeahead + dropdown). Cleaner, faster, accessible by default.
With `unaccent` + trigram fuzzy, typing "βρυση" matches "βρύση".

Our recommendation: use comboboxes for all typeable filters
(Category, Rhythm, Dance, Title). Language stays as a plain
dropdown (per your note).

## Q17 — Multi-scope keyword search?

You proposed one keyword field searching description + lyrics +
comments together, with scoping "options". We propose:

- **Default**: search all three with weighted FTS
  (title A, alt-title B, description/lyrics C, comments D) +
  `unaccent` so diacritics don't matter.
- **Scope chips** above the input: `Όλα | Στίχοι | Περιγραφή
  | Σχόλια`. Default `Όλα`.

OK?

## Q18 — Song-code immutability after edits

A song's code is generated from its geography
(`<region>-<sub>-NNN`). If a curator later corrects a song's
sub-region, the code would "want" to change. But scholarly
citations depend on a stable code.

**Proposal**: codes are assigned at creation and **never change**,
even if geography is corrected later. The admin UI warns:
*"this song's code encodes the previous sub-region; it will stay
stable to preserve citations"*.

OK?

## Q19 — Multi-region songs (migrant traditions)

Your rule: "every song must belong to exactly one region". But
Pontus migrant songs may live in Macedonia; Asia Minor songs
landed in many regions. Should a song be able to carry **one
primary region** + **several related regions** (many-to-many
junction)?

Our recommendation: add a `song_related_regions(song_id,
region_id, relation enum('origin','migration','variant'))` table
for v1. Requires no change to the primary-region rule; the
primary still drives the song code. Costs one small table.

## Q20 — Cross-references: multiple relation types per pair?

Current schema: one `(song_A, song_B, relation_type)` row per
relation. If Song A relates to Song B via both **melodic** and
**lyrical** similarity, that's two rows (which is fine). Current
PK enforces this.

**Question**: do you want the UI to merge these into a single
"A ↔ B (melodic + lyrical)" badge, or show them separately? No
schema change either way; UX preference only.

## Q21 — Cross-reference symmetry

For **melodic** and **rhythmic** similarities, relations are
naturally symmetric (A ~ B iff B ~ A). For **lyrical** and
**thematic**, directionality can matter ("A is a parody of B").

**Proposal**: store one direction; a SQL view unions both
directions for `melodic` and `rhythmic` automatically. You never
have to enter the reverse edge manually. OK?

## Q22 — Audio format details

MP3 at what **bitrate** (128 / 192 / 320 kbps)? Should we apply
**loudness normalization** (EBU R128 / −23 LUFS) so clicking
between songs isn't jarring? Do you want a **waveform display**
above the player? (Common in ethnomusicology tools; adds
complexity.)

## Q23 — Station languages for bilingual songs

Some Pontic songs mix Greek with Turkish phrases. Current
schema: `song_languages` junction lists all languages; no
per-line annotation. Is this enough, or do you want the UI to
mark which *lines* are in which language?

Simpler = v1. Richer = Phase 12+.

## Q24 — Stable permalinks / DOI

For academic citations we propose every song has a **permanent
URL** (`https://<domain>/songs/<code>`) that never breaks, even
if the site is reorganised. Optional next step: mint a DOI via
Zenodo for each song at a stable version. OK to defer Zenodo to
Phase 12 but confirm permalinks now?

## Q25 — Citation helper in the panel

"Cite this song" button generates a ready-to-paste citation in
MLA / APA / Chicago formats. Adds maybe a day of Phase 11 work.
Worth it for the scholarly audience?

## Q26 — Data export for researchers

Allow visitors to download their current filter results as CSV /
JSON? Helps research reproducibility; adds one endpoint. Worth
shipping in v1?

## Q27 — Dark mode / print view / mobile-first

Three related questions you didn't raise:

1. **Dark mode.** Low priority; the typography system is
   light-first. Defer?
2. **Print view.** Ethnomusicologists print song sheets. A
   single CSS file gets us most of it. Worth Phase 11?
3. **Mobile-first responsive.** The map is tricky on small
   screens (panel covers the whole view). Do you need field-work
   on tablets/phones, or is desktop-primary acceptable for v1?

## Q28 — Public cross-reference graph view

A Phase-12+ idea: a graph visualisation where songs are nodes and
cross-references are edges. Helpful for seeing melodic lineages
at a glance. Worth planning for, or out of scope?
