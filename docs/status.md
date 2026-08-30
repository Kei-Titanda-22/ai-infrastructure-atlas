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
- [x] v0.4 Western Digital history batch deployed — Run #136
- [x] v0.4 Foundry / Analog history batch deployed — Run #138
- [x] v0.4 Optical / Network / Data Center Power history batch deployed — Run #140
- [x] v0.4 OSAT / Package Substrate history batch deployed — Run #145
- [x] v0.4 Semiconductor Materials history batch deployed — Run #146
- [x] v0.4 Power Infrastructure history batch deployed — Run #147
- [x] v0.4 Carrier / Trane Power-HVAC history batch deployed — Run #149

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- normalized financial history: **137 periods / 47 companies**
- multi-period financial-history companies: **47 / 47 covered companies**
- verified normalized historical metrics: **595**
- periods with both FCF and Capex: **93**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **48**
- v0.4 pending source policies: **48**
- earnings update ledger: **137 normalized records / 47 companies**
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.4 current implementation

時系列財務は `src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch14.json`、監査済みcash-flow overrideを `src/lib/financial-history.ts` で統合した配列を正規化履歴として扱う。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

現在の履歴対象は47社・137期間で、47社すべてが2期間以上を持つ。Run #145〜#149では、OSAT / パッケージ基板、半導体材料、電力インフラ、データセンターHVACの主要企業を追加した。

### OSAT / パッケージ基板

ASE Technology、Amkor、IBIDEN、Nan Ya PCBの9期間を追加した。ASE 3期間とIBIDEN 2期間は一次資料の単四半期営業CFとPP&E支出からAtlas FCFを算出する。AmkorとNan Ya PCBは対象資料のCF表が累計値のため、単四半期FCF / Capexを推定しない。Run #145で117期間 / 38社 / 511検証済み指標 / FCF+Capex 81期間を確認した。

### 半導体材料

信越化学工業、Entegris、GlobalWafers、レゾナック・ホールディングスの10期間を追加した。信越化学は公式Appendixの比較CFを使用し、四半期法定CFではないことと0.1十億円単位から百万円へ換算したことをbasisに保持する。Entegrisは4期間すべて単四半期の営業CFとPP&E取得支出からAtlas FCFを算出する。GlobalWafersは監査レビュー済みQ1財務諸表の厳密値を採用し、丸め値との混在を避ける。レゾナックはIFRSのconsolidated operating profitを使用し、core operating profitと区別する。Q1 CF非開示のためFCF / Capexを推定しない。SUMCOは2026四半期一次資料の安定した直接参照を確保できなかったため保留。Run #146で127期間 / 42社 / 557検証済み指標 / FCF+Capex 89期間を確認した。

### 電力インフラ / HVAC

GE Vernova、nVent、ABB、Carrier、Trane Technologiesを追加した。GE VernovaはQ2 2026 Form 10-Qの三か月値を採用し、CF表が6か月累計のため単四半期FCF / Capexを推定しない。nVentはSEC提出済み決算資料の単四半期営業CFとCapexからAtlas FCFを算出し、2期間とも全5指標を収録する。ABBはRoboticsの非継続事業化後にQ2 2026資料で再表示されたQ2 2025比較値を使用する。ABBのFCFは会社開示Non-GAAP値を `source-linked` として保持し、同一資料に対応CapexがないためAtlas再計算はしない。Run #147で133期間 / 45社 / 579検証済み指標 / FCF+Capex 91期間を確認した。

CarrierはQ2 2025 / Q2 2026の2期間で売上高・GAAP営業利益・営業利益率・営業CF・Capexが同一SEC提出資料に揃うため、FCFを `operating cash flow − capital expenditures` として再計算し全5指標を収録する。Trane TechnologiesはQ2 2025 / Q2 2026の売上高・GAAP営業利益・営業利益率を収録するが、CF開示がYTDのため単四半期FCF / Capexを推定しない。Run #149で137期間 / 47社 / 595検証済み指標 / FCF+Capex 93期間を確認した。

Coherent通期は営業活動CFとPP&E追加額からAtlas FCFを算出する。Lumentum通期はSEC 10-Kの営業活動CFとPP&E取得支出から算出する一方、Q4の会社開示は丸められたGAAP営業利益率までのため営業利益額を逆算しない。Cienaは決算資料のCF表が6か月累計のため単四半期FCF / Capexを推定しない。

Amphenolの会社開示FCFはPP&E売却収入を控除項目へ含むため、Atlas側は `Operating Cash Flow − gross capital expenditures` を使用する。Eatonはsegment marginを連結営業利益として流用せず、連結損益計算書の `net sales − cost of products sold − selling and administrative expense − R&D` で営業利益を再構成し、basisに明示する。

GlobalFoundriesとTexas Instrumentsでは会社Non-GAAP FCFに政府補助金・CHIPS Act incentiveが加算されるため、Atlas側は補助金を足さず `営業活動CF − 設備投資` を採用する。UMCも会社開示FCFとPP&E-only Atlas定義で差があるため、会社値を機械的に流用せずbasisに差異を明記する。Analog DevicesとNXPは会社開示FCFとAtlas再計算が整合する。

Western DigitalはFY2025の会社開示FCFにpre-Separation Flash Ventures活動が含まれるため、その会社固有調整を除外し、Atlas統一定義 `営業活動CF − PP&E取得支出` を使用する。

キオクシアはFY2026 Q1 / Q2 / Q3 / Q4とFY2027 Q1の5四半期、FY2025 / FY2026の2通期を収録する。Q2〜Q4は公式決算短信の累計値を差分で単四半期化し、営業CF・設備投資・FCFも各期間で検証済み。東京エレクトロンも同様に5四半期＋2通期を保持し、Capex定義は `有形固定資産の取得による現金支出` へ統一する。

FCF / Capexは定義確認済み期間だけ実データ化する。会社間の定義差は `basis` に保持し、比較時に同一定義とみなさない。既存period recordの補完には `src/data/financial-history-v04-cashflow-overrides.json` を監査済み差分層として使い、overrideはFCF / Capex以外を変更できないようvalidatorで制限する。

一次資料の検索は `src/lib/financial-sources.ts` に集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。文書Source / Policyはbatch単位の分割ファイルで追加し、validatorで重複IDとSource/Policyの1対1対応を検査する。

`/financials/` は47社を企業切替対象とし、四半期・通期を分離した自前SVG推移図と、一次資料・会計基準・検証状態付き決算表を表示する。FCF / Capexが存在する企業では追加グラフを表示し、負のFCFにも対応する。決算グラフはPR #32の大型化をロールバック済みで、PR #32直前の表示状態を維持している。

全体マップの工程別縦カラーラインは6px・高彩度を維持し、ホームの「AIインフラの主要工程」カラーラインも同じ工程色を使用する。

`/financials/updates/` は正規化履歴から直接生成する決算更新台帳。現在137レコード / 47社を、1行「1企業 × 1決算期間 × 1一次資料」として表示する。履歴収録済み47社の個社ページでは財務セクションから決算履歴へ直接移動できる。企業比較画面もv0.4正規化履歴を消費し、v0.3の `?ids=` 比較URL契約を維持する。

`scripts/validate-v04.py` は `financial-history-v04-batch*.json`、v0.4 Document Source、Source Policyを自動検出する。Source/company対応、ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt、営業利益率再計算、Capex符号、Atlas算出FCFの入力値・算式、Source/Policy対応、主要企業ごとの最低収録数を検査する。Run #149以降の回帰下限は137期間 / 47社 / 595検証済み指標 / FCF+Capex 93期間 / Source 48件で、Carrier / Trane Technologiesも各2期間以上を個別ゲートで保持する。

Run #149では `v0.4 financial-history validation OK: 137 periods / 47 companies / 47 multi-period companies / 595 verified metrics / 93 FCF+Capex periods / 5 cash-flow overrides / 48 v0.4 document sources+policies` を確認した。Astroは**109ページ**、Pagefindは**105ページ / 2,798語**を生成し、GitHub Pages deployまで成功した。

## Remaining v0.4 work

1. 正規化履歴カバレッジを現在の47社から100社DB内の次の主要企業群へ拡張する
2. 電力インフラのSchneider Electric / Siemens Energy / Legrand等、未収録の主要企業を追加する
3. OSAT / 基板ではJCET / Unimicron / Kinsus / Shinko Electric等の追加・連続性拡張を検討する
4. SUMCOやJohnson Controlsなど、比較可能な連結営業利益または安定した一次資料参照を確保できていない企業は条件を満たしてから収録する
5. 既存47社について必要に応じて四半期の連続性をさらに伸ばす
6. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する
7. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
