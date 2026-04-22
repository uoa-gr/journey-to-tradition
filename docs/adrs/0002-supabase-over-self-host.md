# ADR 0002 — Supabase over self-hosted Postgres

**Status.** Accepted — 2026-04-22.

## Context

We need:
- Postgres with PostGIS.
- Authenticated admin access (email magic link at minimum).
- File storage for audio.
- Some managed operational burden — the developer is one person
  and the domain expert does not want to operate infra.

Options on the table:
- Supabase cloud (Pro plan).
- Self-host Postgres + PostGIS on a Hetzner / DigitalOcean VPS,
  with Keycloak/Auth.js for auth and MinIO for storage.
- A mix (self-hosted Postgres, Vercel Blob for storage, etc.).

## Decision

**Supabase cloud (Pro plan, later negotiable) for Postgres + PostGIS +
Auth + Storage.**

All four services we need come from one vendor with a unified SDK
(`@supabase/supabase-js`, `@supabase/ssr`) and one admin UI.

## Consequences

- **Positive.**
  - PostGIS available as a dashboard toggle.
  - Row-Level Security (though we use it sparingly per ADR 0005)
    is the right level of defense-in-depth.
  - Generous free tier for local dev (`supabase start` gives us a
    production-equivalent stack in Docker).
  - Built-in schema migration tooling (`supabase db push`).
  - Automatic daily backups on Pro.
- **Negative.**
  - Monthly cost (≈ $25 + overage) if Vaggelis' storage grows.
  - Vendor lock-in on the Auth side. (DB is plain Postgres; we can
    exit by pg_dump. Storage migrates via rclone if ever needed.)
  - Byte-range requests for audio streaming had historical edge
    cases — we verify in Phase 9 and fall back to a streaming proxy
    if needed.
- **Mitigation.** We structure migrations to be portable (pure SQL
  in `supabase/migrations/*.sql`) so a future self-host is feasible.

## Alternatives rejected

- **Self-host.** Unacceptable operational burden for a one-developer
  project where Vaggelis doesn't want to page anyone at 3am.
- **Neon + Clerk + Cloudflare R2.** Each is best-in-class, but
  integrating three vendors multiplies surface area. We'd revisit
  if audio traffic explodes (R2 egress is free; Supabase is not).

## References

- [Supabase pricing](https://supabase.com/pricing)
- [Supabase PostGIS guide](https://supabase.com/docs/guides/database/extensions/postgis)
