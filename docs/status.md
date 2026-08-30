# AI Infrastructure Atlas Status — 2026-08-31

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
- [x] Full-text search copy broadened to Atlas-wide capabilities — included in Run #195 production build
- [x] Air Liquide / Hexagon annual history — Run #195
- [x] Ajinomoto Fine-Techno / Bosch annual history and source-linked ledger support — Runs #197–#198
- [x] Fujikura / Johnson Controls annual history — Run #200
- [x] **Kinsus / Unimicron annual history; 100-company multi-period coverage milestone — Run #202**
- [x] 100-company financial-quality audit script / deterministic JSON + Markdown report / CI freshness gate
- [x] adjusted / Non-GAAP FCF classification split / independent cashFlowInputs and FCF-Capex scope flags
- [x] Micron Q3 FY2026 Atlas FCF normalization from gross PP&E cash expenditures
- [x] Vertiv Q2 2025 / Q2 2026 and ABB Q2 2025 / Q2 2026 Atlas FCF normalization with audited cash-flow inputs
- [x] TSMC Q2 2025 / Q1 2026 / Q2 2026 gross PP&E + intangible cash-Capex normalization; Applied Materials gross PP&E classification
- [x] KLA Q4 FY2025 / Q4 FY2026 gross PP&E classification; Analog Devices Q3 FY2026 net-Capex classification with unresolved government-incentive netting provenance
- [x] Carrier Q2 2025 / Q2 2026 continuing-operations FCF normalization; Carrier productive-assets and nVent gross PP&E Capex classification

## Current database

- companies: **100**
- value-chain layers / stages: **9 / 9**
- comparison templates: **8**
- normalized financial history: **247 periods / 100 companies**
- multi-period financial-history companies: **100 / 100 companies**
- verified normalized historical metrics: **1,098**
- source-linked historical metrics: **3**
- missing historical metrics: **134**
- periods with both FCF and Capex: **181**
- periods with only Capex missing: **0**
- periods with both FCF and Capex missing: **66**
- adjusted / Non-GAAP FCF with Atlas-aligned formula: **8**
- adjusted / Non-GAAP FCF with Atlas definition difference: **0**
- populated FCF periods with cashFlowInputs missing: **8**
- periods with FCF / Capex scope mismatch: **0**
- audited cash-flow overrides: **12**
- v0.4 document sources: **116**
- v0.4 pending source policies: **116**
- earnings update ledger: **247 normalized records / 100 companies**
- registered facilities: **17**
- real-time stock-price distribution: disabled

今回のローカル検証で `247 periods / 100 companies / 100 multi-period companies / 1098 verified metrics / 181 FCF+Capex periods / 12 cash-flow overrides / 116 v0.4 document sources+policies` を確認した。Astroは109ページ、Pagefindは105ページ / 3,660語を生成した。

`scripts/audit-financial-quality.py` は247期間×5指標を横断し、検証状態、FCF/Capex充足、Capex定義、Operating Profit定義、特殊比較フラグを `docs/financial-quality-audit.json` / `.md` へ決定論的に出力する。レビュー済みadjusted / Non-GAAP由来FCF 13期間は、旧表記のままAtlas算式一致8期間、Atlas正規化済み5期間（Micron 1期間、Vertiv 2期間、ABB 2期間）、Atlas定義差あり0期間となった。さらに、cashFlowInputs未登録8期間、FCF/Capex scope mismatch 0期間、PP&E-only 56期間を独立軸で出力する。Carrier 2期間は別途、continuing-operations OCFへ統一し、`gross-productive-assets-cash-purchases`として分類する。TSMC 3期間は`ppe-plus-intangible`、Applied Materials 2期間、KLA 2期間、nVent 2期間は一次資料監査済みの`gross-ppe-cash-purchases`として分類する。nVentの会社FCFはPP&E sale proceedsを加算するが対象2期間はゼロのためAtlas値へ影響しない。Analog Devices Q3 FY2026は`net-capex`へ分類する一方、期間固有の政府支援相殺額が未開示のため`government-incentive-netting-unresolved`およびAtlas gross cash Capex未解決queueに残す。現状のその他の要確認キューは、source-linked 3指標、FCF/Capex片側欠損0期間、両方欠損66期間、Capex定義未分類16期間。CIは `--check` でデータと監査結果の同期を検証する。

## v0.4 implementation

`src/data/financial-history.json` と `financial-history-v04-batch2.json` 〜 `batch37.json` を `src/lib/financial-history.ts` で統合する。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証状態を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

一次資料は `src/lib/financial-sources.ts` に集約し、`/financials/`、`/financials/updates/`、企業比較が同じSource Registryを消費する。Document Source / Policyはbatch単位で追加し、Source/Policyの1対1対応、重複ID、会社対応をvalidatorで検査する。

### 100-company coverage milestone

100社DBの**全100社が2期間以上の正規化財務履歴を持つ**。100社到達は、欠損を推定で埋めることを条件にはしていない。一次資料で安全に定義を閉じられない指標は、会社カバレッジを優先して捏造せず、明示的な欠損状態のまま保持する。

90社到達後に追加した10社は、MediaTek、SMIC、Air Liquide、Hexagon、Ajinomoto Fine-Techno、Bosch、Fujikura、Johnson Controls、Kinsus、Unimicron。

- **MediaTek**: FY2024 / FY2025。Atlas FCFは `operating cash flow − PP&E purchases − intangible asset purchases`。
- **SMIC**: FY2024 / FY2025。cash Capexは `PP&E + intangible assets + land-use-right purchases`。大型設備投資による負のAtlas FCFもそのまま保持。
- **Air Liquide**: FY2024 / FY2025。Recurringではなくreported Operating Incomeを使用。
- **Hexagon**: FY2024 / FY2025。adjusted EBIT1ではなくreported Operating earningsを使用。Capital expendituresの有形資産部分がnet basisであることをbasisに明示。
- **Ajinomoto Fine-Techno**: FY2025 / FY2026の会社単体値。FY2026は公式資料でverified、FY2025は官報転記のため3指標をsource-linkedに留める。親会社セグメント値を代用しない。
- **Bosch**: FY2024 / FY2025。reported EBITを使用。Atlas FCFは `operating cash flow − Additions to non-current assets` で、PP&E-onlyより広い定義であることをbasisに明示。
- **Fujikura**: FY2025 / FY2026。Atlas FCFは `営業活動CF − 有形及び無形固定資産の取得による支出`。
- **Johnson Controls**: FY2024 / FY2025。Operating incomeの直接行がないため `Gross profit − SG&A − restructuring/impairment costs` で連結営業利益を再構成し、reported income before taxへリコンサイル。Segment EBITAは代用しない。
- **Kinsus**: FY2024 / FY2025。売上高・Operating Income・営業利益率をverifiedで収録。営業CFは確認できるがexact gross cash Capexを同一の取得可能な一次資料で安全に分離できないため、FCF / Capexは`not-collected`とし推定しない。
- **Unimicron**: FY2024 / FY2025。売上高・Operating profit・営業利益率・FCF・Capexをverifiedで収録。Atlas Capexは `PP&E / investment property acquisition + intangible-asset acquisition` としright-of-use asset acquisitionを除外。大型cash Capexにより両期間のAtlas FCFは負値となる。

## Definition safeguards

- native reporting currency / unitを保持し、FX換算しない。
- consolidated GAAP / IFRS reported operating profitを優先し、adjusted / segment profitを自動代用しない。
- 連結損益に直接のOperating income行がない場合、再構成に使う営業項目とリコンサイル先を`basis`へ明示する。
- Atlas FCFは定義を閉じられる期間だけ算出し、原則 `operating cash flow − cash Capex` とする。
- company-reported FCFに資産売却、政府補助金、M&A、広義investing CFなどが混在する場合はAtlas値へ流用しない。
- 単四半期CFが累計値しかない場合、差分算出の根拠を一次資料で安全に検証できない限り推定しない。
- management Capex / fixed-asset investmentをcash-flow Capexと自動的に同一視しない。
- Capex定義がnet basis、PP&E-onlyより広い、またはinvestment propertyを含む等の場合は`basis`で定義差を明示する。
- 非上場子会社は親会社セグメント値を会社単体値として代用しない。一次資料の品質が不足する期間は`source-linked`等へ格下げする。
- exact cash Capexを安全に分離できない場合、100社カバレッジ達成のためにFCF / Capexを推定しない。
- REITの開発・不動産投資は製造業のcash Capexと同一定義扱いしない。
- 非継続事業が全社CFへ混在する場合、継続事業FCF / Capexを按分しない。

## Company-page / search contracts

- 企業ページの競合関係は、保存データが片方向でも画面上では双方向に解決する。A→Bだけ登録された関係でもBページからAを確認できる。
- `scripts/audit-company-relations.py` をCIへ組み込み、explicit competitor配列、実効競合0件、片方向リンクを監査する。
- Run #202時点で実効競合0件は14社。直接競合が100社母集団内に存在しない可能性がある企業へ、空欄解消だけを目的とした関係は追加しない。
- 企業ページ右サイドバーは全体をsticky化し、内部スクロールに変更。目次と所属領域・最終確認日の文字がスクロール時に重ならない構造とする。1020px以下では通常配置へ戻す。
- 企業一覧検索窓: `企業名・ティッカー・製品・技術・地域を検索`
- 全文検索窓: `企業名・技術・製品・工程・地域・財務指標・リスクなどを検索`
- 全文検索は企業ページ、決算データ、製品・技術、バリューチェーン、主要拠点、財務指標、競争優位、リスクなどAtlas内情報を横断する。
- 決算更新履歴は`verifiedAt`がないレコードを`未検証`として扱い、source-linked / needs-review / verifiedを区別して表示する。
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
- continuity floor: **247 periods / 100 companies / 1,098 verified metrics / 181 FCF+Capex periods / 12 cash-flow overrides / 116 sources+policies**
- Kinsus / Unimicronを含む100社カバレッジを維持し、Kinsus / Unimicronも各2期間以上を個別回帰ゲートで保持する。
- 100社財務品質監査のJSON/Markdownが現在の履歴・override・会社分類と一致することを検査する。

## Remaining v0.4 work

**100社の複数期間カバレッジ拡張は完了。** v0.4自体はまだ完了扱いにせず、次の品質・深度改善を残す。

1. Micron Q3 FY2026、Vertiv Q2 2025 / Q2 2026、ABB Q2 2025 / Q2 2026はgross cash CapexでAtlas正規化済み。Atlas定義差ありキューは0期間。Atlas算式一致のAMD / ASML 8期間は財務値を変更せず、必要な場合だけcashFlowInputsを別PRで構造化する。
2. Capex定義未分類16期間を一次資料とcash-flow lineへ戻って再監査し、gross PP&E / productive assets / PP&E + intangible / net / broader definitionへ安全に構造化できるものだけ分類する。TSMC 3期間、Applied Materials 2期間、KLA 2期間、Analog Devices 1期間、Carrier 2期間、nVent 2期間は解消済み。
3. Kinsusなど、FCF / Capexが未収録の期間について一次資料でexact cash-Capex定義を安全に閉じられる場合のみ補完する。両方欠損66期間には単四半期CFを意図的に推定していない期間も含むため、一括補完しない。
4. 主要企業の四半期連続性を伸ばし、通期2点だけの企業で比較深度を上げる。
5. 会社間で異なるCapex / FCF / reported operating-profit定義を再監査し、比較画面で誤って同一定義と見なされないことを確認する。
6. 116件のv0.4 Source Policyを順次レビューし、v0.5の自動取得対象へ昇格可能なSourceを選別する。
7. Ajinomoto Fine-Techno FY2025の一次官報PDF等、現在source-linkedに留めている値の一次資料を確保できればverifiedへ昇格する。
8. v0.4完了条件を再監査し、履歴カバレッジだけでなくSource品質・比較可能性・欠損理由の整合性を満たした段階で完了判定する。

## Data quality policy

- 一次資料優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
