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

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- normalized financial history: **38 periods / 13 companies**
- multi-period financial-history companies: **11**
- verified normalized historical metrics: **166**
- periods with both FCF and Capex: **26**
- audited cash-flow overrides: **5**
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.4 current implementation

時系列財務は `src/data/financial-history.json` と監査バッチファイルを `src/lib/financial-history.ts` で統合した配列を正規化履歴の正本として扱う。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

初期14期間から22期間へ拡張した後、装置・半導体第3バッチとしてApplied Materials、Lam Research、KLA、Advantest、DISCO、Broadcomの16期間を追加し、38期間 / 13社へ拡張した。Lamは四半期3期間と通期2期間、Broadcomは四半期3期間、Applied Materials・KLA・Advantest・DISCOは各2期間を収録している。

FCF / Capexは定義確認済み期間だけ実データ化する。NVIDIA通期3年、ASML 5四半期、Micron Q3 FY2026、Lam Research、KLA、Applied Materials、Broadcomに加え、TSMC 3四半期、キオクシア FY2027 Q1、東京エレクトロン FY2027 Q1も一次資料から監査済みとなった。

TSMCは会社開示のOperating Cash Flow / Capital Expenditures / Free Cash Flowをそのまま正規化する。キオクシアは営業活動CFから有形固定資産と無形資産の取得による現金支出を控除し、東京エレクトロンは営業活動CFから有形固定資産取得支出を控除してAtlas FCFを算出する。会社間の定義差は `basis` に残し、比較時に同一定義とみなさない。

既存period record自体を直接上書きせず、`src/data/financial-history-v04-cashflow-overrides.json` を監査済み差分層として追加した。`src/lib/financial-history.ts` はrecord id単位でFCF / Capexだけを上書きする。validatorも同じoverrideを適用し、overrideがFCF / Capex以外を変更しないこと、対象recordが存在すること、FCF算式とCapex入力が一致することを検査する。

`/financials/` は13社を企業切替対象とし、四半期・通期を分離した自前SVG推移図と、一次資料・会計基準・検証状態付き決算表を表示する。FCF / Capexが存在する企業では追加グラフを表示し、負のFCFにも対応する。

履歴収録済み13社の個社ページでは財務セクションから決算履歴へ直接移動できる。企業比較画面でも履歴収録済み企業の列見出しから決算履歴へ移動できる。

企業比較本体もv0.4正規化履歴を消費する。v0.3の `?ids=` 比較URL契約は維持しつつ、比較表末尾へ「決算時系列（v0.4 正規化）」を追加する。選択企業ごとの最新収録期間と、売上高・営業利益・営業利益率・FCF・設備投資を表示する。金額は報告通貨・単位が異なれば比較不能、四半期/通期が混在すれば比較不能、FCF/設備投資はbasis定義が異なれば比較不能とする。会計基準や最新収録期間の差は条件注意として残し、各セルから一次資料と全履歴へ遷移できる。

`scripts/validate-v04.py` は複数履歴バッチとcash-flow overrideを結合したうえで、Source/company対応、ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt、営業利益率再計算、Capex符号、Atlas算出FCFの入力値・算式、既存監査済み企業の移行漏れを検査する。現在の回帰下限は38期間 / 13社 / 複数期間企業11社 / 166検証済み指標 / FCF+Capex 26期間。

Run #121では `v0.4 financial-history validation OK: 38 periods / 13 companies / 11 multi-period companies / 166 verified metrics / 26 FCF+Capex periods / 5 cash-flow overrides` を確認した。Astroは108ページ、Pagefindは104ページ / 2,633語を生成し、GitHub Pages deployも成功した。配布artifactでもTSMC 287.36、キオクシア 813,935、東京エレクトロン 84,441のFCFと各Capexがfinancials/compareへ反映され、3社の個社ページに履歴導線が存在することを確認した。

## Remaining v0.4 work

1. Compute / Memory / Network / Data Center側の主要企業へ時系列履歴を拡張する
2. 決算更新履歴を企業・期間・Source単位で体系化する
3. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する
4. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
