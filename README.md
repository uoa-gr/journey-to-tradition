# Ταξίδι στην Παράδοση — Journey to Tradition

> A WebGIS archive of Greek traditional songs, mapped onto the regions,
> sub-regions, islands and villages where they live.

**Status.** Pre-implementation / documentation phase — *2026-04-22*.
No application code exists yet. This repository currently holds the
ground-truth documents (requirements, architecture, ER diagram,
typography, admin UX, open questions) that will drive the build.

**Not for distribution.** Per the project owner's directive, the work
is private at this stage. No publicity, sharing, or public
communication about the project is permitted until he signs off.

---

## People

| Role | Name | Email | App role |
|---|---|---|---|
| **Project Owner — Ethnomusicology Lead, Domain Expert, Top-level Admin** | Evangelos Spyrou *(Ευάγγελος Σπύρου — "Vaggelis")* | `evspyrou@geol.uoa.gr` | `admin` |
| **Developer** | Alexandros P. Liaskos *(Αλέξανδρος Π. Λιάσκος)* | `alexliaskos@geol.uoa.gr` · `alexliaskosga@gmail.com` | `developer` *(also `admin` for day-to-day edits)* |

Both affiliated with the Department of Geology, National and
Kapodistrian University of Athens (NKUA).

The owner defines the scholarly content, validates every data
decision, and will eventually operate the admin UI himself. The
developer owns the technical implementation and is empowered to
push back on technical choices but defers on all
ethnomusicological and content-model questions.

---

## What this project is

A map-driven catalogue of Greek traditional songs. The hierarchy is
strictly geographic: every song belongs to exactly one **region**
(e.g. Epirus, Peloponnese, Ionian Islands, Pontus, Cyprus, Crete,
Thessaly, Thrace, …), optionally to a **sub-region**, optionally to a
**specific sub-region**, optionally to an **island**, and optionally
to a **village** (point). Against that geography sits rich per-song
metadata (title, alternative title, rhythm, dance, lyrics,
description, comments, information sources, audio source, language,
categories, and cross-references to other songs).

The end-product is a public website where visitors explore the map,
filter songs by geography or content, and read/listen to individual
entries in an editorial panel. The admin side (behind auth) lets
Vaggelis add regions, draw polygons, upload audio, and edit song
records without touching code.

---

## Docs — read in order

| # | Doc | Purpose |
|---|---|---|
| 0 | [docs/00-conventions.md](docs/00-conventions.md) | Naming, files, commits, identifiers — the anti-chaos charter |
| 1 | [docs/01-requirements.md](docs/01-requirements.md) | Vaggelis' 2026-04-21 email, reorganized into a reviewable spec |
| 2 | [docs/02-architecture.md](docs/02-architecture.md) | Tech choices and rationale (DB, auth, storage, map pipeline) |
| 3 | [docs/03-er-diagram.md](docs/03-er-diagram.md) | Mermaid ER + table specs + RLS matrix |
| 4 | [docs/04-typography.md](docs/04-typography.md) | The editorial voice for non-map surfaces, Greek-first |
| 5 | [docs/05-admin-ux.md](docs/05-admin-ux.md) | Admin pages and flows so Vaggelis is self-sufficient |
| 6 | [docs/06-open-questions.md](docs/06-open-questions.md) | Outstanding items for Vaggelis to resolve before P0 |
| 7 | [docs/07-review-findings.md](docs/07-review-findings.md) | Multi-agent April-2026 review: what we caught and fixed |
| 8 | [docs/08-privacy-and-terms.md](docs/08-privacy-and-terms.md) | GDPR, cookies, content licence policy |
| 9 | [docs/09-accessibility.md](docs/09-accessibility.md) | WCAG 2.1 AA plan — keyboard, screen readers, the map |
| 10 | [docs/10-backup-and-dr.md](docs/10-backup-and-dr.md) | Backup streams, DR test cadence, RPO/RTO targets |
| 11 | [docs/11-content-policy.md](docs/11-content-policy.md) | Markdown sanitizer allow-list, audio licence model |
| — | [docs/adrs/](docs/adrs/) | One-page architecture decision records |
| — | [docs/diagrams/](docs/diagrams/) | Mermaid source for every diagram |
| — | [docs/assets/](docs/assets/) | Rendered SVG + PNG of every diagram, and Vaggelis' sketch |

The original typography document from `liaskos.eu` is preserved,
unedited, at [_archive/webgis-typography.md](_archive/webgis-typography.md).

**Rendered diagrams:**

- [ER diagram](docs/assets/er-diagram.svg) — 16 tables + relationships
- [System architecture](docs/assets/architecture.svg) — three layers, data paths
- [Authentication flow](docs/assets/auth-flow.svg) — Supabase SSR cookies, `getClaims()` via `proxy.ts`
- [Map data pipeline](docs/assets/map-data-flow.svg) — GeoJSON + Vercel edge cache
- [Audio upload sequence](docs/assets/audio-upload.svg) — signed URL, service role, revalidation
- [Public page layout](docs/assets/public-layout.svg) — Vaggelis' sketch as a Mermaid wireframe

Every diagram has a matching `.png` (2400 px wide for ER, 1800 px for others) and a `.mmd` source in `docs/diagrams/`.

---

## Stack at a glance

- **Framework** — Next.js **16.2+** (App Router, TypeScript, Server Components, Turbopack default) on **Vercel** (Fluid Compute, Node runtime for server actions)
- **Database** — **Supabase** Postgres + **PostGIS** + **`unaccent`** + **`pg_trgm`**, with Row-Level Security (reads only; writes forced through Server Actions with the **secret key**)
- **Auth** — Supabase Auth (`@supabase/ssr`), email magic links with **PKCE flow**, asymmetric JWT signing keys (ES256), `getClaims()` (local WebCrypto verify) in `proxy.ts`
- **Storage** — Supabase Storage, single `audio` bucket (public read, admin write via signed upload URL). Cloudflare R2 kept in reserve as fallback if byte-range streaming is flaky.
- **Map** — **Leaflet** + `react-leaflet@5` (public viewer) + **leaflet-geoman** (admin polygon editor)
- **Package manager** — **pnpm 10**
- **Lint + format** — **Biome 2.x** (`next lint` is removed in Next 16)
- **Testing** — Vitest 3.x (unit) + Playwright (e2e) + pgTAP (RLS) + local Supabase (`supabase start`)
- **CI/CD** — GitHub → Vercel preview per PR → production on `main`

**API keys** — we use the new Supabase key model from day 1: `sb_publishable_...` for the browser, `sb_secret_...` for server-only code. Legacy `anon`/`service_role` JWTs are being retired by Supabase in late 2026 and we never adopt them.

Full rationale in [docs/02-architecture.md](docs/02-architecture.md), the ADRs, and the April 2026 stack review at [docs/07-review-findings.md](docs/07-review-findings.md).

---

## Local setup (once code lands in Phase 0)

```bash
# 1. Install
pnpm install

# 2. Start Supabase locally (Docker required)
pnpm supabase start

# 3. Apply migrations + seed
pnpm supabase db reset

# 4. Load real data fixtures (Vaggelis' spreadsheets)
pnpm import:data

# 5. Run the dev server
pnpm dev
```

Environment (never committed):

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # browser-safe; from `pnpm supabase status`
SUPABASE_SECRET_KEY=sb_secret_...                         # server-only, NEVER shipped to client
```

> The older `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` JWTs still work on legacy projects but Supabase projects restored after 2025-11-01 no longer ship with them. We bind the spec to the current naming.

---

## Scripts (planned)

| Script | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint + Prettier |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright against local Supabase |
| `pnpm supabase start` / `stop` | Local Supabase stack |
| `pnpm supabase db reset` | Reapply migrations + seed |
| `pnpm import:data` | Parse `Δεδομένα.zip` + XLSX → Postgres |
| `pnpm gen:types` | Regenerate `lib/db/schema.ts` from Supabase |

---

## Deployment

- **Preview** — every PR opened against `main` is auto-deployed by
  Vercel to a unique preview URL. The PR body includes the URL;
  share it with Vaggelis for feedback before merging.
- **Production** — merges to `main` deploy to the production domain
  (domain TBD — Vaggelis is wiring his own DNS; no action on our
  side yet).

---

## Guardrails

1. **Rule #1 — Back up before destructive change.** Any file that
   replaces existing content must first be copied to `_archive/` or
   committed. Applies to DB migrations too: drops and alters go
   through versioned Supabase migrations, never ad-hoc SQL.
2. **Ask-don't-guess** — Vaggelis' standing directive. If a category,
   region, sub-region, or content rule is ambiguous, add it to
   `docs/06-open-questions.md` and wait.
3. **No publicity** — this repo is private; no tweeting, no demos, no
   screenshots in public until Vaggelis approves.

---

## Contact

For development questions: Alexandros P. Liaskos — `alexliaskos@geol.uoa.gr`.
For content / scholarly questions: Evangelos Spyrou — `evspyrou@geol.uoa.gr`.
