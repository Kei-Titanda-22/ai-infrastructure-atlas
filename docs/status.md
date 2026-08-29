# AI Infrastructure Atlas Status — 2026-08-30

## Release phase

- **v0.1 — Complete**: 20社・静的データ・公開URL
- **v0.2 — Complete**: 100社・セクターマップ
- **v0.3 — Complete**: 企業比較の本格化
- **v0.4 — In progress**: 決算データの時系列化
- v0.5 — 許可済みSourceのみ自動更新
- v1.0 — AI Infrastructure Atlas

## Delivery status

- [x] Public GitHub repository
- [x] GitHub Pages + GitHub Actions deployment
- [x] Live browser URL: https://kei-titanda-22.github.io/ai-infrastructure-atlas/
- [x] Constitutional validation / v0.2 baseline / v0.3 comparison validation / Astro build / Pagefind / deployment verified in CI
- [x] v0.4 initial financial-history migration deployed — Run #112
- [x] v0.4 expanded financial history / FCF / Capex deployed — Run #113
- [x] v0.4 normalized financial history connected to comparison — Run #115

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- normalized financial history: **22 periods / 7 companies**
- multi-period financial-history companies: **5**
- verified normalized historical metrics: **84**
- periods with both FCF and Capex: **9**
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.4 current implementation

`src/data/financial-history.json` を時系列財務の正本として運用している。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

初期14期間から22期間へ拡張した。NVIDIAはFY2024〜FY2026の通期とQ2 FY2026〜Q2 FY2027の四半期、TSMCはQ2 2025 / Q1 2026 / Q2 2026、SK hynixとMicronは複数四半期、ASMLはQ2 2025〜Q2 2026の5四半期を収録している。キオクシア、東京エレクトロンも既存監査済み期間を保持する。

FCF / Capexは定義確認済み期間だけ実データ化した。NVIDIA通期3年は一次キャッシュフロー計算書の営業活動CFとproperty/equipment/intangible assetsの現金支出からAtlas定義FCFを再計算し、ASMLは会社開示Non-GAAP FCFと対応する設備・無形資産支出、Micron Q3 FY2026は会社開示adjusted FCFとcapital expenditures, netをbasis付きで保持する。会社間で定義が異なるため同一指標名だけで機械的に比較可能とは扱わない。

`/financials/` は企業を切り替え、四半期・通期を分離した自前SVG推移図と、一次資料・会計基準・検証状態付き決算表を表示する。FCF / Capexが存在する企業では追加グラフを表示し、負のFCFにも対応する。

履歴収録済み企業の個社ページでは財務セクションから決算履歴へ直接移動できる。企業比較画面でも履歴収録済み企業の列見出しから決算履歴へ移動できる。

企業比較本体もv0.4正規化履歴を消費する。v0.3の `?ids=` 比較URL契約は維持しつつ、比較表末尾へ「決算時系列（v0.4 正規化）」を追加する。選択企業ごとの最新収録期間と、売上高・営業利益・営業利益率・FCF・設備投資を表示する。金額は報告通貨・単位が異なれば比較不能、四半期/通期が混在すれば比較不能、FCF/設備投資はbasis定義が異なれば比較不能とする。会計基準や最新収録期間の差は条件注意として残し、各セルから一次資料と全履歴へ遷移できる。

`scripts/validate-v04.py` はSource/company対応、ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt、営業利益率再計算、Capex符号、Atlas算出FCFの入力値・算式、既存監査済み企業の移行漏れを検査する。さらに22期間 / 複数期間企業5社 / 84検証済み指標 / FCF+Capex 9期間を現在の回帰下限として固定した。

Run #115ではvalidator、Astro 108ページ生成、Pagefind 104ページ / 2,590語、Pages deployが成功した。配布artifactの `compare/index.html` にv0.4履歴JSONと比較ブリッジが埋め込まれていることを確認し、生成された3本のインラインJavaScriptも `node --check` で構文確認済み。

## Remaining v0.4 work

1. 7社から主要企業群へ時系列履歴を拡張し、各社で四半期・通期の連続性を高める
2. TSMC・キオクシア・東京エレクトロン等のFCF / Capexを一次資料定義付きで追加する
3. 決算更新履歴を企業・期間・Source単位で体系化する
4. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する
5. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
