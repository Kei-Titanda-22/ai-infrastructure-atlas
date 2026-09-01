# Global Visual System Correction Pass v0.3

## Scope

- Baseline: `origin/main` at `ab3b3014aa69fe17700a3cc4966e2fccd8b4b059` (PR #116 merged)
- Scope: presentation layer and the Compare clear-all interaction only
- Route types: Home, Companies, Compare, Financials, Search, Methodology, Atlas, Company Pilot, Company non-Pilot
- Browser widths: 1440, 1280, 1024, 768, 360 px
- Pilot semantic comparison: NVIDIA, TSMC, Applied Materials, Fujikura, Vertiv
- Representative non-Pilot page: Kioxia

No company, financial, Evidence, claim, source, source-policy, schema, comparison-classification, financial-normalization, search/filter, or Company Evidence contract data was changed.

## Issue inventory

1. Five selected companies consumed excessive vertical space and the fifth company felt clipped around 1024 px.
2. Compare had only per-company removal and no clear-all operation.
3. Compare company headers combined English and Japanese names into unstable wrapping blocks.
4. Shared page introductions retained unused space to the right while wrapping early.
5. Companies rows made the English company identity compete with the localized name and ticker.
6. Pilot and non-Pilot company copy retained narrow reading columns despite available page width.
7. Non-Pilot company hero/sidebar grids remained too restrictive around 1024 px.

## Corrections

### Compare five-company clipping and clear-all

- Organized search and templates as one add-company flow, followed by a distinct selected-company region.
- Added `全5社を解除` for a full set and `すべて解除` for a partial set. Individual `外す` controls remain unchanged.
- Clear-all produces the existing explicit `ids` state as `?ids=`. Reloading that URL restores the empty set instead of silently restoring the default template.
- After clear-all, focus returns to the company-search field. Mobile clear/remove targets measure 44 px high.
- Selected companies use a five-column overview at 960 px and above, a two-column compact overview on tablets, and one column on mobile.
- Compare headers now separate English name, localized name, ticker/country, and the existing financial-history link.
- The table keeps intentional container-level horizontal scrolling at narrower widths. Its 220 px sticky metric column and 164 px company columns make the fifth header materially more visible at 1024 px without deleting or compressing data.
- The table scroll region is keyboard focusable, has a visible focus outline, and explains the horizontal-scroll behavior before the table.

### Companies name-cell wrapping

- English company name is the primary link block.
- Localized name is a separate supporting line; ticker or `非上場` is a smaller third line.
- The existing Japanese-name field is presented without duplicating an already-wrapped English name where applicable.
- Search strings, sort data, filter data, row count, columns, company URLs, and all underlying names remain unchanged.
- Company-cell width increased from 235 to 260 px; stable word-breaking and tighter vertical padding reduced the worst measured row from 84 to 66 px.

### Header and reading widths

- Shared page leads can use up to 112 characters while remaining bounded by their container.
- Financials at 1024 px now uses 906 of the 969 available shell pixels for its lead, instead of 663 px.
- Pilot claim copy can use 900 px, with the hero thesis capped at 880 px.
- Non-Pilot pages stack the legacy sidebar below the reading column under 1200 px and use a one-column hero under 1100 px.
- Kioxia at 1024 px therefore gains a 969 px research region and 900 px body copy instead of a 675 px body column.

## Before / After measurements

Measurements use the deployed PR #116 UI as Before and the final local v0.3 build as After. Heights and widths are CSS pixels. Document overflow is positive horizontal excess; 0 means none.

### Compare

| Width | Selected height Before | Selected height After | Page height Before | Page height After | Sticky metric column Before | After | Table internal overflow After | Document overflow After |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1440 | 216 | 100 | 1756 | 1662 | 260 | 220 | 0 | 0 |
| 1280 | 216 | 100 | 1756 | 1662 | 260 | 220 | 0 | 0 |
| 1024 | 216 | 120 | 1754 | 1680 | 260 | 220 | 88 | 0 |
| 768 | 216 | 191 | 4730 | 4654 | 260 | 220 | 328 | 0 |
| 360 | 294 | 317 | 4935 | 4968 | 260 | 220 | 736 | 0 |

At 1024 px the selected region is 44.4% shorter, the fifth company header is visible rather than appearing absent, and the table scroll is visibly scoped. At 360 px, preserving three identity levels plus 44 px removal targets adds 23 px to the selected list; clear-all removes the full list in one action and document overflow remains 0.

### Effective widths at 1024 px

| Area | Before | After | Result |
|---|---:|---:|---|
| Financials lead | 663 | 906 | Unused right width reduced from 306 to 63 px |
| NVIDIA research claim copy | 768 | 900 | Unused research width reduced from 201 to 69 px |
| NVIDIA hero claim | 621 | 880 | Earlier wrapping removed without using full-bleed text |
| Kioxia research/body copy | 675 | 969 / 900 | Legacy sidebar moves below the reading column |
| Companies company cell | 235 | 260 | English/local/ticker hierarchy remains stable |

## Representative visual observations

- Compare at 1024 px shows all five selected-company blocks in one horizontal band and all five company headers in the first table viewport; the fifth header remains legible at the right edge.
- Companies at 1024 px consistently shows the English link first, localized name second, and ticker third. Long Japanese support names no longer displace the English identity.
- Compare at 360 px keeps clear-all in the selected-region heading and places every `外す` control beside its company with a 44 px target.
- Typography, thin rules, white background, and link treatment remain consistent with the existing research-oriented system. No card, pill, badge, gradient, or dashboard treatment was added.

## Responsive and readability results

- 8 representative routes × 5 widths = 40 final dimensional checks.
- Positive horizontal document overflow: 0/40.
- Compare uses only the intentional table-container scroll below the width needed by the data grid.
- Main/body-text contrast scan: 0 failures across 8 representative routes at 1024 and 360 px (16 route-width checks, threshold 4.5:1).
- China, Israel, and Sweden rows retain localized supporting names with English as the primary link.
- Mobile Compare clear/remove controls: 44 px high.

## Functional regression

| Area | Result |
|---|---|
| Companies search, country filter, China/Israel/Sweden labels, URL restore | PASS |
| Compare company add, five-company template, per-company remove, clear-all, rendering, URL restore | PASS |
| Compare empty URL reload (`?ids=`) | PASS |
| Home stage link and `半導体テスト` four-company filter | PASS: Amkor Technology, ASE Technology, JCET Group, Advantest |
| Atlas stage and technology links | PASS |
| Financials company selection, URL restore, charts, and source links | PASS |
| Search / Pagefind | PASS: `NVIDIA` returned 6 indexed results |
| Company competitor links and financial presentation | PASS |
| Evidence drawer, 44 px marker, Escape, and focus return | PASS |

## Semantic diff

- `src/data/**`: 0 changed files.
- Company, financial, Evidence, source, source-policy, and schema files: 0 changed files.
- Pilot public/local comparison: exact match for title, claim body, Evidence marker text, and accessible marker label on all 38 claims across the five Pilot companies.
- Compare public/local comparison: exact match for all comparison body rows, classifications, values, definitions, and source/status text.
- Companies search/filter/sort data attributes and destinations are unchanged; only the rendered name hierarchy changed.
- The only state adjustment is clear-all persistence through the existing `ids` URL parameter; no new parameter or URL key was introduced.

## Validation

- Data, company-relation, facilities, audit, v0.2, v0.3, v0.4, Company Evidence Pilot, and Company Evidence Freeze validators: PASS.
- Financial quality audit `--check`: PASS.
- Secret scan: PASS.
- Astro: PASS, 109 pages.
- Pagefind 1.5.2: PASS, 105 indexed pages / 3857 words.
- Browser QA, functional QA, contrast QA, and semantic comparison: PASS as recorded above.

## Remaining visual debt

- Compare data tables intentionally retain container-level horizontal scrolling at 1024 px and below; forcing five full data columns into 360 px would damage readability.
- The shared mobile primary navigation retains its pre-existing horizontal navigation strip. It does not cause document overflow and was outside this focused correction.
- The 360 px selected list is 23 px taller because localized names, ticker/layer context, and 44 px touch targets are retained.
- Non-Pilot company pages retain their legacy content structure even though the 1024 px reading column is now widened.
- Full-site acceptance and broader rollout require explicit post-deployment review.

Ready for Full-site Visual Rollout = NO
