# Company Compare Rollout State v0.1

## 現在のmain

- First Batch merge SHA: `145a6c1dfc26ae81e3f1293c0e47f9f18b31d472`
- PR #164 branch head: `22ad60835b7169e1f8d366fe136e6036ef35d4aa`
- Baseline commit: `922e8d045071188d5620acfbe20b7ab26ac885b8`
- Baseline tree: `57488349e640df0a6552b506f92ccdd8c8757115`

## 現在Phase

Company Compare First Batch、Remaining Rollout Batch 1～4は、productionの意味層を変更せず、既存の構造化データだけを使ったHuman Review対象の表示projectionとして段階的に追加した。Compare対応は100社、未対応は0社である。

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

## Remaining Rollout Batch 3（20社）

- `intel`
- `monolithic-power`
- `qualcomm`
- `stmicroelectronics`
- `carrier`
- `equinix`
- `nvent`
- `trane-technologies`
- `coherent`
- `furukawa-electric`
- `denso`
- `omron`
- `yaskawa`
- `kla`
- `nikon`
- `ibiden`
- `shin-etsu-chemical`
- `sandisk`
- `amkor`
- `ajinomoto-fine-techno`

## Remaining Rollout Batch 4（20社）

- `arm`
- `ase-technology`
- `asmpt`
- `fujikura`
- `globalwafers`
- `hanmi-semiconductor`
- `hexagon`
- `jcet`
- `johnson-controls`
- `kinsus`
- `mediatek`
- `mobileye`
- `nan-ya-pcb`
- `samsung-electronics`
- `sk-hynix`
- `smic`
- `sumitomo-electric`
- `tower-semiconductor`
- `umc`
- `unimicron`

First Batchは`15 / 15`、Remaining Rollout Batch 1～4は各`20 / 20`を`DISPLAY_COPY_ONLY`として追加した。既存Pilot 5社と合わせ、Compare対応企業は100社、未対応は0社である。

## 次に行う作業

Batch 2で完了したshell最適化を維持したまま、Batch 4までの20社を追加した。shell status setは`6`のまま、shellは`22,181 B raw`、最大cold-loadは`280,954 B raw / 26,846 B gzip`で、raw上限`330,509 B`以内である。shell raw上限は`40,000 B`を維持する。100社対応のHuman Review完了まで、追加機能には着手しない。

Company Compare 100社対応のHuman Review完了後、Human Review済みの日本語表示projectionを100社の各社ページへ展開する。canonical dataは変更せず、表示層だけを同期する。

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
- Supported companies: `100`
- 1～4社 combinations: `4,087,975`
- 最大cold-load: `280,954 B raw / 26,846 B gzip`
- shell: `22,181 B raw`（上限 `40,000 B raw`）
- shell + 100社asset: `101 / 101 byte-identical`
- Astro: `210 routes`
- Pagefind: `105 pages / 5,791 words`
- protected semantic diff: `0`
