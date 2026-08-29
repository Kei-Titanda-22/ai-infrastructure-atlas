# AI Infrastructure Atlas Roadmap

`docs/constitution.md` applies to every version. Each Web release must end with a browser-accessible deployed URL; repository or ZIP completion alone does not close a milestone.

Version numbers represent the **main completion target of each phase**, not the first appearance of a feature. Some later-stage functions are already prototyped and remain available, but they do not cause the project to skip milestones.

## v0.1 — 20社・静的データ

Status: **Complete**

Completion criteria:

- [x] Core 20 companies
- [x] static company data
- [x] company directory
- [x] company detail pages
- [x] technology tags and search
- [x] value-chain entry point
- [x] browser-accessible GitHub Pages deployment
- [x] project constitution and source registries
- [x] no real-time stock-price distribution

## v0.2 — 100社・セクターマップ

Status: **Complete**

Completion criteria:

- [x] 100 companies
- [x] process / technology / region taxonomy
- [x] value-chain / sector-map navigation
- [x] 100-company search and filtering
- [x] existing company URLs preserved
- [x] Source policy and provenance rules applied to new records
- [x] CI regression guard for the 100-company baseline

## v0.3 — 企業比較

Status: **Complete**

Completion criteria:

- [x] search and add companies from the 100-company universe
- [x] 2–5 company comparison; 3–5 recommended
- [x] 8 sector comparison presets
- [x] comparison set stored in URL
- [x] product / technology / facility comparison
- [x] financial rows with period / basis / verification / source
- [x] explicit `比較可 / 条件注意 / 比較不能` states
- [x] sector-specific KPI comparison with `参照のみ` when peer data is insufficient
- [x] subjective analysis separated from objective comparison
- [x] v0.3 comparison-template CI validation

## v0.4 — 決算データ

Status: **In progress**

Primary target:

- [x] normalized quarterly / annual financial-history schema
- [x] first audited-history migration and v0.4 validator
- [x] in-house generated financial-history charts
- [ ] broaden quarterly and annual financial history
- [ ] revenue / operating profit / operating margin / FCF / Capex coverage
- [ ] PER / PBR / ROIC only where source and definition requirements are satisfied
- [ ] earnings update history
- [ ] document-level primary-source provenance across the expanded history
- [ ] company detail pages consume historical financial data
- [ ] comparison page consumes normalized historical financial data without changing the v0.3 URL contract

## v0.5 — 自動更新

Automation begins only for sources whose policy record explicitly permits the intended use.

Primary target:

- scheduled retrieval for approved sources
- append-only raw snapshots where practical
- normalization and calculation tests
- freshness state
- build only after provenance/schema validation succeeds
- material-change log
- no real-time stock-price redistribution
- API keys never committed to GitHub

## v1.0 — AI Infrastructure Atlas

Primary target:

- 100+ company research database with stable taxonomy
- value-chain and sector maps
- mature company comparison
- audited financial history
- evidence-backed company claims and relationships
- controlled automatic updates
- consistent Japanese-first research UI
- production-quality documentation and governance

## Review gate before broader publication / monetization

Before materially broader public distribution, paid access, or collection of personal information, re-review financial-regulation requirements, the Act on Specified Commercial Transactions where applicable, privacy/personal-data handling, source/API/content licensing and redistribution, terms of service, and disclaimers.
