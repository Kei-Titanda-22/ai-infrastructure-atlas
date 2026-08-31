# Company Evidence Human UX Review / Information Reduction Review v0.1

- Review date: 2026-08-31 (JST)
- Review target: `origin/main` at `5ba61e6938116019d4bd1d94b6ec4d8a9d4b79ea`
- Published site: `https://kei-titanda-22.github.io/ai-infrastructure-atlas/`
- Pages: NVIDIA, TSMC, Applied Materials, Fujikura, Vertiv
- Viewports: desktop 1280 × 900, mobile 360 × 800
- Review type: expert heuristic review and information-reduction audit
- Scope boundary: review only. No production UI, schema, company data, Source Policy, validator, PR, Freeze, audit, or rollout change is made by this review.

## 1. Executive summary

**Decision: Ready for Freeze = NO.**

The five Pilot pages make company identity, a one-line company description, and the first AI-infrastructure positioning claim understandable. The implementation also provides a valid claim-specific two-click path to a primary Source. However, the accepted 30-second contract is not yet met as a complete four-question experience.

The central issue is information hierarchy, not lack of information. On desktop, Products begins at 1.33–1.42 viewports and Competitive Advantage at 1.85–1.91 viewports. On mobile, Products begins at 1.87–1.90 viewports and Competitive Advantage at 2.54–2.59 viewports. Moreover, the claim that explains competitive importance is P2 and collapsed for four companies; TSMC has no explicit competitive-positioning claim and relies on the 3DFabric technology claim. A first-time reader therefore cannot answer “what is competitively important?” from the initial P1 presentation without searching.

The pages are evidence-rich but repeat operational metadata too often: 39 long Evidence badges repeat the same status phrase, 34 Missing/Coverage rows appear across the five pages, company-level status can disagree with claim-level status, and the final Source lists contain 23 cards even though four IR hub cards have no matching link elsewhere in the rendered page. The Evidence drawer is accessible and structurally sound, but the first view mixes decision-useful provenance with audit metadata. At 360px the close button wraps vertically and the Source action is below the drawer fold.

The recommended v0.2 direction is a compact four-part summary: (1) what the company is, (2) where it sits in AI infrastructure and the value chain, (3) what it sells, and (4) why it is competitively important. Keep claim-level evidence as the primary status model, shorten the visible badge to `根拠 1` plus a short state, aggregate coverage at section level, preserve epistemic type labels, and move audit metadata into an advanced drawer tier.

This review is not a substitute for the specified five-person usability test. Even after the blocking hierarchy issues are revised, the formal 4/5 30-second and 5/5 Fact/Analysis tests remain required.

## 2. Method and review limits

Each published page was opened in the real in-app browser at both target widths, inspected from the top, and physically scrolled to the bottom. Initial fold contents, section positions, page height, Evidence badge count, Coverage content, Source links, table overflow, drawer content, accessible names, and focus return were checked. The 39 Pilot claims and their Source/Evidence/Coverage records were then compared with the formal schema, UX specification, Pilot report, legacy company fields, and current page composition.

The browser review confirms expert comprehension and interaction behavior. It does not claim results from five independent human participants.

## 3. Five-company comparison

| Company | Claims (P1/P2/P3) | Evidence badges | Coverage rows | Source cards | Desktop length | Mobile length | Initial desktop fold | Initial mobile fold |
|---|---:|---:|---:|---:|---:|---:|---|---|
| NVIDIA | 4 / 3 / 0 | 7 | 7 | 6 | 5.2 screens | 7.6 screens | identity, Overview, first AI-position claim | identity and Overview only |
| TSMC | 4 / 4 / 0 | 8 | 6 | 5 | 5.1 screens | 7.5 screens | identity, Overview, first AI-position claim | identity and Overview only |
| Applied Materials | 4 / 4 / 0 | 8 | 7 | 4 | 4.2 screens | 6.3 screens | identity, Overview, first AI-position claim | identity and Overview only |
| Fujikura | 4 / 4 / 0 | 8 | 7 | 4 | 4.7 screens | 7.0 screens | identity, Overview, first AI-position claim | identity and Overview; extra Overview coverage notice starts |
| Vertiv | 4 / 4 / 0 | 8 | 7 | 4 | 4.5 screens | 6.6 screens | identity, Overview, first AI-position claim | identity and Overview only |

Notes:

- “Coverage rows” counts individual category notices, not the four or five grouped notice containers.
- The desktop sidebar repeats the primary layer and last-reviewed metadata already present in the hero.
- The mobile page has no global horizontal overflow, but large financial/KPI tables use 760–1330px internal scroll surfaces inside a 321px container.

## 4. 30-second comprehension review

### 4.1 Result

| Question | NVIDIA | TSMC | Applied Materials | Fujikura | Vertiv |
|---|---|---|---|---|---|
| What company is this? | immediate | immediate | immediate | immediate | immediate |
| Where is it in AI infrastructure? | desktop immediate; mobile slight search | desktop immediate; mobile slight search | desktop immediate; mobile slight search | desktop immediate; mobile slight search | desktop immediate; mobile slight search |
| What does it sell? | search/scroll | search/scroll | search/scroll | search/scroll | search/scroll |
| What is competitively important? | hard: P2 collapsed | hard: no explicit positioning claim; 3DFabric P2 | hard: P2 collapsed | hard: P2 collapsed | hard: P2 collapsed |

**Conclusion:** the five pages do not yet satisfy the complete four-question 30-second contract. Company identity is clear, but Products and competitive importance are below the initial hierarchy. The mobile experience fails more strongly because the hero metadata consumes most of the first viewport.

### 4.2 Above-the-fold decision

The following should remain visible without opening P2/P3:

1. concise Overview;
2. one combined “AI infrastructure position” group containing AI Role and Value Chain;
3. core Products;
4. one competitive-importance claim;
5. compact Evidence affordances for each claim.

The following should not consume initial mobile space:

- full official name/readings when redundant with the heading;
- the full technology-tag list;
- company-level verification status;
- repeated layer/review metadata;
- P1/P2 editorial priority labels;
- full status prose inside every Evidence badge.

On mobile, company metadata should become a compact two-row summary or an `企業情報` disclosure so the four-part summary starts within the first viewport.

## 5. P1 / P2 / P3 review by claim

The recommendation preserves atomic claim/evidence relationships. “Merge” below means merge the public presentation group, not silently merge evidence semantics.

### 5.1 NVIDIA

| Claim | Current | Recommendation | Reason |
|---|---|---|---|
| Full-stack accelerated-computing company | P1 | keep P1; shorten | answers what the company is |
| Integrates AI-factory compute/connectivity | P1 | keep P1; group with Value Chain | core AI role |
| GPU/CPU/DPU/networking products | P1 | keep P1; move into four-part summary | answers what it sells |
| From chip design to cluster platform | P1 | keep P1; merge presentation with AI Role | semantically overlaps AI Role |
| scale-up/out/across networking detail | P2 | move to P3 | implementation/spec detail, not first comparison need |
| integrated AI platform positioning | P2 | promote to P1 | supplies the missing competitive-importance answer |
| third-party manufacturing/supply risk | P2 | keep P2 | material risk, appropriate lower-page detail |

### 5.2 TSMC

| Claim | Current | Recommendation | Reason |
|---|---|---|---|
| pure-play foundry model | P1 | keep P1; shorten | clear company identity |
| manufacturing base connecting AI design to volume | P1 | keep P1; group with Value Chain | core AI role |
| broad process manufacturing | P1 | keep P1; move into four-part summary | core offering |
| fabrication/packaging position in chain | P1 | keep P1; merge presentation with AI Role | overlaps AI Role |
| 3DFabric integration | P2 | promote to P1 after editorial rewrite | best current evidence-backed differentiation; TSMC otherwise lacks a visible competitive claim |
| global fabs | P2 | keep P2 | comparison-relevant operating footprint |
| annual 12-inch-equivalent capacity | P2 | keep P2 | comparison-relevant capacity |
| customer/product/end-market counts | P2 | keep P2 | useful comparison context, but keep collapsed |

### 5.3 Applied Materials

| Claim | Current | Recommendation | Reason |
|---|---|---|---|
| semiconductor/display equipment company | P1 | keep P1; shorten | clear identity |
| equipment layer supporting AI-chip manufacturing | P1 | keep P1; group with Value Chain | core AI role |
| formation/removal/modification/metrology portfolio | P1 | keep P1; move into four-part summary | core offering |
| supplies Fab process equipment | P1 | keep P1; merge presentation with AI Role | overlaps AI Role |
| integrated material/process optimization | P2 | keep P2 | useful technical differentiation |
| connected portfolio as differentiation | P2 | promote to P1 | supplies competitive-importance answer |
| EPIC Center co-development | P2 | move to P3 | supporting strategy detail |
| investment-cycle/customer-concentration check | P2 | keep P2 | material risk/checkpoint |

### 5.4 Fujikura

| Claim | Current | Recommendation | Reason |
|---|---|---|---|
| Japanese wire/optical communications company | P1 | keep P1; shorten | clear identity |
| high-density optical wiring for data centers | P1 | keep P1; group with Value Chain | core AI role |
| SWR/WTC optical cable | P1 | keep P1; move into four-part summary | core offering |
| cable/connection layer | P1 | keep P1; merge presentation with AI Role | overlaps AI Role |
| 4000 fibers in 23mm | P2 | keep P2 | comparison-relevant technical proof |
| 4000-fiber lineup commercialization | P2 | move to P3 | dated product-event detail |
| highest fiber count positioning | P2 | promote to P1 | supplies competitive-importance answer, with company-positioning label retained |
| non-disclosed customer/adoption rule | P2 | remove from Risks; move to Coverage/editorial note | this is a disclosure boundary, not a company business risk |

### 5.5 Vertiv

| Claim | Current | Recommendation | Reason |
|---|---|---|---|
| critical digital infrastructure company | P1 | keep P1; shorten | clear identity |
| power/cooling support for high-density AI | P1 | keep P1; group with Value Chain | core AI role |
| UPS/power/thermal/rack portfolio | P1 | keep P1; move into four-part summary | core offering |
| facility infrastructure between grid and IT | P1 | keep P1; merge presentation with AI Role | overlaps AI Role |
| liquid cooling | P2 | keep P2 | comparison-relevant technology |
| end-to-end power/cooling integration | P2 | promote to P1 | supplies competitive-importance answer |
| multi-generation integrated design | P2 | move to P3 | supporting strategy detail |
| rack/facility constraint change | P2 | keep P2 | material operational checkpoint |

### 5.6 Priority result

- Original P1 claims: retain all 20, but present each AI Role/Value Chain pair as one compact group.
- Promote five competitive claims to P1: one per company.
- Of the original 19 P2 claims: 5 promote to P1, 9 remain P2, 4 move to P3, and 1 moves out of the Risks claim list into Coverage/editorial guidance.
- The resulting public P1 set is five claims per company, within the accepted 4–6 range, while using four visual groups.

## 6. Section review

| Section | Decision | Review |
|---|---|---|
| Overview | KEEP and redesign as four-part summary | must answer all four 30-second questions |
| Value Chain | MERGE into the AI-position group | current separate section repeats AI Role and delays Products |
| Products | KEEP; P1 in summary, P2/P3 collapsed | core products are essential; specifications are not |
| Competitive Advantage | keep lower detail, but surface one P1 line in summary | current closed P2 makes competitive importance undiscoverable |
| Facilities | COLLAPSE/conditional | show as a section only for actual facility/capacity claims; move coverage-only states to Coverage summary |
| Financial | KEEP | decision-useful; provide a compact metric summary before wide audit table |
| Industry KPI | MERGE under Financial as a subsection | avoids another top-level stop while preserving sector comparison |
| Competitors | MOVE into Competitive Advantage | competitors are interpretation context, not an independent long section |
| Risks | KEEP as P2 | material risks deserve a stable location; do not place editorial missingness rules here |
| Sources | COLLAPSE | retain provenance, group by usage, and default to closed after claim-specific drawers exist |

The current top-level sequence should change from ten equally weighted sections to: Summary → Products detail → Competitive context → Facilities/Capacity when applicable → Financial & KPI → Risks → Coverage & Sources.

## 7. Status, coverage, badge, and drawer review

### 7.1 Company-level versus claim-level status

**Recommendation: option B — make claim-level status primary.**

The hero’s `情報確認状況: 一部検証済み` is a legacy coarse state. Every Pilot claim is actually `source-linked`, and none is `verified`. Showing both at equal prominence creates an avoidable semantic disagreement. Remove the company-level state from the hero and expose it only as a secondary roll-up in Coverage/Provenance, with an explicit derivation rule.

### 7.2 Coverage notice placement

**Recommendation: option B — aggregate at section level.**

The five pages show 34 individual category rows. They are accurate, but they interrupt reading after most P2 groups. A compact section footer should state, for example, `収録 1 / 一部 2 / 未収録 1`, with the distinct reasons available in one disclosure. Do not move all missingness to the page top, because it would compete with comprehension; do not hide all missingness only in the Evidence drawer, because missing categories have no claim badge.

### 7.3 Evidence badge

**Recommendation: option B, with option D behavior as a supplement.**

Use a small visible text control such as `根拠 1` plus a short state (`確認中`, `確認済`, `要確認`). Keep the full phrase in the accessible name and reveal more emphasis on hover/focus. The current 360px badge is 289px wide inside a 321px content area and repeats the same 18-character status phrase 39 times.

### 7.4 Evidence drawer hierarchy

Keep in the first view:

- epistemic type (`事実`, `会社説明/見通し`, `Atlas分析`);
- concise claim title and statement;
- short verification state;
- `asOf` and freshness state;
- Source publisher/title;
- structured Locator;
- primary Source action;
- confidence for Atlas analysis/estimate.

Move into `詳細な来歴`:

- raw status token;
- `retrievedAt`, `lastChecked`, and `nextReview` exact dates when freshness already summarizes them;
- `publishedAt: 日付不明` detail;
- support relation and internal notes;
- repeated priority (`P1/P2/P3`).

The drawer passes important interaction checks: the badge has a descriptive accessible name, the drawer is exposed as a titled dialog, the close control is named, the Source link is present, and closing returns focus to the originating badge. The primary Source remains two clicks away. Blocking presentation issues remain: the 360px close button renders `閉 / じ / る` vertically, the Source action is below the mobile drawer fold, the claim title/statement repeat the underlying card, and the 1280px drawer occupies half the viewport while leaving large unused space.

## 8. Fact / Analysis review

The current blue Fact cards and amber Atlas Analysis cards, permanent text labels, and accessible article names are strong. `会社説明` is also distinguishable from both. Keep the epistemic labels and color-independent card treatment.

Reduce public taxonomy to three visible families:

1. `事実`;
2. `会社説明` (covering company-positioning and company-guidance, while retaining the internal subtype);
3. `Atlas分析` (including estimate only when methodology/confidence requirements are met).

Hide P1/P2/P3 from the ordinary reader; priority is an editorial density mechanism, not evidence strength. This avoids users reading `P1` as a verification score.

The formal “5 of 5 users do not confuse Fact and Atlas Analysis” criterion is still untested and remains a Freeze blocker.

## 9. Missingness review

Internal statuses remain useful and should not be collapsed in the schema:

| Internal status | Recommended visible label |
|---|---|
| `not-collected` | 未収録 |
| `primary-source-unchecked` | 一次資料未確認 |
| `not-disclosed` | 非開示 |
| `not-applicable` | 対象外 |

Keep the distinction, but remove parenthetical stacking such as `一部収録（非開示）` from repeated cards. Show a short section summary and provide reasons in the section disclosure. Do not render a standalone Facilities or Risks section solely to display an empty-state notice.

## 10. Duplication and legacy audit

### 10.1 Quantitative findings

- 39 Evidence badges repeat the same full `source-linked` status prose.
- 34 Coverage rows appear in 21 grouped notice containers.
- 23 Source cards appear at page bottoms: NVIDIA 6, TSMC 5, and 4 each for Applied Materials, Fujikura, and Vertiv.
- Four IR hub cards (NVIDIA IR, TSMC Investors, Applied Materials IR, Vertiv IR) have no matching same-URL link elsewhere in the rendered page. They may remain registry inputs, but should not be displayed without a declared page usage.
- Primary-layer and last-reviewed metadata are shown in the hero and repeated in the desktop sidebar.
- When a drawer opens, its title and statement repeat the originating claim card. This helps context but should not be duplicated at full length on mobile.

### 10.2 Exact versus semantic duplication

No Pilot page displays legacy `summary`, `aiRole`, `products`, `strengths`, and `risks` prose simultaneously with the Evidence-backed text in the same section; the Pilot correctly chooses one representation. The legacy standalone `主張と根拠` section is also suppressed for the five companies.

Semantic duplication remains between:

- AI Role and Value Chain P1 claims;
- company-level status and claim-level verification status;
- hero metadata and desktop sidebar metadata;
- claim badge/drawer Source links and the complete bottom Source list;
- separate Financial and KPI sections;
- Competitive Advantage and Competitors sections.

After migration approval, legacy narrative must remain a fallback only, never a second visible layer and never an automatic `verified` source.

## 11. Mobile review

Mobile page lengths are 6.3–7.6 viewports before opening P2 or the drawer. The following issues are mobile-specific or materially worse at 360px:

1. The horizontally scrolling global navigation shows a scrollbar and clips later destinations; discoverability is weak.
2. TSMC and Applied Materials headings wrap to two lines, while the hero then stacks ticker, official name, tags, layer, status, and review date. This leaves only the first Overview card in the first viewport.
3. The Evidence badge occupies about 90% of the content width.
4. The drawer close button wraps vertically.
5. The Source action is below the drawer fold, so a user must understand that the drawer itself scrolls.
6. Financial/KPI tables require internal horizontal scrolling up to 1330px; the page avoids global overflow but comparison is difficult.
7. There is no compact mobile section navigator for pages that span more than six screens.
8. Coverage blocks add 61–137px each and are repeated below several closed P2 groups.

Recommended mobile response: compact hero metadata, four-row summary, short Evidence controls, a single-line close button, fixed/sticky Source action inside the drawer, card-based top financial metrics before the audit table, and an accessible compact section selector.

## 12. Information Reduction Matrix

| Element | Current | Problem | Action | Reason | Risk of reduction |
|---|---|---|---|---|---|
| Company status | legacy state in hero plus claim states | can disagree; adds early metadata | MOVE | place derived roll-up in Coverage/Provenance | users may miss overall state; retain a compact roll-up |
| Overview | one P1 fact | clear and useful | KEEP | answers company identity | low |
| AI Role | one P1 Atlas analysis | essential but separated from chain position | KEEP | answers AI relevance | low |
| Value Chain | separate P1 section/claim | overlaps AI Role and delays Products | MERGE | one AI-position group with separate evidence anchors | over-compression; preserve both atomic claims |
| P1 claims | four claims, but not the competitive claim | wrong visible mix and long cards | SHORTEN | five concise claims in four visual groups | nuance loss; drawer retains detail |
| P2 claims | all 19 closed by section | reasonable default but mixed decision value | COLLAPSE | keep 9 P2, promote 5, move 4 to P3, move 1 to Coverage | hidden useful detail; label disclosures clearly |
| Claim labels | type plus P1/P2 | priority can be mistaken for evidence grade | SHORTEN | keep epistemic type, hide editorial priority | editors lose visible debug signal; retain in advanced view |
| Evidence badges | full status phrase on every claim | 39 repetitions; near full-width on mobile | SHORTEN | `根拠 n` plus short state and full accessible name | state ambiguity; define short labels formally |
| Coverage notices | 34 repeated rows | interrupts scanning | MERGE | one compact disclosure per section | missingness becomes less prominent; never hide reasons completely |
| Facilities | always present for Pilot, even coverage-only | empty-feeling section for some companies | COLLAPSE | show section only with a facility/capacity claim | absence may be misread; Coverage summary must say why |
| Financial | full verified table | decision-useful but visually heavy | KEEP | preserve auditability | low |
| KPI | independent top-level section | another navigation stop, related to Financial | MERGE | make a Financial subsection | sector KPI discoverability; keep heading within section |
| Competitors | independent section | thin link list detached from differentiation | MOVE | place under Competitive context | users may expect TOC entry; retain anchor if needed |
| Risks | P2 section | important but sometimes contains editorial rule | KEEP | stable home for material risks | ensure non-risk disclosure rules move out |
| Sources | full bottom list always open | repeats drawer links; includes no-usage hubs | COLLAPSE | group by actual use and default closed | provenance discoverability; show count and clear label |
| Drawer metadata | all provenance at one level | mobile density and duplicated dates | COLLAPSE | first-view essentials plus advanced history | audit detail hidden; keep keyboard-accessible |
| Legacy narrative | fallback fields still exist | future double-display/false verification risk | REMOVE | suppress after evidence migration; retain read-only migration input | migration loss; preserve source data outside rendered UI |

### 12.1 Action counts

| KEEP | SHORTEN | COLLAPSE | MERGE | MOVE | REMOVE | Total |
|---:|---:|---:|---:|---:|---:|---:|
| 4 | 3 | 4 | 3 | 2 | 1 | 17 |

## 13. Schema and contract issues

### 13.1 Required before Freeze

| Issue | Classification | Required decision |
|---|---|---|
| `publishedAt` missing in existing Source records | Freeze blocker | normalize nullable `publishedAt` across shards and freeze the `日付不明` fallback |
| `missingStatus` on `partial` | Freeze blocker | document that partial coverage may carry a reason and define precedence when several reasons exist |
| Freshness derived in component-local date logic | Freeze blocker | provide one shared runtime/build helper and a deterministic reference date |
| Source shards enumerated directly by page | Freeze blocker | freeze one shared resolver/manifest contract before scale-out |
| zero reviewed Source Policies and zero `verified` Pilot claims | Freeze blocker | review at least one policy through governance and exercise the honest `verified` path; do not relabel current claims |
| legacy company status versus claim status | Freeze blocker | freeze status precedence and roll-up derivation |
| Source list usage semantics | Freeze blocker | derive and display usage categories; exclude registry-only sources from page provenance |
| Priority and section presentation | Freeze blocker | adopt the revised P1 mix and section order in v0.2, then rerun all five pages |
| five-person acceptance tests | Freeze blocker | complete 4/5 30-second, 5/5 Fact/Analysis, and 4/5 density tests after revision |

### 13.2 v0.2 candidates that need not add new storage fields

- define visible status abbreviations separately from schema tokens;
- map `company-positioning` and `company-guidance` to one public `会社説明` family while preserving internal types;
- define section-level Coverage aggregation and display order;
- define first-view versus advanced drawer fields;
- define that P1/P2/P3 are editorial metadata and may be hidden in public UI;
- define dynamic section visibility and Source usage grouping;
- document that AI Role/Value Chain may share one public presentation group while retaining two evidence-bound claims.

### 13.3 Post-Freeze work only

- 100-company Evidence Coverage Audit and migration;
- compare/search projections of evidence status;
- broad Source registry cleanup;
- relation evidence rollout;
- any production implementation beyond the five-company re-test.

## 14. Freeze blockers

1. The current P1 hierarchy fails the complete 30-second four-question test, especially competitive importance.
2. The mobile hero prevents the four-part summary from appearing early enough.
3. Badge, Coverage, and drawer density have not been approved and show concrete 360px defects.
4. Company-level and claim-level status precedence is unresolved.
5. Source contract issues (`publishedAt`, shared freshness, shared resolver, usage semantics) are not frozen.
6. The `verified` path is unexercised because all relevant Source Policies remain pending.
7. The specified independent five-person usability tests have not been run.
8. Revised five-company pages have not been re-entered/retested against a v0.2 contract.

## 15. Recommended v0.2 change list

1. Replace the top hierarchy with a compact four-part summary and surface one evidence-backed competitive claim per company.
2. Group AI Role and Value Chain in one presentation block without weakening claim/evidence atomicity.
3. Make claim-level status primary; remove company status from the hero and define a derived roll-up.
4. Shorten visible Evidence badges and retain full accessible labels.
5. Aggregate Coverage once per section and preserve the four missingness reasons in a disclosure.
6. Split the drawer into essential and advanced provenance layers; fix the mobile close control and keep the Source action visible.
7. Keep Fact/Company/Atlas labels; hide public P1/P2/P3 labels.
8. Make Facilities conditional, merge KPI into Financial, move Competitors under competitive context, and collapse Sources.
9. Display only Sources with declared page usage and identify their use categories.
10. Resolve the five schema/contract findings from the Pilot report and freeze status-roll-up semantics.
11. Rebuild/retest only the same five Pilot pages against v0.2; do not begin the 100-company audit.
12. Run the formal five-person comprehension, Fact/Analysis, and density tests; approve Freeze only if all acceptance thresholds and validators pass.

## 16. Final decision

**Ready for Freeze? NO.**

The Pilot is technically credible and provides a solid evidence-navigation foundation, but the human hierarchy, mobile density, status model, Source contract, and required usability tests still have blocking work. The next authorized step should be a reviewed v0.2 specification and a five-page re-test, not Freeze and not 100-company rollout.
