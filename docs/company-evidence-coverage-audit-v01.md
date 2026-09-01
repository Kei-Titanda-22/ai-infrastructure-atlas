# 100-company Company Evidence Coverage Audit v0.1

- Data as of: `2026-09-01`
- Input digest: `sha256:c44e4768c25183609da1a8d2f65d28eb1de8f7d712c006a7071610f1f119c530`
- Scope: 100 companies × 11 categories = 1,100 pairs
- Company Evidence enrichment: **Arm / ASML only**
- This is a coverage audit, not a Company Evaluation Score.

## Executive summary

Freeze Schema v0.2の11 Categoryを100社へ投影し、1,100 pairを機械監査した。Pilot 5社の既存Coverage Recordを維持し、Batch 01のArm / ASMLはmanifest経由のCoverage Recordを正とする。残る93社ではlegacy本文や汎用IR Sourceだけをcompleteへ昇格していない。

結果はcomplete **72**、partial **516**、not-started **512**。低CoverageはCI failureにせず、次の一次資料補強順を作るbaselineとして固定する。

## 100-company totals

| Companies | Categories | Pairs | Complete | Partial | Not-started |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 11 | 1,100 | 72 | 516 | 512 |

## Category coverage

| Category | Complete | Partial | Not-started | Direct Source | Claim + Evidence | Migration candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `company-overview` | 18 | 82 | 0 | 20 | 19 | 81 |
| `ai-infrastructure-role` | 5 | 95 | 0 | 19 | 19 | 81 |
| `products` | 19 | 81 | 0 | 19 | 19 | 81 |
| `technology` | 1 | 18 | 81 | 19 | 19 | 0 |
| `value-chain-position` | 19 | 0 | 81 | 19 | 19 | 0 |
| `manufacturing-facilities` | 9 | 5 | 86 | 14 | 10 | 0 |
| `capacity-expansion` | 1 | 5 | 94 | 6 | 6 | 0 |
| `customer-end-market` | 0 | 19 | 81 | 15 | 15 | 0 |
| `competitive-positioning` | 0 | 99 | 1 | 18 | 18 | 82 |
| `strategy` | 0 | 13 | 87 | 13 | 13 | 0 |
| `risks` | 0 | 99 | 1 | 17 | 17 | 83 |

## Missing status

| Status | Pairs |
| --- | ---: |
| `not-collected` | 499 |
| `primary-source-unchecked` | 4 |
| `not-disclosed` | 5 |
| `not-applicable` | 9 |

## Evidence maturity

| Level | Meaning | Companies |
| --- | --- | ---: |
| L0 | legacy content only | 0 |
| L1 | company-level Sources | 78 |
| L2 | category-direct Sources | 3 |
| L3 | Claim + Evidence | 0 |
| L4 | Claim + Evidence + Locator | 19 |

A/B/C/D/Eを別集計した結果：

- Company-level Sourceあり: 100 companies
- Category-direct Sourceあり: 179 pairs
- Claim-level Evidence Bindingあり: 174 pairs
- Structured Locatorあり: 174 pairs
- Freeze Schemaでそのまま移行可能: 174 pairs

## Field-level legacy provenance

| Field | Content present | Direct evidence | Claim binding | Migration candidate | Evidence gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| `summary` | 100 | 20 | 19 | 81 | 81 |
| `aiRole` | 100 | 19 | 19 | 81 | 81 |
| `products` | 100 | 19 | 19 | 81 | 81 |
| `strengths` | 100 | 18 | 18 | 82 | 82 |
| `risks` | 100 | 17 | 17 | 83 | 83 |

## Source quality

- Registry records / unique Sources: 262 / 260
- Company `sourceIds` references / resolved: 121 / 121
- Financial Source references / resolved: 124 / 124
- Orphan Source references: 0
- Company/source mismatches: 0
- Compatible duplicate Source IDs: 2
- Conflicting duplicate Source IDs: 0
- Duplicate URLs across distinct IDs: 1
- `publishedAt: null`: 255 unique Sources
- stale-ish (publishedAtがdataAsOfより730日超前): 0 unique Sources

### Locator audit

Bindings 174 / valid Locators 174 / missing 0 / invalid 0。

| Locator field | Uses |
| --- | ---: |
| `page` | 58 |
| `section` | 142 |
| `heading` | 164 |
| `table` | 1 |
| `note` | 0 |
| `anchor` | 0 |
| `quotedLabel` | 147 |

## Pilot baseline

Pilot 5社はFreeze baselineを変更せず、既存55 Coverage Recordと整合する。

| Company | Complete | Partial | Not-started | Claims | Evidence | Locators | Maturity |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Applied Materials（アプライド・マテリアルズ） | 4 | 5 | 2 | 8 | 8 | 8 | L4 |
| フジクラ | 4 | 6 | 1 | 7 | 7 | 7 | L4 |
| NVIDIA（エヌビディア） | 4 | 4 | 3 | 7 | 7 | 7 | L4 |
| TSMC（台湾積体電路製造） | 5 | 3 | 3 | 8 | 8 | 8 | L4 |
| Vertiv（ヴァーティブ） | 4 | 5 | 2 | 8 | 8 | 8 | L4 |

## Priority A companies

`broadcom`, `carrier`, `ciena`, `cisco`, `coherent`, `furukawa-electric`, `globalfoundries`, `intel`, `kokusai-electric`, `lam-research`, `lasertec`, `legrand`, `lumentum`, `marvell`, `smic`, `te-connectivity`, `tower-semiconductor`

PriorityはCoverage不足を主軸に、既存のAI重要度signal、複数Categoryへ使える一次Source、legacy migration候補を補助軸として決定した。会社規模・株価は使用していない。

## Priority B companies

`advantest`, `air-liquide`, `ajinomoto-fine-techno`, `amd`, `amkor`, `analog-devices`, `aptiv`, `arista`, `arm`, `ase-technology`, `bosch`, `cadence`, `canon`, `credo`, `denso`, `disco`, `eaton`, `entegris`, `equinix`, `fanuc`, `ge-vernova`, `globalwafers`, `hanmi-semiconductor`, `hexagon`, `ibiden`, `infineon`, `jcet`, `johnson-controls`, `keyence`, `kinsus`, `kioxia`, `linde`, `mediatek`, `micron`, `mitsubishi-electric`, `mobileye`, `monolithic-power`, `nan-ya-pcb`, `nikon`, `nvent`, `nxp`, `omron`, `onsemi`, `qualcomm`, `renesas`, `resonac-holdings`, `rohm`, `samsung-electronics`, `sandisk`, `schneider-electric`, `screen-holdings`, `seagate`, `shin-etsu-chemical`, `shinko-electric`, `siemens-energy`, `sk-hynix`, `smc`, `stmicroelectronics`, `sumco`, `sumitomo-electric`, `synopsys`, `tesla`, `texas-instruments`, `tokyo-electron`, `trane-technologies`, `umc`, `unimicron`, `western-digital`, `yaskawa`

## Priority C companies

`abb`, `amphenol`, `applied-materials`, `asm-international`, `asml`, `asmpt`, `besi`, `corning`, `digital-realty`, `fujikura`, `kla`, `nvidia`, `tsmc`, `vertiv`

## Top evidence gaps

| Category | Not-started | Partial |
| --- | ---: | ---: |
| `capacity-expansion` | 94 | 5 |
| `strategy` | 87 | 13 |
| `manufacturing-facilities` | 86 | 5 |
| `customer-end-market` | 81 | 19 |
| `technology` | 81 | 18 |
| `value-chain-position` | 81 | 0 |
| `competitive-positioning` | 1 | 99 |
| `risks` | 1 | 99 |
| `ai-infrastructure-role` | 0 | 95 |
| `company-overview` | 0 | 82 |
| `products` | 0 | 81 |

## Migration candidates

Legacy contentとcompany-level一次Sourceがあり、Claim-level Evidence Bindingが未作成のpair。直接移行を保証せず、Category・Claim type・Locatorの人手reviewを必須とする。

| Category | Candidate pairs |
| --- | ---: |
| `company-overview` | 81 |
| `ai-infrastructure-role` | 81 |
| `products` | 81 |
| `technology` | 0 |
| `value-chain-position` | 0 |
| `manufacturing-facilities` | 0 |
| `capacity-expansion` | 0 |
| `customer-end-market` | 0 |
| `competitive-positioning` | 82 |
| `strategy` | 0 |
| `risks` | 83 |

## Next recommended batch

更新後のaudit結果から、将来の一次資料補強候補を8社に限定した。この監査は次Batchを開始しない。

| Company | Reasons |
| --- | --- |
| レーザーテック | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Lumentum（ルメンタム） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| SMIC（中芯国際） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| TE Connectivity（TEコネクティビティ） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Tower Semiconductor（タワーセミコンダクター） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Broadcom（ブロードコム） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 1 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Carrier（キャリア） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 1 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Ciena（シエナ） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 1 broad primary Sources; Migration ease: 5 legacy-field candidates |

## Company table

| Company | Maturity | Complete | Partial | Not-started | Sources | Claims | Evidence | Locators | Priority |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| ABB（エービービー） | L4 | 4 | 6 | 1 | 1 | 10 | 10 | 10 | C |
| アドバンテスト | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| Air Liquide（エア・リキード） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 味の素ファインテクノ | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| AMD（アドバンスト・マイクロ・デバイセズ） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| Amkor Technology（アムコー・テクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Amphenol（アンフェノール） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Analog Devices（アナログ・デバイセズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Applied Materials（アプライド・マテリアルズ） | L4 | 4 | 5 | 2 | 2 | 8 | 8 | 8 | C |
| Aptiv（アプティブ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Arista Networks（アリスタ・ネットワークス） | L4 | 3 | 6 | 2 | 2 | 9 | 9 | 9 | B |
| Arm（アーム） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| ASE Technology（ASEテクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| ASM International（ASMインターナショナル） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| ASML（エーエスエムエル） | L4 | 4 | 7 | 0 | 2 | 11 | 11 | 11 | C |
| ASMPT（エーエスエムピーティー） | L4 | 4 | 6 | 1 | 1 | 10 | 10 | 10 | C |
| Besi（BEセミコンダクター・インダストリーズ） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| Bosch（ボッシュ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Broadcom（ブロードコム） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | A |
| Cadence（ケイデンス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| キヤノン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Carrier（キャリア） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Ciena（シエナ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Cisco（シスコ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Coherent（コヒレント） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Corning（コーニング） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Credo（クレド） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| デンソー | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Digital Realty（デジタル・リアルティ） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| ディスコ | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| Eaton（イートン） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| Entegris（インテグリス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Equinix（エクイニクス） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| ファナック | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| フジクラ | L4 | 4 | 6 | 1 | 1 | 7 | 7 | 7 | C |
| 古河電気工業 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| GE Vernova（GEベルノバ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| GlobalFoundries（グローバルファウンドリーズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| GlobalWafers（グローバルウェーハズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| HANMI Semiconductor（ハンミ・セミコンダクター） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Hexagon（ヘキサゴン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| イビデン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Infineon（インフィニオン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Intel（インテル） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| JCET（長電科技） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Johnson Controls（ジョンソンコントロールズ） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| キーエンス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Kinsus（景碩科技） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| キオクシアホールディングス | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| KLA（ケーエルエー） | L4 | 4 | 5 | 2 | 2 | 9 | 9 | 9 | C |
| KOKUSAI ELECTRIC（国際電気） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Lam Research（ラムリサーチ） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | A |
| レーザーテック | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Legrand（ルグラン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Linde（リンデ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Lumentum（ルメンタム） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Marvell Technology（マーベル・テクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| MediaTek（メディアテック） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Micron Technology（マイクロン・テクノロジー） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| 三菱電機 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Mobileye（モービルアイ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Monolithic Power Systems（モノリシック・パワー・システムズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Nan Ya PCB（南亜電路板） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| ニコン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| nVent（エヌベント） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| NVIDIA（エヌビディア） | L4 | 4 | 4 | 3 | 4 | 7 | 7 | 7 | C |
| NXP Semiconductors（NXPセミコンダクターズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| オムロン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| onsemi（オンセミ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Qualcomm（クアルコム） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| ルネサス エレクトロニクス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| レゾナック・ホールディングス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| ローム | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Samsung Electronics（サムスン電子） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| Sandisk（サンディスク） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Schneider Electric（シュナイダーエレクトリック） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| SCREENホールディングス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Seagate（シーゲイト） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 信越化学工業 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 新光電気工業 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Siemens Energy（シーメンス・エナジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| SK hynix（SKハイニックス） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| SMC | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| SMIC（中芯国際） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| STMicroelectronics（STマイクロエレクトロニクス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| SUMCO | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 住友電気工業 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Synopsys（シノプシス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| TE Connectivity（TEコネクティビティ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Tesla（テスラ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Texas Instruments（テキサス・インスツルメンツ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 東京エレクトロン | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| Tower Semiconductor（タワーセミコンダクター） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Trane Technologies（トレイン・テクノロジーズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| TSMC（台湾積体電路製造） | L4 | 5 | 3 | 3 | 2 | 8 | 8 | 8 | C |
| UMC（聯華電子） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Unimicron（欣興電子） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Vertiv（ヴァーティブ） | L4 | 4 | 5 | 2 | 2 | 8 | 8 | 8 | C |
| Western Digital（ウエスタンデジタル） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 安川電機 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |

## Audit freshness and boundaries

- `python scripts/audit-company-evidence-coverage.py --write` でJSON/Markdownを再生成する。
- CIは `--check` でinput digestと完全な生成物一致を確認する。Coverageの低さ自体はfailureにしない。
- 汎用IR、決算Source、legacy本文だけではCategoryをcompleteにしない。
- Evidence shardにCoverage Recordがない会社の`not-started`理由は、dataset状態として安全な`not-collected`に限定する。`not-disclosed` / `not-applicable`は推定しない。
- Batch 01はArm / ASMLのCompany Evidenceと必要最小限のShared Source / pending Source Policyのみを追加し、company JSON、financial data、facilities、relationshipsは変更しない。
