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
- [x] v0.4 Legrand annual history deployed — Run #151
- [x] v0.4 Schneider Electric / Siemens Energy annual history deployed — Run #153
- [x] v0.4 Shinko Electric / JCET / SUMCO history batch deployed — Run #154
- [x] Site-wide dark text / company-search wording / compact home updates deployed — Run #156
- [x] v0.4 Synopsys / Cadence / onsemi history batch deployed — Run #157
- [x] v0.4 STMicroelectronics / Renesas / ROHM / Infineon history batch deployed — Run #159
- [x] v0.4 ASM International / Advantest / SCREEN / DISCO equipment history batch deployed — Run #161

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- normalized financial history: **171 periods / 62 companies**
- multi-period financial-history companies: **62 / 62 covered companies**
- verified normalized historical metrics: **761**
- periods with both FCF and Capex: **125**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **65**
- v0.4 pending source policies: **65**
- earnings update ledger: **171 normalized records / 62 companies**
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.4 current implementation

時系列財務は `src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch20.json`、監査済みcash-flow overrideを `src/lib/financial-history.ts` で統合した配列を正規化履歴として扱う。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

現在の履歴対象は62社・171期間で、62社すべてが2期間以上を持つ。直近Run #145〜#161では、OSAT / パッケージ基板、半導体材料、電力インフラ、データセンターHVAC、EDA、電力半導体、半導体装置を重点的に拡張した。

### OSAT / パッケージ基板

ASE Technology、Amkor、IBIDEN、Nan Ya PCB、Shinko Electric、JCETを収録する。ASE 3期間、IBIDEN 2期間、Shinko Electric 2通期、JCET 2四半期は一次資料の営業CFとcash CapexからAtlas FCFを算出する。AmkorとNan Ya PCBは対象資料のCF表が累計値のため、単四半期FCF / Capexを推定しない。

Shinko Electricは上場廃止前のFY2024公式決算資料の比較列を使用する。JCETはPRC GAAPの公式Q1 2024報告書からQ1 2023 / Q1 2024を収録し、元の人民元値をCNY millionへ単位スケールのみ変換する。

### 半導体材料

信越化学工業、Entegris、GlobalWafers、レゾナック・ホールディングス、SUMCOを収録する。Entegrisは単四半期の営業CFとPP&E取得支出からAtlas FCFを算出する。GlobalWafersは監査レビュー済み財務諸表の厳密値を採用し、丸め値との混在を避ける。レゾナックはIFRS consolidated operating profitを使用し、core operating profitと区別する。

SUMCOはFY2024 / FY2025の売上高・営業利益・営業利益率を一次資料から収録する一方、対応するAtlas cash-Capex定義を同一資料で閉じられないためFCF / Capexは推定しない。

### 電力インフラ / HVAC

GE Vernova、nVent、ABB、Carrier、Trane Technologies、Legrand、Schneider Electric、Siemens Energyを収録する。GE Vernovaは10-Qの三か月値を採用し、CF表が累計のため単四半期FCF / Capexを推定しない。nVentとCarrierは単四半期CFO−CapexでAtlas FCFを算出する。ABBはRobotics非継続事業化後の再表示比較値を使用し、会社開示Non-GAAP FCFを `source-linked` として保持する。

Legrandは会社FCFに含まれる固定・金融資産売却収入をAtlas FCFへ足さず、営業CF−gross capital expenditureを使用する。Schneider ElectricはAdjusted EBITAではなくIFRS Operating incomeを採用し、Siemens EnergyもProfit before Special ItemsではなくIFRS Operating income (loss)を採用する。

### EDA / 電力半導体

Synopsys、Cadence、onsemiをFY2024 / FY2025の2通期ずつ収録する。3社ともSEC Form 10-KのUS GAAP連結値を使用し、Atlas FCFは `営業活動CF − 対応するPP&E取得支出` とする。Synopsys FY2025はAnsys買収後影響を含むGAAP operating incomeを採用し、adjusted operating incomeへ置換しない。onsemi FY2025もrestructuring / asset impairment等を含むGAAP operating incomeを採用する。

STMicroelectronics、Renesas Electronics、ROHM、Infineonも各2通期を追加した。4社8期間すべて売上高・営業利益・営業利益率・営業CF・cash Capexを一次資料で収録する。

- STMicroelectronicsは会社Non-U.S.-GAAP FCFのNet Capex定義を使わず、Atlas FCFを `CFO − gross tangible asset purchases` とする。
- Renesasは会社FCF（営業CF＋全投資CF）を流用せず、IFRS営業利益と `CFO − PP&E/intangible purchases` を使用する。
- ROHMはJapanese GAAPのreported operating profitを使用し、FY2026の減価償却方法変更を過去値へ遡及調整しない。
- InfineonはSegment ResultではなくIFRS Operating profitを使用し、Atlas FCFを `CFO − PP&E/intangible acquisition payments` とする。会社FCFに含まれる広義投資・M&A影響は混在させない。

### 半導体装置

Run #161でASM International、Advantest、SCREEN Holdings、DISCOの8通期を追加・拡張した。4社8期間すべて売上高・営業利益・営業利益率・営業CF・cash Capexを一次資料で収録し、Atlas FCFを `営業活動CF − gross cash Capex` で再計算する。このバッチは既収録企業の履歴延長も含むため、企業カバレッジの純増は4社ではなく2社である。

- ASM Internationalはadjusted operating resultではなくIFRS reported operating resultを使用する。Atlas CapexはPP&E、capitalized development expenditure、intangible asset capexの現金支出を合算し、会社non-IFRS FCFに含まれるその他投資CFを混在させない。
- AdvantestはIFRS operating incomeを使用し、Atlas CapexをPP&E＋intangible asset purchasesとする。
- SCREEN HoldingsはJapanese GAAP operating incomeを使用し、会社サイトのtotal investing CFベースFCFを流用しない。
- DISCOはJapanese GAAP operating incomeを使用する。会社FCFに含まれる投資CF、特にFY2025の定期預金支出をAtlas Capexへ混在させない。

Run #161で171期間 / 62社 / 761検証済み指標 / FCF+Capex 125期間を確認した。

### 既存の重要な定義差

Coherent通期は営業活動CFとPP&E追加額からAtlas FCFを算出する。Lumentum通期はSEC 10-Kの営業活動CFとPP&E取得支出から算出する一方、Q4の会社開示は丸められたGAAP営業利益率までのため営業利益額を逆算しない。CienaはCF表が6か月累計のため単四半期FCF / Capexを推定しない。

Amphenolの会社開示FCFはPP&E売却収入を含むため、Atlas側は `Operating Cash Flow − gross capital expenditures` を使用する。Eatonはsegment marginを連結営業利益として流用せず、連結損益行から営業利益を再構成してbasisに明示する。

GlobalFoundriesとTexas Instrumentsでは会社Non-GAAP FCFに政府補助金・CHIPS Act incentiveが加算されるため、Atlas側は補助金を足さず `営業活動CF − 設備投資` を採用する。UMCも会社開示FCFとPP&E-only Atlas定義の差をbasisに保持する。Western DigitalはFY2025の会社固有Flash Ventures調整を除外し、Atlas統一定義を使う。

キオクシアは5四半期＋2通期、東京エレクトロンも5四半期＋2通期を保持する。両社とも累計値を差分で単四半期化した期間は一次資料で整合性を確認し、FCF / Capexの定義もbasisに保持する。

## Data plumbing / UI contracts

FCF / Capexは定義確認済み期間だけ実データ化する。会社間の定義差は `basis` に保持し、比較時に同一定義とみなさない。既存period recordの補完には `src/data/financial-history-v04-cashflow-overrides.json` を監査済み差分層として使い、overrideはFCF / Capex以外を変更できないようvalidatorで制限する。

一次資料の検索は `src/lib/financial-sources.ts` に集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。文書Source / Policyはbatch単位の分割ファイルで追加し、validatorで重複IDとSource/Policyの1対1対応を検査する。

`/financials/` は62社を企業切替対象とし、四半期・通期を分離した自前SVG推移図と、一次資料・会計基準・検証状態付き決算表を表示する。FCF / Capexが存在する企業では追加グラフを表示し、負のFCFにも対応する。決算グラフはPR #32の大型化をロールバック済みで、PR #32直前の表示状態を維持する。

全体マップの工程別縦カラーラインは6px・高彩度を維持し、ホームの「AIインフラの主要工程」カラーラインも同じ工程色を使用する。

Run #156でサイト全体の補助文字色を本文色へ統一し、灰色の文字を使わない表示へ変更した。枠線・背景の灰色と、検証状態など意味を持つ緑・黄・赤は維持する。企業一覧の検索窓は `企業名・ティッカー・製品・技術・地域を検索` と表示し、ホームの「最近の更新」はupdate-log本体を削らず最新5件だけ表示する。

`/financials/updates/` は正規化履歴から直接生成する決算更新台帳。現在171レコード / 62社を、1行「1企業 × 1決算期間 × 1一次資料」として表示する。企業比較画面はv0.4正規化履歴を消費し、v0.3の `?ids=` 比較URL契約を維持する。

`scripts/validate-v04.py` は `financial-history-v04-batch*.json`、v0.4 Document Source、Source Policyを自動検出する。Source/company対応、ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt、営業利益率再計算、Capex符号、Atlas算出FCFの入力値・算式、Source/Policy対応、主要企業ごとの最低収録数を検査する。Run #161以降の回帰下限は171期間 / 62社 / 761検証済み指標 / FCF+Capex 125期間 / Source 65件で、ASM International / Advantest / SCREEN Holdings / DISCOも各2期間以上を個別ゲートで保持する。

Run #161では `v0.4 financial-history validation OK: 171 periods / 62 companies / 62 multi-period companies / 761 verified metrics / 125 FCF+Capex periods / 5 cash-flow overrides / 65 v0.4 document sources+policies` を確認した。Astroは**109ページ**、Pagefindは**105ページ / 2,866語**を生成し、GitHub Pages deployまで成功した。

## Remaining v0.4 work

1. 正規化履歴カバレッジを現在の62社から100社DB内の主要未収録企業へ拡張する
2. OSAT / 基板ではKinsus / Unimicronの一次資料PDFを安定取得できる経路を確保してから収録する
3. Johnson Controlsは連結損益計算書に直接のOperating income行がないため、再構成値を採用するかの定義方針を決めるまで保留する
4. 残りの半導体装置、ネットワーク、ストレージ、Physical AI等の未収録主要企業を優先度順に複数期間化する
5. 既存62社について必要に応じて四半期の連続性をさらに伸ばす
6. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する
7. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
