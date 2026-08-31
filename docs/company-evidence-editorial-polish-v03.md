# Company Evidence Pilot Editorial Polish v0.3

## Scope

- 対象: NVIDIA / TSMC / Applied Materials / Fujikura / Vertiv
- Before: PR #106 merge後 `545b8b04516917f69013e35cd49d377c2b32c58c` の公開Pages
- After: 本変更のproduction build
- viewport: desktop 1280 × 900 / mobile 360 × 800
- semantic diff: **0**

Claim、Evidence Binding、Source Registry / Policy、Schema、Priority、Status、company / competitor / financial dataは変更していない。Human Test、Freeze、100社展開には進んでいない。

## Editorial changes

- `企業リサーチ / 投資要点` を `企業リサーチ` に統合
- `参考文献 / 出典` を `出典` に統合
- heroのUIラベルを `企業の核心` から `概要` へ変更。claim title / statementは変更なし
- 本文のclaim-typeラベル反復を除き、Atlas analysisは細い左罫線で区別。claimTypeとEvidence詳細内の種別表示は維持
- mobileの主要財務・業種固有KPIを常時2列表示に変更し、基準日・定義・一次資料はDisclosureへ移動
- 収録状況を本文から外し、ページ末尾の `データ品質・収録状況` Disclosureへ集約
- Sourcesを `[番号] Publisher — Title` のbibliographyへ簡素化
- hero tagsをmuted linkとし、通常時のunderlineを除去。hover / focus時のみリンク表現を明示
- 数値へtabular-numsを適用し、KPI valueを右揃え
- major section以外のhorizontal ruleを削減

## Measurement definitions

- Visible headings: 開いている表示領域内の `h1`–`h4`、section classification、hero kicker。closed details / dialog内は除外
- Horizontal rules: hero、major section、summary、source、financial、table containerの指定構造要素に実際に表示される上罫線または下罫線の数。table cell罫線は除外
- Repeated claim-type labels: 本文に表示される `.claim-kind` 数
- Mobile horizontal scroll regions: 360pxで表示中かつ実際に `scrollWidth > clientWidth` となる `overflow-x: auto / scroll` 要素数
- KPI horizontal scroll: 主要財務briefと業種固有KPIの実overflow数
- Visible source metadata rows: bibliographyの公開日、書誌metadata行、その他Source取得日で常時表示される行数
- Document height: `document.documentElement.scrollHeight`

## Desktop Before / After

| Company | Visible headings | Horizontal rules | Claim-type labels | Source metadata rows | Document height |
|---|---:|---:|---:|---:|---:|
| NVIDIA | 17 → 15 | 24 → 8 | 3 → 0 | 5 → 0 | 2663 → 2252 px |
| TSMC | 19 → 17 | 26 → 10 | 3 → 0 | 4 → 0 | 3393 → 3007 px |
| Applied Materials | 16 → 14 | 20 → 7 | 3 → 0 | 3 → 0 | 2403 → 2087 px |
| Fujikura | 19 → 17 | 26 → 10 | 3 → 0 | 4 → 0 | 2841 → 2464 px |
| Vertiv | 17 → 15 | 22 → 8 | 3 → 0 | 3 → 0 | 2498 → 2198 px |

desktop平均はvisible headings 17.6→15.6、horizontal rules 23.6→8.6（約63.6%減）、document height 2760→2402px（約13.0%減）。

## Mobile Before / After

| Company | Visible headings | Horizontal rules | Claim-type labels | Horizontal scroll regions | KPI scroll | Source metadata rows | Document height |
|---|---:|---:|---:|---:|---:|---:|---:|
| NVIDIA | 17 → 15 | 25 → 8 | 3 → 0 | 3 → 1 | 2 → 0 | 5 → 0 | 3286 → 2733 px |
| TSMC | 19 → 17 | 27 → 10 | 3 → 0 | 4 → 2 | 2 → 0 | 4 → 0 | 3982 → 3416 px |
| Applied Materials | 16 → 14 | 21 → 7 | 3 → 0 | 2 → 1 | 1 → 0 | 3 → 0 | 2750 → 2382 px |
| Fujikura | 19 → 17 | 27 → 10 | 3 → 0 | 4 → 2 | 2 → 0 | 4 → 0 | 3324 → 2842 px |
| Vertiv | 17 → 15 | 23 → 8 | 3 → 0 | 3 → 1 | 2 → 0 | 3 → 0 | 2928 → 2535 px |

mobile平均はhorizontal rules 24.6→8.6（約65.0%減）、document height 3254→2782px（約14.5%減）。Afterで残るhorizontal scrollはFinancialChart carouselと、拠点表があるTSMC / Fujikuraのfacility tableのみ。主要財務briefと業種固有KPIは全社0。

## Interaction and responsive QA

- 360px document-level horizontal overflow: 5社すべて0
- 360px KPI horizontal scrollbar: 5社すべて0
- visible Evidence controls: 5社すべて5、全Evidence binding / marker総数は変更なし
- Evidence marker → drawer → primary source CTA: 5社すべてPASS
- Evidence / visible Disclosure touch target: 最小44 × 44px
- drawer open後のclose focus: PASS
- Escape close / triggerへのfocus return: PASS
- Sourcesの常時表示metadata: 0。主要bibliographyは5 / 4 / 3 / 4 / 3件を簡潔表示
- source-quality Disclosure: 初期状態closed、ページ末尾

## Semantic diff

- `src/data/**`: 変更なし
- `src/content/**`: 変更なし
- Schema / Source Policy / Priority / Status: 変更なし
- Claim title / statement / claimType / evidenceIds: 公開BeforeとローカルAfterで5社全件一致
- Evidence marker ID / accessible label: 5社全件一致
- unique Source URL set: 5社全件一致
- full financial audit row text: 5社全件一致
- hero tag label / filter value: 5社全件一致
- 非Pilot AMDのsection IDs、headings、financial audit、本文text: 公開Beforeと一致

**Semantic diff: 0**
