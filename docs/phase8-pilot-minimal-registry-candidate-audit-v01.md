# Phase 8 Pilot Minimal Registry Candidate Audit v0.1

- Status: Implementation candidate inventory
- Baseline main: `2801114077995e505334a2dca6f9e1312e23be50`
- Pilot companies: `nvidia`, `broadcom`, `applied-materials`, `lam-research`, `tokyo-electron`
- Web research performed: **NO**
- Relation records created: **0**
- Machine-readable audit: [`phase8-pilot-minimal-registry-candidate-audit-v01.json`](./phase8-pilot-minimal-registry-candidate-audit-v01.json)

## Decision

既存Company Evidence、Evidence Binding、Shared Source、Company JSON、Value Chainだけをbounded reviewし、将来のPilot Relation endpointまたはscopeに必要なcanonical identityを限定した。

- Product: 11 include
- Technology: 8 include
- Market: 0 include
- Deferred: 9
- Rejected: 8

Productはreview済みgeneric product categoryだけである。brand、SKU、named product family、marketing phraseはregistryへ入れない。Marketは現在のPilot Relationにaccepted endpoint / scope requirementがないため、空registryを正式状態とする。

## Included Product entities

| ID | Canonical name | Pilot companies | Intended use |
| --- | --- | --- | --- |
| `product-category-coater-developer-equipment` | Coater/developer equipment | Tokyo Electron | `PRODUCES`; competition scope |
| `product-category-connectivity-semiconductor` | Connectivity semiconductors | Broadcom | `PRODUCES` endpoint |
| `product-category-cpu` | Central processing unit | NVIDIA | `PRODUCES` endpoint |
| `product-category-custom-accelerator-asic` | Custom accelerator ASIC | Broadcom | `PRODUCES`; competition scope |
| `product-category-dpu` | Data processing unit | NVIDIA | `PRODUCES` endpoint |
| `product-category-ethernet-switching-silicon` | Ethernet switching silicon | Broadcom | `PRODUCES`; competition scope |
| `product-category-gpu` | Graphics processing unit | NVIDIA | `PRODUCES`; competition scope |
| `product-category-semiconductor-deposition-equipment` | Semiconductor deposition equipment | Applied Materials / Lam Research / Tokyo Electron | `PRODUCES`; competition scope |
| `product-category-semiconductor-etch-equipment` | Semiconductor etch equipment | Lam Research / Tokyo Electron | `PRODUCES`; competition scope |
| `product-category-wafer-cleaning-equipment` | Wafer cleaning equipment | Lam Research / Tokyo Electron | `PRODUCES`; competition scope |
| `product-category-wafer-fabrication-equipment` | Wafer fabrication equipment | Applied Materials / Lam Research / Tokyo Electron | `PRODUCES`; top-level competition scope |

## Included Technology entities

| ID | Kind | Pilot companies | Intended use |
| --- | --- | --- | --- |
| `technology-accelerated-computing-architecture` | architecture | NVIDIA | `DEVELOPS`; `POSITIONED_IN` candidate |
| `technology-ethernet-networking` | protocol | Broadcom / NVIDIA | `DEVELOPS` / `USES`; competition scope |
| `technology-semiconductor-coating-development` | manufacturing process | Tokyo Electron | `DEVELOPS` / `USES`; competition scope |
| `technology-semiconductor-deposition` | manufacturing process | Applied Materials / Lam Research / Tokyo Electron | `DEVELOPS` / `USES`; competition scope |
| `technology-semiconductor-etching` | manufacturing process | Lam Research / Tokyo Electron | `DEVELOPS` / `USES`; competition scope |
| `technology-semiconductor-materials-engineering` | material technology | Applied Materials | `DEVELOPS` candidate |
| `technology-semiconductor-metrology` | process technology | Applied Materials | `DEVELOPS` / `USES` candidate |
| `technology-wafer-cleaning` | manufacturing process | Lam Research / Tokyo Electron | `DEVELOPS` / `USES`; competition scope |

## Included Market entities

None. The accepted Company Compare Pilot can use existing `customer-end-market` Claims without a Market Relation. Guarded `SUPPLIES_TO` review occurs in the later Pilot Relation data PR; no Market identity is created in anticipation of a record that may remain absent.

## Deferred candidates

| Proposed ID | Type | Reason |
| --- | --- | --- |
| `market-data-center` | Market | Claims mix customer class, infrastructure use, and final demand; no current Pilot Market relation requires it. |
| `market-foundry-logic` | Market | Customer/business-model segment and end-market boundary is unresolved. |
| `market-memory-semiconductor` | Market | Product/process scope is sufficient for the Pilot; no Market endpoint is required. |
| `product-category-data-center-networking-system` | Product | Would mix switches, silicon, fabric, adapters, and named systems at an unstable grain. |
| `technology-asic-architecture` | Technology | Current Claims use ASIC as both Product and architecture; Product identity is adopted and cross-type duplication is avoided. |
| `technology-custom-silicon-design` | Technology | Current support establishes a custom-design capability, not a stable architecture. v0.1 has no design-methodology/capability kind, and the taxonomy is not expanded for this candidate. |
| `technology-high-aspect-ratio-processing` | Technology | Current Atlas-analysis Claim does not close a stable company-wide Technology relation. |
| `technology-nvlink` | Technology | Valid protocol candidate but not needed by the initial Pilot Relation endpoint/scope. |
| `technology-plasma-etching` | Technology | Existing support is subsidiary/facility-specific and v0.1 has no sub-Company scope. |

## Rejected candidates

| Proposed ID | Type | Reason |
| --- | --- | --- |
| `market-ai` | Market | Generic `AI` alone is explicitly prohibited as a Market identity. |
| `product-category-blackwell-gpu` | Product | NVIDIA named family; generic GPU is registered. |
| `product-category-bluefield-dpu` | Product | NVIDIA named family; generic DPU is registered. |
| `product-category-grace-cpu` | Product | NVIDIA named family; generic CPU is registered. |
| `product-category-spectrum-x-networking` | Product | NVIDIA named family; no broad Product is inferred. |
| `technology-integrated-materials-solution` | Technology | Company-specific named solution / marketing phrase; underlying generic concepts are registered separately. |
| `compute` | ValueChainNode | Reuse existing `value-chain.json` ID; do not duplicate it in these registries or merge it with Company Layer. |
| `manufacturing` | ValueChainNode | Reuse existing `value-chain.json` ID; Wafer Fab Equipment remains a separate Product/Layer concept. |

## Evidence grounding

The 19 included candidates have 30 Company-level grounding entries. Each entry resolves through:

`Claim → Evidence Binding → Shared Source`

Structured Locator availability is 30 / 30. Registry records do not copy Company IDs, Source metadata, Locator, or Relation facts. Exact Claim, Binding, Source, and candidate decisions are retained only in the machine-readable audit.

## Targeted input freshness

Candidate audit freshness is not coupled to the full Company Evidence or Shared Source corpus. The validator hashes only:

- the five Pilot Company JSON records;
- every Claim record referenced by candidate grounding;
- every Evidence Binding record referenced by candidate grounding;
- every Shared Source record referenced by candidate grounding;
- `value-chain.json`;
- `relationships.json`.

Claim, Binding, and Source records are sorted by ID and serialized with stable JSON key ordering before SHA-256 hashing. An unrelated company Evidence or Source change therefore does not stale this audit. Any change to a referenced record, including Claim statement/type/priority/as-of, Binding support/source/Locator/last-checked, or Source metadata, does stale it. Unknown or duplicate referenced records fail validation.

## Broad / narrow Product boundary

Wafer Fabrication Equipment (WFE) and narrower deposition, etch, cleaning, and coater/developer categories intentionally coexist as independent canonical identities.

- No parent-child hierarchy is implemented in this PR.
- A WFE Relation must not imply or generate a narrower equipment Relation.
- A narrower equipment Relation must not imply or generate a WFE Relation.
- No aggregation, roll-up, or deduplication is performed.
- Relation executable foundation must not introduce an implicit hierarchy.
- A future hierarchy requires a separate Schema change and change-control review.

## Canonical label refinements

- `product-category-custom-accelerator-asic` does not accept the overly broad alias `ASIC`; only `Custom accelerator` and `Custom accelerators` remain.
- `product-category-connectivity-semiconductor` uses canonical name `Connectivity semiconductors`, Japanese display name `コネクティビティ半導体`, and singular alias `Connectivity semiconductor`.
- `product-category-wafer-fabrication-equipment` uses Japanese display name `半導体前工程製造装置` and aliases `Wafer fab equipment` / `WFE`.

## Registry contract

- [`entity-registry-schema-v01.json`](../src/data/entity-registry-schema-v01.json) defines strict Product / Technology / Market envelopes.
- [`product-registry-v01.json`](../src/data/product-registry-v01.json) fixes `productKind` to `generic-category`.
- [`technology-registry-v01.json`](../src/data/technology-registry-v01.json) permits only architecture, manufacturing process, protocol, material technology, and process technology.
- [`market-registry-v01.json`](../src/data/market-registry-v01.json) is valid with zero records.
- [`entity-registry.ts`](../src/lib/entity-registry.ts) loads records in stable ID order and resolves canonical IDs or reviewed aliases deterministically.
- [`validate-entity-registry.py`](../scripts/validate-entity-registry.py) validates structure, collisions, replacements, audit grounding, input freshness, and registry/audit identity.
- Validator and resolver behavior is fixed by [`test-entity-registry-validator.py`](../scripts/test-entity-registry-validator.py) and [`test-entity-registry-loader.mjs`](../scripts/test-entity-registry-loader.mjs).
- IDs are immutable ASCII lower-kebab-case with entity prefixes.
- Label lookup is NFKC + trim + Unicode lowercase. Python uses `lower()` and TypeScript uses `toLowerCase()`.
- The validator rejects canonical names, display names, and aliases where Python `lower()` and `casefold()` differ after NFKC. Cross-registry collision is prohibited after normalization.
- Active records have `replacedBy: null`; replacement cycles are prohibited.

## Boundaries retained

- `src/data/relationships.json` remains empty.
- No Relation schema, Relation Evidence Binding, or production Relation record is introduced.
- No Company, Evidence, Source, financial, Facility, Value Chain, products, tags, competitors, or UI content is changed.
- Registry inclusion does not assert that any future Relation passes its Evidence/publication gate. Product / Technology pairs marked for possible `ENABLES` use remain subject to guarded Relation review in the later data PR.
- Guarded `ENABLES` / `SUPPLIES_TO` may still produce zero Pilot records.

## Next PR

Relation executable foundation with production Relation count kept at zero.
