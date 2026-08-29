# AI Infrastructure Atlas v0.1

個人用の半導体・AIインフラ横断リサーチサイト。

## Project Constitution

このプロジェクトの最上位ルールは [`docs/constitution.md`](docs/constitution.md) の9原則です。UI、データ取得、自動化、公開方法が憲法と衝突する場合は憲法を優先します。

要約：

1. 企業IR、公的機関、業界団体を一次情報源にする。
2. すべての数字にSource・基準日・定義を付ける。
3. 他社の文章・図表・スクリーンショットは原則転載しない。
4. グラフはSource付きデータから自前生成する。
5. 株価リアルタイム配信は実装しない。
6. AIによる分析と客観データを分離する。
7. 各データソースの利用条件をSource Policy Registryで管理する。
8. APIキー・秘密情報をGitHubに置かない。
9. 公開・有料化等の段階で法務・規制・プライバシーを再レビューする。


## Delivery requirement

GitHub is the source-control and CI/CD platform, not the final deliverable. **v0.1 is complete only when the site is actually deployed and reachable through a browser-accessible HTTPS URL.** A ZIP, local folder, or GitHub repository alone is an intermediate artifact.

The binding delivery criteria are defined in [`docs/delivery-requirements.md`](docs/delivery-requirements.md).

## v0.1 scope

- Core 20 companies
- 8 value-chain layers
- Atlas view
- Company directory + client-side filters
- Company detail pages
- 4-company comparison
- Pagefind full-text search after build
- GitHub Pages deployment workflow
- Schema-validated company data
- Source Policy Registry
- Metric Definition Registry
- Financial metrics intentionally `N/A` until verified ingestion is implemented

## Stack

- Astro 7
- TypeScript
- Astro Content Collections + Zod schema validation
- Pagefind 1.5
- Vanilla JavaScript for lightweight client interactions
- GitHub Pages + GitHub Actions

## Commands

```bash
npm install
npm run validate
npm run dev
npm run build
npm run preview
```

`npm run validate` enforces core constitutional data invariants before deployment. `npm run build` runs Astro first and Pagefind second. Pagefind therefore works in the built site, not the plain Astro development server.

## GitHub Pages

`.github/workflows/deploy.yml` uses GitHub Pages Actions to install, validate, build, index, upload, and deploy the static site. `astro.config.mjs` derives the GitHub owner/repository at build time, so a normal project Pages repository does not require hardcoding the username or repository name.

This prototype intentionally uses `npm install` because a trustworthy `package-lock.json` could not be generated in the current sandbox. Once dependencies can be installed normally, generate and commit the lockfile and switch the workflow install step to `npm ci`.

For a custom domain, set `SITE_URL` and optionally `BASE_PATH` in the workflow/environment and add the domain configuration separately.

## Data policy

1. Objective data and analyst judgment are stored separately.
2. Missing financial values are `null`, never `0`.
3. Numeric objective data requires `sourceId`, `asOf`, and `definitionId` before a non-null value can pass validation.
4. Analysis scores require `assessmentSource`, `asOf`, and `definitionId` and are not represented as objective facts.
5. Source usage terms are stored separately in `src/data/source-policies.json`.
6. A source with pending terms review remains manual-reference-only; automation/republication is not inferred to be allowed.
7. Provisional scores are UI-validation data and are not final investment ratings.
8. Company relationships are not published until source verification is completed.
9. API keys and secrets are excluded from Git and checked heuristically in CI.

## Design documents

- `docs/constitution.md` — binding project governance rules
- `docs/v0.1-scope.md` — v0.1 boundaries and exit criteria
- `docs/wireframes.md` — page-level UX wireframes
- `docs/data-model.md` — research data contract
- `docs/repository-structure.md` — code/data ownership boundaries
- `docs/architecture.md` — build, security, and future automation architecture
- `docs/roadmap.md` — staged expansion and review gates
- `docs/delivery-requirements.md` — browser deployment and v0.1 Definition of Done
