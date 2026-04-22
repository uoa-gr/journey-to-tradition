# 11 — Content policy

> What is allowed in `description_md`, `lyrics_md`, `comments_md`,
> `appendices.content_md`, and how audio rights are modelled.
> Companion to ADR [0008-markdown-sanitizer.md](adrs/0008-markdown-sanitizer.md)
> and [08-privacy-and-terms.md](08-privacy-and-terms.md).

---

## 1. Markdown allow-list (authoritative)

See ADR 0008 for the canonical list. Repeated here as a quick
reference:

| Allowed | Notes |
|---|---|
| `p` | paragraph |
| `br` | line break |
| `strong`, `em` | emphasis |
| `a[href]` | http / https / `/` prefix only; `rel="noopener nofollow ugc"` forced |
| `ul`, `ol`, `li` | lists |
| `blockquote` | quotes |
| `code`, `pre` | inline and block code |
| `h3`, `h4`, `h5` | no `h1` / `h2` (reserved for page chrome) |
| `hr` | thematic break |
| `sup`, `sub` | footnote refs, chemical/math subscripts |

Everything else is stripped. HTML comments are stripped.

## 2. Audio rights model

Every song carries `audio_license` (enum) + optional
`audio_license_note` (free-text attribution).

| Value | Publicly plays? | Badge shown | Notes |
|---|---|---|---|
| `public_domain` | Yes | "PD" | Pre-1928 field recordings, traditional without identifiable author |
| `cc_by` | Yes | "CC BY 4.0" | Attribution required and displayed |
| `cc_by_sa` | Yes | "CC BY-SA 4.0" | + share-alike note |
| `cc_by_nc` | Yes | "CC BY-NC 4.0" | + non-commercial note |
| `cc_by_nc_sa` | Yes | "CC BY-NC-SA 4.0" | both badges |
| `all_rights_reserved` | Yes | "© …" | attribution note required |
| `uncleared` | **No — audio hidden** | "Rights clearing pending" | default for every new song |

The admin UI refuses to publish an audio file if the song is
`uncleared` — Vaggelis must set a licence first. The admin form
validates that CC-licensed songs have an attribution note.

## 3. Attribution format

Per-song footer, when audio is present:

```
Κατάθεση: <recording_by>
Πηγή ήχου: <audio_source>
Άδεια: <license badge + link>
Σημείωμα: <audio_license_note>
```

Rendered in the panel as `meta` text (see
[04-typography.md §7](04-typography.md#7-song-panel-typography-hybrid)).

## 4. Site-wide content licence (metadata, text)

Default proposal: **CC BY-NC 4.0**, attribution to
Evangelos Spyrou / NKUA. Displayed in the footer of every page
and in `/about` § Licence.

Scholarly citation snippet generator in the panel:

> Spyrou, E. (2026). *<song title>* [<code>]. *Journey to
> Tradition: A WebGIS of Greek Musical Traditions*. NKUA.
> Retrieved <date> from <URL>.

## 5. Moderation

- Only accounts with `role IN ('admin','editor')` can publish
  content.
- Every change is audited in the `edits` table.
- The admin activity log (`/admin/activity`) is the moderation
  surface. No public commenting in v1; no user-generated content
  from visitors.

## 6. What we refuse to publish

- Audio or text the contributor does not have the rights to share.
- Content that names living private individuals without consent
  (village informants who explicitly asked not to be credited can
  be credited as "ανώνυμος πληροφορητής").
- Any content that would violate Greek or EU law, including but
  not limited to hate speech, defamation, and unauthorized
  disclosure of personal data.

## 7. Takedown process

If a rights-holder or subject identifies content that should be
removed:

1. Email `evspyrou@geol.uoa.gr` with the song code and reason.
2. Vaggelis reviews within 7 days.
3. If the takedown is valid, the audio is removed from Storage
   (soft-deleted in admin; hard-deleted after 30 days) and the
   song metadata is either updated, flagged, or fully removed.
4. The audit log captures the actor, reason category, and date.
5. Backups are NOT retroactively purged unless the content
   violates law (in which case Alex runs a targeted B2 object
   deletion + lifecycle update).

## 8. Imported content

XLSX / ZIP imports (see [05-admin-ux.md](05-admin-ux.md)) go
through the same sanitizer on save. The importer does not bypass
any content policy.
