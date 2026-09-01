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
| A2 | ASM International, KLA, Corning, Credo, Digital Realty, Johnson Controls | merged / Pages checked | [#123](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/pull/123) | `74d93a355af9234f7b25ad0e858b4558d82b0524` | [success](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/actions/runs/33467217195) |
| A3 | ABB, AMD, Amphenol, Arista, ASMPT, Besi | merged / Pages checked | [#124](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/pull/124) | `35fe57e5e7bce7e112fd6831eeab0bbf409d209e` | [success](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/actions/runs/33468227767) |
| A4 | Lasertec, Lumentum, SMIC, TE Connectivity, Tower Semiconductor | merged / Pages checked | [#125](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/pull/125) | `adef2e6a895740fd2097f2f535c50ab1da02b00a` | [success](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/actions/runs/33468866902) |
| B1 | Broadcom, Carrier, Ciena, Cisco, Coherent, Furukawa Electric, GlobalFoundries, Intel, KOKUSAI ELECTRIC, Lam Research | ready for PR | pending | pending | pending |

## Batch A2

- Baseline coverage per company: complete `0` / partial `5` / not-started `6`
- Baseline maturity per company: `L1`
- Sources: existing Shared Sources reused `7`; added `0`; duplicate Source IDs `0`
- Result: merged; main Actions success; public Pages checked

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

- Baseline main: `74d93a355af9234f7b25ad0e858b4558d82b0524`
- Baseline coverage per company: complete `0` / partial `5` / not-started `6`
- Baseline maturity per company: `L1`
- Sources: existing Shared Sources reused `3`; added `4`; duplicate Source IDs `0`
- Result: merged; main Actions success; public Pages checked

| Company | Before | After | Claims / Evidence / Locators | P1 / P2 / P3 | Remaining gaps |
| --- | --- | --- | --- | --- | --- |
| ABB | 0 / 5 / 6 | 4 / 6 / 1 | 10 / 10 / 10 | 5 / 5 / 0 | 6 partial; capacity not-started |
| AMD | 0 / 5 / 6 | 3 / 6 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 6 partial; own manufacturing and capacity not-applicable |
| Amphenol | 0 / 5 / 6 | 4 / 5 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 5 partial; capacity and strategy not-started |
| Arista | 0 / 5 / 6 | 3 / 6 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 6 partial; own manufacturing and capacity not-applicable |
| ASMPT | 0 / 5 / 6 | 4 / 6 / 1 | 10 / 10 / 10 | 5 / 5 / 0 | 6 partial; capacity not-started |
| Besi | 0 / 5 / 6 | 4 / 7 / 0 | 11 / 11 / 11 | 5 / 6 / 0 | 7 partial |

- Batch Claims / Evidence / structured Locators: `58 / 58 / 58`
- Batch priority: P1 `30` / P2 `28` / P3 `0`
- Verification: `source-linked 58`; `verified 0`; policy approval changes `0`
- Batch coverage delta: complete `+22`; partial `+6`; not-started `-28`
- Global coverage: `50 / 510 / 540 → 72 / 516 / 512`
- Global maturity: `L1 84 → 78`; `L4 13 → 19`
- SOFT DEFER: `44` unresolved Category records (`36` partial + `8` not-started)
- HARD STOP: `0`
- Browser QA: all six companies passed at `1024px` and `360px`; document overflow `0`, Evidence marker and Source link present, visible Evidence targets `44 × 44px`. ABB and Besi passed drawer, Primary Source, Escape, focus return, and Supplementary Research checks.
- Protection: financial diff `0`; Pilot 5 and Arm / ASML source diff `0`; generated HTML hashes unchanged; unrelated company Evidence diff `0`.

## Batch A4

- Baseline main: `35fe57e5e7bce7e112fd6831eeab0bbf409d209e`
- Baseline coverage per company: complete `0` / partial `5` / not-started `6`
- Baseline maturity per company: `L1`
- Sources: existing Shared Sources reused `5`; added `2`; duplicate Source IDs `0`
- Result: merged; main Actions success; public Pages checked

| Company | Before | After | Claims / Evidence / Locators | P1 / P2 / P3 | Remaining gaps |
| --- | --- | --- | --- | --- | --- |
| Lasertec | 0 / 5 / 6 | 3 / 6 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 6 partial; facilities and capacity not-started |
| Lumentum | 0 / 5 / 6 | 4 / 7 / 0 | 11 / 11 / 11 | 5 / 6 / 0 | 7 partial |
| SMIC | 0 / 5 / 6 | 5 / 6 / 0 | 11 / 11 / 11 | 5 / 6 / 0 | 6 partial |
| TE Connectivity | 0 / 5 / 6 | 4 / 5 / 2 | 9 / 9 / 9 | 5 / 4 / 0 | 5 partial; capacity and strategy not-started |
| Tower Semiconductor | 0 / 5 / 6 | 5 / 6 / 0 | 11 / 11 / 11 | 5 / 6 / 0 | 6 partial |

- Batch Claims / Evidence / structured Locators: `51 / 51 / 51`
- Batch priority: P1 `25` / P2 `26` / P3 `0`
- Verification: `source-linked 51`; `verified 0`; policy approval changes `0`
- Batch coverage delta: complete `+21`; partial `+5`; not-started `-26`
- Global coverage: `72 / 516 / 512 → 93 / 521 / 486`
- Global maturity: `L1 78 → 73`; `L4 19 → 24`
- SOFT DEFER: `34` unresolved Category records (`30` partial + `4` not-started)
- HARD STOP: `0`
- Browser QA: all five companies passed at `1024px` and `360px`; document overflow `0`, Evidence marker and Source link present, visible Evidence targets `44 × 44px`. Lumentum and Tower Semiconductor passed drawer, Primary Source, Escape, focus return, and Supplementary Research checks.
- Protection: financial diff `0`; Pilot 5 and Arm / ASML source diff `0`; generated HTML hashes unchanged; earlier enrichment shards and unrelated company Evidence diff `0`.

## Completion summary

- Priority A target companies completed: `17 / 17`
- Total Claims / Evidence / structured Locators: `167 / 167 / 167`
- Total priority: P1 `85` / P2 `80` / P3 `2`
- Verification: `source-linked 167`; `verified 0`; Source Policy approvals `0`
- Sources: existing Shared Sources reused `15`; added `6`; duplicate Source IDs `0`
- Coverage: `28 / 504 / 568 → 93 / 521 / 486` (complete / partial / not-started)
- Maturity: L1 `90 → 73`; L4 `7 → 24`
- SOFT DEFER across target companies: `122` Category records (`102` partial + `20` not-started)
- HARD STOP: `0`
- Batch PRs: [#123](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/pull/123), [#124](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/pull/124), [#125](https://github.com/Kei-Titanda-22/ai-infrastructure-atlas/pull/125)
- Ready for Priority B autonomous enrichment: **YES**
- Priority B execution started: **YES**

## Priority B start cohort

- Cohort baseline main: `418c7a919405afe2ce6f57d68a0374f5acbdaeff`
- Cohort rule: latest Coverage Auditから `claimCount = 0` かつ `maturity != L4` を機械抽出し、完了済み24社を除外
- Cohort size: `76`
- Baseline coverage: complete `93` / partial `521` / not-started `486`
- Baseline maturity: L0 `0` / L1 `73` / L2 `3` / L3 `0` / L4 `24`
- Batch allocation: `8` batches (`10 / 10 / 10 / 10 / 9 / 9 / 9 / 9` companies)

| Batch | Fixed company IDs |
| --- | --- |
| B1 | `broadcom`, `carrier`, `ciena`, `cisco`, `coherent`, `furukawa-electric`, `globalfoundries`, `intel`, `kokusai-electric`, `lam-research` |
| B2 | `legrand`, `marvell`, `micron`, `nvent`, `samsung-electronics`, `sandisk`, `schneider-electric`, `screen-holdings`, `sk-hynix`, `sumitomo-electric` |
| B3 | `trane-technologies`, `umc`, `analog-devices`, `cadence`, `canon`, `infineon`, `mitsubishi-electric`, `monolithic-power`, `onsemi`, `qualcomm` |
| B4 | `siemens-energy`, `stmicroelectronics`, `synopsys`, `amkor`, `ase-technology`, `disco`, `eaton`, `ge-vernova`, `hanmi-semiconductor`, `ibiden` |
| B5 | `jcet`, `mediatek`, `nikon`, `nxp`, `renesas`, `resonac-holdings`, `rohm`, `seagate`, `texas-instruments` |
| B6 | `western-digital`, `shinko-electric`, `aptiv`, `bosch`, `equinix`, `kinsus`, `linde`, `mobileye`, `tesla` |
| B7 | `unimicron`, `air-liquide`, `ajinomoto-fine-techno`, `denso`, `entegris`, `fanuc`, `globalwafers`, `hexagon`, `keyence` |
| B8 | `nan-ya-pcb`, `omron`, `shin-etsu-chemical`, `smc`, `sumco`, `yaskawa`, `advantest`, `tokyo-electron`, `kioxia` |

## Batch B1

- Baseline main: `418c7a919405afe2ce6f57d68a0374f5acbdaeff`
- Companies: Broadcom, Carrier, Ciena, Cisco, Coherent, Furukawa Electric, GlobalFoundries, Intel, KOKUSAI ELECTRIC, Lam Research
- Claims / Evidence / structured Locators: `70 / 70 / 70`
- Priority: P1 `50` / P2 `20` / P3 `0`
- Verification: `source-linked 70`; `verified 0`; policy approval changes `0`
- Sources: existing Shared Sources reused `0`; added `10`; duplicate Source IDs `0`
- Batch coverage delta: complete `+30`; partial `-10`; not-started `-20`
- Global coverage: `93 / 521 / 486 → 123 / 511 / 466`
- Global maturity: L1 `73 → 63`; L4 `24 → 34`
- SOFT DEFER: `80` unresolved Category records (`40` partial + `40` not-started)
- HARD STOP: `0`
- Browser QA: all ten companies passed at `1024px` and `360px`; document overflow `0`, seven Evidence markers, bibliography Source link, and `44 × 44px` marker target confirmed. Broadcom and Furukawa Electric passed drawer, Primary Source, Escape, focus return, and Supplementary Research checks with nested disclosure `0`.
- Protection: financial diff `0`; completed Company Evidence diff `0`; facilities / relationships / Global Visual System diff `0`; unrelated company Evidence diff `0`.
- Validation: Company Evidence / Freeze / Coverage `--check` / all validators / financial quality / secret scan / Astro `109` pages / Pagefind `105` pages passed.
- Result: ready for PR; merge / Actions / Pages pending

## Resume marker

All A2–A4 batches are `merged / Actions success / Pages checked`. Priority B cohort is fixed above. Resume from B1 validation or the first later batch not marked merged; never rerun a completed batch.
