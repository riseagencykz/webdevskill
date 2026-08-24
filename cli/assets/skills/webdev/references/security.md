# Security

Scope: the OWASP-shaped failures that actually happen in web apps. Not a
substitute for a review of anything handling payments, health, or identity data.

## 1. Broken Access Control — The Most Common Real Breach

Authentication asks *who are you*; authorization asks *may you do this to this
record*. Passing the first proves nothing about the second.

```ts
// vulnerable: any logged-in user reads any invoice by changing the id (IDOR)
const invoice = await db.invoice.findUnique({ where: { id: params.id } })

// correct: ownership is part of the query
const invoice = await db.invoice.findFirst({
  where: { id: params.id, workspace: { members: { some: { userId: session.user.id } } } },
})
if (!invoice) return notFound()   // 404, not 403 — don't confirm it exists
```

Check authorization **server-side on every request**, including API routes,
server actions, and file downloads. Hiding a button is not access control.
Never accept `userId`, `role`, `isAdmin`, or `price` from the client.

## 2. Injection

- SQL: parameterized queries or an ORM. Never template user input into SQL —
  including into `ORDER BY` (validate sort columns against an allowlist).
- XSS: frameworks escape by default; the holes are `dangerouslySetInnerHTML`,
  `v-html`, `innerHTML`, and `javascript:` URLs. Sanitize with DOMPurify if you
  must render user HTML, and validate that link protocols are `http(s)`/`mailto`.
- Command injection: never pass user input to a shell. Use `execFile` with an
  argument array.
- SSRF: if users supply a URL you fetch, allowlist hosts and block private
  ranges (`127.0.0.0/8`, `10/8`, `169.254.169.254`) — after DNS resolution, and
  on every redirect hop.
- Path traversal: never join user input into a filesystem path. Resolve and
  verify the result stays inside the intended root.

## 3. Auth and Sessions

- Use a maintained library (Auth.js, Better Auth, Clerk, Supabase). Do not write
  your own password hashing or session rotation.
- Passwords: argon2id or bcrypt (cost ≥ 12). Never MD5/SHA. Minimum length 8+,
  no composition rules, check against a breached-password list.
- Session cookies: `HttpOnly; Secure; SameSite=Lax` (or `Strict`), short-lived,
  rotated on privilege change. Do not store tokens in `localStorage` — any XSS
  becomes full account takeover.
- Rate-limit login, signup, password reset, and OTP by IP **and** by account.
- Reset tokens: single-use, ≤ 1 hour, stored hashed. Invalidate other sessions
  after a password change.
- Do not reveal whether an email exists ("If that address is registered, we've
  sent a link").

## 4. Secrets and Configuration

- No secrets in the repo. `.env` in `.gitignore`; commit `.env.example` with keys
  and no values.
- Anything prefixed `NEXT_PUBLIC_` / `VITE_` / `PUBLIC_` is shipped to browsers.
  Grep for those prefixes before every release.
- If a secret is committed, rotate it. Removing the commit does not un-leak it.
- Enable secret scanning and Dependabot on the repository.

## 5. Headers and Transport

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}';
  object-src 'none'; base-uri 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

CSP is the highest-value header and the fiddliest — roll it out in
`Content-Security-Policy-Report-Only` first, fix the reports, then enforce.
CORS: name explicit origins; `Access-Control-Allow-Origin: *` with credentials
is not permitted and not safe.

## 6. Dependencies and Data

- `npm audit` / Dependabot in CI; patch high and critical promptly.
- Pin and commit the lockfile; review new dependencies before adding them —
  a dependency runs with your app's full privileges.
- Collect the minimum data; delete on a schedule. Encrypt at rest and in transit.
- Log auth events, permission denials, and admin actions — never log passwords,
  tokens, card numbers, or full request bodies of sensitive endpoints.

## Pre-Deploy Checklist

- [ ] Every mutating endpoint authenticates **and** authorizes the record
- [ ] All input validated server-side against a schema
- [ ] No secrets in client bundles (`grep` the public prefixes and the build)
- [ ] Cookies `HttpOnly; Secure; SameSite`; CSRF handled for cookie-auth forms
- [ ] Rate limits on auth, search, and email-sending endpoints
- [ ] Security headers set; CSP enforced
- [ ] Errors return generic messages; details only in server logs
- [ ] Dependency audit clean of high/critical
