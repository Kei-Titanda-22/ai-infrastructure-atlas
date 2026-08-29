# v0.1 Implementation Status — 2026-08-29

## Implemented

- [x] Astro + TypeScript static-site skeleton
- [x] GitHub Pages base-path aware configuration
- [x] GitHub Pages Actions deployment workflow
- [x] 8-layer AI infrastructure taxonomy
- [x] Core 20 company records
- [x] stable company IDs and static company routes
- [x] official IR hub Source IDs for all Core 20 companies
- [x] Astro Content Collection + Zod schema contract
- [x] Home
- [x] Atlas
- [x] Companies directory
- [x] instant company filtering by text/layer/country
- [x] company detail pages
- [x] 4-company comparison
- [x] score direction + magnitude display
- [x] Pagefind post-build full-text search integration
- [x] Methodology
- [x] Glossary
- [x] data integrity validation script
- [x] page wireframes and repository ownership documentation

## Deliberately not populated yet

- [ ] verified PER TTM / PER FY1 / PBR
- [ ] Atlas-normalized ROIC
- [ ] verified operating margin / revenue growth snapshots
- [ ] quarterly earnings time series
- [ ] sector-specific KPIs
- [ ] evidence-backed supplier/customer relationship graph
- [ ] final user-owned sensitivity / moat scores

Financial slots remain `null` and render as `N/A`. No synthetic market values are included merely to make the prototype appear complete.

## Validation snapshot

- companies: 20
- primary value-chain layers: 8
- official IR hub sources: 20
- provisional score objects: 80
- non-null universal financial metric values: 0
- relationship edges: 0

## Build-validation limitation

Repository structure, JSON data, relative imports, CSS brace structure, GitHub Actions YAML, and custom data integrity rules were checked in the authoring environment.

A real `astro build` / Pagefind build has **not** been executed here because the sandbox could not reliably resolve the npm registry, so Astro/Pagefind dependencies could not be installed. This is the remaining technical verification before calling v0.1 deployable rather than deploy-ready source.

## Next research work that does not require user input

1. document-level source verification for the 20 company profiles;
2. financial ingestion contract and normalized metric files;
3. sector-KPI schema by layer;
4. evidence model for relationships;
5. first verified data population.

## User input required later

Only when crossing the relevant boundary:

- **GitHub publication:** repository/account connection or destination repository.
- **Market-data automation:** whether automation must be free/public-source only or may use a paid/licensed market-data API.
- **Final scoring:** approval/revision of score definitions and final values; provisional values must not silently become the user's judgment.
