# Company Compare On-demand Loading v0.1

## Status

- Baseline main: `322a4a576b2c79617dc59270083dfcf41a53ee48`
- Scope: Company Compare Pilot 5社のみ
- First batch 15社: 未追加
- Merge / deploy / Pages: 未実施
- Production semantic diff: 0を必須とする

## Architecture

Evidence表示は次の3層に分離する。

1. `company-compare-evidence-v01/`: 共通UI shellと軽量manifest
2. `company-compare-evidence-v01/{companyId}/`: 1社単位の静的HTML projection asset
3. lazy controller: URL上で選択されたassetだけを取得・検証・mount

shellには共通section、状態表示、財務互換性の共通注記、asset pathを含むmanifestだけを置く。Claim、Relation本文、Evidence drawer、Source、製品説明、会社別財務履歴は置かない。manifestのrecordは`companyId`、`assetPath`、`schemaVersion`だけであり、会社別projection本文を持たない。

会社assetはbuild時に既存read modelから決定論的に生成する。1 asset = 1 companyとし、他社の`data-company-id`を許可しない。全assetは`data-pagefind-ignore="all"`を持ち、外部通信を行わない。

### Pilot assets

- `nvidia`
- `broadcom`
- `applied-materials`
- `lam-research`
- `tokyo-electron`

## Runtime contract

- Legacy: shell 0、controller 0、company asset 0 request。
- Evidence未選択: shell 1、controller 1、company asset 0 request。
- Set A cold load: shell 1、controller 1、`nvidia` / `broadcom`各1 request。
- Set B cold load: shell 1、controller 1、`applied-materials` / `lam-research` / `tokyo-electron`各1 request。
- 追加: 未取得の1社だけを取得する。
- 解除: assetを再取得しない。
- 再追加、要点／詳細切替、Back／Forward: session cacheを使い再取得しない。
- 同一assetの並行requestは1つのin-flight Promiseへ集約する。
- selection revisionにより、遅れて完了した旧selectionが現在表示を上書きしない。
- asset URLはmanifestにGitHub Pages base path込みで生成し、runtimeでsame-originを検証する。

## Validation and failure isolation

assetはHTTP status、company ID、schema version、必要slot全件、未知／重複slot、他社`data-company-id`混入を検証してからmountする。timeoutは10秒。404、500、invalid payload、schema mismatch、timeoutは失敗した会社に限定して表示し、成功済みassetは維持する。

失敗表示は`aria-live`領域に会社名を示し、44 px以上の「再試行」を置く。再試行は当該assetだけを再取得し、URL、選択順、成功済みcacheを維持する。Legacyへのsilent fallbackは行わない。

## Payload contract

旧baselineはPR #158 merge時のLinux Evidence fragment `314,771 B`、+5%上限は`330,509 B`である。旧上限は引き上げず、`scripts/fixtures/company-compare-on-demand-size-v01.json`で新しい分割判定を固定する。

| Asset | Raw | gzip |
| --- | ---: | ---: |
| Shell | 7,431 B | 2,169 B |
| NVIDIA | 55,530 B | 5,460 B |
| Broadcom | 63,168 B | 5,311 B |
| Applied Materials | 56,193 B | 5,736 B |
| Lam Research | 83,754 B | 6,469 B |
| Tokyo Electron | 52,973 B | 5,743 B |

転送単位ごとのgzip値を合算すると、Set A cold loadはraw `126,129 B` / gzip `12,940 B`、Set Bはraw `200,351 B` / gzip `20,117 B`。1～4社の全30組合せで最大はNVIDIA / Broadcom / Applied Materials / Lam Researchのraw `266,076 B`であり、`330,509 B`以下である。

個別上限はshell raw `20,000 B`、company asset raw `100,000 B`、company asset gzip `15,000 B`。各上限値はPASS、上限+1 BはFAILとし、baseline欠損、0、負数、不正ratio、不明company IDをfail closedにする。

## Presentation parity and Human Review correction

初期のon-demand化では、baseline main buildと新buildの`main`可視テキストをSet A / Set Bの要点／詳細で比較し、asset URL、loading表示、実装用data属性以外の表示契約を維持した。その後のHuman Reviewで、canonical dataを変えずCompare専用projectionだけを修正した。

供給網位置の区切り線は、Relation-backed entryだけが直前の非表示Claimとの隣接selectorへ一致し、Claim-backed entryは一致しないことが不統一の原因だった。Claim / Relationの両方へ`evidence-position-entry`を付け、要点ではborder `1px solid rgb(217, 221, 225)`、margin-top `10px`、padding-top `10px`の同一computed styleを適用する。詳細では既存説明と位置情報の間へ1本だけ置き、二重線を作らない。

Evidence markerの四角は、on-demand分割後にCompany asset route側へ出力されたcomponent-scoped CSSがCompare shellで読み込まれず、ブラウザ既定button外観が露出したことが原因だった。shellが常時読む共通CSSで`appearance: none`、border `0`、transparent backgroundを明示し、通常時とhover時は枠なし、focus-visible時だけ2px outlineを表示する。表示寸法は本文相当の約`18 × 11 px`、透明pseudo-elementの操作面は`44 × 44 px`とし、本文行高を押し広げない。

### Five-company Product summary contract

会社ごとの条件分岐ではなく、5社すべてを1つの検証済みdisplay-copy mapで管理する。mapは5 / 5社、非空title / body / grounding Claim、`summaryVisible=false`、`expandedVisible=true`を必須とし、未知groundingやgeneric fallbackをfail closedにする。

| Company | Expanded title | Expanded body | Grounding Claim |
| --- | --- | --- | --- |
| NVIDIA | 演算とネットワークを横断 | Blackwell GPU、Grace CPU、BlueField DPU、Spectrum-Xネットワークを展開する。 | `nvidia-products` |
| Broadcom | 接続・演算を担う半導体群 | 接続用半導体、カスタムアクセラレータASIC、Ethernetスイッチ用半導体を展開する。 | `broadcom-products` |
| Applied Materials | 材料工程を広くカバー | 材料の堆積、除去、改質、分析、デバイス接続に関わる装置・技術を展開する。 | `applied-products` |
| Lam Research | 成膜・エッチング・洗浄を横断 | 成膜、エッチング、ウェーハ洗浄を中心に、複数の前工程装置を展開する。 | `lam-research-products` |
| Tokyo Electron | 前工程の主要工程を幅広くカバー | 塗布・現像、エッチング、成膜、洗浄の各工程に対応する装置を展開する。 | `tokyo-electron-products` |

要点では5社とも製品群title / body、説明、metadataを表示せず、`事実`、製品名、必要なEvidence markerだけを表示する。詳細では上表の会社別製品群概要を先に表示し、その後に製品名、既存説明、既存metadataを表示する。item-level Relationがある4社は各製品entryのmarkerを維持する。group-level Claimだけを持つTokyo Electronでは、4つの製品entryが同じ`tokyo-electron-products` grounding Claimを共有し、製品名の直後から既存Evidence `[8]`を開く。詳細では製品群概要末尾の既存`[8]`も維持する。共通entryは`pilot-claim-list`、`claim-statement-list`、inline markerという同じDOM階層を使用し、会社別のmarker座標やCSS例外を置かない。`製品構成`、`下記の製品カテゴリを提供する。`、重複する`主な製品`、`以下の製品を提供する。`は5社の製品本文へ出力しない。

ChromeでSet A / Set Bを`1024`、`390`、`360` pxの要点／詳細で確認し、document overflow `0`、console error `0`、要点の製品説明・metadata `0`、詳細の製品説明Set A `6` / Set B `9`を確認した。drawer、Primary Source、Escape、focus return、URL reload / Back / Forwardを維持し、要点／詳細切替でCompany asset集合は変化しない。

- Rendered marker: Summary Set A `16` / Set B `23`; Expanded Set A `21` / Set B `36`; five-company Expanded total `57`
- Unique grounding entry / drawer: `53 / 53`（Tokyo Electronの4製品markerは既存の同一drawerを共有）
- Product description: Summary `0`; Expanded Set A `6` / Set B `9`
- Relation / Binding: `17 / 17`
- Registry Product / Technology / Market: `11 / 8 / 0`
- Projection P1 / P2 / P3: `20 / 14 / 0`
- Financial compatibility ok / caution / blocked: `0 / 2 / 2`

## Build and search

5 company asset route追加によりAstro routeは`110`から`115`へ増える。追加routeは上記5件だけで、Pagefind対象外とする。Pagefindは`105 pages / 5,791 words`を維持する。

同じfinal treeからbuildを2回実行し、shellと5 company assetsのbyte equalityを確認する。既存Company Evidence、Freeze、Coverage、Triage、Financial、Relation、Registry、Projectionおよびprotected semantic diffのgateをすべて通過した場合だけDraft PRを作成する。
