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
- [ ] v0.4 branch validation / build / deployment verification

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- normalized financial-history seed: **14 periods / 7 companies**
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.4 initial migration

`src/data/financial-history.json` を新しい時系列財務の正本として導入した。各期間に四半期/通期、期末日、通貨・単位、会計基準、一次資料、検証日を持たせ、売上高・営業利益・営業利益率・FCF・設備投資を `value / status / basis` で管理する。

初期収録は既存監査済み7社。NVIDIAはFY2024〜FY2026の通期とQ2 FY2026〜Q2 FY2027の四半期、TSMCはQ2 2025 / Q1 2026 / Q2 2026を収録し、キオクシア、SK hynix、Micron、ASML、東京エレクトロンの既存監査済み期間も移植した。

`/financials/` では企業を切り替え、四半期・通期を分離した自前SVG推移図と、一次資料・会計基準・検証状態付きの決算表を表示する。FCF / Capexは定義確認前の値を推定せず `未収録` とする。

`scripts/validate-v04.py` はSource/company対応、レコード重複、5指標スキーマ、欠損理由、verifiedAt、営業利益率再計算、既存監査済み企業の移行漏れを検査する。

## Remaining v0.4 work

1. 主要企業の四半期・通期履歴を複数期間へ拡張
2. FCF / Capexを一次資料の定義付きで収録
3. 個社ページの財務セクションから時系列履歴へ接続
4. v0.3の `?ids=` 契約を維持したまま企業比較へ履歴データを接続
5. 決算更新履歴を体系化
6. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
