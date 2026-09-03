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
| Shell | 7,431 B | 2,168 B |
| NVIDIA | 55,330 B | 5,389 B |
| Broadcom | 62,875 B | 5,227 B |
| Applied Materials | 56,038 B | 5,693 B |
| Lam Research | 83,452 B | 6,375 B |
| Tokyo Electron | 49,812 B | 5,522 B |

転送単位ごとのgzip値を合算すると、Set A cold loadはraw `125,636 B` / gzip `12,784 B`、Set Bはraw `196,733 B` / gzip `19,758 B`。1～4社の全30組合せで最大はNVIDIA / Broadcom / Applied Materials / Lam Researchのraw `265,126 B`であり、`330,509 B`以下である。

個別上限はshell raw `20,000 B`、company asset raw `100,000 B`、company asset gzip `15,000 B`。各上限値はPASS、上限+1 BはFAILとし、baseline欠損、0、負数、不正ratio、不明company IDをfail closedにする。

## Presentation parity

baseline main buildと新buildの`main`可視テキストを、Set A / Set Bの要点／詳細の4状態で比較し、全状態で完全一致した。内部asset URL、loading表示、実装用data属性以外の表示契約は変更しない。

- Marker: Summary Set A `16` / Set B `20`; Expanded Set A `21` / Set B `32`; total `53`
- Product description: Summary `0`; Expanded Set A `6` / Set B `9`
- Relation / Binding: `17 / 17`
- Registry Product / Technology / Market: `11 / 8 / 0`
- Projection P1 / P2 / P3: `20 / 14 / 0`
- Financial compatibility ok / caution / blocked: `0 / 2 / 2`

## Build and search

5 company asset route追加によりAstro routeは`110`から`115`へ増える。追加routeは上記5件だけで、Pagefind対象外とする。Pagefindは`105 pages / 5,791 words`を維持する。

同じfinal treeからbuildを2回実行し、shellと5 company assetsのbyte equalityを確認する。既存Company Evidence、Freeze、Coverage、Triage、Financial、Relation、Registry、Projectionおよびprotected semantic diffのgateをすべて通過した場合だけDraft PRを作成する。
