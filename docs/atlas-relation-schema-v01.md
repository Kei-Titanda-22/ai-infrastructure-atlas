# Atlas Relation Schema v0.1 — Design Proposal

- Status: Draft; non-executable design
- Baseline main: `95b33c6d45923595a71a7c60ea948f50f5b2ff50`
- Company Evidence Schema changed: **NO**
- Migration executed: **NO**
- Relation data added: **NO**

## Decision

Compare、Value Chain Navigation、Technology Navigationは1つのcommon Relation modelを利用する。v0.1 authoring schemaへ導入する候補として次の8 typesを採択する。

1. `PRODUCES`
2. `DEVELOPS`
3. `USES`
4. `ENABLES`
5. `SUPPLIES_TO`
6. `COMPETES_WITH`
7. `OPERATES`
8. `POSITIONED_IN`

`SUBSTITUTES`、`EXPANDS`、`EXPOSED_TO`はDeferredを維持し、v0.1 MVPのauthoring enumへは採択しない。`ENABLES`と`SUPPLIES_TO`はguarded typeであり、Pilotで無条件にauthoringしない。direct Evidence、structured Locator、scopeが揃う場合だけ公開可能とする。Capacity / Roadmapは既存Company Evidence Claimを利用し、専用event modelが必要かをCompare Pilot後に再評価する。

RelationはCompany Evidenceから独立したrecordであり、EvidenceとSourceを埋め込まない。authoring Relationには`evidenceIds`と`sourceIds`を保存せず、Relation Evidence Bindingをprovenanceの正本とする。resolved read modelだけがBindingsから両fieldを導出する。canonical flowは次とする。

`Relation → Relation Evidence Binding → Shared Source Registry`

## 1. Entity一覧と責務

| Entity | 責務 | v0.1 identity | Relation endpoint |
| --- | --- | --- | --- |
| Company | 法人・上場主体・Atlas company scope | existing `companyId` | YES |
| Product | company-specific product familyまたはreview済みproduct category | new canonical Product ID | YES |
| Technology | process、architecture、protocol、material technology | new canonical Technology ID | YES |
| ValueChainNode | Atlas編集構造上のstage | existing `value-chain.json` stage ID候補 | YES |
| Facility | 製造・R&D・operating site | existing `facilityId` | YES |
| Market | review済みend market / demand domain | new canonical Market ID | YES |
| Evidence | RelationとSourceのsupport、Locator、lastChecked | new Relation Evidence Binding ID | NO。governance edgeとして別管理 |
| Shared Source | 一次資料metadata | existing `sourceId` | NO。Evidenceから参照 |

Company classification Layerはbackward compatibilityのため維持するが、ValueChainNodeとはmergeしない。

## 2. Relation方向とcardinality

| Type | Subject → Object | Cardinality | Reverse view | Scope rule |
| --- | --- | --- | --- | --- |
| `PRODUCES` | Company → Product | many-to-many | `producedBy`をread modelで生成 | Product endpointが粒度を定義。任意でMarket / geography scope |
| `DEVELOPS` | Company → Technology | many-to-many | `developedBy` | joint developmentは複数Relationで表現 |
| `USES` | CompanyまたはProduct → Technology | many-to-many | `usedBy` | named adoptionは直接Evidence必須 |
| `ENABLES` | Product → Technology | many-to-many | `enabledBy` | guarded。direct Evidence、structured Locator、scope必須 |
| `SUPPLIES_TO` | Company → CompanyまたはMarket | many-to-many | `suppliedBy` | guarded。direct Evidence、structured Locator、scope必須 |
| `COMPETES_WITH` | Company → Company | many-to-many、対称 | 同じrecordを両側へ投影 | scope最低1項目、Evidence必須 |
| `OPERATES` | Company → Facility | one Company to many Facilities。joint operation可 | `operatedBy` | ownershipを意味しない |
| `POSITIONED_IN` | Company、Product、Technology → ValueChainNode | many-to-many | `contains`ではなく`participants` | 通常`atlas-analysis`。Atlas編集分類と明示 |

逆関係は保存しない。`COMPETES_WITH`はCompany IDをlexicographic orderに並べた1 recordだけを保存し、UIで対称表示する。他のRelationはdirectionを保持し、逆向きrecordを重複保存しない。

## 3. Relation type候補の評価

| Candidate | Decision | 理由 |
| --- | --- | --- |
| `PRODUCES` | ADOPT | Company CompareとTechnology roleの基本 |
| `DEVELOPS` | ADOPT | Developer roleを`PRODUCES`から分離 |
| `USES` | ADOPT | User / Adopter roleを明示できる |
| `ENABLES` | ADOPT WITH GUARD | Pilotで無条件にauthoringしない。direct Evidence、structured Locator、scopeが揃う場合だけ公開 |
| `SUPPLIES_TO` | ADOPT WITH GUARD | Pilotで無条件にauthoringしない。direct Evidence、structured Locator、scopeが揃う場合だけ公開 |
| `COMPETES_WITH` | ADOPT WITH GUARD | Company Compareに必要。scopeなしは禁止 |
| `SUBSTITUTES` | DEFER | direction、性能世代、部分代替、geographyをMVPで安全に閉じられない |
| `OPERATES` | ADOPT | Existing FacilityをCompanyへ接続できる。ownershipと区別 |
| `EXPANDS` | DEFER | RelationよりCapacityEvent / Roadmap Claimが適切。generic Capex誤推論の危険がある |
| `EXPOSED_TO` | DEFER | broad analytical edgeになりやすい。現行end-market Claimで足りる |
| `POSITIONED_IN` | ADOPT | Value Chain Navigationの最小edge。Atlas編集分類として種別を明示可能 |

## 4. Authoring Relationとresolved read model

### Authoring Relation required fields

authoring Relationでは次を必須keyとする。nullable fieldもkey自体は保持する。`evidenceIds`、`sourceIds`、`freshnessStatus`はauthoring schemaに含めない。

| Field | Type | Rule |
| --- | --- | --- |
| `relationId` | identifier | immutable、lower kebab-case、global unique |
| `subjectType` | entity type | endpoint matrixに合うこと |
| `subjectId` | identifier | canonical entityに解決できること |
| `relationType` | enum | v0.1採択typeだけ |
| `objectType` | entity type | endpoint matrixに合うこと |
| `objectId` | identifier | canonical entityに解決できること |
| `scope` | object | 常に存在。guarded typeでは最低1 dimension |
| `statement` | string | atomic、600文字以内、表示可能な関係説明 |
| `claimType` | enum | frozen Company Evidence enumを再利用 |
| `asOf` | ISO date | statementの情報時点 |
| `lastVerified` | ISO date or null | public relationはnon-null |
| `nextReview` | ISO date or null | shared freshness helperの入力 |
| `importance` | `P1`, `P2`, `P3` | reading priority。truthやconfidenceではない |
| `displayPriority` | integer 1–99 | 同じgroup内の安定sortのみ |
| `confidence` | `low`, `medium`, `high`, null | Atlas Analysis / estimateはnon-null、Factはnull |
| `validFrom` | ISO date or null | Relationが有効になった日。未確認ならnull |
| `validTo` | ISO date or null | 終了日。activeを推測せずnullを許容 |
| `supersededBy` | relation ID or null | 後継Relation。自己参照・cycle禁止 |

Relation Evidence BindingはRelation fileと別のauthoring recordとして保存し、`relationId`でRelationへ接続する。Relation authoring recordからBinding IDまたはSource IDを逆参照しない。

### Resolved read model derived fields

resolved read modelはauthoring Relationの全fieldを保持し、resolverが次を追加する。

| Field | Type | Derivation rule |
| --- | --- | --- |
| `evidenceIds` | unique identifier array | 当該`relationId`を参照するRelation Evidence Binding IDをstable sort |
| `sourceIds` | unique identifier array | derived `evidenceIds`のBindingsが参照するShared Source IDをdeduplicateしてstable sort |
| `freshnessStatus` | derived enum | `nextReview`とreference dateから`current`, `review-due`, `stale`のいずれかを導出 |

`not-applicable`はRelation freshnessではない。Categoryがbusiness model上適用されない状態はCoverage slotのmissing reasonとして扱い、Relation recordを作成しない。

### Scope object

`scope`は次の固定keyを持つ。空配列とnullを明示し、任意textだけでscopeを済ませない。

| Field | Type | Purpose |
| --- | --- | --- |
| `productIds` | unique Product ID array | 製品family / category |
| `technologyIds` | unique Technology ID array | process / architecture / protocol |
| `valueChainNodeIds` | unique ValueChainNode ID array | 競争・供給が成立する工程 |
| `marketIds` | unique Market ID array | end market / demand domain |
| `geographies` | canonical geography ID array | 地域限定 |
| `businessUnit` | string or null | legal Company内のsegment scope。free-form暫定値はreview必須 |
| `capacityBasis` | string or null | 将来eventを採択する場合だけ使用。generic Capexを入れない |

`COMPETES_WITH`は`productIds`、`technologyIds`、`valueChainNodeIds`、`marketIds`のいずれか1つ以上を必須とする。`SUPPLIES_TO`でobjectがCompanyの場合も同じ条件を適用する。

## 5. Claim type、importance、時間

Relationの`claimType`はCompany Evidence v0.2のenumをそのまま使う。

- `fact`: Sourceが関係を直接識別する。
- `company-guidance`: 将来の供給、利用、拡張等を会社が計画として述べる。
- `company-positioning`: 会社が自社のpositionまたはcompetitionを述べる。
- `atlas-analysis`: 複数の事実からAtlasが関係を整理する。
- `estimate`: 明示的なAtlas推定。

`importance`は既存P1 / P2 / P3のreading orderを再利用する。`displayPriority`は同priority内のsortであり、investment importance、evidence strength、confidenceを表さない。

## 6. Evidence Bindingとprovenance

Relation Evidence BindingはCompany Evidence Bindingと同じ分離原則を使う。

| Field | Rule |
| --- | --- |
| `id` | unique lower kebab-case |
| `relationId` | 既知Relationへ解決 |
| `sourceId` | Shared Source Registryへ解決 |
| `support` | `supports`, `context`, `contradicts` |
| `locator` | frozen Locator fieldのうち1つ以上のnon-empty value |
| `lastChecked` | ISO date |
| `notes` | optional。support解釈だけに使用 |

Relation Evidence Bindingをprovenanceの唯一の正本とする。authoring Relationには`evidenceIds`と`sourceIds`を置かず、resolverがread modelへ両fieldを必ず導出する。validatorはderived ID集合とBinding / Source resolverの結果が一致することを検査する。LocatorやSource metadataをRelationへcopyしない。

named Company relationのpublic表示には最低1件のdirect `supports` Binding、structured Locator、required scopeが必要である。`ENABLES`と`SUPPLIES_TO`にも同じgateを適用し、Pilotで無条件にauthoringしない。`context`だけでは公開しない。`contradicts`が未解決なら`needs-review`相当として公開を止める。

## 7. Freshness、validity、supersession

- `freshnessStatus`は`nextReview`とruntime / build reference dateからshared helperで`current`、`review-due`、`stale`のいずれかを導出する。
- `not-applicable`はCoverage slot側で扱い、Relation freshness enumへ含めない。
- `stale`はRelationの削除やfalseを意味しない。
- `validFrom` / `validTo`はSourceが期間を閉じる場合だけ入れる。
- 新しいstatementが古いstatementを置き換える場合、古いrecordの`supersededBy`を新relationIdへ向ける。
- 同一signatureでvalidityが重複するactive Relationを複数作らない。
- supersession chainはacyclicで、後継が同じlogical relation scopeを持つことをvalidatorで確認する。

## 8. Inference protection

次からnamed Relationを生成してはならない。

- `company.competitors[]`だけ。
- Product compatibility、共通tag、同じLayer、同じMarketだけ。
- generic customer list、業界慣行、text similarityだけ。
- generic CapexまたはR&D expenditureだけ。
- Atlasの常識的推測だけ。
- Source URLだけでLocatorがない状態。

Atlasが構造上の位置やenablementを整理する場合は`atlas-analysis`、confidence、notes相当のrationale、Evidenceを必須にする。Companyの自己評価は`company-positioning`として保持する。

## 9. Validation rules

### Structural

- Relation ID、Evidence Binding IDのunique。
- relationTypeとsubject / object type combinationのallowlist。
- canonical endpoint、Source、Evidence、scope IDsの解決。
- orphan Relation、Binding、Source、supersededByの拒否。
- ISO date、date ordering、validity ordering。
- claimType、importance、confidence、freshness enum。
- authoring Relationに`evidenceIds`、`sourceIds`、`freshnessStatus`が存在しないこと。
- resolved read modelの`evidenceIds` / `sourceIds`とBinding / Source resolver結果の一致。
- resolved `freshnessStatus`が`current`、`review-due`、`stale`だけであること。

### Semantic guards

- guarded typeにrequired scope dimension、direct `supports` Binding、structured Locatorがある。
- `COMPETES_WITH`のendpointは異なるCompanyである。
- symmetric relationはcanonical endpoint orderで1件だけ。
- `fact`はconfidence null、`atlas-analysis` / `estimate`はconfidence non-null。
- public relationはdirect `supports` Binding、structured Locator、`lastVerified`を持つ。
- `ENABLES`とnamed `SUPPLIES_TO`はSourceが明示された関係を直接識別する。
- `OPERATES`はownershipを暗示するstatementにしない。
- `POSITIONED_IN`のAtlas編集mappingはFactに昇格しない。

### Duplicate detection

logical signatureを次で作る。

`subjectType + subjectId + relationType + objectType + objectId + normalized scope + overlapping validity`

`COMPETES_WITH`ではendpointをsortしてからsignatureを作る。同じsignatureでSourceだけが増えた場合はBindingを追加し、Relationを複製しない。statementまたはclaimTypeが衝突する場合はreview failureとし、勝手にmergeしない。

### Orphan detection

- unknown Company / Product / Technology / ValueChainNode / Facility / Market。
- unknown Relation Evidence BindingまたはShared Source。
- Bindingから参照されないRelation ID。
- Relationから参照されないBinding ID。
- unknownまたはcycleする`supersededBy`。
- scope内だけに現れるunknown entity ID。

## 10. Non-executable example

次はauthoring Relationの形状説明だけの例であり、既存AMAT / TEL relationの追加、Evidence判定、migrationを意味しない。

```json
{
  "relationId": "rel-applied-materials-competes-with-tokyo-electron-deposition",
  "subjectType": "company",
  "subjectId": "applied-materials",
  "relationType": "COMPETES_WITH",
  "objectType": "company",
  "objectId": "tokyo-electron",
  "scope": {
    "productIds": ["product-category-deposition-equipment"],
    "technologyIds": ["technology-thin-film-deposition"],
    "valueChainNodeIds": ["manufacturing"],
    "marketIds": [],
    "geographies": [],
    "businessUnit": null,
    "capacityBasis": null
  },
  "statement": "Illustrative scoped competition statement; not production data.",
  "claimType": "company-positioning",
  "asOf": "2026-01-01",
  "lastVerified": "2026-01-01",
  "nextReview": "2027-01-01",
  "importance": "P1",
  "displayPriority": 10,
  "confidence": null,
  "validFrom": null,
  "validTo": null,
  "supersededBy": null
}
```

resolverは別authoring recordであるRelation Evidence Bindingを解決し、read modelへ次のderived fieldsを追加する。

```json
{
  "relationId": "rel-applied-materials-competes-with-tokyo-electron-deposition",
  "evidenceIds": ["rel-evidence-example-scoped-competition"],
  "sourceIds": ["source-example-scoped-competition"],
  "freshnessStatus": "current"
}
```

## 11. Canonical IDとalias

- IDはASCII lower kebab-caseでimmutableとする。
- Company、Facility、ValueChainNodeは既存IDを再利用する。
- Product、Technology、MarketはPilot Relationのendpointまたはscopeに必要な最小review済みregistryが作られるまでRelationに使わない。全件registryを先行作成しない。
- entity registryは`canonicalName`、locale別display name、`aliases[]`、`status`、`replacedBy`を持つ候補とする。
- aliasはlookup用であり、Relation recordはcanonical IDだけを保存する。
- display label変更でIDを変更しない。
- Company aliasは既存`name`, `officialName`, `japaneseName`, `reading`, tickerをresolverが利用する。

## 12. Migration方針

このDraftのreview後は、次のPR順序を変更しない。

1. Pilot用Minimal Product / Technology / Market Registry。Pilot Relationのendpointまたはscopeに必要なcanonical entityだけを追加する。
2. Relation executable foundation。authoring schema、resolved schema、Relation Evidence Binding、empty manifest / resolver、validatorを導入し、production Relationは0件を維持する。
3. Pilot Relation / projection data。Set A / Bだけを既存Evidenceから人手reviewする。
4. Generic Company Compare UI。`view=evidence`でSet A / Bの両方へ対応する。
5. Information reduction correction。
6. Compare / Relation Freeze。

competitor配列、products、tagsはbackward-compatible fallbackとして維持し、Freeze後にだけPriority 1 rolloutを検討する。

自動text extraction、bulk slug migration、competitor copyは行わない。

## 13. Backward compatibilityと既存Schemaへの影響

- Company Evidence Schema v0.2を変更しない。
- Freeze contractを変更しない。
- Company JSON、Facility、financial schemaを変更しない。
- Source Registryを共有するが、Source recordを複製しない。
- Relation schemaは独立version `0.1`として追加する候補であり、Company Evidence versionと混同しない。
- `view=evidence` opt-in Pilotを採択し、既存CompareはFreezeまで既定動作を維持する。
- `relationships.json`とlegacy competitor UIはmigration完了まで読み取り専用fallbackとする。

## Rationale

8 typesは3 UX use caseに必要なroleとnavigationを表現しつつ、capacity event、substitution、broad exposureの高推論領域を避ける。Claim typeとEvidence Bindingの既存contractを再利用することで、Relationだけが弱いprovenanceを持つ状態を防げる。

## Alternatives rejected

- Compare、Value Chain、Technologyごとに別Schemaを作る案。relation semanticsが分岐するため却下。
- 全11候補typeをv0.1で採択する案。`SUBSTITUTES`、`EXPANDS`、`EXPOSED_TO`の意味を安全に閉じられないため却下。
- RelationへSource metadataとLocatorを埋め込む案。Shared Source分離に反するため却下。
- authoring Relationに`sourceIds`または`evidenceIds`を保持する案。Bindingとの二重正本になるため却下。
- unscoped Company competitionを許す案。Company Compareで誤読を生むため却下。
- inverse relationをすべて保存する案。duplicateとstaleness divergenceを増やすため却下。

## Consequences

- Relation実装前に、Pilot endpoint / scopeだけを対象にした3つのminimal canonical entity registryが必要になる。
- named supplier / competitor relationは既存Evidenceがあってもscope reviewを要する。
- Capacity / RoadmapはCompare PilotではClaim projectionのままであり、graph queryの対象にならない。
- Relation validatorはstructural checkだけでなくguarded semantic ruleを持つ必要がある。

## Open questions

1. Pilot minimal registryでProduct entityをcompany-specific familyに限定するか、review済みgeneric categoryも同じEntityで扱うか。
2. Pilot RelationでCompany未満のscopeが必要になった場合、`businessUnit`を使用せずdeferするか、最小Company scope registryを追加するか。
3. bounded Evidence review後、`ENABLES`または`SUPPLIES_TO`でpublic gateを満たすPilot recordが存在するか。
