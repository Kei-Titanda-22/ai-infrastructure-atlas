# Advanced UX Requirements v0.1

- Status: Accepted design
- Phase: 8 pre-implementation design
- Baseline main: `95b33c6d45923595a71a7c60ea948f50f5b2ff50`
- Scope: Company Compare / Value Chain Navigation / Technology Navigation
- Implementation authorized by this document: **NO**

## Decision

Phase 8の中心ユースケースをCompany Compare、Value Chain Navigation、Technology Navigationの3つに固定する。3機能は別々のデータ解釈を持たず、同じCompany Evidence、Shared Source、将来の共通Relation read modelを利用する。Relation typeはSchema上の候補として8種を採択し、`SUBSTITUTES`、`EXPANDS`、`EXPOSED_TO`はDeferredを維持する。`ENABLES`と`SUPPLIES_TO`はguarded typeであり、direct Evidence、structured Locator、scopeが揃う場合だけ公開できる。

初期表示は、利用者が60～90秒以内に主要な差異、Value Chain上の位置、関係の根拠を把握できる範囲に限定する。追加情報はP2/P3、詳細なprovenance、履歴の順で展開し、Claim本文やEvidenceを要約のために改変しない。

本要件は[Company Evidence v1 Coverage Close](./company-evidence-v1-coverage-close.md)、[Company Evidence Freeze v0.1](./company-evidence-freeze-v01.md)、[Global Visual System v0.1](./global-visual-system-v01.md)、[Compare viewport correction v0.4](./compare-viewport-correction-v04.md)を前提とする。既存contractと異なる実装は、別のchange-control承認なしには行わない。

## Final adopted decisions

- Pilot Product entityはreview済みgeneric product categoryだけとする。company-specific brand、SKU、named product familyはRelation endpointにせず、既存Company Evidence Claimで表示する。
- v0.1 Pilotでfree-text `businessUnit`を使用しない。Company全体として成立しないRelationはdeferし、Company scope registryは実例発生時の別change-controlとする。
- eligible P2は`displayPriority`昇順、`asOf`降順、`claimId`辞書順で1件を選ぶ。必要metadata欠落は対象外とし、3 dimensions限定、priority / Coverage不変、P3初期0を維持する。
- initial FinancialはOperating MarginとRevenue Growthだけとする。ROIC、その他ratio、absolute financial historyはexpandedへ置き、比較不能ratioは理由付きでprimary comparisonから外す。FX換算、ranking、差分率計算を行わない。
- guarded `ENABLES` / `SUPPLIES_TO`はbounded Evidence review後、direct `supports` Binding、structured Locator、required scopeを満たすrecordだけを採用する。該当0件は正常である。
- Value Chain / Technologyの最終routeはCompare / Relation Freeze後に決定し、Independent Validationのsample size / severity gateはRelation corpus確定後の別contractで定義する。

本Statusは設計採択だけを意味し、実装開始、production Relation追加、migration、deployを意味しない。

## 1. 対象ユーザーと行動

主対象は、AI infrastructure企業を一次資料へ戻りながら比較する投資・産業リサーチ利用者である。

利用者は次を行う。

1. 2～4社の違いを短時間で把握する。
2. あるValue Chainノードの上流・下流と主要企業を辿る。
3. あるTechnologyを起点に企業の役割を分けて確認する。
4. Fact、Company Claim、Atlas Analysisを混同せず読む。
5. 表示された主張または関係から一次資料へ到達する。
6. 欠損、古さ、比較不能を「値がない」一種類へ潰さず理解する。

## 2. 共通Information Architecture

3機能は次の情報階層を共有する。

1. **Context**: 対象Company、ValueChainNode、Technologyと基準日。
2. **P1 Summary**: 主要な差異または関係。初期表示で読める。
3. **Comparison / Relation body**: scope付きの行または関係群。
4. **P2 / P3 detail**: 補足、反証、例外、履歴。
5. **Evidence**: footnote-style markerからEvidence drawerへ進む。
6. **Primary Source**: drawer内のPrimary Source actionから開く。

`Company Claim → Evidence Binding → Shared Source Registry`は変更しない。Relation導入後も`Relation → Relation Evidence Binding → Shared Source Registry`を別系列として保持する。authoring Relationは`evidenceIds` / `sourceIds`を持たず、Relation Evidence Bindingをprovenanceの正本とする。resolved read modelだけが両IDと`freshnessStatus`をderived fieldとして生成する。

## 3. Epistemic表示

Phase 8の表示用概念と既存`claimType`の対応は次のとおりとする。表示用概念は新しい保存enumではない。

| 表示用概念 | 既存値 | 初期表示 |
| --- | --- | --- |
| `FACT` | `fact` | 無装飾の本文。accessible nameとdrawerで事実と明示 |
| `COMPANY_CLAIM` | `company-guidance`, `company-positioning` | `会社見解`をsection単位または必要な行で控えめに表示 |
| `ATLAS_ANALYSIS` | `atlas-analysis`, `estimate` | `Atlasによる分析`を同一sectionで1回だけ表示 |

色、左罫線、badge、pillだけで種別を伝えない。Company ClaimをFactとして書き換えず、Atlas Analysisを会社開示として表示しない。既存Company EvidenceのClaim種別、statement、confidence、Evidence Bindingはそのまま利用する。

## 4. 時間軸の表示

Epistemic種別と時間軸は別軸である。

| 表示用時間軸 | 判定 | 表示ルール |
| --- | --- | --- |
| `CURRENT` | `asOf`時点で有効なFact、Company Positioning、Atlas Analysis | 基準日を表示し、現在も有効と推測しない |
| `COMPANY_PLAN` | 将来計画を述べる`company-guidance` | `会社計画`と対象期間を表示する |
| `ATLAS_ESTIMATE` | `estimate` | `Atlas推定`、基準日、confidenceを表示する |

`atlas-analysis`は自動的に`ATLAS_ESTIMATE`ではない。`company-positioning`は自動的に将来計画ではない。`validFrom`、`validTo`、supersessionが将来Relationで利用可能になった場合だけ、期間フィルタへ使う。

## 5. P1 / P2 / P3

| Priority | UX上の役割 | 表示 |
| --- | --- | --- |
| P1 | 主要理解に必須 | 初期表示 |
| P2 | 比較・判断を補う | 原則として1回のDisclosure内 |
| P3 | 詳細、例外、方法 | P2と同じ展開面の後段 |

CompareではTechnology / Moat、Capacity / Roadmap、Key Risksの3 dimensionsにP1がない場合だけ、eligible P2を各dimensionで1件まで初期表示へ投影できる。選択順は`displayPriority`昇順、`asOf`降順、`claimId`辞書順とする。`asOf`または選択に必要なmetadataが欠けるClaimはeligibleにしない。`補足`であることを表示し、保存priority、Coverage、statement、Evidence Bindingを変更しない。P3の初期表示は0件とし、他のdimensionsへ例外を拡張しない。

## 6. Use case A — Company Compare

### 主要な問い

- 企業はAI infrastructureのどこで価値を提供するか。
- 製品、Technology、競争優位は何が同じで何が異なるか。
- Capacity / Roadmapと主要Riskに重要な差があるか。
- 財務値は本当に比較可能か。
- 各差異はFact、Company Claim、Atlas Analysisのどれか。
- 根拠の一次資料へ短く到達できるか。

### 行動と初期表示

利用者は2～4社を選び、順序付きのURL stateとして保存する。初期表示は次を順に示す。

1. Company identity、ticker、country、比較基準日。
2. AI Infrastructure Role。
3. Value Chain Position。
4. Key Products。
5. Technology / Moat。
6. Capacity / Roadmap。
7. FinancialはOperating MarginとRevenue Growthのうち、2社以上でdefinition、period、basisが比較可能なratioだけ。
8. Key Risks。
9. 各可視statementのEvidence marker。

長文は自然にwrapし、同じCompany identityやSource metadataを複数箇所で反復しない。差異を作れない全社missing行はprimary matrixから外し、Data Qualityへ集約する。

### 展開表示

- P2/P3 ClaimsとCoverage。
- definition、period、basis、currency、verification status。
- ROIC、その他ratio、absolute Financial history。
- Relation scope、validity、freshness、supersession。
- Evidence drawerのAdvanced provenance。

主観scoreは既定表示へ含めない。財務値はnative currency / unitを保持し、FX換算や欠損補完を行わない。

PilotのSet A（NVIDIA / Broadcom）とSet B（Applied Materials / Lam Research / Tokyo Electron）は同じgeneric UIで検証する。initial FinancialはOperating MarginとRevenue Growthだけに固定し、2社以上でdefinition、period、basisが比較可能でないratioはprimary comparisonへ出さず、理由付きの比較不能またはData Qualityへ置く。ROIC、その他ratio、absolute financial historyはexpandedへ置く。FX換算、ranking、差分率計算を行わない。

## 7. Use case B — Value Chain Navigation

### 主要な問い

- このノードの役割は何か。
- 直接のupstream / downstreamはどこか。
- 重要なTechnologyは何か。
- どのCompanyがどのroleで関与するか。
- 関係は何のscopeとEvidenceで成立するか。

### 初期表示

1. ValueChainNodeの名称、短い定義、順序。
2. 直接隣接するupstream / downstream。
3. P1 Technology。
4. P1 Company relationsをrole別に最大5件。
5. Evidence availabilityと基準日。

現在の`value-chain.json`の並びはAtlasの編集構造であり、供給関係のFactではない。隣接表示には`Atlasによる構造`と明示する。named supplier/customer edgeは、一次資料が対象関係を識別する場合だけ表示する。

### 展開表示

- 2-hop先のノード。
- P2/P3 Company relations。
- scope、validity、missing、stale、superseded relation。
- Relation EvidenceとPrimary Source。

## 8. Use case C — Technology Navigation

### 主要な問い

- Technologyは何を実現するか。
- Developer、Manufacturer、Equipment supplier、Material supplier、User / Adopterは誰か。
- 同じscopeで競争する企業は誰か。
- Substitute exposureはEvidenceで確認できるか。

### 初期表示

1. canonical Technology名とalias。
2. 関連ValueChainNode。
3. roleごとのCompany件数とP1 Company。
4. Evidenceがある関係だけの比較要約。
5. role未収録の明示。

### 展開表示

- role別の全P2/P3 relation。
- ProductとFacilityの接続。
- scoped competition。
- 将来採択された場合のsubstitute relation。
- Relation Evidence、validity、freshness。

`tags[]`の文字列一致だけでroleを確定しない。Technology entityとrelationが未整備の場合は、検索候補として示すか、未収録とする。

## 9. Evidence到達

Company CompareとRelation viewでも、Freeze済みの2-click contractを維持する。

`statement → Evidence marker → Evidence drawer → Primary Source`

- 可視statementまたは可視relationごとにmarkerを1つ置く。
- markerは44 × 44 CSS-pixel以上の操作targetを持つ。
- drawerはpublisher、title、publication date、Primary Source actionを先に示す。
- Advanced provenanceにClaim / Relation type、scope、asOf、lastVerified、freshness、confidence、priority、structured Locatorを示す。
- Escape、close control、modal semantics、origin markerへのfocus returnを維持する。
- Sourceが解決できないstatementはbuildまたはvalidatorで拒否し、UIで黙って表示しない。

## 10. URL共有と状態復元

既存Compareの`?ids=` contractを保持する。Phase 8のCompany Compareは次を採択する。

- `ids=<company-id,...>`: 順序を保持した2～4社。既存URLとの互換性を維持する。
- `view=evidence`: Phase 8 Pilotへのopt-inとして採択。未指定時はFreezeまで既存Compareを既定動作として維持する。
- `detail=summary|expanded`: 情報密度。
- `section=<stable-section-id>`: 共有時の対象section。
- Evidence drawerのopen状態、keyboard focus、scroll位置はURLへ保存しない。

unknown ID、duplicate ID、上限超過は安全に除外し、理由をinline statusで通知する。URL更新は履歴を不必要に増やさず、reloadとback / forwardで同じselectionとorderを復元する。

Value Chainは`/atlas/<value-chain-node-id>/`、Technologyは`/technologies/<technology-id>/`を候補例としてのみ保持する。最終routeはCompare / Relation Freeze後に決定する。

## 11. 状態設計

| State | 表示 |
| --- | --- |
| Loading | static-firstを優先し、必要な更新中だけ既存内容を保ったinline statusを表示。意味のないskeletonを使わない |
| Empty | 選択0～1社、relation 0件、role 0件を理由と次の操作付きで表示 |
| Missing | `not-collected`, `primary-source-unchecked`, `not-disclosed`, `not-applicable`を区別 |
| Partial | Coverageの`partial`とnotesを保持し、completeに見せない |
| Stale | shared freshness helperの結果と基準日を表示。誤りや削除とは扱わない |
| Incomparable | period、currency、unit、definition、scopeの差を理由として表示。rankingしない |
| Error | unknown ID、orphan、resolver不整合は黙って欠落させない。build-timeはfail、runtimeは対象と復帰手段を表示 |

Relationの`freshnessStatus`は`current`、`review-due`、`stale`だけを使用する。`not-applicable`はRelation freshnessではなくCoverage slotのmissing reasonとして扱う。

## 12. Desktop / Mobile

### Desktop

- 1024px級で2～4社のCompany headerを全件読めること。
- 2～4列を均等配分し、metric / dimension列は170～190pxを目安とする。
- font-sizeを下げて収めない。
- 実container幅が可読性threshold未満の場合だけ内部horizontal scrollを許可する。
- sticky header / first columnはsite header、dialogのstacking contractを壊さない。

### Mobile

- 360pxでdocument overflow 0。
- narrative comparisonは`dimension → company rows`のruled representationへ切り替える。
- 正式な財務tableだけは境界付き内部scrollを許可する。
- touch targetは44px以上。
- 補助metadataは展開面へ寄せ、statement、missing理由、Evidence markerは削除しない。

## 13. Accessibility

- native heading、table、list、button、dialog semanticsを維持する。
- Compare matrixはrow / column header associationを持つ。
- role filterや展開状態はtextとARIAで伝え、色だけに依存しない。
- keyboardだけでselection、展開、Evidence drawer、Primary Source到達、closeができる。
- visible focus、Escape、focus return、reduced motionを維持する。
- live statusはselection変更とerrorだけに限定し、table全体を読み直させない。
- `FACT`、`COMPANY_CLAIM`、`ATLAS_ANALYSIS`をaccessible nameでも区別する。

## 14. Acceptance Criteria

### 共通

- 初期状態のmoderated taskで、利用者が対象の役割、Value Chain位置、主要差異2点を90秒以内に回答できる。
- 主要なP1理解にDisclosureを必要としない。
- 可視statement / relationのEvidence marker coverageが100%である。
- Evidence markerからPrimary Sourceまで2 activation以内である。
- Fact、Company Claim、Atlas Analysis、Company Plan、Atlas Estimateを混同する表示が0件である。
- 360pxのdocument overflowが0、全interactive targetが44px以上である。

### Company Compare

- canonical Company IDを使う2～4社の順序付きselectionをreload後も復元する。
- 必須8 dimensionを表示し、P2初期投影はTechnology / Moat、Capacity / Roadmap、Key Risksに限ってdimensionごとに最大1件、選択順は`displayPriority`昇順、`asOf`降順、`claimId`辞書順、metadata欠落は対象外、P3初期表示は0件である。
- 全社missing行はprimary matrixに0件、一部missing行は理由付きで残る。
- initial Financialは比較可能なOperating MarginとRevenue Growthだけで、ROIC等はexpanded、financial comparison判定とnative currency / unitが既存contractから変化しない。

### Value Chain Navigation

- node、direct upstream / downstream、Technology、Company role、Evidenceへ1画面から到達できる。
- Atlas編集順とEvidence付きsupply relationを視覚・textの両方で区別する。
- named edgeにscope、Evidence、asOfがない状態を公開しない。

### Technology Navigation

- 7 roleのうち収録済みと未収録を明示する。
- tag一致だけでroleを確定したCompanyが0件である。
- scoped competitorまたはsubstitute relationだけを表示し、generic company edgeを表示しない。

## 15. 明確な非対象

- real-time price、consensus、ranking、recommendation。
- Company Evidence、financial data、Sourceの追加調査または補完。
- 100社のRelation自動生成。
- competitor配列やtext similarityからのnamed edge生成。
- unscoped customer / supplier / competitor graph。
- 既存Company Page、Evidence drawer、Global Visual Systemの再設計。
- Source Policy承認。

## Rationale

Company Evidence v1は100社でEvidenceとLocatorを持つが、現行Compareはlegacy `products[]`、`tags[]`、current metric snapshotを中心に表示する。共通のread modelと明確な情報階層を先に固定することで、3機能が同じClaim、Relation、Evidenceを異なる意味で解釈することを防げる。

## Alternatives rejected

- 3機能ごとに独立したUX taxonomyを持つ案。意味とEvidence到達が分岐するため却下。
- 全P1～P3を初期表示する案。60～90秒理解を妨げるため却下。
- tag一致からTechnology roleを即時生成する案。canonical identityとEvidenceがないため却下。
- mobileでdesktop matrixを縮小する案。可読性と44px targetを維持できないため却下。
- existing Compareを即時置換する案。v0.3 URL / financial contractを保護するため却下。

## Consequences

- Phase 8実装はまずopt-in Pilotとして既存Compareと並存する。
- Product、Technology、Marketは全件registryを先行作成せず、Pilot Relationのendpointまたはscopeに必要な最小canonical entityだけを最初に登録する。
- Compare固有のP2初期投影にはvalidatorが必要になる。
- Value Chainの編集順は利用できるが、Factのsupplier/customer graphとして扱えない。

採択済み実装順序は、(a) Pilot用Minimal Product / Technology / Market Registry、(b) Relation executable foundation（production Relation 0）、(c) Pilot Relation / projection data、(d) Set A / B両対応のGeneric Company Compare UI、(e) Information reduction correction、(f) Compare / Relation Freezeとする。

## Open questions

1. 60～90秒Acceptanceを実参加者テストとmoderated internal reviewのどちらで最終判定するか。
