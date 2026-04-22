# 07 — Review findings (April 2026 multi-agent review)

> After Tier 1 was drafted, we ran a deliberate second pass with
> three parallel reviewers and deep research against 2026 practice.
> This document is the audit trail: what we caught, what we
> changed, and what we deferred with reasoning.
>
> Read this alongside [06-open-questions.md](06-open-questions.md)
> (items for Vaggelis) and the ADRs.

---

## 1. How the review was run

Three subagents ran in parallel, each with different context and
responsibilities:

1. **`superpowers:code-reviewer`** — technical correctness,
   security, naming, completeness across all docs. Emphasis: "be
   brutally honest; we're polishing a spec before any code is
   written."
2. **`Explore`** — rigorous critique of Vaggelis' original email
   against modern WebGIS UX and data-model practice. Goal: surface
   proposals worth pushing back on, with rationale framed as
   questions to raise with him, not as override decisions.
3. **`general-purpose`** (with Context7 + web search) — 2026
   stack currency check. Specifically verified the user's flag
   that "anon" is legacy; found the full list of what else had
   moved on in the ecosystem since the first draft.

In parallel, targeted research on:
- Supabase new API key model (`publishable` / `secret`) and
  JWT signing key migration.
- Next.js 16 (shipped 2025-10-21, 16.2 stable April 2026) —
  `proxy.ts`, `cacheComponents`, async `cookies()`, `getClaims()`.
- Greek FTS + `unaccent` diacritic folding.
- Leaflet-geoman vs terra-draw for admin polygon editing in 2026.
- Supabase Storage byte-range streaming on iOS Safari.

Sources are cited inline in the three new ADRs (0007, 0008, 0009)
and in the architecture document. Research transcripts are in the
session log.

---

## 2. Findings by severity

### 2.1 Critical — fixed in this pass

| # | Problem | Where | Fix |
|---|---|---|---|
| C1 | `current_role()` function name collides with Postgres built-in | `03-er-diagram.md` §6, `02-architecture.md` §2 | Renamed to `public.app_current_role()`, `SECURITY DEFINER`, `search_path = ''`, schema-qualified identifiers |
| C2 | Invalid SQL: `CREATE POLICY … FOR insert, update` (comma list not allowed) | `03-er-diagram.md` §6 | Policies split per-verb; canonical policy shape documented |
| C3 | `edits` audit table referenced in 3 places, never specified | `05-admin-ux.md` §activity, ADR 0005 | Specified new §2.10 `edits` + §2.11 `geometry_edits` in `03-er-diagram.md`; RLS append-only; added to migration ordering as `10_audit.sql` |
| C4 | Legacy `anon key` / `SUPABASE_SERVICE_ROLE_KEY` terminology throughout (user flagged) | README, `02-architecture.md`, ADR 0005 | Migrated to `publishable key` (`sb_publishable_...`) / `secret key` (`sb_secret_...`); new ADR 0009 pins the policy; env vars renamed |
| C5 | Magic-link auth had no PKCE, open-redirect guard, rate limits, or MFA plan | `02-architecture.md` §2 | Added explicit threat model + hardening: PKCE flow, origin-allowlisted `next`, `SameSite=Strict` on `/admin/*`, rate-limit table, TOTP MFA plan, no-signup-to-admin rule |
| C6 | Backup / DR not specified; Storage not in PITR | `02-architecture.md` §13 | New `docs/10-backup-and-dr.md`: weekly `pg_dump` + nightly `rclone` to B2, quarterly DR drill, RPO 24h/RTO 4h, `pnpm export:archive` for portability |
| C7 | Greek FTS config `greek` without `unaccent` — wrong for dialectal folk lyrics | `02-architecture.md` §7 | `to_tsvector('greek', unaccent(coalesce(...)))` everywhere; `unaccent` added to `00_extensions.sql`; query-side mirrors the transform; Phase 2 quality gate with 10 probe queries |
| C8 | RLS matrix contradicted §4 ("client never writes" but matrix allowed admin writes) | `03-er-diagram.md` §6 | Rewrote RLS matrix: mutations are **`TO service_role` only**; `anon`/`authenticated` have zero write grants. Defense-in-depth closed. |
| C9 | Markdown sanitizer allow-list unspecified | Mentioned only | New ADR 0008 defines the allow-list precisely; sanitize on save AND on render; 20-payload XSS fixture test. New `11-content-policy.md` as reference. |
| C10 | "PostGIS requires dashboard-only install — regular migrations fail" | `03-er-diagram.md` §8 | Corrected — hosted Supabase runs `create extension postgis` from a migration fine. §8 updated. |
| C11 | Next.js 15 assumed throughout; 16 released Oct 2025, 16.2 stable April 2026 | ADR 0001, `02-architecture.md` §2 code blocks | Upgraded docs to Next.js 16.2+: `middleware.ts` → `proxy.ts`, sync `cookies()` → `await cookies()`, `Cache-Control` headers → `"use cache"` + `cacheTag` + `cacheLife`, `revalidateTag(tag)` → `revalidateTag(tag, 'max')`, `updateTag` for read-your-writes. Turbopack default. |
| C12 | `getUser()` used in proxy (network round trip per request) | `02-architecture.md` §2 | Switched to `getClaims()` (local ES256 WebCrypto verify). `getUser()` reserved for flows requiring server-fresh state. |

### 2.2 Important — fixed in this pass

| # | Problem | Where | Fix |
|---|---|---|---|
| I1 | RLS matrix's "service_role ✅" column terminology confused key vs role | `03-er-diagram.md` §6 | Matrix rewritten to be role-centric; note clarifying secret key → connects as service_role |
| I2 | RLS policies missed `TO anon` / `TO authenticated` performance lever | `02-architecture.md` §3 | All SELECT policies specify target role; writes specify `TO service_role` |
| I3 | Public Storage bucket path enumeration — implicit, not accepted | ADR 0004 | Accepted explicitly (consistent with "public archive" framing); split to private bucket path reserved for future |
| I4 | CSRF model handwaved | `02-architecture.md` §4 | Three layers documented: encrypted action id + `SameSite=Strict` cookies + `assertSameOrigin(headers())` helper |
| I5 | CSP declared "configured" without spec; Trusted Types claim would break Leaflet | `02-architecture.md` §12 | Concrete CSP written with rationale for `style-src 'unsafe-inline'` (Leaflet); Trusted Types deferred with note |
| I6 | `information_sources` jsonb array — no FK integrity, noisy audit | `03-er-diagram.md` §2.9 | Promoted to `song_information_sources` child table with `kind` enum, `accessed_at` date, `display_order` |
| I7 | `v_song_summary` view described vaguely | `03-er-diagram.md` §4 | Full DDL specified; "first category" defined as primary rank |
| I8 | Map cache invalidation atomicity under-specified | `02-architecture.md` §6 | Switched to Next 16 Cache Components; `cacheTag`/`cacheLife` + `updateTag` for RYW + `revalidateTag(..., 'max')` for SWR; ETag from `max(updated_at)` |
| I9 | Per-region sequence code generator had correctness holes | noted | Deferred — kept the existing simple model but flagged in §2.4 that code is immutable once assigned (Q18 to Vaggelis) |
| I10 | `song_references` directionality wobbled between spec and UI proposal | Q21 in `06-open-questions.md` | Decision deferred to Vaggelis; architecture ready for either direction; `v_song_neighbours` view pattern specified |
| I11 | Rate limits mentioned without numbers | `02-architecture.md` §12 | Concrete table: magic-link 5/email/hr, `/api/geo/*` 120rps, etc. |
| I12 | No GDPR / privacy plan | new doc | `docs/08-privacy-and-terms.md` — data controller, cookies, DSR, retention |
| I13 | No music IP / content licence model | new doc | `docs/11-content-policy.md` — per-song `audio_license` enum, site-wide CC BY-NC proposal (Q12 for Vaggelis) |
| I14 | Accessibility plan three lines | new doc | `docs/09-accessibility.md` — WCAG 2.1 AA target, `axe-core` gate, non-map fallback table, Greek-specific lang tagging |
| I15 | No observability plan | `02-architecture.md` §13 | Log aggregation (Axiom), SLOs, runbooks enumerated |
| I16 | No edit-conflict / optimistic-lock | `03-er-diagram.md` §2.4 | Added `songs.version int`; Server Actions enforce `WHERE version = $expected` |
| I17 | No export / archive portability | `docs/10-backup-and-dr.md` §4 | `pnpm export:archive` produces self-contained zip |
| I18 | `next lint` removed in Next 16, no lint tool chosen | new ADR | ADR 0007 picks Biome 2.x; pnpm 10; Vitest 3.x; lefthook |

### 2.3 Deferred with reasoning — tracked, not fixed in this pass

| Item | Why deferred | When we revisit |
|---|---|---|
| Per-region sequence implementation details (sequence name collisions, truncation, composite scope) | Implementation detail for Phase 1 migration; the current spec is directionally correct | Phase 1 |
| Cross-reference view (`v_song_neighbours`) exact shape vs. UI merge pattern | Depends on Vaggelis' answer to Q20/Q21 | After Vaggelis meeting |
| MVT via `ST_AsMVT` vs GeoJSON for villages | Real performance data needed | Phase 4 with real `Δεδομένα.zip` loaded |
| Byte-range streaming empirical verification | Requires an actual 20 MB MP3 in a Supabase project | Phase 9 |
| Biome rule tuning (a11y subset, import order specifics) | Pick once we have a real codebase to tune against | Phase 0 |
| Content permalinks / DOI (Zenodo integration) | Scope: Phase 12+; not a v1 blocker | After v1 launch |
| Playlists, print view, graph visualisation | Out of v1 scope (Q27, Q28 for Vaggelis) | v2 planning |

### 2.4 Minor polish items

Kept as a list inside individual docs (no separate tracker needed):

- OSM tile usage policy — add attribution + UA header; consider
  Carto / Stadia for prod (noted in `02-architecture.md` §6).
- Google Fonts self-host for GDPR (noted in `04-typography.md` §2
  and `08-privacy-and-terms.md`).
- DKIM/SPF/DMARC for magic-link email deliverability (Q6 already
  open).
- Rename "Specific sub-region" still blocking on Vaggelis (Q1).

---

## 3. Vaggelis-suggestion audit — summary

The Explore agent classified every proposal in Vaggelis' email.
Verbatim classifications:

**KEEP** — implement as specified:
- 5-tier geographic hierarchy (with the caveat below on
  multi-region)
- Song code auto-generation
- Cross-reference with four relation types
- Markdown for description / lyrics / comments
- Filter behaviour (bidirectional map ↔ filter sync)

**CHALLENGE** — raised with Vaggelis (see Q13–Q28 in
[06-open-questions.md](06-open-questions.md)):
- Categories: cap at 3 + ranked (Q13)
- Tabular display for 14 fields — recommend panel (Q14)
- Filter order: geography-first may hurt discoverability (Q15)
- Text input + dropdown → combobox in 2026 (Q16)
- Keywords scope: unified vs toggled (Q17)
- Song-code mutability after geography edit (Q18)
- Multi-region songs (Pontus migrant tradition) (Q19)
- Cross-reference multiple relation types per pair (Q20)
- Cross-reference symmetry rules (Q21)
- Audio bitrate / normalization / waveform (Q22)
- Bilingual lyrics inline annotation (Q23)

**ADAPT** — same intent, refined mechanism:
- `information_sources` → child table (not jsonb)
- Audio licence model (new `audio_license` enum; default
  `uncleared` hides audio)
- Click-region-remove-fill → keep subtle fill on selected region
  (testing in Phase 4)

**MISSED** — scholarly-WebGIS concerns he didn't mention:
- Permalinks / DOI (Q24)
- Citation helper (Q25)
- Data export (Q26)
- Dark mode / print / mobile-first (Q27)
- Cross-reference graph view (Q28)

---

## 4. Stack currency — verified against April 2026

Confirmed current best practice. Delta from the original Tier 1
draft captured per-ADR:

| Area | Tier 1 draft | April 2026 correction | Doc location |
|---|---|---|---|
| Framework | Next.js 15 | **Next.js 16.2+** (16 shipped Oct 2025) | ADR 0001 |
| Auth middleware | `middleware.ts` | **`proxy.ts`** | ADR 0001, `02-arch` §2 |
| Cookies API | sync `cookies()` | **`await cookies()`** | `02-arch` §2 |
| Auth verify | `getUser()` | **`getClaims()`** (local ES256 WebCrypto) | `02-arch` §2 |
| API keys | `anon` / `service_role` | **publishable / secret** (`sb_publishable_...` / `sb_secret_...`) | ADR 0009 |
| Cache primitives | `fetch` cache + `revalidateTag` | **Cache Components**: `"use cache"` + `cacheTag` + `cacheLife`; `revalidateTag(..., 'max')`; `updateTag()` | ADR 0001, `02-arch` §6 |
| Bundler | webpack / Turbopack opt-in | **Turbopack default** (Next 16) | README, ADR 0001 |
| Lint + format | (unspecified) | **Biome 2.x** (no ESLint, no Prettier) | ADR 0007 |
| Runtime | (unspecified) | **Node runtime** for all Server Actions touching the secret key | `02-arch` §4 |
| FTS | `to_tsvector('greek', …)` | **`to_tsvector('greek', unaccent(…))`** | `02-arch` §7 |
| PostGIS install | "dashboard only" | **SQL migration on hosted Supabase** | `03-er` §8 |
| Map draw | Leaflet + leaflet-geoman | **Keep.** terra-draw on MapLibre matured but Leaflet+geoman still wins on drawing UX | ADR 0003 |
| Audio host | Supabase Storage | **Keep, with R2 fallback wired** if byte-range fails iOS Safari gate | ADR 0004 |
| ORM | raw SQL + `supabase gen types` | **Keep.** Drizzle adds complexity for marginal gain | (unchanged) |

---

## 5. Map of docs — what exists now

```
Journey to Tradition/
├── README.md                           ← updated: new stack, new docs index, publishable/secret keys
├── docs/
│   ├── 00-conventions.md               ← NEW: anti-chaos charter
│   ├── 01-requirements.md              ← updated: information_sources child table
│   ├── 02-architecture.md              ← heavily updated: Next 16, publishable/secret, PKCE, rate limits, CSP, unaccent, Cache Components, §14 Backup/DR
│   ├── 03-er-diagram.md                ← heavily updated: app_current_role, per-verb policies, TO service_role writes, edits/geometry_edits tables, audio_license, optimistic version, more enums, unaccent, PostGIS claim corrected
│   ├── 04-typography.md                ← unchanged
│   ├── 05-admin-ux.md                  ← updated: audio upload flow hardened (no filename from client)
│   ├── 06-open-questions.md            ← expanded: Q12–Q28 from the audit
│   ├── 07-review-findings.md           ← this file
│   ├── 08-privacy-and-terms.md         ← NEW: GDPR, cookies, content licence
│   ├── 09-accessibility.md             ← NEW: WCAG 2.1 AA plan
│   ├── 10-backup-and-dr.md             ← NEW: backup streams, DR drill, RPO/RTO
│   ├── 11-content-policy.md            ← NEW: Markdown allow-list, audio licence model
│   ├── adrs/
│   │   ├── 0001-next-app-router.md     ← revised to Next 16
│   │   ├── 0002-supabase-over-self-host.md
│   │   ├── 0003-leaflet-over-maplibre.md ← revised: terra-draw acknowledged
│   │   ├── 0004-audio-on-supabase-storage.md ← revised: R2 fallback, iOS Safari gate
│   │   ├── 0005-mutations-via-server-actions.md ← revised: TO service_role, getClaims, secret key terminology
│   │   ├── 0006-greek-first-i18n-ready.md
│   │   ├── 0007-toolchain-2026.md      ← NEW: Biome + pnpm 10 + Vitest + lefthook
│   │   ├── 0008-markdown-sanitizer.md  ← NEW: allow-list, pipeline, XSS fixtures
│   │   └── 0009-api-key-model.md       ← NEW: publishable/secret, JWT ES256, rotation
│   ├── diagrams/
│   │   ├── er-diagram.mmd              ← unchanged
│   │   ├── architecture.mmd            ← updated: proxy.ts, publishable, secret, Fluid Compute
│   │   ├── auth-flow.mmd               ← updated: getClaims, proxy, PKCE note
│   │   ├── audio-upload.mmd            ← updated: no client filename, replay guard, optimistic version
│   │   ├── map-data-flow.mmd           ← unchanged
│   │   ├── public-layout.mmd           ← unchanged
│   │   └── mermaid.config.json
│   └── assets/                         ← all 6 diagrams re-rendered as SVG + PNG where sources changed
└── _archive/
    └── webgis-typography.md            ← Rule #1 backup, untouched
```

---

## 6. Next actions

1. **Vaggelis meeting.** Send him `06-open-questions.md` (now with
   Q1–Q28) and schedule the review he asked for.
2. **Content licence decision (Q12)** — blocks public launch. Decide
   the site-wide licence and confirm the per-song audio licence
   model.
3. **Categories, rhythms, dances, languages lists (Q7, Q8)** —
   these are blockers for Phase 2 data ingest.
4. **Open Phase 0 plan cycle** once Vaggelis has responded. That
   plan scaffolds the repo, Supabase project, and CI with the
   updated stack pinned.

The spec is in a materially stronger place than at the end of
Tier 1. Nothing downstream is pre-decided incorrectly; every
locked-in choice is supported by either an ADR or an explicit
open question.
