# Company Compare Human UX Review v0.1

## 1. Status

- Review input: 実ユーザーの初見レビューを正式入力として採択
- Remediation scope: `view=evidence` Company Compare Pilot presentation only
- Human re-test executed after remediation: NO
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
- desktopを含む全大セクションの各企業セルに企業番号とcanonical Japanese nameを再表示する。
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
- desktopの各大セクションで企業名を再確認できる。
- Applied Materials表記をcanonical Japanese nameへ統一。
- P1 / P2 / P3 = 20 / 14 / 0、Claim / Relation markers = 34 / 19、total = 53。
- canonical dataとprotected semantic diffは0。

## 9. 再レビュー項目

次回の実参加者レビューでは、次を確認する。

1. mobileの最初の画面だけで、ページ目的と全選択企業を言い当てられるか。
2. 01～04、企業名、背景、枠線の組合せで、長いスクロール後も情報の所属企業を迷わないか。
3. desktopの各大セクションにある企業名再表示で、列追跡が十分か。
4. 日本語化した一般語と残した固有名詞のバランスが自然か。
5. 16px本文による可読性向上と、約6.3%増えたmobile scroll burdenのtrade-offが許容されるか。
6. Product / Technology / 供給網上の位置の分離で、重複感が解消したか。
7. Evidence markerからdrawer、一次資料、Escape、focus returnまで迷わず操作できるか。
