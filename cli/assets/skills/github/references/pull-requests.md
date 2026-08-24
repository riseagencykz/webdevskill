# Pull Requests

## Size Is the Whole Game

Review quality collapses as diffs grow. Under ~200 lines, reviewers find real
bugs; past ~1,000, they find typos and approve.

Ways to split:
- Refactor PR first (no behaviour change), then the feature PR on top.
- Schema/migration PR, then the code that uses it.
- Backend PR, then the UI.
- Stack PRs: `feat/api-base` → `feat/api-endpoints`, each reviewable alone.

If a PR must be large (generated files, a mechanical rename), say so in the
first line of the description and point the reviewer at the ~50 lines that
actually need thought.

## Title

Same rules as a commit subject — Conventional Commits, imperative, specific.
With squash-merge the PR title becomes the commit message on the default
branch, so it is the release input. Get it right.

```
✅ feat(search): add cursor pagination to /api/orders
❌ Updates
```

## Description

Answer the reviewer's four questions:

```markdown
## Why
Offset pagination on /api/orders takes 4s past page 50 and skips rows when
new orders arrive mid-scroll.

## What
Switches the endpoint to cursor pagination (opaque base64 cursor over
created_at + id). Offset params still accepted for one release, with a
deprecation header.

## How to verify
1. `npm run dev`, open /orders
2. Scroll past page 50 — response stays under 200ms
3. Create an order in another tab, keep scrolling: no duplicate rows

## Risk / rollback
Additive. Old clients keep working. Revert the commit; no migration.
```

Add screenshots or a short recording for any visual change — before/after, and
both light and dark themes if the repo supports them. A UI PR without a
screenshot forces every reviewer to check out the branch.

Link the issue with a closing keyword: `Closes #123`.

Check the repo for `.github/pull_request_template.md` and fill its sections
rather than inventing your own.

## Before You Request Review

- [ ] Re-read your own diff first. You will find something, every time.
- [ ] CI green (lint, typecheck, tests, and this repo's asset-sync check)
- [ ] No debug output, commented-out code, or stray `TODO` without an issue
- [ ] No secrets, no `.env`, no personal paths
- [ ] Tests for new behaviour and for the bug being fixed
- [ ] Docs/README updated if the interface changed
- [ ] Self-review comments left on anything non-obvious — pre-empt the question

Use **draft** PRs while work is in progress. A non-draft PR is a request for
someone's attention; spending it on unfinished work is expensive.

## Responding to Review

- Every comment gets a resolution: a change, or a reply explaining why not.
  Resolving a thread silently reads as ignoring it.
- Push follow-up commits rather than force-pushing, so the reviewer can read
  the delta. Squash at merge.
- Disagreement is fine — argue with reasoning, not with volume. If it stays
  stuck after two rounds, take it to a call and post the outcome in the thread.
- Re-request review explicitly after pushing fixes; a push alone often notifies
  nobody.

## Merging

| Strategy | Use when |
|----------|----------|
| Squash | Default. Messy branch history, one logical change |
| Merge commit | The individual commits are curated and worth keeping |
| Rebase | Linear history required and the commits are clean |

At merge: confirm the squash message is a good Conventional Commit (GitHub
prefills it from the PR title), keep the `Closes #123` footer, and delete the
branch afterwards.

Do not merge your own PR without an approval unless the repo says solo merges
are fine. Never merge red CI by disabling the check — fix the check or fix the
code.

## Stuck PRs

- Open for a week with no review → ping once with what you need, in the PR.
- Conflicts → merge the base branch in and resolve (never force-push someone
  else's branch). Regenerate lockfiles with tooling, never by hand.
- Scope crept mid-review → split. Land the agreed part, open a follow-up.
