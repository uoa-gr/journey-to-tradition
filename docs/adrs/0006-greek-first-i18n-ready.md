# ADR 0006 — Greek-first, i18n-ready

**Status.** Accepted — 2026-04-22.

## Context

Vaggelis' audience for v1 is Greek-speaking; the songs, the
scholarly vocabulary, and the collaborators are all in Greek. He
confirmed this session that **v1 ships Greek-only**.

At the same time, this is a research archive. An English layer at
some future point would expand academic reach without changing
the data model. We do not want to paint ourselves into a corner.

## Decision

- **v1 UI language: Greek only.** All labels, validation messages,
  placeholders, error copy, dates, numbers formatted with
  `Intl.NumberFormat('el-GR')`.
- **Schema is i18n-ready from day 1.** Every user-facing string
  column exists as `name_el` / `title_el` / `description_el` etc.
  An `_en` sibling is either present now (`name_en` on geography
  tables) or easily added later without structural migration.
- **No i18n library in v1.** We do not pull in `next-intl` or
  `next-i18next` yet. All Greek copy lives inline in JSX.
- **Design the code to make migration cheap.** Extract user-facing
  strings into a single `messages/el.ts` object even in v1. When
  we add EN, we swap the provider and add `messages/en.ts` — no
  JSX changes.

## Consequences

- **Positive.**
  - Zero i18n overhead for v1 — ship faster.
  - Data-model change for EN later is minimal (add `_en` columns
    where missing; content-entry is a backfill task for Vaggelis
    or a translator).
  - Typography ADR and font choice already account for Greek
    (Inter + Greek subset; EB Garamond for Latin display only —
    see [04-typography.md §1.1](../04-typography.md#11-greek-first)).
- **Negative.**
  - When we do add EN, we pay the full cost of wiring an i18n
    library + routing (`/en/...`). This is planned work, not a
    surprise.

## Alternatives rejected

- **Add `next-intl` up front.** Extra tooling for no v1 user value.
- **JSON-blob translations (`{ el, en }`) on every column.**
  Flexible but noisy in forms; Vaggelis' editing UX would have
  every field duplicated. Not worth the complexity at zero demand.

## References

- [Q5 in 06-open-questions.md](../06-open-questions.md#q5--greek-first-for-v1-english-later)
