# ADR 0007 — Toolchain for 2026

**Status.** Accepted — 2026-04-22.

## Context

We need to pin linter, formatter, test runner, package manager and
some ancillary tools. The landscape changed in 2025–2026:

- Next.js 16 **removes `next lint`** — projects must choose a linter
  directly.
- **Biome 2.x** (Jan 2026) added type-aware rules and stabilised; it
  is 10–25× faster than ESLint+Prettier and consolidates lint +
  format in a single config.
- **pnpm 10** ships the safer `onlyBuiltDependencies` allow-list;
  Bun 1.3 is production-capable but retains small ecosystem
  edge-cases.
- **Vitest 3.x** remains the TS-first test runner of choice;
  `node:test` is too thin on DX for our workload.

## Decision

| Purpose | Tool | Version |
|---|---|---|
| Package manager | **pnpm** | 10.x |
| Lint + format | **Biome** | 2.x |
| Unit test runner | **Vitest** | 3.x |
| E2E test runner | **Playwright** | latest |
| DB-state test harness (optional) | `supawright` | latest |
| RLS policy tests | **pgTAP** + SQL harness | latest |
| Type-check | `tsc --noEmit` | matches Next 16 TS |
| Git hooks | **lefthook** (Go, fast, cross-platform) | 1.x |

**Rationale:**
- Biome replaces both ESLint and Prettier. One config file
  (`biome.json`), no flat-config migration pain, built-in import
  ordering, unused-vars, a11y checks. Config lives in the repo
  root, committed.
- pnpm 10 keeps the `workspace:*` protocol, deterministic
  installs, and the tightened `onlyBuiltDependencies`
  allow-list prevents surprise install scripts.
- Vitest handles our pure-function tests. For RLS policy tests we
  use pgTAP in SQL files run against local Supabase — keeps the
  test in the same language as the policy.
- lefthook over husky: Go-native, no Node bootstrap, cleaner on
  Windows (Alex's environment).

## Consequences

- **Positive.** One lint+format tool means zero config drift.
  Faster CI (Biome on all files in < 1s on a laptop). No
  `next lint` dead-end. All tools run on both local and CI
  identically.
- **Negative.** Biome's ecosystem is smaller than ESLint's — some
  niche plugins (e.g. react-hooks exhaustive-deps) are still less
  mature. For our project the built-in rules cover what matters.
- **Mitigation.** If Biome gaps appear, we add ESLint as a second
  checker (no overlap in rules) without giving up the formatter
  side.

## Alternatives rejected

- **ESLint flat config + Prettier.** Works, but twice the config
  surface and ~10× slower.
- **Bun** as package manager or runtime. 1.3 is production-capable
  but the ecosystem still hits the occasional edge case; pnpm is
  boring and correct.
- **Jest.** ESM story still bad; Vitest is simply faster with less
  configuration.

## References

- [Biome docs](https://biomejs.dev/)
- [Biome migration from ESLint+Prettier](https://biomejs.dev/guides/migrate-eslint-prettier/)
- [pnpm 10 release notes](https://pnpm.io/blog)
- [Vitest](https://vitest.dev/)
- [lefthook](https://github.com/evilmartians/lefthook)
