# Phase 8 Execution Plan v0.1

- Status: Accepted
- Baseline main: `95b33c6d45923595a71a7c60ea948f50f5b2ff50`
- Current gate: Company Evidence v1 Coverage Close = YES
- Phase 8 implementation started: **NO**

## Decision

Phase 8は12 stepsを順番に進める。UX、inventory、Relation contractを先に承認し、Company Compareで最小modelを検証してからValue Chain、Technology、Search、Priority 1 rolloutへ進む。Compare実装は、Pilot用Minimal Product / Technology / Market Registry、Relation executable foundation（production Relation 0）、Pilot Relation / projection data、Set A / B両対応のGeneric Company Compare UI、Information reduction correction、Compare / Relation Freezeの6 PR順序に固定する。

PR #153はSteps 1～3の設計成果物とStep 4の実装契約だけを含む。merge対象はこの5文書だけであり、implementation、production data、Relation data、Schema / loader / validator実装、migration、deployを含まない。

## Final adopted decisions

- Pilot Product entityはreview済みgeneric product categoryだけとする。company-specific brand、SKU、named product familyはRelation endpointにせず、既存Company Evidence Claimで表示する。
- v0.1 Pilotでfree-text `businessUnit`を使用しない。Company全体として成立しないRelationはdeferし、Company scope registryは実例発生時の別change-controlとする。
- eligible P2は`displayPriority`昇順、`asOf`降順、`claimId`辞書順で1件を選ぶ。必要metadata欠落は対象外とし、3 dimensions限定、priority / Coverage不変、P3初期0を維持する。
- initial FinancialはOperating MarginとRevenue Growthだけとする。ROIC、その他ratio、absolute financial historyはexpandedへ置き、比較不能ratioは理由付きでprimary comparisonから外す。FX換算、ranking、差分率計算を行わない。
- guarded `ENABLES` / `SUPPLIES_TO`はbounded Evidence review後、direct `supports` Binding、structured Locator、required scopeを満たすrecordだけを採用する。該当0件は正常である。
- Value Chain / Technologyの最終routeはCompare / Relation Freeze後に決定し、Independent Validationのsample size / severity gateはRelation corpus確定後の別contractで定義する。

本Statusは実行計画の採択だけを意味し、Phase 8 implementation startedは**NO**のままである。

## 1. Gate原則

- 各stepは最新`origin/main`のclean isolated worktreeから開始する。
- Company Evidence v0.2、Source、financial、Global Visual Systemの既存contractを既定で保護する。
- Data、Schema / loader / validator、UIは同じPRへ無条件に混在させない。
- missingを推論で補わず、scopeを閉じられないRelationは公開しない。
- browser QAが必要なstepはlocal buildとdeployed Pagesの両方を確認する。
- routine failureは同step内で修正する。HARD STOPだけをユーザーへ戻す。

## 2. StopとHARD STOP

`Stop Condition`は次stepへ進めない品質条件であり、同じscope内で自律修正できる。`HARD STOP`はcontract、法人scope、semantic protection、governanceなど、ユーザー判断なしに進められない状態である。

全step共通HARD STOP:

- Company Evidence v1 CloseまたはFreeze contractとの衝突。
- canonical Company / Source / Evidence bindingを解決できない。
- financial semantic diff、unrelated production semantic diff。
- Source Policy承認が必要。
- legal entity / business unit scopeがP1 relationへ波及。
- unresolved validator failureまたはproduction regression。

## Step 1 — Advanced UX Requirements v0.1

- **Input**: v1 Close、Company Evidence Freeze、Global Visual System、existing Compare contract。
- **Work**: 3 use cases、60～90秒hierarchy、epistemic / temporal表示、responsive、accessibility、URL、state、non-goalsを定義。
- **Output**: [`advanced-ux-requirements-v01.md`](./advanced-ux-requirements-v01.md)。
- **Dependencies**: Company Evidence v1 Close = YES。
- **Acceptance Criteria**: 3 use casesと必須項目が完全、`view=evidence` opt-in、3 dimensionsだけのP2例外、Evidence 2-click、financial contractに矛盾なし、実装を含まない。
- **Validator**: Markdown structure、required headings、relative links、terminology consistency。
- **Browser QA**: 不要。文書のみ。
- **Stop Condition**: 主要問い、初期 / 展開境界、stateのいずれかが未定義。
- **HARD STOP**: FreezeされたEvidence interactionの変更が不可避。
- **PR unit**: Steps 1～3をまとめたdocs-only PR #153。

## Step 2 — Entity / Relation inventory

- **Input**: Company、Evidence、Source、Facility、Value Chain、financial、UI、validators。
- **Work**: entity、implicit relation、ID、alias、UI interpretation、duplicate、missing、reuse assetをread-only棚卸し。
- **Output**: [`entity-relation-inventory-v01.md`](./entity-relation-inventory-v01.md)。
- **Dependencies**: Step 1の用語。
- **Acceptance Criteria**: existing / safely derivable / persist / MVP unnecessary / research-requiredが分離され、集計がcurrent mainと一致。
- **Validator**: countsのread-only再計算、path existence、protected diff 0。
- **Browser QA**: 不要。文書・auditのみ。
- **Stop Condition**: Company、Evidence、Sourceのいずれかの正本が複数候補で未解決。
- **HARD STOP**: canonical IDまたはEvidence bindingを安全に特定できない。
- **PR unit**: Steps 1～3をまとめたdocs-only PR #153。

## Step 3 — Atlas Relation Schema v0.1

- **Input**: Steps 1～2、Freezeのfuture Relation Evidence contract。
- **Work**: common entity / relation、direction、scope、Evidence、validity、freshness、inference guard、migration、backward compatibilityを設計。
- **Output**: [`atlas-relation-schema-v01.md`](./atlas-relation-schema-v01.md)。Accepted designのmerge後、別PRでexecutable schema、empty manifest / resolver、validator。
- **Dependencies**: Inventoryのcanonical ID判定。
- **Acceptance Criteria**: 3 use casesが1 modelで表現可能、8 typesをSchema上の候補として採択、3 typesをDeferred、Productはreview済みgeneric categoryだけ、v0.1 `businessUnit`はnull、unscoped competition禁止、guarded `ENABLES` / `SUPPLIES_TO`はdirect Evidence・structured Locator・scope必須かつ0件許容、authoring Relationに`evidenceIds` / `sourceIds`なし、resolved read modelで両IDをderived、resolved `freshnessStatus`は`current` / `review-due` / `stale`のみで`not-applicable`はCoverage側、Company Evidence v0.2に変更なし。
- **Validator**: design key / enum / authoring-versus-resolved field / endpoint matrix check。実装PRではschema validation、duplicate、orphan、scope、binding、derived field tests。
- **Browser QA**: design / empty foundationは不要。
- **Stop Condition**: Pilotに必要なProduct / Technology / Market canonical identityを安全に定義できない。
- **HARD STOP**: Frozen Company Evidence Schemaを変更しないとRelationを表現できない。
- **PR unit**: designはdocs-only PR #153。merge後は(a) Pilot minimal registry、(b) executable foundation（production Relation 0）の順で別PRにする。

## Step 4 — Company Compare Pilot

- **Input**: 採択済みSteps 1～3、[`company-compare-pilot-contract-v01.md`](./company-compare-pilot-contract-v01.md)、既存Evidenceとfinancial data。
- **Work**: `view=evidence` opt-in Compare read model、Set A / B両対応のgeneric UI、Evidence drawer接続、missing / incomparable / URL stateを実装。必要なRelationだけを既存Evidenceから人手reviewする。eligible P2は3 dimensionsで`displayPriority`昇順、`asOf`降順、`claimId`辞書順に最大1件を選び、metadata欠落は対象外とする。initial Financialは比較可能なOperating MarginとRevenue Growthだけとし、ROIC、その他ratio、absolute financial historyはexpandedへ置く。
- **Output**: Pilot read model、最小Relation records、validator、2-set UI、QA report。
- **Dependencies**: executable Relation foundation、canonical endpoint registry、contract承認。
- **Acceptance Criteria**: Set A / Bを同じgeneric UIで表示、2～4社、8 dimensions、3 dimensionsだけP2最大1件と決定論的tie-break / metadata gate / `補足`表示、P3初期0、statement semantic diff 0、Evidence marker 100%、initial Financialは比較可能なOperating Margin / Revenue Growthだけ、FX / ranking / 差分率計算0、financial logic diff 0、60～90秒task準備完了。
- **Validator**: Company / Claim / Relation / Evidence / Source refs、priority projectionとtie-break、URL、all-missing、initial ratio allowlist、financial protection、secret scan、Astro / Pagefind。
- **Browser QA**: 1280 / 1024 / 768 / 360px。selection、reload、back / forward、drawer、Primary Source、Escape、focus return、missing、incomparable、overflow。
- **Stop Condition**: 採用候補Relationにscopeまたはdirect `supports` Bindingが不足する場合はdeferする。guarded type 0件は正常終了。
- **HARD STOP**: named relationが既存Evidenceだけでは安全に成立せず、Web researchまたはSchema変更が必要。
- **PR unit**: (c) Pilot Relation / projection data、(d) Set A / B両対応のGeneric Company Compare UI。semantic dataとpresentationを分ける。

## Step 5 — Compare UX Review / Information Reduction

- **Input**: deployed Compare Pilot、Step 1 acceptance tasks。
- **Work**: first screen、heading / label反復、scroll burden、Evidence visibility、missing、mobile representationを実測し、必要な局所修正を行う。
- **Output**: Before / After report、correction PR、updated contract decision log。
- **Dependencies**: Step 4 local / Pages success。
- **Acceptance Criteria**: 90秒以内にrole、position、主要差異2点を説明可能。P1 hidden 0、duplicate labels 0、360px overflow 0。
- **Validator**: semantic snapshot、visible heading / label count、Evidence hooks、financial diff、all existing validators。
- **Browser QA**: 2 Pilot sets × 1280 / 1024 / 768 / 360px、keyboard-only review。
- **Stop Condition**: information densityまたはmobile burdenがthreshold未達。
- **HARD STOP**: comprehension改善にClaim statementやpriority semantic変更が必要。
- **PR unit**: 1 correction pass = 1 PR。Data変更と混在しない。

## Step 6 — Compare UI / Relation Schema Freeze

- **Input**: Steps 4～5のaccepted UI、schema、validators、QA。
- **Work**: version、invariants、allowed / prohibited change、migration gate、regression contractを固定。
- **Output**: Compare / Relation Freeze文書、generic validator、accepted fixtures。
- **Dependencies**: Pilot acceptance、unresolved P1 issue 0。
- **Acceptance Criteria**: URL、Evidence、scope、freshness、mobile、financial protectionが明文化され、validatorで再現可能。
- **Validator**: Freeze artifact、schema version、fixtures、component hooks、semantic snapshot。
- **Browser QA**: Freeze candidateを2 setsで再確認。
- **Stop Condition**: open MATERIAL UX / schema issueが残る。
- **HARD STOP**: backcompat migrationを定義できない、またはexisting Freezeと直接衝突。
- **PR unit**: Freeze-only 1 PR。新機能を追加しない。

## Step 7 — Value Chain Navigation Pilot

- **Input**: Frozen Relation model、existing ValueChainNode、accepted Company relations。
- **Work**: 2 representative nodesでupstream / downstream、Technology、Company role、Evidenceを実装。編集順とFact edgeを分離。
- **Output**: node route、navigation read model、validator、Pilot QA report。
- **Dependencies**: Step 6、ValueChainNode ID Freeze。
- **Acceptance Criteria**: direct adjacency、P1 roles、Evidenceへ到達、named edgeのscope / Evidence 100%、editorial mappingの明示。
- **Validator**: node / relation orphan、direction、scope、Evidence、URL、Pagefind index。
- **Browser QA**: 2 nodes × 1280 / 1024 / 768 / 360px、keyboard navigation、drawer、overflow。
- **Stop Condition**: stage mappingとRelation edgeが同じvisual languageで誤読される。
- **HARD STOP**: upstream / downstreamをFactとして成立させるのにunsupported inferenceが必要。
- **PR unit**: data/read-model PRとUI PRを分ける。nodeごとの追加PRは作らない。

## Step 8 — Technology Navigation Pilot

- **Input**: Frozen Relation model、canonical Technology / Product registry、Step 7 navigation pattern。
- **Work**: 2 representative technologiesで7 role、scope、Evidence、missingを実装。
- **Output**: technology route、role grouping、validator、Pilot QA report。
- **Dependencies**: Product / Technology identity review完了。
- **Acceptance Criteria**: DeveloperからSubstitute exposureまで収録 / 未収録を区別し、tag-only role 0、Evidence付きrelation 100%。
- **Validator**: role mapping、entity refs、relation type / endpoint、scope、Evidence、alias collision。
- **Browser QA**: 2 technologies × 1280 / 1024 / 768 / 360px、role filters、URL restore、drawer、empty role。
- **Stop Condition**: role定義またはProduct / Technology boundaryが不安定。
- **HARD STOP**: substituteまたはadopterを一次資料なしに推論しないとP1理解が成立しない。
- **PR unit**: registry/data PR、UI PR。`SUBSTITUTES`採択は別Schema-change PR。

## Step 9 — Integrated Search / Navigation

- **Input**: Frozen Compare、Value Chain Pilot、Technology Pilot、canonical aliases。
- **Work**: Company / Product / Technology / ValueChainNodeを横断するsearch result taxonomyとroute導線を統合。
- **Output**: shared search index contract、navigation UI、URL / empty / error QA。
- **Dependencies**: entity IDとrouteのFreeze。
- **Acceptance Criteria**: result typeとroleを明示、canonical routeへ遷移、legacy search regression 0、duplicate alias結果 0。
- **Validator**: Pagefind index、route existence、alias collision、search fixture。
- **Browser QA**: representative queries、no-result、mixed result、keyboard、back / forward、360px。
- **Stop Condition**: same aliasが複数entityへ曖昧解決される。
- **HARD STOP**: existing Company search URL semanticsを壊す必要がある。
- **PR unit**: index contract PR、UI rollout PR。

## Step 10 — Priority 1 Rollout

- **Input**: Frozen UI / Relation contract、100社L4 Evidence、rollout priority list。
- **Work**: P1 relationだけをcompany / node / technology単位でbatch化し、missingを保持して横展開。
- **Output**: audited Relation batches、progress、coverage / relation audit。
- **Dependencies**: Steps 6～9のFreeze、Source / ID governance。
- **Acceptance Criteria**: target ACTIONABLE pending 0、named relation evidence / locator 100%、unsupported auto-migration 0。
- **Validator**: relation coverage、duplicate / orphan、Evidence / Source、freshness、financial and UI protection。
- **Browser QA**: batchごとにchanged routesを1024 / 360px、代表routesでdrawer / focus / overflow。
- **Stop Condition**: batchにscope未確定またはmissing entity IDがある。deferして次へ進める。
- **HARD STOP**: repeated legal scope issue、P1 relation conflict、Schema不足。
- **PR unit**: 8～12 companiesまたは1 coherent node / technology group = 1 PR。Dataとglobal visual変更を混在させない。

## Step 11 — Independent Validation

- **Input**: completed Priority 1 Relation corpus、Freeze、coverage audit。
- **Work**: deterministic stratified sampleでclassification、scope、Evidence、validity、UI projectionを独立review。systemic failureだけaffected stratumを再評価。
- **Output**: machine-checkable JSON、Markdown report、audit script、必要なremediation PR。
- **Dependencies**: ACTIONABLE pending 0。
- **Acceptance Criteria**: CRITICAL 0、MATERIAL threshold内、systemic pattern 0、review-required P1 0。
- **Validator**: sample reproduction、quota、artifact completeness、source review fields、summary consistency、freshness。
- **Browser QA**: remediationでproduction relation / UI変更がある場合だけ対象routeを確認。
- **Stop Condition**: MATERIAL mismatchがgate超過。affected stratumを再評価。
- **HARD STOP**: CRITICAL、全sample MATERIAL率超過、2 remediation cycles後もsystemic issue継続。
- **PR unit**: validation finding PR、remediationは1 bounded batch / PR、final closeはdocs-only PR。

## Step 12 — Atlas v1 Release Gate

- **Input**: all Freeze、independent validation、Actions / Pages、coverage / relation audit。
- **Work**: release criteria、remaining gaps、non-goals、rollback、post-release monitoringを確認。
- **Output**: Atlas v1 Release Gate文書とrelease decision。
- **Dependencies**: Step 11 PASS、main Actions / Pages success。
- **Acceptance Criteria**: Company Evidence close維持、Relation P1 close、REVIEW_REQUIRED P1 0、financial / UI diff承認済み、public smoke PASS。
- **Validator**: all repository validators、secret scan、Astro、Pagefind、semantic protection、release artifact freshness。
- **Browser QA**: all archetypesのrepresentative matrix、desktop / mobile / keyboard。
- **Stop Condition**: non-critical unresolved gapは明示してgate判断を保留。
- **HARD STOP**: production regression、financial semantic diff、Freeze violation、critical provenance gap。
- **PR unit**: release-gate docs / metadataのみ1 PR。未承認featureを追加しない。

## 3. PR sequence after design approval

採択済みの順序は次のとおり。

1. Pilot用Minimal Product / Technology / Market Registry。Pilot Relationのendpointまたはscopeに必要なcanonical entityだけを追加し、Productはreview済みgeneric categoryに限定する。
2. Relation executable foundation。authoring / resolved schema、Relation Evidence Binding、empty manifest / resolver、validatorを追加し、production Relation 0を維持する。
3. Pilot Relation / projection data。Set A / Bだけを既存Evidenceから人手reviewする。
4. Generic Company Compare UI。`view=evidence`でSet A / Bの両方へ対応し、既存CompareはFreezeまで既定動作として維持する。
5. Information reduction correction。
6. Compare / Relation Freeze。

各PRはlatest mainから開始し、merge後Actions / Pagesを確認して次へ進む。PR #153のmergeはdesign acceptanceであり、このimplementation sequenceを開始したことを意味しない。

## 4. Validation matrix

| Change class | Data validators | Semantic diff | Build / Pagefind | Browser QA |
| --- | --- | --- | --- | --- |
| docs-only design | applicable existing validators | protected paths 0 | docsがbuild inputでなければN/A | N/A |
| schema / loader only | all + schema fixtures | production data 0 | required | resolver smoke only |
| Relation data | all + relation / coverage audit | unrelated data 0 | required | changed entity routes |
| Compare UI | all + interaction contract | Claim / Relation / financial 0 | required | full Pilot matrix |
| rollout batch | all audits | out-of-scope 0 | required | changed + representative routes |

## Rationale

CompareはRelationの最小集合を検証でき、Value ChainとTechnologyより既存Evidenceへの依存が明確である。Compareでscope、priority projection、Evidence drawer、missing、financial compatibilityを先にFreezeすると、後続navigationが別semanticを作る危険を下げられる。

## Alternatives rejected

- Value ChainをCompareより先に実装する案。named relationとentity registryの不足が大きいため却下。
- Compare、Value Chain、Technologyを1 PRで同時実装する案。semantic failureの所在を分離できないため却下。
- 100社Relationを先に生成する案。Pilot前のbulk migrationになるため却下。
- UI実装とSchema Freezeを同時に行う案。UX correctionの余地を失うため却下。
- docs-only stepでbrowser QAとdeployを行う案。production inputが変わらないため却下。

## Consequences

- Phase 8は複数gateとPRに分かれ、最短実装よりsemantic safetyを優先する。
- Compare Pilotでは採択済み8 typesのうち必要なsubsetだけをauthoringし、guarded typeを無条件に追加しない。Schema候補の変更は別change-controlとする。
- Value Chain / Technologyの最終routeはCompare / Relation Freeze後に決定する。
- Priority 1 rolloutはcomplete relation数ではなく、追跡すべきrelation pending 0をclose条件にする。

## Open questions

1. Pilot minimal registry PRのbounded existing-Evidence inventoryで確定するexact canonical entities。
2. bounded Evidence review後、guarded `ENABLES` / `SUPPLIES_TO`のうちpublic gateを満たすPilot recordが存在するか。0件でも正常とする。
3. Compare / Relation Freeze後に採択するValue Chain / Technologyのexact routeとrepresentative対象。
4. Relation corpus確定後の別contractで採択するIndependent Validationのexact sample sizeとseverity gate。
