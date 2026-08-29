# AI Infrastructure Atlas Status — 2026-08-30

## Release phase

- **v0.1 — Complete**: 20社・静的データ・公開URL
- **v0.2 — Complete**: 100社・セクターマップ
- **v0.3 — Next**: 企業比較の本格化
- v0.4 — 決算データの時系列化
- v0.5 — 許可済みSourceのみ自動更新
- v1.0 — AI Infrastructure Atlas

後段機能の一部は先行実装済みだが、バージョン番号は各段階の主目的と完成条件で管理する。

## Delivery status

- [x] Public GitHub repository
- [x] GitHub Pages + GitHub Actions deployment
- [x] Live browser URL: https://kei-titanda-22.github.io/ai-infrastructure-atlas/
- [x] Constitutional validation / audit validation / Astro build / Pagefind / deployment verified in CI

## Current database

- companies: **100**（v0.1 Core 20 + v0.2 Batch A〜H）
- v0.2 company target: **100 / 100 achieved**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- verified common financial metric audits: 14
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.2 completion basis

100社の静的プロフィールを、工程・技術・地域から横断検索できる公開サイトとして提供する条件を達成。各新規企業は一次情報入口を登録し、未監査の財務値は意図的に未収録としている。

Batch E: Tesla / Mobileye / Aptiv / DENSO / Bosch / KEYENCE / Yaskawa / SMC / OMRON / Hexagon

Batch F: Infineon / STMicroelectronics / NXP / Renesas / Texas Instruments / Analog Devices / Monolithic Power Systems / onsemi / ROHM / Mitsubishi Electric

Batch G: GlobalFoundries / UMC / Tower Semiconductor / SMIC / ASE Technology / Amkor / JCET / Unimicron / Kinsus / Nan Ya PCB

Batch H: Western Digital / Sandisk / Seagate / Synopsys / Cadence / Entegris / Air Liquide / Linde / Canon / Nikon

## Next milestone — v0.3

1. 比較対象3〜5社の選択UXを改善
2. 比較指標の定義・期間整合性を強制
3. セクター別比較テンプレートを追加
4. 比較不能理由を明示
5. 既存100社の静的データを壊さず維持

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 主観スコアは新規企業へ強制しない
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
