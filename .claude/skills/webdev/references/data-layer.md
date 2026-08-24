# Data Layer

## Schema

- Model the domain, not the screen. Screens change weekly; entities do not.
- Every table: a primary key, `created_at`, `updated_at`. Add `deleted_at` only
  if soft delete is a real requirement — it infects every query with a filter.
- Enforce invariants in the database, not only in application code: `NOT NULL`,
  `UNIQUE`, `CHECK`, foreign keys with explicit `ON DELETE` behaviour. The
  database is the last line that always runs; app code can be bypassed by a
  script, a job, or the next service.
- Money is `numeric`/integer cents, never `float`. Timestamps are `timestamptz`,
  stored UTC, formatted in the user's zone at the edge.
- Index what you filter, join, and sort on. Composite index column order matters:
  equality columns first, then range/sort.

## Migrations

- Migrations are code: committed, reviewed, forward-only in production.
- Never edit an applied migration. Write a new one.
- Expand/contract for anything breaking, across three deploys:
  1. **Expand** — add the new nullable column; write to both.
  2. **Backfill** — batched, resumable, off the request path.
  3. **Contract** — switch reads, then drop the old column.
- Adding an index on a large Postgres table: `CREATE INDEX CONCURRENTLY`
  (outside a transaction), or the table locks and the site goes down.

## Query Correctness and Speed

**N+1 is the default performance bug.** One query for a list, then one per row.

```ts
// bad: 1 + N
const posts = await db.post.findMany()
for (const p of posts) p.author = await db.user.findUnique({ where: { id: p.authorId } })

// good: 1 query (or 2 with a batched include)
const posts = await db.post.findMany({ include: { author: true } })
```

Find them by logging query counts per request in development and alerting when
one request issues more than ~20 queries.

Other rules:
- Select explicit columns. `SELECT *` breaks when the schema grows and moves
  bytes nobody reads.
- Paginate anything unbounded — including admin screens ("only 50 rows" becomes
  50,000).
- Read `EXPLAIN ANALYZE` before adding an index. A sequential scan on 500 rows
  is fine; on 5 million it is not.
- Do aggregation in SQL (`count`, `sum`, `group by`), not by loading rows into
  JS and reducing.

## Transactions

Wrap multi-write invariants in a transaction — anything where a partial result
is a corrupt state (charge + order, transfer between accounts, create + audit
row).

```ts
await db.$transaction(async (tx) => {
  const order = await tx.order.create({ data })
  await tx.inventory.update({
    where: { sku, quantity: { gte: n } },   // conditional update = optimistic lock
    data: { quantity: { decrement: n } },
  })
  return order
})
```

Keep transactions short and never make a network call (payment API, email)
inside one — the lock is held for the whole round trip.

## Caching

Layers, cheapest first:

1. **HTTP cache / CDN** — anonymous, shared content. Best ratio by far.
2. **Framework data cache** — per-render dedupe and route caching.
3. **Application cache (Redis)** — expensive computed results, rate-limit
   counters, sessions.
4. **Client cache** — TanStack Query, with `staleTime` set deliberately.

Rules: cache keys include every input that changes the result (including the
user or tenant id, or you will serve one user's data to another). Prefer short
TTL + `stale-while-revalidate` over manual invalidation. Never cache
authenticated responses in a shared cache.

## Connections

Serverless plus a traditional pool exhausts Postgres connections fast. Use a
pooler (PgBouncer, Supabase pooler, Neon/Prisma Accelerate) or an HTTP-based
driver. One process should hold one pool, created once at module scope — not
per request.
