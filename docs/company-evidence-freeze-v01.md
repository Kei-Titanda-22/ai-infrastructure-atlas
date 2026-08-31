# Company Evidence UI / Schema Freeze v0.1

- Freeze date: 2026-08-31
- Freeze decision: **YES**
- Baseline main SHA: `c265ed91c306bf5461eb8d056179c8de589c2245`
- Freeze contract version: `0.1`
- Frozen Company Evidence Schema version: `0.2`
- Frozen Schema artifact: `docs/company-evidence-schema-v02.json`
- Pilot baseline: NVIDIA / TSMC / Applied Materials / Fujikura / Vertiv
- Human Test executed: **NO**
- Human Test status: optional post-Freeze UX validation asset
- Next gate: `100-company Company Evidence Coverage Audit`

## 1. Decision and scope

The current five-company Pilot is the baseline contract for expanding Company Evidence to the remaining companies. This Freeze fixes the accepted information architecture, data relationships, status semantics, provenance path, and visual direction. It does not add Evidence, approve a Source Policy, change company or financial data, or start the 100-company audit.

The Freeze decision is based on the completed sequence below:

1. Company UX Requirements v0.1;
2. Company Evidence Schema v0.1;
3. the NVIDIA / TSMC / Applied Materials / Fujikura / Vertiv Pilot;
4. Human UX / Information Reduction Review;
5. UX / Schema v0.2 revision;
6. removal of the AI-dashboard visual language;
7. Editorial Polish and Research Layout Refinement;
8. Atlas Analysis presentation refinement;
9. deployed desktop/mobile QA; and
10. preservation of semantic diff 0 through the presentation revisions.

Visual Design is accepted as usable. A five-person Human Test was not executed. It was not a required condition in the adopted Freeze process and is not a Freeze blocker. The protocol, Answer Key, and empty result templates remain in the repository as optional future validation assets and must not be deleted or presented as completed test results.

Historical Pilot documents retain the decision state that applied when they were written. This document is the later authoritative Freeze decision and does not rewrite those records.

## 2. Frozen data architecture

The canonical relationship is frozen as:

`Company Claim → Evidence Binding → Shared Source Registry`

These records remain separate. A Claim must not embed a Source record, and a Source must not be copied into every Claim or Evidence Binding. A Shared Source may be reused by Company Evidence, financial data, facilities, and other governed datasets through its Source ID.

The following contracts are frozen at their v0.2 definitions:

- Company Claim Schema;
- Evidence Binding Schema;
- Shared Source Registry and resolver contract;
- structured Evidence Locator contract;
- Verification Status and Freshness derivation;
- Missing Status;
- P1 / P2 / P3 priority model; and
- Fact / Company View / Atlas Analysis separation.

Schema version `0.2` is the production baseline frozen by Freeze contract `0.1`. A Freeze contract version and a data Schema version are distinct and must not be substituted for one another.

## 3. Company Claim contract

A Company Claim keeps its atomic identity, company, category, epistemic type, priority, title, statement, Evidence IDs, verification state, information date, verification date, and review date. Analysis or estimate records retain confidence. The frozen claim types are:

- `fact`;
- `company-guidance`;
- `company-positioning`;
- `atlas-analysis`; and
- `estimate`.

`fact` is not a company opinion or an Atlas conclusion. `company-guidance` and `company-positioning` remain Company View. `atlas-analysis` and `estimate` remain Atlas-authored interpretation. Presentation may group Claims, but must not merge their identities or Evidence Bindings.

The frozen priority model is `P1`, `P2`, and `P3`. Priority controls reading order and disclosure depth, not truth, verification strength, or investment importance.

## 4. Evidence and Locator contract

An Evidence Binding connects one Claim ID to one Shared Source ID and records support direction, a structured Locator, and the last Locator check date. Binding IDs and Claim IDs are unique. Orphan bindings and unknown Company or Source IDs are invalid.

The frozen support values are:

- `supports`;
- `context`; and
- `contradicts`.

A Locator contains at least one non-empty supported field from:

- `page`;
- `section`;
- `heading`;
- `table`;
- `note`;
- `anchor`; and
- `quotedLabel`.

Evidence existence alone is not proof of verification. A `verified` Claim requires supporting Evidence, a valid Locator, and an applicable reviewed Source Policy. Pending policy state must never be silently promoted.

## 5. Verification, freshness, and missingness

The frozen internal Verification Status values are:

- `verified`;
- `source-linked`; and
- `needs-review`.

`source-linked` is not downgraded merely because Human Test was not executed. Human Test evaluates comprehension and interaction, not Source verification. `verified` is not assigned while the applicable Source Policy is pending or the primary Locator has not been checked.

Freshness is separate from Verification Status. Company Evidence UI derives it through `src/lib/evidence-freshness.ts`; components must not hard-code a reference date.

The frozen Missing Status values are:

- `not-collected`;
- `primary-source-unchecked`;
- `not-disclosed`; and
- `not-applicable`.

UI may use concise Japanese labels. A `not-started` coverage record requires Missing Status. A `partial` record that uses Missing Status requires an explanatory note. Missing values are not filled by inference.

## 6. Frozen Company Page hierarchy

The current Pilot page is the 100-company baseline.

Desktop hierarchy:

1. Hero;
2. page navigation;
3. main research column plus Company Snapshot rail;
4. Financial / KPI;
5. Sources / provenance.

Main research flow:

1. `AIインフラでの位置`;
2. `競争優位`;
3. `主要製品・技術`;
4. Risk / relevant research;
5. `補足リサーチ`.

Mobile naturally stacks into one column. Company Snapshot content remains in the document flow and must not be rendered as an independent side rail. Page-level horizontal overflow is prohibited.

The Company Snapshot rail retains concise identity and comparison context. It is not a second research narrative and must not duplicate the main Claims.

Financial and industry KPI content remains integrated into one research flow. Compact value presentation may lead, while definition, date, basis, and Source details remain available through the existing disclosure/provenance path. KPI cards or an unrelated dashboard layer must not be introduced.

## 7. One information level, one Disclosure

The frozen rule is:

> One information level has at most one Disclosure.

Correct:

`補足リサーチ → content`

Prohibited:

`補足リサーチ → 詳細を見る → content`

The Supplementary Research disclosure renders its contained P2/P3 Claims directly. `flattenSecondary` is the current implementation guard. Coverage shown inside the page-end `データ品質・収録状況` disclosure is static at that level and must not create a second nested Coverage disclosure.

An Evidence drawer is a separate provenance interaction, not a nested reading-level disclosure. Advanced provenance within the drawer is permitted because it is the second step of the Evidence contract, not another gate between Supplementary Research and its content.

## 8. Frozen Evidence UX

The two-click contract is frozen as:

`Claim text → footnote-style Evidence marker → Evidence drawer → Primary Source`

The two clicks are the marker activation and the Primary Source activation. Scroll, automatic focus movement, and the browser's PDF navigation are not counted as clicks.

Evidence marker requirements:

- compact footnote presentation;
- one marker for each visible Claim;
- keyboard operability;
- minimum 44 × 44 CSS-pixel target;
- an accessible name containing Claim and verification context; and
- visible focus.

Evidence drawer Basic view:

- Source publisher and title;
- publication date or explicit unknown date; and
- Primary Source action.

Evidence drawer Advanced provenance:

- Verification Status;
- Freshness and next review;
- Locator and Locator check date;
- confidence when applicable;
- internal priority; and
- governed policy/audit metadata when available.

The drawer must keep its close control, Escape handling, modal behavior, and focus return to the originating marker.

## 9. Shared Source and bibliography contract

`src/data/source-registry-manifest.json` lists the Shared Source shards and `src/lib/source-registry.ts` is their page-facing resolver. Consumers resolve Source IDs through the resolver rather than independently enumerating shards.

Frozen resolver rules:

1. every manifest shard exists and is an array;
2. unknown `publishedAt` is explicit `null` and is not inferred;
3. compatible duplicate IDs require the same URL and company association;
4. conflicting duplicate IDs are invalid;
5. later compatible shards may provide canonical metadata; and
6. an unused registered Source is not deleted merely because it is not currently visible.

The normal page-end Source presentation remains bibliography-like:

`[number] Publisher — Title`

Publication, retrieval, policy, verification, and Locator metadata stay in Evidence or advanced provenance instead of occupying the default bibliography view.

## 10. Atlas Analysis presentation

The internal `atlas-analysis` value remains unchanged. Public presentation follows these frozen rules:

- do not repeat an Atlas Analysis badge on every Claim;
- do not use brown/orange Claim-side rules;
- render `Atlasによる分析` once as small secondary text at the start of each section that contains Atlas Analysis;
- do not render it as a badge, pill, card, icon, or colored background; and
- do not add a compensating line, color marker, or badge to Fact or Company View.

The accessible Claim context may still identify the epistemic type. This must not create a repeated decorative visual label.

## 11. Frozen visual baseline

The accepted design is typography-first, editorial, research-oriented, restrained, and data-dense. It uses white or neutral backgrounds, dark body text, muted secondary text, restrained blue links, and thin rules between major sections.

The baseline prohibits:

- large rounded information cards;
- KPI cards;
- colorful pills or badge groups;
- gradients;
- unnecessary shadows;
- decorative AI/SaaS dashboard UI;
- marketing calls to action;
- excessive iconography; and
- a new visual design philosophy introduced during rollout.

Freeze does not permanently lock individual pixels. A demonstrated accessibility, responsive, overflow, focus, or rendering bug may be fixed without a contract version bump when the accepted design direction and semantic output remain unchanged.

## 12. Legacy migration rule

Existing `summary`, `aiRole`, `products`, `strengths`, and `risks` fields are migration inputs only. They must not be automatically converted to `verified` Company Claims.

For each migrated statement, the rollout must distinguish:

1. primary-evidence-supported Claim;
2. Atlas Analysis; or
3. insufficient Evidence / Missing Status.

Migration requires human review of Claim type, category, priority, Source, Locator, and information date. Legacy `sourceStatus`, competitor arrays, general industry knowledge, or text similarity do not satisfy this review.

## 13. Supply-chain relation evidence contract

Company Claims and inter-company relations remain separate schemas. The future storage relationship is:

`Company Relation → Relation Evidence Binding → Shared Source Registry`

A public named relation must expose or resolve at least:

- `fromCompanyId` (fromCompany role);
- `toCompanyId` (toCompany role);
- `relationType`;
- `productOrTechnology`;
- `evidenceSourceIds` resolved from Relation Evidence Bindings;
- one or more structured Evidence Locators;
- `asOf`; and
- `verificationStatus`.

Relation Evidence Binding preserves Source separation and records `relationId`, `sourceId`, support direction, Locator, and last checked date. A named edge requires document-level Evidence that identifies the relationship. Product compatibility, overlapping product categories, a generic customer list, competitor arrays, industry convention, or Atlas inference alone must not create a customer or supplier edge. Anonymous or inferred relations remain unpublished unless a later version introduces and governs an explicit disclosure level.

## 14. Allowed and prohibited changes after Freeze

Allowed without a contract version bump:

- a narrowly scoped visual, responsive, accessibility, focus, or overflow bug fix;
- a Source or Locator correction supported by review;
- addition of Company Evidence that conforms to the frozen Schema and rollout gates;
- a financial/KPI data update under its existing data-quality contract; and
- validator hardening that rejects states already prohibited by this contract.

Prohibited without change control and an appropriate version bump:

- merging Claim, Evidence Binding, and Source records;
- changing frozen enums or required meanings;
- automatically promoting legacy narrative to `verified`;
- inferring named supply/customer relations from compatibility;
- reintroducing nested reading-level disclosures;
- changing the two-click Evidence path;
- hiding Missing Status through inferred filler content;
- replacing the accepted visual baseline with a dashboard/marketing design; and
- starting rollout with an undocumented backward-incompatible format.

## 15. Change-control procedure

Every proposed contract change records:

1. problem;
2. affected companies;
3. backward compatibility;
4. proposed change;
5. migration impact; and
6. version bump.

A minor visual bug fix must state why it does not change information hierarchy, semantics, data contracts, or Evidence access. A contract change must update this Freeze record or create a successor, update the relevant Schema and validators, define migration behavior, and pass review before rollout.

## 16. Minimum regression contract

The generic Freeze validator fixes the following minimum invariants without treating the current five companies as the permanent production scope:

- unique Claim and Evidence Binding IDs;
- known Company and Shared Source IDs;
- no orphan Evidence Binding;
- valid Claim, support, priority, verification, coverage, and missingness enums;
- Evidence required for `verified` and `source-linked`;
- reviewed Source Policy and supporting Evidence required for `verified`;
- non-empty structured Locator using known fields;
- Shared Source manifest/resolver consistency;
- shared Freshness helper usage;
- one-level Supplementary Research disclosure;
- Evidence marker/drawer/Source path and accessibility hooks;
- bibliography, Company Snapshot, and Atlas Analysis presentation hooks; and
- the frozen Schema/Pilot baseline validator.

The existing Pilot validator remains a snapshot regression for the five adopted pages. It is not the 100-company data model. New Company Evidence must pass the generic invariants plus the separate Coverage Audit gate.

## 17. Rollout gate

Freeze completion authorizes the next phase only:

`100-company Company Evidence Coverage Audit`

It does not authorize automatic migration, Evidence generation, Source Policy approval, or public 100-company rollout. The audit must inventory coverage and missingness before migration work begins.

Ready for the Coverage Audit becomes **YES** only after this Freeze PR passes all validators, the financial quality audit, secret scan, Astro, Pagefind, semantic diff 0, Pilot spot checks, merge, and main Pages deployment.
