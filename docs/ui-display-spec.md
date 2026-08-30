# UI Display Specification

AI Infrastructure Atlas の反復利用する表示要素は、ページ単位の個別調整ではなく共通トークンを基準にする。

## 1. Value-chain accents

工程色は `src/styles/ui-tokens.css` を唯一の基準とし、ホームの主要工程ラインと `/atlas/` の縦ラインで同じ色を使う。

- Demand: `#4f6f91`
- Compute: `#4f76b5`
- Memory: `#4f8b5d`
- Materials: `#a3832f`
- Manufacturing: `#a76b38`
- Backend: `#8b5aa2`
- Interconnect: `#2f8d89`
- Datacenter: `#a8742f`
- Physical: `#626b91`

全体マップの縦ラインは 6px。ホーム側はレイアウト上の線幅を独立して持てるが、色値を複製してはならない。

## 2. Financial chart readability

決算グラフは装飾より可読性を優先する。SVGは2列レイアウトで縮小されることを前提に、内部文字を通常UIより大きく定義する。

- Chart title: 16px / 750
- Period label: 18px / 750
- Value label: 18px / 650
- Trend line: 2.5
- Point radius: 5
- Point stroke: 2.5
- Axis: 1.25
- Plot padding: left/right 76, top 40, bottom 72 in the 720×270 viewBox

値ラベルには背景色のhaloを付け、折れ線と重なっても可読性を落とさない。

## 3. Financial and comparison supporting text

一次資料、期間、会計基準、定義、検証状態、比較可否は装飾的補助情報ではなく判断材料なので、極端に小さくしない。

- Dense metadata minimum: 12px
- Explanatory note: 13px
- Comparison value: 14px以上

10px級の文字は原則として新規追加しない。例外が必要な場合は、情報的重要度が低いことを明示できる要素に限定する。

## 4. Implementation rule

共通値は `src/styles/ui-tokens.css` に置く。ページ固有CSSへ色値・文字サイズを複製せず、可能な限りカスタムプロパティを参照する。

UI変更時は少なくとも以下を確認する。

1. `/` の主要工程色と `/atlas/` の工程色が一致する
2. `/financials/` の期間・値ラベルが通常閲覧倍率で判読できる
3. `/compare/` の期間・basis・verification・sourceが12px未満に落ちていない
4. Astro build / Pagefind / GitHub Pages deployが成功する
