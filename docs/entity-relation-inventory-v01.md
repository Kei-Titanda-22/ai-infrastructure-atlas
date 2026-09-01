# Entity / Relation Inventory v0.1

- Status: Read-only inventory complete; design review pending
- Baseline main: `95b33c6d45923595a71a7c60ea948f50f5b2ff50`
- Inventory date: 2026-09-01
- Web research performed: **NO**
- Production data changed: **NO**

## Decision

Phase 8ではCompany、Company Evidence、Shared Source、Financial history、Facility、Value Chainの既存正本を再利用する。Product、Technology、Marketは現在canonical entityではないため、文字列からRelationを自動生成しない。新たに永続化する対象は、scope、方向、時間、Evidenceを必要とする関係だけとする。

`src/data/relationships.json`は空配列であり、現行の競合・所属・製品・技術関係は複数fieldとUI logicへ分散している。Company Evidence v1 Closeは成立しているが、Relation graphが完成していることを意味しない。

## 1. Inventory方法

次をread-onlyで確認した。

- 100 Company JSONとAstro content schema。
- Company Evidence manifestの25 shards。
- Shared Source manifestの61 shards。
- Facility、Value Chain、Layer、filter、legacy Claim、Relation、comparison template。
- normalized financial history 247 records。
- Company Page、Compare、Evidence components、resolver、validator。
- v1 Close、Validation v0.2、Freeze、Coverage、Global Visual System文書。

集計は同一mainから決定論的に行った。一次資料の追加探索、既存statementの再解釈、データ修正は行っていない。

## 2. Baseline

| 項目 | 現在値 | 正本 |
| --- | ---: | --- |
| Companies | 100 | [`src/data/companies/`](../src/data/companies/) |
| Company Evidence maturity L4 | 100 / 100 | [`company-evidence-v1-coverage-close.md`](./company-evidence-v1-coverage-close.md) |
| Claims | 1,062 | [`company-evidence-manifest.json`](../src/data/company-evidence-manifest.json) |
| Evidence Bindings | 1,063 | 同上 |
| Coverage records | 1,100 | 同上 |
| Coverage | complete 321 / partial 740 / not-started 39 | [`company-evidence-coverage-audit-v01.json`](./company-evidence-coverage-audit-v01.json) |
| Resolved Shared Sources | 369 | [`source-registry-manifest.json`](../src/data/source-registry-manifest.json) |
| Facilities | 17 records / 5 companies | [`facilities.json`](../src/data/facilities.json) |
| Value Chain stages | 9 | [`value-chain.json`](../src/data/value-chain.json) |
| Layer records | 9 | [`layers.json`](../src/data/layers.json) |
| Financial history | 247 records / 100 companies | [`financial-history.ts`](../src/lib/financial-history.ts) |
| Persisted Relation records | 0 | [`relationships.json`](../src/data/relationships.json) |
| Compare templates | 8 templates / 各5社 | [`comparison-templates.json`](../src/data/comparison-templates.json) |

`docs/status.md`は2026-08-31時点のpre-enrichment Coverageを残しており、最新Close値の正本ではない。本Inventoryではv1 Close、Validation v0.2、current auditを優先した。既存status文書は変更していない。

## 3. Entity inventory

| Concept | 現在存在するもの | Canonical ID / alias | 現在の関係表現 | 判定 |
| --- | --- | --- | --- | --- |
| Company | 100 JSON。identity、layers、products、tags、competitors、legacy narrative、metrics | file stem = `id`が100 / 100。`name`, `officialName`, `japaneseName`, `reading`, tickerがalias相当 | 多数のID参照先 | 既存正本を再利用 |
| Evidence | Claim 1,062、Binding 1,063、structured Locator 1,063 | Claim ID / Evidence Binding IDはlower kebab-case | ClaimからSourceへsupport付きbinding | 既存正本を再利用 |
| Source | resolved 369、全件company-scoped | stable `sourceId`。compatible duplicate occurrence 2、conflict 0 | Company、Evidence、Facility、financialから参照 | 既存resolverを再利用 |
| Product | Company `products[]` 272 unique literal、Company Evidence `products` Claims | canonical Product IDなし。表示辞書は一部のみ | Company配列とClaim本文に埋め込み | registry作成後にRelation化 |
| Technology | Company `tags[]` 205 unique literal、Company Evidence `technology` Claims | canonical Technology IDなし。filter IDは`semiconductor-test`のみ | tag filter、Claim本文、display辞書 | registry作成後にRelation化 |
| Facility | 17 records。city、region、type、role、Source、status | stable facility IDあり。generic aliasなし | `companyId`と`sourceId` | 既存entityを再利用。Relation Evidenceは別途必要 |
| Market / End Market | `customer-end-market` Claims 99件、legacy prose、tag | canonical Market IDなし | statement内のtext | Pilot CompareはClaimのまま。graph化は追加review後 |
| Category | Evidence category 11、Company layer 9、Value Chain stage 9、filter taxonomy | それぞれ別ID体系 | UIごとに異なる意味 | 統合しない。責務を明示 |
| ValueChainNode | `value-chain.json`の9 stageと表示link | stable stage IDあり | `stageLayers`とtag / query / technology link | stage IDを将来ValueChainNode正本候補にする |
| Competition | Company `competitors[]`、Evidence `competitive-positioning` Claims | Company IDのみ。scope IDなし | UIでoutgoing + incomingをunion | legacy表示は維持。Relationへ自動移行しない |
| Capacity / Roadmap | `capacity-expansion` Claims 76、`strategy` Claims 100 | Claim IDのみ | Claim categoryと時間metadata | CompareはClaimを利用。event entityはMVP外 |

## 4. IDとalias

### 現在安全に再利用できるID

- Company: 100件すべてfile stemと`company.id`が一致する。
- Claim / Evidence Binding: Freeze validatorでunique、orphan、enum、Locatorを検査する。
- Source: manifest resolverが369 unique IDを解決する。
- Facility: `facility.id`が存在し、CompanyとSource参照をvalidatorが検査する。
- Value Chain: `demand`, `compute`, `memory`, `materials`, `manufacturing`, `backend`, `interconnect`, `datacenter`, `physical`。
- Financial: record、metric definition、Source、calculation IDが既存loader / validatorで管理される。

### ID化されていない概念

- Productは表示文字列であり、SKU、製品family、一般product categoryが同じ配列に入る。
- Technologyはtag文字列であり、process、protocol、product class、end marketも混在し得る。
- Market / End Marketは主にClaim statement内の語である。
- geographic scopeはCompany countryとFacility text以外に共通IDを持たない。

`products[]`と`tags[]`にNFKC + casefoldで衝突する表記は0 groupだった。ただし、これはsemantic synonym、製品familyの包含、日英aliasが正規化済みであることを意味しない。

### Alias方針への含意

Companyのidentity fieldsは検索aliasとして利用できる。Product、Technology、Marketでは、canonical ID、canonical name、locale別display name、alias、deprecated alias、`replacedBy`を持つ小さなregistryが必要である。既存literalをaliasとして一括採択せず、人手reviewした値だけを紐付ける。

## 5. 暗黙Relation inventory

| 暗黙field / logic | 実質的な関係 | 現在の制約 | Phase 8での扱い |
| --- | --- | --- | --- |
| `company.primaryLayer`, `company.layers[]` | Companyの分類所属 | CompanyはLayer nameを参照し、`layers.json`のIDを参照しない | backward-compatible mappingを維持。ValueChainNode relationとは別物 |
| `company.products[]` | Company produces / offers Product | plain string、Evidence IDなし | Compare fallbackのみ。Relationへ自動変換しない |
| `company.tags[]` | CompanyとTechnology等の関連 | tagのontologyとroleがない | 検索候補には使えるがRelation判定には使わない |
| `company.competitors[]` | Company competition | scope、Evidence、asOfなし | current UIだけで利用。新Relationへは手動review必須 |
| `Claim.evidenceIds[]` | Claim supported by Evidence | frozen contractあり | そのまま再利用 |
| `EvidenceBinding.sourceId` | Evidence cites Source | support、Locator、lastCheckedあり | そのまま再利用 |
| `Facility.companyId` | Company operates Facility | SourceはあるがRelation Locatorなし | candidate relationは導出可。公開relationにはbinding reviewが必要 |
| `value-chain.links[]` | Stageから検索filterへの導線 | tag 58、query 2、technology filter 1 | navigation linkとして維持。supply graphとはみなさない |
| `filter.stageLayers` | StageからCompany Layerへのmapping | `demand`を除く8 stage。`manufacturing`は2 Layersへ対応 | Atlas編集mappingとして利用可能 |
| metric / KPI `sourceId` | Company metric cites Source | financial専用definitionと比較判定あり | Relationへ混ぜない |

## 6. Competitionの現状

Company JSONには133 directed competitor edges、94 unique undirected pairsがある。55 edgeは片方向保存で、Company Pageはincomingとoutgoingをunionして双方向に表示する。14社は両方向を合わせてもeffective competitorが0件である。

この表示は探索導線としては有用だが、Freeze済みRelation Evidence contractを満たさない。

- scopeがない。
- Evidence Bindingとstructured Locatorがない。
- `asOf`、validity、freshnessがない。
- 競争が全社、製品、process、地域のどれか区別できない。
- UI上の双方向化と、保存されたdirectionが分離している。

したがって、133 edgeを`COMPETES_WITH`へ一括migrationしてはならない。

## 7. Value Chainの現状

Value Chainは9 stageの編集順、説明、61 linksを持つ。Company filterは8 stageをCompany Layerへmappingし、`manufacturing`だけがFoundryとWafer Fab Equipmentの2 Layersへ対応する。

Value Chain stageとCompany Layerは同数だが1対1ではない。`demand`に対応するCompany Layerはなく、半導体製造stageは2 Layersを束ねる。両者を同一Entityへmergeすると既存filterと意味を壊すため、ValueChainNodeとCompany classification Layerを分離する。

stage順からdirect upstream / downstreamをAtlas編集構造として安全に表示できる。ただし、Company間のsupplier/customer Factは導出できない。

## 8. Evidenceから安全に導出できるもの

「導出できる」は自動永続化を意味しない。元Claimのepistemic type、priority、Evidence、asOfを保ったread model projectionに限定する。

| Projection | 安全な入力 | 条件 |
| --- | --- | --- |
| Company CompareのAI role | `ai-infrastructure-role` Claim | statementを改変せずclaimTypeを保持 |
| Value Chain position | `value-chain-position` Claim | 通常はAtlas Analysisとして表示 |
| Key Products | `products` Claim | Product entity IDを推測しない |
| Technology / Moat | `technology`, `competitive-positioning` Claims | Company ClaimとAtlas Analysisを区別 |
| Capacity / Roadmap | `capacity-expansion`, `strategy` Claims | generic Capexをcapacityと再解釈しない |
| Key Risks | `risks` Claim | FactとAtlas Analysisを区別 |
| Evidence bibliography | Claim → Binding → Source | resolverを通し、Locatorを保持 |
| Company positioned in node候補 | `value-chain-position` Claim | review後の`POSITIONED_IN` candidate。自動persistしない |
| Company operates Facility候補 | Facility record + facility Source | publish前にRelation Evidence Locatorが必要 |

現在のClaim coverageは、AI role、overview、competitive positioning、products、risks、strategy、technology、value-chain positionが各100社、customer / end marketが99社、manufacturing facilityが87社、capacity expansionが76社である。

## 9. 新規Relationとして明示的に保持すべきもの

Phase 8 MVPで永続化価値があるのは、複数画面で同じ意味を使い、かつscope / Evidence / validityを失うと誤読する関係である。

- Company `POSITIONED_IN` ValueChainNode。
- Company `PRODUCES` Product。
- Company `DEVELOPS` Technology。
- CompanyまたはProduct `USES` Technology。
- Product `ENABLES` Technology。
- Company `SUPPLIES_TO` CompanyまたはMarket。ただしnamed edgeは直接Evidence必須。
- scoped Company `COMPETES_WITH` Company。
- Company `OPERATES` Facility。

詳細は[Atlas Relation Schema v0.1](./atlas-relation-schema-v01.md)で定義する。

## 10. Phase 8 MVPには不要なもの

- 全100社のcustomer / supplier graph。
- market share、価格、契約額、ownership graph。
- Company scoreやrecommendation relation。
- Facility間の物流・地理graph。
- real-time event stream。
- generic Capexから作るcapacity relation。
- `SUBSTITUTES`、`EXPANDS`、`EXPOSED_TO`の初期永続化。
- legacy Claimやcompetitor配列の全件migration。

Capacity / Roadmapは最初のCompare Pilotでは既存Claimを表示し、CapacityEvent Entityを先行追加しない。

## 11. 追加調査または人手reviewが必要なもの

- named supplier / customer relation。
- Company対Companyのcompetition scope。
- ProductとTechnologyのcanonical boundary。
- Substituteの方向、対象、地域、世代。
- Market / End Market taxonomy。
- Samsung FoundryをSamsung Electronicsの一部として扱う法人・segment scope。
- Facility recordを`OPERATES`へ昇格するためのstructured Locator。
- validity期間を閉じるための過去Relation review。

これらは今回調査せず、未収録またはdeferredとして設計へ反映する。

## 12. UIで個別解釈されている関係

| UI | 現在の解釈 | Phase 8上の注意 |
| --- | --- | --- |
| Company Page | `competitors[]`のincoming / outgoingをunion | persisted symmetric relationではない |
| Company Page | manifestにCoverageがあるCompanyをEvidence表示へ切替 | 現在は100社すべて該当するが変数・class名に`pilot`が残る |
| Compare | legacy products、tags、facilities、current metric snapshotをpage内で集約 | Company EvidenceとRelation resolverを利用していない |
| Compare | 3つのSource shardを直接import | Shared Source manifest resolverと異なる経路 |
| Compare | all-selected-missing metricをprimary matrixから除外 | presentation ruleでありdata削除ではない |
| Value Chain | stage linkをtag / query / technology filterへ変換 | Evidence付きRelationではない |
| Evidence drawer | component markupは再利用可能 | open / Escape / focus return scriptはCompany Page内にある |

## 13. 重複・欠落・drift

### 重複または並行概念

- Company Layer、Value Chain stage、Evidence categoryは別責務だが、現在のUIでは近い語として見える。
- Companyのlegacy narrativeとCompany Evidence Claimが並存する。
- Source registryにはcompatible duplicate ID occurrenceが2件あるが、URL / company conflictは0件で、resolverが後段metadataを正とする。
- ProductとTechnologyの表示辞書は一部literalだけを変換し、canonical registryではない。

### 欠落

- Product、Technology、Marketのcanonical entity registry。
- Relation Evidence Binding schema / resolver / validator。
- scope付きRelationの正本。
- Relation freshness / supersession。
- generic alias registry。
- Company Evidenceを使うCompare read model。

### 文書drift

`docs/status.md`のCoverage / maturityは最新Close前の値である。Phase 8成果物は最新Close文書を正とし、status更新は本Draft PRの範囲外とする。

## 14. 再利用可能な実装

| 種別 | 既存資産 | 再利用方法 |
| --- | --- | --- |
| Company loader | [`src/content.config.ts`](../src/content.config.ts) | canonical Company IDとidentity |
| Evidence loader | [`src/lib/company-evidence.ts`](../src/lib/company-evidence.ts) | 100社Claims / Bindings / Coverage |
| Source resolver | [`src/lib/source-registry.ts`](../src/lib/source-registry.ts) | relation Source解決のpattern |
| Freshness | [`src/lib/evidence-freshness.ts`](../src/lib/evidence-freshness.ts) | date-only derivation contract |
| Financial loader | [`src/lib/financial-history.ts`](../src/lib/financial-history.ts) | native currency / unit / period |
| Evidence UI | [`CompanyEvidenceClaim.astro`](../src/components/CompanyEvidenceClaim.astro) | markerとdrawer markup |
| Evidence grouping | [`CompanyEvidenceClaims.astro`](../src/components/CompanyEvidenceClaims.astro) | priority / Coverage projection |
| Compare | [`compare.astro`](../src/pages/compare.astro) | selection、URL、missing、compatibility logic |
| Data validator | [`validate-data.py`](../scripts/validate-data.py) | Company、Source、Layer、metric参照 |
| Relation audit | [`audit-company-relations.py`](../scripts/audit-company-relations.py) | legacy competitor coverageだけ。新Relation validatorとは分離 |
| Freeze validator | [`validate-company-evidence-freeze.py`](../scripts/validate-company-evidence-freeze.py) | Evidence / Source / Locator invariants |
| Facility validator | [`validate-facilities.py`](../scripts/validate-facilities.py) | Facility / Company / Source参照 |
| Compare validator | [`validate-v03.py`](../scripts/validate-v03.py) | template IDとCompany参照 |
| Financial audit | [`audit-financial-quality.py`](../scripts/audit-financial-quality.py) | financial semantic protection |

## Rationale

既存EvidenceはCompare用read modelへ安全に投影できるが、plain stringやUI上の推定をRelation正本へ昇格するとFreeze contractに反する。既存正本を保ち、複数機能で共有すべき関係だけをscope付きRelationにするのが最小変更である。

## Alternatives rejected

- Company JSONをRelation正本として拡張する案。provenance、validity、scopeを一貫して持てないため却下。
- `relationships.json`へcompetitor配列をコピーする案。Evidenceとscopeがないため却下。
- Layer、Value Chain stage、Evidence categoryを単一Category entityへ統合する案。既存意味とcardinalityが異なるため却下。
- Product / Technology文字列をslug化して自動Entity化する案。semantic aliasと粒度を保証できないため却下。
- Capacity claimごとにCapacity Entityを追加する案。最初のCompare Pilotには不要なため却下。

## Consequences

- Compare PilotはCompany Evidenceを直接読むだけでも開始できるが、Relation navigation公開には新Relation正本が必要になる。
- Existing competitor UIはbackward compatibilityとして残るが、Phase 8 Relationとは別表示になる。
- Product / Technology / Market registryの採択がValue Chain / Technology Pilotの前提になる。
- staleなstatus文書は別PRで同期する必要があるが、この設計PRでは変更しない。

## Open questions

1. Company Layerを長期的にID参照へ移行するか、name参照のcompatibility adapterを恒久維持するか。
2. Product registryをcompany-specific product familyに限定するか、generic product categoryも同じEntityで扱うか。
3. Market taxonomyをPhase 8 Priority 1 rollout前に作るか、Technology Pilot後までdeferするか。
4. legacy competitor表示をRelation Freeze後に置き換えるか、明示的に「比較対象」として併存させるか。
