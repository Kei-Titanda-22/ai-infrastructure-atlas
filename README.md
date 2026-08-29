# AI Infrastructure Atlas

個人用の半導体・AIインフラ横断リサーチデータベース。

**v0.3 completed: 100 companies / sector map / company comparison**  
**Next milestone: v0.4 — earnings and financial history**

## Live site

https://kei-titanda-22.github.io/ai-infrastructure-atlas/

GitHub is the source-control and CI/CD platform. The browser-accessible GitHub Pages site above is the delivery surface.

## Project Constitution

このプロジェクトの最上位ルールは [`docs/constitution.md`](docs/constitution.md) の9原則です。UI、データ取得、自動化、公開方法が憲法と衝突する場合は憲法を優先します。

1. 企業IR、公的機関、業界団体を一次情報源にする。
2. すべての数字にSource・基準日・定義を付ける。
3. 他社の文章・図表・スクリーンショットは原則転載しない。
4. グラフはSource付きデータから自前生成する。
5. 株価リアルタイム配信は実装しない。
6. AIによる分析と客観データを分離する。
7. 各データソースの利用条件をSource Policy Registryで管理する。
8. APIキー・秘密情報をGitHubに置かない。
9. 公開・有料化等の段階で法務・規制・プライバシーを再レビューする。

## Release roadmap

- v0.1 — 20社・静的データ **Complete**
- v0.2 — 100社・セクターマップ **Complete**
- v0.3 — 企業比較 **Complete**
- v0.4 — 決算データ **Next**
- v0.5 — 自動更新
- v1.0 — AI Infrastructure Atlas

## Current coverage

- 100 companies
- 9 value-chain layers / 9 stages including AI demand
- searchable company directory
- technology/process links
- company detail research pages
- searchable 2–5 company comparison workbench
- 8 sector comparison presets
- comparability states with period / basis / verification checks
- financial provenance and verification states
- Pagefind full-text search
- GitHub Pages deployment

新規企業の財務数値は監査前のため意図的に未収録です。Source利用条件未審査の資料は手動参照限定です。

## Stack

- Astro 7
- TypeScript
- Astro Content Collections + Zod
- Pagefind 1.5
- Vanilla JavaScript
- GitHub Pages + GitHub Actions

## Commands

```bash
npm install
npm run validate
npm run dev
npm run build
npm run preview
```

## Documents

- `docs/constitution.md` — binding governance rules
- `docs/roadmap.md` — canonical release roadmap
- `docs/v0.2-scope.md` — completed 100-company expansion
- `docs/v0.3-scope.md` — completed company-comparison phase
- `docs/data-model.md` — research data contract
- `docs/design-system-v04.md` — UI design system
- `docs/status.md` — current implementation state
