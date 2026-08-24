# gh CLI Cookbook

Exact commands. Everything here also has a web UI equivalent; the CLI is faster
and scriptable.

```bash
gh auth login          # once
gh auth status         # who am I, which scopes
```

Note: in some environments `gh` is unavailable and GitHub is reached through MCP
tools or the REST API instead. The concepts below map one-to-one.

## Pull Requests

```bash
# open a PR from the current branch
gh pr create --title "feat(search): add cursor pagination" \
             --body-file .github/pr-body.md --base main
gh pr create --draft --fill        # draft, title/body from commits

gh pr list --state open --limit 20
gh pr list --author "@me"
gh pr list --search "review-requested:@me"

gh pr view 431                     # summary
gh pr view 431 --web               # open in browser
gh pr diff 431
gh pr checkout 431                 # check out someone's PR locally

gh pr checks 431                   # CI status
gh pr checks 431 --watch           # block until they finish

gh pr review 431 --approve
gh pr review 431 --request-changes --body "See the auth comment"
gh pr comment 431 --body "Rebased on main, CI green"

gh pr merge 431 --squash --delete-branch
gh pr ready 431                    # draft → ready for review
gh pr edit 431 --add-label bug --add-reviewer @octocat
```

## Issues

```bash
gh issue create --title "Search 500s on '/' in query" --body-file bug.md \
                --label bug,p1-high
gh issue list --label bug --state open
gh issue list --search "is:open no:assignee label:good-first-issue"
gh issue view 418 --comments
gh issue close 418 --comment "Fixed in v2.11.1"
gh issue edit 418 --add-label needs-repro --milestone "v2.12"
```

## Actions

```bash
gh run list --limit 10
gh run list --workflow tests.yml --branch main
gh run view 1234567 --log-failed        # only the failing step's log
gh run watch                            # follow the latest run
gh run rerun 1234567 --failed           # re-run only failed jobs
gh workflow run deploy.yml -f environment=preview   # workflow_dispatch
gh workflow list
```

`gh run view --log-failed` is the single most useful command when CI is red —
it skips thousands of successful lines.

## Releases

```bash
gh release create v2.12.0 --generate-notes
gh release create v2.12.0 --notes-file CHANGELOG-2.12.0.md --title "v2.12.0"
gh release list
gh release view v2.12.0
gh release upload v2.12.0 dist/bundle.zip
```

## Repository

```bash
gh repo view --web
gh repo clone riseagencykz/webdevskill
gh repo set-default riseagencykz/webdevskill   # for the commands above
gh browse src/ui-ux-pro-max/data/styles.csv    # open a file on github.com
gh repo fork --clone
```

## Arbitrary API

Anything the CLI does not wrap:

```bash
gh api repos/{owner}/{repo}/pulls/431/files --jq '.[].filename'
gh api repos/{owner}/{repo}/branches/main/protection
gh api -X PATCH repos/{owner}/{repo} -f description="…"
gh api graphql -f query='{ viewer { login } }'
```

`--jq` filters inline, so no `jq` pipe is needed.

## Aliases Worth Setting

```bash
gh alias set prc 'pr create --draft --fill'
gh alias set prs 'pr list --search "review-requested:@me"'
gh alias set fails 'run view --log-failed'
```
