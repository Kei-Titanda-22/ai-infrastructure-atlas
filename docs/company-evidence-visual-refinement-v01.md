# Company Evidence v0.2 Visual Refinement v0.1

## Scope and status

- Scope: NVIDIA, TSMC, Applied Materials, Fujikura, Vertiv の公開 Company Evidence v0.2 ページのみ
- Measurement date: 2026-08-31
- Before: `2179e68fa93be930f7588f0012497abd619b4180` の公開 Pages
- After: 本変更のローカル production build
- Human Test executed: **NO**
- Ready for Freeze: **NO**

Claim、Evidence Binding、Source Registry、P1/P2/P3、Schema、内部状態、企業・財務・競合データには変更を加えていない。

## Visual decisions

- hero は企業名、短い P1 descriptor、基本属性、技術タグに整理した。
- 4つの要約を角丸カードから罫線とタイポグラフィ中心のリサーチレイアウトへ変更した。
- Fact の可視ラベルを外し、Company View と Atlas Analysis に相当するラベルだけを小さなテキストとして残した。
- Evidence pill を脚注型の Source 番号 marker に置換した。marker は button のまま、44px以上の操作領域、accessible name、focus表示、`aria-controls`、`aria-expanded` を持つ。
- drawer の初期画面は Source番号、publisher、title、公開日、一次資料CTAに限定した。検証状態、鮮度、優先度、locator、取得日は「詳細情報」に収めた。
- 出典を常時見える番号付き bibliography に変更し、未使用の登録Sourceだけを折りたたんだ。
- mobile ではカード、pill、過剰padding、可視スクロールバーを抑え、表の横スクロール領域は維持した。

## Measurement definitions

- Visible card: Pilot summary/claim/coverage/source containerのうち、表示中で4px以上の角丸とborderを併用する要素。
- Visible pill badge: Claim種別またはEvidence controlのうち、表示中で10px以上の角丸または塗り背景を持つ要素。
- Evidence controls: 表示中の `[data-evidence-open]`。
- Source cards `default / drawer`: 通常表示時 / 最初のEvidenceを開いた時の角丸source card数。
- Bibliography entries: 通常表示時に可視の番号付きSource項目数。
- Main sections: 表示中の `.company-section` 数。
- First-screen elements: hero、page TOC、section heading、summary unit、claim label、Evidence controlのうちviewport内に交差する要素数。

## Before / After — desktop 1280 × 900

| Company | Cards | Pills | Evidence controls | Source cards default / drawer | Bibliography entries | Main sections | First-screen elements |
|---|---:|---:|---:|---:|---:|---:|---:|
| NVIDIA | 15 → 0 | 14 → 0 | 7 → 7 | 0 / 1 → 0 / 0 | 0 → 5 | 8 → 8 | 25 → 25 |
| TSMC | 16 → 0 | 16 → 0 | 8 → 8 | 0 / 1 → 0 / 0 | 0 → 4 | 7 → 7 | 25 → 25 |
| Applied Materials | 16 → 0 | 16 → 0 | 8 → 8 | 0 / 1 → 0 / 0 | 0 → 3 | 7 → 7 | 25 → 25 |
| Fujikura | 15 → 0 | 14 → 0 | 7 → 7 | 0 / 1 → 0 / 0 | 0 → 4 | 7 → 7 | 25 → 25 |
| Vertiv | 16 → 0 | 16 → 0 | 8 → 8 | 0 / 1 → 0 / 0 | 0 → 3 | 7 → 7 | 25 → 25 |

## Before / After — mobile 360 × 800

| Company | Cards | Pills | Evidence controls | Source cards default / drawer | Bibliography entries | Main sections | First-screen elements |
|---|---:|---:|---:|---:|---:|---:|---:|
| NVIDIA | 15 → 0 | 14 → 0 | 7 → 7 | 0 / 1 → 0 / 0 | 0 → 5 | 8 → 8 | 15 → 17 |
| TSMC | 16 → 0 | 16 → 0 | 8 → 8 | 0 / 1 → 0 / 0 | 0 → 4 | 7 → 7 | 15 → 17 |
| Applied Materials | 16 → 0 | 16 → 0 | 8 → 8 | 0 / 1 → 0 / 0 | 0 → 3 | 7 → 7 | 15 → 17 |
| Fujikura | 15 → 0 | 14 → 0 | 7 → 7 | 0 / 1 → 0 / 0 | 0 → 4 | 7 → 7 | 15 → 17 |
| Vertiv | 16 → 0 | 16 → 0 | 8 → 8 | 0 / 1 → 0 / 0 | 0 → 3 | 7 → 7 | 15 → 17 |

mobile first-screenの要素数が2増えたのは、P1由来の企業descriptorと、カード余白を圧縮してviewport内に入るリサーチ本文が増えたためである。可視カードとpillはともに0で、UI chromeの密度増加ではない。全ページでdocument-levelの横溢れは検出されなかった。

## AI-dashboard appearance removal count

カード、pill、drawer内source cardを「AI-dashboard appearance element」として数えた。desktop/mobileで同一構造を二重計上しない。

| Company | Removed |
|---|---:|
| NVIDIA | 30 |
| TSMC | 33 |
| Applied Materials | 33 |
| Fujikura | 30 |
| Vertiv | 33 |
| **Total** | **159** |

Evidence control自体は削除せず、38個すべてをpillから脚注型markerへ変換した。

## Browser QA

5社それぞれを1280 × 900と360 × 800で確認した。

- visual hierarchy、section rule、spacing、card/pill削減、hero descriptor: PASS
- Fact可視ラベル 0、Company View / Atlas Analysis相当の区別: PASS
- Evidence markerのaccessible name、focus、44px以上のtouch target、Source番号整合: PASS（38 / 38）
- 1クリック目でdrawer、drawer初期画面のCTAを2クリック目として一次資料へ到達可能: PASS
- drawer詳細の初期折りたたみ、Escape close、triggerへのfocus復帰: PASS
- bibliography、公開日不明表示、未使用Sourceの折りたたみ: PASS
- 財務・KPI表と拠点表の既存内容、横スクロール領域: PASS
- document-level horizontal overflow: なし

## Semantic diff

- `src/data/**`: 変更なし
- `src/content/**`: 変更なし
- Company Evidence v0.2 Schema / UX spec / Source Policy: 変更なし
- Claim title / statement / claimType / priority / verificationStatus / evidenceIds: 変更なし
- Evidence locator / Source record / financial / competitor / company data: 変更なし

**Semantic diff: 0**
