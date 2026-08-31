# Global Visual System Correction Pass v0.2

## Scope

- Baseline: `origin/main` at `0f0a8797ce4275d83fe9128d7061b82da667c6f7` (PR #115 merged)
- Scope: presentation layer only
- Representative routes: Home, Companies, Atlas, Compare, Financials, Search, Company Pilot, Company non-Pilot, Methodology
- Browser widths: 1440, 1280, 1024, 768, 360 px
- Pilot confirmation: NVIDIA, TSMC, Applied Materials, Fujikura, Vertiv
- Non-Pilot confirmation: Kioxia, Advantest

No company, financial, Evidence, claim, source, source-policy, schema, priority, status, filter, search, compare, chart, or URL-contract data was changed.

## Issue inventory

1. Atlas stage rows used excessive vertical padding and tall internal grids.
2. Narrow columns and fixed wrapping produced unnatural line breaks, especially near 1024 px.
3. The Pilot company snapshot repeated header metadata and constrained the research body.
4. Major competitors were visually detached from the competitive-advantage discussion.
5. Body and explanatory copy used muted colors in places where it must remain readable.
6. Specialist terms were presented without a lightweight first-use explanation.
7. Numeric table presentation was not consistently right-aligned or tabular.
8. Missing primary metrics could dominate a main KPI table instead of remaining traceable in data-quality disclosure.
9. Disclosure nesting and mobile document overflow required regression coverage.

## Corrections

### Atlas

- Reduced stage padding, row gaps, and map-note spacing.
- Reflowed stage content without changing stage number, name, description, technology order, link text, or destination.
- Technology links wrap as natural inline groups. The mobile map no longer relies on an internal minimum width or horizontal scrolling.
- Added the existing first-use terminology-helper treatment to Atlas terms and linked terms. Link text and `href` remain unchanged.

### Company pages

- Removed the Pilot-only `企業スナップショット` and its rail.
- Kept header metadata authoritative and added the already-available last-reviewed value to the Pilot header presentation.
- Made Pilot research a one-column editorial flow at every tested width.
- Moved `主要比較対象` into the `競争優位` section as quiet inline links. The linked companies and URLs are unchanged.
- Reduced section and supplemental spacing. Claim order, claim text, Evidence markers, sources, financial values, and Company Evidence behavior remain unchanged.
- Non-Pilot company content and data contracts remain intact; shared wrapping and table presentation apply consistently.

### Typography, tables, and missing data

- Stabilized intro/body line length and applied natural wrapping to Home, Atlas, company, and methodology copy.
- Body and explanatory text use dark readable color; muted treatment is reserved for metadata.
- Numeric table cells use right alignment and tabular numerals, with compact padding and thin rules.
- The existing primary-KPI behavior remains: collected values stay in the main table; missing values remain traceable under `データ品質・収録状況`. Pilot primary missing rows measured 0.
- Nested disclosures measured 0 on every representative route and width.

### Terminology helper

- First occurrence only within a terminology scope.
- Accessible `abbr` treatment for plain terms; linked terms retain their original text and destination and receive an explanatory accessible name.
- Keyboard focus remains visible. Desktop uses a restrained note; mobile uses the existing fixed-bottom explanatory fallback.
- Covered terms include fabless, OSAT, TCB, DPU, AIファクトリー, CoWoS, HBM, FCF, and ROIC where present.

## Before / After measurements

Measurements use the public PR #115 UI as Before and the local correction build as After. Heights are CSS pixels. Document overflow reports positive excess only; 0 means no horizontal document overflow.

### Atlas

| Width | Map height Before | Map height After | Page height Before | Page height After | Map horizontal overflow After | Document overflow After |
|---:|---:|---:|---:|---:|---:|---:|
| 1440 | 1868 | 519 | 2361 | 1002 | 0 | 0 |
| 1280 | 1868 | 519 | 2361 | 1002 | 0 | 0 |
| 1024 | 1885 | 576 | 2373 | 1054 | 0 | 0 |
| 768 | 1637 | 779 | 2132 | 1263 | 0 | 0 |
| 360 | 1637 | 1213 | 2237 | 1800 | 0 | 0 |

At 1280 px the Atlas map height fell 72.2% (1868 to 519 px). At 1024 px it fell 69.4% (1885 to 576 px). The nine-stage and 70-link order is unchanged after normalizing the GitHub Pages base path.

### NVIDIA Pilot company page

| Width | Page height Before | Page height After | Snapshot Before | Snapshot After | Competitor links in body After | Document overflow After |
|---:|---:|---:|---:|---:|---:|---:|
| 1440 | 2651 | 2683 | 1 | 0 | 3 | 0 |
| 1280 | 2656 | 2683 | 1 | 0 | 3 | 0 |
| 1024 | 2930 | 2660 | 1 | 0 | 3 | 0 |
| 768 | 3044 | 2774 | 1 | 0 | 3 | 0 |
| 360 | 3411 | 3239 | 1 | 0 | 3 | 0 |

The 1024 px page became 270 px shorter while the research body gained the full content width. At 360 px it became 172 px shorter. The small desktop height increase reflects replacement of the parallel rail with a single reading flow, not added content.

## Responsive and readability results

- 9 route types × 5 widths = 45 final measurements.
- Positive horizontal document overflow: 0/45.
- Atlas internal horizontal overflow: 0/5.
- Nested disclosure: 0/45.
- Pilot snapshot label/region: 0 at every width.
- Pilot primary missing KPI rows: 0 across the five Pilot companies and five widths.
- Unreadable gray body/explanatory text: 0 in the 9 representative routes at 1024 and 360 px; checked text met at least 4.5:1 contrast.
- Pilot and non-Pilot checks covered 35 company/width combinations with no document overflow, nested disclosure, duplicate first-use terminology helper, or Pilot snapshot regression.

## Functional regression

| Area | Result |
|---|---|
| Home stage link and `半導体テスト` four-company filter | PASS |
| Companies search, country filter, China/Israel/Sweden Japanese labels, URL restore | PASS |
| Compare selection, rendering, and URL restore | PASS |
| Atlas stage and technology links | PASS |
| Financials company selection, chart, and source links | PASS |
| Search / Pagefind | PASS after final Pagefind build |
| Company competitor links and financial presentation | PASS |
| Evidence drawer, Escape, and focus return | PASS |

## Semantic diff

- `src/data/**`: 0 changed files.
- Company, Evidence, source, financial, schema, and source-policy data: 0 changed files.
- Pilot claim label/body/Evidence-marker comparison against the public UI: exact match for all 38 claims across the five Pilot companies.
- Atlas stage text and link order: exact match for 9 stages and 70 links after normalizing the GitHub Pages base path.
- Presentation files, this report, and the Freeze validator's presentation-hook assertion are the only intended changes. The obsolete `pilot-snapshot-rail` assertion was replaced with `pilot-competitors`; frozen semantic counts and contracts remain unchanged.

## Validation

- All data, relationship, facilities, audit, v0.2, v0.3, v0.4, Company Evidence Pilot, and Company Evidence Freeze validators: PASS.
- Financial quality audit `--check`: PASS.
- Secret scan: PASS.
- Astro: PASS, 109 pages.
- Pagefind 1.5.2: PASS, 105 indexed pages / 3857 words.
- Browser QA, functional QA, and semantic comparison: PASS as recorded above.

## Remaining visual debt

- Non-Pilot company pages retain their legacy side-information composition; this pass does not migrate the 100-company set to Company Evidence.
- Compare and financial tables retain table-container horizontal scrolling where the data grid cannot remain readable at narrow widths; document overflow remains 0.
- Full-site acceptance and any broader visual rollout require explicit review after production deployment.

Ready for Full-site Visual Rollout = NO
