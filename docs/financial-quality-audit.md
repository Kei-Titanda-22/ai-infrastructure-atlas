# 100社財務品質監査

データ基準日: **2026-08-30**

入力SHA-256: `8a0f261311ea18ba5dab940b90a3712bac93f3a5e6f39af76547d643d179ae39`

生成: `python scripts/audit-financial-quality.py --write`

このレポートは財務値を書き換えず、正規化履歴の検証状態、欠損、FCF/Capex充足、定義差、比較上の特殊要因を機械的に可視化する。自由記述の `basis` を明示ルールで分類し、安全に分類できない値は `unclassified` のまま残す。JSON版には全期間の判定を収録する。

## 全体サマリー

| 項目 | 件数 |
| --- | ---: |
| 企業 | 100 |
| 期間 | 247 |
| 指標 | 1235 |
| cash-flow override | 12 |

## 指標の検証状態

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `verified` | 1098 | 一次資料と値・算式を検証済み |
| `source-linked` | 3 | Sourceに紐付くがverifiedではない値 |
| `needs-review` | 0 | 値はあるが再確認が必要 |
| `missing` | 134 | 欠損理由ステータスを持つ値なし指標 |

## FCF / Capex充足

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `both-present` | 181 | FCF and Capex both have values |
| `fcf-missing-only` | 0 | FCF is missing while Capex has a value |
| `capex-missing-only` | 0 | Capex is missing while FCF has a value |
| `both-missing` | 66 | FCF and Capex are both missing |

## Capex定義

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `gross-productive-assets-cash-purchases` | 2 | Primary-source-reviewed gross cash purchases of productive assets under SEC XBRL PaymentsToAcquireProductiveAssets; taxonomy scope includes PP&E, software, and other intangible assets |
| `gross-ppe-cash-purchases` | 6 | Primary-source-reviewed gross cash purchases of PP&E, including SEC XBRL PaymentsToAcquirePropertyPlantAndEquipment |
| `gross-ppe` | 49 | Gross/standard cash PP&E expenditure; no net, intangible, broader-asset, or real-estate qualifier detected |
| `ppe-plus-intangible` | 74 | PP&E plus intangible assets or capitalized software/development |
| `broader-non-current-assets` | 4 | A broader non-current/fixed/long-term asset cash-investment line |
| `net-capex` | 28 | Capex or PP&E cash spending disclosed on a net basis |
| `reit-or-real-estate-investment` | 6 | REIT or investment-property/real-estate investment definition |
| `not-collected` | 62 | No Capex value is collected and no REIT/real-estate definition supersedes the missing classification |
| `unclassified` | 16 | A value exists, but basis text does not safely map to another definition category |

## Operating Profit定義

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `direct-gaap-ifrs-operating-income` | 227 | Direct reported GAAP/IFRS operating income/profit/loss/earnings |
| `ebit` | 2 | Reported EBIT used as the operating-profit measure |
| `reconstructed-operating-income` | 7 | Atlas reconstructs operating income from reported operating line items |
| `source-linked` | 1 | Value is retained as source-linked rather than verified |
| `special-case` | 10 | Missing, period-derived, or otherwise not safely classified as a direct reported measure |

## Adjusted / Non-GAAP FCF判定

| 分類 | 件数 | 定義 |
| --- | ---: | --- |
| `atlas-formula-aligned` | 8 | Adjusted/Non-GAAP label is present, but the disclosed formula is operating cash flow minus the same cash-Capex scope used by Atlas |
| `atlas-definition-difference` | 0 | Adjusted/Non-GAAP FCF includes a definition difference such as sale proceeds, net Capex, incentives, or an additional scope component |
| `unresolved` | 0 | Adjusted/Non-GAAP FCF is populated but basis text does not close the formula safely |
| `not-applicable` | 239 | The record is not a populated company-reported adjusted/Non-GAAP FCF |

## 特殊比較フラグ

| フラグ | 期間数 | 定義 |
| --- | ---: | --- |
| `goodwill-impairment` | 2 | Reported result includes or discusses goodwill impairment |
| `discontinued-operations` | 8 | Continuing/discontinued-operation boundaries affect comparison |
| `non-consolidated-subsidiary` | 2 | Non-consolidated subsidiary company-only disclosure |
| `reit` | 2 | REIT financial/capital-investment structure |
| `reconstructed-operating-income` | 7 | Operating income is reconstructed |
| `net-basis-capex` | 28 | Capex is disclosed on a net basis |
| `broad-capex` | 4 | Capex uses a broader non-current-asset definition |
| `ppe-only` | 56 | Cash Capex is limited to PP&E and excludes separately classified intangible-asset purchases |
| `government-incentive-netting-unresolved` | 1 | Company policy permits government incentives to be netted against PP&E additions, but the period-specific netting amount is not disclosed; the source-verified value is retained while Atlas gross cash Capex remains unresolved |
| `company-fcf-formula-includes-asset-sale-proceeds` | 2 | Company FCF formula adds PP&E sale proceeds; the reviewed period has zero proceeds, so the stored Atlas value is unaffected |
| `company-reported-fcf` | 16 | FCF value comes from a company-reported measure |
| `non-gaap-fcf-atlas-formula-aligned` | 8 | Adjusted/Non-GAAP wording is present, but the disclosed formula matches Atlas FCF scope |
| `fcf-atlas-definition-difference` | 0 | FCF uses a definition that differs from Atlas gross cash-Capex normalization |
| `adjusted-or-non-gaap-fcf-unresolved` | 0 | Adjusted/Non-GAAP FCF formula cannot be closed from current basis text |
| `cash-flow-inputs-missing` | 8 | A populated FCF record does not have complete cashFlowInputs |
| `fcf-capex-scope-mismatch` | 0 | The populated FCF subtracts a cash-investment component outside the stored Capex value's scope |
| `derived-single-quarter` | 8 | A single-quarter value is derived from cumulative periods |
| `unclassified-capex-definition` | 16 | A populated Capex value remains definition-unclassified |
| `special-operating-profit-definition` | 10 | Operating-profit definition is classified as a special case |

## 要確認キュー

- source-linked: `ajinomoto-fine-techno-fy2025` (revenue, operatingProfit, operatingMargin)
- needs-review: なし
- FCF/Capex片側欠損: なし
- Capex定義未分類: `aptiv-fy2024`, `aptiv-fy2025`, `corning-fy2024`, `corning-fy2025`, `johnson-controls-fy2024`, `johnson-controls-fy2025`, `linde-fy2024`, `linde-fy2025`, `qualcomm-fy2024`, `qualcomm-fy2025`, `shin-etsu-chemical-q1-fy2025`, `shin-etsu-chemical-q1-fy2026`, `te-connectivity-fy2024`, `te-connectivity-fy2025`, `texas-instruments-q1-2026`, `texas-instruments-q2-2026`
- Non-GAAP表記・Atlas算式一致（値変更対象外）: `amd-q2-2025`, `amd-q1-2026`, `amd-q2-2026`, `asml-q2-2025`, `asml-q3-2025`, `asml-q4-2025`, `asml-q1-2026`, `asml-q2-2026`
- Atlas定義差あり（一次資料再確認）: なし
- adjusted / Non-GAAP算式未解決: なし
- cashFlowInputs未登録（FCF値あり）: `amd-q2-2025`, `amd-q1-2026`, `amd-q2-2026`, `asml-q2-2025`, `asml-q3-2025`, `asml-q4-2025`, `asml-q1-2026`, `asml-q2-2026`
- FCF/Capex scope mismatch: なし
- Atlas gross cash Capex未解決: `analog-devices-q3-fy2026` (company-discloses-additions-to-ppe-net, quarterly-government-incentive-netting-not-disclosed; evidence: filing-analog-devices-2026-q3-fy2026-10q, filing-analog-devices-2025-fy2025-10k)

## 会社別監査

V/S/R/M = verified / source-linked / needs-review / missing。CF列は FCF+Capex両方あり / FCFのみ欠損 / Capexのみ欠損 / 両方欠損。

| companyId | 企業 | 期間 | V | S | R | M | CF両方 | FCF欠 | Capex欠 | 両方欠 | 特殊フラグ |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| abb | ABB（エービービー） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | discontinued-operations |
| advantest | アドバンテスト | 4 | 16 | 0 | 0 | 4 | 2 | 0 | 0 | 2 | — |
| air-liquide | Air Liquide（エア・リキード） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| ajinomoto-fine-techno | 味の素ファインテクノ | 2 | 3 | 3 | 0 | 4 | 0 | 0 | 0 | 2 | non-consolidated-subsidiary |
| amd | AMD（アドバンスト・マイクロ・デバイセズ） | 3 | 15 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | ppe-only, company-reported-fcf, non-gaap-fcf-atlas-formula-aligned, cash-flow-inputs-missing |
| amkor | Amkor Technology（アムコー・テクノロジー） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| amphenol | Amphenol（アンフェノール） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| analog-devices | Analog Devices（アナログ・デバイセズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex, ppe-only, government-incentive-netting-unresolved |
| applied-materials | Applied Materials（アプライド・マテリアルズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| aptiv | Aptiv（アプティブ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | goodwill-impairment, unclassified-capex-definition |
| arista | Arista Networks（アリスタ・ネットワークス） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| arm | Arm（アーム） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| ase-technology | ASE Technology（ASEテクノロジー） | 3 | 15 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | net-basis-capex |
| asm-international | ASM International（ASMインターナショナル） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| asml | ASML（エーエスエムエル） | 5 | 25 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | company-reported-fcf, non-gaap-fcf-atlas-formula-aligned, cash-flow-inputs-missing |
| asmpt | ASMPT（エーエスエムピーティー） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | discontinued-operations |
| besi | Besi（BEセミコンダクター・インダストリーズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| bosch | Bosch（ボッシュ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | broad-capex |
| broadcom | Broadcom（ブロードコム） | 3 | 15 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | ppe-only |
| cadence | Cadence（ケイデンス） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| canon | キヤノン | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| carrier | Carrier（キャリア） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | discontinued-operations |
| ciena | Ciena（シエナ） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| cisco | Cisco（シスコ） | 4 | 12 | 0 | 0 | 8 | 0 | 0 | 0 | 4 | — |
| coherent | Coherent（コヒレント） | 4 | 16 | 0 | 0 | 4 | 2 | 0 | 0 | 2 | ppe-only |
| corning | Corning（コーニング） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | unclassified-capex-definition |
| credo | Credo（クレド） | 4 | 16 | 0 | 0 | 4 | 2 | 0 | 0 | 2 | ppe-only |
| denso | デンソー | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| digital-realty | Digital Realty（デジタル・リアルティ） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| disco | ディスコ | 4 | 16 | 0 | 0 | 4 | 2 | 0 | 0 | 2 | — |
| eaton | Eaton（イートン） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | reconstructed-operating-income, ppe-only |
| entegris | Entegris（インテグリス） | 4 | 20 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | ppe-only |
| equinix | Equinix（エクイニクス） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | reit |
| fanuc | ファナック | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| fujikura | フジクラ | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| furukawa-electric | 古河電気工業 | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| ge-vernova | GE Vernova（GEベルノバ） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| globalfoundries | GlobalFoundries（グローバルファウンドリーズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| globalwafers | GlobalWafers（グローバルウェーハズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| hanmi-semiconductor | HANMI Semiconductor（ハンミ・セミコンダクター） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| hexagon | Hexagon（ヘキサゴン） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| ibiden | イビデン | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| infineon | Infineon（インフィニオン） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| intel | Intel（インテル） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| jcet | JCET（長電科技） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | broad-capex |
| johnson-controls | Johnson Controls（ジョンソンコントロールズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | reconstructed-operating-income, unclassified-capex-definition |
| keyence | キーエンス | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| kinsus | Kinsus（景碩科技） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| kioxia | キオクシアホールディングス | 7 | 35 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | derived-single-quarter, special-operating-profit-definition |
| kla | KLA（ケーエルエー） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | reconstructed-operating-income, ppe-only |
| kokusai-electric | KOKUSAI ELECTRIC（国際電気） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| lam-research | Lam Research（ラムリサーチ） | 5 | 25 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | — |
| lasertec | レーザーテック | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| legrand | Legrand（ルグラン） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| linde | Linde（リンデ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | unclassified-capex-definition |
| lumentum | Lumentum（ルメンタム） | 4 | 14 | 0 | 0 | 6 | 2 | 0 | 0 | 2 | ppe-only, special-operating-profit-definition |
| marvell | Marvell Technology（マーベル・テクノロジー） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| mediatek | MediaTek（メディアテック） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| micron | Micron Technology（マイクロン・テクノロジー） | 3 | 11 | 0 | 0 | 4 | 1 | 0 | 0 | 2 | ppe-only |
| mitsubishi-electric | 三菱電機 | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| mobileye | Mobileye（モービルアイ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | goodwill-impairment, ppe-only |
| monolithic-power | Monolithic Power Systems（モノリシック・パワー・システムズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| nan-ya-pcb | Nan Ya PCB（南亜電路板） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| nikon | ニコン | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| nvent | nVent（エヌベント） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only, company-fcf-formula-includes-asset-sale-proceeds |
| nvidia | NVIDIA（エヌビディア） | 6 | 24 | 0 | 0 | 6 | 3 | 0 | 0 | 3 | — |
| nxp | NXP Semiconductors（NXPセミコンダクターズ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| omron | オムロン | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | discontinued-operations |
| onsemi | onsemi（オンセミ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| qualcomm | Qualcomm（クアルコム） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | reconstructed-operating-income, unclassified-capex-definition |
| renesas | ルネサス エレクトロニクス | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| resonac-holdings | レゾナック・ホールディングス | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| rohm | ローム | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| samsung-electronics | Samsung Electronics（サムスン電子） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| sandisk | Sandisk（サンディスク） | 4 | 20 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | net-basis-capex, company-reported-fcf |
| schneider-electric | Schneider Electric（シュナイダーエレクトリック） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| screen-holdings | SCREENホールディングス | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| seagate | Seagate（シーゲイト） | 4 | 20 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | ppe-only, company-reported-fcf |
| shin-etsu-chemical | 信越化学工業 | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | unclassified-capex-definition |
| shinko-electric | 新光電気工業 | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| siemens-energy | Siemens Energy（シーメンス・エナジー） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| sk-hynix | SK hynix（SKハイニックス） | 3 | 9 | 0 | 0 | 6 | 0 | 0 | 0 | 3 | special-operating-profit-definition |
| smc | SMC | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| smic | SMIC（中芯国際） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| stmicroelectronics | STMicroelectronics（STマイクロエレクトロニクス） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| sumco | SUMCO | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| sumitomo-electric | 住友電気工業 | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| synopsys | Synopsys（シノプシス） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| te-connectivity | TE Connectivity（TEコネクティビティ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | unclassified-capex-definition |
| tesla | Tesla（テスラ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| texas-instruments | Texas Instruments（テキサス・インスツルメンツ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | unclassified-capex-definition |
| tokyo-electron | 東京エレクトロン | 7 | 35 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | ppe-only, derived-single-quarter, special-operating-profit-definition |
| tower-semiconductor | Tower Semiconductor（タワーセミコンダクター） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | net-basis-capex |
| trane-technologies | Trane Technologies（トレイン・テクノロジーズ） | 2 | 6 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | — |
| tsmc | TSMC（台湾積体電路製造） | 3 | 15 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | derived-single-quarter |
| umc | UMC（聯華電子） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | ppe-only |
| unimicron | Unimicron（欣興電子） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| vertiv | Vertiv（ヴァーティブ） | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |
| western-digital | Western Digital（ウエスタンデジタル） | 5 | 25 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | net-basis-capex |
| yaskawa | 安川電機 | 2 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | — |

## 運用ルール

- 財務履歴、cash-flow override、会社メタデータが変わったら `--write` でJSON/Markdownを再生成する。
- CIは `--check` で入力SHA-256と全分類を再計算し、コミット済みレポートとの差分を検出する。
- 分類は比較上の監査ラベルであり、各指標の一次根拠は引き続きレコードの `sourceId` と `basis` を正とする。
- adjusted / Non-GAAPのAtlas定義判定、`cashFlowInputs` 登録状態、FCF/Capex scope一致は独立軸として扱う。
- Capex定義の分類済み状態とAtlas gross cash Capexとしての解決状態は独立軸として扱う。`net-capex`へ分類できても、期間固有のnetting額が閉じない場合は要確認キューに残す。
- `unclassified`、`source-linked`、`needs-review` は隠さず、次の一次資料監査候補として扱う。
