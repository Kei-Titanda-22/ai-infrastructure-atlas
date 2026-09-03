# 100社 Company Compare Readiness Audit v0.1

- Acceptance Review: **REVISE**
- Revised artifact validation: **PASS**
- Baseline main: `5afe410c8de549ee58fcd07a0e4de9d0df6e18af`
- Input digest: `sha256:c734a234bcbdde45b6ce5607774b6ef727227ceb266db7b409c1ef8dad47a831`
- 対象: canonical Company **100社**
- 外部調査: **NO**
- Company／Evidence／Source／Relation／Binding／Registry／Financial／UI変更: **NO**
- Company Compareへの企業追加: **NO**

## 1. 目的と対象

Frozen Company Compare Pilotを100社へ展開する前に、現行repository内のcanonical Company、Company Evidence、Shared Source、Relation、Registry、Financialだけで、安全な比較表示を構成できるかを監査した。監査は表示やデータを変更せず、不足を分類する。

Acceptance Reviewでは、旧成果物が`status=missing`だけをblocking条件としていた点を修正対象とした。分類件数は実データで再現したが、充足度と最低表示可能性を分離していなかったため判定を`REVISE`とし、本成果物へ機械検証可能な`minimumUsable`契約を追加した。

## 2. 判定方法：充足度と最低表示可能性

`status`はCoverageの網羅性、`minimumUsable`は安全なP1 Compare表示の最低条件を表す。各軸は`minimumUsableReason`、`blockingGaps`、`groundingIds`を保持する。`partial`でも直接groundingがあれば`minimumUsable=true`になり得るが、単に文章が存在するだけでは認めない。

Claimは軸専用categoryからだけ選び、`Claim → supports/context Binding → structured Locator → Shared Source`を解決する。Relation使用時も`Relation → supports Binding → structured Locator → Shared Source`を解決する。legacy prose、一般常識、企業規模、competitor配列からの推測は0件である。

Financialは正規化historyだけを使い、会社単位では1期間以上の期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを必須とする。Revenue Growthの正規化定義未収録とset単位のdefinition／period／basis互換性確認はpartial理由として残す。

Product／Technology entity IDやRelationは推測していない。6軸が既存Claimだけで説明できる場合、Registry／Relationが存在しないこと自体を不足にはしない。構造化したentity／relation表示を新たに主張する場合だけ、別change-controlでRegistry／Relationを要求する。

Readinessは`EVIDENCE_HOLD > REGISTRY_REQUIRED > RELATION_REQUIRED > DISPLAY_COPY_ONLY > READY_EXISTING_EVIDENCE`の優先順で、6軸の`minimumUsable`と構造不足から決定する。

## 3. Acceptance ReviewとReadiness分類

| Readiness class | 修正前 | 修正後 |
| --- | ---: | ---: |
| `READY_EXISTING_EVIDENCE` | 5 | 5 |
| `DISPLAY_COPY_ONLY` | 95 | 95 |
| `REGISTRY_REQUIRED` | 0 | 0 |
| `RELATION_REQUIRED` | 0 | 0 |
| `EVIDENCE_HOLD` | 0 | 0 |

## 4. 6軸の充足状況

| 軸 | complete | partial | missing | notApplicable |
| --- | ---: | ---: | ---: | ---: |
| `what`（何をしている会社か） | 99 | 1 | 0 | 0 |
| `aiRole`（AIインフラでの役割） | 5 | 95 | 0 | 0 |
| `products`（主な製品） | 100 | 0 | 0 | 0 |
| `competitivePosition`（技術・競争力） | 0 | 100 | 0 | 0 |
| `risks`（主なリスク） | 0 | 100 | 0 | 0 |
| `financialComparability`（財務比較） | 0 | 100 | 0 | 0 |

### Minimum usability

| 軸 | minimumUsable=true | minimumUsable=false |
| --- | ---: | ---: |
| `what`（何をしている会社か） | 100 | 0 |
| `aiRole`（AIインフラでの役割） | 100 | 0 |
| `products`（主な製品） | 100 | 0 |
| `competitivePosition`（技術・競争力） | 100 | 0 |
| `risks`（主なリスク） | 100 | 0 |
| `financialComparability`（財務比較） | 100 | 0 |

### 95社のDISPLAY_COPY_ONLYが成立する根拠

- 対象：**95社**
- 6軸すべて`minimumUsable=true`：**95社**
- 全軸にClaim／Relation／Financialのcore groundingあり：**95社**
- legacy prose使用：**0社**
- 日本語copy以外のblocking gap：**0社**
- Product Claimの直接投影経路あり：**95社**
- Financial会社単位minimum ready：**95社**

`DISPLAY_COPY_ONLY`は会社別準備として残るものがCompare専用日本語copyの編集レビューだけという意味である。set単位Financial compatibility gateは別途必須であり、どのsetでも全指標を表示できるという意味ではない。

## 5. 100社一覧

各軸は`status/minimumUsable`。`C=complete / P=partial / M=missing / NA=notApplicable / Y=usable / N=blocked`。

| Company ID | canonical会社名 | 日本語表示名 | Primary Layer | Readiness | 得点 | what | aiRole | products | competitive | risks | financial |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `abb` | ABB | ABB（エービービー） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `advantest` | Advantest | アドバンテスト | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `air-liquide` | Air Liquide | Air Liquide（エア・リキード） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `ajinomoto-fine-techno` | Ajinomoto Fine-Techno | 味の素ファインテクノ | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `amd` | AMD | AMD（アドバンスト・マイクロ・デバイセズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `amkor` | Amkor Technology | Amkor Technology（アムコー・テクノロジー） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `amphenol` | Amphenol | Amphenol（アンフェノール） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `analog-devices` | Analog Devices | Analog Devices（アナログ・デバイセズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `applied-materials` | Applied Materials | Applied Materials（アプライド・マテリアルズ） | Wafer Fab Equipment | `READY_EXISTING_EVIDENCE` | 9/12 (75.0%) | C/Y | C/Y | C/Y | P/Y | P/Y | P/Y |
| `aptiv` | Aptiv | Aptiv（アプティブ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `arista` | Arista Networks | Arista Networks（アリスタ・ネットワークス） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `arm` | Arm | Arm（アーム） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `ase-technology` | ASE Technology | ASE Technology（ASEテクノロジー） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `asm-international` | ASM International | ASM International（ASMインターナショナル） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `asml` | ASML | ASML（エーエスエムエル） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `asmpt` | ASMPT | ASMPT（エーエスエムピーティー） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `besi` | Besi | Besi（BEセミコンダクター・インダストリーズ） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `bosch` | Bosch | Bosch（ボッシュ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `broadcom` | Broadcom | Broadcom（ブロードコム） | Compute & Silicon | `READY_EXISTING_EVIDENCE` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `cadence` | Cadence Design Systems | Cadence（ケイデンス） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `canon` | Canon | キヤノン | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `carrier` | Carrier | Carrier（キャリア） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `ciena` | Ciena | Ciena（シエナ） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `cisco` | Cisco | Cisco（シスコ） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `coherent` | Coherent | Coherent（コヒレント） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `corning` | Corning | Corning（コーニング） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `credo` | Credo | Credo（クレド） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `denso` | DENSO | デンソー | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `digital-realty` | Digital Realty | Digital Realty（デジタル・リアルティ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `disco` | DISCO | ディスコ | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `eaton` | Eaton | Eaton（イートン） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `entegris` | Entegris | Entegris（インテグリス） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `equinix` | Equinix | Equinix（エクイニクス） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `fanuc` | FANUC | ファナック | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `fujikura` | Fujikura | フジクラ | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | P/Y | C/Y | C/Y | P/Y | P/Y | P/Y |
| `furukawa-electric` | Furukawa Electric | 古河電気工業 | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `ge-vernova` | GE Vernova | GE Vernova（GEベルノバ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `globalfoundries` | GlobalFoundries | GlobalFoundries（グローバルファウンドリーズ） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `globalwafers` | GlobalWafers | GlobalWafers（グローバルウェーハズ） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `hanmi-semiconductor` | HANMI Semiconductor | HANMI Semiconductor（ハンミ・セミコンダクター） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `hexagon` | Hexagon | Hexagon（ヘキサゴン） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `ibiden` | IBIDEN | イビデン | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `infineon` | Infineon Technologies | Infineon（インフィニオン） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `intel` | Intel | Intel（インテル） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `jcet` | JCET Group | JCET（長電科技） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `johnson-controls` | Johnson Controls | Johnson Controls（ジョンソンコントロールズ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `keyence` | KEYENCE | キーエンス | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `kinsus` | Kinsus Interconnect Technology | Kinsus（景碩科技） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `kioxia` | Kioxia Holdings | キオクシアホールディングス | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `kla` | KLA | KLA（ケーエルエー） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `kokusai-electric` | KOKUSAI ELECTRIC | KOKUSAI ELECTRIC（国際電気） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `lam-research` | Lam Research | Lam Research（ラムリサーチ） | Wafer Fab Equipment | `READY_EXISTING_EVIDENCE` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `lasertec` | Lasertec | レーザーテック | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `legrand` | Legrand | Legrand（ルグラン） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `linde` | Linde | Linde（リンデ） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `lumentum` | Lumentum | Lumentum（ルメンタム） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `marvell` | Marvell Technology | Marvell Technology（マーベル・テクノロジー） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `mediatek` | MediaTek | MediaTek（メディアテック） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `micron` | Micron Technology | Micron Technology（マイクロン・テクノロジー） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `mitsubishi-electric` | Mitsubishi Electric | 三菱電機 | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `mobileye` | Mobileye | Mobileye（モービルアイ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `monolithic-power` | Monolithic Power Systems | Monolithic Power Systems（モノリシック・パワー・システムズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `nan-ya-pcb` | Nan Ya PCB | Nan Ya PCB（南亜電路板） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `nikon` | Nikon | ニコン | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `nvent` | nVent | nVent（エヌベント） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `nvidia` | NVIDIA | NVIDIA（エヌビディア） | Compute & Silicon | `READY_EXISTING_EVIDENCE` | 9/12 (75.0%) | C/Y | C/Y | C/Y | P/Y | P/Y | P/Y |
| `nxp` | NXP Semiconductors | NXP Semiconductors（NXPセミコンダクターズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `omron` | OMRON | オムロン | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `onsemi` | onsemi | onsemi（オンセミ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `qualcomm` | Qualcomm | Qualcomm（クアルコム） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `renesas` | Renesas Electronics | ルネサス エレクトロニクス | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `resonac-holdings` | Resonac Holdings | レゾナック・ホールディングス | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `rohm` | ROHM | ローム | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `samsung-electronics` | Samsung Electronics | Samsung Electronics（サムスン電子） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `sandisk` | Sandisk | Sandisk（サンディスク） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `schneider-electric` | Schneider Electric | Schneider Electric（シュナイダーエレクトリック） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `screen-holdings` | SCREEN Holdings | SCREENホールディングス | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `seagate` | Seagate Technology | Seagate（シーゲイト） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `shin-etsu-chemical` | Shin-Etsu Chemical | 信越化学工業 | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `shinko-electric` | SHINKO Electric Industries | 新光電気工業 | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `siemens-energy` | Siemens Energy | Siemens Energy（シーメンス・エナジー） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `sk-hynix` | SK hynix | SK hynix（SKハイニックス） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `smc` | SMC | SMC | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `smic` | SMIC | SMIC（中芯国際） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `stmicroelectronics` | STMicroelectronics | STMicroelectronics（STマイクロエレクトロニクス） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `sumco` | SUMCO | SUMCO | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `sumitomo-electric` | Sumitomo Electric | 住友電気工業 | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `synopsys` | Synopsys | Synopsys（シノプシス） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `te-connectivity` | TE Connectivity | TE Connectivity（TEコネクティビティ） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `tesla` | Tesla | Tesla（テスラ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `texas-instruments` | Texas Instruments | Texas Instruments（テキサス・インスツルメンツ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `tokyo-electron` | Tokyo Electron | 東京エレクトロン | Wafer Fab Equipment | `READY_EXISTING_EVIDENCE` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `tower-semiconductor` | Tower Semiconductor | Tower Semiconductor（タワーセミコンダクター） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `trane-technologies` | Trane Technologies | Trane Technologies（トレイン・テクノロジーズ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `tsmc` | TSMC | TSMC（台湾積体電路製造） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 9/12 (75.0%) | C/Y | C/Y | C/Y | P/Y | P/Y | P/Y |
| `umc` | UMC | UMC（聯華電子） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `unimicron` | Unimicron Technology | Unimicron（欣興電子） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `vertiv` | Vertiv | Vertiv（ヴァーティブ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 9/12 (75.0%) | C/Y | C/Y | C/Y | P/Y | P/Y | P/Y |
| `western-digital` | Western Digital | Western Digital（ウエスタンデジタル） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |
| `yaskawa` | Yaskawa Electric | 安川電機 | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y |

## 6. 分類別会社一覧

### READY_EXISTING_EVIDENCE（5社）

- applied-materials — Applied Materials（アプライド・マテリアルズ）
- broadcom — Broadcom（ブロードコム）
- lam-research — Lam Research（ラムリサーチ）
- nvidia — NVIDIA（エヌビディア）
- tokyo-electron — 東京エレクトロン

### DISPLAY_COPY_ONLY（95社）

- abb — ABB（エービービー）
- advantest — アドバンテスト
- air-liquide — Air Liquide（エア・リキード）
- ajinomoto-fine-techno — 味の素ファインテクノ
- amd — AMD（アドバンスト・マイクロ・デバイセズ）
- amkor — Amkor Technology（アムコー・テクノロジー）
- amphenol — Amphenol（アンフェノール）
- analog-devices — Analog Devices（アナログ・デバイセズ）
- aptiv — Aptiv（アプティブ）
- arista — Arista Networks（アリスタ・ネットワークス）
- arm — Arm（アーム）
- ase-technology — ASE Technology（ASEテクノロジー）
- asm-international — ASM International（ASMインターナショナル）
- asml — ASML（エーエスエムエル）
- asmpt — ASMPT（エーエスエムピーティー）
- besi — Besi（BEセミコンダクター・インダストリーズ）
- bosch — Bosch（ボッシュ）
- cadence — Cadence（ケイデンス）
- canon — キヤノン
- carrier — Carrier（キャリア）
- ciena — Ciena（シエナ）
- cisco — Cisco（シスコ）
- coherent — Coherent（コヒレント）
- corning — Corning（コーニング）
- credo — Credo（クレド）
- denso — デンソー
- digital-realty — Digital Realty（デジタル・リアルティ）
- disco — ディスコ
- eaton — Eaton（イートン）
- entegris — Entegris（インテグリス）
- equinix — Equinix（エクイニクス）
- fanuc — ファナック
- fujikura — フジクラ
- furukawa-electric — 古河電気工業
- ge-vernova — GE Vernova（GEベルノバ）
- globalfoundries — GlobalFoundries（グローバルファウンドリーズ）
- globalwafers — GlobalWafers（グローバルウェーハズ）
- hanmi-semiconductor — HANMI Semiconductor（ハンミ・セミコンダクター）
- hexagon — Hexagon（ヘキサゴン）
- ibiden — イビデン
- infineon — Infineon（インフィニオン）
- intel — Intel（インテル）
- jcet — JCET（長電科技）
- johnson-controls — Johnson Controls（ジョンソンコントロールズ）
- keyence — キーエンス
- kinsus — Kinsus（景碩科技）
- kioxia — キオクシアホールディングス
- kla — KLA（ケーエルエー）
- kokusai-electric — KOKUSAI ELECTRIC（国際電気）
- lasertec — レーザーテック
- legrand — Legrand（ルグラン）
- linde — Linde（リンデ）
- lumentum — Lumentum（ルメンタム）
- marvell — Marvell Technology（マーベル・テクノロジー）
- mediatek — MediaTek（メディアテック）
- micron — Micron Technology（マイクロン・テクノロジー）
- mitsubishi-electric — 三菱電機
- mobileye — Mobileye（モービルアイ）
- monolithic-power — Monolithic Power Systems（モノリシック・パワー・システムズ）
- nan-ya-pcb — Nan Ya PCB（南亜電路板）
- nikon — ニコン
- nvent — nVent（エヌベント）
- nxp — NXP Semiconductors（NXPセミコンダクターズ）
- omron — オムロン
- onsemi — onsemi（オンセミ）
- qualcomm — Qualcomm（クアルコム）
- renesas — ルネサス エレクトロニクス
- resonac-holdings — レゾナック・ホールディングス
- rohm — ローム
- samsung-electronics — Samsung Electronics（サムスン電子）
- sandisk — Sandisk（サンディスク）
- schneider-electric — Schneider Electric（シュナイダーエレクトリック）
- screen-holdings — SCREENホールディングス
- seagate — Seagate（シーゲイト）
- shin-etsu-chemical — 信越化学工業
- shinko-electric — 新光電気工業
- siemens-energy — Siemens Energy（シーメンス・エナジー）
- sk-hynix — SK hynix（SKハイニックス）
- smc — SMC
- smic — SMIC（中芯国際）
- stmicroelectronics — STMicroelectronics（STマイクロエレクトロニクス）
- sumco — SUMCO
- sumitomo-electric — 住友電気工業
- synopsys — Synopsys（シノプシス）
- te-connectivity — TE Connectivity（TEコネクティビティ）
- tesla — Tesla（テスラ）
- texas-instruments — Texas Instruments（テキサス・インスツルメンツ）
- tower-semiconductor — Tower Semiconductor（タワーセミコンダクター）
- trane-technologies — Trane Technologies（トレイン・テクノロジーズ）
- tsmc — TSMC（台湾積体電路製造）
- umc — UMC（聯華電子）
- unimicron — Unimicron（欣興電子）
- vertiv — Vertiv（ヴァーティブ）
- western-digital — Western Digital（ウエスタンデジタル）
- yaskawa — 安川電機

### REGISTRY_REQUIRED（0社）

- 該当なし

### RELATION_REQUIRED（0社）

- 該当なし

### EVIDENCE_HOLD（0社）

- 該当なし

## 7. 主な共通不足

- Revenue Growthの正規化指標定義：100 company-axis records
- competitive-positioningのCoverageはpartialで、主要範囲を超える補足は未完了：100 company-axis records
- risksのCoverageはpartialで、主要範囲を超える補足は未完了：100 company-axis records
- 比較集合ごとのperiod／basis適合判定：100 company-axis records
- technologyのCoverageはpartialで、主要範囲を超える補足は未完了：99 company-axis records
- ai-infrastructure-roleのCoverageはpartialで、主要範囲を超える補足は未完了：95 company-axis records
- company-overviewのCoverageはpartialで、主要範囲を超える補足は未完了：1 company-axis records

## 8. 推奨first batch 15社の個別Acceptance Review

指定15社を1社ずつ再判定し、不適格会社の自動補充は行わない。Registry／Relationの要否は、既存Claimを会社別P1 copyへ直接投影する現行経路を前提に判定した。

| companyId | readinessClass | what | aiRole | products | competitive | risks | financial | 主要grounding ID | Registry | Relation | Financial会社単位 | set単位確認 | first batch | 除外理由 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |
| `amd` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `amd-overview` → `amd-overview-e1` → `sec-amd-2025-10k`<br>aiRole: `amd-ai-role` → `amd-ai-role-e1` → `sec-amd-2025-10k`<br>products: `amd-products` → `amd-products-e1` → `sec-amd-2025-10k`<br>competitivePosition: `amd-positioning` → `amd-technology` → `amd-positioning-e1` → `sec-amd-2025-10k`<br>risks: `amd-risks` → `amd-risks-e1` → `sec-amd-2025-10k`<br>financialComparability: `amd-q1-2026` → `amd-q2-2026` → `earnings-amd-2026-08-04-q2-2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `vertiv` | `DISPLAY_COPY_ONLY` | C/Y | C/Y | C/Y | P/Y | P/Y | P/Y | what: `vertiv-overview` → `vertiv-overview-e1` → `corporate-vertiv-about-2026`<br>aiRole: `vertiv-ai-role` → `vertiv-ai-role-e1` → `corporate-vertiv-about-2026`<br>products: `vertiv-products` → `vertiv-products-e1` → `corporate-vertiv-products-2026`<br>competitivePosition: `vertiv-positioning` → `vertiv-technology` → `vertiv-positioning-e1` → `corporate-vertiv-about-2026`<br>risks: `vertiv-risks` → `vertiv-risks-e1` → `corporate-vertiv-products-2026`<br>financialComparability: `vertiv-q2-2025` → `vertiv-q2-2026` → `earnings-vertiv-2026-07-29-q2-2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `tsmc` | `DISPLAY_COPY_ONLY` | C/Y | C/Y | C/Y | P/Y | P/Y | P/Y | what: `tsmc-overview` → `tsmc-overview-e1` → `corporate-tsmc-about-2026`<br>aiRole: `tsmc-ai-role` → `tsmc-ai-role-e1` → `corporate-tsmc-annual-report-2025-ch5`<br>products: `tsmc-products` → `tsmc-products-e1` → `corporate-tsmc-about-2026`<br>competitivePosition: `tsmc-competitive-positioning-gap-closure` → `tsmc-technology` → `tsmc-competitive-positioning-gap-closure-e1` → `corporate-tsmc-annual-report-2025-ch5`<br>risks: `tsmc-risks-gap-closure` → `tsmc-risks-gap-closure-e1` → `sec-tsmc-2025-20f`<br>financialComparability: `tsmc-q1-2026` → `tsmc-q2-2026` → `financial-statements-tsmc-2026-q1` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `kioxia` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `kioxia-overview` → `kioxia-overview-e1` → `ir-kioxia`<br>aiRole: `kioxia-ai-role` → `kioxia-ai-role-e1` → `ir-kioxia`<br>products: `kioxia-products` → `kioxia-products-e1` → `ir-kioxia`<br>competitivePosition: `kioxia-positioning` → `kioxia-technology` → `kioxia-positioning-e1` → `ir-kioxia`<br>risks: `kioxia-risks` → `kioxia-risks-e1` → `ir-kioxia`<br>financialComparability: `kioxia-q1-fy2027` → `kioxia-q4-fy2026` → `earnings-kioxia-2026-05-15-fy2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `amphenol` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `amphenol-overview` → `amphenol-overview-e1` → `sec-amphenol-2025-10k`<br>aiRole: `amphenol-ai-role` → `amphenol-ai-role-e1` → `sec-amphenol-2025-10k`<br>products: `amphenol-products` → `amphenol-products-e1` → `sec-amphenol-2025-10k`<br>competitivePosition: `amphenol-positioning` → `amphenol-technology` → `amphenol-positioning-e1` → `sec-amphenol-2025-10k`<br>risks: `amphenol-risks` → `amphenol-risks-e1` → `sec-amphenol-2025-10k`<br>financialComparability: `amphenol-q2-2025` → `amphenol-q2-2026` → `earnings-amphenol-2026-07-29-q2-2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `aptiv` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `aptiv-overview` → `aptiv-overview-e1` → `sec-aptiv-2025-10k`<br>aiRole: `aptiv-ai-role` → `aptiv-ai-role-e1` → `sec-aptiv-2025-10k`<br>products: `aptiv-products` → `aptiv-products-e1` → `sec-aptiv-2025-10k`<br>competitivePosition: `aptiv-positioning` → `aptiv-technology` → `aptiv-positioning-e1` → `sec-aptiv-2025-10k`<br>risks: `aptiv-risks` → `aptiv-risks-e1` → `sec-aptiv-2025-10k`<br>financialComparability: `aptiv-fy2024` → `aptiv-fy2025` → `sec-aptiv-2025-10k` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `advantest` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `advantest-overview` → `advantest-overview-e1` → `ir-advantest`<br>aiRole: `advantest-ai-role` → `advantest-ai-role-e1` → `ir-advantest`<br>products: `advantest-products` → `advantest-products-e1` → `ir-advantest`<br>competitivePosition: `advantest-positioning` → `advantest-technology` → `advantest-positioning-e1` → `ir-advantest`<br>risks: `advantest-risks` → `advantest-risks-e1` → `ir-advantest`<br>financialComparability: `advantest-q1-fy2025` → `advantest-q1-fy2026` → `earnings-advantest-2026-07-29-q1-fy2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `asm-international` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `asm-international-overview` → `asm-international-overview-e1` → `ir-asm-international`<br>aiRole: `asm-international-ai-role` → `asm-international-ai-role-e1` → `annual-report-asm-2025`<br>products: `asm-international-products` → `asm-international-products-e1` → `annual-report-asm-2025`<br>competitivePosition: `asm-international-positioning` → `asm-international-technology` → `asm-international-positioning-e1` → `annual-report-asm-2025`<br>risks: `asm-international-risks` → `asm-international-risks-e1` → `annual-report-asm-2025`<br>financialComparability: `asm-international-fy2024` → `asm-international-fy2025` → `annual-report-asm-2025` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `air-liquide` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `air-liquide-overview` → `air-liquide-overview-e1` → `ir-air-liquide`<br>aiRole: `air-liquide-ai-role` → `air-liquide-ai-role-e1` → `ir-air-liquide`<br>products: `air-liquide-products` → `air-liquide-products-e1` → `ir-air-liquide`<br>competitivePosition: `air-liquide-positioning` → `air-liquide-technology` → `air-liquide-positioning-e1` → `ir-air-liquide`<br>risks: `air-liquide-risks` → `air-liquide-risks-e1` → `ir-air-liquide`<br>financialComparability: `air-liquide-fy2024` → `air-liquide-fy2025` → `air-liquide-fy2025-performance-report` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `analog-devices` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `analog-devices-overview` → `analog-devices-overview-e1` → `filing-analog-devices-2025-fy2025-10k`<br>aiRole: `analog-devices-ai-role` → `analog-devices-ai-role-e1` → `filing-analog-devices-2025-fy2025-10k`<br>products: `analog-devices-products` → `analog-devices-products-e1` → `filing-analog-devices-2025-fy2025-10k`<br>competitivePosition: `analog-devices-positioning` → `analog-devices-technology` → `analog-devices-positioning-e1` → `filing-analog-devices-2025-fy2025-10k`<br>risks: `analog-devices-risks` → `analog-devices-risks-e1` → `filing-analog-devices-2025-fy2025-10k`<br>financialComparability: `analog-devices-q2-fy2026` → `analog-devices-q3-fy2026` → `earnings-analog-devices-2026-05-20-q2-fy2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `abb` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `abb-overview` → `abb-overview-e1` → `annual-report-abb-2025`<br>aiRole: `abb-ai-role` → `abb-ai-role-e1` → `annual-report-abb-2025`<br>products: `abb-products` → `abb-products-e1` → `annual-report-abb-2025`<br>competitivePosition: `abb-positioning` → `abb-technology` → `abb-positioning-e1` → `annual-report-abb-2025`<br>risks: `abb-risks` → `abb-risks-e1` → `annual-report-abb-2025`<br>financialComparability: `abb-q2-2025` → `abb-q2-2026` → `financial-info-abb-2026-07-16-q2` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `globalfoundries` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `globalfoundries-overview` → `globalfoundries-overview-e1` → `sec-globalfoundries-2025-20f`<br>aiRole: `globalfoundries-ai-role` → `globalfoundries-ai-role-e1` → `sec-globalfoundries-2025-20f`<br>products: `globalfoundries-products` → `globalfoundries-products-e1` → `sec-globalfoundries-2025-20f`<br>competitivePosition: `globalfoundries-positioning` → `globalfoundries-technology` → `globalfoundries-positioning-e1` → `sec-globalfoundries-2025-20f`<br>risks: `globalfoundries-risks` → `globalfoundries-risks-e1` → `sec-globalfoundries-2025-20f`<br>financialComparability: `globalfoundries-q2-2025` → `globalfoundries-q2-2026` → `earnings-globalfoundries-2026-08-04-q2-2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `micron` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `micron-overview` → `micron-overview-e1` → `sec-micron-2025-10k`<br>aiRole: `micron-ai-role` → `micron-ai-role-e1` → `sec-micron-2025-10k`<br>products: `micron-products` → `micron-products-e1` → `sec-micron-2025-10k`<br>competitivePosition: `micron-positioning` → `micron-technology` → `micron-positioning-e1` → `sec-micron-2025-10k`<br>risks: `micron-risks` → `micron-risks-e1` → `sec-micron-2025-10k`<br>financialComparability: `micron-q2-fy2026` → `micron-q3-fy2026` → `earnings-micron-2026-06-24-q3-fy2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `arista` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `arista-overview` → `arista-overview-e1` → `sec-arista-2025-10k`<br>aiRole: `arista-ai-role` → `arista-ai-role-e1` → `sec-arista-2025-10k`<br>products: `arista-products` → `arista-products-e1` → `sec-arista-2025-10k`<br>competitivePosition: `arista-positioning` → `arista-technology` → `arista-positioning-e1` → `sec-arista-2025-10k`<br>risks: `arista-risks` → `arista-risks-e1` → `sec-arista-2025-10k`<br>financialComparability: `arista-q2-2025` → `arista-q2-2026` → `earnings-arista-2026-08-04-q2-2026` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |
| `bosch` | `DISPLAY_COPY_ONLY` | C/Y | P/Y | C/Y | P/Y | P/Y | P/Y | what: `bosch-overview` → `bosch-overview-e1` → `bosch-annual-report-2025`<br>aiRole: `bosch-ai-role` → `bosch-ai-role-e1` → `bosch-annual-report-2025`<br>products: `bosch-products` → `bosch-products-e1` → `bosch-annual-report-2025`<br>competitivePosition: `bosch-positioning` → `bosch-technology` → `bosch-positioning-e1` → `bosch-annual-report-2025`<br>risks: `bosch-risks` → `bosch-risks-e1` → `bosch-annual-report-2025`<br>financialComparability: `bosch-fy2024` → `bosch-fy2025` → `bosch-annual-report-2025` | 不要 — 既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。 | 不要 — AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、新しいCompany間・Company→entity関係を主張しないため不要。 | ready — 正規化Financial historyの2期間で、期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。 | 必要 — metricDefinition／periodType／period／basis | 残す | — |

結果：指定15社中 **15社を維持**、**0社を除外**。自動補充は0社。

1. amd — AMD（アドバンスト・マイクロ・デバイセズ） — Compute & Silicon / 66.7% / `DISPLAY_COPY_ONLY`
2. vertiv — Vertiv（ヴァーティブ） — Data Center & Facilities / 75.0% / `DISPLAY_COPY_ONLY`
3. tsmc — TSMC（台湾積体電路製造） — Foundry & Logic Manufacturing / 75.0% / `DISPLAY_COPY_ONLY`
4. kioxia — キオクシアホールディングス — Memory / 66.7% / `DISPLAY_COPY_ONLY`
5. amphenol — Amphenol（アンフェノール） — Network & Optical / 66.7% / `DISPLAY_COPY_ONLY`
6. aptiv — Aptiv（アプティブ） — Physical AI / 66.7% / `DISPLAY_COPY_ONLY`
7. advantest — アドバンテスト — Test & Back-end / 66.7% / `DISPLAY_COPY_ONLY`
8. asm-international — ASM International（ASMインターナショナル） — Wafer Fab Equipment / 66.7% / `DISPLAY_COPY_ONLY`
9. air-liquide — Air Liquide（エア・リキード） — 半導体材料・基板 / 66.7% / `DISPLAY_COPY_ONLY`
10. analog-devices — Analog Devices（アナログ・デバイセズ） — Compute & Silicon / 66.7% / `DISPLAY_COPY_ONLY`
11. abb — ABB（エービービー） — Data Center & Facilities / 66.7% / `DISPLAY_COPY_ONLY`
12. globalfoundries — GlobalFoundries（グローバルファウンドリーズ） — Foundry & Logic Manufacturing / 66.7% / `DISPLAY_COPY_ONLY`
13. micron — Micron Technology（マイクロン・テクノロジー） — Memory / 66.7% / `DISPLAY_COPY_ONLY`
14. arista — Arista Networks（アリスタ・ネットワークス） — Network & Optical / 66.7% / `DISPLAY_COPY_ONLY`
15. bosch — Bosch（ボッシュ） — Physical AI / 66.7% / `DISPLAY_COPY_ONLY`

Value Chain分布：Compute & Silicon 2社 / Data Center & Facilities 2社 / Foundry & Logic Manufacturing 2社 / Memory 2社 / Network & Optical 2社 / Physical AI 2社 / Test & Back-end 1社 / Wafer Fab Equipment 1社 / 半導体材料・基板 1社

## 9. Registry／Relation追加が0件でよい理由

100社すべてでProductsは専用のEvidence-backed Claimから最低1件を直接表示できる。今回の会社別P1 copyはProduct entity横断の集計、roll-up、同義語統合、重複排除を行わないため、Registry追加は表示の前提ではない。Registry IDを推測したrecordは0件である。

AI role、Products、Competitive Positionも既存Evidence-backed Claimから直接表示できる。新しいCompany間関係やCompany→entity関係を主張せず、既存Relationの不在だけを不足扱いしないため、Relation追加は0件でよい。Relationが必要な将来表示は別change-controlとする。

## 10. Financial partialの意味

全100社は会社単位で、1期間以上の期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。一方、Revenue Growthの正規化definitionは未収録で、比較setが決まるまでdefinition／period／basis互換性を確定できない。このためCoverage statusは100社とも`partial`のまま維持する。`partial`は会社単位の最低表示不可を意味せず、set gateで`ok / caution / blocked`を理由付き判定する契約を示す。Company JSON fallback、FX換算、推測値は使用しない。

## 11. 次工程で必要な作業

1. 推奨batchについて、既存Claimを改変しない短い日本語Compare copyを人間が編集レビューする。
2. 実際の比較setごとにFinancial compatibility contractを実行し、period／basis差とRevenue Growth定義未収録を理由付きで表示する。
3. entity／relation行を新設する場合だけ、対象Claimを起点にbounded reviewし、Registry／Relation／Bindingを別PR・別change-controlで追加する。
4. Frozen UIを使う実装PRは、本監査PRのmergeとは分離する。

## 12. HARD STOP／未解決事項

- HARD STOP: **NO**
- Acceptance Reviewは`REVISE`。旧分類の件数は維持されたが、minimum usabilityと15社個別確認を成果物へ追加した。
- competitivePositionとrisksは全社で主要内容をEvidence化済みだがCoverageはpartialであり、completeへ水増ししていない。
- Registry／Relationを新たに必要とする表示主張は本監査で作っていない。未登録entity／relationを推測していない。
- Compare専用copyの実レビュー、set単位Financial判定、実装、merge、deployは次工程であり未実施。

## 監査契約

- Generator / checker: [`audit-company-compare-readiness-v01.py`](../scripts/audit-company-compare-readiness-v01.py)
- Company Evidence Close: [`company-evidence-v1-coverage-close.md`](./company-evidence-v1-coverage-close.md)
- Company Compare Pilot contract: [`company-compare-pilot-contract-v01.md`](./company-compare-pilot-contract-v01.md)
