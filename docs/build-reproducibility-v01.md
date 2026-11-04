# Build reproducibility v01

## Scope and baseline

This change pins future dependency resolution and records the environment actually used by local and CI builds. It does not alter financial data, product UI, existing freeze files, or the deployed v18 release. The baseline is main `fbcf570d36e8d6b35688f937c4c374aa9a6a11fe` (tree `5301bcfd50e25a114342bbd7766cd0bbd5cb7ed8`). PR #207 was merged; Pages run #325, attempt 2, succeeded. Finance remains 714 records across 100 companies, with six-period coverage 95 complete / 0 partial / 0 awaiting / 5 needs review.

Before this change, Astro `7.2.9` and Pagefind `1.5.2` were direct exact dependencies, but no root lockfile was tracked. Pages used `npm install --no-audit --no-fund`. Consequently, the exact transitive dependency tree used by the old Pages run cannot be reconstructed from Git. Its artifact and local final dist differed in two Compare script URLs and their referenced JS. The [v18 evidence](verification/financial-history-v18-evidence-manifest.json) and its external release evidence remain historical records.

## New dependency contract

- Node `22.23.4`, npm `10.9.9`, `.nvmrc`, `engines`, and `packageManager` are aligned. Astro and Pagefind direct versions remain unchanged.
- `package-lock.json` was created with a fresh, dedicated worktree using `npm install --package-lock-only --no-audit --no-fund` under Node `22.23.4` / npm `10.9.9`, without copying a hidden `node_modules/.package-lock.json`. Its SHA-256 is `68bccf4cd414b45c7f99b582c6eb46457afd002087e70994ca2e085838997f4b`.
- Pages now uses `npm ci --no-audit --no-fund` and prints the installed environment before validation. The new PR workflow uses the same install, runs formal validation, build and focused gates, and uploads environment, source and dist SHA evidence. It has read-only repository permission and does not deploy.
- `npm run report:build-environment` reads installed package metadata, rather than treating the lockfile as proof of installation. It reports Node/npm, OS/architecture, SHA-256 of both package manifests, and every installed Astro, Vite, esbuild, Rollup, Rolldown and Pagefind version found at locked paths. Native platform bindings are listed separately. It does not print the environment variable set, credentials or tokens.

The old local dependency tree contained Vite `8.2.2` and Rolldown `1.2.6`; the new lock resolves Vite `8.3.5` and Rolldown `1.2.16`. Astro `7.2.9`, esbuild `0.28.2`, and Pagefind `1.5.2` remain the same. Rollup itself is absent in the new installed tree; Rolldown is present. Windows native bindings are `@esbuild/win32-x64 0.28.2` and `@rolldown/binding-win32-x64-msvc 1.2.16`. These are reported separately from logical package versions. No old Linux CI package-version report exists, so the old artifact's dependency versions are unknown.

## Local verification

Evidence is stored outside the repository at `work/ai-infrastructure-atlas-build-reproducibility-v01-evidence`. The [evidence manifest](verification/build-reproducibility-v01-evidence-manifest.json) lists file SHA-256 values and comparison procedures. This worktree used a physical `node_modules` directory; the v13–v18 dependency junctions were neither reused nor changed.

Two independent `npm ci` operations completed with exit code 0. Both left the lockfile SHA unchanged and reported the same installed logical and native versions. Formal `npm run validate` completed with exit code 0, including data validation and the repository's secret scan. Focused Japanese display, search, Atlas and chart tests passed. Both final clean `npm run build` operations completed with exit code 0. An earlier build attempt reached Pagefind but ended with a sandbox `PermissionDenied` (exit 101); its log is retained separately from the two successful builds.

Both successful builds used the same generated-input digest `02d043d160e4e21d3eed1e6b12d4502178d59b01344488d0b5d25f6b2b319fff`. Their active v18 freeze matches 101/101. The 100 company-detail SHA maps, 210-route sets and 105 Pagefind URL sets match between builds and the existing v18 final map. Compare HTML is 1,188,819 B (under the unchanged 1,217,802 B cap) with SHA-256 `9984ecd7c18b6374ca07e84f7666d410ec6f0086a5f031d689f435969be8f769`. Existing on-demand asset capacity gates pass. The Compare HTML and five inspected Compare, search and Evidence JS files have equal SHA across the two builds; the first build's JS SHA values were observed directly before the second clean build, rather than retained as file copies.

This newly locked local Compare HTML and those five JS files match the previously deployed v18 Pages artifact byte for byte. That observation narrows the earlier local/artifact discrepancy; it does not prove which exact dependency versions ran in Pages #325. The old local Compare SHA `635c1311f5a084a09af13dd6993d7bceb2ea2eba3fa5a844b9272e272a9b9a4c` remains a distinct historical result. Pagefind auxiliary files are excluded from the active freeze contract; their byte-level stability across operating systems is not asserted. The 105 URL set and freeze match remain strict.

Dedicated Preview `http://127.0.0.1:4393/ai-infrastructure-atlas/` served Compare HTML, Hexagon detail HTML and a representative Compare JS file with byte hashes equal to the final dist. Chrome QA at 1024 / 390 / 360 px checked Hexagon, Aptiv and Kioxia. Both charts on each page had six matching periods and six points, without measured label overlap or document horizontal overflow. Pagefind returned three Hexagon results and its company result opened the expected page. Compare preset selection, four-company limit, expanded URL restoration, Evidence drawer (64 × 44 px marker, Escape and focus return), and Atlas stage-filter navigation were exercised. The checked Compare, search and Atlas pages had no document overflow at the three widths; no site console error was observed. External primary-source targets and screenshot-file storage were outside this QA.

## Remaining limits

The new PR workflow has not run on Linux yet; its result must be assessed after a PR exists. A lockfile fixes package resolution but does not, by itself, guarantee Windows/Linux byte-identical output, especially for platform-native packages and Pagefind auxiliary files. No v18 source, freeze, deployment or historical evidence was rewritten. This change is not a v19 financial audit.
