# Company Compare Human UX Review v0.1

## 1. Status

- Review input: 実ユーザーの初見レビューと第2回・第3回Human Reviewを正式入力として採択
- Remediation scope: `view=evidence` Company Compare Pilot presentation only
- 第3回remediation後のHuman re-test executed: NO
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
- 詳細は全P1 / P2投影、全Product / Technology、供給網上の位置、補足、Relation詳細、Evidence trace、財務履歴と全53 markerを表示する。canonical dataとProjectionは変更しない。
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

## 14. 第3回Human Review

第2回remediation後の実画面を確認し、次を新たな正式入力とした。

1. 詳細表示でもLam Researchの主な製品が名称一覧のままで、各製品が何をするものか分からない。
2. 要点は製品名中心でよいが、詳細は製品ごと1～2行の日本語説明を必要とする。
3. `正規化した位置`、`正規化した製品カテゴリ`、`products: 収録済み`、`関係データ：収録なし`は利用者向けでない内部用語に見える。
4. PCの`比較項目`、企業名、日本語企業名、ticker／国、左列の大項目、企業情報、製品名の文字が小さい。
5. 同一問題はSet AとSet Bへ共通の表示契約で対応する。

## 15. 第3回で採択した修正

- Pilotのcanonical Product 11件すべてに、既存Product Registry、Claim、Relation、Evidenceの範囲だけで作成した日本語の役割説明を付与した。各説明はcanonical Product IDとgroundingに用いたClaim ID／Relation IDをCompare専用fixtureで固定する。
- 要点では説明を表示せず、製品名と既存Evidence markerを中心にする。詳細では名称直下に1～2行の説明を表示し、既存metadataとdrawer導線を維持する。
- 製品説明は投資評価・優劣・会社固有性能を加えず、1～2文、80日本語文字以内とした。新規Sourceは探索・追加していない。
- primary displayから`正規化した位置`、`正規化した製品カテゴリ`、`products:`、`関係データ：収録なし`を除去した。利用価値の低いCoverage収録状態は表内で反復しない。
- `供給網上の位置`の直下は`半導体製造`または`計算半導体`という値だけにし、内部の中間見出しを置かない。
- Compare Evidence専用CSSで、PCの比較項目18px/700、英語企業名18px/700、日本語企業名16px、ticker／国14px、左列見出し16px/700、企業情報16px、製品名16px、詳細説明15px/1.65を共通契約とした。

## 16. 第3回remediation実測

可視blockは第2回と同じselector集合に、新たにClaimから展開したcanonical Product itemを加えて数えた。製品説明文自体は独立blockとして二重計上していない。

| Set / viewport | 要点block | 詳細block | 削減率 | 要点marker | 詳細marker | 要点height | 詳細height | height削減率 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Set A / 1024×768 | 22 | 50 | 56.0% | 16 | 21 | 2,363px | 3,895px | 39.3% |
| Set B / 1024×768 | 34 | 84 | 59.5% | 20 | 32 | 2,548px | 5,030px | 49.3% |
| Set A / 390×844 | 22 | 50 | 56.0% | 16 | 21 | 5,614px | 8,106px | 30.7% |
| Set B / 390×844 | 34 | 84 | 59.5% | 20 | 32 | 7,309px | 11,783px | 38.0% |

追加実測：

- 要点のProduct説明はSet A / Set Bとも0件。詳細はSet A 6件、Set B 9件を表示し、両set全体でcanonical Product 11件をカバーする。全指定viewportで各1～2行に収まる。
- computed font sizeは比較項目18px、英語企業名18px、日本語企業名16px、ticker／国14px、左列見出し16px、企業情報16px、製品名16px、製品説明15px・line-height 24.75px。
- Applied Materialsは英語名1行＋日本語名1行、各行のfragment数1、accessible nameは英日完全名を維持した。
- desktop / tablet identity stripは0。mobileはSet A 14、Set B 21を維持した。
- 2560×1440、1920×1080、1080×1920、1024×768、768×1024、390×844、360×800のSet A / Set B / Legacyでdocument overflow 0。Set B / 768pxはmatrix内のみ71pxの意図したhorizontal scrollを維持。
- 44px Evidence marker / detail toggle、sticky header、drawer、Primary Source、Escape、focus return、URL / reload / back / forwardの状態復元、正常系console error 0を確認した。
- Legacyはfragment / controller request 0 / 0、Evidenceは1 / 1、detail切替での追加requestは0 / 0という自動fixture契約を維持した。
- Legacy Compare HTMLは585,468 B。Evidence fragmentは311,929 Bから312,320 B（+391 B）、gzip 22,282 B。追加は11件のProduct説明と表示用grounding対応による。5% guard内。

## 17. 第3回remediation後の再レビュー項目

1. 要点の製品名一覧だけで比較の速度を損ねないか。
2. 詳細の1～2行説明で、Set A / Set Bの全製品の役割を誤解なく説明できるか。
3. `供給網上の位置`と値だけの構造が自然か。
4. 表見出しと企業情報の文字階層で、長い比較表を追いやすくなったか。
5. 詳細説明とEvidence marker／drawerの対応が利用者に伝わるか。

以上は再レビュー予定の項目であり、第3回remediation後のHuman Test結果は生成していない。

## 18. 第4回Human Review

第3回remediation後の実画面を確認し、次を新たな正式入力とした。

1. `Atlasによる分析`は説明的すぎ、比較表内で反復するとAI生成レポートのように見える。
2. P2へ一律表示した`補足`は、表示内容の意味を独立して説明していない。
3. `主な確認点`と`〜を主な確認点とする`は、企業リスクではなく編集者の作業メモに見える。
4. FactとAtlas Analysisの区別は維持しつつ、利用者が比較できる具体的なリスク見出し・本文を必要とする。

## 19. 第4回で採択した修正

- Factの表示ラベル`事実`は維持し、Atlas Analysisの表示ラベルを`Atlasの見方`へ変更した。内部claimType、Evidence、Source、Locatorは変更していない。
- P2であることだけを示す`補足`ラベルと、詳細toggle説明内の`補足`をprimary UIから削除した。要点／詳細の選択ロジック、priority、Coverageは不変とした。
- Broadcom、Applied Materials、Lam Research、Tokyo Electronの4件のAtlas Analysisリスクを、具体的な比較対象を示す見出し・本文へCompare専用display mappingで変更した。
- NVIDIAのFactリスク`外部製造への依存`と本文は変更していない。
- section-level注記と各Claimのaccessible nameで`事実`と`Atlasの見方`を文字として識別でき、既存の視覚差も維持した。色だけに依存しない。
- `主な確認点`、`確認点とする`、`注目点とする`、`留意点とする`、`見ていく必要がある`を新しいprimary display copyへ使用しない契約をfixtureで固定した。

## 20. 第4回remediation実測

第3回と同じ可視情報block契約で、表示entryの追加・削除がないことを確認した。document heightは同一final buildのChromeで実測した。

| Set / viewport | 要点block | 詳細block | 削減率 | 要点marker | 詳細marker | 要点height | 詳細height | height削減率 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Set A / 1024×768 | 22 | 50 | 56.0% | 16 | 21 | 2,323px | 3,835px | 39.4% |
| Set B / 1024×768 | 34 | 84 | 59.5% | 20 | 32 | 2,508px | 4,970px | 49.5% |
| Set A / 390×844 | 22 | 50 | 56.0% | 16 | 21 | 5,550px | 8,020px | 30.8% |
| Set B / 390×844 | 34 | 84 | 59.5% | 20 | 32 | 7,173px | 11,579px | 38.1% |

追加実測：

- primary UIの`Atlasによる分析`、`補足`、`主な確認点`、`確認点とする`はSet A / Set Bの要点・詳細、1024px / 390px / 360pxですべて可視0件。
- section-level表示ラベルはPilot 5社合計で`事実`11件、`Atlasの見方`12件。accessible Claim / Relationは要点でSet A 事実7 / Atlas 6、Set B 事実7 / Atlas 11、詳細でSet A 事実9 / Atlas 9、Set B 事実14 / Atlas 15を文字で識別できる。
- canonical 34 Claimの内部claimTypeはfact 8、company-guidance 3、company-positioning 3、atlas-analysis 20で不変。
- 4件のAtlas Analysisリスクは要点と詳細で同じ見出し・本文を表示し、NVIDIAのFactリスク文言も不変。全表示entryのgrounding ID、marker、drawer、一次資料、structured Locatorを解決できる。
- 1024px / 390px / 360pxのLegacy / Set A / Set Bでdocument overflow 0。Evidence markerとdetail toggleは最小44×44px。
- drawer、Primary Source、Escape、focus return、summary / detailのURL、reload、back / forwardを確認した。正常系console errorは0。
- LegacyはEvidence rootをmountせず、fragment / controller request 0 / 0。Evidenceはfragment / controller request 1 / 1、detail切替で追加request 0 / 0という決定論的fixture契約を維持した。
- Legacy Compare HTMLは585,468 B。Evidence fragmentは312,007 B、gzip 22,354 Bで5% guard内。Pagefindは105 pages / 5,791 words。

以上は第4回Human Review入力に対するremediation結果であり、実参加者によるHuman Test結果は生成していない。

## 21. 第5回Human Review

第4回remediation後の実画面を確認し、詳細表示の財務履歴について次を新たな正式入力とした。

1. 見出し、期間、数値、出典が11px中心で、周辺の比較本文に対して小さすぎる。
2. 数値セルが上揃えのため、2行の期間情報や44pxの出典導線との行内関係が不安定に見える。
3. 均等に近い自動列幅では、最大桁数の異なる売上高・利益率・FCF・設備投資へ不要な余白が生じる。
4. 可読性を上げながら、財務詳細全体の縦方向の負担は増やさない必要がある。

## 22. 第5回で採択した修正

- 財務詳細の列に期間、各数値指標、出典のsemantic classを付与し、Set A / Set Bを同じcomponentとCSSで処理する。
- 数値と対応見出しを右揃え、数値セルを縦中央、`tabular-nums`とし、欠損状態はnumeric classから分離して中央表示する。
- 期間は左揃えのまま、期間14px/600、通貨・単位・会計基準11px以上の2行を維持する。数値は14px/500、列見出し14px/600、欠損と出典は13px以上とする。
- Applied Materials、Lam Research、Tokyo Electronの現実の最大桁数をfixtureへ固定し、値を切り詰めず一行表示する。収録値、期間、単位、会計基準、出典は変更しない。
- 期間、売上高、営業利益、営業利益率、FCF、設備投資、ROIC、出典を内容に応じた非均等列幅にし、1024pxでは表内scrollなし、768px以下では表内scrollを許容する。
- interactiveな出典リンクは44px targetを維持しつつ、非interactive cellのpaddingを調整して標準行高48〜56pxを目標とする。

## 23. 第5回remediation実測

変更前のSet B / 1024×768では、財務詳細セクション1,146.2px、3社の表合計927.7px、標準行高59pxだった。列見出し、期間、数値、出典は11px、通貨・単位・会計基準は9px、数値セルは上揃えだった。

同一final buildのChromeで変更後を再測定した。

| Set B / 1024×768 | Before | After | 差分 |
|---|---:|---:|---:|
| 財務詳細セクション全体 | 1,146.2px | 1,064.0px | -82.2px（-7.2%） |
| 3社の表合計 | 927.7px | 845.5px | -82.2px（-8.9%） |
| 標準行高 | 59px | 53px | -6px |

変更後の列幅は期間183.6px、売上高101.5px、営業利益106.3px、営業利益率106.3px、FCF149.8px、設備投資96.6px、ROIC77.3px、出典145.0px。1024pxでは3社とも表内scroll 0、768pxでは表内だけ173px、390pxでは551px、360pxでは581pxのhorizontal scrollとなり、全条件でdocument overflowは0だった。

列見出し14px/600、期間14px/600、数値14px/500、通貨・単位・会計基準11px、欠損と出典13pxを確認した。数値は右揃え・縦中央・`tabular-nums`、期間は左揃え、欠損はnumeric classを持たず中央揃えである。最大桁fixtureの`7,302`、`18,435.591`、`2,431,568`を含む全数値で`scrollWidth = clientWidth`、nowrap、fragment 1件を確認し、切り詰め・折り返しは0件だった。出典リンクは全viewportで高さ44pxを維持した。

Set A / Set Bの要点では財務詳細表0件、詳細では選択会社数どおり2件 / 3件を表示した。summary cardは2件 / 3件で不変。drawer、Primary Source、Escape、focus returnを確認し、正常表示でfailure UIは0件だった。

Legacy Compare HTMLは585,468 Bで不変。Evidence fragmentは312,007 Bから314,559 B（+2,552 B、初回299,685 B比+5% guard内）、gzip 22,416 B。Pagefindは105 pages / 5,791 wordsで不変である。

以上は第5回Human Review入力に対するremediation結果であり、最終的な読みやすさ判断は次のHuman Reviewへ残す。実参加者によるHuman Test結果は生成していない。

## 24. 第6回Human Review

第5回remediation後の実画面を確認し、英語名と日本語名を併記する会社リンクで、英語名はlink color、日本語名は本文色になっている不整合を正式入力とした。DOM上は既に1つのanchor内だったが、secondary nameへ独立したmuted colorが指定されていたため、同じ会社名が別情報に見える状態だった。

## 25. 第6回で採択した修正

- 選択中カードを含むすべてのCompany identity linkを、英語名と日本語名の2行を内包する単一anchor factoryへ統一する。
- 日本語名は2行目を維持し、anchorの通常・visited・hover・focus colorを継承する。1 identity内の重複anchorとnested anchorを作らない。
- 比較表の列見出し、mobile identity、財務詳細の会社見出し、根拠追跡の会社見出しを、Evidence root表示前に同じrendererへ統一する。
- 東京エレクトロンは日本語primaryの1行表示を維持し、accessible nameでは英語名と日本語名を保持する。
- Company URL、会社名、ticker、国、業種、canonical dataは変更しない。文中の非link会社名は対象外とする。

## 26. 第6回remediation検証

同一final buildのChromeで、Set A / Set Bの要点・詳細を1024×768、390×844、360×800で再測定した。

- 各Company identity表示は1 anchorで、選択中、比較表列見出し、mobile identity 7か所、財務詳細見出し、根拠追跡見出しの計11か所を同一rendererで生成した。各表示内のanchorは1件、日本語名だけの重複linkとnested anchorは0件である。
- Applied MaterialsとLam Researchの選択中表示は、通常時に英語名・日本語名とも`rgb(0, 87, 184)`、hover時にとも`rgb(0, 63, 135)`、keyboard focus時にとも`rgb(0, 87, 184)`となった。mobile identityでも両行のcomputed colorは一致した。
- 英語名と日本語名は同じ44px高のfocus targetに入り、日本語名は英語名の21.59px下の2行目、text fragment 1件として表示した。1024px / 390px / 360pxの全条件で途中改行は0件だった。
- 選択中Set BのTab順は、Applied Materials link、外すbutton、Lam Research link、外すbutton、東京エレクトロンlinkとなり、会社名のfocusは各社1回だけだった。EnterでApplied Materialsの`/companies/applied-materials/`へ遷移した。
- accessible nameは英語名と日本語名の双方を保持した。東京エレクトロンは日本語primaryの1行linkを維持し、accessible nameのみ`Tokyo Electron（東京エレクトロン）`を保持した。
- Set A / Set Bの詳細markerは21件 / 32件、要点markerは16件 / 20件。全viewportでdocument overflow 0、正常系console error 0だった。
- 第5回で修正した財務表は、1024pxで列見出し14px、期間14px/600、数値14px/500・右揃え・縦中央・`tabular-nums`、標準行高53px、出典link高44px、表内scroll 0を維持した。
- Company URL、会社名、ticker、国、業種のsemantic snapshotに差分はない。Legacy Compare、Company個別ページ、Company / Evidence / Source / Relation / Financial dataには変更していない。
- Legacy Compare HTMLは585,468 B、Evidence fragmentは314,559 B、gzip 22,416 B。Pagefindは105 pages / 5,791 wordsで不変である。

以上は第6回Human Review入力に対するremediation結果であり、実参加者によるHuman Test結果は生成していない。

## 27. 第7回Human Review

第6回remediation後の実画面を確認し、詳細表示の財務履歴について次を新たな正式入力とした。

1. 金額列で`USD · million`、`JPY · million`が期間行ごとに反復し、日本語ページ内で英語の内部表現が目立つ。
2. `US GAAP`、`Japanese GAAP`も各行で反復しており、会社単位で一度示せば足りる情報が表を縦に重くしている。
3. `Q3 FY2026`、`June 2025 quarter`等の期間名が英語のままで、日本語の比較表として走査しにくい。
4. 第5回で数値列見出しを右揃えにしたが、複数行見出しの視線位置が揃わず、表全体では中央揃えの方が自然である。

## 28. 第7回で採択した修正

- USD / millionの金額列単位を`百万ドル`、JPY / millionを`百万円`として列見出しへ表示する。canonical currency、unit、数値は変更しない。
- 会計基準は会社見出し直下へ1回だけ、US GAAPを`米国会計基準`、Japanese GAAPを`日本会計基準`として表示し、期間行から反復表示を除く。
- canonical periodLabelは保持し、Compare専用formatterで`2026年度 第3四半期`、`2025年6月期（四半期）`等へ決定論的に日本語化する。未対応形式は推測せず失敗させる。
- 同一会社内でcurrency / unitまたはaccounting basisが混在する場合は表を生成せず失敗させる。Pilot 5社は各社内で単位・会計基準が一意であることをfixtureで固定する。
- 財務表の8列見出しを水平・垂直中央揃えへ統一する。数値セルの右揃え・縦中央・`tabular-nums`、期間の左揃え、欠損・出典の中央揃え、出典linkの44px targetは維持する。
- 説明文を`各社が開示した通貨・単位で表示しています。為替換算、順位付け、差分率の計算は行っていません。`へ統一する。
- Summary財務カード、canonical Financial data / contract、Financial compatibility、Company個別ページ、Legacy Compareは変更しない。

以上は第7回Human Review入力に対する採択内容であり、実参加者によるHuman Test結果は生成していない。

## 29. 第7回remediation検証

同一final buildのChromeで、Set A / Set Bの要点・詳細を1024×768、768×1024、390×844、360×800で再測定した。

- 財務詳細はSet A 2社14行、Set B 3社14行をcanonical endDate / ID順で表示した。金額の再計算、丸め、換算は行わず、全138 metric cellの表示値・欠損・順序をfixtureで照合した。
- NVIDIA、Broadcom、Applied Materials、Lam Researchは全金額列を`百万ドル`、東京エレクトロンは`百万円`とした。会計基準は各社表の冒頭1回だけ`米国会計基準`4件、`日本会計基準`1件を表示した。
- 全23 periodLabelを決定論的に日本語化した。`Q3 FY2026` / `FY2026 Q3` / `FY2026` / named quarterを含む採択形式をfixtureで固定し、未知形式、currency / unit混在、accounting basis混在は明示的にrejectする。
- 財務詳細primary UIで`USD · million`、`JPY · million`、`US GAAP`、`Japanese GAAP`の可視件数は0。Summary財務カードはSet A 2件 / Set B 3件で不変である。
- 財務表の8列見出しは全社・全指定幅で水平中央・垂直中央、期間行は左・中央、数値は右・中央・`tabular-nums`、欠損と出典は中央となった。数値cellのoverflowは0、出典linkとdetail toggleの最小高は44pxである。
- 1024pxでは全5表の表内scrollは0。768pxでは173px、390pxでは551px、360pxでは581pxの表内horizontal scrollを許容し、全16状態でdocument overflowは0だった。
- 要点 / 詳細のmarkerはSet A 16 / 21、Set B 20 / 32で不変。drawer、Primary Source、Escape、focus returnを確認し、正常系console errorは0だった。
- Legacy Compare HTMLは585,468 B。Evidence fragmentは314,627 B、gzip 22,480 Bで、初回299,685 B比5% guard内。Pagefindは105 pages / 5,791 wordsを維持した。

以上は第7回Human Review入力に対するremediation結果であり、実参加者によるHuman Test結果は生成していない。

## 30. Freeze済みEvidence fragment size baseline

PR #158はHuman Review 7回を経てCompany Compare Pilot UI v0.1として正式採択され、main `08cdd9dde22a0ec8d2908a58750cb718ec455810`へmergeされた。merge後のLinux CIではEvidence fragmentが314,771 Bとなり、Information Reduction前の旧baseline 299,685 Bに対する5%上限314,669 Bを102 B超過した。Windows local buildは314,627 Bで、Linux CIとの差は144 Bだった。

この差はFreeze済み表示内容を削減する根拠とはせず、PR #158のLinux CI成果物314,771 Bを新しいaccepted baselineとして固定する。baseline metadataは`acceptedRawBytes: 314771`、`acceptedAtMainSha: 08cdd9dde22a0ec8d2908a58750cb718ec455810`、`acceptedReason: Company Compare Pilot UI v0.1 Freeze`、`growthLimitRatio: 1.05`とする。既存と同じ端数切り捨てにより、新上限は330,509 Bである。

このrebaselineはInformation Reduction、日本語表示規格、mobile company identity、製品説明、会社名リンク統一、リスク見出し改善、財務表の可読性、日本語の通貨・単位・会計基準、7回のHuman Reviewを含むFreeze済み成果物を基準点とする。`+5%`の増加上限は変更せず、Company Compare UI、visible text、data、Evidence、Relation、Financial、workflow、production build outputは変更しない。
