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
| Integrated Materials Solution | 統合材料ソリューション（原語併記時も日本語を先にする） |
| United States / Japan | 米国 / 日本 |
| Tualatin | チュアラティン |
| Oregon, United States | 米国オレゴン州 |

日本語化によって意味の範囲を広げない。訳語を確定できない場合は、canonical語をdrawer側に残し、表示文では既存Evidenceから安全に要約できる範囲だけを使う。primary displayは日本語を先にし、正式原語の識別が必要な場合だけ `日本語説明（正式英語名）` の順でsecondary表記する。

国、州、都市はcanonical fieldまたはreview済みtokenに対するexact mappingで表示する。部分文字列置換は使わない。日本語表記が定着している地名は日本語とし、`オレゴン州Tualatin`のような混在表記を作らない。canonical Company / Claim内のraw valueは変更せず、Compare専用read modelでのみ派生する。

## 4. 固有名詞・定着した略語

会社名、製品名、サービス名、正式な技術名、業界で定着した略語は維持できる。Pilotで維持する代表例はNVIDIA、Broadcom、Applied Materials、Lam Research、Tokyo Electron、NVIDIA AI Enterprise、DGX Cloud、Blackwell GPU、Grace CPU、BlueField DPU、Spectrum-X、EPIC Center、Building G、GPU、CPU、DPU、ASIC、Ethernet、3D NAND、DRAM、HBMである。

一般語と固有名詞が混在する場合は、一般語部分だけを日本語化する。たとえば `Ethernet switching silicon` は `Ethernetスイッチ用半導体` とする。

## 5. Company名

- canonical Company contentの `japaneseName` が存在する場合は、その値を共通display helperで使用する。
- `japaneseName` がない場合だけ `name` を使用する。
- Compare内の選択中一覧、検索候補、列見出し、mobile identity stripで同じname-parts helperを使う。
- 英語名と日本語名を持つ場合、英語名を1行目、日本語括弧表記を2行目にする。各行はblockとして扱い、`white-space: nowrap`で英語名、日本語名、括弧だけの分離を防ぐ。
- 日本語名しかないCompanyは1行で表示する。
- accessible nameは正式英語名と日本語名を含むcanonical `japaneseName`を維持する。視覚上の分割で読み上げ名を分断しない。
- Applied Materialsは1行目 `Applied Materials`、2行目 `（アプライド・マテリアルズ）` とする。画面単位の個別hard-codeは行わない。

## 6. Product / Technologyの重複除去

- ProductとTechnologyの表示統合キーはcanonical Registry IDとする。
- 同じIDの項目だけを重複除去し、文字列が似ている別entityは統合しない。
- Productのbroad / narrow category間に暗黙のhierarchy、roll-up、相互導出を作らない。
- Company-specific brand、SKU、named product familyは既存Claimの表示に残し、generic Product entityへ混在させない。
- 重複除去はdisplay projectionだけで行い、Relation件数、Projection P1/P2/P3、Evidence marker数を変更しない。

## 7. 情報階層

要点表示は、企業の短い役割要約、各sectionの代表P1、P1がない場合だけ既存P2、主な製品最大3件、関連技術最大3件、供給網上の位置1件、主要な競争上の特徴、最新財務要点に限定する。補足P2、正規化説明、Relation詳細、Evidence trace、財務履歴はpresentation上隠す。

詳細表示は現在の全P1 / P2投影、Product / Technology全対象、正規化した位置、補足、Relation詳細、Evidence trace、財務履歴を表示する。要点で隠したcanonical Claim / Relation / Evidenceは削除せず、詳細で再表示する。供給網上の位置はAIインフラでの役割の補助区分として表示し、同義情報を一つの長文へ連結しない。

大セクションは、企業情報、AIインフラでの役割、主な製品、技術・競争力、設備能力・ロードマップ、主なリスク、財務、根拠の追跡・データ品質とする。

## 8. 機械監査

Compare専用fixtureで、次を固定する。

- 34件の投影済みClaimすべてのdisplay copyとgrounding ID
- 一般語の訳語と維持する固有名詞
- 国・州・都市のexact localization mappingと未承認generic English token inventory
- 5社のcanonical Japanese name
- bilingual Company nameの2行構造、途中改行防止、accessible full name
- Product / Technologyのcanonical ID単位deduplication
- 01～04のselection-order presentation token
- P1 / P2 / P3、Claim / Relation marker、Financial compatibilityの既存snapshot
- summary marker Set A 16 / Set B 20、expanded marker Set A 21 / Set B 32 / total 53
- 600px以下だけのcell identity stripと、601px以上のsticky column header

本規格の適用でcanonical dataを変更する必要が生じた場合はHARD STOPとする。
