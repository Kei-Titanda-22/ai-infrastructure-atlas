# AI Infrastructure Atlas Status — 2026-08-30

## Release phase

- **v0.1 — Complete**: 20社・静的データ・公開URL
- **v0.2 — Complete**: 100社・セクターマップ
- **v0.3 — Complete**: 企業比較の本格化
- **v0.4 — In progress**: 決算データの時系列化
- v0.5 — 許可済みSourceのみ自動更新
- v1.0 — AI Infrastructure Atlas

## Delivery status

- [x] Public GitHub repository / GitHub Pages / GitHub Actions
- [x] v0.4 normalized financial history, comparison bridge, earnings-update ledger
- [x] Kioxia / Tokyo Electron continuous quarterly history
- [x] Foundry / Analog / Memory / Network / Optical / Data Center Power expansion
- [x] OSAT / Package Substrate / Semiconductor Materials expansion — Runs #145–#146
- [x] Power Infrastructure / HVAC expansion — Runs #147–#153
- [x] Shinko Electric / JCET / SUMCO — Run #154
- [x] Site-wide dark text / company-search wording / compact home updates — Run #156
- [x] Synopsys / Cadence / onsemi — Run #157
- [x] STMicroelectronics / Renesas / ROHM / Infineon — Run #159
- [x] ASM International / Advantest / SCREEN / DISCO — Run #161
- [x] KOKUSAI ELECTRIC / Canon / Nikon — Run #163
- [x] Besi / ASMPT — Run #165
- [x] Lasertec / HANMI Semiconductor — Runs #167–#168
- [x] Corning / TE Connectivity / Equinix / Digital Realty — Run #169
- [x] Tesla / Mobileye — Run #171
- [x] Aptiv — Run #172
- [x] FANUC / Yaskawa industrial-automation history — deployed and revalidated in Run #175
- [x] OMRON continuing-operations history — Run #175

## Current database

- companies: **100**
- value-chain layers / stages: **9 / 9**
- comparison templates: **8**
- normalized financial history: **205 periods / 79 companies**
- multi-period financial-history companies: **79 / 79 covered companies**
- verified normalized historical metrics: **915**
- periods with both FCF and Capex: **151**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **84**
- v0.4 pending source policies: **84**
- earnings update ledger: **205 normalized records / 79 companies**
- registered facilities: **17**
- real-time stock-price distribution: disabled

## v0.4 implementation

`src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch28.json` を `src/lib/financial-history.ts` で統合する。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

一次資料は `src/lib/financial-sources.ts` へ集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。Document Source / Policyはbatch単位で追加し、Source/Policyの1対1対応、重複ID、会社対応をvalidatorで検査する。

### Latest Physical AI / industrial automation expansion

Tesla、Mobileye、Aptivに続き、FANUC、Yaskawa、OMRONを複数期間化した。

- **FANUC**: FY2024 / FY2025をJapanese GAAPで収録。Atlas FCFは `operating cash flow − purchases of property, plant and equipment`。大口の定期預金入出金を含むtotal investing CFは使用しない。
- **Yaskawa**: FY2024 / FY2025をIFRSで収録。Atlas FCFは `operating cash flow − purchase of property, plant and equipment, and intangible assets`。投資有価証券や持分法株式売却を含むtotal investing CFは流用しない。
- **OMRON**: DMBが非継続事業へ分類されたため、FY2024 / FY2025の売上高・営業利益はcontinuing operationsベースで収録。連結CF表は継続・非継続事業を分離していないため、FCF / Capexを按分・推定しない。

Run #175で `205 periods / 79 companies / 79 multi-period companies / 915 verified metrics / 151 FCF+Capex periods / 5 cash-flow overrides / 84 v0.4 document sources+policies` を確認し、GitHub Pages deployまで成功した。

### Definition safeguards

- native reporting currency / unitを保持し、FX換算しない。
- consolidated GAAP / IFRS reported operating profitを優先し、adjusted / segment profitを自動代用しない。
- Atlas FCFは定義を閉じられる期間だけ算出し、原則 `operating cash flow − cash Capex` とする。
- company-reported FCFに資産売却、政府補助金、M&A、広義investing CFなどが混在する場合はAtlas値へ流用しない。
- 単四半期CFが累計値しかない場合、差分算出の根拠を一次資料で安全に検証できない限り推定しない。
- REITの開発・不動産投資は製造業のcash Capexと同一定義扱いしない。Equinix / Digital RealtyのFCF / Capexは理由付き `not-collected` を維持する。
- 非継続事業が全社CFへ混在する場合、継続事業FCF / Capexを按分しない。ASMPT / OMRONでこの原則を適用する。
- Kioxia / Tokyo Electronの累計値差分による単四半期化は、一次資料の整合性確認済み期間だけ保持する。

## UI contracts

- compare URL contract `?ids=...` を維持する。
- 決算グラフはPR #32の大型化をロールバック済み。再導入しない。
- 全体マップの工程別縦カラーラインは6px・高彩度。ホームの工程色も同一色を使用する。
- サイト全体で灰色の文字を使わず、`--muted` は本文色へ統合。灰色の枠線・背景は可。
- 企業一覧検索窓: `企業名・ティッカー・製品・技術・地域を検索`
- ホームの「最近の更新」はupdate-log本体を削らず最新5件だけ表示する。

## Validation baseline

`scripts/validate-v04.py` はhistory batch、Document Source、Source Policyを自動検出し、以下を検査する。

- Source/company対応、Source/Policy対応、重複ID
- ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt
- 営業利益率再計算、Capex符号、Atlas FCF入力値・算式
- 主要企業ごとの最低収録期間
- continuity floor: **205 periods / 79 companies / 915 verified metrics / 151 FCF+Capex periods / 84 sources+policies**

## Remaining v0.4 work

1. 正規化履歴カバレッジを現在の79社から100社DB内の主要未収録企業へ拡張する。
2. Physical AI / 産業オートメーションではDENSO / Keyence / SMC / Mitsubishi Electric等を一次資料の安定性順に複数期間化する。
3. OSAT / 基板のKinsus / Unimicronは一次資料PDFの安定取得経路を確保してから収録する。
4. Johnson Controlsは連結Operating incomeの定義方針を確定するまで保留する。
5. 既存79社について必要に応じて四半期の連続性を伸ばす。
6. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する。
7. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する。

## Data quality policy

- 一次資料優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
