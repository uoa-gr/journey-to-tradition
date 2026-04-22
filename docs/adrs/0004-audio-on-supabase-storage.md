# ADR 0004 — Audio on Supabase Storage (public bucket)

**Status.** Accepted — 2026-04-22. Decision delegated to the developer
by Vaggelis; confirmed this session.

## Context

Vaggelis' email explicitly prefers hosting audio files rather than
embedding YouTube links. He asked the developer to decide:

1. Technical feasibility
2. Ability to host full songs (1–10 minutes)
3. Disk budget vs. song count
4. YouTube ToS compliance (only relevant if we fell back)
5. Naming convention

## Decision

**Self-host on Supabase Storage, single `audio` bucket, public
read, admin write.**

- Path convention `<region_code>/<song_code>.<ext>` (Q2 in
  [06-open-questions.md](../06-open-questions.md) asks Vaggelis
  to confirm).
- Primary format MP3 @ 128 kbps (streaming). Accept `m4a`, `ogg`
  as fallback. Optionally, higher-fidelity masters later (see Q3).

## Consequences

- **Positive.**
  - One vendor, one SDK, one access-control model (RLS policies
    on `storage.objects`).
  - Supabase fronts Storage with its own CDN; we don't run one.
  - Public-read bypasses RLS for `SELECT`, giving us the simplest
    possible playback path (direct public URL in `<audio src>`).
  - Admin writes are gated by a Server Action with the service
    role — the service key never leaves the server.
- **Negative / watchpoints.**
  - **Byte-range requests** for streaming have historically had
    edge cases on Supabase Storage and as of April 2026 the issue
    is **not fully resolved** — notably iOS Safari `AVPlayer`
    still fails on signed-URL MP3s that play fine from S3/R2
    ([supabase discussions #1558](https://github.com/supabase/supabase/discussions/1558),
    [#35866](https://github.com/orgs/supabase/discussions/35866)).
    We enable Smart CDN from day one (auto-invalidation + better
    range behaviour than raw Storage) and treat byte-range
    verification as a Phase 9 gate: test a ≥20 MB MP3 on iOS
    Safari, Chrome, Firefox, plus `curl -I -H "Range: bytes=0-"`.
  - **Fallback plan — Cloudflare R2.** If the gate fails, we
    migrate `audio/` to R2 behind a custom domain. R2 is
    S3-compatible, so the upload Server Action swaps
    `@supabase/storage-js` for the AWS `S3Client` and nothing
    else changes. `rclone sync` handles the one-time migration;
    `audio_path` stays as a key. Zero egress cost is a bonus if
    traffic grows.
  - **Cost scaling** — Pro tier: 250 GB egress included,
    $0.09/GB uncached / $0.03/GB cached after. For our projected
    ~10 GB archive with modest traffic, comfortably within the
    included allowance for years.
- **Upload flow.** Client → Server Action (with secret key) signs
  upload URL → Client PUTs directly to Storage. The Server Action
  computes the path server-side from `song_id` — clients cannot
  choose paths. Details in
  [05-admin-ux.md#audio-upload-flow](../05-admin-ux.md#audio-upload-flow).
- **Enumerable public paths — accepted explicitly.** `<region_code>/<song_code>.mp3`
  is guessable, which matches the "published archive" framing; any
  visitor can list the corpus anyway. If we ever want to hide
  unreleased items, we move those to a private bucket with signed
  URLs; the schema and upload flow are ready for the split.
- **Disaster recovery.** Storage is NOT covered by Supabase's
  PITR. Nightly `rclone sync audio/` to Backblaze B2, retained
  30 days — see [../10-backup-and-dr.md](../10-backup-and-dr.md).

## Alternatives rejected

- **YouTube embeds.** Vaggelis explicitly prefers not to, and it
  introduces ToS ambiguity for folk field recordings.
- **Cloudflare R2 from day 1.** Cheaper egress, but adds a second
  vendor and a presigning Worker. Deferred to if-and-when egress
  becomes an issue.
- **Self-host with MinIO.** Rejected along with ADR 0002.

## References

- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Byte-range discussion on Supabase Storage](https://github.com/orgs/supabase/discussions/1558)
