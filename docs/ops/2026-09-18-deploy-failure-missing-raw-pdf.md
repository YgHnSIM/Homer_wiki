# 2026-09-18 Deploy failure: missing raw PDFs in CI

## Summary

GitHub Pages deploy failed on `main` after merging structure-audit PR #1 because `npm run check` required `raw/*.pdf` files that had been removed from git (copyright / public-repo hygiene). Local checks still passed because PDFs remained on the author disk.

- Failed run: https://github.com/YgHnSIM/Homer_wiki/actions/runs/35320637012
- Symptom: 22 × `raw 원본을 찾을 수 없습니다: …pdf` during **Validate Wiki Structure**

## Root cause

1. Structure audit untracked `raw/**/*.pdf` and gitignored them (intentional).
2. `wiki/sources/*` frontmatter still lists bibliographic PDF filenames under `raw/`.
3. `validateSourcePageSources` treated any non-URL source that failed `isFileWithin(raw/)` as an error — including **missing** files.
4. CI checkout has no local PDFs → validation failed. Author machine still had PDFs → false confidence from `npm run check`.

## Resolution

- Missing `*.pdf` bibliography entries under `raw/` are allowed by default (author-local assets).
- Paths that **exist** but escape `raw/` (symlink/path traversal) still fail.
- Non-PDF missing raw targets still fail.
- Optional strict local mode: `HOMER_REQUIRE_RAW=1` (`npm run check:raw`).
- Deploy workflow runs `npm run check:ci` (same gate as CI-safe default).
- Regression test covers missing PDF success + `HOMER_REQUIRE_RAW` failure.

## Recurrence prevention

1. **Never** re-commit copyrighted PDFs to the public repo.
2. Before relying on local `npm run check` after changing `raw/` tracking, run a CI-shaped check (no PDFs present, or `npm run check:ci`).
3. Prefer renaming/hiding `raw/*.pdf` temporarily when validating deploy-critical validator changes.
4. Keep this ADR linked from AGENTS `raw/` policy.

## Verification

- `npm run check` / `npm run check:ci` pass with PDFs absent from the git tree.
- Tooling regression includes missing-PDF case.
