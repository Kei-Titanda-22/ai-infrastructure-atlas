# Company Compare Rollout State v0.1

## 現在のmain

- First Batch merge SHA: `145a6c1dfc26ae81e3f1293c0e47f9f18b31d472`
- PR #164 branch head: `22ad60835b7169e1f8d366fe136e6036ef35d4aa`
- Baseline commit: `922e8d045071188d5620acfbe20b7ab26ac885b8`
- Baseline tree: `57488349e640df0a6552b506f92ccdd8c8757115`

## 現在Phase

Company Compare First BatchとRemaining Rollout Batch 1は完了。productionの意味層を変更せず、Human Review済みの表示projectionとオンデマンドCompany assetを40社へ段階的に追加した。Remaining Rollout Batch 2では、既存の構造化データだけを使い20社を追加する。

## Freeze済みPilot 5社

- `nvidia`
- `broadcom`
- `applied-materials`
- `lam-research`
- `tokyo-electron`

## First batch 15社（完了）

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

## Remaining Rollout Batch 1（20社）

- `cadence`
- `marvell`
- `nxp`
- `renesas`
- `synopsys`
- `digital-realty`
- `ge-vernova`
- `schneider-electric`
- `ciena`
- `corning`
- `lumentum`
- `fanuc`
- `smc`
- `asml`
- `kokusai-electric`
- `screen-holdings`
- `linde`
- `shinko-electric`
- `seagate`
- `besi`

## Remaining Rollout Batch 2（20社）

- `infineon`
- `mitsubishi-electric`
- `onsemi`
- `rohm`
- `texas-instruments`
- `eaton`
- `legrand`
- `siemens-energy`
- `cisco`
- `credo`
- `te-connectivity`
- `keyence`
- `tesla`
- `canon`
- `lasertec`
- `entegris`
- `resonac-holdings`
- `sumco`
- `western-digital`
- `disco`

First Batchは`15 / 15`、Remaining Rollout Batch 1は`20 / 20`で完了。Remaining Rollout Batch 2は`20 / 20`を`DISPLAY_COPY_ONLY`として追加する。既存Pilot 5社と合わせ、Compare対応企業は60社、未対応は40社。

## 次に行う作業

残り40社のrollout設計に先立ち、60社対応時点で増加したCompany Compare Evidence shellを最適化する。read model内のsingleton setおよび20社rollout setは維持し、shell出力だけを実際に比較可能な2～4社set（Set A／B、Stage 1～4）へ限定する。shell status setは`60`から`6`へ、shellは`45,038 B raw / 4,452 B gzip`から`16,731 B raw / 3,179 B gzip`へ減少した。最大cold-loadは`303,811 B raw / 27,472 B gzip`から`275,504 B raw / 26,199 B gzip`となり、60社company assetは`60 / 60` byte-identicalを維持した。shell raw上限は一時的な`50,000 B`から`40,000 B`へ復帰する。残り40社の実装は未着手とする。

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
- Supported companies: `60`
- 2～4社 combinations: `523,625`
- 最大cold-load: `303,811 B raw / 27,472 B gzip`
- shell + 60社asset: `61 / 61 byte-identical`
- Astro: `170 routes`
- Pagefind: `105 pages / 5,791 words`
- protected semantic diff: `0`
