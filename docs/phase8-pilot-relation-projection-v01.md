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
- Financial compatibility `ok / caution / blocked`: 0 / 4 / 0

## Projection contract

The canonical projection is `src/data/company-compare-evidence-pilot-v01.json`. It stores canonical IDs and derived missing/projection states; it does not duplicate Claim statements or financial values. P1 category mapping is explicit. Eligible P2 is selected at most once per company and dimension by policy `displayPriority` ascending, Claim `asOf` descending, then `claimId` ascending. A Claim missing required metadata is ineligible. The projection policy priority is placement metadata and does not alter Claim priority or Coverage.

Relations are referenced by Relation ID and resolved through the accepted Relation loader. Evidence trace retains Claim → Company Evidence Binding → Source and Relation → Relation Evidence Binding → Source chains. Missingness is derived from Coverage context plus projection availability; underlying records are never deleted.

Financial compatibility uses the existing Compare rules: fewer than two values, mismatched definitions, or mixed period kinds block comparison; period, basis, or verification differences produce caution. ROIC and absolute financial history are expanded-only. No FX conversion, ranking, difference-rate calculation, or new metric is introduced.

## Guardrails

No UI, route, component, style, workflow, Schema, Registry, Company, Company Evidence Claim/Binding/Coverage, Shared Source, Facility, Value Chain, or financial record/logic is changed. Browser QA is not applicable because this PR has no visible output. WFE and narrower equipment categories have no implicit hierarchy or roll-up.

## Validation

`build-phase8-pilot-relation-data.py --check` protects generated freshness. `validate-phase8-pilot-relation-data.py` audits candidate completeness, public gates, Relation/Binding correspondence, guarded-zero behavior, projection mapping, P2/P3 policy, evidence trace, Financial allowlist, Pilot ordering, and protected baseline counts. Synthetic tests cover P2 tie-break/exclusion, all-missing retention, Relation zero, and guarded zero.
