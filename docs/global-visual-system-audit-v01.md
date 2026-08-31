# Global Visual System Audit v0.1

- Audit date: 2026-08-31
- Baseline: `f38c26daccf9f80c012730ba20e1e65ce59a1537`（PR #113 merge後のmain）
- Public reference: `https://kei-titanda-22.github.io/ai-infrastructure-atlas/`
- Viewports: desktop 1280 × 900、mobile 360 × 800
- Scope: Home / Companies / Atlas / Compare / Financials / Search / Pilot company / non-Pilot company
- Pilot implementation scope: Home / Companies / Atlas / Financials / Search の5ページのみ

## 1. 判定方法

公開mainをブラウザで開き、DOM、computed style、実寸を取得した。幅はmain内の最初の`.shell`、document heightは`documentElement.scrollHeight`、document overflowは`scrollWidth - innerWidth`、first screenはviewport下端より上にある見出し・操作要素で判定した。

「card-like」は既存の意味単位クラス（工程、財務summary、chart等）の数であり、カード表現の採否そのものではない。別に「full-frame」を計測し、対象コンテナの上下左右4辺すべてにborderがある場合だけ数えた。表のセル罫線を含む全rule-bearing element数はページ規模に強く依存するため、デザイン判断ではfull-frame、shadow、overflow、document heightを優先する。

## 2. Before inventory

### Desktop 1280 × 900

| Page | card-like | pills | headings | rule-bearing elements | content width | document height | overflow | visible filters | first row height |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home | 8 | 0 | 3 | 14 | 1225 | 1476 | 0 | 0 | 86 |
| Companies | 0 | 0 | 1 | 309 | 1225 | 7343 | 0 | 4 | 63 |
| Atlas | 10 | 0 | 1 | 13 | 1225 | 2427 | 0 | 0 | — |
| Compare | 0 | 0 | 2 | 13 | 1225 | 1761 | 0 | 0 | 40 |
| Financials | 11 | 0 | 4 | 57 | 1225 | 2276 | 0 | 1 | 65 |
| Search | 0 | 0 | 1 | 5 | 1240 | 900 | 0 | 1 | — |
| Pilot: NVIDIA | 2 | 0 | 20 | 18 | 1225 | 2825 | 0 | 0 | 37 |
| non-Pilot: Kioxia | 0 | 0 | 16 | 29 | 1225 | 3523 | 0 | 0 | 65 |

### Mobile 360 × 800

| Page | card-like | pills | headings | rule-bearing elements | content width | document height | overflow | visible filters | first row height |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home | 8 | 0 | 3 | 15 | 321 | 2053 | 0 | 0 | 131 |
| Companies | 0 | 0 | 1 | 309 | 321 | 7629 | 0 | 4 | 64 |
| Atlas | 10 | 0 | 1 | 13 | 321 | 2601 | 0 | 0 | — |
| Compare | 0 | 0 | 2 | 13 | 321 | 5119 | 0 | 0 | 40 |
| Financials | 11 | 0 | 4 | 46 | 321 | 3540 | 0 | 1 | 65 |
| Search | 0 | 0 | 1 | 6 | 321 | 825 | 0 | 1 | — |
| Pilot: NVIDIA | 2 | 0 | 20 | 16 | 321 | 3523 | 0 | 0 | 37 |
| non-Pilot: Kioxia | 0 | 0 | 16 | 30 | 321 | 4918 | 0 | 0 | 65 |

全8ページでgradient、pill、6px以上のrounded container、document overflowは0だった。主な不整合は装飾の多さではなく、幅、階層、secondary text、コンテナ表現、モバイル再配置の違いにあった。

## 3. Page-by-page findings

### Home

- 長所: 検索、DB収録状況、工程、更新履歴の順序は明快。工程色は情報構造に結び付いている。
- 課題: opening areaが大きく、desktopでも8工程が横スクロールになる。青い常時underlineが工程内で反復する。
- Pilot: openingを圧縮し、desktopでは8工程を1画面に収め、リンクは通常時をmuted text、hover/focus時をunderlineとする。

### Companies

- 長所: 100社を一つの正式表で比較でき、sticky header、検索、layer/country/tag系URL contractが機能している。
- 課題: toolbarだけが白い全周フレームでapplication panelに見える。sticky headerの7セルにshadowがあり、本文の平面的な研究表現と一致しない。
- Pilot: toolbarを上下ruleのcontrol rowへ変更し、header shadowを0にする。表構造・列・filter処理は変更しない。

### Atlas

- 長所: 色は工程識別に使われており装飾色ではない。工程からCompanies filterへ直接遷移できる。
- 課題: 読み方注記の左線がquote/calloutに見える。mobileは760pxの内部横スクロールに依存する。
- Pilot: 注記を上下ruleへ、工程線を6pxから3pxへ抑制。mobileは120px / 可変幅の2列とリンク2列へ再配置し、document overflowを作らず内部横スクロール依存を外す。

### Compare（audit only）

- 長所: selectorと比較表の密度は用途に合い、カード化されていない。
- 課題: mobile document heightが5119pxで、横長比較表との役割分担を次段階で検討する必要がある。
- Decision: Pilotでは変更しない。比較契約とfinancial bridgeの回帰対象にだけ含める。

### Financials

- 長所: 一次資料監査済みの時系列、定義、期間、missingnessを明示する。グラフのperiod/value/tooltipは有効。
- 課題: summary、selector、chartが計8個の全周フレームとなり、5つの大きな数値と合わせてdashboard / SaaS画面に見える。
- Pilot: 8 full-frameを0にし、summaryはdata strip、selectorはcontrol row、chartは上下ruleのfigureへ変更。グラフロジック、サイズ、値、tooltip、period definitionは変更しない。

### Search

- 長所: 1入力1操作で用途が明確。結果はbibliographic listに近い。
- 課題: empty stateに対してpage headが大きく、青いprimary actionが他のresearch UIより強い。
- Pilot: headを圧縮し、buttonをink色へ、statusをrule付きの静かな行へ変更。Pagefind処理は変更しない。

### Company Evidence Pilot / non-Pilot company

- PilotのNVIDIAは、typography-first、muted metadata、section rule、bibliography、compact mobile disclosureが全体systemの参照として妥当。
- non-PilotのKioxiaは、同じcompany routeでも情報量とsection densityが異なる。Pilotの情報設計を全社へコピーしてはならない。
- 今回は両ページを一切変更せず、回帰確認に使用する。

## 4. AI-generated UI pattern 判定

今回確認された残存パターンは次の通り。

1. KPIを同形の枠へ等分配置するdashboard pattern（Financials）。
2. filter群を独立した白いapplication panelへ入れるpattern（Companies）。
3. 説明文へ太い左線を付けるquote / insight callout pattern（Atlas）。
4. 役割に関係なくprimary actionを鮮青色で強調するpattern（Search / Home）。
5. secondary textが`text-contrast.css`のglobal overrideで本文色になり、階層が色ではなく余白とサイズだけに依存する状態。

gradient、large radius、pill群、decorative shadow、badge群は現状で既に0であり、新たに導入しない。

## 5. Freeze / semantic boundary

以下は変更対象外として固定した。

- claims / Evidence / Source / Source Policy / Schema / status / priority
- company、financial、competitor、facility、relation、value-chain data
- Evidence marker、2-click drawer、nested disclosure、Escape/focus return
- Pilot 5社のsemantic contentとCompany Evidence visual system
- Compare pageとFinancialChartの描画ロジック、サイズ、tooltip、period definition
- Companiesの検索、layer/country/technology/stage filter、canonical country label、URL restore

## 6. Pilot Before / After

同一ブラウザ、同一viewport、同一計測関数による比較。

### Desktop 1280 × 900

| Page | full-frame | content width | document height | hero bottom | shadows | overflow |
|---|---:|---:|---:|---:|---:|---:|
| Home | 1 → 1 | 1225 → 1180 | 1476 → 1434 | 386 → 358 | 0 → 0 | 0 → 0 |
| Companies | 1 → 0 | 1225 → 1180 | 7343 → 7160 | 247 → 227 | 7 → 0 | 0 → 0 |
| Atlas | 0 → 0 | 1225 → 1180 | 2427 → 2361 | 247 → 227 | 0 → 0 | 0 → 0 |
| Financials | 8 → 0 | 1225 → 1180 | 2276 → 2222 | 276 → 227 | 0 → 0 | 0 → 0 |
| Search | 0 → 0 | 1240 → 1180 | 900 → 900 | 247 → 227 | 0 → 0 | 0 → 0 |

### Mobile 360 × 800

| Page | full-frame | document height | hero bottom | first row height | overflow |
|---|---:|---:|---:|---:|---:|
| Home | 1 → 1 | 2053 → 2009 | 594 → 545 | 131 → 129 | 0 → 0 |
| Companies | 1 → 0 | 7629 → 7376 | 291 → 233 | 64 → 62 | 0 → 0 |
| Atlas | 0 → 0 | 2601 → 2237 | 320 → 256 | — | 0 → 0 |
| Financials | 8 → 0 | 3540 → 3504 | 349 → 280 | 65 → 65 | 0 → 0 |
| Search | 0 → 0 | 825 → 825 | 291 → 256 | — | 0 → 0 |

Card-like semantic objectsは Home 8、Atlas 10、Financials 11のまま。これは工程とグラフを削除していないことを示す。pill、rounded container、gradientは全ページ0のまま。見出し数、visible filter数、table row数も不変。rule-bearing elementは情報表のセル罫線を維持したため大きくは変えず、全周フレームとshadowだけを削減した。

## 7. Browser QA result

### Functional

- Homeの「半導体テスト」link: `?technology=semiconductor-test`へ遷移し4社を表示。
- Companies country: Chinaで2社、URLは`?country=China`、再読込後もvalueと2社表示を復元。
- Canonical labels: 中国 / イスラエル / スウェーデンをselect optionで確認。
- Companies search: アドバンテストで1社。Test & Back-end単独filterで8社。
- AtlasのGPU link: `?tag=GPU`とactive filter表示を確認。
- Financials: TSMC選択で`?company=tsmc`、TSMCだけを表示しcompany linkを維持。
- Search / Pagefind: NVIDIAで6件、先頭はNVIDIA company page。
- Compare: Pilot対象外のまま、5 company headerと5 financial bridge linkを維持。
- Evidence: marker 1 clickでdrawer、drawer内に一次資料link（2 clickで到達可能）。Escapeで閉じ、focusは起点markerへ復帰。

### Responsive / accessibility

- Pilot 5ページを1280 × 900 / 360 × 800で確認し、document overflowはすべて0。
- Companies search controlはmobile実寸46px、focus outline 3px。
- Pilot / regression対象のNVIDIA、TSMC、Vertiv、Kioxia、Advantest、ASMLは両viewportでoverflow 0。
- Pilot companyは`site-main`のままでglobal visual opt-in classが付かず、Atlas analysis labelとEvidence markerを維持。
- table、form、heading、dialogのnative/ARIA semanticsをbrowser accessibility treeで確認。

### Semantic diff

公開Beforeとlocal Afterの`main.innerText`を同じviewportで比較し、5ページすべて完全一致した。

| Page | Before length | After length | Equal |
|---|---:|---:|---|
| Home | 2085 | 2085 | YES |
| Companies | 13028 | 13028 | YES |
| Atlas | 1033 | 1033 | YES |
| Financials | 3585 | 3585 | YES |
| Search | 102 | 102 | YES |

`src/data`、`src/components`、`src/lib`、company files、financial filesのdiffは0。

## 8. Audit conclusion

5ページPilotはsemantic contractを保ったまま、Company Evidenceで採択済みの編集的な方向へ近づいた。特にFinancialsのdashboard感、Companiesのapplication panel感、Atlasのcallout感は局所的に解消した。

Full-site Visual Rolloutは、このPilotを公開mainで確認し、Compare、methodology、glossary、financial updates、non-Pilot company archetypeごとの追加監査と採択判断を行うまで開始しない。
