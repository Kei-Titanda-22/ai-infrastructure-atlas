# Codex Resource Rules v0.1

Company Compare の段階的な展開では、品質契約を維持しながら、調査・読取・検証の範囲を現在の作業単位へ限定する。

1. 既存 Schema、Evidence、Coverage、Freeze の契約を変更しない。
2. 対象企業では既存の構造化データを最初に使用する。
3. Web 検索、IR PDF の再取得、外部調査を行わない。
4. リポジトリ全体や長大な文書を作業開始時から全文読取しない。
5. `rg` と `rg --files` で対象を特定し、必要範囲だけを読む。
6. 同じファイルやログを理由なく繰り返し読まない。
7. 大量の HTML、JSON、build log を会話へ展開しない。
8. 編集中は focused test を使用する。
9. full validation は First batch 15社完成後の Final Acceptance で1回実施する。
10. Stage 1 では Critical Freeze Gate だけを実行する。
11. subagent を使用しない。
12. Chrome は修正前調査と最終 QA に限定する。

既存Evidenceだけで表示不能な軸がある場合は推測や自動的なSchema変更を行わず、設計判断が必要なblockerとして停止する。

