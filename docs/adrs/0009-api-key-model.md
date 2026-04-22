# ADR 0009 — Supabase API key model (publishable + secret, never legacy)

**Status.** Accepted — 2026-04-22. Response to stack review in
[07-review-findings.md](../07-review-findings.md).

## Context

Supabase introduced two key systems replacing the legacy `anon` /
`service_role` JWTs:

1. **Opaque API keys** — `sb_publishable_…` (browser-safe) and
   `sb_secret_…` (server-only, multiple allowed, rotatable).
   Launched 2025-06; enforced for new projects; **legacy keys
   retired late 2026** per Supabase's migration roadmap
   ([Discussion #29260](https://github.com/orgs/supabase/discussions/29260)).
2. **Asymmetric JWT signing keys** — ES256 by default (RS256 and
   EdDSA available). Allows local JWT verification via WebCrypto
   (`getClaims()`) without a network round trip.

Projects restored after 2025-11-01 no longer include legacy keys
at all.

## Decision

**We use only publishable + secret keys from day 1. We never
generate or reference legacy `anon` / `service_role` JWTs.**

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=                      # public
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # public
SUPABASE_SECRET_KEY=sb_secret_...              # server-only; rotated per env
```

### Client initialisation

```ts
// lib/supabase/client.ts  (browser)
import { createBrowserClient } from '@supabase/ssr'
export const sbBrowser = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
                      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)

// lib/supabase/server.ts  (server, publishable — for reads)
import 'server-only'
import { createServerClient } from '@supabase/ssr'
// ... publishable key, cookie handlers

// lib/supabase/admin.ts  (server, secret — for mutations ONLY)
import 'server-only'
import { createClient } from '@supabase/supabase-js'
if (typeof window !== 'undefined') {
  throw new Error('admin client imported on the client')
}
export const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,           // NEVER the publishable key here
  { auth: { persistSession: false } }
)
```

### Rotation

- **Secret keys are rotatable.** We generate a new `sb_secret_…`
  every 6 months, flip Vercel env, verify, revoke the old key.
  Multiple secret keys can coexist during rotation.
- **Publishable key** rotates only on compromise (it's
  effectively public already).
- **JWT signing keys** — we pin ES256. No symmetric JWT_SECRET
  anywhere.

### Auth verification

- Proxy (middleware) and Server Components call
  `supabase.auth.getClaims()` — local WebCrypto ES256 verification,
  no network round trip.
- `getUser()` used only on flows requiring server-fresh state
  (password/email changes).
- `getSession()` is **banned** in server code (cookies unverified).

## Consequences

- **Positive.** We never own the retirement migration. Security
  features (per-key revocation, rotation, asymmetric JWT) work
  on day 1. CI grep for leaked secrets knows to look for
  `sb_secret_` + JWT `eyJ` prefixes.
- **Negative.** None that matter; the new keys are drop-in
  replacements with strictly better semantics.

## References

- [Understanding API keys | Supabase Docs](https://supabase.com/docs/guides/api/api-keys)
- [JWT Signing Keys | Supabase Docs](https://supabase.com/docs/guides/auth/signing-keys)
- [Introducing JWT Signing Keys | Supabase Blog](https://supabase.com/blog/jwt-signing-keys)
- [`supabase.auth.getClaims()` reference](https://supabase.com/docs/reference/javascript/auth-getclaims)
- [Upcoming changes to Supabase API Keys · Discussion #29260](https://github.com/orgs/supabase/discussions/29260)
