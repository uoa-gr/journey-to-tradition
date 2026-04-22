# 08 — Privacy, terms, content licence

> Draft for Vaggelis' review. Not legal advice — to be validated
> with NKUA's DPO before public launch.

---

## 1. Data controller

**Journey to Tradition** is operated by:

- **Data controller**: Evangelos Spyrou, Geology Dept, National and
  Kapodistrian University of Athens (NKUA). `evspyrou@geol.uoa.gr`.
- **DPO / university privacy contact**: NKUA official DPO (TBD —
  Vaggelis to confirm the institutional contact).
- **Developer / data processor**: Alexandros P. Liaskos,
  `alexliaskos@geol.uoa.gr`.

Hosted under Vaggelis' domain (pending DNS setup).

## 2. What personal data is collected

### Public visitors
- **Nothing stored long-term.**
- Standard webserver logs (IP + user-agent + path + timestamp)
  kept by Vercel and Supabase for ≤ 30 days for security /
  debugging purposes. Deleted thereafter automatically.
- **No cookies** are set for analytics (Vercel Analytics is
  cookieless).
- **No tracking pixels**, no ad networks, no third-party analytics.

### Admin users
- **Email address** (for magic-link login). Stored in Supabase
  `auth.users`. Retained until the admin account is revoked.
- **Display name** (self-provided in `profiles.full_name`).
- **Session cookies** (`sb-access-token`, `sb-refresh-token`)
  stored in the browser for the session.
- **Audit trail**: every edit logs the actor's id, a hashed IP,
  truncated user-agent, and the diff. Retained 2 years.

## 3. Cookies

| Cookie | Purpose | Duration |
|---|---|---|
| `sb-access-token` | Supabase access token | ≤ 1 hour (then refresh) |
| `sb-refresh-token` | Supabase refresh token | 30 days |
| `sb-provider-token` (if any) | OAuth provider token, if used | n/a in v1 |

Set only after admin login; `SameSite=Strict` on `/admin/*` paths;
`HttpOnly`; `Secure` in production. Not used on public pages.

## 4. Data subject rights (GDPR)

Visitors and admins have the right to:

- Request access to the data we hold about them.
- Request correction or deletion.
- Withdraw consent (closing their admin account deletes their
  `auth.users` row; `edits` retain the hashed actor id for audit
  integrity but nothing personally identifying).
- Lodge a complaint with the Greek DPA (HDPA /
  Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα).

Requests: email `evspyrou@geol.uoa.gr` (we will surface a
dedicated contact form on the public site once DNS lands).

## 5. Security measures

- TLS everywhere (Vercel-managed certificates).
- PKCE auth flow; MFA for admins.
- Row-level security on every content table; mutations via
  secret-key Server Actions only.
- Daily PITR + nightly `rclone` backup of Storage (see
  [10-backup-and-dr.md](10-backup-and-dr.md)).
- Independent security review before public launch.

Full detail in [02-architecture.md §12](02-architecture.md#12-security-checklist-pre-prod).

## 6. Content licence (songs, recordings, metadata)

**This section is provisional and the most important open
question for Vaggelis (see [06-open-questions.md Q11](06-open-questions.md#q11--audio-legality-fallback).**

Ethnomusicological field recordings carry layered rights
(performer, collector, archive). We model this per-song:

| `audio_license` value | Effect on the public page |
|---|---|
| `public_domain` | Audio plays; no attribution required (still shown if provided) |
| `cc_by` | Audio plays; attribution in panel footer |
| `cc_by_sa` | Audio plays; attribution; share-alike badge |
| `cc_by_nc` | Audio plays; attribution; non-commercial badge |
| `cc_by_nc_sa` | Audio plays; both badges |
| `all_rights_reserved` | Audio plays; "All rights reserved — Vaggelis Spyrou / NKUA" |
| `uncleared` | **Audio HIDDEN**; metadata still visible; "rights clearing pending" note |

By default every new song is `uncleared`. Vaggelis cannot publicly
expose audio until he sets a licence.

**Site-wide content licence (metadata, descriptions, lyrics
commentary)** — proposed default: **CC BY-NC 4.0**, attribution to
Evangelos Spyrou / NKUA. This covers the scholarly text, not the
audio (which is per-song).

Vaggelis to confirm in Q12 of
[06-open-questions.md](06-open-questions.md).

## 7. Children's data

None collected. Admin accounts are restricted to adult scholars.

## 8. Changes to this policy

Changes published on a dated changelog (`/privacy/changelog`) on
the public site, and committed to this file.

## 9. Terms of use (public)

- You may view, listen to, and cite content from this archive
  under the licence terms shown on each song page.
- You may not scrape or mass-download the archive.
- Commercial re-use is governed by the per-song audio licence and
  the site-wide content licence.
- You may not attempt to bypass the admin area; unauthorized
  access is prohibited under Greek and EU law.

Violations: `evspyrou@geol.uoa.gr`.
