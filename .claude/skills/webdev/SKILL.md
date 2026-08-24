---
name: webdev
description: "Web development engineering: stack selection, frontend architecture, API and data layer design, forms and validation, performance (Core Web Vitals), accessibility (WCAG 2.2), SEO, security (OWASP), testing (unit/component/e2e), CI and deployment. Use when building, refactoring, debugging, or reviewing a web app or website — Next.js, React, Vue, Nuxt, Svelte, Astro, Node, or plain HTML/CSS. Complements ui-ux-pro-max: that skill decides how it looks, this one decides how it is built."
argument-hint: "[topic] [context]"
license: MIT
metadata:
  author: riseagency
  version: "1.0.0"
---

# Web Development

Engineering counterpart to the design skills in this plugin. `ui-ux-pro-max`,
`ui-styling`, and `design-system` decide **how a product looks**; this skill
decides **how it is built, shipped, and kept fast, accessible, and safe**.

## When to Use

- Starting a web project and choosing a stack, or adding a feature to one
- Designing routes, APIs, data access, caching, or auth
- Building forms, tables, uploads, search, pagination — the recurring hard parts
- Fixing slow pages, layout shift, hydration errors, oversized bundles
- Making an interface keyboard- and screen-reader-usable
- Setting up tests, CI, previews, deploys

Skip it for pure visual/style decisions (use `ui-ux-pro-max`), brand and
copy (`brand`), or slide decks (`slides`).

## References (Knowledge Base)

Load only the file you need — do not read them all up front.

| Topic | File | Read it when |
|-------|------|--------------|
| Stack selection | `references/stack-selection.md` | Greenfield project, or "should this be static/SSR/SPA?" |
| Frontend architecture | `references/frontend-architecture.md` | Component/state/data-fetching structure, server vs client |
| API design | `references/api-design.md` | REST/tRPC/GraphQL, route handlers, server actions, errors |
| Data layer | `references/data-layer.md` | Schema, ORM, migrations, N+1, caching, transactions |
| Forms & validation | `references/forms-validation.md` | Any form, file upload, or user input |
| Performance | `references/performance.md` | Core Web Vitals, bundle budgets, images, fonts |
| Accessibility | `references/accessibility.md` | WCAG 2.2, keyboard, focus, ARIA, contrast |
| SEO & metadata | `references/seo.md` | Public pages, sharing cards, sitemaps, structured data |
| Security | `references/security.md` | Auth, sessions, secrets, XSS/CSRF/SSRF, headers |
| Testing | `references/testing.md` | Unit, component, e2e, what to test and what not to |
| Deployment & CI | `references/deployment.md` | Envs, build pipeline, previews, rollback, observability |

## Working Order

For a new feature, work outside-in and commit in this order:

1. **Contract first** — data shape and validation schema (one schema, shared by
   client and server). Everything else derives from it.
2. **Server** — data access + API/route handler + authorization check.
3. **Client** — render states in this order: loading, empty, error, success.
   A screen that only handles `success` is unfinished.
4. **Accessibility pass** — keyboard path, focus order, labels, contrast.
5. **Performance pass** — measure before optimizing; check the budget table in
   `references/performance.md`.
6. **Tests** — one e2e for the happy path, unit tests for the branchy logic.

## Non-Negotiables

These hold on every web task in this repo, regardless of stack:

- **Validate on the server.** Client-side validation is UX, never a security
  boundary. Re-validate every input where it is trusted.
- **Never trust `user.id` from the client.** Derive identity from the session.
- **Every interactive element is reachable by keyboard** and has an accessible
  name. `<div onClick>` is a bug; use `<button>`.
- **Every async UI has three visible states** besides success: loading, empty,
  error. Errors say what happened and what to do next.
- **No secrets in client bundles.** Anything prefixed `NEXT_PUBLIC_`, `VITE_`,
  `PUBLIC_` is published to the world.
- **Images have explicit width/height** (or `aspect-ratio`) to prevent CLS.
- **Measure before optimizing.** Profile or Lighthouse first; guessing wastes
  the change budget and often makes things slower.

## Quick Diagnostics

| Symptom | Most likely cause | Where to look |
|---------|-------------------|---------------|
| Page jumps while loading | Images/ads/fonts without reserved space | `references/performance.md` |
| Slow first paint on a data page | Waterfall of sequential awaits | `references/api-design.md` |
| Hydration mismatch error | `Date.now()`/`Math.random()`/`window` during render | `references/frontend-architecture.md` |
| Bundle suddenly huge | A client component pulled in a server-only dep | `references/performance.md` |
| Query fast alone, slow in list | N+1 | `references/data-layer.md` |
| Works with mouse, not keyboard | Non-semantic elements, focus traps | `references/accessibility.md` |
| Flaky e2e test | Waiting on time instead of state | `references/testing.md` |
