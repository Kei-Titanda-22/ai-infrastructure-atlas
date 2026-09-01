# Company Evidence Gap Triage v0.2

- Baseline main: `854f20bdc808323766f085f0c419d923753b93f5`
- Supersedes: `docs/company-evidence-gap-triage-v01.json`
- Semantic decision digest: `sha256:4781f9c870d755a9262a824c3606034161d90937162b3264440ec3cde824e3af`
- Current Coverage gaps: `779` (`partial 612` + `not-started 167`)
- ACTIONABLE pending: `127` records / `38` companies
- Coverage answers whether a Category is complete; Triage answers whether it should be pursued.

## Remediation scope

- Validation v0.1 affected records reviewed: `303`
- Former DEFERRED records independently re-reviewed: `300`
- Known Broadcom/Fujikura corrections reviewed: `3`
- Every affected record retains its reviewed source IDs, bounded-search method, rationale, and reviewer basis in JSON.

## Distribution

| Classification | Reviewed decision | Current gap state |
| --- | ---: | ---: |
| ACTIONABLE | 289 | 127 |
| SUFFICIENT_PARTIAL | 446 | 608 |
| NOT_DISCLOSED | 4 | 4 |
| NOT_APPLICABLE | 30 | 30 |
| DEFERRED | 10 | 10 |
| REVIEW_REQUIRED | 0 | 0 |

## Category summary

| Category | Gaps | Actionable | Sufficient partial | Not disclosed | Not applicable | Deferred | Review required |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ai-infrastructure-role | 95 | 0 | 95 | 0 | 0 | 0 | 0 |
| capacity-expansion | 97 | 26 | 46 | 0 | 15 | 10 | 0 |
| company-overview | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| competitive-positioning | 100 | 0 | 100 | 0 | 0 | 0 | 0 |
| customer-end-market | 100 | 34 | 62 | 4 | 0 | 0 | 0 |
| manufacturing-facilities | 87 | 30 | 42 | 0 | 15 | 0 | 0 |
| risks | 100 | 0 | 100 | 0 | 0 | 0 | 0 |
| strategy | 100 | 37 | 63 | 0 | 0 | 0 | 0 |
| technology | 99 | 0 | 99 | 0 | 0 | 0 | 0 |

## Reviewed closure states

| Record | Decision | Reviewed source | Rationale |
| --- | --- | --- | --- |
| `asmpt:capacity-expansion` | DEFERRED | annual-report-asmpt-2025 | ASMPT（エーエスエムピーティー）の既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `broadcom:capacity-expansion` | DEFERRED | sec-broadcom-2025-10k | Broadcom（ブロードコム）の既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `ciena:capacity-expansion` | NOT_APPLICABLE | sec-ciena-2025-10k | Ciena（シエナ）は自社production capacityを保有・増設するbusiness modelではなく、supplier capacityやproduct capacityを当該会社のcapacity-expansionとして推測しない。 |
| `ciena:manufacturing-facilities` | NOT_APPLICABLE | sec-ciena-2025-10k | Ciena（シエナ）の一次資料は製造を外部委託するbusiness modelを示す。office/R&D拠点は存在しても、当該企業の製造facilityとして収録する自社生産拠点は確認されない。 |
| `hexagon:capacity-expansion` | DEFERRED | hexagon-fy2025-year-end-report | Hexagon（ヘキサゴン）の既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `keyence:capacity-expansion` | NOT_APPLICABLE | corporate-keyence-fabless-model-2026 | キーエンスは自社production capacityを保有・増設するbusiness modelではなく、supplier capacityやproduct capacityを当該会社のcapacity-expansionとして推測しない。 |
| `keyence:manufacturing-facilities` | NOT_APPLICABLE | corporate-keyence-fabless-model-2026 | キーエンスの一次資料は製造を外部委託するbusiness modelを示す。office/R&D拠点は存在しても、当該企業の製造facilityとして収録する自社生産拠点は確認されない。 |
| `lasertec:capacity-expansion` | DEFERRED | edinet-lasertec-fy2025-annual-securities-report | レーザーテックの既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `legrand:capacity-expansion` | DEFERRED | earnings-legrand-2025-02-13-fy2024 | Legrand（ルグラン）の既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `nikon:capacity-expansion` | DEFERRED | integrated-nikon-2025 | ニコンの既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `omron:capacity-expansion` | DEFERRED | omron-financial-results-fy2025 | オムロンの既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `onsemi:capacity-expansion` | DEFERRED | sec-onsemi-2025-10k | onsemi（オンセミ）の既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `smc:capacity-expansion` | DEFERRED | smc-financial-results-fy2025 | SMCの既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |
| `western-digital:capacity-expansion` | DEFERRED | annual-report-western-digital-2025 | Western Digital（ウエスタンデジタル）の既存Source、年次報告・filing、対象を絞った公式情報を確認したが、generic Capex、最適化、製品容量またはR&D説明を超える具体的な現行production-capacity projectを確認できなかった。 |

## Architecture

- Semantic decisions are persisted reviewed records in this JSON artifact.
- The audit script does not classify records. It checks enums, provenance, source-review bounds, digest, freshness, Coverage correspondence, and mechanical action completion.
- `not-started → DEFERRED` fallback and the coarse Broadcom asset-light rule were removed.
- Evidence changes are the only event that can move an ACTIONABLE record to a completed current state.
- `SUFFICIENT_PARTIAL` remains Coverage `partial`; no complete count is inferred from Triage.
