# 10 — Backup and disaster recovery

> Rule #1, applied to production. Without a tested restore,
> backups are theoretical.

---

## 1. Targets

| Metric | Target |
|---|---|
| **RPO** (data loss tolerance) | 24 hours |
| **RTO** (recovery time) | 4 hours |
| DR test cadence | Quarterly |

The archive is scholarly, not latency-critical — 24 h of lost
content is recoverable (Vaggelis re-enters from notes). Four hours
of outage to restore is acceptable on a research archive.

## 2. Backup streams

### 2.1 Postgres (Supabase-managed)

- **PITR (Point-in-Time Recovery)**: 7-day window on Supabase
  Pro. Self-serve restore via Supabase dashboard.
- **Daily full backup**: included, 7-day retention.

### 2.2 Postgres (our own stream)

- **Weekly logical dump**: `pg_dump --schema=public --no-owner
  --no-privileges` piped to a gzipped file in Backblaze B2.
  Retained **1 year**.
- **GitHub Action** `backup-postgres.yml` runs on Sundays 02:00
  UTC; writes to `b2://journey-backups/postgres/YYYY-MM-DD.sql.gz`.
- Restore drill documented in `docs/runbooks/restore-postgres.md`.

### 2.3 Storage (audio)

**Storage is NOT in Supabase's PITR.** This is critical — if a
Server Action deletes the wrong blob, it's gone.

- **Nightly `rclone sync`** of `audio/` (Supabase Storage, S3
  API) → `b2://journey-backups/audio/`.
- Retained **30 days** with versioning enabled on the B2 bucket
  (accidental delete → restore via version).
- **GitHub Action** `backup-storage.yml` runs daily 03:00 UTC.
- **Alert on failure**: Slack webhook.

### 2.4 Audit log (`edits` table)

Included in the weekly `pg_dump`. Also exported via
`pnpm export:archive` (§4) so successors get a faithful history.

### 2.5 Secrets

- Supabase project keys / env vars backed up in 1Password
  "Journey to Tradition" vault. Shared between Vaggelis and Alex.
- Cloudflare / domain registrar credentials in the same vault.

### 2.6 Source code

- Git remote: GitHub. Primary and only source of truth for code.
- No cold-archive of code — GitHub's SLAs are sufficient.

## 3. Quarterly DR test

Every Q, Alex runs this flow against a **staging Supabase project**
created for the drill:

1. Create a fresh Supabase project (staging-dr).
2. `psql < latest-weekly-pgdump.sql.gz` (gunzipped) into staging-dr.
3. `rclone copy b2://journey-backups/audio/ staging-dr-audio/`
   (fresh bucket).
4. Point a Vercel preview deploy at staging-dr; set env vars.
5. Run the Playwright smoke suite (`pnpm test:e2e:dr`).
6. Spot-check 10 random songs have audio + lyrics + geometry.
7. Destroy staging-dr.
8. Log results in `docs/runbooks/dr-log.md`.

If the drill fails at any step, open a P0 to fix the backup stream
before the next drill.

## 4. Archive export (portability)

Independently of DR, Vaggelis / NKUA must be able to take the
archive with them if Supabase disappears, our Vercel account
lapses, or Alex moves on.

**`pnpm export:archive`** (run nightly into the same B2 bucket as
backups):

```
journey-to-tradition-archive-YYYY-MM-DD.zip
├── README.md                  (restore instructions)
├── data.sql                   (pg_dump of public schema)
├── edits.jsonl                (append-only audit log)
├── audio/                     (mirror of Storage bucket)
└── docs/                      (snapshot of /docs)
```

Anybody with Postgres + a static file server can stand this up
without any proprietary SaaS.

## 5. Alerts

Ten-minute page escalation on:

- Nightly Storage sync failed.
- Weekly pg_dump failed.
- Quarterly DR drill overdue > 10 days.
- B2 bucket missing nightly write for > 36 hours.

Destinations: Slack `#journey-alerts` (both Vaggelis + Alex) and
email fallback.

## 6. Cost

- Backblaze B2: ~$0.005/GB/mo storage + $0.01/GB egress during
  drills. For ~20 GB total (archive + audio mirror + dumps): ~$2/mo.
- GitHub Actions: within the free tier.

## 7. What this does NOT cover

- **Vercel outage** — mitigated by DR drill bringing up on a
  separate hosting stack (a single `next build` + static export
  can run from any Node host).
- **Supabase account deletion** — the weekly pg_dump + audio sync
  lets us rebuild on a new Supabase project or self-hosted
  Postgres + MinIO in under four hours.
- **GitHub repo loss** — local clones on both Vaggelis' and
  Alex's machines + the B2 export bundle include the docs
  snapshot. Source code is additionally mirrored to a second git
  remote (to be configured in Phase 0).
