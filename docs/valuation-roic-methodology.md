# Valuation / ROIC Methodology

Status: frozen draft for v0.2 implementation — 2026-08-29

## 原則

バリュエーションは「数字が取得できること」より、Source・基準日・定義・利用条件が揃っていることを優先する。外部集約サイトの表示値をそのまま転記しない。

## PER TTM

### 定義

`基準日時点の時価総額 / 直近12か月の親会社株主帰属利益`

### ルール

- 市場価格は基準日を必須とする。
- 利益は一次財務諸表からLTMを構成する。
- 株式分割、ADR比率等を調整する必要がある場合はbasisに明記する。
- LTM利益が0以下ならPERはN/A。
- 市場価格Sourceの利用条件が `reviewed` になるまで公開値を入れない。

## PER FY1

### 定義

`基準日時点の株価 / FY1コンセンサスEPS`

または同等の時価総額ベース計算。

### ルール

- 「コンセンサス」は複数アナリスト予想を集計する提供元の値を意味する。
- 会社ガイダンスはコンセンサスの代替にしない。
- 利用条件審査済みのコンセンサスSourceがない限りN/A。
- 無料金融サイトの表示値を出典不明のまま採用しない。

## PBR

### 定義

`基準日時点の時価総額 / 直近報告期の親会社株主帰属持分`

### ルール

- 時価総額と株主資本の基準日を表示する。
- 優先株等の調整が必要な場合はbasisで明示する。
- 親会社株主帰属持分が0以下ならN/A。
- 市場価格Sourceの利用条件レビュー完了前は公開値を入れない。

## Atlas-normalized ROIC

### 基本式

`ROIC = NOPAT / Average Invested Capital`

`NOPAT = LTM Operating Profit × (1 - Normalized Effective Tax Rate)`

`Invested Capital = Equity attributable to owners + Interest-bearing debt + Lease liabilities - Cash and cash equivalents - Short-term non-operating investments`

`Average Invested Capital = (Beginning Invested Capital + Ending Invested Capital) / 2`

### 税率

原則として継続事業の実効税率を利用する。単年の特殊税効果で大きく歪む場合は、直近3年の正常年実効税率中央値を `normalized tax rate` として採用し、使用した年度と理由をbasisに明記する。

### 投下資本

- 株主資本は親会社株主帰属持分を使用する。
- 有利子負債は短期・長期を合算する。
- リース負債は会計基準上認識されているものを含める。
- 現金同等物は控除する。
- 短期投資のうち明らかに営業運転資本ではない金融資産は控除対象とし、判断をbasisに残す。
- のれんは株主資本に含まれるため原則として除外しない。買収を含む資本配分効率もROICへ反映する。

### 異常ケース

- 投下資本が0以下、または会計構造上ROICの意味が著しく弱い場合はN/Aとし、無理に数値化しない。
- REITはROICを補助指標として扱い、FFO/AFFO等の業種固有KPIを優先する。
- 金融業等を将来追加する場合は別定義を設ける。

## Provenance

ROIC計算入力は最終値だけではなく、以下の構成要素をSourceへ追跡可能にする。

- LTM operating profit
- tax-rate inputs
- beginning / ending equity
- beginning / ending interest-bearing debt
- beginning / ending lease liabilities
- beginning / ending cash and cash equivalents
- beginning / ending short-term non-operating investments

各入力は `value / currency / period / asOf / basis / sourceId` を持つ。

## 公開ゲート

1. 一次資料Source登録
2. Source Policy登録
3. 入力データ検証
4. Atlas計算
5. 異常値チェック
6. Methodologyに沿ったbasis確認
7. CI validation
8. 公開

