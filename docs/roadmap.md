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

Extra functions such as comparison, financial tables and provenance validation were implemented early and remain in place.

## v0.2 — 100社・セクターマップ

Status: **In progress**

Primary target:

- expand from 20 to about 100 companies
- strengthen process / technology / region taxonomy
- build sector maps that make peer groups and upstream/downstream positioning visible
- maintain fast search and filtering at 100-company scale
- preserve existing company URLs and data contracts
- apply Source / date / definition / verification-state rules to all new data

Expansion details are tracked in `docs/v0.2-scope.md`.

## v0.3 — 企業比較

Primary target:

- mature the existing comparison prototype into a core workflow
- 3–5 company comparison presets
- comparable-period checks
- product / technology / factory / financial comparison
- sector-specific comparable metrics
- explicit reasons when comparison is not valid

## v0.4 — 決算データ

Primary target:

- quarterly financial history
- revenue / operating profit / margin / FCF / Capex
- PER / PBR / ROIC where source and definition requirements are satisfied
- in-house generated charts
- earnings update history
- document-level primary-source provenance

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
