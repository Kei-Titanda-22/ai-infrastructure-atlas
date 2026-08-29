# Repository Structure

```text
ai-infrastructure-atlas/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml               # validate → build → GitHub Pages deploy
├─ docs/
│  ├─ constitution.md             # binding project governance
│  ├─ architecture.md
│  ├─ data-model.md
│  ├─ repository-structure.md
│  ├─ roadmap.md
│  ├─ v0.1-scope.md
│  └─ wireframes.md
├─ scripts/
│  ├─ validate-data.py            # constitution + data integrity checks
│  └─ check-secrets.py            # heuristic committed-secret tripwire
├─ src/
│  ├─ components/
│  ├─ data/
│  │  ├─ companies/*.json         # one human-reviewed company profile per file
│  │  ├─ layers.json              # value-chain taxonomy
│  │  ├─ governance.json          # machine-readable mirror of Articles 1–9
│  │  ├─ score-definitions.json   # analysis-axis definitions
│  │  ├─ metric-definitions.json  # objective numeric definitions
│  │  ├─ relationships.json       # evidence-backed edges; empty in initial v0.1
│  │  ├─ glossary.json
│  │  ├─ sources.json             # stable source identity registry
│  │  └─ source-policies.json     # terms/licensing review registry
│  ├─ layouts/
│  ├─ lib/
│  │  └─ paths.ts
│  ├─ pages/
│  ├─ styles/
│  └─ content.config.ts
├─ astro.config.mjs
├─ package.json
├─ .nvmrc
├─ .gitignore
└─ README.md
```

## Ownership boundaries

### Human-reviewed / judgment layer

- company classification
- products / strengths / risks
- peer mapping
- score definitions
- score values and rationale
- source quality decisions

These are never overwritten by an automated financial refresh.

### Objective data layer

Any non-null number must carry Source/as-of/definition metadata. Future generated data must use the same contract for:

- quarterly and annual financial statements
- market snapshots
- valuation ratios
- Atlas-normalized ROIC
- sector KPIs

### Source-policy layer

Source identity (`sources.json`) and permission/terms state (`source-policies.json`) are deliberately separate. A source can be a valid research reference while still being blocked from automated access, redistribution, or commercial use.

### Presentation layer

Astro pages and components consume the data classes but do not become the source of truth. Charts are rendered from structured Atlas data rather than third-party chart images.

## Secret boundary

Credentials are never part of repository data. Local secrets use ignored environment files; future CI credentials use GitHub Actions Secrets. Browser-delivered static assets must not contain protected API keys.
