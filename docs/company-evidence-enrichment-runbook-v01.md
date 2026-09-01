# Company Evidence Enrichment Runbook v0.1

- Status: active
- Frozen Company Evidence Schema: `0.2`
- Baseline: Batch 01 (`e93990f1e16273fadc46b22ef47ddcc406d44544`)
- Default verification: `source-linked`
- Source Policy approval during enrichment: **NO**

## 1. Purpose and operating boundary

This Runbook is the formal procedure for autonomous Company Evidence enrichment. Work proceeds company by company and batch by batch without intermediate approval unless a HARD STOP condition is met. Missing or incomplete primary evidence is a normal audit result and is recorded as a gap rather than inferred.

The frozen flow is `Company Claim → Evidence Binding → Shared Source Registry`. Do not change Schema v0.2, enums, priority meaning, verification meaning, the frozen Company Evidence UI, or the Global Visual System during enrichment.

## 2. Select the target

1. Fetch latest `origin/main`.
2. Read this Runbook, `docs/company-evidence-enrichment-progress-v01.md`, and the current Coverage Audit.
3. Skip every merged batch and completed company.
4. Use the batch list fixed in the active enrichment instruction. Do not substitute a different company because it appears in `nextRecommendedBatch`.
5. Start a clean worktree and branch from latest `origin/main`. Preserve all existing dirty worktrees.

## 3. Inventory the company

Before authoring Claims, record:

- current coverage counts and maturity;
- legacy `summary`, `aiRole`, `products`, `strengths`, and `risks` as migration candidates only;
- existing company-level, document, facility, and financial Sources;
- legal entity, subsidiary, and business scope;
- unresolved categories and explicit Missing Status;
- protected files for the current batch.

Legacy prose is not Evidence and must not be automatically promoted.

## 4. Select Sources

Use primary Sources in this order:

1. Annual Report / 10-K / 20-F / annual securities report
2. official company overview
3. official product material
4. official technology material
5. investor presentation
6. official facility or expansion release
7. official strategy material

Resolve the Shared Source Registry before adding anything. Reuse the existing Source ID when the same document or URL is already present. Never register the same document under another ID. Initial enrichment normally uses two to four high-leverage primary Sources per company; fewer are acceptable when one filing safely covers the required Claims, and more are allowed only when necessary.

For every newly added Source, add a matching Source Policy record with `reviewStatus: pending`, unknown retrieval and redistribution fields, and `manual-reference-only-until-reviewed`. Enrichment never changes a policy to `reviewed` or `approved`.

## 5. Design Claims

Target six to twelve Claims per company. Claim volume is not a quality target.

P1 normally contains four or five Claims answering:

- what the company is;
- where it sits in AI infrastructure;
- its principal products or technologies;
- its value-chain position;
- why its position matters competitively.

P2 covers important comparison and research context. P3 is detail. Evidence abundance does not justify more P1 Claims.

Use Claim Types exactly:

- `fact`: objective content directly supported by the Source;
- `company-guidance`: company forecast or target;
- `company-positioning`: the company’s own assessment or market-position statement;
- `atlas-analysis`: Atlas interpretation derived from stated facts;
- `estimate`: an explicitly identified estimate.

An `atlas-analysis` or `estimate` requires confidence and notes explaining the analytical input. Do not rewrite company positioning as fact or present Atlas interpretation as company disclosure.

## 6. Bind Evidence and Locator

Every `source-linked` or `verified` Claim must have at least one Evidence Binding. Each Binding must:

- point to a resolved Shared Source ID;
- use `supports`, `context`, or `contradicts` correctly;
- include a structured Locator;
- record `lastChecked`.

For PDFs, use page plus section, heading, table, or quoted label. For web pages, use heading, anchor, section, or quoted label. A URL alone is not a Locator. The target is 100% structured Locator coverage.

When Source Policy is pending, use `source-linked`. Do not manufacture `verified` status.

## 7. Update Coverage and Missingness

One Claim does not make a Category complete.

- `complete`: primary Evidence adequately covers the Category’s main content;
- `partial`: important content is evidenced but meaningful scope remains;
- `not-started`: no safe category Evidence has been collected.

Every `not-started` record requires a Missing Status. Use `not-collected`, `primary-source-unchecked`, `not-disclosed`, or `not-applicable` only when the Source and company model justify it. Partial records may carry Missing Status only with explanatory notes. Never infer a customer, facility, capacity, relationship, or market position to close a gap.

## 8. Connect the UI

Add the new v0.2 shard to `company-evidence-manifest.json`. Add new Source shards only when reuse is impossible, and list them in `source-registry-manifest.json`. The generic resolver must make the frozen Evidence page available without company-ID hardcoding. Do not redesign the page or change production CSS.

## 9. Validation cadence

After each company, run the lightweight Company Evidence / Freeze validation needed to catch local Claim, Binding, Source, Locator, and Coverage errors.

At each batch boundary run the full gate:

- Company Evidence validator;
- Freeze validator;
- Coverage Audit generation and `--check`;
- every existing data validator;
- financial quality audit;
- secret scan;
- Astro build;
- Pagefind indexing;
- semantic diff for financial files, Pilot 5, Arm / ASML, unrelated company Evidence, facilities, relationships, and Global Visual System.

Do not normalize or rewrite protected data. On Windows, preserve audited JSON LF content when digest freshness is involved.

## 10. Browser QA

For every newly enriched company, check at 1024px and 360px:

- document overflow is zero;
- at least one Evidence marker exists;
- bibliography / Source link exists.

For two representative companies per batch, additionally check:

- drawer opens;
- Primary Source action resolves;
- Escape closes the drawer;
- focus returns to the originating marker;
- Supplementary Research renders without a nested-disclosure regression.

Use the deployed Pages build for the representative post-merge check.

## 11. Commit, PR, merge, and deployment

One batch equals one PR. Before merge, require a clean local full gate and a mergeable PR. If the repository has no PR-event CI, those two conditions allow squash merge. After merge:

1. wait for the main Actions deployment;
2. require success;
3. verify representative public Pages;
4. fetch latest `origin/main`;
5. confirm the Coverage Audit is current;
6. begin the next batch from that merge, never from the previous branch.

Record company metrics, gaps, PR, merge SHA, and Actions in the Progress document.

## 12. SOFT DEFER

Do not stop for:

- undisclosed customer names;
- unavailable capacity;
- thin facility disclosure;
- absent strategy material;
- missing direct competitive-position evidence;
- a Category that cannot be completed from primary Sources;
- an old Source;
- a Category remaining `not-started`.

Record the result as `partial` or `not-started`, apply the appropriate Missing Status, add notes, count the defer, and continue.

## 13. HARD STOP

Stop only when:

- frozen Schema cannot safely represent the result;
- company, legal entity, subsidiary, or business scope is materially ambiguous;
- primary Sources materially conflict on a P1 fact;
- an important Claim Type cannot be classified safely;
- provenance or ownership prevents treating a Source as primary;
- policy approval is required to proceed;
- financial semantic diff is non-zero;
- out-of-scope Company Evidence semantic diff is non-zero;
- Pilot or Freeze contract must be broken;
- validator failure cannot be solved by a safe local correction;
- a production UI regression affects other companies.

Report only:

`HARD STOP / Company / Category / Problem / Primary Sources checked / Why Runbook cannot decide / Options / Recommended option`.

## 14. Resume procedure

After context compression, timeout, interruption, or a new Codex session:

1. fetch latest `origin/main`;
2. read this Runbook;
3. read the Progress document;
4. read the latest Coverage Audit;
5. verify merged PRs and Actions;
6. do not repeat completed batches;
7. resume from the next pending company or batch.

The user must not be asked to repost prior enrichment prompts.

## 15. Production protection

Do not change financial values or history, cash-flow overrides, relationships, facilities, unrelated company JSON, Pilot 5 Evidence, Arm / ASML Evidence, schema artifacts, the frozen UI, or the Global Visual System. Within a batch, only that batch’s Company Evidence, necessary Source/Policy records, manifests, generated Coverage Audit, Runbook, and Progress may change.
