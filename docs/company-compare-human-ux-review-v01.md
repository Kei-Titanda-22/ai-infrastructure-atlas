# Company Compare Human UX Review v0.1

## 1. Status

- Review input: 実ユーザーの初見レビューと第2回Human Reviewを正式入力として採択
- Remediation scope: `view=evidence` Company Compare Pilot presentation only
- 第2回remediation後のHuman re-test executed: NO
- PR status target: Draft / Open / Unmerged

## 2. 視聴環境

- 32インチ横画面
- 24インチ縦画面
- iPhone 14
- Set A（NVIDIA / Broadcom）とSet B（Applied Materials / Lam Research / Tokyo Electron）
- 初見ユーザー

## 3. 良かった点

- PCではページの目的と比較対象企業をすぐ識別できた。
- 企業ごとの違いを確認できた。
- Set A / Set Bボタンの意味を理解できた。
- 「すべて解除」「外す」の位置は自然だった。
- 表の第一印象と余白は良好だった。

## 4. 問題点

1. mobileではページの目的が明確ではなかった。
2. mobileでは比較対象企業をすぐ識別できず、項目ごとに交互に現れる情報の所属企業を追いにくかった。
3. desktopでも縦スクロール中に企業列を追いにくかった。
4. 大セクションの境界が弱く、本文文字が小さかった。
5. 固有名詞以外にも英語が残り、日本人向け表示として読みづらかった。
6. Product / Technology / Value Chainの同義情報が重複し、長い段落になっていた。
7. Applied Materialsの表記が混在していた。
8. `スコープ`、`鮮度`が自然な日本語ではなかった。

## 5. 採択した改善

- ページ先頭の説明を「役割、製品・技術、企業間関係、財務の比較条件を根拠付きで確認する」目的へ具体化した。
- mobileでは選択中企業を検索・セット操作より先に表示する。
- 選択順から決定する01～04の番号、企業名、薄い背景、左枠を各企業情報ブロックへ付与する。
- 第1回remediationではdesktopを含む各企業セルに企業番号とcanonical Japanese nameを再表示した。第2回レビューでdesktopでは冗長と判明したため、後述のとおり600px以下だけへ限定した。
- 供給網上の位置を「AIインフラでの役割」内へ統合し、primary matrixを8行から7行へ整理した。Evidence traceを含む概念上の大セクションは8区分を維持する。
- 大セクションへ2pxの濃いneutral罫線と見出し帯を使用する。
- iPhone 14相当で主要本文・Claim見出し・製品名・企業名を16px以上、補助情報を14px以上とした。
- 一般語を日本語化し、固有名詞・定着略語は維持した。
- Product / Technologyはcanonical Registry ID単位で重複除去する。
- display copyとcanonical drawerを分離し、全display文にClaim IDまたはRelation IDを保持する。

## 6. Before / After実測

同一PC上のmain baseline buildとremediation buildを比較した。Human Reviewの再実施ではなく、実ブラウザによる構造・表示測定である。

| 指標 | Before（main） | After | 結論 |
|---|---:|---:|---|
| Set B / 390pxで最初のviewport内に見える選択企業 | 1 / 3 | 3 / 3 | 改善 |
| Set B / 390pxの各主要企業ブロックに番号＋企業名 | 0 / 24 | 21 / 21 | 7 matrix sectionsへ統合後、全件表示 |
| mobile Claim本文 | 13px | 16px | Acceptance達成 |
| mobile補助ラベル | 10px | 14px | Acceptance達成 |
| 初期表示の対象一般英語（指定10語） | 4件 | 0件 | drawerのcanonical表現は維持 |
| primary matrix section row | 8 | 7 | Value ChainをAI role内へ統合 |
| Set B / 390px document height | 8,617px | 9,159px | +6.3%。企業所属の反復表示と可読文字サイズを優先 |
| document horizontal overflow | 0px | 0px | 維持 |
| Evidence fragment | 299,685 B | 307,533 B | +2.6%、5% guard内 |
| Legacy Compare HTML size | 585,468 B | 585,468 B | size不変 |

Legacy Compare HTMLはCompare sourceを変更していないが、lazy controllerのbuild asset hash参照が変わるため、生成HTML全体のbyte hashはbaselineと一致しない。visible text、controls、URL semantics、fragment/controller request 0 / 0、10% payload guardは維持する。

## 7. 今回対象外

- canonical Company / Claim / Relation / Evidence / Source / Registry / Projection / Financialの変更
- Company個別ページの日本語化
- Global Visual System、Navigation、workflow、dependencyの変更
- Relation拡張、100社展開、Compare / Relation Freeze
- Human Review結果の捏造またはremediation後のHuman Test代替

## 8. Acceptance Criteria

- Legacy Compareは既定動作、visible text、controls、URL semanticsを維持し、Evidence fragment / controller requestは0 / 0。
- Evidence routeはfragment / controller request 1 / 1、二重fetch / import / initなし、stable mountと明示failure UIを維持。
- 390px前後の全表示企業ブロックで、番号、企業名、背景、枠線を表示し、色以外で所属企業を判別できる。
- mobile主要本文16px以上、補助情報14px以上、操作対象44px以上。
- 2560×1440、1080×1920、1024、390×844、360pxでdocument overflow 0。
- Set A / Set Bとも全指定viewportで意図しないmatrix overflow 0。390pxの本文コントラスト最小値は11.39:1。
- 1024px以上と列表示を維持する601～1023pxでは、cell内identity stripを表示せず、sticky column headerを企業識別の正本とする。
- 600px以下では各企業blockに01～04、企業名、背景、左枠を表示する。
- 要点は代表情報だけ、詳細は補足・全根拠・財務履歴までを表示し、URL、reload、back / forwardで状態を復元する。
- 要点の可視情報ブロックは詳細より30%以上少なく、document heightは20%以上短い。
- Applied Materials表記をcanonical Japanese nameへ統一。
- P1 / P2 / P3 = 20 / 14 / 0、Claim / Relation markers = 34 / 19、total = 53。
- canonical dataとprotected semantic diffは0。

## 9. 再レビュー項目

次回の実参加者レビューでは、次を確認する。

1. mobileの最初の画面だけで、ページ目的と全選択企業を言い当てられるか。
2. 01～04、企業名、背景、枠線の組合せで、長いスクロール後も情報の所属企業を迷わないか。
3. desktopではcell内の企業名反復なしでも、sticky column headerで列を追跡できるか。
4. 日本語primary / 英語secondaryと地名日本語化が自然か。
5. 要点だけで企業間の違いを短時間に理解でき、詳細との差を説明できるか。
6. Product / Technology / 供給網上の位置の分離で、重複感が解消したか。
7. Evidence markerからdrawer、一次資料、Escape、focus returnまで迷わず操作できるか。

## 10. 第2回Human Review

第1回remediation後のPC実画面を確認し、次を新たな正式入力とした。

1. `Integrated Materials Solution`など、一般利用者向けに日本語を先にすべき英語が残っていた。
2. `オレゴン州Tualatin`という英語混じりの地名が残っていた。
3. `Applied Materials（アプライド・マテリアルズ）`が列幅任せで不自然に折り返された。
4. PCでは列見出しがあるのに、全cellで01＋企業名を反復していた。
5. 要点と詳細の差が財務詳細へ偏り、要点が情報量を十分に削減していなかった。

## 11. 第2回で採択した修正

- Compare専用のexact mappingで `Integrated Materials Solution` を「統合材料ソリューション」、`Tualatin`を「チュアラティン」、`Oregon, United States`を「米国オレゴン州」とした。単純な部分文字列置換は使用しない。
- 正式英語名が必要な場合は「統合材料ソリューション（Integrated Materials Solution）」のように日本語をprimary、英語をsecondaryとする。
- 英語名と日本語名を持つCompanyは共通helperで2行へ分け、英語名・日本語括弧内をそれぞれ途中改行しない。accessible nameは双方を含む完全名を維持する。
- cell identity stripは600px以下だけで表示する。601px以上は列表示とし、既存のsticky column headerを企業識別の正本とする。
- 要点は各sectionの代表P1、P1がない場合だけ既存P2、製品最大3件、技術最大3件、供給網上の位置1件、主要な競争上の特徴、最新財務要点と、その表示項目のmarkerだけに絞る。
- 詳細は全P1 / P2投影、全Product / Technology、正規化した位置、補足、Relation詳細、Evidence trace、財務履歴と全53 markerを表示する。canonical dataとProjectionは変更しない。
- toggle説明、accessible name、URL stateを一致させ、detail切替はbrowser historyへ積む。reload / back / forwardで復元し、focusを維持する。

## 12. 第2回remediation実測

可視blockは、選択企業に属する企業情報、Claim、Relation、Technology item、財務要点、詳細metadata、財務履歴、Evidence traceを同一selector集合で数えた。document heightは同一final buildのChromeで測定した。

| Set / viewport | 要点block | 詳細block | 削減率 | 要点marker | 詳細marker | 要点height | 詳細height | height削減率 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Set A / 1024×768 | 22 | 50 | 56.0% | 16 | 21 | 2,360px | 3,999px | 41.0% |
| Set B / 1024×768 | 34 | 79 | 57.0% | 20 | 32 | 2,523px | 5,035px | 49.9% |
| Set A / 390×844 | 22 | 50 | 56.0% | 16 | 21 | 5,646px | 8,335px | 32.3% |
| Set B / 390×844 | 34 | 79 | 57.0% | 20 | 32 | 7,339px | 11,951px | 38.6% |

追加実測：

- desktop / tablet cell identity strip: 0。mobileはSet A 14、Set B 21（7 matrix sections × 選択企業数）。
- Applied Materialsは英語名1行＋日本語名1行で、各行のfragment数は1、accessible nameは英日完全名。
- document overflowは2560×1440、1920×1080、1080×1920、1024×768、768×1024、390×844、360×800のSet A / Set B / Legacyすべて0。
- 768pxのSet Bは列方式を維持し、table内だけ71pxの意図したhorizontal scrollを許容する。page document overflowは0。
- fragment / controller requestはEvidence初回1 / 1、4回のdetail切替で追加0 / 0。Legacyは0 / 0。
- 正常系console error 0。fragment 503ではlive mount内にstatus、48×44pxの再試行、診断error 1件を表示し、Legacyへfallbackしない。
- drawer、一次資料リンク、Escape、focus return、44px Evidence markerを確認した。
- Legacy Compare HTMLは585,468 Bで不変。Evidence fragmentは307,533 Bから311,929 B（+4,396 B、初回299,685 B比+4.1%）で5% guard内。Pagefindは105 pages / 5,791 wordsで不変。

## 13. 第2回remediation後の再レビュー項目

1. sticky column headerだけでdesktopの列を長距離追跡できるか。
2. 英語名／日本語名の2行固定が5社すべて自然か。
3. 日本語primary / 正式英語名secondaryの順序が理解を助けるか。
4. 要点16 / 20 markerでSet A / Bの差を短時間に説明できるか。
5. 詳細へ切り替えた際に、補足・全根拠・財務履歴が追加されたと明確に理解できるか。
6. 600px以下のidentity stripと601px以上のcolumn header方式の境界が自然か。
