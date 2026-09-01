# Company Evidence Triage Validation v0.2

- Status: `PASS`
- Baseline main: `d8b6e223ec49bd454a0fd1276989723b0810a2d0`
- Triage input digest: `sha256:813dce0c46119d8144c9834036460f8a84aa6b338ca2a3ec555252318e9bcabb`
- Sample seed: `triage-validation-v02`
- Validation date: `2026-09-01`
- Final-cycle production Evidence changed: **NO**
- Company Evidence v1 Coverage Close gate: **PASS**

## Decision

The final deterministic 87-record audit produced 87 exact matches, no MINOR, MATERIAL, or CRITICAL mismatch, and no unresolved systemic pattern. Two earlier validation cycles exposed material patterns; both affected populations were corrected and revalidated before this PASS was recorded.

The audit treats the current classification as a hypothesis, not an answer key. Each record was checked against its Claim/Evidence/Locator state, official Shared Source or bounded targeted official source, annual filing/report, and business model. The checker reproduces sampling and validates artifact integrity but does not generate semantic judgments.

## Deterministic final sample

Sampling sorts by `sha256(companyId + ':' + category + ':triage-validation-v02')`, then by record ID. The sample was fixed before the final source review.

| Stratum | Audited |
| --- | ---: |
| SUFFICIENT_PARTIAL | 24 |
| Remaining DEFERRED | 9 (all) |
| NOT_APPLICABLE | 30 (all) |
| NOT_DISCLOSED | 0 (all) |
| Former-DEFERRED representation | 24 |
| **Total** | **87** |

Former-DEFERRED representation contains six non-overlapping current-SUFFICIENT_PARTIAL records from each remediated Category: manufacturing facilities, capacity expansion, customer/end market, and strategy.

## Validation cycles and remediation

| Cycle | Baseline | Sample | Exact | MATERIAL | CRITICAL | Decision |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 0 | `28b5dbd5dc6ce2c48461417cc77176d9e7180fcc` | 93 | 89 | 4 | 0 | REMEDIATE |
| 1 | `edbd83155f7f8ddbe666198f402941bc627af818` | 89 | 87 | 2 | 0 | REMEDIATE |
| 2 | `d8b6e223ec49bd454a0fd1276989723b0810a2d0` | 87 | 87 | 0 | 0 | PASS |

Cycle 0 exhausted the four-record NOT_DISCLOSED population and found a shared customer-name threshold error. NVIDIA, Fujikura, and Applied Materials were enriched; TSMC was reclassified to SUFFICIENT_PARTIAL on existing evidence. Cycle 1 re-reviewed all 11 remaining DEFERRED capacity-expansion records and found concrete projects for Legrand and SMC. Those two were enriched; the other nine remained DEFERRED only after project-specific review. The final cycle independently checks all nine remaining DEFERRED records.

Remediation totals: six records reclassified, five new ACTIONABLE records found and processed, five Claims/Evidence Bindings/structured Locators added, four Shared Sources reused, and three Shared Sources added. ACTIONABLE pending is zero.

## Final result

| Result | Count |
| --- | ---: |
| Exact match | 87 |
| MINOR mismatch | 0 |
| MATERIAL mismatch | 0 |
| CRITICAL mismatch | 0 |
| Unresolved systemic patterns | 0 |

## Remaining DEFERRED review

All nine remaining records are capacity-expansion. Official material was reviewed within the bounded rule; generic Capex, optimization, product capacity, laboratory capability, R&D, modernization without output expansion, and stale projects were not promoted to Evidence.

| Record | Independent result | Reason |
| --- | --- | --- |
| `asmpt:capacity-expansion` | DEFERRED | ASMPT's official annual material and targeted review did not identify a current, concrete production-capacity project; generic capacity planning and product demand do not meet the project threshold. |
| `unimicron:capacity-expansion` | DEFERRED | Unimicron's official material reviewed within the bound did not separate a current site-, scale-, or timeline-specific production expansion from generic capital expenditure. |
| `nikon:capacity-expansion` | DEFERRED | Nikon discloses long-term production-site rebuilding and upgrades, but the reviewed material does not state an increase in production output; modernization is not treated as capacity expansion by inference. |
| `western-digital:capacity-expansion` | DEFERRED | Western Digital's reviewed official material describes laboratory and qualification capability, not a current company production-capacity expansion project. |
| `onsemi:capacity-expansion` | DEFERRED | onsemi's filing emphasizes manufacturing realignment and capacity reduction/optimization; generic future capacity-risk language is not a concrete expansion project. |
| `hexagon:capacity-expansion` | DEFERRED | Hexagon's official material addresses plant efficiency, digital twins, and energy performance rather than a current expansion of company production capacity. |
| `lasertec:capacity-expansion` | DEFERRED | Lasertec's bounded primary-source review did not identify a current site-, scale-, or timeline-specific production-capacity project. |
| `omron:capacity-expansion` | DEFERRED | OMRON's reviewed disclosures concern production optimization and restructuring, not a concrete current expansion of production output. |
| `broadcom:capacity-expansion` | DEFERRED | Broadcom's filing confirms internal proprietary wafer fabrication, so the Category applies, but the bounded review found no current site-, scale-, or timeline-specific production-capacity expansion project. |

## Coverage and protection

Validation remediation changed Coverage from `321 complete / 738 partial / 41 not-started` to `321 / 740 / 39`. The final Triage distribution is ACTIONABLE 0, SUFFICIENT_PARTIAL 740, NOT_DISCLOSED 0, NOT_APPLICABLE 30, DEFERRED 9, REVIEW_REQUIRED 0.

Financial diff is zero. The final validation/close change is docs/audit-only: no production Evidence, company data, relationships, Global Visual System, Evidence Schema, or Freeze contract is changed.

## All final-cycle records

| # | Record | Stratum | Independent | Severity | Official sources checked |
| ---: | --- | --- | --- | --- | ---: |
| 1 | `bosch:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 2 | `onsemi:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 3 | `nan-ya-pcb:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 4 | `asm-international:ai-infrastructure-role` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 5 | `globalwafers:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 6 | `nikon:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 7 | `lumentum:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 8 | `hanmi-semiconductor:technology` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 9 | `lam-research:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 10 | `eaton:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 11 | `screen-holdings:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 12 | `lumentum:competitive-positioning` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 13 | `carrier:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 14 | `unimicron:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 15 | `smc:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 16 | `asm-international:risks` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 17 | `linde:customer-end-market` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 18 | `ge-vernova:customer-end-market` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 19 | `intel:strategy` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 20 | `umc:strategy` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 21 | `aptiv:capacity-expansion` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 22 | `denso:capacity-expansion` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 23 | `fujikura:company-overview` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 24 | `hanmi-semiconductor:manufacturing-facilities` | SUFFICIENT_PARTIAL | SUFFICIENT_PARTIAL | NONE | 1 |
| 25 | `asmpt:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 26 | `unimicron:capacity-expansion` | DEFERRED | DEFERRED | NONE | 2 |
| 27 | `nikon:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 28 | `western-digital:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 29 | `onsemi:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 30 | `hexagon:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 31 | `lasertec:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 32 | `omron:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 33 | `broadcom:capacity-expansion` | DEFERRED | DEFERRED | NONE | 1 |
| 34 | `nvidia:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 35 | `cadence:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 36 | `keyence:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 37 | `keyence:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 38 | `arista:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 39 | `credo:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 40 | `ciena:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 41 | `marvell:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 42 | `mediatek:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 43 | `ciena:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 44 | `monolithic-power:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 45 | `marvell:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 46 | `monolithic-power:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 47 | `qualcomm:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 48 | `amd:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 49 | `credo:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 50 | `arista:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 51 | `cadence:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 52 | `cisco:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 53 | `qualcomm:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 54 | `amd:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 55 | `synopsys:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 56 | `arm:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 57 | `arm:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 58 | `cisco:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 59 | `synopsys:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 60 | `mobileye:manufacturing-facilities` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 61 | `nvidia:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 62 | `mobileye:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 63 | `mediatek:capacity-expansion` | NOT_APPLICABLE | NOT_APPLICABLE | NONE | 1 |
| 64 | `ajinomoto-fine-techno:manufacturing-facilities` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 65 | `stmicroelectronics:manufacturing-facilities` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 66 | `amkor:manufacturing-facilities` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 67 | `sumco:manufacturing-facilities` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 68 | `sandisk:manufacturing-facilities` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 69 | `siemens-energy:manufacturing-facilities` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 70 | `renesas:capacity-expansion` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 71 | `johnson-controls:capacity-expansion` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 72 | `seagate:capacity-expansion` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 73 | `kla:capacity-expansion` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 74 | `amphenol:capacity-expansion` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 75 | `resonac-holdings:capacity-expansion` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 76 | `globalwafers:customer-end-market` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 77 | `equinix:customer-end-market` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 78 | `mediatek:customer-end-market` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 79 | `resonac-holdings:customer-end-market` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 80 | `ciena:customer-end-market` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 81 | `ase-technology:customer-end-market` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 82 | `carrier:strategy` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 83 | `nikon:strategy` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 84 | `ge-vernova:strategy` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 85 | `tsmc:strategy` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 86 | `denso:strategy` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |
| 87 | `jcet:strategy` | REMEDIATED_FORMER_DEFERRED | SUFFICIENT_PARTIAL | NONE | 1 |

The full source metadata, bounded-review fields, Claim/Evidence/Locator IDs, business-model assessment, and record-level rationale are fixed in `company-evidence-triage-validation-v02.json`.
