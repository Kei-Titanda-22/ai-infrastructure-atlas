# Global Visual System v0.1

- Status: Pilot / Correction Pass
- Applies to: Home / Companies / Atlas / Financials / Search opt-in routes。Correction Passのreading width、terminology、missing-data、Side rail規則はcompany pageの表示層にも適用
- Does not apply to: Compare、その他未採択routeのvisual rollout
- Semantic change: 0

## 1. Design position

AI Infrastructure Atlasは、AI SaaSの操作画面ではなく、企業リサーチDB、証券リサーチ、産業アトラスの中間として表示する。

1. Typography first: 見出し、本文、注記、数値の階層を先に作る。
2. Rules before containers: 区切りは原則として余白と水平ruleを使い、全周borderを常用しない。
3. Data density with legibility: 情報を隠して短く見せず、表・工程・出典の意味単位を維持して密度を整える。
4. Color carries meaning: 工程色、positive/negative、link、focus以外へ装飾色を増やさない。
5. Interaction stays explicit: controlは44px、focus-visibleを維持し、hoverだけに意味を依存しない。
6. Mobile is a representation, not a shrink: 横長構造は役割に応じて内部scroll、2列、段組解除を選ぶ。

## 2. Pilot tokens

既存tokenを置き換えず、opt-inされたmain scopeで次を使用する。

| Token | Value | Purpose |
|---|---|---|
| `--max` | `1180px` | research pageの本文最大幅 |
| `--visual-secondary` / Pilot `--muted` | `#3f4850` | 読む必要があるsecondary text / label |
| `--visual-metadata` | `#59616a` | timestamp、footnote、non-critical provenance |
| `--visual-rule` | `#cfd4d8` | section / data stripの区切り |
| `--visual-control-height` | `44px` | touch / keyboard target |
| `--visual-space-section` | desktop `32px`, mobile `26px` | major section rhythm |

既存の`--page`、`--surface`、`--text`、`--border`、`--link`、`--focus`、`--positive`、`--negative`、font familyは再定義しない。global `text-contrast.css`の`--muted: var(--text)`はPilot main内だけで解除し、header、footer、Company Evidence、Compareへ波及させない。

## 3. Typography

- Page title: `clamp(29px, 3.4vw, 39px)`、line-heightは既存値を利用。
- Lead: desktop 15px / 1.72、mobile 14px / 1.65、最大82ch。
- Eyebrow: 既存mono 11pxを維持。badge化しない。
- Numbers: monoまたは数値セルに`tabular-nums`。
- Secondary text: `#3f4850`。section label、category、stage description、Snapshot label、filter labelへ使う。
- Muted metadata: `#59616a`。timestamp、footnote metadata、non-critical provenance、disabled stateだけに使う。
- Research本文のmeasureは最大`48rem`を基本とし、wideで長すぎず、mediumでSide railに圧縮されない幅を優先する。

## 4. Layout and spacing

- Main content max widthは1180px。header/footer幅は全siteで従来どおりとし、route間のnavigation jumpを作らない。
- Page headはdesktop 23px / 16px、mobile 19px / 14px。
- Major sectionは32px、mobile 26pxを基本とする。
- 空白は情報階層のために使う。cardの外周余白として反復させない。
- section ruleはmajor boundary、表のheader/row、figureの上下に限定する。

## 5. Containers

### Allowed

- 正式なtableの外周またはscroll boundary。
- value-chainの工程境界。
- chartの上下rule。
- 入力control自身の1px border。
- Evidence drawer / dialogの既存境界。

### Avoid

- 同形KPIを各々cardにすること。
- toolbar、selector、説明文を白い全周frameへ入れること。
- large rounded card、pill、badge群、gradient、decorative shadow。
- quote、warning、AI insightに見える装飾左線を通常説明へ付けること。

## 6. Links and controls

- 通常本文linkは既存link色を維持する。
- 工程内の高密度linkは通常時`#345774`・underlineなし、hover/focus-visibleでunderlineを表示する。
- Primary actionはPilotではink `#26313a`、hover `#101820`。操作の重要度は保つがSaaS CTAの鮮色面を避ける。
- input / select / buttonは44px以上。label、aria-label、native semanticsを維持する。
- focus-visibleは既存3px focus ringを維持する。

## 7. Page archetypes

### Home: entry + status + map + log

- openingは検索とDB状況をfirst screen内で把握できる高さへ圧縮。
- value chainは工程titleの可読幅を8列固定より優先する。`>= 1360px`は8列、`821–1359px`は4列×2行、`<= 820px`は2列。360pxも読みやすい2列とし、内部horizontal scrollを作らない。
- 01–08の順序、リンク、filter contractを維持し、各工程に短い表示用descriptorを付ける。descriptorはvalue-chain dataへ混ぜない。
- 工程色はsemantic accentとして維持。

### Company page: research + compact snapshot

- `>= 1200px`だけMainとSide railを横配置する。Mainは`minmax(0, 1fr)`、Side railは`280–300px`を目安とする。
- `< 1200px`ではSnapshotをHero直下・Research前へstackし、Main本文の幅を奪わない。
- sticky要素の優先順位は`dialog (100) > site header (30) > page nav (20) > sticky rail (10) > normal content`とする。native modal dialogのtop layerも維持する。

### Companies: filter row + research table

- toolbarは上下ruleのcontrol row。
- table headerはshadowを使わずborderで固定位置を示す。
- 検索、layer、country、technology、stage、tag、URL restore contractは変更しない。
- 100行の正式表は仮想card listへ変換しない。

### Atlas: explanatory map

- noteはquote/calloutにせず上下ruleの編集注記。
- 工程の左線は3pxのsemantic accent。
- desktopは3列、mobileは120px / 可変幅の2列と、全幅2列link群へ再配置。
- mobile document overflowと内部map scrollを作らない。

### Financials: data strip + selector + figures + table

- summaryは5分割data strip。
- selectorは上下ruleのcontrol row。
- chartはfull-frame cardではなくruled figure。
- FinancialChartのSVG height、plot、axis、data、period、tooltip、計算、missingnessを変更しない。

### Search: query + status + bibliography-like result list

- page headを圧縮。
- queryは1つの入力と1つのaction。
- empty / loading / countは静かなstatus row。
- resultはcard gridにせずborder-separated list。

## 8. Mobile rules

- 360 × 800でdocument overflow 0。
- control height 44px以上。
- Homeの工程は2列representationとし、工程gridのhorizontal scrollを作らない。
- CompaniesとFinancialsの正式表は既存の`.table-scroll`内だけでscroll可能。document自体を拡張しない。
- Atlasはscrollに逃がさずresponsive representationへ変更。
- reduced motion contractを維持する。

## 9. Accessibility and semantic contracts

- native table、form、label、heading order、dialogを維持。
- focus-visible、Escape、focus return、Evidence 2-click contractを維持。
- 色だけでactive/filter/statusを伝えない。
- muted textは通常本文より弱くしてよいが、背景`#f6f6f3` / `#fff`上で可読な濃度を使う。
- Claim本文、Evidence本文、Source本文、data attributes、URLs、source markerをpresentation都合で変えない。短い表示用descriptor、terminology annotation、missing指標の集約表記はこのCorrection Passで許可した説明UIに限定する。

### Display terminology helper

- Company Research内の専門語はClaim本文を書き換えず、最初の出現だけ`<abbr>`で意味を確認可能にする。
- `title`、説明を含む`aria-label`、`tabindex="0"`を持たせ、keyboardとscreen readerで取得できるようにする。
- desktopはcompact inline tooltip、360pxではviewport内の固定注記として表示し、document overflowを発生させない。
- dictionaryはSchema、Source、claim dataから分離したpresentation helperとする。badge、pill、icon、巨大tooltip cardは使わない。

### Missing-data presentation

- missingである事実は保持するが、primary contentより目立たせない。
- 値がある指標だけをprimary KPI tableへ表示する。値がないPER、予想PER、PBR等はprimary tableから除外し、`データ品質・収録状況` disclosureで一覧化する。
- Valuation指標が全件missingなら空groupを表示しない。一部取得済みなら取得済み指標だけを表示する。
- underlying value、missing state、source、status、Schemaは変更しない。nested disclosureは作らない。

## 10. Correction Pass measurements

公開PR #114版をBefore、Correction Passのlocal buildをAfterとして計測した。

| Check | Before | After |
|---|---:|---:|
| Home title wrap count / 1440px | 1 | 0 |
| Home title wrap count / 1024px | 4 | 0 |
| Home stage average width / 1280px | 147px | 295px |
| Home stage grid / 1280px | 8列×1行 | 4列×2行 |
| Home stage grid / 360px | 横scroll内8列 | 2列×4行 |
| NVIDIA Main / Rail width / 1280px | 785px / 392px | 885px / 300px |
| NVIDIA Main / Rail width / 1024px | 614px / 307px、横配置 | 969px / 969px、stack |
| Pilot muted computed color | `rgb(89, 97, 106)` | `rgb(63, 72, 80)` |
| NVIDIA primary missing KPI rows | 3 | 0 |
| document overflow / tested widths | 0 | 0 |
| header overlap | 0 | 0 |
| nested disclosure | 0 | 0 |

QA widthsは1440 / 1280 / 1024 / 768 / 360px。Home、Companies、Atlas、Financials、Search、Pilot 5社、Kioxia、Advantestを確認した。

## 11. Rollout gate

Full-siteへ展開するには次を別PR前に満たす。

1. 公開Pilot 5ページのdesktop/mobile review完了。
2. Compare、methodology、glossary、financial updates、non-Pilot companyのarchetype別監査。
3. pageごとに変更対象と非対象を明記。
4. semantic diff 0、全validator、financial audit、secret scan、Astro/Pagefind、browser functional QA。
5. Company Evidence Freeze validatorとEvidence interaction回帰。

この文書はFull-site rolloutまたはCompany Evidence 100-company rolloutの承認ではない。
