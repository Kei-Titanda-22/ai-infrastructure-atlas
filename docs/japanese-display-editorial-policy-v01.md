# Company Compare 日本語表示規格 v0.1

## 1. 適用範囲

本規格は、Phase 8 Company Compare Pilot の `view=evidence` 表示だけに適用する。canonical Company、Claim、Relation、Entity Registry、Evidence Binding、Shared Source、Financial、個別企業ページは変更しない。個別企業ページまたは100社表示へ適用する場合は、別PRとchange-controlを必要とする。

## 2. canonical dataとdisplay copy

- canonical dataをprovenanceの正本とする。
- Compare専用read modelは表示用タイトル、短い日本語要約、製品・技術ラベル、企業名を派生する。
- 表示用の各Claim文は1件の既存Claim IDへ、Relation表示は1件のRelation IDへ決定論的に対応させる。
- 技術一覧は、対応する既存Claim IDをgroundingとして保持する。
- Product説明はcanonical Product IDへ対応させ、groundingに使用した既存Claim ID／Relation IDをCompare専用display contractで保持する。
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

`products`、`relations`、`scope`、`freshness`、`正規化した位置`のような内部field名・schema処理用語はprimary UIへ出さない。利用者に必要な値は`供給網上の位置`、`対象範囲`、`更新状況`のような日本語概念で表示する。Coverageの収録状態のように一般利用者への価値が低いメタデータは、primary matrix内で反復しない。

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

要点表示は、企業の短い役割要約、各sectionの代表P1、P1がない場合だけ既存P2、主な製品最大3件、関連技術最大3件、供給網上の位置1件、主要な競争上の特徴、最新財務要点に限定する。要点で選択されなかったP2、製品説明、Relation詳細、Evidence trace、財務履歴はpresentation上隠す。

詳細表示は現在の全P1 / P2投影、Product / Technology全対象、Productの役割説明、供給網上の位置、Relation詳細、Evidence trace、財務履歴を表示する。P2であることだけを理由に`補足`という反復ラベルを付けない。要点で隠したcanonical Claim / Relation / Evidenceは削除せず、詳細で再表示する。供給網上の位置はAIインフラでの役割の補助区分とし、その直下に値を表示する。`正規化した位置`のような内部の中間見出しは追加しない。

大セクションは、企業情報、AIインフラでの役割、主な製品、技術・競争力、設備能力・ロードマップ、主なリスク、財務、根拠の追跡・データ品質とする。

## 8. 機械監査

Compare専用fixtureで、次を固定する。

- 34件の投影済みClaimすべてのdisplay copyとgrounding ID
- 一般語の訳語と維持する固有名詞
- 国・州・都市のexact localization mappingと未承認generic English token inventory
- 5社のcanonical Japanese name
- bilingual Company nameの2行構造、途中改行防止、accessible full name
- Product / Technologyのcanonical ID単位deduplication
- Product 11件すべての役割説明、canonical Product ID、grounding Claim ID／Relation ID
- Product説明の1～2文、80日本語文字以内、評価語非含有、要点非表示／詳細表示
- built fragmentからの`正規化`、`products:`、関係データ収録状態の排除
- 01～04のselection-order presentation token
- P1 / P2 / P3、Claim / Relation marker、Financial compatibilityの既存snapshot
- summary marker Set A 16 / Set B 20、expanded marker Set A 21 / Set B 32 / total 53
- 600px以下だけのcell identity stripと、601px以上のsticky column header
- Factの表示ラベル`事実`、Atlas Analysisの表示ラベル`Atlasの見方`と、34件の内部claimType件数
- 4件のAtlas Analysisリスク見出し・本文と、NVIDIAのFactリスク文言
- primary UIからの`Atlasによる分析`、`補足`、`主な確認点`等の編集者視点表現の排除

本規格の適用でcanonical dataを変更する必要が生じた場合はHARD STOPとする。

## 9. Product説明の編集規則

- 対象はPilotのcanonical Productだけとし、各説明をcanonical Product IDと1対1で管理する。
- 既存Product Registry、Claim、Relation、Evidenceで直接groundできる「何をする製品か」だけを、日本語1～2文、原則80文字以内で記す。
- 投資評価、優劣、順位、推測、会社固有の性能をgeneric Product説明へ加えない。
- 説明のgrounding Claim ID／Relation IDはfixtureで解決可能性を検証し、canonical Claim / Relation statementとEvidence drawerは書き換えない。
- 要点は製品名と既存Evidence markerを中心にし、説明を表示しない。詳細だけで製品名の直下に説明を表示する。
- 既存データでgroundできないProductは説明を推測せずHARD STOPとする。

## 10. 情報区分とリスク見出し

- Factは`事実`、Atlas Analysisは`Atlasの見方`と表示する。内部の`fact`、`atlas-analysis`、`estimate`等のclaimTypeは変更しない。
- 情報区分はsection内で反復せず、本文から独立した控えめな注記として示す。各Claimのaccessible nameには情報区分と見出しを含め、色だけに依存しない。
- リスク見出しは、顧客集中、設備投資、輸出規制、競争、外部製造依存など、利用者が比較する具体的な対象を示す。
- `主な確認点`、`確認点とする`、`注目点とする`、`留意点とする`、`見ていく必要がある`のような編集者の行為を主語にした表現をprimary UIへ置かない。
- Compare専用display copyの編集は既存Claimの意味範囲内に限定し、canonical Claim、Evidence Binding、Source、Locatorを変更しない。drawerの詳細情報ではcanonical Claimを正本として表示する。

## 11. 財務詳細表の数値組版

- 数値は右揃え、セル内では縦中央に置き、`tabular-nums`を適用する。対応する数値列見出しも右揃えとする。
- 期間は左揃えとし、期間名をprimary、通貨・単位・会計基準をsecondaryの2行で表示する。欠損状態は数値扱いせず、独立した状態表示として中央揃えにする。
- 列密度はPilot各社の現実の最大桁数とsecondary表示を基準に設計し、全列の均等割りや固定的な余剰空白を避ける。broad / narrowの表示幅を内容に応じて分ける。
- 数値・見出し・出典は周辺本文より大幅に小さくしない。PC / tabletでは見出し・期間・数値14px以上、欠損と出典13px以上、通貨・単位・会計基準11px以上を下限とする。
- 44px touch targetは出典リンクなどのinteractive要素へ適用し、非interactiveな表セルの行高を一律に膨らませない。
- 1024pxでは表内scrollなしを目標とし、768px以下では表内だけのhorizontal scrollを許容する。いずれもdocument overflowは発生させない。

## 12. Company identity link

- 英語名と日本語名を併記するCompany identityは、2行を1つの会社リンク内に置く。英語名と日本語名へ同じURLのanchorを重複させず、nested anchorも作らない。
- 日本語名は意図した2行目を維持し、linkから`color`を継承する。通常、visited、hover、focusの各状態で英語名と日本語名を同じ色・同じlink stateとして扱う。
- 1つのidentity表示に対するkeyboard focus targetは1つとし、accessible nameには英語名と日本語名の双方を含める。
- 日本語名だけをprimary表示するCompanyは1行の会社リンクとし、accessible nameでは既存の英語名・日本語名を維持する。
- 選択中カード、比較表の列見出し、mobile identity、財務詳細、根拠追跡に同じCompare専用link rendererを使用する。文中のCompany名は自動的にリンク化しない。
