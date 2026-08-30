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
- [x] v0.4 core equipment / semiconductor history batch deployed — Run #118
- [x] v0.4 TSMC / Kioxia / Tokyo Electron cash-flow completion deployed — Run #121
- [x] v0.4 earnings update ledger deployed — Run #124
- [x] v0.4 Compute / Network / Data Center history batch deployed — Run #127
- [x] v0.4 Kioxia continuous history + map/chart legibility update deployed — Run #131
- [x] v0.4 Tokyo Electron continuous history deployed — Run #132
- [x] v0.4 Samsung / Marvell / Credo history batch deployed — Run #134

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- normalized financial history: **79 periods / 23 companies**
- multi-period financial-history companies: **23 / 23 covered companies**
- verified normalized historical metrics: **343**
- periods with both FCF and Capex: **53**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **20**
- v0.4 pending source policies: **20**
- earnings update ledger: **79 normalized records / 23 companies**
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.4 current implementation

時系列財務は `src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch7.json`、監査済みcash-flow overrideを `src/lib/financial-history.ts` で統合した配列を正規化履歴として扱う。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

現在の履歴対象は23社・79期間で、23社すべてが2期間以上を持つ。従来の20社にSamsung Electronics、Marvell、Credoを追加した。SamsungはQ1/Q2 2026、MarvellはQ2 FY2026/Q2 FY2027、CredoはQ4 FY2025/Q4 FY2026とFY2025/FY2026通期を収録する。Credo通期はSEC 10-Kの営業活動CFとproperty and equipment取得支出からAtlas定義FCFを再計算した。Samsung / Marvell / Credoの未確認単四半期FCF / Capexは推定で補っていない。

キオクシアはFY2026 Q1 / Q2 / Q3 / Q4とFY2027 Q1の5四半期、FY2025 / FY2026の2通期を収録する。Q2〜Q4は公式決算短信の累計値を差分で単四半期化し、会社開示の四半期表示とも照合した。営業CFと有形・無形資産取得支出から各期間FCF / Capexを算出し、FY2027 Q1の既存overrideを含め計7期間を検証済みとする。

東京エレクトロンもFY2026 Q1 / Q2 / Q3 / Q4とFY2027 Q1の5四半期、FY2025 / FY2026の2通期を収録する。Q2〜Q4は累計値の差分から単四半期化した。TELのCapex定義は既存FY2027 Q1と揃え、`有形固定資産の取得による現金支出` のみを採用し、FCFは `営業活動CF − 同Capex` とする。無形資産取得支出を途中から混在させない。

FCF / Capexは定義確認済み期間だけ実データ化する。会社間の定義差は `basis` に保持し、比較時に同一定義とみなさない。既存period recordの補完には `src/data/financial-history-v04-cashflow-overrides.json` を監査済み差分層として使い、overrideはFCF / Capex以外を変更できないようvalidatorで制限する。

`/financials/` は23社を企業切替対象とし、四半期・通期を分離した自前SVG推移図と、一次資料・会計基準・検証状態付き決算表を表示する。FCF / Capexが存在する企業では追加グラフを表示し、負のFCFにも対応する。期間ラベルは12pxの本文色・太字へ変更済み。

全体マップの工程別縦カラーラインは4pxから6pxへ太くし、工程色の彩度を一段引き上げた。情報密度や研究DB調の構造は変更せず、工程の視覚的な識別だけを強めている。

`/financials/updates/` は正規化履歴から直接生成する決算更新台帳。現在79レコード / 23社を、1行「1企業 × 1決算期間 × 1一次資料」として表示する。検証日、企業、期間、検証済み指標、一次資料、状態を持ち、企業と四半期/通期で絞り込みできる。

履歴収録済み23社の個社ページでは財務セクションから決算履歴へ直接移動できる。企業比較画面もv0.4正規化履歴を消費し、v0.3の `?ids=` 比較URL契約を維持したまま、最新収録期の売上高・営業利益・営業利益率・FCF・設備投資を表示する。金額の報告通貨・単位、四半期/通期、FCF/Capex basisが揃わない場合は比較不能または条件注意を明示する。

`scripts/validate-v04.py` はbase / batch2〜batch7 / cash-flow overrideを結合し、Source/company対応、ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt、営業利益率再計算、Capex符号、Atlas算出FCFの入力値・算式、v0.4文書Source/Policy対応を検査する。さらにキオクシア・東京エレクトロンの連続性と、Samsung / Marvell / Credoの最低収録数を個別ゲートで保持する。

Run #134では `v0.4 financial-history validation OK: 79 periods / 23 companies / 23 multi-period companies / 343 verified metrics / 53 FCF+Capex periods / 5 cash-flow overrides / 20 v0.4 document sources+policies` を確認した。Astroは**109ページ**、Pagefindは**105ページ / 2,720語**を生成し、GitHub Pages deployまで成功した。

## Remaining v0.4 work

1. 正規化履歴カバレッジを現在の23社から100社DB内の次の主要企業群へ拡張する
2. Western Digital等、ストレージ・光通信・データセンター電力企業を優先して追加する
3. 既存23社について必要に応じて四半期の連続性をさらに伸ばす
4. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する
5. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
