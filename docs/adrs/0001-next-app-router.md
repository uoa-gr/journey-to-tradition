# ADR 0001 — Next.js 16 App Router

**Status.** Accepted — 2026-04-22. Supersedes earlier Next 15 draft
after April-2026 stack review ([07-review-findings.md](../07-review-findings.md)).

## Context

We need to pick a web framework for the WebGIS. Requirements:

- Server-rendered (most pages are content-heavy and benefit from
  SSR for first paint and SEO).
- Native support for our typography system, which already imports
  `next/font/google` in its sample code.
- Strong Vercel integration (Vaggelis wants preview-per-PR so he
  can review without running anything locally).
- TypeScript, modern React, Server Components (less client JS).
- A production-proven Supabase SSR integration story.

Next.js 16 shipped 2025-10-21 and 16.2 is stable as of April 2026.
Starting on 15 means immediately owing a migration to 16; starting
on 16 is free.

## Decision

**Next.js 16.2+, App Router, TypeScript, Server Components by
default. Turbopack is the default dev and production bundler. Node
20.9+ required.**

The App Router's `(group)` routing lets us cleanly separate
`(public)` and `(admin)` trees with their own layouts. Server
Actions give us one place to validate and audit every mutation.
Route Handlers cover the two static endpoints
(`/api/health`, `/api/geo/*`).

**Key Next.js 16 features we adopt:**

- `proxy.ts` (file rename from `middleware.ts`) on the Node
  runtime for auth session refresh (cookies are hard-async now).
- **Cache Components** (`cacheComponents: true`) — unified model
  that subsumes Partial Prerendering, `dynamicIO`, and the old
  `unstable_cache`. Uses the `"use cache"` directive + `cacheTag`
  + `cacheLife`.
- `revalidateTag(tag, 'max')` (the cacheLife arg is required in
  16) for SWR invalidation; `updateTag(tag)` for read-your-writes
  from admin Server Actions.
- `authInterrupts` (`forbidden()`, `unauthorized()`) for
  cleaner error flows on `/admin/*` (deferred to Phase 10;
  current plan uses explicit redirect in `proxy.ts`).

## Consequences

- **Positive.** No upgrade debt to pay later. Turbopack builds are
  substantially faster. The cache model is simpler to reason
  about than hand-tuned `fetch` cache options.
- **Negative.** App Router + Cache Components have a steeper
  mental model for contributors. Some older tutorials assume
  Next 14–15 patterns and will read as out-of-date.
- **Mitigation.** `docs/00-conventions.md` documents "when to
  `'use client'`", the `getClaims()` vs `getUser()` rule, and
  where the cache boundaries live. `CONTRIBUTING.md` links to
  it.

## Alternatives rejected

- **Remix v3 / React Router v7.** Strong SSR story but we pay an
  integration cost for Supabase (less official tooling) and lose
  Vercel's turn-key previews.
- **SvelteKit.** Smaller ecosystem for the Leaflet wrappers we'll
  want; typography code would need re-authoring.
- **Astro + HTMX.** Excellent for mostly-static content but the
  map UI has enough interactivity to warrant a full React runtime.

## References

- `webgis-typography.md` (already authored against `next/font`)
- [Next.js 16 release notes](https://nextjs.org/blog/next-16)
- [Upgrading to Next 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [cacheComponents config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [proxy file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Supabase SSR guide for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

## Alternatives rejected

- **Remix.** Strong SSR story but we pay an integration cost for
  Supabase (less official tooling) and lose Vercel's turn-key
  previews.
- **SvelteKit.** Smaller ecosystem for the Leaflet wrappers we'll
  want; typography code would need re-authoring.
- **Astro + HTMX.** Excellent for mostly-static content but the
  map UI has enough interactivity to warrant a full React runtime.

## References

- `webgis-typography.md` (already authored against `next/font`)
- [Supabase SSR guide for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
