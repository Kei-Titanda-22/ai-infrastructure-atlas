# Company Evidence v0.2 Visual Refinement v0.2

## Scope

- 対象: NVIDIA / TSMC / Applied Materials / Fujikura / Vertiv
- Before: `c679b1b53142faabb868b30d17ea308812e9a801` の公開 Pages
- After: 本変更の production build
- viewport: desktop 1280 × 900 / mobile 360 × 800
- semantic diff: **0**

Claim、Evidence Binding、Source Registry / Policy、P1/P2/P3、Schema、verification / missing status、company / competitor / financial dataは変更していない。

## Information hierarchy

1. heroにP1の「何の会社か」を本文と脚注Evidence付きで配置
2. 本文先頭を「AIインフラでの位置 → 競争優位 → 主要製品・技術」に再編
3. P2/P3の製品・競争・リスクを「補足リサーチ」へ統合
4. 財務・KPIは既存共通FinancialChart 2点と3列の小表を主表示にし、6列audit表とROIC計算を詳細へ移動
5. 収録状況をSourcesへ統合し、文献一覧をdesktop 2列 / mobile 1列に整理

補足・audit・ROIC・収録状況は削除せず、初期状態を折りたたみにした。Evidence markerはSource番号、accessible name、44px以上の操作領域、focus、2-click source contractを維持する。

## Measurement definitions

- First-screen core answers: viewportと交差するheroの企業核心と、AIインフラ位置・競争優位・主要製品の要約ブロック数。
- First-screen research characters: h1、企業核心、3つの要約に含まれ、viewportと交差する見出し・本文の空白除外文字数。
- First-screen Evidence controls: viewportと交差するEvidence marker数。
- Section count: 表示中の `.company-section` 数。
- Visible Evidence controls: ページに表示される `[data-evidence-open]` 数。
- Mobile scroll burden: `documentHeight / 800`。値は800px viewport何画面分かを示す。
- Card count: 4px以上の角丸とborderを併用するPilot summary / claim / source / finance container数。
- Badge count: 10px以上の角丸または塗り背景を持つclaim / Evidence / metric status要素数。

## Desktop Before / After

| Company | First-screen core | First-screen chars | Sections | Evidence controls | Scroll screens | Cards | Badges |
|---|---:|---:|---:|---:|---:|---:|---:|
| NVIDIA | 4 → 4 | 544 → 505 | 8 → 3 | 7 → 7 | 4.63 → 2.96 | 0 → 0 | 0 → 0 |
| TSMC | 4 → 4 | 553 → 520 | 7 → 4 | 8 → 8 | 4.57 → 3.77 | 0 → 0 | 0 → 0 |
| Applied Materials | 4 → 4 | 520 → 493 | 7 → 3 | 8 → 8 | 3.71 → 2.67 | 0 → 0 | 0 → 0 |
| Fujikura | 4 → 4 | 470 → 442 | 7 → 4 | 7 → 7 | 4.06 → 3.16 | 0 → 0 | 0 → 0 |
| Vertiv | 4 → 4 | 620 → 578 | 7 → 3 | 8 → 8 | 3.88 → 2.78 | 0 → 0 | 0 → 0 |

desktopでは核心4回答をfirst screenに維持したまま、重複していた「何の会社か」をheroへ移し、初期画面の文量を約5–7%圧縮した。平均document heightは3754pxから2760pxへ約26.5%減少した。

## Mobile Before / After

| Company | First-screen core | First-screen chars | First-screen Evidence | Sections | Evidence controls | Scroll screens | Cards | Badges |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| NVIDIA | 2 → 2 | 268 → 310 | 2 → 3 | 8 → 3 | 7 → 7 | 5.60 → 4.11 | 0 → 0 | 0 → 0 |
| TSMC | 2 → 2 | 228 → 284 | 2 → 3 | 7 → 4 | 8 → 8 | 5.62 → 4.98 | 0 → 0 | 0 → 0 |
| Applied Materials | 2 → 2 | 258 → 315 | 2 → 3 | 7 → 3 | 8 → 8 | 4.48 → 3.44 | 0 → 0 | 0 → 0 |
| Fujikura | 2 → 3 | 301 → 277 | 2 → 3 | 7 → 4 | 7 → 7 | 4.86 → 4.16 | 0 → 0 | 0 → 0 |
| Vertiv | 2 → 3 | 380 → 342 | 2 → 3 | 7 → 3 | 8 → 8 | 4.68 → 3.66 | 0 → 0 | 0 → 0 |

mobileでは企業核心をhero内で読み切れるようにし、First-screen Evidenceは全社2→3となった。Fujikura / Vertivはfirst-screen coreも2→3へ増えた。平均scroll burdenは5.05画面から4.07画面へ約19.4%減少した。

## Structural and interaction QA

- Claim / Evidence marker: NVIDIA 7 / 7、TSMC 8 / 8、Applied Materials 8 / 8、Fujikura 7 / 7、Vertiv 8 / 8
- FinancialChart: 各社2グラフ、各グラフ2–3期間
- Compact financial table: 各社6行
- Research order: 全社 `AIインフラでの位置 → 競争優位 → 主要製品・技術`
- Supplement / financial audit / source quality: 初期状態closed
- Evidence marker → drawer → primary source CTA: PASS
- accessible name / Source番号解決 / 44px touch target / Escape / focus return: PASS
- document-level horizontal overflow: なし
- gradient / shadow / large rounded card: 0

## Semantic diff

- `src/data/**`: 変更なし
- `src/content/**`: 変更なし
- Schema / UX spec / Source Policy: 変更なし
- Claim title / statement / claimType / priority / verificationStatus / evidenceIds: 変更なし
- Evidence locator / Source record / financial / competitor / company data: 変更なし
- 公開BeforeとローカルAfterのclaim title+statement、bibliography URL、6行financial audit textを5社別に比較: 全件一致
- 非Pilot AMDのsection ID、financial audit text、Pilot固有要素数を公開Beforeと比較: 一致

**Semantic diff: 0**
