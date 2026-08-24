# API Design

## Choosing a Style

| Style | Use when | Avoid when |
|-------|----------|------------|
| Route handlers / REST | Public API, third-party consumers, webhooks | — |
| Server actions / RPC | First-party UI in the same repo | You need a stable public contract |
| tRPC | TS monorepo, one first-party client | Non-TS or external consumers |
| GraphQL | Many clients with divergent data needs | One client — cost outweighs benefit |

Do not mix three styles in one app because each was convenient that day.

## REST Conventions

- Nouns, plural, hierarchical: `/api/orders`, `/api/orders/:id/items`.
- Verbs live in the HTTP method, not the path. `POST /api/orders`, never
  `/api/createOrder`.
- Status codes that actually mean something:

  | Code | Meaning |
  |------|---------|
  | 200 / 201 | OK / created (return the created resource) |
  | 204 | Success, no body (delete) |
  | 400 | Malformed or failed validation |
  | 401 | Not authenticated ("who are you?") |
  | 403 | Authenticated but not allowed ("not yours") |
  | 404 | Missing — also correct for "exists but you may not know that" |
  | 409 | Conflict: duplicate, version mismatch |
  | 422 | Well-formed but semantically invalid (optional; 400 is fine) |
  | 429 | Rate limited — always send `Retry-After` |
  | 500 | You broke it. Log the detail, return a generic message |

- Idempotency: `GET`, `PUT`, `DELETE` must be safe to retry. For `POST` that
  creates money-shaped things, accept an `Idempotency-Key` header.

## A Route Handler, Correct by Construction

```ts
export async function POST(req: Request) {
  // 1. Authenticate — session, never a client-supplied user id
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate — parse, don't trust
  const parsed = CreateOrderSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // 3. Authorize — can *this* user act on *this* resource?
  if (!(await canCreateOrder(session.user.id, parsed.data.workspaceId))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Do the work, and let known failures map to real status codes
  try {
    const order = await createOrder(session.user.id, parsed.data)
    return Response.json(order, { status: 201 })
  } catch (err) {
    if (err instanceof DuplicateOrderError) {
      return Response.json({ error: 'Order already exists' }, { status: 409 })
    }
    logger.error({ err, userId: session.user.id }, 'createOrder failed')
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

The four steps — authenticate, validate, authorize, act — are the shape. Skipping
step 3 because step 1 passed is the single most common access-control bug in web
apps: any logged-in user can then act on any record by changing an id.

## Error Responses

Use one shape everywhere so clients can handle errors generically:

```json
{ "error": "Human-readable summary",
  "code": "ORDER_LIMIT_REACHED",
  "issues": { "quantity": ["Must be 1 or more"] } }
```

Never leak stack traces, SQL, or internal hostnames to clients. Log those
server-side with a correlation id and return the id to the user for support.

## Pagination

Prefer cursor pagination for anything that grows or changes while being read;
`OFFSET` gets slower with depth and skips/duplicates rows as data shifts.

```
GET /api/orders?limit=20&cursor=eyJpZCI6...
→ { "items": [...], "nextCursor": "eyJpZCI6..." }   // null = end
```

Always cap `limit` server-side (e.g. max 100) regardless of what is requested.

## Versioning and Compatibility

- Additive changes are safe. Removing or renaming a field is a breaking change.
- Version when you must break: `/api/v2/...`. Keep v1 alive with a deprecation
  date in a `Sunset` header.
- Treat webhook payloads as a public contract too.

## Performance

- Set caching deliberately: `Cache-Control: public, max-age=60,
  stale-while-revalidate=300` for shared data; `private, no-store` for
  per-user data. An un-set cache header is a decision made by accident.
- Return only the fields the client uses. `SELECT *` through an ORM into JSON is
  how a 12 kB response becomes 400 kB.
- Rate-limit public endpoints, especially auth, search, and anything sending
  email.
