# Testing

## What to Test

Test behaviour users depend on. Do not test implementation details — those tests
fail on every refactor and pass while the app is broken.

| Layer | Share | Scope | Tool |
|-------|-------|-------|------|
| Unit | ~60% | Pure logic: pricing, parsing, permissions, date math | Vitest |
| Component | ~30% | A component's rendered behaviour, incl. a11y | Testing Library |
| E2E | ~10% | Critical user journeys through the real app | Playwright |

**Never test:** that a library works, that a constant equals itself, internal
state, or exact class names.

**Always test:** money and permission logic, anything you have broken before,
every bug you fix (the regression test *is* the fix's proof).

## Component Tests — Query Like a User

```tsx
// bad: couples the test to markup
expect(container.querySelector('.btn-submit')).toBeDisabled()

// good: the way a user (and a screen reader) finds it
await user.click(screen.getByRole('button', { name: /submit order/i }))
expect(await screen.findByRole('alert')).toHaveTextContent('Order placed')
```

Query priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId`
(last resort). If `getByRole` cannot find your control, that is an accessibility
bug the test just caught for free.

Use `userEvent`, not `fireEvent` — it produces the real event sequence
(pointer, focus, keydown) that your handlers actually see.

## E2E Tests

Cover the journeys that lose money if broken: sign up, log in, search →
add to cart → checkout, the main create/edit flow.

```ts
test('user can complete checkout', async ({ page }) => {
  await page.goto('/products/cold-brew-kit')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await page.getByRole('link', { name: 'Cart' }).click()
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByRole('button', { name: 'Place order' }).click()
  await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible()
})
```

## Killing Flakiness

Flaky tests are worse than no tests — they train the team to ignore red.

- **Never `waitForTimeout`/`sleep`.** Wait for state: `expect(...).toBeVisible()`,
  `waitForResponse`. Playwright's assertions auto-retry; use them.
- Each test creates its own data and does not depend on order.
- Reset database/storage state between tests.
- Mock third-party network calls (`page.route`) — their outage should not be
  your red build.
- Freeze time and timezone for anything date-dependent.
- Quarantine a flaky test only with a linked issue and an owner; never delete or
  `skip` it to get a green build.

## Mocking

Mock at the boundary — the network (MSW, `page.route`), the clock, the
filesystem. Do not mock your own modules to make a test pass; that is usually a
signal the code needs a seam, not a mock.

## Coverage

A useful floor, not a goal. 80% on business logic, no threshold on UI glue.
100% coverage with assertion-free tests is theatre. Coverage tells you what was
executed, never whether it was correct.

## In CI

```yaml
- run: npm run lint && npm run typecheck
- run: npm run test -- --coverage
- run: npx playwright test
```

Fast checks first so cheap failures fail fast. Upload Playwright traces and
screenshots on failure — debugging CI without a trace is guesswork. Run e2e
against a production-mode build; dev-mode differences hide real bugs.
