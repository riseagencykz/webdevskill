# GitHub Actions & CI

## Anatomy

```yaml
name: Tests
on:
  push: { branches: [main] }
  pull_request:                      # every PR, any branch
permissions:
  contents: read                     # start read-only, widen per job
concurrency:                         # cancel superseded runs on the same ref
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15              # never leave this unset
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'               # built-in dependency cache
      - run: npm ci                  # ci, not install — respects the lockfile
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

Four things people forget, each of which costs real money or time:
`timeout-minutes`, `concurrency` cancellation, least-privilege `permissions`,
and `npm ci` instead of `npm install`.

## Speed

- Cache the dependency store keyed on the lockfile hash (`setup-node`'s `cache:`
  does this for npm/pnpm/yarn).
- Split independent work into parallel jobs; use `needs:` only for real
  dependencies. A serial chain of five jobs is usually four jobs of waiting.
- Fail fast: lint and typecheck before the 10-minute e2e suite.
- `matrix` for real platform coverage, not for the sake of a grid — each cell
  costs minutes.
- `paths:` / `paths-ignore:` so a README edit does not run the full e2e suite.

## Security

- **Pin third-party actions to a commit SHA**, not a tag. Tags are mutable; a
  compromised tag runs arbitrary code with your token.
  ```yaml
  - uses: actions/checkout@b4ffde6...   # v4.1.1
  ```
- Least privilege at the top, widened per job:
  ```yaml
  permissions: { contents: read }
  # in the job that needs it:
  #   permissions: { contents: write, pull-requests: write }
  ```
- Never interpolate untrusted input into a `run:` block — PR titles, branch
  names, and issue bodies are attacker-controlled:
  ```yaml
  # vulnerable — script injection
  - run: echo "${{ github.event.pull_request.title }}"
  # safe — through the environment
  - run: echo "$TITLE"
    env: { TITLE: ${{ github.event.pull_request.title }} }
  ```
- `pull_request_target` runs with write access and repository secrets against
  a fork's code. Avoid it; if unavoidable, never check out the PR head there.
- Secrets are per-repo/environment, referenced as `${{ secrets.NAME }}`, and are
  masked in logs — but a secret you `echo` in base64 is not masked. Do not.
- Fork PRs do not get secrets. Design tests to pass without them.

## Debugging a Failing Workflow

1. Read the failing step's log from the **first** error, not the last.
2. Reproduce locally with the same Node/OS version from the workflow file.
3. Re-run with debug logging: re-run jobs → "Enable debug logging", or set the
   `ACTIONS_STEP_DEBUG` secret to `true`.
4. Add a temporary diagnostic step (`env | sort`, `ls -la`, versions) — remove
   it before merging.
5. `act` runs workflows locally for quick iteration on simple jobs.

Common causes: missing lockfile commit; Node version mismatch with local;
env var only set locally; a test that depends on timezone or ordering; a cache
key that never invalidates; a required file excluded by `.gitignore`.

**"Flake" is not a root cause.** Re-run once to confirm; a second failure is
real. Never skip or delete a test to get green.

## Useful Workflow Patterns

```yaml
# only when relevant files changed
on:
  pull_request:
    paths: ['src/**', 'cli/**', 'package-lock.json']

# comment coverage/preview info on the PR
permissions: { pull-requests: write }

# a scheduled job (UTC — convert from local time)
on:
  schedule: [{ cron: '0 6 * * 1' }]     # Mondays 06:00 UTC

# manual trigger with input
on:
  workflow_dispatch:
    inputs:
      environment: { type: choice, options: [preview, production] }
```

Reusable workflows (`workflow_call`) and composite actions remove copy-paste
across repos — extract once the same twenty lines exist in three places.

## Required Checks

Make the checks that matter **required** in branch protection, and keep that
list short and fast. A required check that takes 40 minutes gets bypassed;
a bypassed check protects nothing.
