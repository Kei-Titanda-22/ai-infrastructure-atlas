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

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- normalized financial history: **47 periods / 17 companies**
- multi-period financial-history companies: **15**
- verified normalized historical metrics: **203**
- periods with both FCF and Capex: **31**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **4**
- v0.4 pending source policies: **4**
- earnings update ledger: **47 normalized records / 17 companies**
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.4 current implementation

時系列財務は `src/data/financial-history.json` と監査バッチファイルを `src/lib/financial-history.ts` で統合した配列を正規化履歴の正本として扱う。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

初期14期間から22期間へ拡張した後、装置・半導体バッチとしてApplied Materials、Lam Research、KLA、Advantest、DISCO、Broadcomの16期間を追加した。さらにCompute / Network / Data CenterバッチとしてAMD、Intel、Arista Networks、Vertivの9期間を追加し、現在47期間 / 17社となった。

AMDはQ2 2025 / Q1 2026 / Q2 2026の3四半期を収録し、会社開示Non-GAAP FCFとproperty/equipment purchasesをbasis付きで保持する。IntelはQ2 2025 / Q2 2026、AristaはQ2 2025 / Q2 2026を収録するが、公式Q2資料のCF表が6か月累計のため単四半期FCF/Capexを推定せず未収録にする。VertivはQ2 2025 / Q2 2026を収録し、会社開示Adjusted FCFがOperating Cash Flow − Capital Expenditures − Investments in Capitalized Softwareであることをbasisへ明記し、Capex単体との定義差を残す。

この4社については汎用IRページだけでなく、`src/data/document-sources-v04.json` に2026年決算文書そのものを4件登録した。同時に `src/data/document-source-policies-v04.json` を追加し、全件を `pending / automatedRetrieval=unknown / manual-reference-only-until-reviewed` として扱う。利用条件未審査のため自動取得・再配布・商用利用可能とは推定しない。validatorは文書SourceとPolicyの1対1対応、pending状態、automatedRetrievalがunknownであることまで検査する。

FCF / Capexは定義確認済み期間だけ実データ化する。NVIDIA通期3年、ASML 5四半期、Micron Q3 FY2026、Lam Research、KLA、Applied Materials、Broadcom、TSMC 3四半期、キオクシア FY2027 Q1、東京エレクトロン FY2027 Q1、AMD 3四半期、Vertiv 2四半期が収録済み。会社間の定義差は `basis` に残し、比較時に同一定義とみなさない。

既存period record自体を直接上書きせず、`src/data/financial-history-v04-cashflow-overrides.json` を監査済み差分層として使用する。`src/lib/financial-history.ts` はrecord id単位でFCF / Capexだけを上書きする。validatorも同じoverrideを適用し、overrideがFCF / Capex以外を変更しないこと、対象recordが存在すること、FCF算式とCapex入力が一致することを検査する。

`/financials/` は17社を企業切替対象とし、四半期・通期を分離した自前SVG推移図と、一次資料・会計基準・検証状態付き決算表を表示する。FCF / Capexが存在する企業では追加グラフを表示し、負のFCFにも対応する。

`/financials/updates/` は正規化履歴から直接生成する決算更新台帳。現在47レコード / 17社を、1行「1企業 × 1決算期間 × 1一次資料」として表示する。検証日、企業、期間、検証済み指標、一次資料、状態を持ち、企業と四半期/通期で絞り込みできる。

履歴収録済み17社の個社ページでは財務セクションから決算履歴へ直接移動できる。企業比較画面でも履歴収録済み企業の列見出しから決算履歴へ移動できる。

企業比較本体もv0.4正規化履歴を消費する。v0.3の `?ids=` 比較URL契約は維持しつつ、比較表末尾へ「決算時系列（v0.4 正規化）」を追加する。選択企業ごとの最新収録期間と、売上高・営業利益・営業利益率・FCF・設備投資を表示する。金額は報告通貨・単位が異なれば比較不能、四半期/通期が混在すれば比較不能、FCF/設備投資はbasis定義が異なれば比較不能とする。会計基準や最新収録期間の差は条件注意として残し、各セルから一次資料と全履歴へ遷移できる。

`scripts/validate-v04.py` はbase / batch2 / batch3 / cash-flow overrideを結合したうえで、Source/company対応、ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt、営業利益率再計算、Capex符号、Atlas算出FCFの入力値・算式、既存監査済み企業の移行漏れ、新v0.4文書Source/Policy対応を検査する。現在の回帰下限は47期間 / 17社 / 複数期間企業15社 / 203検証済み指標 / FCF+Capex 31期間。

Run #127では `v0.4 financial-history validation OK: 47 periods / 17 companies / 15 multi-period companies / 203 verified metrics / 31 FCF+Capex periods / 5 cash-flow overrides / 4 v0.4 document sources+policies` を確認した。Astroは**110ページ**、Pagefindは**106ページ / 2,766語**を生成し、GitHub Pages deployは `Reported success!`。配布artifactでも `/financials/` にAMD / Intel / Arista / Vertivと17社・47期間の表示、`/financials/updates/` に新9レコードと4つの決算Source、`/compare/` に新4社の正規化履歴・一次資料URLを確認した。AMD / Intel / Arista / Vertivの個社生成HTMLも履歴対象IDと実行時導線を持ち、financials / updates / compareの生成済みインラインJavaScript **7本**を `node --check` で構文確認した。

## Remaining v0.4 work

1. Memory / Network / Data Center側の追加主要企業へ時系列履歴を拡張する
2. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する
3. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
