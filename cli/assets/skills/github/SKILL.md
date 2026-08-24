---
name: github
description: "GitHub workflow: branching, Conventional Commits, pull requests, code review, GitHub Actions CI/CD, issue triage, releases and semantic-release, repository hygiene (CODEOWNERS, templates, branch protection, secret scanning), and a gh CLI cookbook. Use when creating branches or commits, opening or reviewing a PR, writing or debugging a workflow file, triaging issues, cutting a release, or setting up a repository."
argument-hint: "[pr|review|commit|actions|issue|release|hygiene] [context]"
license: MIT
metadata:
  author: riseagency
  version: "1.0.0"
---

# GitHub Workflow

Everything between "the code works on my machine" and "it is merged, released,
and someone else can maintain it."

## When to Use

- Naming a branch, writing a commit message, splitting work into commits
- Opening a PR, or making an existing PR reviewable
- Reviewing someone else's PR, or responding to review on your own
- Writing or debugging a GitHub Actions workflow
- Triaging issues, labelling, writing a reproducible bug report
- Cutting a release, tagging, writing release notes
- Setting up a new repository so it does not rot

## References (Knowledge Base)

| Topic | File | Read it when |
|-------|------|--------------|
| Branching & commits | `references/branching-and-commits.md` | Naming a branch, writing commits, fixing history |
| Pull requests | `references/pull-requests.md` | Opening, sizing, describing, landing a PR |
| Code review | `references/code-review.md` | Reviewing, or receiving review |
| Actions & CI | `references/actions-ci.md` | Writing/debugging workflows, caching, secrets |
| Issues & triage | `references/issues-and-triage.md` | Bug reports, labels, duplicates, backlog |
| Releases | `references/releases.md` | Versioning, tags, changelogs, semantic-release |
| Repo hygiene | `references/repo-hygiene.md` | New repo setup, protection rules, templates |
| gh CLI cookbook | `references/gh-cli-cookbook.md` | You need the exact command |

## This Repository's Rules

From `CLAUDE.md` — these override any general advice below:

- **Never push directly to `main`.** Branch (`feat/...`, `fix/...`), commit,
  push, open a PR.
- Data and scripts are edited in `src/ui-ux-pro-max/`, then mirrored with
  `cd cli && npm run sync:assets`. Committing an edit to a mirrored copy without
  running the sync fails the "Check asset sync" workflow.
- `.claude/skills/ui-ux-pro-max/SKILL.md` is hand-authored — not generated.
- Releases run through semantic-release (`.releaserc.json`), so the commit
  message *is* the release input. See `references/releases.md`.

## The Loop

1. **Branch** from an up-to-date default branch.
2. **Commit** in reviewable steps with Conventional Commit subjects.
3. **Push and open a PR** — draft while it is still moving.
4. **Green CI** before asking for review. Red CI wastes the reviewer's turn.
5. **Address every comment** — change it, or reply why not. Silence is not a
   response.
6. **Merge** with the strategy the repo uses (squash by default).
7. **Delete the branch.**

## Fast Rules

- A PR over ~400 changed lines gets a worse review than two PRs of 200.
- Never mix a refactor and a behaviour change in one PR. The reviewer cannot
  see the behaviour change inside the noise.
- Never force-push to someone else's branch, or to a shared branch. On your own
  PR branch, force-push only before review has started (or use
  `--force-with-lease`).
- Never commit secrets. If you do: rotate the secret, then clean history —
  in that order, because the leak is already public.
- Never merge with a failing required check by disabling the check.
- Every PR description answers **why**, not only what. The diff already says what.
