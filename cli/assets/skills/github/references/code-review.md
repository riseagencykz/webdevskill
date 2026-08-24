# Code Review

## What Reviewers Are Actually For

In priority order. Spending the review on level 4 while missing level 1 is the
common failure.

1. **Correctness** — does it do what it claims? Edge cases, error paths, races.
2. **Security** — authorization on every mutation, injection, secrets, input
   validation. See the `webdev` skill's `references/security.md`.
3. **Design** — is this the right shape? Will it survive the next requirement?
4. **Maintainability** — naming, structure, tests, the comment that explains why.
5. **Style** — should be a linter's job, not a human's. If you are typing style
   comments, configure the formatter instead.

## Reviewing Well

**Read the description first, then the tests, then the code.** Tests tell you
what the author believes the change does.

Ask about intent before proposing a rewrite. "What happens when `items` is
empty here?" beats "this is wrong" — you may be missing a constraint.

Distinguish severity explicitly, so the author knows what blocks the merge:

```
blocking: this reads `req.body.userId` — any user can pass another user's id.
          Take it from the session instead.
question: is the 30s timeout deliberate? Upstream p99 is 12s.
nit:      `getUserData` → `fetchUser` for consistency with the others. Non-blocking.
```

Praise real improvements — one specific "nice, this removes the whole retry
branch" does more for review culture than any process document.

**Approve when it is better than what is on main and the blocking items are
resolved.** Not when it is perfect. Perfect is the enemy of a merged PR.

## Reviewing Efficiently

- Under an hour, in batches. Reviews sitting for two days block a person.
- Cap a session at ~400 lines or ~60 minutes; quality falls off a cliff after.
- Check out the branch and run it for anything UI or non-obvious. Reading the
  diff does not show you a broken empty state.
- Skim generated files; review the generator.

## Things Worth Checking Every Time

- Error paths: what does the user see when this throws?
- Empty and loading states for any async UI
- Authorization on the specific record, not just "is logged in"
- Input validated server-side
- Unbounded queries, missing pagination, N+1
- New dependency: is it maintained, and is it worth the bundle/attack surface?
- Migrations: reversible? backward-compatible with the running code?
- Anything time- or timezone-dependent
- Tests that assert something real, not `expect(true).toBe(true)`

## Being Reviewed

- Your code is not you. A comment on a line is not a judgement of you.
- Answer every thread. "Done in abc123" or "keeping it — here's why" both close it.
- If a comment is unclear, ask rather than guessing at a rewrite.
- If you disagree, say so with reasoning. Reviewers are wrong regularly.
- Thank people for catching real bugs. It makes the next review more thorough.

## Comment Templates

```
blocking: <what breaks> — <why it breaks> — <suggested fix>
question: <what you don't understand and why it matters>
nit:      <small improvement, explicitly non-blocking>
praise:   <what was genuinely good, specifically>
```

Use GitHub's **suggested changes** for anything one-line — the author accepts it
in a click instead of translating prose into a diff.

## Reviewing an AI-Authored PR

Same bar, plus: check that referenced APIs and config keys actually exist in the
repo's versions, that tests assert behaviour rather than restating the
implementation, and that no file was silently rewritten beyond the stated scope.
Read the whole diff, not the summary.
