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

Stage 4 / 4 companies。`globalfoundries`、`micron`、`arista`、`bosch`を`DISPLAY_COPY_ONLY`として追加。First batch progressは`15 / 15`。既存Pilot 5社と合わせ、Compare対応企業は20社。First Batch rolloutは完了し、Human Review待ち。

## 次に行う作業

First Batch 15社のHuman Reviewとmerge判断を行う。残り95社への展開は別の作業単位とし、本Stageでは未着手とする。

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
- Supported companies: `12`
- 1～4社 combinations: `793`
- protected semantic diff: `0`
