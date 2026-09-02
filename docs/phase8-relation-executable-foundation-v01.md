# Phase 8 Relation Executable Foundation v0.1 Audit

- Status: Implemented foundation; production Relation data remains empty
- Baseline main: `8f917f78c18fe6d88b096f4deffd0a7ad30cb161`
- Production Relation records: **0**
- Production Relation Evidence Bindings: **0**
- `relationships.json`: **0 records**
- Pilot Relation data added: **NO**
- UI / route changed: **NO**

## Scope

This PR implements the executable foundation adopted by the [Atlas Relation Schema v0.1](./atlas-relation-schema-v01.md) and sequenced by the [Phase 8 Execution Plan](./phase8-execution-plan-v01.md). It does not author Pilot relations, project Relation data into Compare, change Company Evidence, or introduce a Relation UI.

Implemented artifacts:

- Relation authoring JSON Schema v0.1.
- Relation Evidence Binding JSON Schema v0.1.
- resolved Relation read-model JSON Schema v0.1.
- TypeScript authoring, Binding, and resolved types.
- deterministic empty-state loader and resolver.
- repository validator, valid / invalid fixtures, and loader / resolver tests.
- integration into the existing `validate:data` command.

## Authoring and resolved separation

The authoring record contains only the accepted Relation fields. It cannot contain `evidenceIds`, `sourceIds`, or `freshnessStatus`. Relation Evidence Binding is the provenance source of truth.

The resolver derives:

- `evidenceIds`: Binding IDs for the Relation, deduplicated by Binding identity and sorted by ID.
- `sourceIds`: Shared Source IDs referenced by those Bindings, deduplicated and sorted by ID.
- `freshnessStatus`: `current`, `review-due`, or `stale` using the shared freshness thresholds.

`not-applicable` is never emitted as Relation freshness. Because authoring permits `nextReview: null` while Relation freshness has only three states, a missing review date resolves conservatively to `stale`; it never establishes currency and never becomes Coverage `not-applicable`.

The resolved JSON Schema has contract parity with every authoring field. The validator recursively compares the shared `id`, `date`, and `scope` definitions and compares every common property constraint, including required fields, type, enum, pattern, nullability, length, and numeric bounds. The resolved schema may add only `evidenceIds`, `sourceIds`, and `freshnessStatus`; `additionalProperties` remains false. Derived ID arrays are unique and constrained to Relation Evidence Binding IDs or non-empty Source IDs.

Canonical serialization is independent of input object insertion order. It sorts Relations by `relationId`, recursively sorts object keys, and sorts scope, `evidenceIds`, and `sourceIds` arrays without mutating the input. Tests cover reordered object keys, scope and derived arrays, Relation and Binding input arrays, Unicode preservation, and a meaningful-field change producing a different serialization.

## Accepted type and endpoint contract

| Relation type | Accepted subject → object | Additional guard |
| --- | --- | --- |
| `PRODUCES` | Company → Product | Product is a reviewed generic category |
| `DEVELOPS` | Company → Technology | canonical Technology endpoint |
| `USES` | Company or Product → Technology | direct public support Binding |
| `ENABLES` | Product → Technology | guarded; scope + direct `supports` + Locator |
| `SUPPLIES_TO` | Company → Company or Market | guarded; scope + direct `supports` + Locator |
| `COMPETES_WITH` | Company → Company | non-self, scoped, lexicographically canonical symmetric pair |
| `OPERATES` | Company → Facility | operation does not imply ownership |
| `POSITIONED_IN` | Company, Product, or Technology → ValueChainNode | Atlas mapping cannot be authored as Fact |

`SUBSTITUTES`, `EXPANDS`, and `EXPOSED_TO` remain deferred and fail validation. Reverse relations are not stored. `COMPETES_WITH` is stored once and may be projected symmetrically by a future read consumer.

## Scope and hierarchy guards

The scope object has fixed keys. `businessUnit` is always `null` in v0.1; a Relation that is not true at Company scope must be deferred. Endpoint and scope IDs resolve against existing Company, Product, Technology, Market, Facility, and ValueChainNode records. Geography values are canonical lower-kebab IDs until a separately approved geography registry exists.

The existing broad / narrow Product protection remains in force:

- no WFE-to-specific-equipment Relation derivation;
- no specific-equipment-to-WFE Relation derivation;
- no roll-up, aggregation, or deduplication across Product categories;
- no implicit parent-child hierarchy in the resolver;
- future hierarchy requires a separate Schema change.

## Provenance and publication gate

Every authored production Relation is treated as public because v0.1 has no draft-status field. It therefore requires:

- at least one direct `supports` Relation Evidence Binding;
- a structured frozen Locator;
- a known Shared Source;
- non-null `lastVerified`;
- valid endpoint and scope IDs.

An unresolved `contradicts` Binding blocks publication. Context-only or Evidence-free Relations fail. `ENABLES` and `SUPPLIES_TO` may validly remain at zero records.

## Inference protection

The loader reads only explicit authoring records from `relationships.json` and explicit Relation Evidence Bindings. It does not import or generate Relations from:

- legacy `competitors[]` arrays;
- Company products, tags, aliases, or shared Layer / Market labels;
- text similarity;
- generic Capex or R&D fields;
- Registry aliases or broad / narrow Product coexistence.

## Validation coverage

The Relation gate checks:

- ID format, uniqueness, stable ordering, and unknown fields;
- accepted / deferred type enum and exact endpoint matrix;
- endpoint and scope resolution;
- self-reference, direction, and `COMPETES_WITH` canonical symmetry;
- required scope and v0.1 `businessUnit: null`;
- logical duplicate and overlapping validity detection;
- date ordering and acyclic compatible supersession;
- Claim type / confidence guards and `POSITIONED_IN` epistemic guard;
- Binding Relation / Source / Locator integrity;
- direct-support publication gate and contradictory support block;
- authoring-derived-field rejection;
- authoring / resolved Schema parity for all common constraints and exact three-derived-field expansion;
- deterministic resolved ID sets, three-state freshness, canonical object-key / ID-array serialization, Unicode preservation, non-mutation, and immutable output;
- valid empty state and 12 valid directional endpoint fixtures across all eight accepted Relation types;
- 28 invalid fixtures, including deferred / unknown types, endpoint and scope errors, unresolved contradiction, date ordering, confidence / epistemic guards, missing Evidence, Locator, Source, symmetry, Binding duplicates / ordering, Relation ordering, supersession signature, orphans, and logical duplicates.

## Protected baseline

The implementation does not change Company JSON, Company Evidence Claims / Bindings / Coverage, Shared Source records, financial data, Facility data, Value Chain data, Product / Technology / Market Registry contents, `relationships.json`, components, pages, styles, or routes.

Expected protected state remains:

- Company Evidence v1 Coverage Close = **YES**.
- L4 = **100 / 100**.
- Coverage = **321 complete / 740 partial / 39 not-started**.
- ACTIONABLE / REVIEW_REQUIRED = **0 / 0**.
- Triage Validation v0.2 = **87 / 87 PASS**.
- Product / Technology / Market = **11 / 8 / 0**.
- production Relation / Relation Evidence Binding = **0 / 0**.

## Remaining open question

The bounded Pilot Evidence review in the next data PR will determine whether any `ENABLES` or `SUPPLIES_TO` candidate satisfies the guarded publication gate. Zero accepted records remains a valid result.
