# Data Model

## Principle

Separate data by update frequency and epistemic status.

### 1. Company profile

Low-frequency, human-reviewed:

- immutable `id`
- official / Japanese / reading names
- ticker / exchange / country
- primary layer and multi-layer membership
- products
- strengths
- risks
- competitor IDs
- AI role

### 2. Scores

Human-controlled comparison framework:

- `value`: 0–5
- `direction`: positive / negative / mixed / neutral
- `confidence`: low / medium / high
- `status`: provisional / reviewed
- `rationale`

The current values are provisional UI data. Final definitions and values remain user-owned.

### 3. Universal metrics

Every metric object carries:

```text
value
unit
basis
asOf
period
sourceId
```

A missing value is `null`.

Universal v0.1 metric slots:

- P/E TTM
- P/E FY1
- P/B
- ROIC
- operating margin
- revenue growth YoY

### 4. Sector KPIs (next phase)

Stored separately because they are not cross-sector comparable:

- Memory: HBM mix, bit growth, ASP, inventory
- WFE: WFE exposure, installed base, service mix, backlog
- Networking: 400G/800G/1.6T mix, AI cluster exposure
- Data center REIT: FFO/AFFO, occupancy, power capacity
- Power/cooling: backlog, organic orders, data-center mix

### 5. Relationships

Future schema:

```text
sourceCompanyId
targetCompanyId
type
productOrProcess
evidenceLevel
importance
validFrom
validTo
sourceIds[]
lastVerified
```

`evidenceLevel` must distinguish disclosed / strongly supported / inferred. Inferred edges should be hidden by default.

## Source model

The v0.1 registry already assigns a stable Source ID to each company’s official IR hub. Document-level sources will use the same model:

```text
id
publisher
title
url
publishedAt
retrievedAt
sourceType
period
language
```

Company and metric records reference `sourceId` rather than embedding source text.
