# Company Evidence Triage Validation v0.1

- Status: `HARD STOP`
- Baseline main: `fbe3981f132654658ec9c2c54594a520acde8f18`
- Triage input digest: `sha256:af1d49f76ec34e81f6916f0389039b57f0a1c4e84a997c60695472372064ac41`
- Sample seed: `triage-validation-v01`
- Validation date: `2026-09-01`
- Production Evidence changed: **NO**
- Company Evidence v1 Coverage Close: **NO**

## Decision

The deterministic 81-record audit found 22 MATERIAL mismatches (27.2%) and no CRITICAL mismatch. The MATERIAL rate exceeds the user-defined 10% HARD STOP, so remediation, reclassification, Evidence enrichment, and v1 Coverage Close were not started.

This result does not mean that all 779 gaps are wrong. It means the present heuristics are not yet safe enough to support v1 closure without re-evaluating only the affected strata.

## Deterministic sample

Sampling used ascending `sha256(companyId + ':' + category + ':triage-validation-v01')` order within each required stratum, with record ID as a deterministic tie-break. The sample was fixed before source review.

| Stratum | Audited |
| --- | ---: |
| SUFFICIENT_PARTIAL | 24 |
| DEFERRED | 24 |
| NOT_APPLICABLE | 28 |
| NOT_DISCLOSED | 5 |
| **Total** | **81** |

## Result

| Result | Count |
| --- | ---: |
| Exact match | 59 |
| MINOR mismatch | 0 |
| MATERIAL mismatch | 22 |
| CRITICAL mismatch | 0 |

## MATERIAL findings

| # | Record | Original | Independent | Primary source review |
| ---: | --- | --- | --- | --- |
| 25 | `denso:manufacturing-facilities` | DEFERRED | ACTIONABLE | [DENSO Corporation — Integrated Report 2025 — Manufacturing Capital](https://www.denso.com/global/en/about-us/investors/annual-report/) |
| 26 | `omron:manufacturing-facilities` | DEFERRED | ACTIONABLE | [OMRON Corporation — Production Facilities](https://automation.omron.com/en/us/our-value/production-facilities/) |
| 27 | `johnson-controls:manufacturing-facilities` | DEFERRED | ACTIONABLE | [U.S. SEC / Johnson Controls International plc — Johnson Controls Form 10-K 2025](https://www.sec.gov/Archives/edgar/data/833444/000083344425000097/jci-20250930.htm) |
| 28 | `sumitomo-electric:manufacturing-facilities` | DEFERRED | ACTIONABLE | [Sumitomo Electric Industries, Ltd. — Integrated Report 2025](https://sumitomoelectric.com/sites/default/files/2025-11/download_documents/integratedreport2025e.pdf) |
| 29 | `disco:manufacturing-facilities` | DEFERRED | ACTIONABLE | [DISCO Corporation — FY2024 Environmental Activities and Data](https://www.disco.co.jp/jp/csr/environment/doc/FY24other_than_climate_change.pdf) |
| 30 | `furukawa-electric:manufacturing-facilities` | DEFERRED | ACTIONABLE | [Furukawa Electric Co., Ltd. — Corporate Profile — Domestic Locations](https://www.furukawa.co.jp/en/product/catalogue/pdf/profile_e.pdf) |
| 31 | `siemens-energy:capacity-expansion` | DEFERRED | ACTIONABLE | [Siemens Energy AG — Siemens Energy invests EUR 220 million in Nuremberg transformer factory](https://www.siemens-energy.com/global/en/home/press-releases/siemens-energy-invests--220-million.html) |
| 35 | `globalwafers:capacity-expansion` | DEFERRED | ACTIONABLE | [GlobalWafers Co., Ltd. — GlobalWafers opens advanced 300 mm silicon wafer facility in Sherman](https://www.sas-globalwafers.com/en/gwc_news_en_20250516/) |
| 37 | `samsung-electronics:customer-end-market` | DEFERRED | ACTIONABLE | [Samsung Electronics Co., Ltd. — 2025 Business Report](https://www.samsung.com/global/ir/reports-disclosures/business-report/) |
| 38 | `sk-hynix:customer-end-market` | DEFERRED | ACTIONABLE | [SK hynix Inc. — SK hynix Announces FY25 Financial Results](https://news.skhynix.com/en/sk-hynix-announces-fy25-financial-results/) |
| 39 | `jcet:customer-end-market` | DEFERRED | ACTIONABLE | [JCET Group Co., Ltd. — JCET Applications](https://www.jcetglobal.com/en) |
| 40 | `monolithic-power:customer-end-market` | DEFERRED | ACTIONABLE | [Monolithic Power Systems, Inc. — 2024 Annual Report](https://media.monolithicpower.com/mps_cms_document/2/0/2024_annual_report_final.pdf) |
| 41 | `aptiv:customer-end-market` | DEFERRED | ACTIONABLE | [U.S. SEC / Aptiv PLC — Aptiv Form 10-K 2025](https://www.sec.gov/Archives/edgar/data/1521332/000152133226000009/aptv-20251231.htm) |
| 42 | `globalwafers:customer-end-market` | DEFERRED | ACTIONABLE | [GlobalWafers Co., Ltd. — Group Profile](https://www.sas-globalwafers.com/en/group-profile/) |
| 44 | `advantest:strategy` | DEFERRED | ACTIONABLE | [Advantest Corporation — Integrated Annual Report 2025](https://www.advantest.com/document/en/investors/ir-library/annual/E_02_IAR2025.pdf) |
| 45 | `bosch:strategy` | DEFERRED | ACTIONABLE | [Robert Bosch GmbH — Annual Report 2025](https://assets.bosch.com/media/global/bosch_group/our_figures/pdf/bosch-annual-report-2025.pdf) |
| 46 | `broadcom:strategy` | DEFERRED | ACTIONABLE | [U.S. SEC / Broadcom Inc. — Broadcom Form 10-K 2025](https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm) |
| 47 | `mitsubishi-electric:strategy` | DEFERRED | ACTIONABLE | [Mitsubishi Electric Corporation — Integrated Report 2025](https://www.mitsubishielectric.com/investors/library/integrated-report/pdf/2025/integrated-report2025-en.pdf) |
| 48 | `furukawa-electric:strategy` | DEFERRED | ACTIONABLE | [Furukawa Electric Co., Ltd. — Message from the President — Road to Vision 2030](https://www.furukawa.co.jp/en/ir/management/stockholder.html) |
| 73 | `broadcom:capacity-expansion` | NOT_APPLICABLE | DEFERRED | [U.S. SEC / Broadcom Inc. — Broadcom Form 10-K 2025](https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm) |
| 75 | `broadcom:manufacturing-facilities` | NOT_APPLICABLE | ACTIONABLE | [U.S. SEC / Broadcom Inc. — Broadcom Form 10-K 2025](https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm) |
| 81 | `fujikura:risks` | NOT_DISCLOSED | ACTIONABLE | [Fujikura Ltd. — Risk Management](https://www.fujikura.co.jp/en/company/governance/risk-management/) |

## Systemic patterns

1. The DEFERRED fallback missed bounded, high-leverage official material in 19 of 24 sampled records: manufacturing facilities 6/6, capacity expansion 2/6, customer/end-market 6/6, and strategy 5/6.
2. The NOT_APPLICABLE asset-light rule treated Broadcom as fully fabless even though its 2025 Form 10-K describes internal proprietary wafer fabrication. Both facility and capacity applicability judgments require correction.
3. Fujikura risks inherited a customer-nondisclosure rationale even though an official risk-management page is available.

## Required next scope

The HARD STOP should be resolved by re-evaluating only the affected strata and business-model pattern, not by unconditionally reopening all 779 records:

- DEFERRED `manufacturing-facilities`, `capacity-expansion`, `customer-end-market`, and `strategy`;
- NOT_APPLICABLE companies with a hybrid outsourced/internal manufacturing model;
- category compatibility for NOT_DISCLOSED rationales, beginning with `risks`.

After those strata are corrected, any new ACTIONABLE records require Runbook-governed enrichment and replacement sampling before a new close decision.

## All audited records

| # | Record | Stratum | Independent | Severity |
| ---: | --- | --- | --- | --- |
| 1 | `cadence:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 2 | `jcet:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 3 | `shinko-electric:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 4 | `amd:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 5 | `besi:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 6 | `kioxia:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 7 | `nvidia:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 8 | `globalfoundries:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 9 | `ge-vernova:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 10 | `hanmi-semiconductor:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 11 | `trane-technologies:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 12 | `asml:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 13 | `sk-hynix:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 14 | `kokusai-electric:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 15 | `johnson-controls:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 16 | `amkor:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 17 | `johnson-controls:customer-end-market` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 18 | `te-connectivity:customer-end-market` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 19 | `vertiv:strategy` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 20 | `amd:strategy` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 21 | `applied-materials:capacity-expansion` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 22 | `digital-realty:capacity-expansion` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 23 | `fujikura:company-overview` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 24 | `kioxia:manufacturing-facilities` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE |
| 25 | `denso:manufacturing-facilities` | DEFERRED | ACTIONABLE | MATERIAL |
| 26 | `omron:manufacturing-facilities` | DEFERRED | ACTIONABLE | MATERIAL |
| 27 | `johnson-controls:manufacturing-facilities` | DEFERRED | ACTIONABLE | MATERIAL |
| 28 | `sumitomo-electric:manufacturing-facilities` | DEFERRED | ACTIONABLE | MATERIAL |
| 29 | `disco:manufacturing-facilities` | DEFERRED | ACTIONABLE | MATERIAL |
| 30 | `furukawa-electric:manufacturing-facilities` | DEFERRED | ACTIONABLE | MATERIAL |
| 31 | `siemens-energy:capacity-expansion` | DEFERRED | ACTIONABLE | MATERIAL |
| 32 | `asmpt:capacity-expansion` | DEFERRED | DEFERRED | NONE |
| 33 | `omron:capacity-expansion` | DEFERRED | DEFERRED | NONE |
| 34 | `onsemi:capacity-expansion` | DEFERRED | DEFERRED | NONE |
| 35 | `globalwafers:capacity-expansion` | DEFERRED | ACTIONABLE | MATERIAL |
| 36 | `lasertec:capacity-expansion` | DEFERRED | DEFERRED | NONE |
| 37 | `samsung-electronics:customer-end-market` | DEFERRED | ACTIONABLE | MATERIAL |
| 38 | `sk-hynix:customer-end-market` | DEFERRED | ACTIONABLE | MATERIAL |
| 39 | `jcet:customer-end-market` | DEFERRED | ACTIONABLE | MATERIAL |
| 40 | `monolithic-power:customer-end-market` | DEFERRED | ACTIONABLE | MATERIAL |
| 41 | `aptiv:customer-end-market` | DEFERRED | ACTIONABLE | MATERIAL |
| 42 | `globalwafers:customer-end-market` | DEFERRED | ACTIONABLE | MATERIAL |
| 43 | `smc:strategy` | DEFERRED | DEFERRED | NONE |
| 44 | `advantest:strategy` | DEFERRED | ACTIONABLE | MATERIAL |
| 45 | `bosch:strategy` | DEFERRED | ACTIONABLE | MATERIAL |
| 46 | `broadcom:strategy` | DEFERRED | ACTIONABLE | MATERIAL |
| 47 | `mitsubishi-electric:strategy` | DEFERRED | ACTIONABLE | MATERIAL |
| 48 | `furukawa-electric:strategy` | DEFERRED | ACTIONABLE | MATERIAL |
| 49 | `arista:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 50 | `amd:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 51 | `cisco:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 52 | `credo:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 53 | `arista:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 54 | `marvell:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 55 | `nvidia:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 56 | `credo:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 57 | `cisco:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 58 | `amd:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 59 | `mediatek:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 60 | `cadence:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 61 | `synopsys:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 62 | `cadence:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 63 | `nvidia:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 64 | `arm:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 65 | `mobileye:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 66 | `mediatek:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 67 | `monolithic-power:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 68 | `marvell:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 69 | `qualcomm:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 70 | `mobileye:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 71 | `monolithic-power:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 72 | `synopsys:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 73 | `broadcom:capacity-expansion` | NOT_APPLICABLE | DEFERRED | MATERIAL |
| 74 | `qualcomm:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 75 | `broadcom:manufacturing-facilities` | NOT_APPLICABLE | ACTIONABLE | MATERIAL |
| 76 | `arm:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE |
| 77 | `fujikura:customer-end-market` | NOT_DISCLOSED | NOT_DISCLOSED | NONE |
| 78 | `tsmc:customer-end-market` | NOT_DISCLOSED | NOT_DISCLOSED | NONE |
| 79 | `nvidia:customer-end-market` | NOT_DISCLOSED | NOT_DISCLOSED | NONE |
| 80 | `applied-materials:customer-end-market` | NOT_DISCLOSED | NOT_DISCLOSED | NONE |
| 81 | `fujikura:risks` | NOT_DISCLOSED | ACTIONABLE | MATERIAL |
