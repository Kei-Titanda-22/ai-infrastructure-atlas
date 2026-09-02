# Company Compare 日本語表示規格 v0.1

## 1. 適用範囲

本規格は、Phase 8 Company Compare Pilot の `view=evidence` 表示だけに適用する。canonical Company、Claim、Relation、Entity Registry、Evidence Binding、Shared Source、Financial、個別企業ページは変更しない。個別企業ページまたは100社表示へ適用する場合は、別PRとchange-controlを必要とする。

## 2. canonical dataとdisplay copy

- canonical dataをprovenanceの正本とする。
- Compare専用read modelは表示用タイトル、短い日本語要約、製品・技術ラベル、企業名を派生する。
- 表示用の各Claim文は1件の既存Claim IDへ、Relation表示は1件のRelation IDへ決定論的に対応させる。
- 技術一覧は、対応する既存Claim IDをgroundingとして保持する。
- Evidence drawerではcanonical Claim / Relation statement、Binding、Locator、Sourceを表示する。display copyで正本を上書きしない。
- 新しい事実、推測、競争評価、優劣、順位、差分率をdisplay copyへ加えない。

## 3. 一般語の日本語化

利用者が内容を理解するための一般語は、初期表示で日本語を基本とする。

| canonicalまたは旧表示 | Compare表示 |
|---|---|
| compute | 演算 |
| interconnect | 相互接続 |
| system | システム |
| software | ソフトウェア |
| switching silicon | スイッチ用半導体 |
| connectivity semiconductors | 接続用半導体 |
| Value Chain | 供給網上の位置 |
| scope / スコープ | 対象範囲 |
| freshness / 鮮度 | 更新状況 |
| developer ecosystem | 開発者エコシステム |

日本語化によって意味の範囲を広げない。訳語を確定できない場合は、canonical語をdrawer側に残し、表示文では既存Evidenceから安全に要約できる範囲だけを使う。

## 4. 固有名詞・定着した略語

会社名、製品名、サービス名、正式な技術名、業界で定着した略語は維持できる。Pilotで維持する代表例はNVIDIA、Broadcom、Applied Materials、Lam Research、Tokyo Electron、NVIDIA AI Enterprise、DGX Cloud、GPU、CPU、DPU、ASIC、Ethernetである。

一般語と固有名詞が混在する場合は、一般語部分だけを日本語化する。たとえば `Ethernet switching silicon` は `Ethernetスイッチ用半導体` とする。

## 5. Company名

- canonical Company contentの `japaneseName` が存在する場合は、その値を共通display helperで使用する。
- `japaneseName` がない場合だけ `name` を使用する。
- Compare内の選択中一覧、検索候補、列見出し、各大セクション、財務詳細、Evidence traceで同じhelperを使う。
- Applied Materialsは `Applied Materials（アプライド・マテリアルズ）` に統一する。画面単位の個別hard-codeは行わない。

## 6. Product / Technologyの重複除去

- ProductとTechnologyの表示統合キーはcanonical Registry IDとする。
- 同じIDの項目だけを重複除去し、文字列が似ている別entityは統合しない。
- Productのbroad / narrow category間に暗黙のhierarchy、roll-up、相互導出を作らない。
- Company-specific brand、SKU、named product familyは既存Claimの表示に残し、generic Product entityへ混在させない。
- 重複除去はdisplay projectionだけで行い、Relation件数、Projection P1/P2/P3、Evidence marker数を変更しない。

## 7. 情報階層

初期表示は、企業の短い役割要約、主な製品、関連技術・競争力、供給網上の位置を分離する。供給網上の位置はAIインフラでの役割の補助区分として表示し、同義情報を一つの長文へ連結しない。短い役割要約は原則2～3文以内とする。

大セクションは、企業情報、AIインフラでの役割、主な製品、技術・競争力、設備能力・ロードマップ、主なリスク、財務、根拠の追跡・データ品質とする。

## 8. 機械監査

Compare専用fixtureで、次を固定する。

- 34件の投影済みClaimすべてのdisplay copyとgrounding ID
- 一般語の訳語と維持する固有名詞
- 5社のcanonical Japanese name
- Applied Materialsの完全一致表記
- Product / Technologyのcanonical ID単位deduplication
- 01～04のselection-order presentation token
- P1 / P2 / P3、Claim / Relation marker、Financial compatibilityの既存snapshot

本規格の適用でcanonical dataを変更する必要が生じた場合はHARD STOPとする。
