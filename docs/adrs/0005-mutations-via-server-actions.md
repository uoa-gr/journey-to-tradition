# ADR 0005 — All mutations via Next.js Server Actions (not client-direct)

**Status.** Accepted — 2026-04-22. Revised after April-2026 review
to pin policies to `TO service_role` only.

## Context

Supabase lets the browser talk to PostgREST directly with the
**publishable key** (browser-safe; previously called the anon key),
and RLS policies gate what the browser can read/write. Many
Supabase tutorials show mutations from the client (e.g. an Insert
button calling `supabase.from('songs').insert(...)` from a React
component).

Research on production Next.js + Supabase applications strongly
recommends against this pattern for non-trivial apps:

> *"Use RLS only for selects and route all mutations through the
> server (where they're done with the secret key), rather than
> trying to handle everything with RLS."*
>
> — summarized from practitioner write-ups

## Decision

**Every mutation (INSERT, UPDATE, DELETE) goes through a Server
Action on the Node runtime.** The client never writes to Supabase
directly.

- Server Actions live in `app/(admin)/**/actions.ts` with
  `export const runtime = 'nodejs'`.
- They authenticate the actor via `supabase.auth.getClaims()`
  (local JWT verify via WebCrypto; `@supabase/ssr` server client).
- They authorize via a `requireRole('admin'|'editor')` helper that
  calls `public.app_current_role()`
  ([03-er-diagram.md §6](../03-er-diagram.md#6-rls-matrix)). The
  function is `SECURITY DEFINER` with `search_path = ''`.
- They validate input with Zod schemas from `lib/schemas/*.ts`.
- They write using the **secret-key client**
  (`lib/supabase/admin.ts`, marked `"server-only"`, runtime guard
  `if (typeof window !== 'undefined') throw`).
- They log to `edits` (append-only audit trail —
  [03-er-diagram.md §2.10](../03-er-diagram.md)).
- They call `updateTag(...)` for read-your-writes and
  `revalidateTag(..., 'max')` for SWR invalidation.
- They call `assertSameOrigin(headers())` at the top of every
  mutation as the CSRF belt.

**RLS belt-and-suspenders.** Policies on every content table grant
INSERT / UPDATE / DELETE **`TO service_role` only**. The `anon` and
`authenticated` roles have zero write grants. Even if a developer
mistakenly uses the publishable-key client for a write, the row
operation fails at the database — the authorization is not just
application-layer.

## Consequences

- **Positive.**
  - One chokepoint for validation, audit, and cache invalidation.
  - RLS policies for writes become deny-by-default restrictive
    policies — a defense-in-depth wall, not the primary gate. Simple
    and stable.
  - No risk of RLS policy drift leaking into "anyone can insert"
    because of a forgotten `WITH CHECK`.
  - Server Actions integrate with Next's form submission and
    streaming pipeline — pending / success states for free.
- **Negative.**
  - Slight latency — the action runs on Vercel's serverless region
    before hitting Supabase. Within budget for an admin app.
  - Marketing-level Supabase tutorials look simpler. We trade
    simplicity-in-tutorials for simplicity-in-production.

## Enforcement

- `lib/supabase/admin.ts` exports the secret-key client and is
  marked `"server-only"`. Any accidental import from a client file
  fails the build.
- Runtime guard in `admin.ts`:
  `if (typeof window !== 'undefined') throw new Error('secret key on client')`.
- CI build-time grep of `.next/static/**` for `sb_secret_`,
  `SUPABASE_SECRET_KEY`, and raw JWT prefixes (`eyJ`); any hit
  fails the build.
- RLS: every `authenticated` / `anon` grant on mutations revoked.
  Database refuses the write even if application layer is
  misconfigured.

## Alternatives rejected

- **Client-direct with RLS doing everything.** Simpler to write
  initially, harder to evolve safely. We've seen this collapse at
  scale.
- **tRPC / REST API.** More ceremony than Server Actions for the
  same outcome.

## References

- [Catjam: Next + Supabase — what I'd do differently](https://catjam.fi/articles/next-supabase-what-do-differently)
- [Supabase RLS performance guidance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
