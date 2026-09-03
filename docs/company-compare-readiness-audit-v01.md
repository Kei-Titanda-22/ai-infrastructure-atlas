# 100社 Company Compare Readiness Audit v0.1

- Result: **PASS**
- Baseline main: `5afe410c8de549ee58fcd07a0e4de9d0df6e18af`
- Input digest: `sha256:c734a234bcbdde45b6ce5607774b6ef727227ceb266db7b409c1ef8dad47a831`
- 対象: canonical Company **100社**
- 外部調査: **NO**
- Company／Evidence／Source／Relation／Binding／Registry／Financial／UI変更: **NO**
- Company Compareへの企業追加: **NO**

## 1. 目的と対象

Frozen Company Compare Pilotを100社へ展開する前に、現行repository内のcanonical Company、Company Evidence、Shared Source、Relation、Registry、Financialだけで、安全な比較表示を構成できるかを監査した。監査は表示やデータを変更せず、不足を分類する。

## 2. 判定方法

6軸を`complete=2`、`partial=1`、`missing=0`で採点し、`notApplicable`は分母から除外した。すべてのClaimは`Claim → supports/context Binding → structured Locator → Shared Source`を解決できる場合だけ使用した。Financialは正規化historyのOperating Marginと同一period typeの売上高2期を使用し、Revenue Growthの正規化定義未収録とset単位の互換性判定をpartialとして保持した。

Product／Technology entity IDやRelationは推測していない。6軸が既存Claimだけで説明できる場合、Registry／Relationが存在しないこと自体を不足にはしない。構造化したentity／relation表示を新たに主張する場合だけ、別change-controlでRegistry／Relationを要求する。

## 3. Readiness分類

| Readiness class | 会社数 |
| --- | ---: |
| `READY_EXISTING_EVIDENCE` | 5 |
| `DISPLAY_COPY_ONLY` | 95 |
| `REGISTRY_REQUIRED` | 0 |
| `RELATION_REQUIRED` | 0 |
| `EVIDENCE_HOLD` | 0 |

## 4. 6軸の充足状況

| 軸 | complete | partial | missing | notApplicable |
| --- | ---: | ---: | ---: | ---: |
| `what`（何をしている会社か） | 99 | 1 | 0 | 0 |
| `aiRole`（AIインフラでの役割） | 5 | 95 | 0 | 0 |
| `products`（主な製品） | 100 | 0 | 0 | 0 |
| `competitivePosition`（技術・競争力） | 0 | 100 | 0 | 0 |
| `risks`（主なリスク） | 0 | 100 | 0 | 0 |
| `financialComparability`（財務比較） | 0 | 100 | 0 | 0 |

## 5. 100社一覧

`C=complete / P=partial / M=missing / NA=notApplicable`。

| Company ID | canonical会社名 | 日本語表示名 | Primary Layer | Readiness | 得点 | what | aiRole | products | competitive | risks | financial |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `abb` | ABB | ABB（エービービー） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `advantest` | Advantest | アドバンテスト | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `air-liquide` | Air Liquide | Air Liquide（エア・リキード） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `ajinomoto-fine-techno` | Ajinomoto Fine-Techno | 味の素ファインテクノ | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `amd` | AMD | AMD（アドバンスト・マイクロ・デバイセズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `amkor` | Amkor Technology | Amkor Technology（アムコー・テクノロジー） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `amphenol` | Amphenol | Amphenol（アンフェノール） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `analog-devices` | Analog Devices | Analog Devices（アナログ・デバイセズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `applied-materials` | Applied Materials | Applied Materials（アプライド・マテリアルズ） | Wafer Fab Equipment | `READY_EXISTING_EVIDENCE` | 9/12 (75.0%) | C | C | C | P | P | P |
| `aptiv` | Aptiv | Aptiv（アプティブ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `arista` | Arista Networks | Arista Networks（アリスタ・ネットワークス） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `arm` | Arm | Arm（アーム） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `ase-technology` | ASE Technology | ASE Technology（ASEテクノロジー） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `asm-international` | ASM International | ASM International（ASMインターナショナル） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `asml` | ASML | ASML（エーエスエムエル） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `asmpt` | ASMPT | ASMPT（エーエスエムピーティー） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `besi` | Besi | Besi（BEセミコンダクター・インダストリーズ） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `bosch` | Bosch | Bosch（ボッシュ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `broadcom` | Broadcom | Broadcom（ブロードコム） | Compute & Silicon | `READY_EXISTING_EVIDENCE` | 8/12 (66.7%) | C | P | C | P | P | P |
| `cadence` | Cadence Design Systems | Cadence（ケイデンス） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `canon` | Canon | キヤノン | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `carrier` | Carrier | Carrier（キャリア） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `ciena` | Ciena | Ciena（シエナ） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `cisco` | Cisco | Cisco（シスコ） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `coherent` | Coherent | Coherent（コヒレント） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `corning` | Corning | Corning（コーニング） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `credo` | Credo | Credo（クレド） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `denso` | DENSO | デンソー | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `digital-realty` | Digital Realty | Digital Realty（デジタル・リアルティ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `disco` | DISCO | ディスコ | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `eaton` | Eaton | Eaton（イートン） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `entegris` | Entegris | Entegris（インテグリス） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `equinix` | Equinix | Equinix（エクイニクス） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `fanuc` | FANUC | ファナック | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `fujikura` | Fujikura | フジクラ | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | P | C | C | P | P | P |
| `furukawa-electric` | Furukawa Electric | 古河電気工業 | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `ge-vernova` | GE Vernova | GE Vernova（GEベルノバ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `globalfoundries` | GlobalFoundries | GlobalFoundries（グローバルファウンドリーズ） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `globalwafers` | GlobalWafers | GlobalWafers（グローバルウェーハズ） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `hanmi-semiconductor` | HANMI Semiconductor | HANMI Semiconductor（ハンミ・セミコンダクター） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `hexagon` | Hexagon | Hexagon（ヘキサゴン） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `ibiden` | IBIDEN | イビデン | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `infineon` | Infineon Technologies | Infineon（インフィニオン） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `intel` | Intel | Intel（インテル） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `jcet` | JCET Group | JCET（長電科技） | Test & Back-end | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `johnson-controls` | Johnson Controls | Johnson Controls（ジョンソンコントロールズ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `keyence` | KEYENCE | キーエンス | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `kinsus` | Kinsus Interconnect Technology | Kinsus（景碩科技） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `kioxia` | Kioxia Holdings | キオクシアホールディングス | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `kla` | KLA | KLA（ケーエルエー） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `kokusai-electric` | KOKUSAI ELECTRIC | KOKUSAI ELECTRIC（国際電気） | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `lam-research` | Lam Research | Lam Research（ラムリサーチ） | Wafer Fab Equipment | `READY_EXISTING_EVIDENCE` | 8/12 (66.7%) | C | P | C | P | P | P |
| `lasertec` | Lasertec | レーザーテック | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `legrand` | Legrand | Legrand（ルグラン） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `linde` | Linde | Linde（リンデ） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `lumentum` | Lumentum | Lumentum（ルメンタム） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `marvell` | Marvell Technology | Marvell Technology（マーベル・テクノロジー） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `mediatek` | MediaTek | MediaTek（メディアテック） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `micron` | Micron Technology | Micron Technology（マイクロン・テクノロジー） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `mitsubishi-electric` | Mitsubishi Electric | 三菱電機 | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `mobileye` | Mobileye | Mobileye（モービルアイ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `monolithic-power` | Monolithic Power Systems | Monolithic Power Systems（モノリシック・パワー・システムズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `nan-ya-pcb` | Nan Ya PCB | Nan Ya PCB（南亜電路板） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `nikon` | Nikon | ニコン | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `nvent` | nVent | nVent（エヌベント） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `nvidia` | NVIDIA | NVIDIA（エヌビディア） | Compute & Silicon | `READY_EXISTING_EVIDENCE` | 9/12 (75.0%) | C | C | C | P | P | P |
| `nxp` | NXP Semiconductors | NXP Semiconductors（NXPセミコンダクターズ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `omron` | OMRON | オムロン | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `onsemi` | onsemi | onsemi（オンセミ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `qualcomm` | Qualcomm | Qualcomm（クアルコム） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `renesas` | Renesas Electronics | ルネサス エレクトロニクス | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `resonac-holdings` | Resonac Holdings | レゾナック・ホールディングス | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `rohm` | ROHM | ローム | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `samsung-electronics` | Samsung Electronics | Samsung Electronics（サムスン電子） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `sandisk` | Sandisk | Sandisk（サンディスク） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `schneider-electric` | Schneider Electric | Schneider Electric（シュナイダーエレクトリック） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `screen-holdings` | SCREEN Holdings | SCREENホールディングス | Wafer Fab Equipment | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `seagate` | Seagate Technology | Seagate（シーゲイト） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `shin-etsu-chemical` | Shin-Etsu Chemical | 信越化学工業 | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `shinko-electric` | SHINKO Electric Industries | 新光電気工業 | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `siemens-energy` | Siemens Energy | Siemens Energy（シーメンス・エナジー） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `sk-hynix` | SK hynix | SK hynix（SKハイニックス） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `smc` | SMC | SMC | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `smic` | SMIC | SMIC（中芯国際） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `stmicroelectronics` | STMicroelectronics | STMicroelectronics（STマイクロエレクトロニクス） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `sumco` | SUMCO | SUMCO | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `sumitomo-electric` | Sumitomo Electric | 住友電気工業 | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `synopsys` | Synopsys | Synopsys（シノプシス） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `te-connectivity` | TE Connectivity | TE Connectivity（TEコネクティビティ） | Network & Optical | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `tesla` | Tesla | Tesla（テスラ） | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `texas-instruments` | Texas Instruments | Texas Instruments（テキサス・インスツルメンツ） | Compute & Silicon | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `tokyo-electron` | Tokyo Electron | 東京エレクトロン | Wafer Fab Equipment | `READY_EXISTING_EVIDENCE` | 8/12 (66.7%) | C | P | C | P | P | P |
| `tower-semiconductor` | Tower Semiconductor | Tower Semiconductor（タワーセミコンダクター） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `trane-technologies` | Trane Technologies | Trane Technologies（トレイン・テクノロジーズ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `tsmc` | TSMC | TSMC（台湾積体電路製造） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 9/12 (75.0%) | C | C | C | P | P | P |
| `umc` | UMC | UMC（聯華電子） | Foundry & Logic Manufacturing | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `unimicron` | Unimicron Technology | Unimicron（欣興電子） | 半導体材料・基板 | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `vertiv` | Vertiv | Vertiv（ヴァーティブ） | Data Center & Facilities | `DISPLAY_COPY_ONLY` | 9/12 (75.0%) | C | C | C | P | P | P |
| `western-digital` | Western Digital | Western Digital（ウエスタンデジタル） | Memory | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |
| `yaskawa` | Yaskawa Electric | 安川電機 | Physical AI | `DISPLAY_COPY_ONLY` | 8/12 (66.7%) | C | P | C | P | P | P |

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

## 8. 最初に追加可能な会社

既存Pilot 5社を除外し、15社を決定論的に選定した。投資順位ではなく、readiness、6軸の解決性、Primary Layer分散だけを使用した。

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

## 9. 次工程で必要な作業

1. 推奨batchについて、既存Claimを改変しない短い日本語Compare copyを人間が編集レビューする。
2. 実際の比較setごとにFinancial compatibility contractを実行し、period／basis差とRevenue Growth定義未収録を理由付きで表示する。
3. entity／relation行を新設する場合だけ、対象Claimを起点にbounded reviewし、Registry／Relation／Bindingを別PR・別change-controlで追加する。
4. Frozen UIを使う実装PRは、本監査PRのmergeとは分離する。

## 10. HARD STOP／未解決事項

- HARD STOP: **NO**
- Revenue Growthは正規化指標定義が未収録であり、全社でFinancial軸をpartialのまま保持した。値をCompany JSONからfallbackしていない。
- competitivePositionとrisksは全社で主要内容をEvidence化済みだがCoverageはpartialであり、completeへ水増ししていない。
- Registry／Relationを新たに必要とする表示主張は本監査で作っていない。未登録entity／relationを推測していない。
- Compare専用copyの実レビュー、set単位Financial判定、実装、merge、deployは次工程であり未実施。

## 監査契約

- Generator / checker: [`audit-company-compare-readiness-v01.py`](../scripts/audit-company-compare-readiness-v01.py)
- Company Evidence Close: [`company-evidence-v1-coverage-close.md`](./company-evidence-v1-coverage-close.md)
- Company Compare Pilot contract: [`company-compare-pilot-contract-v01.md`](./company-compare-pilot-contract-v01.md)
