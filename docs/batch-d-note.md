# v0.2 Batch D — データセンター・電力・冷却

## 追加企業

Schneider Electric / Digital Realty / ABB / Siemens Energy / GE Vernova / Johnson Controls / Trane Technologies / Carrier / nVent / Legrand

## 追加範囲

- データセンター運営・コロケーション
- 受配電・UPS・開閉装置・変圧器
- 系統・発電インフラ
- チラー・HVAC・建物制御
- 液冷・CDU・ラック電源
- PDU・バスウェイ・ラック・構内配線

## Source方針

各社の公式Investor Relations入口をSource Registryへ登録した。利用条件は未審査のため `pending / manual-reference-only-until-reviewed` を維持し、自動取得には使用しない。

## 財務データ

Batch D追加時点では財務数値を収録しない。各社について決算期間・会計基準・指標定義を確認した後、別の財務監査バッチで追加する。

特にDigital RealtyはREITであり、一般事業会社とPER・ROIC等を機械的に比較しない。FFO/AFFO等のREIT固有指標はv0.3以降の比較設計で別途扱う。

## 分類上の注意

Siemens Energy、GE Vernova、ABBはデータセンター施設内設備だけでなく、発電・送電・変電など上流の電力供給能力にも関与する。現在は既存URL・分類体系を壊さないため `Data Center & Facilities` に配置し、技術タグで `電力系統インフラ / 変圧器 / 開閉装置 / 発電設備` を分離する。
