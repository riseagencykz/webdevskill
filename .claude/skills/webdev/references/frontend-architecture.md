# Frontend Architecture

## Server vs Client Boundary (App Router / Nuxt / SvelteKit)

Default to server components. Convert to a client component only when the file
needs one of: event handlers, browser-only APIs, state/effects, or a
client-only library.

Push the boundary **down**, not up. A page that needs one interactive button
should not become a client component — extract the button.

```
app/page.tsx              server: fetches data, renders layout
  └─ ProductList.tsx      server: maps data to markup
       └─ AddToCart.tsx   "use client": the only interactive leaf
```

Consequences of getting this wrong:
- A `"use client"` at the top of a page pulls its entire import graph into the
  browser bundle — including any server-only library it touches.
- Secrets imported by a client component are shipped to users. Keep server-only
  modules behind an explicit `server-only` import guard where the framework
  offers one.

## State: Classify Before You Store It

| Kind | Example | Where it belongs |
|------|---------|------------------|
| Server cache | Product list, user profile | TanStack Query / framework loader — **not** a global store |
| URL state | Filters, tab, page, search query | The URL (`searchParams`). Shareable, back-button-correct |
| Form state | Field values, errors | Form library, local to the form |
| Ephemeral UI | Open/closed, hover | `useState` in the nearest component |
| True global | Theme, session, locale | Context or a small store (Zustand) |

Most "we need Redux" problems are server cache misclassified as global state.

## Data Fetching

- **Fetch in parallel.** Sequential `await`s create waterfalls:
  ```ts
  // bad — 3 round trips in series
  const user = await getUser(id)
  const orders = await getOrders(id)
  const prefs = await getPrefs(id)

  // good — 1 round trip's worth of latency
  const [user, orders, prefs] = await Promise.all([
    getUser(id), getOrders(id), getPrefs(id),
  ])
  ```
- **Fetch where the data is used**, not in a distant parent threaded through
  props. Colocation plus request deduplication beats prop drilling.
- **Never fetch in an effect on the server-capable path.** `useEffect` fetching
  guarantees a blank first paint and a client waterfall.

## Component Design

- Props describe *data and intent*, not styling: `variant="danger"`, not
  `color="#ef4444"`.
- One component, one responsibility. If the name needs "And", split it.
- Prefer composition (`children`, slots) over boolean prop explosions.
  Five `is*` booleans means 32 states you are not testing.
- Keep the render function pure. Side effects in render cause hydration
  mismatches and double-render bugs under Strict Mode.

## Hydration Mismatches

The error means server HTML ≠ first client render. Usual causes:

- `Date.now()`, `new Date()`, `Math.random()` in render → compute on the server
  and pass down, or render after mount.
- `window`/`localStorage` read during render → move into `useEffect`, or gate
  with a mounted flag.
- Locale-dependent formatting with a different server locale → pass an explicit
  locale and timezone.
- Invalid HTML nesting (`<div>` inside `<p>`) — the browser repairs it, React
  does not expect that.

## Rendering Every State

For every async view, write the states in this order — success last, so it is
never the only one you build:

```tsx
if (isPending) return <Skeleton />        // shaped like the real content
if (error)     return <ErrorState onRetry={refetch} message={...} />
if (!data.length) return <EmptyState action={...} />  // tell them what to do next
return <List items={data} />
```

## File Organization

Group by feature, not by file type. `components/`, `hooks/`, `utils/` as
top-level buckets stop scaling at about fifty files.

```
src/
  features/
    checkout/{components,api,hooks,checkout.test.ts}
    catalog/...
  components/ui/      # shared primitives only (shadcn/ui lives here)
  lib/                # cross-cutting: db, auth, fetch client
```
