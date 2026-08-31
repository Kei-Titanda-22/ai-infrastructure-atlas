# Company Evidence UX / Schema v0.2 Pilot Revision

- 実装日: 2026-08-31
- 対象: NVIDIA / TSMC / Applied Materials / フジクラ / Vertiv
- 判定: **Human-Test-ready = YES / Freeze = NO**
- 範囲外: 100社監査、100社展開、Source Policy承認、実参加者によるHuman Test

## 目的

v0.1の証拠単位と元データを維持しつつ、会社ページを30秒で次の順に把握できる表示へ改める。

1. 何をする会社か
2. AIインフラでの位置
3. 主力製品・技術
4. なぜ競争上重要か

P1を上記の直読面に固定し、P2/P3、Coverage、詳細な来歴、未使用の登録Sourceを段階的に開く構造とした。

## Claim優先度の再分類

| 会社 | P1 | P2 | P3 | 合計 | 競争上のP1 |
|---|---:|---:|---:|---:|---|
| NVIDIA | 5 | 1 | 1 | 7 | あり |
| TSMC | 5 | 3 | 0 | 8 | あり |
| Applied Materials | 5 | 2 | 1 | 8 | あり |
| フジクラ | 5 | 1 | 1 | 7 | あり |
| Vertiv | 5 | 2 | 1 | 8 | あり |
| **合計** | **25** | **9** | **4** | **38** | **5/5社** |

フジクラの独立した編集リスクClaimは、一次資料で直接支えられないため公開Claimから除外した。該当領域の不足はCoverageの「一部収録・非開示」で明示する。元の会社・財務・関係・Sourceレジストリは変更していない。

## Before / After実測

測定条件は、ローカルproduction buildを実ブラウザで表示し、desktopは1280 × 900、mobileは360 × 800とした。各ページを先頭から末尾まで実スクロールした。Beforeはv0.1レビュー時の同条件測定値、Afterはv0.2 buildの値である。

### ページ長

| 会社 | Desktop Before | Desktop After | 差 | Mobile Before | Mobile After | 差 |
|---|---:|---:|---:|---:|---:|---:|
| NVIDIA | 5.2画面 | 4.11画面 | -1.09 | 7.6画面 | 5.37画面 | -2.23 |
| TSMC | 5.1画面 | 4.18画面 | -0.92 | 7.5画面 | 5.55画面 | -1.95 |
| Applied Materials | 4.2画面 | 3.46画面 | -0.74 | 6.3画面 | 4.61画面 | -1.69 |
| フジクラ | 4.7画面 | 3.70画面 | -1.00 | 7.0画面 | 4.90画面 | -2.10 |
| Vertiv | 4.5画面 | 3.62画面 | -0.88 | 6.6画面 | 4.82画面 | -1.78 |

### 情報到達位置

| 会社 | Desktop 製品 Before → After | Desktop 競争 Before → After | Mobile 製品 Before → After | Mobile 競争 Before → After |
|---|---|---|---|---|
| NVIDIA | 1225 → 1089 px | 1696 → 1309 px | 1499 → 1641 px | 2068 → 1846 px |
| TSMC | 1197 → 1112 px | 1720 → 1332 px | 1502 → 1674 px | 2071 → 1879 px |
| Applied Materials | 1197 → 1112 px | 1669 → 1332 px | 1510 → 1696 px | 2032 → 1901 px |
| フジクラ | 1274 → 1089 px | 1717 → 1309 px | 1521 → 1620 px | 2061 → 1826 px |
| Vertiv | 1197 → 1089 px | 1696 → 1309 px | 1496 → 1687 px | 2042 → 1893 px |

Mobileの「製品・技術の詳細」はP2/P3だけを置くため見出し位置がわずかに下がる。一方、主力製品のP1自体はページ上部の「会社・製品・競争力」に移動済みで、最初のEvidence badgeは587–642 pxに現れる。競争上重要なP1も同じ上部要約にあり、独立した「競争ポジション」見出しへの到達は全社で早まった。

### 可視要素の削減

| 指標 | Before | After |
|---|---|---|
| 長い検証状態ラベル | 39件を直接表示 | 0件（短縮表示、正式名称はaccessible nameとdrawer） |
| Evidence badge | 39件 | 38件（誤った編集Claimを1件除外） |
| Coverage | 会社ごと6–7行を分散表示 | 会社ごと4つのsection noticeへ集約、初期状態は行を非表示 |
| Source | 会社ごと4–6 cardを直接表示 | 使用Source 3–5件を1 disclosureに格納、未使用は別の折りたたみ |
| AI Role / Value Chain | 別section | 1つの「AIインフラでの位置」unit |
| Financial / KPI | 別section | 1つの「財務・主要KPI」section |
| Competitors | 独立section | 「競争ポジション」の比較対象へ統合 |

## 情報削減マッピング

| v0.1要素 | 判定 | v0.2実装 | 状態 |
|---|---|---|---|
| 会社level確認状態 | MOVE | Pilot heroから抑制しClaim単位を主表示 | 実装 |
| Overview P1 | KEEP | 何をする会社か | 実装 |
| AI Role P1 | KEEP | AIインフラでの位置 | 実装 |
| Value Chain P1 | MERGE | AI Roleと同じunit | 実装 |
| その他P1 | SHORTEN | 上部4-unitへ集約 | 実装 |
| P2/P3 | COLLAPSE | 詳細を見る | 実装 |
| Claim種別 | SHORTEN | 事実 / 会社見解 / Atlas分析 | 実装 |
| Evidence badge | SHORTEN | 根拠 n · 短縮状態 | 実装 |
| Coverage | MERGE | sectionごとの集約notice | 実装 |
| Facilities | COLLAPSE | Claimまたは拠点recordがある会社のみ | 実装 |
| Financial | KEEP | 財務・主要KPI | 実装 |
| KPI | MERGE | Financial内へ移動 | 実装 |
| Competitors | MOVE | 競争ポジション内の比較対象 | 実装 |
| Risks | KEEP | material Claimがある場合のみ | 実装 |
| 使用Source | COLLAPSE | 目的別groupを1 disclosureへ | 実装 |
| Drawer metadata | COLLAPSE | 基本情報 / 詳細な来歴の2段階 | 実装 |
| legacy narrative | REMOVE | Pilot UIでは二重表示を抑制、dataは保持 | 実装 |

保留・却下は0件。Source Policyの承認と100社展開は本Pilotの情報削減項目ではなく、別gateとして保留する。

## 実ブラウザ確認

| 確認項目 | Desktop 1280 | Mobile 360 |
|---|---|---|
| 5社を先頭から末尾まで通読 | PASS | PASS |
| 4つのP1要約 | PASS | PASS |
| 競争上重要なP1 | 5/5 | 5/5 |
| ページ全体の横overflow | 0 | 0 |
| wide table | 内部scrollに限定 | 内部scrollに限定 |
| page navigator | sidebar | 幅内の横scroll |
| Evidence drawer Source CTA | PASS | 初期viewport内 |
| 閉じるbutton | PASS | 68 × 35 px、改行なし |
| Escapeで閉じる | PASS | PASS |
| triggerへのfocus復帰 | PASS | PASS |
| Coverageのsection集約 | 4 notices × 5社 | 4 notices × 5社 |
| dynamic section | PASS | PASS |

mobile navigatorとglobal navigatorは、それぞれ自分の境界内だけで横scrollする。document全体の横overflowは全5社で0だった。財務表は304 pxの可視領域内に収まり、必要な表だけ760–1330 pxの内部scrollを持つ。

## Source contract v0.2

- `publishedAt`はdateまたは`null`。不明日は推定しない。legacy recordでfield自体がない場合もresolverで`null`へ正規化する。
- `partial`で`missingStatus`を使う場合は`notes`を必須とする。
- freshnessは`src/lib/evidence-freshness.ts`だけで算出する。
- Source shardは`src/data/source-registry-manifest.json`に列挙し、`src/lib/source-registry.ts`から解決する。
- 同一IDの重複はcompanyIdとURLが一致する互換recordだけを許し、manifest後段のmetadataを採用する。矛盾重複はvalidatorで失敗する。
- Source Policyはpendingを維持する。申請、一次資料照合、reviewer承認、approvedBy/approvedAt記録、validator再実行を経るまで承認扱いにしない。
- verified 0件は仕様上有効であり、source-linkedをverifiedへ昇格させない。

## Gate

- Schema / validator / browser QA: 実装済み
- Human test protocol: 空テンプレート作成済み
- Human test実施: **NO**
- Source Policy承認: **NO**
- Human-Test-ready: **YES**
- Freeze: **NO**
- 100社展開: **NO**

次のgateは、テンプレートに沿った実参加者5名のテスト、閾値評価、誤読修正、Source Policy governance reviewである。
