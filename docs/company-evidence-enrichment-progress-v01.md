# Company Evidence Enrichment Progress v0.1

- Resume authority: `docs/company-evidence-enrichment-runbook-v01.md`
- Initial baseline main: `e93990f1e16273fadc46b22ef47ddcc406d44544`
- Initial global coverage: complete `28` / partial `504` / not-started `568`
- Initial maturity: L0 `0` / L1 `90` / L2 `3` / L3 `0` / L4 `7`
- Source Policy approval during enrichment: **NO**
- HARD STOP count: `0`

## Batch status

| Batch | Companies | Status | PR | Merge SHA | Actions |
| --- | --- | --- | --- | --- | --- |
| A2 | ASM International, KLA, Corning, Credo, Digital Realty, Johnson Controls | in progress | pending | pending | pending |
| A3 | ABB, AMD, Amphenol, Arista, ASMPT, Besi | pending | pending | pending | pending |
| A4 | Lasertec, Lumentum, SMIC, TE Connectivity, Tower Semiconductor | pending | pending | pending | pending |

## Batch A2

- Baseline coverage per company: complete `0` / partial `5` / not-started `6`
- Baseline maturity per company: `L1`
- Sources: existing Shared Sources reused `7`; added `0`; duplicate Source IDs `0`
- Result: local full gate passed; PR / merge / deployment pending

| Company | Before | After | Claims / Evidence / Locators | P1 / P2 / P3 | Remaining gaps |
| --- | --- | --- | --- | --- | --- |
| ASM International | 0 / 5 / 6 | 4 / 7 / 0 | 11 / 11 / 11 | 5 / 5 / 1 | 7 partial |
| KLA | 0 / 5 / 6 | 4 / 5 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 5 partial; capacity and strategy not-started |
| Corning | 0 / 5 / 6 | 4 / 5 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 5 partial; capacity and strategy not-started |
| Credo | 0 / 5 / 6 | 3 / 6 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 6 partial; own manufacturing and capacity not-applicable |
| Digital Realty | 0 / 5 / 6 | 4 / 7 / 0 | 11 / 11 / 11 | 5 / 5 / 1 | 7 partial |
| Johnson Controls | 0 / 5 / 6 | 3 / 6 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 6 partial; facilities and capacity not-started |

- Batch Claims / Evidence / structured Locators: `58 / 58 / 58`
- Batch priority: P1 `30` / P2 `26` / P3 `2`
- Verification: `source-linked 58`; `verified 0`; policy approval changes `0`
- Batch coverage delta: complete `+22`; partial `+6`; not-started `-28`
- Global coverage: `28 / 504 / 568 → 50 / 510 / 540`
- Global maturity: `L1 90 → 84`; `L4 7 → 13`
- SOFT DEFER: `44` unresolved Category records (`36` partial + `8` not-started)
- HARD STOP: `0`
- Browser QA: all six companies passed at `1024px` and `360px`; document overflow `0`, Evidence marker and Source link present. ASM International and Digital Realty passed drawer, Primary Source, Escape, focus return, and Supplementary Research checks.
- Protection: financial diff `0`; Pilot 5 and Arm / ASML source diff `0`; generated HTML hashes unchanged; unrelated company Evidence diff `0`.

## Batch A3

- Result: pending

## Batch A4

- Result: pending

## Resume marker

Resume from the first batch whose status is not `merged / Actions success / Pages checked`. Within that batch, compare its Evidence shard against this section and resume at the first company without a complete recorded result. Never rerun a completed batch from an older branch.
