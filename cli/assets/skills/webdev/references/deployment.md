# Deployment & CI

## Environments

Three, and no more: **local → preview (per PR) → production**. A shared
long-lived "staging" that drifts from production is a source of false
confidence; per-PR previews are better in almost every way.

- Preview and production run the **same build command** and the same runtime
  version (pin it in `.nvmrc`/`engines`).
- Every environment gets its own database and its own secrets. Never point a
  preview at the production database — one seeded test writes real rows.
- Preview environments must be `noindex` (see `seo.md`).

## Configuration

- Config comes from environment variables; the code never branches on
  `NODE_ENV === 'production'` for business behaviour.
- Validate env at boot and crash loudly on a missing variable — a runtime
  `undefined` three hours later is far more expensive:
  ```ts
  export const env = EnvSchema.parse(process.env)   // fail at start, not in a request
  ```
- `.env.example` lists every key with a comment; `.env*` is gitignored.

## Pipeline

```
push → install (cached) → lint + typecheck → unit tests → build → e2e → deploy
```

- Cache the package store keyed on the lockfile hash.
- Run independent jobs in parallel; fail fast on lint/typecheck.
- Required status checks on the default branch, so nothing red merges.
- The build must be reproducible from a clean clone — if it only works on one
  machine, it is not a build.

## Release and Rollback

- Rollback must be one action and must be practised. If you have never rolled
  back, you cannot roll back.
- Database migrations deploy **before** the code that needs them, and must be
  backward-compatible with the running version (expand/contract, see
  `data-layer.md`). A migration that breaks the old code makes rollback
  impossible — that is the trap.
- Feature-flag risky changes so enabling and disabling is independent of
  deploying.
- Deploy small and often. Weekly deploys of fifty commits fail in ways that are
  hard to attribute.

## Static Assets and Caching

- Content-hashed filenames + `Cache-Control: public, max-age=31536000, immutable`.
- HTML: `no-cache` or a short TTL, so users get new asset references promptly.
- Serve everything through a CDN; compress with Brotli.

## Observability

You cannot fix what you cannot see. Minimum viable set:

- **Error tracking** (Sentry or equivalent) with source maps uploaded, release
  tagged, and user context attached — errors without a release are noise.
- **Structured logs** (JSON) with a request/correlation id threaded through.
  Log decisions, not prose.
- **Uptime check** on a real endpoint that touches the database, not a static
  page that is green while the app is down.
- **Real-user metrics** for Core Web Vitals — lab numbers hide the p75 tail.
- Alert on user-visible symptoms (error rate, p95 latency, failed checkouts),
  not on CPU. Every alert must have an action; alerts nobody acts on get muted,
  and then the real one gets muted too.

## Pre-Deploy Checklist

- [ ] CI green on the merge commit, not just on the branch
- [ ] Migrations applied and backward-compatible
- [ ] Env vars present in the target environment (and no new secret in the client bundle)
- [ ] Rollback path known
- [ ] Error tracking receiving events from the new release
