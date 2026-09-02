# Phase 8 Pilot Relation Candidate Audit v0.1

Status: **Complete — bounded Pilot review**  
Baseline main: `41cf035a70fd0853f08972113025f3cdd56f50ff`  
Input digest: `85c34997e13f9bd1b6b68dc2c54ec6bfabb976c2a3dd4aebc474cdd58273cbef`

## Scope and decision rule

Set A is `nvidia → broadcom`; Set B is `applied-materials → lam-research → tokyo-electron`. Every explicit candidate was reviewed against the current Claim, frozen Company Evidence Binding, registered Shared Source, structured Locator, canonical endpoint, and Company-wide scope. `include` means every public gate passed; `defer` preserves a plausible candidate without publishing it; `reject` is reserved for a semantically invalid candidate. No search engine or new Source was used.

| Relation type | Include | Defer | Reject |
| --- | ---: | ---: | ---: |
| COMPETES_WITH | 2 | 2 | 0 |
| DEVELOPS | 0 | 12 | 0 |
| ENABLES | 0 | 1 | 0 |
| OPERATES | 0 | 4 | 0 |
| POSITIONED_IN | 4 | 1 | 0 |
| PRODUCES | 11 | 4 | 0 |

- Candidates: 41
- Include / Defer / Reject: 17 / 24 / 0
- Published Relations / Relation Evidence Bindings: 17 / 17
- Guarded `ENABLES`: reviewed 1, included 0
- Guarded `SUPPLIES_TO`: reviewed 0, included 0
- Deferred Relation types authored: 0
- Market endpoint candidates: 0

## Bounded source review

The registered Lam Research FY2025 Form 10-K was opened directly and its Competition section verified named competition with Applied Materials in deposition and with Tokyo Electron in etch and wet clean. Those two scoped `COMPETES_WITH` candidates passed. NVIDIA's registered filing names Broadcom, but the frozen Claim/Binding selected for the candidate does not bind that named-competitor statement; because Company Evidence may not be changed here, the Set A candidate is deferred. Tokyo Electron's registered IR index responded, but the Products and Solutions locator and grounding text were not reproducible on that URL, so its four `PRODUCES` candidates and one `POSITIONED_IN` candidate are deferred. Its four Facility candidates also remain deferred because the official pages identify subsidiary operators and v0.1 has no Company-scope registry.

`ENABLES` and `SUPPLIES_TO` remain guarded and may validly publish zero records. Co-occurrence, taxonomy similarity, legacy competitor arrays, and brand names were not converted into Relations.

## Broad and narrow Product protection

WFE and narrower deposition, etch, cleaning, and coater/developer categories coexist without hierarchy. No parent-child hierarchy, implicit Relation derivation, roll-up, aggregation, or deduplication is performed in either direction. A future hierarchy requires a separate Schema change.

## Artifact authority

The full record-level audit is [`phase8-pilot-relation-candidate-audit-v01.json`](./phase8-pilot-relation-candidate-audit-v01.json). Included records alone are authored into `src/data/relationships.json` and `src/data/relation-evidence-bindings-v01.json`.
