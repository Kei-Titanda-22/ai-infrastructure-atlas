# Company Evidence & UX Specification v0.1

**Status:** Draft for five-company pilot validation

**Scope:** Phase 1 specification only

**Baseline:** `main` at `f4db28371634b828f113f2b58da83ecd863c1867` (2026-08-31確認)

**Normative schema draft:** `docs/company-evidence-schema-v01.json`

> 本文書はSchema / UI Freezeではない。次工程は異なる情報構造を持つ5社だけのPilotであり、PilotのUXレビューと仕様改訂が終わるまで100社移行を開始しない。

## 1. Problem statement

現行Atlasは100社すべてに正規化財務履歴があり、財務値にはSource、期間、定義、検証状態を結び付けられる。一方、Company Dataの非財務情報は、企業単位のSourceと個別claimのEvidenceが十分に分離されていない。

具体的には、各Company JSONに`sourceIds`があっても、`products[0]`、`strengths[1]`、`aiRole`の一文が、どのSourceのどのページ・見出し・表で裏付けられるかは構造化されていない。`company.sourceIds`は「この会社の調査に使える資料」の集合であり、「このclaimをこの箇所が支持する」というClaim-level Evidenceではない。

既存の`claims.json`はこの問題を部分的に解き始めているが、現時点ではキオクシア3件のみで、`type`、`sourceIds`、`asOf`が中心である。Category、Priority、Evidence Locator、Verification Status、Missing Status、Freshness、Sourceごとの支持関係がなく、100社に展開できる契約にはなっていない。

このままSourceリンクだけを増やすと、次の問題が起きる。

- 会社単位のSource一覧が増えても、個別claimの根拠箇所へ到達できない。
- fact、会社の見通し・ポジショニング、Atlas分析、推定が同じ文章階層に混在する。
- Evidence不足をもっともらしい文章で埋める誘因が残る。
- 製品、Capacity、戦略のように陳腐化速度が違う情報を同じ`lastReviewed`で扱う。
- 100社移行後にSchemaやUIを変えると、手戻りと不整合が大きくなる。

## 2. Goals

1. Company-level SourceとClaim-level Evidenceを別の概念として定義する。
2. factとAtlas analysisをSchemaとUIの両方で分離する。
3. 重要claimから一次資料の該当箇所まで2クリック以内で到達できる契約を定義する。
4. Evidence不足、非開示、対象外を文章で補完せず表示できるようにする。
5. 非財務claimの検証状態と鮮度を、財務品質管理と整合する最小状態数で定義する。
6. 5社Pilotで情報密度、Schema適合性、Source導線を検証できるAcceptance Criteriaを定義する。
7. Pilot、UXレビュー、Freezeを経てから100社へ移行する安全な手順を定義する。

## 3. Non-goals

本Phaseでは以下を行わない。

- 100社の`summary`、`aiRole`、`products`、`strengths`、`risks`、`competitors`、`scores`の変更
- 財務値、financial history、cash-flow overridesの変更
- Source Registry / Source Policyの大量追加または本番契約変更
- `claims.json`、`facilities.json`、`relationships.json`への本番データ追加
- Company Page本番UI、検索、比較画面の実装変更
- 100社Evidence Coverage Auditまたは一括移行
- Supply Chain / Value Chain relation dataの追加
- 自動収集・自動更新機構の実装

## 4. Current-state inventory

### 4.1 Company JSON

`src/content.config.ts`は`src/data/companies/*.json`をAstro Content Collectionとして読み込む。100社の必須データは次のとおり。

| 区分 | 現行フィールド | 主な利用先 |
|---|---|---|
| Identity | `id`, `name`, `officialName`, `japaneseName`, `reading`, `ticker`, `exchange`, `country` | 企業ページ、一覧、比較、検索 |
| Classification | `primaryLayer`, `layers`, `tags` | 一覧フィルター、Value Chain導線、Pagefind metadata |
| Narrative | `summary`, `aiRole`, `products`, `strengths`, `risks` | 企業ページ、一覧検索、比較 |
| Relations | `competitors` | 企業ページの相互参照、比較対象 |
| Analysis | optional `scores` | 比較画面の分析区画 |
| Metrics | `metrics` | 企業ページ、比較、財務状態表示 |
| Source coverage | `sourceIds`, `sourceStatus`, `lastReviewed` | 企業ページのSource一覧と会社単位の確認状況 |

2026-08-31時点で`sourceStatus`は`partial` 20社、`placeholder` 80社、`verified` 0社である。この状態は会社全体の粗いcoverageであり、個別claimの検証状態ではない。

### 4.2 Evidence / Source

- Sourceは`src/data/sources*.json`、`document-sources*.json`、`facility-sources.json`に分割され、stableなSource IDを持つ。
- Source Policyは対応する`source-policies*.json`、`document-source-policies*.json`、`facility-source-policies.json`で管理される。
- `claims.json`は3件で、`id`, `companyId`, `type`, `title`, `statement`, `sourceIds`, `asOf`を持つ。Source内のLocator、検証状態、Priority、鮮度はない。
- `metric-audits.json`と財務履歴は数値・定義・Source・検証状態を個別に管理するが、この契約は非財務claimには適用されていない。
- `facilities.json`は5社17拠点を持ち、各拠点に単一`sourceId`と`verified`を要求する。Locatorはない。
- `update-log.json`は編集履歴であり、claimごとのEvidence台帳ではない。
- 企業ページのSource集約は一部のSource shardを直接importしており、全Registryを一つのloaderから参照する契約にはまだなっていない。

### 4.3 Company Page UI

`src/pages/companies/[id].astro`の現行表示順は、概要、バリューチェーン、主力製品、主張と根拠、競争優位、主要拠点、財務、業種固有KPI、競合、リスク、出典である。

- 概要、AIインフラ上の役割、製品、強み、リスクはCompany JSONを直接参照する。
- 「主張と根拠」は`claims.json`を参照し、各claimのSource URLを本文下に列挙する。
- 主要拠点は`facilities.json`と`facility-sources.json`を参照する。
- 財務、ROIC、KPIはmetric / history / audit / Sourceを参照する。
- 競合は`competitors`の直接リンクと逆向きリンクの和を表示する。
- 出典はCompany、Facility、Claimから集めたSourceを一覧表示する。

公開キオクシアページでも上記11区画、3 claim、Sourceリンク群が確認できる。claimのSource URLへは直接移動できるが、PDFページや見出しへの案内はなく、Sourceリンクが増えるほど本文密度が上がる。

### 4.4 Dependencies

| 機能 | 現行依存 | 新Schema導入時の注意 |
|---|---|---|
| Facilities | `facilities.json`のroleとSource | Facilityを二重にclaim化しない。必要ならFacility IDをclaimから参照する。 |
| Value-chain stages | `layers`, `tags`, `company-filter-contract.json` | Company claimと企業間relationを混同しない。 |
| Competitor relation | Company JSONのID配列 | 現行配列は比較対象。供給関係の証拠契約として扱わない。 |
| Search | 一覧の合成`searchText` + 最終HTMLのPagefind | 公開claimだけを索引し、internal notesや未公開draftを除外する。 |
| Compare | products, tags, facilities, metrics, scores, KPI | Freeze前は新claimを比較表へ接続しない。将来はCategory / Priorityで投影する。 |
| Source display | ページごとのSource配列import | Freeze後は全Source shardを一意に解決する共通loaderが必要。 |

## 5. Information architecture

非財務Evidenceは次の4層に分ける。

```text
Company profile (identity / legacy narrative)
        ↓ companyId
Company Claim (ユーザーへ伝える最小の主張)
        ↓ evidenceIds
Evidence Binding (claimとSource内の該当箇所の結合)
        ↓ sourceId
Shared Source Registry + Source Policy
```

Evidence不足は存在しないclaimで表現できないため、Category単位の`Coverage Record`を別に持つ。

```text
Company × Category
  └─ complete / partial / not-started
       └─ missingStatus（必要な場合）
```

### 5.1 Design decisions

- 財務・Company・FacilityでSource Registryを分割せず、同一Source IDを再利用する。
- LocatorはSourceではなくEvidence Bindingに置く。同じ文書の異なる箇所が複数claimを支持できるためである。
- `stale`はVerification Statusに追加せず、Freshness Stateとして派生させる。
- `inferred`はstatusにせず、`atlas-analysis`または`estimate`のclaim typeで表す。workflow状態と認識論的分類を混ぜない。
- 既存の`company.sourceIds`は当面legacy company-level coverageとして残すが、新claimのEvidenceとはみなさない。

## 6. Claim Schema

Normative draftは`docs/company-evidence-schema-v01.json`を参照する。概念上の最小フィールドは次のとおり。

| Field | Required | Contract |
|---|---:|---|
| `id` | yes | repository-wide unique、kebab-case |
| `companyId` | yes | 既存Company ID |
| `category` | yes | Section 9のtaxonomy |
| `subcategory` | no | Category内の安定した小分類。自由文の乱用を避ける |
| `claimType` | yes | `fact`, `company-guidance`, `company-positioning`, `atlas-analysis`, `estimate` |
| `priority` | yes | `P1`, `P2`, `P3` |
| `title` | yes | 一覧・Evidence drawer用の短い見出し |
| `statement` | yes | 一つの検証可能な主張。複数主張を一文に詰め込まない |
| `evidenceIds` | yes | Evidence Binding ID。`verified` / `source-linked`では1件以上 |
| `verificationStatus` | yes | `verified`, `source-linked`, `needs-review` |
| `confidence` | conditional | `atlas-analysis` / `estimate`で必須。`low`, `medium`, `high` |
| `asOf` | yes | claimが有効と判断された基準日 |
| `lastVerified` | yes | 最終確認日。未確認は`null` |
| `nextReview` | yes | 次回確認日。対象外の場合のみ`null` |
| `notes` | no | 編集用。公開本文に自動表示しない |

### 6.1 Claim type

| Type | 意味 | UI label | ルール |
|---|---|---|---|
| `fact` | 一次資料で直接確認できる現在・過去の事実 | 事実 | 会社固有の一次資料とLocatorが必要 |
| `company-guidance` | 会社が示した将来見通し・目標 | 会社見通し | 将来の事実として断定しない。期間を必須とする |
| `company-positioning` | 会社自身の市場説明・優位性の主張 | 会社説明 | Atlasの独立評価と分離し、「会社は〜と説明」とする |
| `atlas-analysis` | 複数の事実からAtlasが導く解釈 | Atlas分析 | 根拠は分析入力を支持する。結論自体をSourceの発言に見せない |
| `estimate` | 公開情報からの推計 | 推定 | 方法、仮定、confidenceをnotesまたは別methodologyに残す |

### 6.2 Publication rules

- P1の`fact`は`verified`のみを原則とする。
- `source-linked`は一次資料はあるがLocatorまたは独立照合が未完了であることを表示する。
- `needs-review`のclaimは既定でP1本文に出さず、Coverage UIに「要再検証」として示す。
- `atlas-analysis`と`estimate`は、Verification Statusにかかわらずclaim type labelとconfidenceを表示する。
- 一つのstatementにfactとanalysisが混在する場合は二つのclaimへ分割する。

## 7. Evidence Schema and Locator

Evidence Bindingは「Sourceがある」だけでなく「Sourceのどこが、どのようにclaimを支持するか」を表す。

| Field | Required | Contract |
|---|---:|---|
| `id` | yes | unique Evidence Binding ID |
| `claimId` | yes | 対象Claim ID |
| `sourceId` | yes | shared Source Registry ID |
| `support` | yes | `supports`, `context`, `contradicts` |
| `locator` | yes | 下記Locatorの1項目以上 |
| `lastChecked` | yes | Locatorと内容を最後に確認した日 |
| `notes` | no | 翻訳、版差、アクセス上の注意 |

Locatorは次の任意項目を持ち、少なくとも一つを必須とする。

- `page`: PDF / filingのページまたはページ範囲
- `section`: 文書内section名
- `heading`: Webページや報告書の見出し
- `table`: 表番号・表題
- `note`: 注記番号・脚注
- `anchor`: 安定したfragment IDまたはdocument anchor
- `quotedLabel`: 該当箇所を識別する短いラベル。長文転載には使わない

`quotedLabel`は検索補助であり、本文の大量転載や著作物の保存を目的としない。URLに安定したanchorがあればSource URL + anchorを優先し、PDFではページと見出しの組合せを優先する。

## 8. Source contract

Company Evidenceは既存のShared Source Registryを利用する。`company-evidence-sources.json`のような重複Registryを新設しない。

Freeze候補のSource contract:

| Field | Contract |
|---|---|
| `id` | 全Source shardでunique |
| `companyId` | 主対象企業。公的資料・複数社資料ではnullable化を検討 |
| `publisher`, `title`, `url`, `sourceType`, `language` | 現行必須項目を維持 |
| `publishedAt` | 文書公開日。判明しない場合は`null` |
| `retrievedAt` | Atlasが取得・確認した日 |
| `period` | 決算・計画期間がある文書では設定 |

Source PolicyはSource IDと1対1で存在し、少なくとも利用可否、review status、取得方法、注意事項を保持する。公開claimを`verified`にするには、Source Policyがreviewedであり、利用を妨げる既知の問題がないことを要する。

同一文書が財務、Facility、Company Claimを支持する場合は同じSource IDを使い、各用途のLocatorをEvidence Bindingに分ける。重複URLだけで自動統合せず、publisher、title、版、公開日を照合する。

## 9. Category taxonomy

要求された11 Categoryを維持する。Pilot前に統合すると、異なる更新頻度とMissingnessを失うためである。UIでは10の上位sectionへ畳み込む。

1. `company-overview` — 何の会社か、事業範囲
2. `ai-infrastructure-role` — AI需要との接点
3. `products` — 製品・サービス
4. `technology` — 技術、性能、工程
5. `value-chain-position` — 工程上の位置と上下流
6. `manufacturing-facilities` — 生産・R&D拠点
7. `capacity-expansion` — Capacity、増産、投資計画
8. `customer-end-market` — 顧客層、用途、市場。非開示を尊重する
9. `competitive-positioning` — 競争優位、比較上の位置付け
10. `strategy` — 中期方針、提携、重点領域
11. `risks` — 開示リスクとAtlasの確認点

Categoryはclaimの主分類であり、claimを重複登録しない。複数区画に関係するclaimは主Categoryを一つ選び、将来必要なら表示側のcross-referenceで接続する。

## 10. Verification statuses

財務と語彙を揃え、3状態だけを採択する。

| Status | 条件 | 公開上の意味 |
|---|---|---|
| `verified` | primary-source first、Source Policy reviewed、少なくとも1件の`supports` Evidence、claimとSourceの意味が一致、具体的Locatorあり、日付・企業同定済み、レビュー期限内 | 根拠箇所まで確認済み |
| `source-linked` | 関連する一次Sourceと少なくとも文書単位のcoarse Locatorは登録済みだが、該当箇所の精密化、文言の独立照合、版確認のいずれかが未完了 | 一次資料紐付け済み・確認未了 |
| `needs-review` | Sourceなし、二次資料のみ、矛盾、必須metadata不足、または再検証が必要 | 公開claimとして信頼しない |

`verified`は将来予測が実現することやAtlas分析が真であることを保証しない。claim type labelが認識論的性質を示し、Verification StatusはEvidence packageの品質を示す。

`contradicts` Evidenceが未解決のclaimは`verified`にできず、`needs-review`へ戻す。`context`だけでは`verified`に昇格できない。

## 11. Missing statuses

非財務CategoryのCoverage Recordでは次の4理由を使う。

| Missing status | 意味 |
|---|---|
| `not-collected` | まだ調査・収録していない |
| `primary-source-unchecked` | 候補情報はあるが一次資料を未確認 |
| `not-disclosed` | 会社が該当情報を開示していない、または匿名化している |
| `not-applicable` | 企業・事業モデル上、そのCategoryが適用されない |

財務の`not-calculable`は算式固有なので非財務Categoryには使わない。Evidenceがないときは、競合他社、一般的な業界知識、生成AIによる補完を会社固有factとして表示しない。

`not-disclosed`は「存在しない」と同義ではない。例えば顧客名非開示の場合、匿名の顧客属性claimはそのSourceが直接述べる範囲に限り、特定企業とのrelationを推定しない。

## 12. Freshness model

各claimは`asOf`、`lastVerified`、`nextReview`を持ち、Sourceは`publishedAt`と`retrievedAt`を持つ。v0.1では複雑な自動更新は行わず、表示時に次のFreshness Stateを派生する。

| Freshness state | 判定 |
|---|---|
| `current` | today ≤ `nextReview` |
| `review-due` | `nextReview`超過90日以内 |
| `stale` | `nextReview`超過90日、Sourceが更新版に置換、製品終了等の明示的陳腐化 |

初期review cadence候補:

| Category | Default cadence |
|---|---:|
| Capacity / Expansion | 90日 |
| Products, Technology, Customer / End Market, Strategy, Risks | 180日 |
| Company Overview, AI Role, Value Chain, Competitive Positioning | 365日 |
| Manufacturing / Facilities | 365日。ただし建設計画は90日 |

`stale`はVerification Statusを自動上書きしないが、UIでは状態badgeを併記し、P1から降格または要再検証導線を出す。Pilotでcadenceと90日graceを検証する。

## 13. Priority model

Priorityは重要度と初期表示密度を制御する。根拠の強さではない。

| Priority | 目的 | Default content |
|---|---|---|
| `P1` | 30秒以内に会社を理解 | Overview、AI Role / Value Chain、主力製品、主要な競争優位。4〜6 claimを目安 |
| `P2` | 比較・投資判断 | Technology、Capacity、顧客市場、主要拠点、Strategy、material risks |
| `P3` | 詳細調査 | 製品仕様、地域別詳細、補助拠点、背景、追加Source |

Category別default:

| Category | Default priority |
|---|---|
| Company Overview | P1 |
| AI Infrastructure Role | P1 |
| Products | P1（core）/ P2（その他） |
| Value Chain Position | P1 |
| Competitive Positioning | P1またはP2 |
| Technology | P2、差別化の核心のみP1 |
| Manufacturing / Facilities | P2 |
| Capacity / Expansion | P2 |
| Customer / End Market | P2 |
| Strategy | P2 |
| Risks | P2、補足はP3 |

P1昇格には短い理由をeditorial reviewで残す。Sourceが多いことや文章が長いことをP1理由にしない。

## 14. Company page hierarchy

Pilotの出発点は採択済みの10区画とする。本Phaseではproduction UIを変更しない。

1. **概要** — P1の「30秒でわかる」4要素とEvidence badge
2. **バリューチェーン上の位置** — AI Role、Value Chain。上下流の推定relationは表示しない
3. **主力製品** — core productsをP1、Technology詳細をP2 drawer / subsectionへ
4. **競争優位** — company-positioningとAtlas analysisを別blockで表示
5. **主要拠点** — Facility recordを再利用し、Capacity / Expansionを隣接subsectionへ
6. **財務** — 現行の検証済み財務UIを維持
7. **業種固有KPI** — 現行KPIを維持
8. **競合・比較対象** — 現行competitor link。証拠付きrelationとは区別
9. **リスク・確認点** — company disclosureとAtlas確認点を分離
10. **出典** — ページで使用したSourceを重複排除したProvenance panel

StrategyとCustomer / End MarketはPilotで独立section化を検討するが、v0.1初期案では概要・製品・競争優位のP2 subsectionに配置し、トップレベルを増やしすぎない。

## 15. Evidence navigation UX

### 15.1 Options comparison

| Pattern | Claim specificity | Readability | Mobile / keyboard | 採否 |
|---|---|---|---|---|
| 本文内Sourceリンク | 高 | リンクが増えると低下 | 良 | 非採択 |
| Section単位Source | 低 | 高 | 良 | legacy補助のみ |
| 脚注 | 中〜高 | 中 | 往復が多い | 非採択 |
| Source cardのみ | 中 | 高 | 良 | 最終Source一覧に採用 |
| Claim横badge + Evidence drawer | 高 | 高 | 適切に実装可能 | 主方式 |
| 常設Provenance panel | 高 | 中 | 小画面で重い | desktop補助 |

### 15.2 Adopted pattern

1. 各公開claimに、文字付きのEvidence badgeを一つ表示する。例: `根拠 2`、`一次資料確認済み`。
2. 1クリック目でEvidence drawerを開き、claim type、status、asOf、freshness、Source card、Locatorを表示する。
3. 2クリック目で一次資料のanchor / pageへ移動する。deep linkできないPDFはSourceを開き、drawerに`p. 42 / Data Center revenue`のようなLocatorを残す。
4. 最終「出典」区画はページ内Sourceを重複排除し、publisher、title、publishedAt、retrievedAt、利用Categoryを表示する。
5. 本文にはSource URLを羅列せず、1 claim = 1 badgeを基本とする。

2-clickは「表示されているclaimから該当一次資料を開くまでのユーザー操作数」と定義する。scroll、drawer内の自動focus、ブラウザのPDFページ表示はclickに数えない。

### 15.3 Fact / analysis visual separation

- claim typeを文字labelで常時表示し、色だけに依存しない。
- `fact` / `company-guidance` / `company-positioning`と`atlas-analysis` / `estimate`は別のvisual groupに置く。
- Atlas分析は見出しにも「Atlas分析」と表示し、会社の引用・説明と同じcard styleにしない。
- `estimate`はconfidenceとmethodology導線を必須にする。
- Screen reader用の明示label、keyboard focus、drawerを閉じた後のfocus returnをAcceptance Criteriaに含める。

## 16. Supply-chain relation evidence concept

Company Claimと企業間relationは別Schemaとする。将来のrelation最小契約:

- `id`
- `relationType`
- `fromCompanyId`
- `toCompanyId`
- `productOrTechnology`
- `evidenceIds`
- `verificationStatus`
- `asOf`
- `lastVerified`

公開するnamed relationは、対象企業を明示するdocument-level primary sourceとLocatorを必須とする。片方の企業の一般的な顧客一覧、製品互換性、業界常識だけから供給関係を推定しない。

匿名顧客、業界チャネル情報、Atlas推論はnamed edgeにしない。必要なら将来`disclosureLevel: named | unnamed | inferred`を導入し、`inferred`はdefault hiddenとする。現行`competitors`配列は比較対象であり、このrelation契約へ自動移行しない。

## 17. Pilot selection criteria

5社は知名度ではなくSchemaの異質性で選ぶ。

- 5社で少なくとも4つのPrimary Layerを含む。
- AI compute / fabless、semiconductor equipment、memory / manufacturing、interconnect / optical、data-center power / coolingを含む。
- 製品中心、技術中心、設備中心の企業を含む。
- B2Bで顧客名非開示が多い企業を含む。
- 米国企業だけにせず、少なくとも3地域・3言語条件を含む。
- PDF、HTML、filing、product page、facility pageなど複数のSource形式を含む。
- fact、company guidance、company positioning、Atlas analysis、missingnessの全type / stateを試せる。

### 17.1 Proposed five companies

| Company | Type | Pilotで検証する差異 |
|---|---|---|
| NVIDIA | AI compute / fabless | 製品・技術更新が速い、会社guidance、AI Role、米国filingと製品資料 |
| ASML | Semiconductor equipment | 技術中心、長期roadmap、B2B顧客非開示、オランダ企業、PDF資料 |
| Kioxia | Memory / manufacturing | 製品と市況、複数Fab、Capacity、日英資料、既存3 claimとのmigration |
| Fujikura | Interconnect / optical | 製品仕様、AI data-center用途、国内拠点、顧客非開示、product press release |
| Vertiv | Data-center power / cooling | 半導体外の設備企業、製品・service・capacity・end market、異なるKPI構造 |

この組合せは材料・Physical AIを直接含まないため、PilotでSchema gapが残る場合はFreeze前に1社を入れ替えるか、限定的なsixth stress testを行う。100社移行の開始にはしない。

## 18. Pilot acceptance criteria

### 18.1 30-second understanding

- 各PilotページでP1は4〜6 claimに収まる。
- 初見テストで5人中4人以上が30秒以内に「何の会社か」「AIインフラのどこにいるか」「何を売るか」「何が強いか」の4問すべてへ回答できる。
- 回答にP2/P3 drawerの閲覧を要求しない。

### 18.2 Evidence access

- 全P1 claimの100%、公開P2/P3 claimの95%以上が2クリック以内で一次資料へ到達する。
- Sourceを開けない場合はclaimを`verified`にしない。
- drawerでSource title、publisher、publishedAt、Locator、lastCheckedを確認できる。

### 18.3 Fact / Analysis

- 全公開claimにtype labelがある。
- automated DOM checkで`atlas-analysis` / `estimate`にconfidenceがあり、fact blockと異なるaccessible labelを持つ。
- ユーザーテストで5人中5人がfactとAtlas analysisを取り違えない。

### 18.4 Missingness

- 11 CategoryすべてにCoverage Recordがあり、空白を「情報なし」と推測させない。
- Evidenceのない会社固有文は`verified fact`として表示しない。
- `not-disclosed`と`not-collected`を区別して表示する。

### 18.5 Density and accessibility

- 本文はSource URLの列挙を避け、原則1 claim 1 badgeとする。
- keyboardだけでbadge、drawer、Source link、close、focus returnを操作できる。
- 360px幅で横scrollなし、200% zoomで内容欠落なし、状態を色だけで表現しない。
- P1本文とEvidence drawerの読み分けを5人中4人以上が「過密ではない」と評価する。

### 18.6 Schema completion

- 5社すべてを同一Schemaで表現し、company-specific fieldを追加しない。
- すべてのEvidence ID / Source ID / Company IDが解決し、重複IDがない。
- 既存財務・Company・Source・Facility・UIのsemantic regressionがない。

## 19. Pilot completion and Freeze criteria

Pilot完了には次をすべて満たす。

- Section 18のAcceptance Criteriaを満たす。
- 5社のfact / analysis / missingness / freshnessを同一Schemaで表現できる。
- Source drawerの2-click導線と情報密度をUX reviewで承認する。
- Schema不足、statusの曖昧さ、Source重複、unresolved blockerを記録し、必要ならv0.2へ改訂する。

100社展開前にFreezeする対象:

- Claim Schema、Evidence Schema、Coverage Schema
- Category taxonomy
- Verification Status、Missing Status、Freshness State
- Priority model
- Source display UXと2-click定義
- Company Page section ordering
- shared Source Registry / Source Policy contract
- relation evidence contract

Freeze条件:

1. Pilot UX reviewでblocking issueが0件。
2. 全validator、secret scan、Astro / Pagefind buildが成功。
3. 同じ5社を修正版Schemaへ再入力してもSchema変更が不要。
4. migration dry runでlegacy fieldを自動`verified`へ昇格しないことを確認。
5. schema version、effective date、owner、change processを文書化。
6. Freeze承認後にのみ100社Evidence Coverage Auditを開始。

## 20. Migration plan

### 20.1 Sequence

1. Freeze後、現行100社JSONをread-only inputとしてCoverage Recordを生成する。
2. legacy narrativeをclaim candidateへ機械的に分割するが、すべて`needs-review`から開始する。
3. 既存`sourceIds`をSource候補として提示するが、Evidence Bindingは自動生成しない。
4. 人手でclaim type、Category、Priority、Source、Locator、asOfを確認する。
5. 条件を満たしたclaimだけを`source-linked`、次に`verified`へ昇格する。
6. 各社をvalidatorとUX QAに通し、小batchで公開する。
7. 100社完了後に検索・比較への投影を段階的に有効化する。

### 20.2 Legacy mapping

| Legacy field | Candidate category | Default claim type / status | Rule |
|---|---|---|---|
| `summary` | Company Overview | 未分類 / `needs-review` | factとanalysisを文単位で分割してから分類 |
| `aiRole` | AI Infrastructure Role / Value Chain | `atlas-analysis` / `needs-review` | 会社が直接述べる部分だけfactまたはcompany-positioningへ |
| `products[]` | Products | `fact` candidate / `needs-review` | 製品一次資料とLocator確認後のみ昇格 |
| `strengths[]` | Competitive Positioning | `atlas-analysis` / `needs-review` | 会社の自己説明ならcompany-positioning。独立評価と混ぜない |
| `risks[]` | Risks | `atlas-analysis` / `needs-review` | filing記載リスクはfact/会社開示として別claim化 |
| `competitors[]` | 比較対象 | migration対象外 | 供給relationやverified factへ変換しない |
| `sourceIds[]` | Company-level source candidates | Evidenceではない | claimとLocatorを確認するまでcarry-overしない |

既存文を自動的に`verified`へ昇格しない。競合会社の開示、一般業界知識、モデル推論から会社固有factを作らない。

## 21. Validation and semantic-diff contract

Phase 1の文書追加では次を確認する。

- `npm run validate:data`
- `npm run validate:secrets`
- `npm run build`（Astro + Pagefind）
- JSON Schema自体のJSON parse
- `git diff --check`
- baselineと比較したsemantic diff

Phase 1のsemantic diff許容範囲は`docs/company-evidence-ux-spec-v01.md`と`docs/company-evidence-schema-v01.json`だけである。次のpathに変更があれば失敗とする。

- `src/data/companies/**`
- `src/data/sources*.json`, `src/data/document-sources*.json`, Source Policy群
- `src/data/financial-history*.json`, cash-flow overrides
- `src/data/claims.json`, `facilities.json`, `relationships.json`
- `src/pages/**`, `src/components/**`, `src/styles/**`, `src/content.config.ts`

## 22. Adopted development sequence

順序は固定する。

1. **Phase 1（今回）:** Company Evidence & UX Specification v0.1
2. **Phase 2:** 異なる情報構造を持つ5社だけでPilot
3. **Phase 3:** Pilot企業ページのUX review
4. **Phase 4:** Evidence / Claim SchemaとCompany Page UIをFreeze
5. **Phase 5:** Freeze済み仕様で100社Evidence Coverage Audit
6. **Phase 6:** 不足一次資料を小batchで100社へ展開
7. **Phase 7:** document-level evidence必須でSupply Chain / Value Chain relationを拡張
8. **Phase 8:** 比較、検索、横断分析を高度化

## 23. Open questions for Pilot

1. `company-positioning`を独立typeとして維持するか、`company-guidance`と共通の「会社説明」familyにUI上まとめるか。
2. PDFのページ番号がPDF viewer表示と印刷ページで異なる場合、両方をLocatorへ持つか。
3. `review-due`から`stale`までの90日graceとCategory別cadenceは適切か。
4. P1上限4〜6件と、Strategy / Customerをsubsectionに畳む案は30秒理解に最適か。
5. `verified`という語がAtlas analysisにも誤解を生む場合、UI labelだけを「根拠確認済み」に変えるか。
6. Coverage Recordの`complete`を誰がどのchecklistで承認するか。
7. Source shardを維持したまま共通loaderで解決するか、Freeze後にregistry manifestを導入するか。
8. translated statementと原文Locatorの対応をEvidence Bindingに追加する必要があるか。
9. Search / Pagefindで`source-linked`と`needs-review`をどこまで索引対象にするか。
10. Materials / Physical AIをFreeze前の追加stress testへ含める必要があるか。
