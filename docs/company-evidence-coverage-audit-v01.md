# 100-company Company Evidence Coverage Audit v0.1

- Data as of: `2026-09-01`
- Input digest: `sha256:a0b662c2c1538bffb0e362d2b14470b8815288df4c261f19c67546c74b72d581`
- Scope: 100 companies × 11 categories = 1,100 pairs
- Company Evidence enrichment: **Arm / ASML only**
- This is a coverage audit, not a Company Evaluation Score.

## Executive summary

Freeze Schema v0.2の11 Categoryを100社へ投影し、1,100 pairを機械監査した。Pilot 5社の既存Coverage Recordを維持し、Batch 01のArm / ASMLはmanifest経由のCoverage Recordを正とする。残る93社ではlegacy本文や汎用IR Sourceだけをcompleteへ昇格していない。

結果はcomplete **28**、partial **504**、not-started **568**。低CoverageはCI failureにせず、次の一次資料補強順を作るbaselineとして固定する。

## 100-company totals

| Companies | Categories | Pairs | Complete | Partial | Not-started |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 11 | 1,100 | 28 | 504 | 568 |

## Category coverage

| Category | Complete | Partial | Not-started | Direct Source | Claim + Evidence | Migration candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `company-overview` | 6 | 94 | 0 | 8 | 7 | 93 |
| `ai-infrastructure-role` | 5 | 95 | 0 | 7 | 7 | 93 |
| `products` | 7 | 93 | 0 | 7 | 7 | 93 |
| `technology` | 1 | 6 | 93 | 7 | 7 | 0 |
| `value-chain-position` | 7 | 0 | 93 | 7 | 7 | 0 |
| `manufacturing-facilities` | 2 | 4 | 94 | 6 | 2 | 0 |
| `capacity-expansion` | 0 | 3 | 97 | 3 | 3 | 0 |
| `customer-end-market` | 0 | 7 | 93 | 3 | 3 | 0 |
| `competitive-positioning` | 0 | 99 | 1 | 6 | 6 | 94 |
| `strategy` | 0 | 4 | 96 | 4 | 4 | 0 |
| `risks` | 0 | 99 | 1 | 5 | 5 | 95 |

## Missing status

| Status | Pairs |
| --- | ---: |
| `not-collected` | 561 |
| `primary-source-unchecked` | 4 |
| `not-disclosed` | 5 |
| `not-applicable` | 3 |

## Evidence maturity

| Level | Meaning | Companies |
| --- | --- | ---: |
| L0 | legacy content only | 0 |
| L1 | company-level Sources | 90 |
| L2 | category-direct Sources | 3 |
| L3 | Claim + Evidence | 0 |
| L4 | Claim + Evidence + Locator | 7 |

A/B/C/D/Eを別集計した結果：

- Company-level Sourceあり: 100 companies
- Category-direct Sourceあり: 63 pairs
- Claim-level Evidence Bindingあり: 58 pairs
- Structured Locatorあり: 58 pairs
- Freeze Schemaでそのまま移行可能: 58 pairs

## Field-level legacy provenance

| Field | Content present | Direct evidence | Claim binding | Migration candidate | Evidence gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| `summary` | 100 | 8 | 7 | 93 | 93 |
| `aiRole` | 100 | 7 | 7 | 93 | 93 |
| `products` | 100 | 7 | 7 | 93 | 93 |
| `strengths` | 100 | 6 | 6 | 94 | 94 |
| `risks` | 100 | 5 | 5 | 95 | 95 |

## Source quality

- Registry records / unique Sources: 258 / 256
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

Bindings 58 / valid Locators 58 / missing 0 / invalid 0。

| Locator field | Uses |
| --- | ---: |
| `page` | 11 |
| `section` | 28 |
| `heading` | 48 |
| `table` | 0 |
| `note` | 0 |
| `anchor` | 0 |
| `quotedLabel` | 32 |

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

`abb`, `amd`, `amphenol`, `arista`, `asm-international`, `asmpt`, `besi`, `broadcom`, `corning`, `credo`, `digital-realty`, `johnson-controls`, `kla`, `lasertec`, `lumentum`, `smic`, `te-connectivity`, `tower-semiconductor`

PriorityはCoverage不足を主軸に、既存のAI重要度signal、複数Categoryへ使える一次Source、legacy migration候補を補助軸として決定した。会社規模・株価は使用していない。

## Priority B companies

`advantest`, `air-liquide`, `ajinomoto-fine-techno`, `amkor`, `analog-devices`, `aptiv`, `arm`, `ase-technology`, `bosch`, `cadence`, `canon`, `carrier`, `ciena`, `cisco`, `coherent`, `denso`, `disco`, `eaton`, `entegris`, `equinix`, `fanuc`, `furukawa-electric`, `ge-vernova`, `globalfoundries`, `globalwafers`, `hanmi-semiconductor`, `hexagon`, `ibiden`, `infineon`, `intel`, `jcet`, `keyence`, `kinsus`, `kioxia`, `kokusai-electric`, `lam-research`, `legrand`, `linde`, `marvell`, `mediatek`, `micron`, `mitsubishi-electric`, `mobileye`, `monolithic-power`, `nan-ya-pcb`, `nikon`, `nvent`, `nxp`, `omron`, `onsemi`, `qualcomm`, `renesas`, `resonac-holdings`, `rohm`, `samsung-electronics`, `sandisk`, `schneider-electric`, `screen-holdings`, `seagate`, `shin-etsu-chemical`, `shinko-electric`, `siemens-energy`, `sk-hynix`, `smc`, `stmicroelectronics`, `sumco`, `sumitomo-electric`, `synopsys`, `tesla`, `texas-instruments`, `tokyo-electron`, `trane-technologies`, `umc`, `unimicron`, `western-digital`, `yaskawa`

## Priority C companies

`applied-materials`, `asml`, `fujikura`, `nvidia`, `tsmc`, `vertiv`

## Top evidence gaps

| Category | Not-started | Partial |
| --- | ---: | ---: |
| `capacity-expansion` | 97 | 3 |
| `strategy` | 96 | 4 |
| `manufacturing-facilities` | 94 | 4 |
| `customer-end-market` | 93 | 7 |
| `technology` | 93 | 6 |
| `value-chain-position` | 93 | 0 |
| `competitive-positioning` | 1 | 99 |
| `risks` | 1 | 99 |
| `ai-infrastructure-role` | 0 | 95 |
| `company-overview` | 0 | 94 |
| `products` | 0 | 93 |

## Migration candidates

Legacy contentとcompany-level一次Sourceがあり、Claim-level Evidence Bindingが未作成のpair。直接移行を保証せず、Category・Claim type・Locatorの人手reviewを必須とする。

| Category | Candidate pairs |
| --- | ---: |
| `company-overview` | 93 |
| `ai-infrastructure-role` | 93 |
| `products` | 93 |
| `technology` | 0 |
| `value-chain-position` | 0 |
| `manufacturing-facilities` | 0 |
| `capacity-expansion` | 0 |
| `customer-end-market` | 0 |
| `competitive-positioning` | 94 |
| `strategy` | 0 |
| `risks` | 95 |

## Next recommended batch

更新後のaudit結果から、将来の一次資料補強候補を8社に限定した。この監査は次Batchを開始しない。

| Company | Reasons |
| --- | --- |
| ASM International（ASMインターナショナル） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Corning（コーニング） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Credo（クレド） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Digital Realty（デジタル・リアルティ） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Johnson Controls（ジョンソンコントロールズ） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| KLA（ケーエルエー） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| レーザーテック | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Lumentum（ルメンタム） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |

## Company table

| Company | Maturity | Complete | Partial | Not-started | Sources | Claims | Evidence | Locators | Priority |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| ABB（エービービー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| アドバンテスト | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| Air Liquide（エア・リキード） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 味の素ファインテクノ | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| AMD（アドバンスト・マイクロ・デバイセズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Amkor Technology（アムコー・テクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Amphenol（アンフェノール） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Analog Devices（アナログ・デバイセズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Applied Materials（アプライド・マテリアルズ） | L4 | 4 | 5 | 2 | 2 | 8 | 8 | 8 | C |
| Aptiv（アプティブ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Arista Networks（アリスタ・ネットワークス） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | A |
| Arm（アーム） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| ASE Technology（ASEテクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| ASM International（ASMインターナショナル） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| ASML（エーエスエムエル） | L4 | 4 | 7 | 0 | 2 | 11 | 11 | 11 | C |
| ASMPT（エーエスエムピーティー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Besi（BEセミコンダクター・インダストリーズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Bosch（ボッシュ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Broadcom（ブロードコム） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | A |
| Cadence（ケイデンス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| キヤノン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Carrier（キャリア） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Ciena（シエナ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Cisco（シスコ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Coherent（コヒレント） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Corning（コーニング） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Credo（クレド） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| デンソー | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Digital Realty（デジタル・リアルティ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| ディスコ | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| Eaton（イートン） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| Entegris（インテグリス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Equinix（エクイニクス） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| ファナック | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| フジクラ | L4 | 4 | 6 | 1 | 1 | 7 | 7 | 7 | C |
| 古河電気工業 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| GE Vernova（GEベルノバ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| GlobalFoundries（グローバルファウンドリーズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| GlobalWafers（グローバルウェーハズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| HANMI Semiconductor（ハンミ・セミコンダクター） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Hexagon（ヘキサゴン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| イビデン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Infineon（インフィニオン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Intel（インテル） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| JCET（長電科技） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Johnson Controls（ジョンソンコントロールズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| キーエンス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Kinsus（景碩科技） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| キオクシアホールディングス | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| KLA（ケーエルエー） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | A |
| KOKUSAI ELECTRIC（国際電気） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Lam Research（ラムリサーチ） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| レーザーテック | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Legrand（ルグラン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Linde（リンデ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Lumentum（ルメンタム） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Marvell Technology（マーベル・テクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
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
