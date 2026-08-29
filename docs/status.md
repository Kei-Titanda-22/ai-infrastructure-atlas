# AI Infrastructure Atlas Status — 2026-08-30

## Release phase

- **v0.1 — Complete**: 20社・静的データ・公開URL
- **v0.2 — Complete**: 100社・セクターマップ
- **v0.3 — Complete**: 企業比較の本格化
- **v0.4 — Next**: 決算データの時系列化
- v0.5 — 許可済みSourceのみ自動更新
- v1.0 — AI Infrastructure Atlas

## Delivery status

- [x] Public GitHub repository
- [x] GitHub Pages + GitHub Actions deployment
- [x] Live browser URL: https://kei-titanda-22.github.io/ai-infrastructure-atlas/
- [x] Constitutional validation / v0.2 baseline / v0.3 comparison validation / Astro build / Pagefind / deployment verified in CI

## Current database

- companies: **100**
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- comparison templates: 8
- verified common financial metric audits: 14
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.3 completion basis

100社から検索して最大5社を比較セットへ追加できる。比較セットはURLの `ids` パラメータへ保存し、8つの主要セクタープリセットからも呼び出せる。

共通財務指標は、値の有無だけでなく決算期間・算出基準・検証状態を確認し、各行を **比較可 / 条件注意 / 比較不能** に分類する。比較不能・注意の理由を表示し、数値セルから一次資料へ辿れる。

業種固有KPIは同一定義が2社以上に存在しない場合「参照のみ」と表示する。AI需要感応度等の主観評価は客観比較表から分離し、折りたたみの参考欄へ配置する。

GitHub Actionsのv0.3 validatorで、100社基準と比較テンプレートの企業ID・件数・重複を検証する。

## Next milestone — v0.4

1. 四半期・通期の財務履歴を企業ごとに保存
2. 売上高 / 営業利益 / 営業利益率 / FCF / Capexを時系列化
3. 数値ごとにSource / 決算期間 / 基準日 / 定義 / 検証状態を維持
4. 同一定義から自前グラフを生成
5. 決算更新履歴を追加
6. PER / PBR / ROICはSource・利用条件・定義要件を満たしたものだけ掲載

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない
