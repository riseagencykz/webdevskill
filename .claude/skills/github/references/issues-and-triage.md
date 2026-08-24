# Issues & Triage

## A Bug Report That Can Be Acted On

```markdown
**What happens:** Search returns 500 when the query contains a slash.
**What should happen:** Empty result set, or results matching the literal text.

**Steps:**
1. Go to /search
2. Enter `a/b`
3. Press Enter

**Environment:** v2.11.0, Chrome 131, macOS 15.2
**Error:** `re.error: nothing to repeat at position 0` (core.py:88)
**Frequency:** every time
```

Non-negotiable parts: expected vs actual, exact steps, version, the error text.
A report missing steps costs a maintainer an hour of guessing; a report missing
the version costs a wrong fix.

## Feature Requests

Lead with the problem, not the solution. "Add a dropdown" hides the requirement;
"I can't tell which stack a result came from" invites a better answer.

```markdown
**Problem:** When I search across stacks I can't tell which stack a row is for,
so I paste React code into a Vue project.
**Who/how often:** Everyone using --stack, every multi-stack search.
**Current workaround:** Re-run the search one stack at a time.
**Proposed:** Show the stack name in each result row.
```

## Labels — Keep the Set Small

| Axis | Labels |
|------|--------|
| Type | `bug`, `feature`, `docs`, `chore`, `question` |
| Priority | `p0-critical`, `p1-high`, `p2-normal`, `p3-low` |
| Status | `needs-repro`, `needs-decision`, `blocked`, `ready` |
| Entry | `good-first-issue`, `help-wanted` |

Thirty labels means nobody uses any of them. Each label must change what someone
does.

## Triage Pass

Run it on a schedule (weekly is enough for most repos). For each new issue:

1. **Duplicate?** Close, linking the original — with a sentence, not a bare
   close. Add any new detail to the original.
2. **Reproducible?** If not, ask for the specific missing detail and label
   `needs-repro`. Close after ~2 weeks of no response, inviting reopening.
3. **In scope?** If not, say so kindly and explain the boundary. An issue left
   open for a year with no intent to fix is worse than a clear "no".
4. **Label** type + priority. 5. **Assign** or leave it open for contributors,
   labelled `help-wanted` with enough context to start.

Priority is about user impact, not who asked:

- `p0` — data loss, security, main flow broken in production. Drop other work.
- `p1` — a real workflow broken with no workaround. This sprint.
- `p2` — annoying, has a workaround. Backlog.
- `p3` — nice to have. Backlog, honestly maybe never.

## Hygiene

- One issue, one problem. Split threads that grow a second topic.
- Link issue ↔ PR (`Closes #123`), so the fix is findable from the report.
- Close with the resolution and the release it landed in.
- Stale-bot only with a long window (60+ days) and never on `p0`/`p1` — nothing
  drives contributors away faster than a bot closing their valid bug.
- Convert open-ended discussion to Discussions; keep Issues actionable.

## Writing to Reporters

They gave you free QA. Assume good faith and be specific about what you need:

> Thanks for the report. I can't reproduce this on 2.11.0 with Chrome 131 —
> could you paste the full error from the console and the output of
> `uipro --version`? That'll tell us whether it's the CLI or the skill data.
