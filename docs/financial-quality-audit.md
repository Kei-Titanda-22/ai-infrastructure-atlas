# 100社財務品質監査

データ基準日: **2026-11-23**

入力SHA-256: `6e191eb101d373932d4fb3a9fb1f1fab07a47f22ec09cdb1e03252f3406414d2`

生成: `python scripts/audit-financial-quality.py --write`

このレポートは財務値を書き換えず、正規化履歴の検証状態、欠損、FCF/Capex充足、定義差、比較上の特殊要因を機械的に可視化する。自由記述の `basis` を明示ルールで分類し、安全に分類できない値は `unclassified` のまま残す。JSON版には全期間の判定を収録する。

## 全体サマリー

| 項目 | 件数 |
| --- | ---: |
| 企業 | 100 |
| 期間 | 797 |
| 指標 | 3985 |
| cash-flow override | 12 |

## 指標の検証状態

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `verified` | 2748 | 一次資料と値・算式を検証済み |
| `source-linked` | 3 | Sourceに紐付くがverifiedではない値 |
| `needs-review` | 0 | 値はあるが再確認が必要 |
| `missing` | 1234 | 欠損理由ステータスを持つ値なし指標 |

## FCF / Capex充足

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `both-present` | 181 | FCF and Capex both have values |
| `fcf-missing-only` | 0 | FCF is missing while Capex has a value |
| `capex-missing-only` | 0 | Capex is missing while FCF has a value |
| `both-missing` | 616 | FCF and Capex are both missing |

## Capex定義

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `gross-productive-assets-cash-purchases` | 8 | Primary-source-reviewed gross cash purchases of productive assets under SEC XBRL PaymentsToAcquireProductiveAssets; taxonomy scope includes PP&E, software, and other intangible assets |
| `gross-ppe-cash-purchases` | 14 | Primary-source-reviewed gross cash purchases of PP&E, including SEC XBRL PaymentsToAcquirePropertyPlantAndEquipment and reviewed property/PP&E capital improvements reported under PaymentsForCapitalImprovements |
| `gross-ppe` | 49 | Gross/standard cash PP&E expenditure; no net, intangible, broader-asset, or real-estate qualifier detected |
| `ppe-plus-intangible` | 74 | PP&E plus intangible assets or capitalized software/development |
| `company-reported-cash-capex` | 2 | A primary-source-reviewed company cash-Capex outflow whose underlying PP&E versus PP&E-plus-intangible asset scope is not separately disclosed |
| `broader-non-current-assets` | 4 | A broader non-current/fixed/long-term asset cash-investment line |
| `net-capex` | 28 | Capex or PP&E cash spending disclosed on a net basis |
| `reit-or-real-estate-investment` | 13 | REIT or investment-property/real-estate investment definition |
| `not-collected` | 605 | No Capex value is collected and no REIT/real-estate definition supersedes the missing classification |
| `unclassified` | 0 | A value exists, but basis text does not safely map to another definition category |

## Operating Profit定義

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `direct-gaap-ifrs-operating-income` | 694 | Direct reported GAAP/IFRS operating income/profit/loss/earnings |
| `ebit` | 2 | Reported EBIT used as the operating-profit measure |
| `reconstructed-operating-income` | 26 | Atlas reconstructs operating income from reported operating line items |
| `source-linked` | 1 | Value is retained as source-linked rather than verified |
| `special-case` | 74 | Missing, period-derived, or otherwise not safely classified as a direct reported measure |

## Adjusted / Non-GAAP FCF判定

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `atlas-formula-aligned` | 8 | Adjusted/Non-GAAP label is present, but the disclosed formula is operating cash flow minus the same cash-Capex scope used by Atlas |
| `atlas-definition-difference` | 0 | Adjusted/Non-GAAP FCF includes a definition difference such as sale proceeds, net Capex, incentives, or an additional scope component |
| `unresolved` | 0 | Adjusted/Non-GAAP FCF is populated but basis text does not close the formula safely |
| `not-applicable` | 789 | The record is not a populated company-reported adjusted/Non-GAAP FCF |

## 特殊比較フラグ

| フラグ | 期間数 | 定義 |
| --- | ---: | --- |
| `goodwill-impairment` | 10 | Reported result includes or discusses goodwill impairment |
| `discontinued-operations` | 11 | Continuing/discontinued-operation boundaries affect comparison |
| `non-consolidated-subsidiary` | 2 | Non-consolidated subsidiary company-only disclosure |
| `reit` | 9 | REIT financial/capital-investment structure |
| `reconstructed-operating-income` | 26 | Operating income is reconstructed |
| `net-basis-capex` | 28 | Capex is disclosed on a net basis |
| `broad-capex` | 10 | Capex uses a broader non-current-asset definition |
| `ppe-only` | 64 | Cash Capex is limited to PP&E and excludes separately classified intangible-asset purchases |
| `continuing-operations-scope` | 2 | Operating cash flow, cash Capex, and Atlas FCF are primary-source-reviewed on a continuing-operations scope, with discontinued-operation cash flows presented separately |
| `asset-scope-unresolved` | 2 | The company-reported cash-Capex outflow is classified, but primary sources do not close whether the asset scope is PP&E only or PP&E plus intangible assets; Atlas gross cash Capex remains review-required |
| `rounded-source-value` | 2 | The stored JPY million value is a unit conversion from a company source reported in 0.1 billion JPY increments, not a precise JPY million cash-flow fact |
| `informal-comparative-source` | 2 | The value comes from an issuer-prepared informal comparative cash-flow overview because no formal quarterly cash-flow statement was prepared |
| `continuing-operations-cfo-reconstructed` | 1 | Continuing-operations operating cash flow is reconstructed from consolidated operating cash flow and separately disclosed discontinued-operation operating cash flow; this is reviewed scope provenance, not a scope mismatch |
| `government-incentive-excluded-from-fcf` | 2 | Government-incentive cash proceeds are disclosed separately from gross cash Capex and are excluded from the stored Atlas FCF, even when the company adds them to its Non-GAAP FCF |
| `government-incentive-netting-unresolved` | 1 | Company policy permits government incentives to be netted against PP&E additions, but the period-specific netting amount is not disclosed; the source-verified value is retained while Atlas gross cash Capex remains unresolved |
| `company-fcf-formula-includes-asset-sale-proceeds` | 2 | Company FCF formula adds PP&E sale proceeds; the reviewed period has zero proceeds, so the stored Atlas value is unaffected |
| `company-net-capex-fcf-not-used` | 2 | The company FCF formula uses net Capex after PP&E sale proceeds, while Atlas retains gross PP&E cash purchases and excludes sale proceeds from FCF |
| `adjusted-company-fcf-not-used` | 2 | The company reports an adjusted FCF based on adjusted operating cash flow, but Atlas retains GAAP operating cash flow minus gross cash Capex |
| `company-reported-fcf` | 16 | FCF value comes from a company-reported measure |
| `non-gaap-fcf-atlas-formula-aligned` | 8 | Adjusted/Non-GAAP wording is present, but the disclosed formula matches Atlas FCF scope |
| `fcf-atlas-definition-difference` | 0 | FCF uses a definition that differs from Atlas gross cash-Capex normalization |
| `adjusted-or-non-gaap-fcf-unresolved` | 0 | Adjusted/Non-GAAP FCF formula cannot be closed from current basis text |
| `cash-flow-inputs-missing` | 8 | A populated FCF record does not have complete cashFlowInputs |
| `fcf-capex-scope-mismatch` | 0 | The populated FCF subtracts a cash-investment component outside the stored Capex value's scope |
| `derived-single-quarter` | 9 | A single-quarter value is derived from cumulative periods |
| `unclassified-capex-definition` | 0 | A populated Capex value remains definition-unclassified |
| `special-operating-profit-definition` | 74 | Operating-profit definition is classified as a special case |

## 要確認キュー

- source-linked: `ajinomoto-fine-techno-fy2025` (revenue, operatingProfit, operatingMargin)
- needs-review: なし
- FCF/Capex片側欠損: なし
- Capex定義未分類: なし
- Non-GAAP表記・Atlas算式一致（値変更対象外）: `amd-q2-2025`, `amd-q1-2026`, `amd-q2-2026`, `asml-q2-2025`, `asml-q3-2025`, `asml-q4-2025`, `asml-q1-2026`, `asml-q2-2026`
- Atlas定義差あり（一次資料再確認）: なし
- adjusted / Non-GAAP算式未解決: なし
- cashFlowInputs未登録（FCF値あり）: `amd-q2-2025`, `amd-q1-2026`, `amd-q2-2026`, `asml-q2-2025`, `asml-q3-2025`, `asml-q4-2025`, `asml-q1-2026`, `asml-q2-2026`
- FCF/Capex scope mismatch: なし
- Atlas gross cash Capex未解決: `analog-devices-q3-fy2026` (company-discloses-additions-to-ppe-net, quarterly-government-incentive-netting-not-disclosed; evidence: filing-analog-devices-2026-q3-fy2026-10q, filing-analog-devices-2025-fy2025-10k), `shin-etsu-chemical-q1-fy2025` (formal-quarterly-cash-flow-statement-not-prepared, ppe-versus-ppe-plus-intangible-scope-not-disclosed; evidence: results-shin-etsu-2026-07-24-q1-fy2026), `shin-etsu-chemical-q1-fy2026` (formal-quarterly-cash-flow-statement-not-prepared, ppe-versus-ppe-plus-intangible-scope-not-disclosed; evidence: results-shin-etsu-2026-07-24-q1-fy2026)

## 会社別監査

V/S/R/M = verified / source-linked / needs-review / missing。CF列は FCF+Capex両方あり / FCFのみ欠損 / Capexのみ欠損 / 両方欠損。

| companyId | 企業 | 期間 | V | S | R | M | CF両方 | FCF欠 | Capex欠 | 両方欠 | 特殊フラグ |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| abb | ABB（エービービー） | 6 | 22 | 0 | 0 | 8 | 2 | 0 | 0 | 4 | discontinued-operations |
| advantest | アドバンテスト | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| air-liquide | Air Liquide（エア・リキード） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| ajinomoto-fine-techno | 味の素ファインテクノ | 2 | 3 | 3 | 0 | 4 | 0 | 0 | 0 | 2 | non-consolidated-subsidiary |
| amd | AMD（アドバンスト・マイクロ・デバイセズ） | 7 | 27 | 0 | 0 | 8 | 3 | 0 | 0 | 4 | reconstructed-operating-income, ppe-only, company-reported-fcf, non-gaap-fcf-atlas-formula-aligned, cash-flow-inputs-missing |
| amkor | Amkor Technology（アムコー・テクノロジー） | 7 | 21 | 0 | 0 | 14 | 0 | 0 | 0 | 7 | special-operating-profit-definition |
| amphenol | Amphenol（アンフェノール） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | ppe-only, special-operating-profit-definition |
| analog-devices | Analog Devices（アナログ・デバイセズ） | 6 | 22 | 0 | 0 | 8 | 2 | 0 | 0 | 4 | reconstructed-operating-income, net-basis-capex, ppe-only, government-incentive-netting-unresolved |
| applied-materials | Applied Materials（アプライド・マテリアルズ） | 8 | 28 | 0 | 0 | 12 | 2 | 0 | 0 | 6 | reconstructed-operating-income, ppe-only |
| aptiv | Aptiv（アプティブ） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | goodwill-impairment, broad-capex, special-operating-profit-definition |
| arista | Arista Networks（アリスタ・ネットワークス） | 7 | 21 | 0 | 0 | 14 | 0 | 0 | 0 | 7 | — |
| arm | Arm（アーム） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only |
| ase-technology | ASE Technology（ASEテクノロジー） | 7 | 27 | 0 | 0 | 8 | 3 | 0 | 0 | 4 | net-basis-capex, special-operating-profit-definition |
| asm-international | ASM International（ASMインターナショナル） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| asml | ASML（エーエスエムエル） | 7 | 31 | 0 | 0 | 4 | 5 | 0 | 0 | 2 | company-reported-fcf, non-gaap-fcf-atlas-formula-aligned, cash-flow-inputs-missing |
| asmpt | ASMPT（エーエスエムピーティー） | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | discontinued-operations |
| besi | Besi（BEセミコンダクター・インダストリーズ） | 8 | 28 | 0 | 0 | 12 | 2 | 0 | 0 | 6 | — |
| bosch | Bosch（ボッシュ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | broad-capex |
| broadcom | Broadcom（ブロードコム） | 6 | 24 | 0 | 0 | 6 | 3 | 0 | 0 | 3 | ppe-only |
| cadence | Cadence（ケイデンス） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only |
| canon | キヤノン | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | special-operating-profit-definition |
| carrier | Carrier（キャリア） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | discontinued-operations |
| ciena | Ciena（シエナ） | 6 | 18 | 0 | 0 | 12 | 0 | 0 | 0 | 6 | — |
| cisco | Cisco（シスコ） | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | special-operating-profit-definition |
| coherent | Coherent（コヒレント） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only |
| corning | Corning（コーニング） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only, adjusted-company-fcf-not-used |
| credo | Credo（クレド） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only |
| denso | デンソー | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | special-operating-profit-definition |
| digital-realty | Digital Realty（デジタル・リアルティ） | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | — |
| disco | ディスコ | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| eaton | Eaton（イートン） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | reconstructed-operating-income, ppe-only, special-operating-profit-definition |
| entegris | Entegris（インテグリス） | 7 | 29 | 0 | 0 | 6 | 4 | 0 | 0 | 3 | ppe-only |
| equinix | Equinix（エクイニクス） | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | reit |
| fanuc | ファナック | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only, special-operating-profit-definition |
| fujikura | フジクラ | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | special-operating-profit-definition |
| furukawa-electric | 古河電気工業 | 10 | 30 | 0 | 0 | 20 | 0 | 0 | 0 | 10 | reconstructed-operating-income, special-operating-profit-definition |
| ge-vernova | GE Vernova（GEベルノバ） | 7 | 21 | 0 | 0 | 14 | 0 | 0 | 0 | 7 | special-operating-profit-definition |
| globalfoundries | GlobalFoundries（グローバルファウンドリーズ） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | — |
| globalwafers | GlobalWafers（グローバルウェーハズ） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | ppe-only |
| hanmi-semiconductor | HANMI Semiconductor（ハンミ・セミコンダクター） | 8 | 28 | 0 | 0 | 12 | 2 | 0 | 0 | 6 | special-operating-profit-definition |
| hexagon | Hexagon（ヘキサゴン） | 10 | 34 | 0 | 0 | 16 | 2 | 0 | 0 | 8 | net-basis-capex |
| ibiden | イビデン | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | ppe-only |
| infineon | Infineon（インフィニオン） | 10 | 34 | 0 | 0 | 16 | 2 | 0 | 0 | 8 | — |
| intel | Intel（インテル） | 7 | 21 | 0 | 0 | 14 | 0 | 0 | 0 | 7 | reconstructed-operating-income |
| jcet | JCET（長電科技） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | broad-capex |
| johnson-controls | Johnson Controls（ジョンソンコントロールズ） | 10 | 34 | 0 | 0 | 16 | 2 | 0 | 0 | 8 | discontinued-operations, reconstructed-operating-income, broad-capex, continuing-operations-scope, special-operating-profit-definition |
| keyence | キーエンス | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | special-operating-profit-definition |
| kinsus | Kinsus（景碩科技） | 8 | 24 | 0 | 0 | 16 | 0 | 0 | 0 | 8 | — |
| kioxia | キオクシアホールディングス | 8 | 38 | 0 | 0 | 2 | 7 | 0 | 0 | 1 | derived-single-quarter, special-operating-profit-definition |
| kla | KLA（ケーエルエー） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | reconstructed-operating-income, ppe-only |
| kokusai-electric | KOKUSAI ELECTRIC（国際電気） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | special-operating-profit-definition |
| lam-research | Lam Research（ラムリサーチ） | 9 | 37 | 0 | 0 | 8 | 5 | 0 | 0 | 4 | — |
| lasertec | レーザーテック | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| legrand | Legrand（ルグラン） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| linde | Linde（リンデ） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only |
| lumentum | Lumentum（ルメンタム） | 9 | 29 | 0 | 0 | 16 | 2 | 0 | 0 | 7 | ppe-only, special-operating-profit-definition |
| marvell | Marvell Technology（マーベル・テクノロジー） | 6 | 18 | 0 | 0 | 12 | 0 | 0 | 0 | 6 | — |
| mediatek | MediaTek（メディアテック） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| micron | Micron Technology（マイクロン・テクノロジー） | 7 | 23 | 0 | 0 | 12 | 1 | 0 | 0 | 6 | reconstructed-operating-income, ppe-only |
| mitsubishi-electric | 三菱電機 | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | special-operating-profit-definition |
| mobileye | Mobileye（モービルアイ） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | goodwill-impairment, ppe-only |
| monolithic-power | Monolithic Power Systems（モノリシック・パワー・システムズ） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| nan-ya-pcb | Nan Ya PCB（南亜電路板） | 8 | 24 | 0 | 0 | 16 | 0 | 0 | 0 | 8 | — |
| nikon | ニコン | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| nvent | nVent（エヌベント） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | ppe-only, company-fcf-formula-includes-asset-sale-proceeds |
| nvidia | NVIDIA（エヌビディア） | 10 | 36 | 0 | 0 | 14 | 3 | 0 | 0 | 7 | reconstructed-operating-income |
| nxp | NXP Semiconductors（NXPセミコンダクターズ） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | net-basis-capex |
| omron | オムロン | 4 | 12 | 0 | 0 | 8 | 0 | 0 | 0 | 4 | discontinued-operations |
| onsemi | onsemi（オンセミ） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only |
| qualcomm | Qualcomm（クアルコム） | 10 | 34 | 0 | 0 | 16 | 2 | 0 | 0 | 8 | reconstructed-operating-income, broad-capex, continuing-operations-cfo-reconstructed |
| renesas | ルネサス エレクトロニクス | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| resonac-holdings | レゾナック・ホールディングス | 6 | 18 | 0 | 0 | 12 | 0 | 0 | 0 | 6 | — |
| rohm | ローム | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | ppe-only |
| samsung-electronics | Samsung Electronics（サムスン電子） | 7 | 21 | 0 | 0 | 14 | 0 | 0 | 0 | 7 | — |
| sandisk | Sandisk（サンディスク） | 9 | 35 | 0 | 0 | 10 | 4 | 0 | 0 | 5 | goodwill-impairment, net-basis-capex, company-reported-fcf |
| schneider-electric | Schneider Electric（シュナイダーエレクトリック） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| screen-holdings | SCREENホールディングス | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| seagate | Seagate（シーゲイト） | 10 | 38 | 0 | 0 | 12 | 4 | 0 | 0 | 6 | ppe-only, company-reported-fcf |
| shin-etsu-chemical | 信越化学工業 | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | asset-scope-unresolved, rounded-source-value, informal-comparative-source |
| shinko-electric | 新光電気工業 | 8 | 28 | 0 | 0 | 12 | 2 | 0 | 0 | 6 | special-operating-profit-definition |
| siemens-energy | Siemens Energy（シーメンス・エナジー） | 10 | 34 | 0 | 0 | 16 | 2 | 0 | 0 | 8 | — |
| sk-hynix | SK hynix（SKハイニックス） | 7 | 21 | 0 | 0 | 14 | 0 | 0 | 0 | 7 | special-operating-profit-definition |
| smc | SMC | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | — |
| smic | SMIC（中芯国際） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | derived-single-quarter |
| stmicroelectronics | STMicroelectronics（STマイクロエレクトロニクス） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | net-basis-capex |
| sumco | SUMCO | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | — |
| sumitomo-electric | 住友電気工業 | 9 | 27 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | — |
| synopsys | Synopsys（シノプシス） | 8 | 28 | 0 | 0 | 12 | 2 | 0 | 0 | 6 | net-basis-capex |
| te-connectivity | TE Connectivity（TEコネクティビティ） | 10 | 34 | 0 | 0 | 16 | 2 | 0 | 0 | 8 | ppe-only, company-net-capex-fcf-not-used |
| tesla | Tesla（テスラ） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | net-basis-capex |
| texas-instruments | Texas Instruments（テキサス・インスツルメンツ） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | reconstructed-operating-income, ppe-only, government-incentive-excluded-from-fcf |
| tokyo-electron | 東京エレクトロン | 9 | 41 | 0 | 0 | 4 | 7 | 0 | 0 | 2 | reconstructed-operating-income, ppe-only, derived-single-quarter, special-operating-profit-definition |
| tower-semiconductor | Tower Semiconductor（タワーセミコンダクター） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | net-basis-capex |
| trane-technologies | Trane Technologies（トレイン・テクノロジーズ） | 7 | 21 | 0 | 0 | 14 | 0 | 0 | 0 | 7 | — |
| tsmc | TSMC（台湾積体電路製造） | 7 | 27 | 0 | 0 | 8 | 3 | 0 | 0 | 4 | derived-single-quarter |
| umc | UMC（聯華電子） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | ppe-only |
| unimicron | Unimicron（欣興電子） | 9 | 31 | 0 | 0 | 14 | 2 | 0 | 0 | 7 | — |
| vertiv | Vertiv（ヴァーティブ） | 7 | 25 | 0 | 0 | 10 | 2 | 0 | 0 | 5 | — |
| western-digital | Western Digital（ウエスタンデジタル） | 9 | 37 | 0 | 0 | 8 | 5 | 0 | 0 | 4 | net-basis-capex, special-operating-profit-definition |
| yaskawa | 安川電機 | 8 | 28 | 0 | 0 | 12 | 2 | 0 | 0 | 6 | — |

## 運用ルール

- 財務履歴、cash-flow override、会社メタデータが変わったら `--write` でJSON/Markdownを再生成する。
- CIは `--check` で入力SHA-256と全分類を再計算し、コミット済みレポートとの差分を検出する。
- 分類は比較上の監査ラベルであり、各指標の一次根拠は引き続きレコードの `sourceId` と `basis` を正とする。
- adjusted / Non-GAAPのAtlas定義判定、`cashFlowInputs` 登録状態、FCF/Capex scope一致は独立軸として扱う。
- Capex定義の分類済み状態とAtlas gross cash Capexとしての解決状態は独立軸として扱う。`net-capex`へ分類できても、期間固有のnetting額が閉じない場合は要確認キューに残す。
- `unclassified`、`source-linked`、`needs-review` は隠さず、次の一次資料監査候補として扱う。
