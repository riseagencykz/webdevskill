# Repository Hygiene

The set of files and settings that decide whether a repo is maintainable a year
from now. Cheap to add on day one, expensive to retrofit.

## Files

| File | Why |
|------|-----|
| `README.md` | What it is, install, one runnable example, link to docs |
| `LICENSE` | No license = nobody may legally use it |
| `CONTRIBUTING.md` | Setup, branch/commit conventions, how to run tests |
| `CODE_OF_CONDUCT.md` | Required for most public/community repos |
| `SECURITY.md` | Where to report vulnerabilities privately, and response time |
| `CLAUDE.md` / `AGENTS.md` | Conventions for AI assistants working in the repo |
| `.gitignore` | `.env`, `node_modules`, build output, OS cruft |
| `.env.example` | Every key, no values, with comments |
| `.nvmrc` / `engines` | Pin the runtime so CI and local match |
| `CODEOWNERS` | Auto-request the right reviewers |
| `.github/pull_request_template.md` | The four questions from `pull-requests.md` |
| `.github/ISSUE_TEMPLATE/*.yml` | Structured bug/feature forms |

A README's first paragraph should let a stranger decide in 15 seconds whether
this is the thing they need.

## Branch Protection (default branch)

- Require a PR before merging; require ≥ 1 approval.
- Require status checks to pass, and require branches to be up to date.
- Dismiss stale approvals on new pushes.
- Require conversation resolution before merging.
- Block force pushes and deletions.
- Include administrators — a rule that the busiest person bypasses is not a rule.

Keep required checks fast. A 40-minute required check gets worked around.

## CODEOWNERS

```
*                    @riseagencykz/maintainers
/src/ui-ux-pro-max/  @riseagencykz/data-owners
/.github/workflows/  @riseagencykz/maintainers
/cli/                @riseagencykz/cli-owners
```

Last matching pattern wins. Combined with "require review from code owners", it
stops the case where a stranger's PR sits unnoticed because nobody was asked.

## Security Settings

- **Secret scanning** + push protection — blocks the leak before it exists.
- **Dependabot** for security updates and (weekly, grouped) version updates.
- **Code scanning** (CodeQL) for anything public or handling user data.
- Private vulnerability reporting enabled, matching `SECURITY.md`.
- Actions: pin third-party actions to SHAs; restrict which actions may run;
  default `GITHUB_TOKEN` permissions to read-only.

## Automation Worth Having

- CI on every PR: lint, typecheck, test, build.
- A repo-specific consistency check — this repo's "Check asset sync" is exactly
  the right pattern: any invariant a human keeps forgetting becomes a check.
- Auto-delete head branches on merge.
- Stale-issue bot with a generous window (see `issues-and-triage.md`).
- Release automation from commit messages (see `releases.md`).

## Archiving

If a repo is done, archive it and say so at the top of the README with a pointer
to the successor. An unmaintained repo that looks alive wastes everybody's time.
