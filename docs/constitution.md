# AI Infrastructure Atlas — Project Constitution

**Status:** Binding project governance rules  
**Adopted:** 2026-08-29  
**Applies to:** research, data ingestion, UI, charts, automation, deployment, and future commercialization.

この文書は、AI Infrastructure Atlas における実装上の便宜・開発速度・機能要望より上位に置く。設計判断が本憲法と衝突する場合は、本憲法を優先する。

## Article 1 — Primary-source first

企業IR、公的機関、業界団体を一次情報源とする。二次情報は探索・補助説明には利用できるが、重要な事実・財務数値・KPIの最終根拠には原則として用いない。

## Article 2 — Provenance for every number

客観的な数値は、少なくとも以下を持たなければ公開データとして扱わない。

- `sourceId` — 根拠となるSource
- `asOf` — 基準日または取得時点
- `definitionId` — Atlas内での定義
- 必要に応じて `period` / `basis` / `unit`

値が未確認の場合は `null` / `N/A` とし、推測値や便宜的な0で埋めない。

分析スコアも数値であるため、客観データと混同しない形で `assessmentSource`、`asOf`、`definitionId` を持たせる。

## Article 3 — No unauthorized republication

他社の文章・図表・スクリーンショットは原則転載しない。必要な内容は事実を抽出し、Atlas独自の文章・表・図として再構成する。引用が必要な場合は必要最小限とし、出典と利用条件を確認する。

## Article 4 — Charts are generated in-house

グラフ・比較表・可視化は、Sourceが明示された数値データからAtlas側で生成する。第三者作成チャートの画像転載を標準手段にしない。

## Article 5 — No real-time stock-price distribution

リアルタイム株価配信は実装しない。市場データを扱う場合はスナップショットまたは遅延・期末等の明確な基準日付きデータとして扱い、配信ライセンス上の権利を別途確認する。

## Article 6 — Separate facts from AI analysis

客観データとAI/人間による分析・推定・評価を別レイヤーとして保存・表示する。自動更新処理は、人間がレビューした強み・リスク・最終評価を上書きしてはならない。

## Article 7 — Source terms are data

各Sourceについて、利用条件・自動取得可否・再配布可否・商用利用可否・帰属表示要件・最終確認日をSource Policy Registryで管理する。

利用条件が未確認のSourceは `pending` とし、自動取得・再配布・商用利用を許可済みと推定しない。

## Article 8 — Secrets never enter Git

APIキー、アクセストークン、秘密鍵、認証Cookieその他の秘密情報をGitHubリポジトリへ保存しない。必要になった場合はGitHub Actions Secrets等の秘密管理機構を使い、ローカルではGit管理外の環境変数を使用する。

## Article 9 — Legal review before publication/commercialization

公開範囲を広げる、有料化する、個人情報を扱う、投資判断支援機能を強める、または市場データの提供形態を変更する段階で、少なくとも以下を再レビューする。

- 金融商品取引法その他の金融関連規制
- 特定商取引法
- 個人情報保護・プライバシー対応
- 利用するデータ/API/コンテンツのライセンス・契約条件

この条項は現時点で法的適合性を保証するものではなく、**再審査を必須化するゲート**である。

## Enforcement

本憲法を実装へ反映するため、v0.1では以下を行う。

1. `src/data/source-policies.json` でSource利用条件を管理する。
2. `src/data/metric-definitions.json` で数値定義を一元管理する。
3. 客観数値に `sourceId / asOf / definitionId` を要求する。
4. 分析スコアに `assessmentSource / asOf / definitionId` を要求する。
5. `scripts/validate-data.py` でSource Policyと数値メタデータを検証する。
6. `.gitignore` で秘密情報ファイルを除外する。
7. CIはデータ検証に成功しない限りデプロイしない。

## Change control

この9原則の削除・緩和は通常のUI変更やデータ追加と同列に扱わない。変更する場合は、理由・影響範囲・変更日を明示してこの文書を更新する。
