# Company Evidence UX / Schema v0.2 Pilot Revision

- Status: five-company Pilot revision; **not frozen**
- Effective for re-test: 2026-08-31
- Base contract: `company-evidence-ux-spec-v01.md` and `company-evidence-schema-v01.json`
- Decision input: `company-evidence-ux-review-v01.md`
- Companies: NVIDIA, TSMC, Applied Materials, Fujikura, Vertiv only

## 1. Purpose and boundary

v0.2 applies the Human UX / Information Reduction Review to the same five Pilot companies. It prepares a testable UI and the minimum supporting contract changes. It does not authorize Schema/UI Freeze, Source Policy approval, the 100-company Evidence Coverage Audit, or the 100-company rollout.

The canonical relationship remains:

`Company Claim → Evidence Binding → Shared Source Registry`

Legacy company fields remain read-only migration inputs and fallbacks for the other 95 companies. They are not automatically promoted to `verified` claims.

## 2. Thirty-second hierarchy

The first Company Evidence section contains four user questions:

1. What does the company do?
2. Where is it in AI infrastructure?
3. What are its core products or technologies?
4. Why is it competitively important?

The public presentation groups AI Infrastructure Role and Value Chain Position under one `AIインフラでの位置` unit. The two categories and Evidence Bindings remain separate internally.

Each company has five P1 claims rendered in four visual groups: Overview, AI Role plus Value Chain, Products, and one company-positioning claim. The competitive claim retains the `company-positioning` epistemic type and must not be restated as an Atlas fact.

## 3. Priority revision

| Version | P1 | P2 | P3 | Total |
|---|---:|---:|---:|---:|
| v0.1 | 20 | 19 | 0 | 39 |
| v0.2 | 25 | 9 | 4 | 38 |

v0.2 changes:

- five evidence-backed competitive claims move from P2 to P1;
- NVIDIA networking detail, Applied EPIC strategy, Fujikura commercialization detail, and Vertiv future-generation strategy move to P3;
- Fujikura's non-disclosure editorial rule is removed from the public Risks claim list and retained as Coverage meaning;
- all other claim statements remain unchanged.

Priority controls display density, not evidence quality. The public UI does not display P1/P2/P3 on cards; the value remains available in Advanced provenance.

## 4. Section contract

Pilot page order:

1. `会社・製品・競争力` — four-part P1 summary;
2. `製品・技術の詳細` — P2/P3 Technology and Customer detail;
3. `競争ポジション` — P2/P3 Strategy/detail plus existing competitor links;
4. `主要拠点` — only when a Facility/Capacity claim or Facility record exists;
5. `財務・主要KPI` — existing financial table with KPI as a subsection;
6. `ROIC計算根拠` — unchanged when present;
7. `リスク・確認点` — only when a material risk claim exists;
8. `収録状況` — complete advanced Coverage view;
9. `出典` — usage-grouped, collapsed provenance.

Customer, Capacity, and Strategy do not become empty top-level sections. A missing or not-applicable category must remain discoverable in Coverage even when its section is not rendered.

The other 95 company pages keep the v0.1/legacy section behavior.

## 5. Display taxonomy

Internal claim types remain unchanged. Public labels are reduced as follows:

| Internal | Public label |
|---|---|
| `fact` | 事実 |
| `company-guidance` | 会社見解 |
| `company-positioning` | 会社見解 |
| `atlas-analysis` | Atlas分析 |
| `estimate` | Atlas分析 |

Internal subtype, confidence, and priority remain in Advanced provenance. Color is supplementary; every card and accessible name contains a textual epistemic label.

## 6. Status hierarchy

Claim-level `verificationStatus` is the primary Evidence state for the five Pilot pages. Legacy company-level `sourceStatus` remains in company JSON but is not displayed in the Pilot hero.

Visible labels are presentation mappings only:

| Internal | Short visible label | Full accessible/drawer meaning |
|---|---|---|
| `verified` | 確認済み | 根拠箇所まで確認済み |
| `source-linked` | 一次資料あり | 一次資料紐付け済み・確認未了 |
| `needs-review` | 要確認 | 要再検証 |

Freshness is an independent time state and must not be used as a verification label.

## 7. Coverage and Missingness

Coverage is aggregated once per rendered section. The visible summary reports counts such as `一部収録 2 / 未収集 1`; category-specific reasons and notes are inside the disclosure. The page-level Coverage section provides the complete advanced view for categories whose top-level section is omitted.

Internal and public Missing Status mapping:

| Internal | Public |
|---|---|
| `not-collected` | 未収集 |
| `primary-source-unchecked` | 一次資料未確認 |
| `not-disclosed` | 非開示 |
| `not-applicable` | 対象外 |

`missingStatus` is required for `not-started`. A `partial` record may also contain `missingStatus` when the collected subset has a specific missing reason; in that case v0.2 requires an explanatory `notes` value.

## 8. Evidence badge and drawer

Each visible claim retains one keyboard-focusable Evidence button. Visible text is `根拠 n · <short state>`; the accessible name preserves the full verification meaning.

Basic drawer view prioritizes:

- epistemic label and claim context;
- information date (`asOf`);
- Source publisher/title;
- primary Source action.

Advanced provenance contains:

- full verification state;
- freshness and exact next-review date;
- confidence where applicable;
- publication/retrieval/Locator-check dates;
- internal priority;
- structured Locator.

The drawer must support click, keyboard focus, Escape, close control, focus return, no horizontal overflow, and the two-click path from claim to primary Source.

## 9. Freshness contract

`src/lib/evidence-freshness.ts` is the only Pilot UI freshness derivation helper. It accepts `nextReview` and an optional reference `Date`, compares date-only UTC values, and returns:

- `current` through `nextReview`;
- `review-due` for the following 90 days;
- `stale` after the grace period;
- `not-applicable` when no next review exists.

Components must not hard-code a build/review date. Tests may pass an explicit reference date for deterministic assertions.

## 10. Shared Source Registry contract

`src/data/source-registry-manifest.json` lists the Source shards. `src/lib/source-registry.ts` is the page-facing resolver. Consumers resolve Source IDs through this module rather than enumerating shards.

Resolver rules:

1. each manifest shard must exist and contain an array;
2. missing `publishedAt` is normalized to explicit `null` in the resolved record;
3. `publishedAt: null` displays as `日付不明`; dates are never inferred;
4. duplicate IDs are compatible only when `companyId` and URL match;
5. for compatible duplicates, the later manifest shard supplies canonical metadata;
6. a conflicting duplicate ID fails the build/validator;
7. registry records are not deleted merely because they are not visible on a page.

The Pilot Source section prioritizes claim Sources, then Financial/KPI Sources, then Facility Sources. Registry-only company Sources are placed under `その他の登録Source`.

## 11. Source Policy governance task before Freeze

v0.2 does not approve a Source Policy. All 38 claims may remain `source-linked`; zero `verified` claims is expected.

Before Freeze, an authorized reviewer must:

1. select a Source and read the applicable terms/policy;
2. record terms URL, review date, retrieval allowance, redistribution/commercial-use limits, attribution, and known caveats;
3. set `reviewStatus: reviewed` only after that review;
4. run the Pilot validator against a claim with `supports` Evidence and a concrete Locator;
5. confirm no unresolved `contradicts` Evidence and that the review is current;
6. obtain the designated governance approval.

Automation and this Pilot revision must not self-approve policies.

## 12. Mobile and table contract

- The Pilot hero omits the competing company-level status and uses a two-column metadata snapshot at 360px.
- Secondary identity metadata and tags must not push the P1 summary excessively downward.
- The page exposes a horizontally scrollable, visibly bounded mobile section navigator.
- Wide Financial/KPI/Facility tables remain inside focusable scroll containers; page-level horizontal overflow is forbidden.
- The drawer close control remains a single horizontal label at 360px.

## 13. Validation and next gate

The v0.2 Pilot validator checks fixed company scope, IDs, Evidence bindings, categories, statuses, exact P1/P2/P3 counts, one competitive P1 per company, partial Missing Status semantics, Locators, manifest/resolver coverage, shared freshness usage, and forbidden non-Pilot/financial changes.

After automated validation and browser re-test, the only next gate is the formal five-person protocol in `company-evidence-human-test-protocol-v01.md`.

**Ready for Freeze remains NO until the human acceptance thresholds and all Freeze criteria pass.**
