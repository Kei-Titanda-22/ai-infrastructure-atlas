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
- [x] Tesla / Mobileye / Aptiv — Runs #171–#172
- [x] FANUC / Yaskawa / OMRON — through Run #175
- [x] 90-company normalized-history milestone reached and deployed — Run #180

## Current database

- companies: **100**
- value-chain layers / stages: **9 / 9**
- comparison templates: **8**
- normalized financial history: **227 periods / 90 companies**
- multi-period financial-history companies: **90 / 90 covered companies**
- verified normalized historical metrics: **1,005**
- periods with both FCF and Capex: **163**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **95**
- v0.4 pending source policies: **95**
- earnings update ledger: **227 normalized records / 90 companies**
- registered facilities: **17**
- real-time stock-price distribution: disabled

## v0.4 implementation

`src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch32.json` を `src/lib/financial-history.ts` で統合する。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

一次資料は `src/lib/financial-sources.ts` へ集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。Document Source / Policyはbatch単位で追加し、Source/Policyの1対1対応、重複ID、会社対応をvalidatorで検査する。

### 79社 → 90社 expansion

90社到達のため、以下11社を2期間以上へ拡張した。

- **Mitsubishi Electric**: FY2025 / FY2026をIFRSで収録。Atlas FCFは `operating cash flow − cash purchases of PP&E − cash purchases of intangible assets`。M&A・有価証券・売却収入を含むtotal investing CFは使わない。
- **ARM**: FY2025 / FY2026をUS GAAPで収録。Atlas FCFはCFO−PP&E purchases。
- **Qualcomm**: FY2024 / FY2025をUS GAAP continuing operationsベースで収録。FY2024は非継続事業の営業CFが一次資料で別掲されているため、継続事業CFOを明示的に再構成してAtlas FCFを算出する。
- **Monolithic Power Systems**: FY2024 / FY2025をUS GAAPで収録。cash CapexはPP&E＋intangible asset purchases。
- **Linde**: FY2024 / FY2025をUS GAAPで収録。adjusted operating profitではなくreported operating profitを使用する。
- **Tower Semiconductor**: FY2024 / FY2025をUS GAAPで収録。cash-flow statementのproperty/equipment investmentを使用し、別掲の資産売却収入はAtlas FCFへ足さない。
- **DENSO**: FY2025 / FY2026をIFRSで収録。公式財務ページの設備投資額はcash-flow Capex定義と同一視せず、FCF / Capexは未収録のまま保持する。
- **Sumitomo Electric**: FY2024 / FY2025をJapanese GAAPで収録。固定資産投資額をcash Capexへ自動変換しない。
- **KEYENCE**: FY2024 / FY2025をJapanese GAAPで収録。期末日は法定会計期間に合わせ3月20日。公式ハイライトから売上高・営業利益・営業利益率を収録し、FCF / Capexは推定しない。
- **SMC**: FY2024 / FY2025をJapanese GAAPで収録。売上高・営業利益・営業利益率を収録し、exact cash Capex未確認のためFCF / Capexは未収録。
- **Furukawa Electric**: FY2023 / FY2024をJapanese GAAPで収録。公式FY2024決算PDFの比較列を画像でも確認し、売上高・営業利益・営業利益率を収録。total investing CFからFCFを推定しない。

Run #180で `227 periods / 90 companies / 90 multi-period companies / 1005 verified metrics / 163 FCF+Capex periods / 5 cash-flow overrides / 95 v0.4 document sources+policies` を確認し、Astro build、Pagefind、GitHub Pages deployまで成功した。

### Definition safeguards

- native reporting currency / unitを保持し、FX換算しない。
- consolidated GAAP / IFRS reported operating profitを優先し、adjusted / segment profitを自動代用しない。
- Atlas FCFは定義を閉じられる期間だけ算出し、原則 `operating cash flow − cash Capex` とする。
- company-reported FCFに資産売却、政府補助金、M&A、広義investing CFなどが混在する場合はAtlas値へ流用しない。
- 単四半期CFが累計値しかない場合、差分算出の根拠を一次資料で安全に検証できない限り推定しない。
- management Capex / fixed-asset investmentをcash-flow Capexと同一視しない。
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
- continuity floor: **227 periods / 90 companies / 1,005 verified metrics / 163 FCF+Capex periods / 95 sources+policies**

## Remaining v0.4 work

100社DBのうち、正規化時系列が未収録なのは残り10社。

- Air Liquide
- Ajinomoto Fine-Techno
- Bosch
- Fujikura
- Hexagon
- Johnson Controls
- Kinsus
- MediaTek
- SMIC
- Unimicron

次段階では、一次資料の定義と取得安定性を確認できる企業から90→100社へ進める。Kinsus / Unimicronは一次資料PDFの安定取得経路、Johnson Controlsは連結Operating incomeの定義方針を確定してから収録する。

## Data quality policy

- 一次資料優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
