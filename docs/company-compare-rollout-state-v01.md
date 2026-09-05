# Company Compare Rollout State v0.1

## 現在のmain

- Baseline commit: `922e8d045071188d5620acfbe20b7ab26ac885b8`
- Baseline tree: `57488349e640df0a6552b506f92ccdd8c8757115`

## 現在Phase

Company Compare First Batch。productionの意味層を変更せず、Human Review済みの表示projectionとオンデマンドCompany assetを段階的に追加する。

## Freeze済みPilot 5社

- `nvidia`
- `broadcom`
- `applied-materials`
- `lam-research`
- `tokyo-electron`

## First batch 15社

- `amd`
- `vertiv`
- `tsmc`
- `kioxia`
- `amphenol`
- `aptiv`
- `advantest`
- `asm-international`
- `air-liquide`
- `analog-devices`
- `abb`
- `globalfoundries`
- `micron`
- `arista`
- `bosch`

## 現在のStage

Stage 1 / 3 companies only。`amd`、`vertiv`、`tsmc`を`DISPLAY_COPY_ONLY`として追加する。First batch progressは`3 / 15`。既存Pilot 5社と合わせ、Compare対応企業は8社。

## 次に行う作業

Token calibrationとHuman Reviewの完了後に、別の作業単位として残り12社を扱う。Stage 1では未着手とする。

Company Compare 100社対応完了後、Human Review済みの日本語表示projectionを100社の各社ページへ展開する。canonical dataは変更せず、表示層だけを同期する。

## 参照すべきcontract文書

- [Company Compare Pilot Contract](./company-compare-pilot-contract-v01.md)
- [Company Compare On-demand Loading](./company-compare-on-demand-loading-v01.md)
- [Company Compare Readiness Audit](./company-compare-readiness-audit-v01.md)
- [Company Compare Human UX Review](./company-compare-human-ux-review-v01.md)
- [Codex Resource Rules](./codex-resource-rules-v01.md)

## 最新検証値

- Relation / Binding: `17 / 17`
- Registry Product / Technology / Market: `11 / 8 / 0`
- Projection P1 / P2 / P3: `20 / 14 / 0`
- Financial compatibility ok / caution / blocked: `0 / 2 / 2`
- Pilot Set A Summary / Expanded marker: `16 / 21`
- Pilot Set B Summary / Expanded marker: `23 / 36`
- Pilot Expanded marker: `57`
- Pilot unique grounding / drawer: `53 / 53`
- Supported companies: `8`
- 1～4社 combinations: `162`
- protected semantic diff: `0`

