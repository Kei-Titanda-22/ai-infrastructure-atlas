# AI Infrastructure Atlas

個人用の半導体・AIインフラ横断リサーチデータベース。

**Current milestone: v0.2 — 100社化・セクターマップ**  
**v0.1 completed: Core 20 / static data / public GitHub Pages site**

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
- v0.2 — 100社・セクターマップ **In progress**
- v0.3 — 企業比較
- v0.4 — 決算データ
- v0.5 — 自動更新
- v1.0 — AI Infrastructure Atlas

一部の後段機能は先行実装されていますが、バージョン番号は各段階の主目的と完成条件で管理します。詳細は [`docs/roadmap.md`](docs/roadmap.md) と [`docs/v0.2-scope.md`](docs/v0.2-scope.md) を参照してください。

## Current coverage

- 50 companies after v0.2 Batch C
- 9 value-chain layers
- searchable company directory
- technology/process links
- company detail research pages
- comparison prototype
- financial provenance and verification states
- Pagefind full-text search
- GitHub Pages deployment

v0.2 Batch Aでは計算半導体・製造装置、Batch Bでは後工程・基板・材料、Batch Cでは光通信・ネットワーク・電線を中心に各10社を追加しています。新規企業の財務数値は監査前のため意図的に未収録です。

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

`npm run validate` はSource・定義・利用条件・財務監査・Secret等の整合性を確認します。`npm run build` はAstro生成後にPagefind索引を作成します。

## Data policy

- Objective data and analyst judgment are stored separately.
- Missing financial values are never silently converted to zero.
- Numeric objective data requires provenance before publication.
- Subjective scores are optional and are not forced onto new companies.
- Unreviewed sources remain manual-reference-only.
- Company relationships require evidence before being treated as verified facts.

## Documents

- `docs/constitution.md` — binding governance rules
- `docs/roadmap.md` — canonical release roadmap
- `docs/v0.1-scope.md` — v0.1 completion basis
- `docs/v0.2-scope.md` — current 100-company expansion plan
- `docs/data-model.md` — research data contract
- `docs/design-system-v04.md` — UI design system
- `docs/financial-audit-2026-08-30.md` — current financial audit log
- `docs/status.md` — current implementation state
- `docs/delivery-requirements.md` — browser deployment Definition of Done
