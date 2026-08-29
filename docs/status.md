# AI Infrastructure Atlas Status — 2026-08-30

## Release phase

- **v0.1 — Complete**: 20社・静的データ・公開URL
- **v0.2 — In progress**: 100社化・セクターマップ
- v0.3 — 企業比較の本格化
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

- companies: **50**（v0.1 Core 20 + v0.2 Batch A/B/C 各10社）
- v0.2 company target: 100
- value-chain layers: 9
- value-chain stages: 9 including AI demand
- verified common financial metric audits: 14
- registered facilities: 17
- project constitution articles: 9
- real-time stock-price distribution: disabled

## v0.1 completion basis

v0.1の完成条件は「20社の静的データを公開URL上で閲覧・検索できること」。この条件は達成済み。

現在すでに存在する比較・財務・監査機能は先行実装として維持し、v0.2以降で対象企業数と品質を段階的に拡張する。

## v0.2 Batch A

AMD / Intel / Marvell Technology / Arm / Qualcomm / MediaTek / ASM International / KOKUSAI ELECTRIC / SCREEN Holdings / Lasertec

公式IR入口を確認した静的プロフィール、工程分類、技術タグ、主力製品を追加。財務数値は未監査のため意図的に未収録。

## v0.2 Batch B

Besi / ASMPT / HANMI Semiconductor / イビデン / 新光電気工業 / 味の素ファインテクノ / レゾナック・ホールディングス / 信越化学工業 / SUMCO / GlobalWafers

後工程装置、パッケージ基板、ABF、シリコンウェハ、実装材料を追加し、「半導体材料・基板」を独立レイヤーとして新設。新光電気工業と味の素ファインテクノは非上場企業としてTickerを付与しない。

## v0.2 Batch C

Coherent / Lumentum / Ciena / Cisco / Credo / 古河電気工業 / 住友電気工業 / Corning / Amphenol / TE Connectivity

光トランシーバー、コヒーレント光、AEC、光ファイバ、高速コネクタ、電力ケーブルなど、AIクラスタ内外の接続インフラを拡張。各社の公式IR入口をSource Registryへ登録し、利用条件は未審査のため手動参照限定を維持する。

## v0.2 current work

1. 50社 → 100社へ段階的に拡張
2. セクター・工程・技術タグの再整理
3. 技術名ごとに独立した検索リンクを持たせる
4. 100社規模でも企業一覧・AND検索・複合フィルターを維持
5. 新規企業にもSource / 基準日 / 定義 / 検証状態を適用
6. 既存企業の財務監査は並行して継続

追加候補群は `docs/v0.2-scope.md` で管理する。

## Data quality policy

- 一次資料を優先
- 数字にSource / 基準日 / 決算期間 / 定義 / 検証状態を付与
- 欠損を未収録 / 一次資料未確認 / 算出不能 / 非開示 / 対象外に区別
- AI分析と客観データを分離
- 主観スコアは新規企業へ強制しない
- 利用条件未確認Sourceは自動取得しない
- APIキーをGitHubへ置かない

## User input required later

該当境界に到達した時だけ確認する。

- paid/licensed market-data or consensus APIを許容するか
- 公開・有料化前の法務・利用条件再レビュー
- 主観評価を正式機能として残すか
