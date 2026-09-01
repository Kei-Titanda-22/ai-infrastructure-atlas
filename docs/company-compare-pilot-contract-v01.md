# Company Compare Pilot Implementation Contract v0.1

- Status: Draft contract; implementation not started
- Baseline main: `95b33c6d45923595a71a7c60ea948f50f5b2ff50`
- Source review: existing repository Evidence only
- Additional Web research: **NO**
- Production UI / data changed by this contract: **NO**

## Decision

最初のCompany Compare Pilotには次の2 setsを推奨する。

1. **Set A: NVIDIA / Broadcom**
2. **Set B: Applied Materials / Lam Research / Tokyo Electron**

Set Aを2社表示とmissing / financial comparabilityの最小baseline、Set Bを3社表示とscoped process competition / Facility / mixed currencyのstress caseとする。実装時もCompany Evidence statement、Evidence Binding、Source、financial valueを変更しない。

## 1. Candidate評価

集計はcurrent repositoryのCompany Evidence、Coverage、Company JSON、normalized financial historyだけを使用した。`Complete`は11 CategoryのCoverage countであり、Companyの品質scoreではない。

| Candidate | Claims / P1 | Complete合計 | Financial history | 財務比較 | Relation / UI検証 | Decision |
| --- | ---: | ---: | --- | --- | --- | --- |
| NVIDIA / Broadcom | 19 / 10 | 7 | 6 / 3 records、両社USD million | latest ratioは両社quarterly。period差は注意表示可能。ROICはpartial missing | GPU platform対custom ASIC / network、2-column、missing | **SELECT** |
| TSMC / Samsung Foundry | 22 / 11 | 8 | 3 / 2 records、TWD / KRW | Samsungはpreliminary guidance。currency / basis差 | canonical entityはSamsung FoundryではなくSamsung Electronics全社 | REJECT for Pilot |
| Applied / Lam / TEL | 35 / 15 | 10 | 2 / 5 / 7 records、USD / USD / JPY | margin / growthはperiod差付き比較可。absolute valueはcurrency差でblock | 3-column、process scope、Facility有無、US / Japan | **SELECT** |
| Fujikura / Corning | 22 / 10 | 8 | 2 / 2 annual、JPY / USD | fiscal end / currency差。current common metricsは全missing | optical product / Technologyは強いがfinancial initialが薄い | DEFER |
| Vertiv / Eaton / Schneider | 32 / 15 | 10 | 2 / 2 / 2、USD / USD / EUR | Schneiderはannualかつcurrent common metrics missing | 業態差は大きいが比較条件差がPilot initialへ集中 | DEFER |

### Set Aの選定理由

- 両社とも`Compute & Silicon`で、Company IDと法人scopeが一致する。
- 5件ずつのP1があり、AI role、Value Chain、Products、competitionを初期表示できる。
- 両社のoperating margin / revenue growthはUSD reportingのquarterly dataで、period差を既存logicの`条件注意`として説明できる。
- NVIDIAだけROICがあり、partial-missingの正しい表示を検証できる。
- NVIDIAのcapacityはnot-started、Broadcomもnot-startedであり、missingを推論で埋めないcontractを検証できる。
- platform companyとcustom silicon / networking companyの業態差がある。

### Set Bの選定理由

- 3社とも`Wafer Fab Equipment`で、同業比較としての意味が明確である。
- 35 Claims、15 P1があり、Products、Technology、competition、capacity、riskを既存Evidenceだけで構成できる。
- deposition / etch / cleaning等のprocess scopeをRelation schemaで検証できる。
- all 3にoperating margin / revenue growthがあり、period / basis差を表示できる。
- Tokyo Electronだけstructured Facility recordsがあり、Claim-level facilityとFacility entityの差を検証できる。
- USD / JPYのabsolute valueを比較不能にしつつ、ratioを条件付きで表示するfinancial guardを検証できる。

## 2. 対象Company IDと順序

| Set | Ordered canonical IDs |
| --- | --- |
| A | `nvidia,broadcom` |
| B | `applied-materials,lam-research,tokyo-electron` |

表示順はURLの`ids`順を正とする。Japanese display name、ticker、countryはCompany resolverから取得し、IDや名称をPilot固有codeへhard-codeしない。

## 3. 表示項目

| Dimension | Source of truth | Initial | Expanded |
| --- | --- | --- | --- |
| Company identity | Company JSON | name、ticker、country | official name、reading、last reviewed |
| AI Infrastructure Role | `ai-infrastructure-role` Claim | P1 statement | remaining P2/P3、Coverage |
| Value Chain Position | `value-chain-position` Claim | P1 statement | relation scope、validity、Coverage |
| Key Products | `products` Claim | P1 statement | Product details、P2/P3 |
| Technology / Moat | `competitive-positioning`, `technology` Claims | competitive P1 + 必要時P2 1件 | all P2/P3、claim type、confidence |
| Capacity / Roadmap | `capacity-expansion`, `strategy` Claims | highest-priority P2 1件またはmissing state | remaining Claims、dates、Coverage |
| Financial | existing common metric / financial history | operating margin、revenue growth、利用可能なROIC、comparison state | period、basis、currency、definition、history、Source |
| Key Risks | `risks` Claims | highest-priority P2 1件 | remaining Claims、Coverage |
| Evidence | Evidence Binding / Shared Source | footnote marker | drawer Basic / Advanced provenance |

初期表示へ投影するP2はTechnology / Moat、Capacity / Roadmap、Key Risksの各dimensionにつき最大1件である。保存priorityやstatementを変更せず、`補足`として識別する。P3は初期表示しない。

## 4. Information Architecture

1. Compare contextとselection。
2. Difference summary。AI role、Value Chain、Products、Technology / Moat。
3. Capacity / Roadmap。
4. Financial comparison。
5. Key Risks。
6. Expanded research。
7. Data Quality / missing summary。

同じClaimを複数sectionへ複製しない。1 Claimが複数dimensionの候補になる場合、primary categoryの1箇所だけへ配置し、cross-referenceはtitle linkにする。

## 5. Epistemic / temporal表示

- `fact`は`FACT`。通常本文として表示する。
- `company-guidance`と`company-positioning`は`COMPANY_CLAIM`。`会社見解`を表示する。
- `atlas-analysis`と`estimate`は`ATLAS_ANALYSIS`。同じsectionで`Atlasによる分析`を1回だけ表示する。
- future-looking `company-guidance`は`COMPANY_PLAN`と対象日を表示する。
- `estimate`は`ATLAS_ESTIMATE`とconfidenceを表示する。
- current relation / Claimは`asOf`を表示し、現在も有効と推測しない。

色、border、badgeだけで区別しない。

## 6. Missing / partial

- `not-collected`: `未収録`。
- `primary-source-unchecked`: `一次資料未確認`。
- `not-disclosed`: `非開示`。
- `not-applicable`: `対象外`。
- `partial`: statementを表示し、`一部収録`とnotesをexpanded面に出す。

全Companyがmissingのdimension / metricはprimary matrixから外し、`未収録・比較対象外`へ集約する。一部Companyだけmissingの場合は行を残し、各cellにmissing reasonを表示する。

Set Aのcapacity、Set BのROIC / valuation等を推測で補わない。Company Claimが存在してもCoverageを自動的にcompleteにしない。

## 7. 比較不能と条件注意

既存Compareのcomparison judgementを保護する。

- valueが2社未満: `比較不能`。
- definitionが異なる: `比較不能`。
- quarterly / annual / TTMが混在: `比較不能`。
- period、asOf、basis、verificationに差: `条件注意`。
- native currency / unitが異なるabsolute value: `比較不能`。FX換算しない。
- ratioでもdefinitionまたはscopeが異なる場合: `比較不能`または`条件注意`と理由を表示。
- Relation scopeが異なるstatementを同じrowでrankingしない。

Set BのUSD / JPY absolute financialは並列表示してもranking、差分率、合計を計算しない。

## 8. URL state

Pilotは既存Compareを置換せず、opt-in stateを使用する。

```text
/compare/?ids=nvidia,broadcom&view=evidence&detail=summary
```

- `ids`: ordered canonical Company IDs。Pilotは2～4社。
- `view=evidence`: Phase 8 Pilot。
- `detail=summary|expanded`: 情報密度。
- `section`: stable section anchor。optional。
- existing `ids` semantics、empty state、個別解除、全解除、focus returnを維持する。
- drawer open、focus、scroll positionはURLへ保存しない。
- reload、copy URL、back / forwardでselection orderとdetailを復元する。

unknown / duplicate / fifth IDはsilent data substitutionをせず除外理由をstatusで表示する。既存v0.3の最大5社Compareは`view=evidence`未指定時に維持する。

## 9. Desktop / Mobile

### Desktop

- 1280 / 1024pxでSet A / Bの全Company headerを初期viewportに表示する。
- dimension columnは170～190px、Company columnsは残りを均等配分する。
- long statementは自然にwrapし、font-sizeを下げない。
- 4社時も実container幅が可読threshold以上ならhorizontal scrollを使わない。
- sticky column / headerはEvidence drawerとsite headerのstackingを壊さない。

### 768px

- 実container幅が不足する場合だけtable内horizontal scrollを許可する。
- document overflowは0。
- Company identityとselection controlはtable外で読める。

### 360px

- narrative dimensionsは`dimension → Company name / statement / Evidence`のruled rowsへ変換する。
- financial formal tableだけ内部horizontal scrollを許可する。
- document overflow 0、touch target 44px以上。
- Source metadataやbasisはDisclosureへ移すが、missing reasonとEvidence markerは残す。

## 10. Evidence drawer接続

既存`CompanyEvidenceClaim.astro`のmarker / drawer semanticsと`source-registry.ts`を再利用する。interaction controllerはCompany Page固有scriptからshared moduleへ移す候補だが、既存Company Pageを回帰させない。

Acceptance:

- 可視ClaimごとにEvidence marker 1つ。
- markerのaccessible nameにCompany、Claim title、verification contextを含む。
- Basic drawerにpublisher、title、publication date、Primary Source action。
- Advanced provenanceにclaimType、priority、asOf、verification、freshness、confidence、Locator。
- markerからPrimary Sourceまで2 activation。
- Escape、close、backdrop、origin focus return。
- 2社 / 3社でdialog ID重複0。

Relation statementを表示する場合はRelation Evidence drawerも同じinteraction contractを使うが、Claim Evidence Bindingへ偽装しない。

## 11. Acceptance Criteria

### Data / semantics

- Set A / Bのordered IDsが上記contractと一致する。
- 既存Company Evidence statement、claimType、priority、Evidence、Sourceのsemantic diff 0。
- financial value、history、definition、compatibility judgementのdiff 0。
- visible cellがcanonical ClaimまたはRelation IDへtraceできる。
- P2初期投影は必須dimensionごとに最大1件、P3は0件。
- named Relationはscope、supports Evidence、Locator、asOfを持つ。

### UX

- 2 setsで、role、Value Chain position、主要差異2点を90秒以内に回答できるtaskを満たす。
- initial stateに8 dimensionsが存在し、missingは理由付きである。
- 全社missing primary rows 0。
- duplicate Company identity / Source metadata block 0。
- 1024pxでSet A / B header visibility 100%。
- 360px document overflow 0、touch target violation 0。

### Interaction

- URL copy / reload / back / forwardでselection orderとdetail復元。
- add、individual remove、clear all、preset reapplyが既存contractどおり動作。
- clear all後にsearchへfocus return。
- Evidence drawer、Primary Source、Escape、focus returnが全対象Companyで動作。
- keyboard-onlyでselectionからPrimary Sourceまで到達可能。

## 12. Validator contract

future implementationは次を自動検査する。

1. Pilot preset ID、2～4社、duplicate / unknown Company 0。
2. Claim category / priority projectionと1 Claim 1 placement。
3. P2 exception count、P3 initial count 0。
4. Claim → Evidence → Source / Locator integrity。
5. Relation endpoint、scope、Evidence、Source、freshness integrity。
6. all-selected-missing filteringがunderlying dataを削除しないこと。
7. existing financial comparison fixturesと結果が同一であること。
8. URL parse / serialize / order / empty fixtures。
9. dialog ID、ARIA hook、Escape / focus controller hook。
10. protected data / UI semantic diff。

全existing validators、financial quality audit、secret scan、Astro、Pagefind、`git diff --check`も通す。

## 13. Browser QA matrix

| Width | Set A | Set B | Required checks |
| ---: | --- | --- | --- |
| 1280px | full | full | headers、8 dimensions、no table scroll、drawer、Source |
| 1024px | full | full | header visibility 100%、no document overflow、wrap |
| 768px | full | full | conditional internal scroll、sticky dimension、keyboard |
| 360px | full | full | stacked narrative、financial internal scroll、44px、overflow 0 |

各widthで次を実行する。

1. preset apply。
2. URL copy / reload。
3. Company remove / re-add。
4. clear all / focus return。
5. summary / expanded切替。
6. partial missing / all missing / incomparable確認。
7. Fact / Company Claim / Atlas Analysis確認。
8. Evidence marker → drawer → Source。
9. Escape → origin focus。
10. back / forward state restore。

## 14. Future implementation PR unit

Contract採択後も1 PRへすべてを混在させない。

1. Relation executable foundation。Schema / resolver / validator、production relation 0。
2. Set A read model / reviewed relation candidates。UIなし。
3. Set A Compare UI / browser QA。
4. Set B read model / reviewed relation candidates。
5. Set B UI expansion / browser QA。
6. Information reduction correction。

同じshared UIでSet Bを追加するだけでsemantic data変更がない場合、Steps 4と5は1 PRへ統合できる。各merge後にmainから次を開始する。

## 15. 今回対象外

- UI、Schema、loader、validatorの実装。
- 新規Relation record。
- Product / Technology / Market registry。
- 追加Web research。
- Company / Evidence / Source / financial修正。
- 5社evidence-view Compare。
- TSMC / Samsung Foundry法人scope解決。
- Fujikura / Corning、Vertiv / Eaton / SchneiderのPilot実装。
- ranking、score、FX conversion、consensus、recommendation。
- Compare / Relation Freeze。

## Rationale

Set Aは同一currencyと2-columnの最小case、Set Bは3-column、process scope、Facility、mixed currencyのguard caseを提供する。両setを使うと、Relation modelとCompare UIの主要分岐を既存Evidenceだけで検証できる。

## Alternatives rejected

- TSMC / Samsung Foundry。canonical entityがSamsung Electronics全社であり、foundry segmentとのscope mismatchをPilotへ持ち込むため却下。
- Fujikura / Corning。Product / Technology evidenceは強いが、current common financial metricsが全missingで初回financial UX検証が弱いためdefer。
- Vertiv / Eaton / Schneider。業態差検証には有効だが、Schneiderのannual / EURとcurrent metric missingがinitial Pilotの比較不能を増やすためdefer。
- 5候補すべてを同時実装。情報削減とRelation scope reviewが拡散するため却下。
- current competitor arraysをPilot Relationとして採用。scopeとEvidenceがないため却下。

## Consequences

- Set Aでもcapacity missingが可視になり、completeに見える比較にはならない。
- Set Bのabsolute financialはnative currencyのまま比較不能となる。
- P2初期投影の表示規則を新validatorで固定する必要がある。
- Evidence drawer interactionをshared化する場合、Company Page回帰QAが必要になる。
- Candidateに含まれないCompanyへPilot codeをhard-codeしない設計が必要になる。

## Open questions

1. Set A → Set Bの連続2 UI PRを採択するか、1 Pilot UI PRへまとめるか。
2. `view=evidence` opt-inを採択するか。
3. mandatory dimensionに限るP2初期投影を採択するか。
4. Set Bのinitial Financialをratioだけに限定し、absolute historyをexpandedへ置くか。推奨は限定。
5. Pilot relation authoringをCompare UI前の独立PRにするか。推奨は独立PR。
