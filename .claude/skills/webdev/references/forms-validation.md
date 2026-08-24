# Forms & Validation

Forms are where most user-visible bugs and most security holes live. Treat them
as a solved problem with a fixed recipe.

## One Schema, Two Places

Define the schema once and use it on both sides. Divergent client/server rules
are a guaranteed bug.

```ts
// lib/schemas/order.ts — shared
export const CreateOrderSchema = z.object({
  email: z.string().email('Enter a valid email'),
  quantity: z.coerce.number().int().min(1).max(100),
  note: z.string().max(500).optional(),
})
export type CreateOrder = z.infer<typeof CreateOrderSchema>
```

Client validation is **UX only** — instant feedback. Server validation is the
security boundary and always runs. A request that never touched your UI is the
normal case, not the exception.

## Wiring (react-hook-form + zod)

```tsx
const form = useForm<CreateOrder>({
  resolver: zodResolver(CreateOrderSchema),
  defaultValues: { quantity: 1 },       // always define defaults: no uncontrolled→controlled warning
})
```

- Validate on blur, re-validate on change **after** the first error. Validating
  on every keystroke from empty tells users they are wrong while they type.
- Disable submit only while submitting — not while invalid. A disabled button
  with no explanation is a dead end; let them submit and show the errors.
- After a failed submit, move focus to the first invalid field.

## Accessible Fields — The Non-Negotiable Five

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  autoComplete="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
/>
<p id="email-hint">We only use this for the receipt.</p>
{errors.email && <p id="email-error" role="alert">{errors.email.message}</p>}
```

1. A real `<label>` bound by `htmlFor` — placeholder is not a label.
2. Correct `type` and `autoComplete` (mobile keyboards, password managers).
3. `aria-invalid` on error.
4. Error text linked via `aria-describedby` and announced with `role="alert"`.
5. Errors say how to fix it: "Password needs 8+ characters", not "Invalid".

## Error Message Rules

- Specific and actionable. Never "Error" or "Invalid input".
- Never blame the user; never expose internals ("constraint uq_users_email").
- Preserve what they typed. Wiping a form on error is the fastest way to lose a
  conversion.
- Show a form-level summary for multi-error submits, plus inline errors.

## Submission

- Guard against double submit (disable + ignore in-flight duplicates); for
  payments, send an idempotency key.
- Optimistic update only when failure is rare and reversible; otherwise show a
  pending state.
- On success: clear navigation or a confirmation — never a silent no-op.

## File Uploads

- Validate type **and** size on the server; never trust `Content-Type` or the
  extension — sniff the magic bytes for anything you will re-serve.
- Upload direct to storage with a presigned URL; do not proxy large files
  through your app server.
- Randomize stored filenames; never interpolate a user-supplied name into a path.
- Serve user content from a separate origin with `Content-Disposition:
  attachment` where possible — an uploaded SVG or HTML file is stored XSS.
- Show progress and allow cancel; enforce a max size in the UI too, so users
  learn before a 3-minute upload fails.

## Multi-Step Forms

Persist per step (draft record or `sessionStorage`) so a refresh does not
destroy twenty minutes of work. Validate per step; allow going back without
re-validating forward steps. Show step N of M.
