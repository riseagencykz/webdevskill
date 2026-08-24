# Branching & Commits

## Branch Names

`<type>/<short-kebab-description>` — optionally with an issue number.

```
feat/cursor-pagination
fix/427-hydration-mismatch-on-cart
chore/bump-node-22
docs/stack-selection-guide
```

Types match the commit types below. Keep it under ~50 characters, lowercase, no
spaces. Branch from an up-to-date default branch:

```bash
git switch main && git pull --ff-only && git switch -c feat/cursor-pagination
```

## Conventional Commits

```
<type>(<optional scope>): <subject>

<optional body — why, not what>

<optional footer — BREAKING CHANGE: / Closes #123>
```

| Type | Use for | Release effect (semver) |
|------|---------|------------------------|
| `feat` | New user-visible capability | minor |
| `fix` | Bug fix | patch |
| `perf` | Faster, same behaviour | patch |
| `refactor` | Restructure, no behaviour change | none |
| `docs` | Documentation only | none |
| `test` | Tests only | none |
| `build` | Build system, dependencies | none |
| `ci` | CI configuration | none |
| `chore` | Everything else | none |
| `revert` | Reverting a previous commit | matches |

A `!` after the type/scope, or a `BREAKING CHANGE:` footer, triggers a major
release: `feat(api)!: drop v1 endpoints`.

Where semantic-release is configured (as in this repo), the commit message is
the release input — a feature landed as `chore:` never ships a version.

## Subject Line

- Imperative mood: "add", not "added"/"adds". Read it as *"if applied, this
  commit will …"*.
- ≤ 72 characters, no trailing period, lowercase after the colon.
- Say what changed, specifically. `fix: bug` and `update code` are noise.

```
✅ fix(search): return empty result set instead of throwing on blank query
✅ feat(cli): add --stack flag to uipro init
❌ fix: fixes
❌ WIP
❌ Update search.py
```

## Body — Write the Why

The diff shows what changed. The body explains what a future reader cannot
reconstruct: the reason, the alternative rejected, the constraint.

```
fix(search): normalize CRLF before hashing synced assets

Windows checkouts with autocrlf=true produced a different byte hash than
CI, so "Check asset sync" failed on every Windows-authored PR even when
the content was identical. Normalizing to LF before hashing makes the
check platform-independent.

Closes #418
```

## Commit Granularity

One logical change per commit. A reviewer should be able to read commit-by-commit
and never see a step that does two unrelated things.

- Separate mechanical changes (rename, reformat, move) from logic changes —
  ideally into separate commits, better into separate PRs.
- Do not commit generated output and its source in a way that hides the source
  change under 5,000 generated lines; call it out in the message.
- Commit working states. "Broken, fixed in next commit" makes `git bisect` lie.

## Fixing History (Before Review, On Your Own Branch)

```bash
git commit --amend --no-edit          # fold into the last commit
git rebase -i HEAD~4                  # squash/reword/reorder the last 4
git switch main && git pull --ff-only && git switch - && git rebase main
git push --force-with-lease           # never plain --force
```

`--force-with-lease` refuses to overwrite commits you have not seen — it is the
difference between rewriting your own work and deleting a colleague's.

Once someone has reviewed, stop rewriting: push follow-up commits so the
reviewer can read what changed since their pass. Squash at merge.

## Rescue Commands

```bash
git reflog                            # everything you think you lost is here
git reset --hard HEAD@{2}             # go back to a reflog state
git restore --staged <file>           # unstage, keep changes
git restore <file>                    # discard local changes (destructive)
git revert <sha>                      # undo a pushed commit safely
git cherry-pick <sha>                 # take one commit onto this branch
git stash push -m "wip"; git stash pop
```

Never `reset --hard` on a branch that is pushed and shared — `revert` instead.
