# 財務データ監査 — 2026-08-30

## 監査方針

共通財務指標は、値だけでなく、決算期間、基準日、定義・算式、一次資料、検証状態を一体として管理する。

検証状態:
- `verified`: 一次資料の元数値と算式を再確認済み。
- `source-linked`: 一次資料Source IDはあるが、Atlas側で再計算・再照合を完了していない。
- `needs-review`: 出典または定義の再確認が必要。

欠損理由:
- `not-collected`: 未収録
- `primary-source-unchecked`: 一次資料未確認
- `not-calculable`: 算出不能
- `not-disclosed`: 非開示
- `not-applicable`: 対象外

## キオクシアホールディングス FY2027 Q1

一次資料: 2027年3月期 第1四半期決算短信〔IFRS〕（連結）、2026-07-31。
対象期間: 2026-04-01〜2026-06-30。

### 営業利益率
- 売上収益: 1,767,117百万円
- IFRS営業利益: 1,270,017百万円
- 算式: 1,270,017 / 1,767,117 × 100
- 結果: 71.869...% → 71.9%
- 判定: `verified`

Non-GAAP営業利益1,326,216百万円は使用していない。

### 売上高成長率（前年同期比）
- 当期売上収益: 1,767,117百万円
- 前年同期売上収益: 342,799百万円
- 算式: (1,767,117 / 342,799 - 1) × 100
- 結果: 415.496...% → 415.5%
- 判定: `verified`

数値は異常値に見えるが、決算短信の開示値および会社のQ1高収益率ガイダンスと整合するため、誤抽出として修正しない。

## 共通財務監査 第1バッチ

以下の6社について、既存の営業利益率・売上高成長率を各社の公式決算資料に戻って再確認した。いずれも既存表示値と整合したため、数値そのものは変更せず `metric-audits.json` に元数値・算式を登録して `verified` に昇格した。

| 企業 | 対象期間 | 営業利益率 | 売上高成長率 | 判定 |
| --- | --- | ---: | ---: | --- |
| NVIDIA | Q2 FY2027 | 66.2% | 106.0% | verified |
| TSMC | Q2 2026 | 60.3% | 36.0% | verified |
| SK hynix | Q2 2026 | 76.0% | 257.0% | verified |
| Micron Technology | Q3 FY2026 | 80.4% | 345.7% | verified |
| ASML | Q2 2026 | 37.1% | 21.2% | verified |
| 東京エレクトロン | FY2027 Q1 | 28.9% | 33.3% | verified |

### 監査時の注意点

- NVIDIAはGAAP operating incomeとrevenueから営業利益率を再計算した。
- TSMCはTIFRS consolidatedのnet revenueとincome from operationsを使用した。
- SK hynixは元数値からの再計算では約76.33%だが、会社資料が整数76%で表示しているためAtlas表示も会社開示の丸めに合わせた。
- MicronはGAAP operating income / revenueを用いた。
- ASMLは公式Q2 Investor Relations Presentation内のUS GAAP財務表を使用した。既存Source IDをそのまま使用し、同資料に掲載されたtotal net salesとincome from operationsを根拠とした。
- 東京エレクトロンは日本基準の営業利益 / 売上高を使用した。

この監査は会社プロフィール全体のレビューを意味しないため、企業データの `lastReviewed` は財務2項目だけを理由に更新しない。
