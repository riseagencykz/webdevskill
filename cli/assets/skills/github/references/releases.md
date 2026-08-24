# Releases

## Semantic Versioning

`MAJOR.MINOR.PATCH` — and the promise it makes to consumers:

- **MAJOR** — a breaking change; users must do something to upgrade.
- **MINOR** — new functionality, backward compatible.
- **PATCH** — bug fix, backward compatible.

Breaking includes: removing or renaming a public export, CLI flag, or config
key; changing a default; changing an output format someone parses; raising the
minimum runtime version. "It's only a data file" is still breaking if a consumer
reads that file.

Pre-1.0, breaking changes in minors are conventional — but say so in the README.

## semantic-release (this repo)

`.releaserc.json` drives releases from commit messages, so the messages are the
release process. Consequences:

- `feat:` → minor. `fix:` / `perf:` → patch. `BREAKING CHANGE:` or `!` → major.
- `chore:`, `docs:`, `refactor:`, `test:`, `ci:` → **no release**. A feature
  landed under `chore:` silently ships nothing.
- With squash-merge, the **PR title** becomes that commit message. A sloppy PR
  title is a wrong version number.
- Do not hand-edit the version in `package.json`, `skill.json`, or
  `.claude-plugin/*.json` if the tooling owns it — and if some files are updated
  manually in this repo, update *all* of them together (see the version-sync
  commits in the log) or the plugin metadata disagrees with the tag.

Verify before merging a release-triggering PR:

```bash
npx semantic-release --dry-run     # prints the version it would publish
```

## Manual Tagging (When Not Automated)

```bash
git switch main && git pull --ff-only
git tag -a v2.12.0 -m "v2.12.0"    # annotated, always
git push origin v2.12.0
gh release create v2.12.0 --generate-notes
```

Never move or delete a published tag. Consumers pin to it; a moved tag is a
supply-chain problem. Made a mistake? Release the next patch.

## Release Notes People Read

Group by what it means for the user, newest first, with links.

```markdown
## 2.12.0

### Features
- Cursor pagination for `/api/orders` — stable results while data changes (#431)
- `--density` dial on design-system search (#428)

### Fixes
- Windows CRLF no longer fails "Check asset sync" (#425)

### Breaking
- `uipro init --ai` no longer accepts `claude-code`; use `claude`.
  Update your scripts: `uipro init --ai claude`
```

Breaking changes always state the migration, not just the removal. `--generate-notes`
gives you a starting list from PR titles — which is another reason PR titles matter.

## Checklist

- [ ] CI green on the commit being released
- [ ] Version consistent across every metadata file the repo keeps in sync
- [ ] Changelog/release notes written for humans, breaking changes with migrations
- [ ] Tag annotated and pushed; release published
- [ ] Artifacts published (npm, marketplace) and verified by installing fresh
- [ ] Rollback path known: which version to pin back to
