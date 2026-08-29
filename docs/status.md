# AI Infrastructure Atlas Status — 2026-08-29

## Delivery status

- [x] Public GitHub repository
- [x] GitHub Pages + GitHub Actions deployment
- [x] Live browser URL: https://kei-titanda-22.github.io/ai-infrastructure-atlas/
- [x] Dependency installation / constitutional validation / Astro build / Pagefind / deployment verified in CI

## UI / UX

- [x] Dark background removed; light, high-contrast theme adopted
- [x] Japanese-first navigation and page labels
- [x] English retained only where natural: company names, tickers, HBM, PER, PBR, ROIC, etc.
- [x] Internal taxonomy keys kept stable while display labels are localized
- [x] Objective metrics show value + as-of date + period + basis + Source
- [x] Analyst scores remain visually and structurally separated from objective data

## Core research coverage

- companies: 20
- value-chain layers: 8
- registered Sources: 39
- Source Policy records: 39
- Source Policy review state: 39 pending / manual-reference-only
- populated common objective metrics: 38
- companies with verified revenue growth + operating margin: 19 / 20
- verified sector-specific KPIs: 11
- common metric definitions: 6
- sector KPI definitions: 10
- constitutional articles enforced by CI: 9
- evidence-backed relationship edges: 0

### Common metric coverage

19 companies currently have a latest-quarter revenue-growth snapshot and operating-margin snapshot tied to a primary-source document. Fujikura remains `N/A` because the current FY2026 Q1 material is visible on the official IR site but a stable document-level source URL has not yet been reliably retrieved. Older documents are not substituted merely to fill the slot.

### Still intentionally N/A

- PER TTM
- PER FY1
- PBR
- Atlas-normalized ROIC

These fields are not populated from arbitrary finance websites. PER/PBR require an approved market-price source with terms review; FY1 PER additionally requires a licensed/approved forward-consensus source. ROIC will be calculated from primary financial statements under an Atlas-normalized definition.

## Sector KPI examples now live

- NVIDIA: Data Center revenue growth
- TSMC: advanced-technology wafer revenue share
- Micron: Cloud Memory / Core Data Center revenue
- Broadcom: AI semiconductor revenue and YoY growth
- Vertiv / Eaton: organic sales growth
- Equinix: recurring-revenue growth and net interconnection additions
- FANUC: robot-segment revenue growth

## Data architecture added in v0.2

- document-level Source registry separated from IR-hub registry
- matching document Source Policy registry
- sector KPI definition registry
- verified sector KPI records
- CI validation for company IDs, Source IDs, policy completeness, metric definitions, KPI definitions, provenance metadata, and verified publication status

## Current validation snapshot

Latest successful CI validation:

`20 companies / 8 layers / 39 sources / 39 source policies / 38 populated common metrics / 11 verified sector KPIs / 6 common metric definitions / 10 sector KPI definitions / 9 constitutional articles`

Secret scan, Astro production build, Japanese Pagefind indexing, artifact upload, and GitHub Pages deployment all succeeded.

## Next phase

1. freeze the valuation and ROIC methodology;
2. build primary-statement input records for normalized ROIC;
3. define the approved market-price-source contract for PER TTM and PBR;
4. keep FY1 PER N/A until a licensed/approved consensus source is selected;
5. add quarterly time-series records and self-generated charts;
6. continue sector KPI expansion by layer;
7. begin evidence-backed supplier/customer relationship edges;
8. review Source usage terms before any automated retrieval is enabled.

## User input required later

Only when crossing the relevant boundary:

- whether paid/licensed market-data or consensus APIs are allowed;
- final approval/revision of subjective score definitions and values;
- legal/policy re-review before monetization or materially broader public use under Constitution Article 9.
