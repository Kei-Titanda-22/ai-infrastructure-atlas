# Company Evidence Enrichment Batch 01

- Date: `2026-09-01`
- Baseline main: `f7cbae500b2867f05a9690373e9fc2df9dcad970`
- Scope: Arm / ASML only
- Frozen Schema: `0.2` (unchanged)
- Source Policy approval: **NO**
- Batch 02 executed: **NO**

## 1. Result

ArmとASMLについて、legacy本文を自動昇格せず、一次資料を人手でCategory・Claim type・priority・Locatorへ対応付けた。すべてのClaimは`source-linked`であり、pending Source Policyを`reviewed`へ変更していない。

| Company | Before coverage | After coverage | Claims | Bindings | Valid locators | Maturity |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Arm | complete 0 / partial 5 / not-started 6 | complete 3 / partial 6 / not-started 2 | 9 | 9 | 9 | L1 → L4 |
| ASML | complete 0 / partial 5 / not-started 6 | complete 4 / partial 7 / not-started 0 | 11 | 11 | 11 | L1 → L4 |

## 2. Arm

### Claim構成

| Category | Type | Priority | 判定 |
| --- | --- | --- | --- |
| company-overview | fact | P1 | complete |
| ai-infrastructure-role | atlas-analysis | P1 | partial |
| products | fact | P1 | complete |
| technology | company-positioning | P2 | partial |
| value-chain-position | atlas-analysis | P1 | complete |
| customer-end-market | fact | P2 | partial |
| competitive-positioning | company-positioning | P1 | partial |
| strategy | company-positioning | P2 | partial |
| risks | fact | P2 | partial |

P1 / P2 / P3は`5 / 4 / 0`。P1は「何の会社か」「AIインフラのどこにいるか」「主力製品・技術」「なぜ競争上重要か」を最低限回答する。製造会社とは扱わず、IPライセンス、CSS、Neoverse、license feeとper-unit royaltyを中心に整理した。

`manufacturing-facilities`と`capacity-expansion`は`not-started / not-applicable`を維持する。Arm AGI CPUの生産をArm保有fabや自社wafer capacityへ読み替えていない。

### 一次資料とLocator

- Reused: `sec-arm-fy2026-20f` — Arm Holdings plc Form 20-F for year ended March 31, 2026
- Added: `arm-neoverse-cloud-datacenter` — Arm Neoverse for cloud and AI data centers
- Locator: Form 20-FのItem / section / heading / quotedLabel、および公式製品ページのheading / quotedLabel

### Legacy移行判定

- `summary`: 20-FのCorporate Informationからfactへ再構成
- `aiRole`: Neoverse一次資料を入力にatlas-analysisへ分類
- `products`: 20-FのOur Product Offeringsからfactへ再構成
- `strengths`: legacy表現を直接移行せず、会社自身のCompetitive Strengthsだけをcompany-positioningへ分類
- `risks`: 20-F Risk Factorsからfactへ再構成

### 残るgap

AI infrastructure role、technology、customer/end market、competitive positioning、strategy、risksは一部範囲のみのためpartial。製造拠点・製造capacityは適用対象外であり、推論で補完しない。

## 3. ASML

### Claim構成

| Category | Type | Priority | 判定 |
| --- | --- | --- | --- |
| company-overview | fact | P1 | complete |
| ai-infrastructure-role | atlas-analysis | P1 | partial |
| products | fact | P1 | complete |
| technology | fact | P2 | partial |
| value-chain-position | fact | P1 | complete |
| manufacturing-facilities | fact | P2 | complete |
| capacity-expansion | fact | P3 | partial |
| customer-end-market | fact | P2 | partial |
| competitive-positioning | company-positioning | P1 | partial |
| strategy | company-positioning | P2 | partial |
| risks | fact | P2 | partial |

P1 / P2 / P3は`5 / 5 / 1`。EUV、DUV、High-NA EUV、holistic lithography、installed base service、製造・supplier networkを一次資料の範囲で整理した。

AI需要とASMLの関係は、会社開示の「AI server向けLogic / HBM需要」とリソグラフィ工程を入力にした`atlas-analysis`として表示し、「AI需要の恩恵」をSource factへ混在させていない。EUV唯一メーカーという記述はASML自身の表現なので`company-positioning`とした。

### 一次資料とLocator

- Added: `asml-annual-report-2025-strategic` — ASML Annual Report 2025, Strategic Report
- Reused for financial display only: `earnings-asml-2026-07-15-q2-2026`（Company Evidence Claimには流用しない）
- Locator: Annual Reportのpage / section / heading / quotedLabel

### Legacy移行判定

- `summary`: annual reportのholistic lithography / products and servicesからfactへ再構成
- `aiRole`: marketplaceとchipmaking processを入力にatlas-analysisへ分類
- `products`: annual reportの製品構成からfactへ再構成
- `strengths`: legacy表現を直接移行せず、EUV唯一メーカーという会社記述だけをcompany-positioningへ分類
- `risks`: annual reportのOverview of risk factorsからfactへ再構成

### 残るgap

AI infrastructure role、technology、capacity expansion、customer/end market、competitive positioning、strategy、risksは対象資料の一部を収録した段階なのでpartial。顧客名、装置別capacity、将来需要を推定していない。

## 4. Global audit delta

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| complete | 21 | 28 | +7 |
| partial | 501 | 504 | +3 |
| not-started | 578 | 568 | -10 |
| Claim + Evidence pairs | 38 | 58 | +20 |
| Structured Locator pairs | 38 | 58 | +20 |
| L1 companies | 92 | 90 | -2 |
| L4 companies | 5 | 7 | +2 |
| unique Shared Sources | 254 | 256 | +2 |

Missing Statusは`not-collected 573 → 561`、`primary-source-unchecked 4 → 4`、`not-disclosed 5 → 5`、`not-applicable 1 → 3`。Armの製造関連2 Categoryだけを、会社の事業モデルと今回のCategory定義に基づいて`not-applicable`とした。

## 5. Architecture and issues

### Schema

Frozen Schema v0.2自体に変更は不要だった。一方、production page、Freeze validator、Coverage AuditがPilot単一JSONを直接参照しており、100社展開時に会社追加ごとのhardcodeを招く接続上の問題があった。`company-evidence-manifest.json`と汎用resolverを追加し、同じv0.2 envelopeのshardを列挙・統合する構造へ変更した。Pilot snapshot validatorとPilotデータは維持した。

### UX

Evidence-rich pageの有効化がPilot 5社のID集合に固定されていたため、Schema準拠データを追加しても同じEvidence UXを利用できなかった。判定をmanifest由来のCoverage company IDへ変更した。情報階層、Evidence 2-click contract、drawer、bibliography、CSS、visible wordingは変更していない。

## 6. Protected scope

- Other 98 company JSON / Company Evidence: diff 0
- Pilot 5 Company Evidence snapshot: diff 0
- Financial data / financial definitions / financial Sources: diff 0
- Facilities / relationships / competitors: diff 0
- Frozen Schema / enums / priority meanings / verification meanings: diff 0
- Source Policies: new 2 records only、both `pending` / `automatedRetrieval: unknown` / `manual-reference-only-until-reviewed`

## 7. Gate

Batch 01は全validator、financial quality audit、secret scan、Astro、Pagefind、semantic protection、desktop/mobile browser QA、main Actions、公開Pagesの確認後に完了する。Batch 02（ASM International / KLA）はこのBatchで実行しない。

## 8. Local verification

- Full data validators: PASS
- Company Evidence Pilot / Freeze validators: PASS (`58 Claims / 58 Bindings / 58 valid Locators`)
- Coverage Audit freshness: PASS
- Financial quality audit: PASS (`100 companies / 247 periods / 1,235 metrics`、既存結果不変)
- Secret scan: PASS
- Astro build: PASS (`109 pages`)
- Pagefind: PASS (`105 pages indexed`)
- Pilot 5 generated HTML SHA-256: before / after全件一致
- Protected source diff: Pilot 5 Evidence、other 98 company JSON、financial、facility、relationship、frozen Schemaすべて0

| Company | Viewport | Document overflow | Evidence markers | Min target | KPI horizontal overflow | Sources |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Arm | 1280px | 0 | 9 | 44px | n/a（収録指標なし） | 2 |
| Arm | 1024px | 0 | 9 | 44px | n/a（収録指標なし） | 2 |
| Arm | 360px | 0 | 9 | 44px | n/a（収録指標なし） | 2 |
| ASML | 1280px | 0 | 11 | 44px | 0 | 2 |
| ASML | 1024px | 0 | 11 | 44px | 0 | 2 |
| ASML | 360px | 0 | 11 | 44px | 0 | 2 |

両社でEvidence drawer open、Primary Source action、Escape close、origin markerへのfocus returnを確認した。Armのmobile Data Quality disclosureでは`manufacturing-facilities`と`capacity-expansion`が「対象外」と理由付きで表示される。browser console warning / errorは0。
