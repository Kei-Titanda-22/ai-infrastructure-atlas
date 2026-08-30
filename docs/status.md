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
- [x] EDA / Power Semiconductor / Semiconductor Equipment expansion — Runs #157–#168
- [x] Interconnect / Data Center / Physical AI expansion — Runs #169–#175
- [x] 90-company normalized-history milestone — Run #180
- [x] MediaTek / SMIC annual history — Run #184
- [x] Company-page TOC overlap fix / competitor relationship audit and bidirectional display — Runs #188–#191
- [x] Full-text search copy broadened from local examples to capability-oriented wording — deployed before Run #195 and included in Run #195 production build
- [x] Air Liquide / Hexagon annual history — Run #195

## Current database

- companies: **100**
- value-chain layers / stages: **9 / 9**
- comparison templates: **8**
- normalized financial history: **235 periods / 94 companies**
- multi-period financial-history companies: **94 / 94 covered companies**
- verified normalized historical metrics: **1,045**
- periods with both FCF and Capex: **171**
- audited cash-flow overrides: **5**
- v0.4 exact document sources: **99**
- v0.4 pending source policies: **99**
- earnings update ledger: **235 normalized records / 94 companies**
- registered facilities: **17**
- real-time stock-price distribution: disabled

Run #195で `235 periods / 94 companies / 94 multi-period companies / 1045 verified metrics / 171 FCF+Capex periods / 5 cash-flow overrides / 99 v0.4 document sources+policies` を確認した。Astroは109ページ、Pagefindは105ページ / 2,980語を生成し、GitHub Pages deployまで成功した。

## v0.4 implementation

`src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch34.json` を `src/lib/financial-history.ts` で統合する。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

一次資料は `src/lib/financial-sources.ts` に集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。Document Source / Policyはbatch単位で追加し、Source/Policyの1対1対応、重複ID、会社対応をvalidatorで検査する。

### Recent coverage expansion

90社到達後、以下4社を2期間以上へ追加した。

- **MediaTek**: FY2024 / FY2025を監査済み連結財務諸表から収録。Atlas FCFは `operating cash flow − PP&E purchases − intangible asset purchases`。
- **SMIC**: FY2024 / FY2025を年次報告書から収録。Atlas cash Capexは `PP&E + intangible assets + land-use-right purchases`。大型設備投資によりAtlas FCFがマイナスとなる期間もそのまま保持する。
- **Air Liquide**: FY2024 / FY2025をIFRS consolidatedで収録。`Operating Income Recurring`ではなくreported `Operating Income`を使用し、Atlas FCFは `operating cash flow − PP&E/intangible asset purchases`。
- **Hexagon**: FY2024 / FY2025をreported `Operating earnings`で収録し、adjusted EBIT1を代用しない。会社資料のCapital expendituresは有形資産部分が**net basis**のため、gross PP&E cash Capexではないことを各periodの`basis`へ明示する。

## Definition safeguards

- native reporting currency / unitを保持し、FX換算しない。
- consolidated GAAP / IFRS reported operating profitを優先し、adjusted / segment profitを自動代用しない。
- Atlas FCFは定義を閉じられる期間だけ算出し、原則 `operating cash flow − cash Capex` とする。
- company-reported FCFに資産売却、政府補助金、M&A、広義investing CFなどが混在する場合はAtlas値へ流用しない。
- 単四半期CFが累計値しかない場合、差分算出の根拠を一次資料で安全に検証できない限り推定しない。
- management Capex / fixed-asset investmentをcash-flow Capexと自動的に同一視しない。
- Capex定義がnet basis等でgross cash Capexと異なる場合は値を隠さず、`basis`で定義差を明示する。
- REITの開発・不動産投資は製造業のcash Capexと同一定義扱いしない。
- 非継続事業が全社CFへ混在する場合、継続事業FCF / Capexを按分しない。

## Company-page / search contracts

- 企業ページの競合関係は、保存データが片方向でも画面上では双方向に解決する。これによりA→Bだけ登録された関係でもBページからAを確認できる。
- `scripts/audit-company-relations.py` をCIへ組み込み、explicit competitor配列、実効競合0件、片方向リンクを監査する。
- Run #191時点で実効競合0件は14社まで縮小。直接競合が100社母集団内に存在しない可能性がある企業へ、空欄解消だけを目的とした関係は追加しない。
- 企業ページ右サイドバーは全体をsticky化し、内部スクロールに変更。目次と所属領域・最終確認日の文字がスクロール時に重ならない構造とする。1020px以下では通常配置へ戻す。
- 企業一覧検索窓: `企業名・ティッカー・製品・技術・地域を検索`
- 全文検索窓: `企業名・技術・製品・工程・地域・財務指標・リスクなどを検索`
- 全文検索は企業ページ、決算データ、製品・技術、バリューチェーン、主要拠点、財務指標、競争優位、リスクなどAtlas内情報を横断する。
- compare URL contract `?ids=...` を維持する。
- 決算グラフはPR #32の大型化をロールバック済み。再導入しない。
- サイト全体で灰色の文字を使わず、灰色は枠線・背景に限定する。
- ホームの「最近の更新」はupdate-log本体を削らず最新5件だけ表示する。

## Validation baseline

`scripts/validate-v04.py` はhistory batch、Document Source、Source Policyを自動検出し、以下を検査する。

- Source/company対応、Source/Policy対応、重複ID
- ISO期末日、会社・期間重複、5指標スキーマ、欠損理由、verifiedAt
- 営業利益率再計算、Capex符号、Atlas FCF入力値・算式
- 主要企業ごとの最低収録期間
- continuity floor: **235 periods / 94 companies / 1,045 verified metrics / 171 FCF+Capex periods / 99 sources+policies**
- MediaTek / SMIC / Air Liquide / Hexagonは各2期間以上を個別回帰ゲートで保持する。

## Remaining v0.4 work

100社DBのうち、正規化時系列が未収録なのは残り**6社**。

- Ajinomoto Fine-Techno
- Bosch
- Fujikura
- Johnson Controls
- Kinsus
- Unimicron

以後も**2社単位**で追加する。一次資料の定義と取得安定性を優先し、Kinsus / Unimicronは一次資料PDFの安定取得経路、Johnson Controlsは連結Operating incomeの定義方針を確定してから収録する。

## Data quality policy

- 一次資料優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
