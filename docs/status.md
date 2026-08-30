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

## Current database

- companies: **100**
- value-chain layers / stages: **9 / 9**
- comparison templates: **8**
- normalized financial history: **199 periods / 76 companies**
- multi-period financial-history companies: **76 / 76 covered companies**
- verified normalized historical metrics: **889**
- periods with both FCF and Capex: **147**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **81**
- v0.4 pending source policies: **81**
- earnings update ledger: **199 normalized records / 76 companies**
- registered facilities: **17**
- real-time stock-price distribution: disabled

## v0.4 implementation

`src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch26.json` を `src/lib/financial-history.ts` で統合する。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

一次資料は `src/lib/financial-sources.ts` へ集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。Document Source / Policyはbatch単位で追加し、Source/Policyの1対1対応、重複ID、会社対応をvalidatorで検査する。

### Latest Physical AI expansion

Tesla、Mobileye、AptivをFY2024 / FY2025の2通期ずつ追加した。6期間すべてUS GAAPの売上高・reported operating income/loss・営業利益率・営業CF・cash Capexを一次資料から収録する。

- **Tesla**: Atlas FCF = GAAP operating cash flow − purchases of property and equipment excluding finance leases, net of sales。
- **Mobileye**: Atlas Capexはcash purchase of PP&Eのみ。non-cash PP&E purchaseは除外する。FY2024はgoodwill impairment 2,695百万ドルを含むGAAP operating loss -3,225百万ドルを保持し、Adjusted Operating Incomeへ置換しない。
- **Aptiv**: Atlas FCF = GAAP operating cash flow − capital expenditures。FY2025はgoodwill impairment 648百万ドルを含むGAAP operating income 1,184百万ドルを保持し、adjusted operating incomeへ置換しない。

Run #172で `199 periods / 76 companies / 76 multi-period companies / 889 verified metrics / 147 FCF+Capex periods / 5 cash-flow overrides / 81 v0.4 document sources+policies` を確認し、GitHub Pages deployまで成功した。

### Definition safeguards

- native reporting currency / unitを保持し、FX換算しない。
- consolidated GAAP / IFRS reported operating profitを優先し、adjusted / segment profitを自動代用しない。
- Atlas FCFは定義を閉じられる期間だけ算出し、原則 `operating cash flow − cash Capex` とする。
- company-reported FCFに資産売却、政府補助金、M&A、広義investing CFなどが混在する場合はAtlas値へ流用しない。
- 単四半期CFが累計値しかない場合、差分算出の根拠を一次資料で安全に検証できない限り推定しない。
- REITの開発・不動産投資は製造業のcash Capexと同一定義扱いしない。Equinix / Digital RealtyのFCF / Capexは理由付き `not-collected` を維持する。
- ASMPTはNEXX非継続事業を含む全社CFから継続事業FCF / Capexを按分しない。
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
- continuity floor: **199 periods / 76 companies / 889 verified metrics / 147 FCF+Capex periods / 81 sources+policies**

## Remaining v0.4 work

1. 正規化履歴カバレッジを現在の76社から100社DB内の主要未収録企業へ拡張する。
2. Physical AI / 産業オートメーションを優先し、DENSO / FANUC / Yaskawa / Keyence / OMRON / SMC / Mitsubishi Electric等を一次資料の安定性順に複数期間化する。
3. OSAT / 基板のKinsus / Unimicronは一次資料PDFの安定取得経路を確保してから収録する。
4. Johnson Controlsは連結Operating incomeの定義方針を確定するまで保留する。
5. 既存76社について必要に応じて四半期の連続性を伸ばす。
6. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載する。
7. v0.4完了判定前に主要企業の履歴カバレッジと比較可能性を再監査する。

## Data quality policy

- 一次資料優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
