# Stack Selection

Pick the least machinery that satisfies the requirements. Every added layer is
a permanent tax on build time, onboarding, and debugging.

## Decision Order

Ask these in sequence and stop at the first honest "yes".

1. **Is the content the same for everyone and changes rarely?**
   → Static site. Astro, Eleventy, or plain HTML + Tailwind. No hydration cost,
   no server bill, CDN-fast by default.
2. **Is it content-heavy with a few interactive islands?**
   → Astro with framework islands, or Next.js in mostly-static mode.
   Ship JS only for the islands.
3. **Does it need per-user data, auth, or writes?**
   → Full-stack framework: Next.js (App Router), Nuxt, SvelteKit, Remix.
4. **Is it a long-lived app behind a login with heavy client state?**
   (editor, dashboard, canvas tool)
   → SPA: Vite + React/Vue/Svelte + a real data layer (TanStack Query).
   SSR buys little when everything is behind auth.
5. **Is it primarily an API with a thin UI?**
   → Separate the API (Node/Fastify, Hono, Django, Laravel) from the frontend.

## Rendering Modes — Choose Per Route, Not Per App

| Mode | Use for | Cost |
|------|---------|------|
| Static (SSG) | Marketing, docs, blog | Rebuild to update |
| Incremental (ISR) | Catalogs, articles at scale | Stale window |
| Server (SSR) | Personalized, SEO-relevant pages | Server per request |
| Client (CSR) | Dashboards behind auth | Slower first paint |
| Streaming/partial | Pages with one slow section | Complexity |

Modern frameworks let you mix these per route. A landing page being static and
a dashboard being client-rendered is correct, not inconsistent.

## Defaults That Rarely Disappoint

- **Language:** TypeScript. `strict: true` from commit one — retrofitting is far
  more expensive than starting strict.
- **Package manager:** pnpm (fast, strict about phantom deps). Commit the lockfile.
- **Styling:** Tailwind for app UI; CSS Modules or plain CSS when the team is
  small and the design is bespoke.
- **Components:** shadcn/ui — copied into the repo, so it is editable and does
  not become an unpatched dependency. See the `ui-styling` skill.
- **Data fetching (client):** TanStack Query. Do not hand-roll cache + retry +
  dedupe; you will rebuild it badly.
- **Forms:** react-hook-form + zod (or valibot). See `forms-validation.md`.
- **Database:** Postgres. Reach for anything else only with a stated reason.
- **ORM:** Drizzle (SQL-shaped, thin) or Prisma (ergonomic, heavier runtime).
- **Auth:** a library or provider — Auth.js, Better Auth, Clerk, Supabase Auth.
  Never hand-roll password hashing and session rotation.
- **Tests:** Vitest + Testing Library + Playwright.
- **Lint/format:** ESLint + Prettier, or Biome for both in one fast binary.

## Anti-Patterns

- Choosing a framework for a feature you will not use for a year.
- Microservices before there is a team boundary to justify them.
- A state-management library added before any state problem exists — most apps
  need server cache (TanStack Query) plus a little `useState`, not Redux.
- GraphQL for a single first-party client. See `api-design.md`.
- A monorepo for a single deployable app.
- Rewriting instead of strangling: wrap and replace route by route.
