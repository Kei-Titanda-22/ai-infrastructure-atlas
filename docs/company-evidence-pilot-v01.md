# Company Evidence Pilot v0.1

**Status:** Implementation complete; UX Review pending

**Date:** 2026-08-31

**Scope:** NVIDIA, TSMC, Applied Materials, Fujikura, Vertiv only

**Baseline:** `origin/main` at `a0602d3bc6d7608ccd3427348b07087ef8fbca29`

This report records the formal five-company Pilot requested after the Phase 1 specification. It is not a UX Review approval, Schema/UI Freeze, 100-company coverage audit, or rollout authorization.

## Pilot result

The Pilot expresses five structurally different companies with the same `schemaVersion: 0.1` contract: 39 claims, 39 claim-level Evidence Bindings, 55 Company × Category Coverage Records, and 13 reused or newly registered primary sources. No company-specific field was added.

All 39 claims are `source-linked`; none is `verified`. This is deliberate. Every referenced Source Policy is still `pending` and `manual-reference-only-until-reviewed`, while the Phase 1 contract requires a reviewed policy before `verified`. Existing `summary`, `aiRole`, `products`, `strengths`, and `risks` were not copied into a verified state.

## Company-level counts

| Company | Claims | P1 | P2 | P3 | Verified | Source-linked | Evidence | Sources | Coverage complete / partial / not-started |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| NVIDIA | 7 | 4 | 3 | 0 | 0 | 7 | 7 | 3 | 4 / 4 / 3 |
| TSMC | 8 | 4 | 4 | 0 | 0 | 8 | 8 | 2 | 5 / 3 / 3 |
| Applied Materials | 8 | 4 | 4 | 0 | 0 | 8 | 8 | 3 | 4 / 5 / 2 |
| Fujikura | 8 | 4 | 4 | 0 | 0 | 8 | 8 | 3 | 4 / 6 / 1 |
| Vertiv | 8 | 4 | 4 | 0 | 0 | 8 | 8 | 2 | 4 / 5 / 2 |
| **Total** | **39** | **20** | **19** | **0** | **0** | **39** | **39** | **13 unique** | **21 / 23 / 11** |

Claim types: 18 facts, 1 company guidance, 7 company positioning statements, and 13 Atlas analyses. No estimate was needed to state the selected Pilot evidence conservatively.

## Missingness

All 11 categories exist for every company. Missing reasons are explicit rather than filled with inferred prose:

- `not-collected`: 6 records
- `primary-source-unchecked`: 4 records
- `not-disclosed`: 4 records
- `not-applicable`: 1 record

The remaining non-complete records are partial coverage without a missing reason because their incompleteness is described in `notes` rather than caused by a single missingness class.

## Information architecture and UI

The implementation keeps the fixed page order: Overview, Value Chain, Products, Competitive Advantage, Facilities, Financial, KPI, Competitors, Risks, Sources. Pilot claims are projected into these sections; the old standalone “claims and evidence” section is suppressed only for the five Pilot companies.

- P1 is visible in the section body. Every company has exactly four P1 claims.
- P2/P3 is collapsed in a native `details` disclosure.
- Fact, company statement, company guidance, and Atlas analysis have persistent text labels. Atlas analysis also has a distinct border/background and confidence in the drawer.
- One textual Evidence badge opens a native modal drawer. The drawer shows status, dates, freshness, confidence where required, Source metadata, and a structured Locator. The primary Source link is the next action, satisfying the two-click path.
- Empty or partial categories show a Missing/Coverage notice. The facility section therefore remains informative for a fabless or uncollected company instead of rendering a blank area.
- The drawer supports keyboard activation, Escape, an explicit close control, backdrop close, initial focus on close, and focus return to the triggering badge.
- The final Sources section deduplicates sources at page level and preserves the existing finance/KPI provenance display.

## UX issues for formal review

1. The full status text “一次資料紐付け済み・確認未了” is honest but long on 360px screens. The badge remains usable, but UX Review should decide whether the visible label may be shortened while retaining the full accessible meaning.
2. A section with multiple partial categories can repeat Coverage notices. This is accurate but may feel dense after several P2 groups.
3. `source-linked` on P1 fact is below the Phase 1 preferred state. This is a governance blocker for a production rollout, not a reason to mislabel claims as verified.
4. Existing company-level “情報確認状況” and `lastReviewed` remain legacy values and can visually disagree with claim-level status/freshness. The Pilot deliberately does not rewrite those fields.

## Removal candidates

- Remove the legacy standalone “主張と根拠” section for evidence-schema companies after Freeze; its direct URL list duplicates the claim badge/drawer contract.
- Stop showing legacy narrative and Evidence-backed claim text simultaneously once migration is approved. The Pilot already chooses one or the other per section for its five companies.
- Consider removing company-level Sources that are not actually used by a visible section after a shared registry loader is frozen. This Pilot retains them to avoid changing legacy provenance semantics.

## Schema and contract issues found

1. `publishedAt` is absent from many existing Source records. The drawer must display “日付不明”; Freeze should decide whether `null` is normalized across all shards.
2. The schema allows `missingStatus` on `partial`, which is useful for mixed disclosed/non-disclosed categories, but the normative wording only requires it for `not-started`. Freeze should document this intended use.
3. Freshness is currently derived against the build/review date. A production contract needs a shared runtime/build helper rather than component-local date logic.
4. Shared Source Registry imports are still enumerated by the page. A manifest/common loader remains a Freeze candidate; this Pilot adds a shard, not a second registry.
5. `verified` cannot be exercised honestly until at least one Source Policy is reviewed. The validator implements the rule and leaves the Pilot at zero verified claims.

These findings require UX Review and possibly a v0.2 specification. This document makes no Freeze decision.

## Validation contract

`scripts/validate-company-evidence-pilot.py` checks:

- repository-unique Pilot claim and Evidence IDs;
- known Pilot `companyId` and known shared-registry `sourceId`;
- no orphan or cross-bound Evidence Binding;
- reviewed Source Policy plus `supports` Evidence for any future `verified` claim;
- claim type, category, priority, verification, coverage, and missing-status enums;
- confidence on analysis/estimate and no analysis confidence on fact;
- non-empty, allowed Locator structure;
- duplicate claim/source/locator bindings;
- all 55 coverage pairs;
- no changes to non-Pilot company JSON, financial history, cash-flow overrides, production `claims.json`, `facilities.json`, or `relationships.json`.

The standard data validators, secret scan, Astro build, Pagefind build, semantic path check, and five-page desktop/mobile browser QA are required before merge and are reported in the pull request.

## Validation result

- All existing data validators, the Pilot validator, financial quality audit check, and secret scan passed.
- Astro generated 109 pages; Pagefind indexed 105 pages in Japanese.
- Browser QA passed for all five companies at 1280px desktop and 360px mobile width: four visible P1 claims per company, 39 Evidence badges total, no horizontal page overflow, and no console errors.
- Evidence drawer QA passed for initial focus, structured Locator, primary-source link, explicit close, Escape close, and focus return. The mobile drawer remained within the 360px viewport.
- The initial native-dialog Escape check exposed inconsistent behavior in the test browser. The Pilot now handles Escape explicitly; the repeated browser check passed.
- A built-HTML semantic comparison of all 95 non-Pilot company pages against the Phase 1 worktree found zero differences after removing generated stylesheet asset hashes.

## Scope protection

- No files under `src/data/companies/**` changed; the other 95 companies retain their records.
- No financial value, financial history, metric audit, ROIC input, or cash-flow override changed.
- No production `claims.json`, `facilities.json`, or `relationships.json` entry changed.
- No 100-company audit or rollout was started.
- No supply-chain relation was inferred from general product compatibility or unnamed customers.

## Next gate

The next permitted phase is a human UX Review of these five Pilot pages. Review should decide status-label density, Coverage notice density, company-level versus claim-level status presentation, and any v0.2 schema changes. Freeze and 100-company work remain blocked until that review is explicitly approved.
