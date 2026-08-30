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
- [x] Full-text search copy broadened from local examples to capability-oriented wording — included in Run #195 production build
- [x] Air Liquide / Hexagon annual history — Run #195
- [x] Ajinomoto Fine-Techno / Bosch annual history — data validation in Run #197, production deployment after ledger fix in Run #198
- [x] Earnings update ledger supports verified / source-linked / needs-review records without requiring a fake verification date — Run #198
- [x] Fujikura / Johnson Controls annual history — Run #200

## Current database

- companies: **100**
- value-chain layers / stages: **9 / 9**
- comparison templates: **8**
- normalized financial history: **243 periods / 98 companies**
- multi-period financial-history companies: **98 / 98 covered companies**
- verified normalized historical metrics: **1,078**
- periods with both FCF and Capex: **177**
- audited cash-flow overrides: **5**
- v0.4 document sources: **104**
- v0.4 pending source policies: **104**
- earnings update ledger: **243 normalized records / 98 companies**
- registered facilities: **17**
- real-time stock-price distribution: disabled

Run #200で `243 periods / 98 companies / 98 multi-period companies / 1078 verified metrics / 177 FCF+Capex periods / 5 cash-flow overrides / 104 v0.4 document sources+policies` を確認した。Astroは109ページ、Pagefindは105ページ / 2,999語を生成し、GitHub Pages deployまで成功した。

## v0.4 implementation

`src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch36.json` を `src/lib/financial-history.ts` で統合する。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証状態を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

一次資料は `src/lib/financial-sources.ts` に集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。Document Source / Policyはbatch単位で追加し、Source/Policyの1対1対応、重複ID、会社対応をvalidatorで検査する。

### Recent coverage expansion

90社到達後、以下8社を2期間以上へ追加した。

- **MediaTek**: FY2024 / FY2025を監査済み連結財務諸表から収録。Atlas FCFは `operating cash flow − PP&E purchases − intangible asset purchases`。
- **SMIC**: FY2024 / FY2025を年次報告書から収録。Atlas cash Capexは `PP&E + intangible assets + land-use-right purchases`。大型設備投資によりAtlas FCFがマイナスとなる期間もそのまま保持する。
- **Air Liquide**: FY2024 / FY2025をIFRS consolidatedで収録。`Operating Income Recurring`ではなくreported `Operating Income`を使用し、Atlas FCFは `operating cash flow − PP&E/intangible asset purchases`。
- **Hexagon**: FY2024 / FY2025をreported `Operating earnings`で収録し、adjusted EBIT1を代用しない。会社資料のCapital expendituresは有形資産部分が**net basis**のため、gross PP&E cash Capexではないことを各periodの`basis`へ明示する。
- **Ajinomoto Fine-Techno**: FY2025 / FY2026の会社単体売上高・営業利益・営業利益率を収録。FY2026はAjinomoto Co.公式合併資料から取得し`verified`。FY2025は官報決算公告の転記を参照しているため3指標を`source-linked`に留め、一次の官報PDFを確保するまで`verified`へ昇格しない。親会社Functional Materials事業値は代用しない。会社単体CFO / cash Capexが閉じないためFCF / Capexは未収録。
- **Bosch**: FY2024 / FY2025をIFRS consolidatedで収録。`EBIT from operations`ではなくreported EBITを営業利益相当として使用する。Atlas FCFは `cash flows from operating activities − Additions to non-current assets`。この投資行はPP&E-onlyより広い定義であることを`basis`に明示する。
- **Fujikura**: FY2025 / FY2026をJapanese GAAP consolidatedで収録。Atlas FCFは `営業活動CF − 有形及び無形固定資産の取得による支出`。売上高営業利益率は会社開示値とAtlas再計算の双方で整合を確認する。
- **Johnson Controls**: FY2024 / FY2025をUS GAAP continuing operationsベースで収録。連結損益にOperating incomeの直接行がないため、`Gross profit − SG&A − restructuring/impairment costs` で営業利益を明示的に再構成する。再構成値はnet financing chargesとequity income/lossを通じてreported income before taxへ完全にリコンサイルし、Segment EBITAは代用しない。Atlas FCFは `continuing-operations operating cash flow − capital expenditures`。

## Definition safeguards

- native reporting currency / unitを保持し、FX換算しない。
- consolidated GAAP / IFRS reported operating profitを優先し、adjusted / segment profitを自動代用しない。
- 連結損益に直接のOperating income行がない場合、再構成に使う営業項目とリコンサイル先を`basis`へ明示し、segment EBITA等を代用しない。
- Atlas FCFは定義を閉じられる期間だけ算出し、原則 `operating cash flow − cash Capex` とする。
- company-reported FCFに資産売却、政府補助金、M&A、広義investing CFなどが混在する場合はAtlas値へ流用しない。
- 単四半期CFが累計値しかない場合、差分算出の根拠を一次資料で安全に検証できない限り推定しない。
- management Capex / fixed-asset investmentをcash-flow Capexと自動的に同一視しない。
- Capex定義がnet basisやPP&E-onlyより広い場合は値を隠さず、`basis`で定義差を明示する。
- 非上場子会社は親会社セグメント値を会社単体値として代用しない。一次資料の品質が不足する期間は`source-linked`等で格下げして保持する。
- REITの開発・不動産投資は製造業のcash Capexと同一定義扱いしない。
- 非継続事業が全社CFへ混在する場合、継続事業FCF / Capexを按分しない。

## Company-page / search contracts

- 企業ページの競合関係は、保存データが片方向でも画面上では双方向に解決する。A→Bだけ登録された関係でもBページからAを確認できる。
- `scripts/audit-company-relations.py` をCIへ組み込み、explicit competitor配列、実効競合0件、片方向リンクを監査する。
- Run #200時点で実効競合0件は14社。直接競合が100社母集団内に存在しない可能性がある企業へ、空欄解消だけを目的とした関係は追加しない。
- 企業ページ右サイドバーは全体をsticky化し、内部スクロールに変更。目次と所属領域・最終確認日の文字がスクロール時に重ならない構造とする。1020px以下では通常配置へ戻す。
- 企業一覧検索窓: `企業名・ティッカー・製品・技術・地域を検索`
- 全文検索窓: `企業名・技術・製品・工程・地域・財務指標・リスクなどを検索`
- 全文検索は企業ページ、決算データ、製品・技術、バリューチェーン、主要拠点、財務指標、競争優位、リスクなどAtlas内情報を横断する。
- 決算更新履歴は`verifiedAt`がないレコードを`未検証`として扱い、source-linked / needs-review / verifiedを区別して表示する。更新内容は検証済み指標だけでなく値が収録された指標を表示し、検証済み数と収録数を併記する。
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
- continuity floor: **243 periods / 98 companies / 1,078 verified metrics / 177 FCF+Capex periods / 104 sources+policies**
- MediaTek / SMIC / Air Liquide / Hexagon / Ajinomoto Fine-Techno / Bosch / Fujikura / Johnson Controlsは各2期間以上を個別回帰ゲートで保持する。

## Remaining v0.4 work

100社DBのうち、正規化時系列が未収録なのは残り**2社**。

- Kinsus
- Unimicron

次の2社追加で100社DB全社が複数期間の正規化財務履歴を持つ状態になる。Kinsus / Unimicronは一次資料PDFの取得安定性と、cash-flow Capexの定義を確認したうえで収録する。一次資料でFCF / Capexを安全に閉じられない場合は推定せず欠損理由を保持する。

## Data quality policy

- 一次資料優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
