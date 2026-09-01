# 100-company Company Evidence Coverage Audit v0.1

- Data as of: `2026-09-01`
- Input digest: `sha256:2dd4d55b1cf961ac442e68905be6413a1955d42b21b28b9042ae9962ca7b77f3`
- Scope: 100 companies × 11 categories = 1,100 pairs
- Company Evidence enrichment: **Arm / ASML only**
- This is a coverage audit, not a Company Evaluation Score.

## Executive summary

Freeze Schema v0.2の11 Categoryを100社へ投影し、1,100 pairを機械監査した。Pilot 5社の既存Coverage Recordを維持し、Batch 01のArm / ASMLはmanifest経由のCoverage Recordを正とする。残る93社ではlegacy本文や汎用IR Sourceだけをcompleteへ昇格していない。

結果はcomplete **153**、partial **501**、not-started **446**。低CoverageはCI failureにせず、次の一次資料補強順を作るbaselineとして固定する。

## 100-company totals

| Companies | Categories | Pairs | Complete | Partial | Not-started |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 11 | 1,100 | 153 | 501 | 446 |

## Category coverage

| Category | Complete | Partial | Not-started | Direct Source | Claim + Evidence | Migration candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `company-overview` | 43 | 57 | 0 | 45 | 44 | 56 |
| `ai-infrastructure-role` | 5 | 95 | 0 | 44 | 44 | 56 |
| `products` | 44 | 56 | 0 | 44 | 44 | 56 |
| `technology` | 1 | 43 | 56 | 44 | 44 | 0 |
| `value-chain-position` | 44 | 0 | 56 | 44 | 44 | 0 |
| `manufacturing-facilities` | 13 | 5 | 82 | 18 | 14 | 0 |
| `capacity-expansion` | 3 | 6 | 91 | 9 | 9 | 0 |
| `customer-end-market` | 0 | 24 | 76 | 20 | 20 | 0 |
| `competitive-positioning` | 0 | 99 | 1 | 43 | 43 | 57 |
| `strategy` | 0 | 17 | 83 | 17 | 17 | 0 |
| `risks` | 0 | 99 | 1 | 42 | 42 | 58 |

## Missing status

| Status | Pairs |
| --- | ---: |
| `not-collected` | 433 |
| `primary-source-unchecked` | 4 |
| `not-disclosed` | 5 |
| `not-applicable` | 9 |

## Evidence maturity

| Level | Meaning | Companies |
| --- | --- | ---: |
| L0 | legacy content only | 0 |
| L1 | company-level Sources | 53 |
| L2 | category-direct Sources | 3 |
| L3 | Claim + Evidence | 0 |
| L4 | Claim + Evidence + Locator | 44 |

A/B/C/D/Eを別集計した結果：

- Company-level Sourceあり: 100 companies
- Category-direct Sourceあり: 370 pairs
- Claim-level Evidence Bindingあり: 365 pairs
- Structured Locatorあり: 365 pairs
- Freeze Schemaでそのまま移行可能: 365 pairs

## Field-level legacy provenance

| Field | Content present | Direct evidence | Claim binding | Migration candidate | Evidence gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| `summary` | 100 | 45 | 44 | 56 | 56 |
| `aiRole` | 100 | 44 | 44 | 56 | 56 |
| `products` | 100 | 44 | 44 | 56 | 56 |
| `strengths` | 100 | 43 | 43 | 57 | 57 |
| `risks` | 100 | 42 | 42 | 58 | 58 |

## Source quality

- Registry records / unique Sources: 284 / 282
- Company `sourceIds` references / resolved: 121 / 121
- Financial Source references / resolved: 124 / 124
- Orphan Source references: 0
- Company/source mismatches: 0
- Compatible duplicate Source IDs: 2
- Conflicting duplicate Source IDs: 0
- Duplicate URLs across distinct IDs: 1
- `publishedAt: null`: 260 unique Sources
- stale-ish (publishedAtがdataAsOfより730日超前): 0 unique Sources

### Locator audit

Bindings 365 / valid Locators 365 / missing 0 / invalid 0。

| Locator field | Uses |
| --- | ---: |
| `page` | 113 |
| `section` | 333 |
| `heading` | 355 |
| `table` | 1 |
| `note` | 0 |
| `anchor` | 0 |
| `quotedLabel` | 338 |

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

`amkor`, `analog-devices`, `ase-technology`, `cadence`, `canon`, `disco`, `infineon`, `mitsubishi-electric`, `monolithic-power`, `onsemi`, `qualcomm`, `siemens-energy`, `stmicroelectronics`, `synopsys`, `trane-technologies`, `umc`

PriorityはCoverage不足を主軸に、既存のAI重要度signal、複数Categoryへ使える一次Source、legacy migration候補を補助軸として決定した。会社規模・株価は使用していない。

## Priority B companies

`advantest`, `air-liquide`, `ajinomoto-fine-techno`, `amd`, `aptiv`, `arista`, `arm`, `bosch`, `broadcom`, `carrier`, `ciena`, `cisco`, `coherent`, `credo`, `denso`, `eaton`, `entegris`, `equinix`, `fanuc`, `furukawa-electric`, `ge-vernova`, `globalfoundries`, `globalwafers`, `hanmi-semiconductor`, `hexagon`, `ibiden`, `intel`, `jcet`, `johnson-controls`, `keyence`, `kinsus`, `kioxia`, `kokusai-electric`, `lam-research`, `lasertec`, `legrand`, `linde`, `marvell`, `mediatek`, `micron`, `mobileye`, `nan-ya-pcb`, `nikon`, `nvent`, `nxp`, `omron`, `renesas`, `resonac-holdings`, `rohm`, `samsung-electronics`, `sandisk`, `schneider-electric`, `screen-holdings`, `seagate`, `shin-etsu-chemical`, `shinko-electric`, `sk-hynix`, `smc`, `sumco`, `sumitomo-electric`, `tesla`, `texas-instruments`, `tokyo-electron`, `unimicron`, `western-digital`, `yaskawa`

## Priority C companies

`abb`, `amphenol`, `applied-materials`, `asm-international`, `asml`, `asmpt`, `besi`, `corning`, `digital-realty`, `fujikura`, `kla`, `lumentum`, `nvidia`, `smic`, `te-connectivity`, `tower-semiconductor`, `tsmc`, `vertiv`

## Top evidence gaps

| Category | Not-started | Partial |
| --- | ---: | ---: |
| `capacity-expansion` | 91 | 6 |
| `strategy` | 83 | 17 |
| `manufacturing-facilities` | 82 | 5 |
| `customer-end-market` | 76 | 24 |
| `technology` | 56 | 43 |
| `value-chain-position` | 56 | 0 |
| `competitive-positioning` | 1 | 99 |
| `risks` | 1 | 99 |
| `ai-infrastructure-role` | 0 | 95 |
| `company-overview` | 0 | 57 |
| `products` | 0 | 56 |

## Migration candidates

Legacy contentとcompany-level一次Sourceがあり、Claim-level Evidence Bindingが未作成のpair。直接移行を保証せず、Category・Claim type・Locatorの人手reviewを必須とする。

| Category | Candidate pairs |
| --- | ---: |
| `company-overview` | 56 |
| `ai-infrastructure-role` | 56 |
| `products` | 56 |
| `technology` | 0 |
| `value-chain-position` | 0 |
| `manufacturing-facilities` | 0 |
| `capacity-expansion` | 0 |
| `customer-end-market` | 0 |
| `competitive-positioning` | 57 |
| `strategy` | 0 |
| `risks` | 58 |

## Next recommended batch

更新後のaudit結果から、将来の一次資料補強候補を8社に限定した。この監査は次Batchを開始しない。

| Company | Reasons |
| --- | --- |
| Trane Technologies（トレイン・テクノロジーズ） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 1 broad primary Sources; Migration ease: 5 legacy-field candidates |
| UMC（聯華電子） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 5/5; Source leverage: 1 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Analog Devices（アナログ・デバイセズ） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 4/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Cadence（ケイデンス） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 4/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| キヤノン | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 4/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Infineon（インフィニオン） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 4/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| 三菱電機 | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 4/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |
| Monolithic Power Systems（モノリシック・パワー・システムズ） | Coverage gap: 6 not-started / 5 partial; AI Infrastructure importance aid: 4/5; Source leverage: 2 broad primary Sources; Migration ease: 5 legacy-field candidates |

## Company table

| Company | Maturity | Complete | Partial | Not-started | Sources | Claims | Evidence | Locators | Priority |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| ABB（エービービー） | L4 | 4 | 6 | 1 | 1 | 10 | 10 | 10 | C |
| アドバンテスト | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| Air Liquide（エア・リキード） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 味の素ファインテクノ | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| AMD（アドバンスト・マイクロ・デバイセズ） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| Amkor Technology（アムコー・テクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Amphenol（アンフェノール） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Analog Devices（アナログ・デバイセズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Applied Materials（アプライド・マテリアルズ） | L4 | 4 | 5 | 2 | 2 | 8 | 8 | 8 | C |
| Aptiv（アプティブ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Arista Networks（アリスタ・ネットワークス） | L4 | 3 | 6 | 2 | 2 | 9 | 9 | 9 | B |
| Arm（アーム） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| ASE Technology（ASEテクノロジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| ASM International（ASMインターナショナル） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| ASML（エーエスエムエル） | L4 | 4 | 7 | 0 | 2 | 11 | 11 | 11 | C |
| ASMPT（エーエスエムピーティー） | L4 | 4 | 6 | 1 | 1 | 10 | 10 | 10 | C |
| Besi（BEセミコンダクター・インダストリーズ） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| Bosch（ボッシュ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Broadcom（ブロードコム） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| Cadence（ケイデンス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| キヤノン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Carrier（キャリア） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Ciena（シエナ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Cisco（シスコ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Coherent（コヒレント） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Corning（コーニング） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Credo（クレド） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| デンソー | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Digital Realty（デジタル・リアルティ） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| ディスコ | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | A |
| Eaton（イートン） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| Entegris（インテグリス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Equinix（エクイニクス） | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| ファナック | L1 | 0 | 5 | 6 | 2 | 0 | 0 | 0 | B |
| フジクラ | L4 | 4 | 6 | 1 | 1 | 7 | 7 | 7 | C |
| 古河電気工業 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| GE Vernova（GEベルノバ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| GlobalFoundries（グローバルファウンドリーズ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| GlobalWafers（グローバルウェーハズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| HANMI Semiconductor（ハンミ・セミコンダクター） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Hexagon（ヘキサゴン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| イビデン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Infineon（インフィニオン） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Intel（インテル） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| JCET（長電科技） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Johnson Controls（ジョンソンコントロールズ） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| キーエンス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Kinsus（景碩科技） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| キオクシアホールディングス | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| KLA（ケーエルエー） | L4 | 4 | 5 | 2 | 2 | 9 | 9 | 9 | C |
| KOKUSAI ELECTRIC（国際電気） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Lam Research（ラムリサーチ） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| レーザーテック | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| Legrand（ルグラン） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Linde（リンデ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Lumentum（ルメンタム） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| Marvell Technology（マーベル・テクノロジー） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| MediaTek（メディアテック） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Micron Technology（マイクロン・テクノロジー） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| 三菱電機 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Mobileye（モービルアイ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Monolithic Power Systems（モノリシック・パワー・システムズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Nan Ya PCB（南亜電路板） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| ニコン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| nVent（エヌベント） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| NVIDIA（エヌビディア） | L4 | 4 | 4 | 3 | 4 | 7 | 7 | 7 | C |
| NXP Semiconductors（NXPセミコンダクターズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| オムロン | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| onsemi（オンセミ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| Qualcomm（クアルコム） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| ルネサス エレクトロニクス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| レゾナック・ホールディングス | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| ローム | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Samsung Electronics（サムスン電子） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| Sandisk（サンディスク） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Schneider Electric（シュナイダーエレクトリック） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| SCREENホールディングス | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Seagate（シーゲイト） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 信越化学工業 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 新光電気工業 | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Siemens Energy（シーメンス・エナジー） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| SK hynix（SKハイニックス） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| SMC | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| SMIC（中芯国際） | L4 | 5 | 6 | 0 | 1 | 11 | 11 | 11 | C |
| STMicroelectronics（STマイクロエレクトロニクス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| SUMCO | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 住友電気工業 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Synopsys（シノプシス） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| TE Connectivity（TEコネクティビティ） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Tesla（テスラ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| Texas Instruments（テキサス・インスツルメンツ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | B |
| 東京エレクトロン | L2 | 0 | 6 | 5 | 2 | 0 | 0 | 0 | B |
| Tower Semiconductor（タワーセミコンダクター） | L4 | 5 | 6 | 0 | 1 | 11 | 11 | 11 | C |
| Trane Technologies（トレイン・テクノロジーズ） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
| TSMC（台湾積体電路製造） | L4 | 5 | 3 | 3 | 2 | 8 | 8 | 8 | C |
| UMC（聯華電子） | L1 | 0 | 5 | 6 | 1 | 0 | 0 | 0 | A |
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
