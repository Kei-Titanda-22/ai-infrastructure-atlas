# Phase 8 Pilot Relation / Projection Data v0.1

Status: **Draft implementation — data only, not merged**  
Baseline main: `41cf035a70fd0853f08972113025f3cdd56f50ff`

## Outputs

- Relation authoring records: 17 (COMPETES_WITH 2, POSITIONED_IN 4, PRODUCES 11)
- Relation Evidence Bindings: 17
- Guarded `ENABLES` / `SUPPLIES_TO`: 0 / 0
- Pilot presets: Set A `nvidia → broadcom`; Set B `applied-materials → lam-research → tokyo-electron`
- Initial Financial: `operatingMargin`, `revenueGrowth` only
- Initial P1 / P2 / P3: 20 / 14 / 0
- Missing projected dimensions: 0
- Financial compatibility `ok / caution / blocked`: 0 / 2 / 2

## Projection contract

The canonical projection is `src/data/company-compare-evidence-pilot-v01.json`. It stores canonical IDs and derived missing/projection states; it does not duplicate Claim statements or financial values. P1 category mapping is explicit. Eligible P2 is selected at most once per company and dimension by Projection metadata `categoryProjectionPriority` ascending, Claim `asOf` descending, then `claimId` ascending. `categoryProjectionPriority` belongs to the category-to-dimension mapping and is not a frozen Claim field. A Claim missing required metadata is ineligible. Claim priority and Coverage remain unchanged.

Relations are referenced by Relation ID and resolved through the accepted Relation loader. The two canonical symmetric `COMPETES_WITH` records are projected into `technology-moat` for both Company endpoints without reverse records: Applied Materials has one, Lam Research has two in Relation ID order, and Tokyo Electron has one. They are not placed in another dimension. Evidence trace retains Claim → Company Evidence Binding → Source and Relation → Relation Evidence Binding → Source chains. Missingness is derived from Coverage context plus projection availability; underlying records are never deleted.

Financial compatibility is executed once by `src/lib/financial-comparison-contract.ts` over the normalized records exposed by `src/lib/financial-history.ts` and definitions in `src/data/financial-metric-definitions-v04.json`; the Python builder does not reimplement the decision rules. Existing Compare behavior is locked by parity fixtures because this data-only PR does not change the UI component. Availability, normalized definition, period type, accounting basis, verification status, missing Company, and missing period are evaluated. `operatingMargin` is defined in the normalized contract; `revenueGrowth` is not currently a normalized v0.4 metric and is therefore retained as an initial requested metric with a reasoned `blocked` state rather than sourced from Company JSON. ROIC and absolute financial history are expanded-only. No FX conversion, ranking, difference-rate calculation, Financial value change, or new metric is introduced.

## Guardrails

No UI, route, component, style, workflow, Schema foundation, Registry, Company, Company Evidence Claim/Binding/Coverage, Shared Source, Facility, Value Chain, or financial value is changed. The new canonical compatibility helper is Projection-only and parity-locked to existing Compare behavior. Browser QA is not applicable because this PR has no visible output. WFE and narrower equipment categories have no implicit hierarchy or roll-up.

## Validation

`build-phase8-pilot-relation-data.py --check` protects generated freshness. `validate-phase8-pilot-relation-data.py` audits candidate completeness, public gates, Relation/Binding correspondence, guarded-zero behavior, symmetric `COMPETES_WITH` projection, Projection-specific P2 priority, P3 policy, evidence trace, normalized Financial paths, Financial allowlist, Pilot ordering, and protected baseline counts. Synthetic tests cover every P2 tie-break stage, missing metadata, canonical symmetric competition projection, unrelated Company exclusion, all-missing retention, Relation zero, guarded zero, existing Compare parity, normalized-definition absence, missing-period handling, and repeat-build equality.
