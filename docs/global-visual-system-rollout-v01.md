# Global Visual System Rollout v0.1

実施日: 2026-09-01

基準main: `97726524606eadd8da75d8fcb80f61a1c882f52d`（PR #119後）

## 結論

PR #113–#119で確定したGlobal Visual Systemを、未適用または部分適用だった公開ルートへ展開した。新しいデザインは追加せず、既存のeditorial / research-oriented表現、responsive rule、missing-state rule、用語補助、表・ヘッダーの規則を再利用した。

Company Evidence Pilot 5社、Compare、Home、Atlas、Companies、Financials、Searchは既適用として変更していない。非Pilot 95社はvisual shellのみを整え、Company Evidenceのレイアウトやclaim表示は導入していない。

## 公開ルートinventory

Astro buildの生成物を基準に、公開ルートは109件だった。

| Route family | Routes | Before classification | Rollout |
| --- | ---: | --- | --- |
| Home | 1 | A: 適用済み | 変更なし |
| Atlas | 1 | A: 適用済み | 変更なし |
| Companies | 1 | A: 適用済み | 変更なし |
| Compare | 1 | A: 適用済み | 変更なし |
| Financials | 1 | A: 適用済み | 変更なし |
| Search | 1 | A: 適用済み | 変更なし |
| Company Evidence Pilot | 5 | A: 適用済み | Freeze対象として変更なし |
| 非Pilot company detail | 95 | B: 部分適用 | visual shellのみ適用 |
| Financial updates | 1 | B: 部分適用 | typography / rule / table密度を統一 |
| Methodology | 1 | C: 未適用 | Global Visual Systemへopt-in |
| Glossary | 1 | C: 未適用 | Global Visual Systemへopt-in |
| **合計** | **109** | **A 11 / B 96 / C 2** | **B/C 98 routeを移行** |

独立した404 / utility routeは現行buildに存在しないため、対象外とした。

## Before / After

### Before

- 非Pilot company detailはsection見出しごとの色付き左罫線が残り、Pilotや全体のeditorial表現より装飾が強かった。
- Financial updatesはtoolbarとledgerが囲みとして見え、縦密度が高かった。
- Methodology / GlossaryはGlobal Visual Systemのroute scopeへ未参加だった。

### After

- 非Pilot 95社のhero、section間隔、見出し、tag link、製品行、出典行を既存visual tokenへ揃えた。
- 色付きsection左罫線を外し、major sectionの水平ruleを主体にした。
- Financial updatesのtoolbarを背景・外枠なしの編集的な区切りへ変更し、表を圧縮した。
- Methodology / Glossaryはカードを追加せず、余白と薄い水平ruleで構成した。
- 新規gradient、shadow、rounded card、badge、pillは0件。

## 変更しなかった領域

- Company Evidence Pilot 5社のUI / Claim / Evidence / Source / Priority / Status
- Compareの値、互換性判定、URL semantics、全社missing集約
- Home / Atlasの導線とグリッド
- Companiesの検索、filter、URL state、件数
- Financialsの値、期間、定義、status、primary source
- company data、financial data、competitor data、Schema

## Responsive browser matrix

実ブラウザで、Home / Atlas / Companies / Compare / Financials / Financial updates / Search / Methodology / Glossary / 非Pilot company / Pilot companyの11種を確認した。

| Viewport | Route types | document overflow | header overlap | nested disclosure |
| ---: | ---: | ---: | ---: | ---: |
| 1440px | 11/11 | 0 | 0 | 0 |
| 1280px | 11/11 | 0 | 0 | 0 |
| 1024px | 11/11 | 0 | 0 | 0 |
| 768px | 11/11 | 0 | 0 | 0 |
| 360px | 11/11 | 0 | 0 | 0 |

1024px / 360pxのchanged templateを目視し、本文と補助ラベルの階層、改行、tableの内部scroll、focus表示を確認した。読めない薄いグレー、追加card / gradient、headerの重なりは確認されなかった。

## Compare regression baseline

| Width | Container | Metric column | Company column | 5th header visible | Internal horizontal scroll | Clear-all | All-missing primary rows | Document overflow |
| ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: |
| 1280px | 1225px | 170px | 210.6px × 5 | 100% | 不要 | 表示 / 44px | 0 | 0 |
| 1024px | 969px | 170px | 159.4px × 5 | 100% | 不要 | 表示 / 44px | 0 | 0 |
| 768px | 729px | 170px | 146px × 5 | 初期viewport外 | 必要（表内のみ） | 表示 / 44px | 0 | 0 |
| 360px | 321px | 170px | 146px × 5 | 初期viewport外 | 必要（表内のみ） | 表示 / 44px | 0 | 0 |

個別解除、全解除、検索欄へのfocus return、URL更新、再追加、template再適用、全社missingの集約を確認した。

## Functional QA

- Home: stage / technology導線がCompaniesへ正しいqueryで遷移。
- Companies: 検索、layer、tag、country、複合URL state、件数表示を確認。
- Atlas: stage / technology導線を確認。
- Financials: company選択、URL state、4指標、primary source linkを確認。
- Search: Pagefind検索とNVIDIA結果を確認。
- Company: competitor link、financial linkを確認。
- Pilot 5社: rollout class非適用、Evidence marker / drawerの存在、mobile overflow 0を確認。NVIDIAでdrawer open、Escape close、triggerへのfocus returnを確認。
- Financial updates: company / record type filter、URL state、件数を確認。
- 用語補助: `AIファクトリー`の既存title、`tabindex="0"`、説明付き`aria-label`を確認。新しい用語データは追加していない。

## Validation and semantic protection

- 全validator: PASS
- Financial quality audit: PASS
- Secret scan: PASS
- Astro build: PASS（109 pages）
- Pagefind: PASS（105 pages indexed）
- `git diff --check`: PASS
- `src/data` semantic diff: 0

## 残課題と次工程

今回の範囲でFull-site Visual Rollout v0.1は完了。95社の非Pilot company detailはvisual shellのみであり、Company Evidenceのcoverage、claim、source、priority、statusは監査していない。

したがって、`Full-site Visual Rollout Complete = YES`、`Ready for 100-company Company Evidence Coverage Audit = NO`とする。次工程への移行判断は本作業に含めない。
