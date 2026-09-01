# 100-company Company Evidence Coverage Audit v0.1

- Data as of: `2026-09-01`
- Input digest: `sha256:f70e085f466803c0fc2d5c685a86115d11b5a2768f759211687eb3f1fa2608f0`
- Scope: 100 companies × 11 categories = 1,100 pairs
- Company Evidence enrichment: **Arm / ASML only**
- This is a coverage audit, not a Company Evaluation Score.

## Executive summary

Freeze Schema v0.2の11 Categoryを100社へ投影し、1,100 pairを機械監査した。Pilot 5社の既存Coverage Recordを維持し、Batch 01のArm / ASMLはmanifest経由のCoverage Recordを正とする。残る93社ではlegacy本文や汎用IR Sourceだけをcompleteへ昇格していない。

結果はcomplete **321**、partial **442**、not-started **337**。低CoverageはCI failureにせず、次の一次資料補強順を作るbaselineとして固定する。

## 100-company totals

| Companies | Categories | Pairs | Complete | Partial | Not-started |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 11 | 1,100 | 321 | 442 | 337 |

## Category coverage

| Category | Complete | Partial | Not-started | Direct Source | Claim + Evidence | Migration candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `company-overview` | 99 | 1 | 0 | 100 | 100 | 0 |
| `ai-infrastructure-role` | 5 | 95 | 0 | 100 | 100 | 0 |
| `products` | 100 | 0 | 0 | 100 | 100 | 0 |
| `technology` | 1 | 99 | 0 | 100 | 100 | 0 |
| `value-chain-position` | 100 | 0 | 0 | 100 | 100 | 0 |
| `manufacturing-facilities` | 13 | 2 | 85 | 18 | 14 | 0 |
| `capacity-expansion` | 3 | 6 | 91 | 9 | 9 | 0 |
| `customer-end-market` | 0 | 24 | 76 | 20 | 20 | 0 |
| `competitive-positioning` | 0 | 99 | 1 | 99 | 99 | 1 |
| `strategy` | 0 | 17 | 83 | 17 | 17 | 0 |
| `risks` | 0 | 99 | 1 | 98 | 98 | 2 |

## Missing status

| Status | Pairs |
| --- | ---: |
| `not-collected` | 324 |
| `primary-source-unchecked` | 4 |
| `not-disclosed` | 5 |
| `not-applicable` | 9 |

## Evidence maturity

| Level | Meaning | Companies |
| --- | --- | ---: |
| L0 | legacy content only | 0 |
| L1 | company-level Sources | 0 |
| L2 | category-direct Sources | 0 |
| L3 | Claim + Evidence | 0 |
| L4 | Claim + Evidence + Locator | 100 |

A/B/C/D/Eを別集計した結果：

- Company-level Sourceあり: 100 companies
- Category-direct Sourceあり: 761 pairs
- Claim-level Evidence Bindingあり: 757 pairs
- Structured Locatorあり: 757 pairs
- Freeze Schemaでそのまま移行可能: 757 pairs

## Field-level legacy provenance

| Field | Content present | Direct evidence | Claim binding | Migration candidate | Evidence gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| `summary` | 100 | 100 | 100 | 0 | 0 |
| `aiRole` | 100 | 100 | 100 | 0 | 0 |
| `products` | 100 | 100 | 100 | 0 | 0 |
| `strengths` | 100 | 99 | 99 | 1 | 1 |
| `risks` | 100 | 98 | 98 | 2 | 2 |

## Source quality

- Registry records / unique Sources: 303 / 301
- Company `sourceIds` references / resolved: 121 / 121
- Financial Source references / resolved: 124 / 124
- Orphan Source references: 0
- Company/source mismatches: 0
- Compatible duplicate Source IDs: 2
- Conflicting duplicate Source IDs: 0
- Duplicate URLs across distinct IDs: 1
- `publishedAt: null`: 261 unique Sources
- stale-ish (publishedAtがdataAsOfより730日超前): 0 unique Sources

### Locator audit

Bindings 757 / valid Locators 757 / missing 0 / invalid 0。

| Locator field | Uses |
| --- | ---: |
| `page` | 155 |
| `section` | 725 |
| `heading` | 747 |
| `table` | 1 |
| `note` | 0 |
| `anchor` | 0 |
| `quotedLabel` | 730 |

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

`advantest`, `broadcom`, `carrier`, `ciena`, `cisco`, `coherent`, `intel`, `lam-research`, `legrand`, `marvell`, `micron`, `nvent`, `sandisk`, `schneider-electric`, `trane-technologies`, `umc`

PriorityはCoverage不足を主軸に、既存のAI重要度signal、複数Categoryへ使える一次Source、legacy migration候補を補助軸として決定した。会社規模・株価は使用していない。

## Priority B companies

`air-liquide`, `ajinomoto-fine-techno`, `amd`, `amkor`, `analog-devices`, `aptiv`, `arista`, `arm`, `ase-technology`, `bosch`, `cadence`, `canon`, `credo`, `denso`, `disco`, `eaton`, `entegris`, `equinix`, `fanuc`, `furukawa-electric`, `ge-vernova`, `globalfoundries`, `globalwafers`, `hanmi-semiconductor`, `hexagon`, `ibiden`, `infineon`, `jcet`, `johnson-controls`, `keyence`, `kinsus`, `kioxia`, `kokusai-electric`, `lasertec`, `linde`, `mediatek`, `mitsubishi-electric`, `mobileye`, `monolithic-power`, `nan-ya-pcb`, `nikon`, `nxp`, `omron`, `onsemi`, `qualcomm`, `renesas`, `resonac-holdings`, `rohm`, `samsung-electronics`, `screen-holdings`, `seagate`, `shin-etsu-chemical`, `shinko-electric`, `siemens-energy`, `sk-hynix`, `smc`, `stmicroelectronics`, `sumco`, `sumitomo-electric`, `synopsys`, `tesla`, `texas-instruments`, `tokyo-electron`, `unimicron`, `western-digital`, `yaskawa`

## Priority C companies

`abb`, `amphenol`, `applied-materials`, `asm-international`, `asml`, `asmpt`, `besi`, `corning`, `digital-realty`, `fujikura`, `kla`, `lumentum`, `nvidia`, `smic`, `te-connectivity`, `tower-semiconductor`, `tsmc`, `vertiv`

## Top evidence gaps

| Category | Not-started | Partial |
| --- | ---: | ---: |
| `capacity-expansion` | 91 | 6 |
| `manufacturing-facilities` | 85 | 2 |
| `strategy` | 83 | 17 |
| `customer-end-market` | 76 | 24 |
| `competitive-positioning` | 1 | 99 |
| `risks` | 1 | 99 |
| `ai-infrastructure-role` | 0 | 95 |
| `company-overview` | 0 | 1 |
| `products` | 0 | 0 |
| `technology` | 0 | 99 |
| `value-chain-position` | 0 | 0 |

## Migration candidates

Legacy contentとcompany-level一次Sourceがあり、Claim-level Evidence Bindingが未作成のpair。直接移行を保証せず、Category・Claim type・Locatorの人手reviewを必須とする。

| Category | Candidate pairs |
| --- | ---: |
| `company-overview` | 0 |
| `ai-infrastructure-role` | 0 |
| `products` | 0 |
| `technology` | 0 |
| `value-chain-position` | 0 |
| `manufacturing-facilities` | 0 |
| `capacity-expansion` | 0 |
| `customer-end-market` | 0 |
| `competitive-positioning` | 1 |
| `strategy` | 0 |
| `risks` | 2 |

## Next recommended batch

更新後のaudit結果から、将来の一次資料補強候補を8社に限定した。この監査は次Batchを開始しない。

| Company | Reasons |
| --- | --- |
| Broadcom（ブロードコム） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |
| Carrier（キャリア） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |
| Ciena（シエナ） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |
| Cisco（シスコ） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |
| Coherent（コヒレント） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |
| Intel（インテル） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |
| Lam Research（ラムリサーチ） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |
| Legrand（ルグラン） | Coverage gap: 4 not-started / 4 partial; AI Infrastructure importance aid: 5/5; Source leverage: 2 broad primary Sources; Migration ease: 0 legacy-field candidates |

## Company table

| Company | Maturity | Complete | Partial | Not-started | Sources | Claims | Evidence | Locators | Priority |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| ABB（エービービー） | L4 | 4 | 6 | 1 | 1 | 10 | 10 | 10 | C |
| アドバンテスト | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | A |
| Air Liquide（エア・リキード） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| 味の素ファインテクノ | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| AMD（アドバンスト・マイクロ・デバイセズ） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| Amkor Technology（アムコー・テクノロジー） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Amphenol（アンフェノール） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Analog Devices（アナログ・デバイセズ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Applied Materials（アプライド・マテリアルズ） | L4 | 4 | 5 | 2 | 2 | 8 | 8 | 8 | C |
| Aptiv（アプティブ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Arista Networks（アリスタ・ネットワークス） | L4 | 3 | 6 | 2 | 2 | 9 | 9 | 9 | B |
| Arm（アーム） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| ASE Technology（ASEテクノロジー） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| ASM International（ASMインターナショナル） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| ASML（エーエスエムエル） | L4 | 4 | 7 | 0 | 2 | 11 | 11 | 11 | C |
| ASMPT（エーエスエムピーティー） | L4 | 4 | 6 | 1 | 1 | 10 | 10 | 10 | C |
| Besi（BEセミコンダクター・インダストリーズ） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| Bosch（ボッシュ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Broadcom（ブロードコム） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | A |
| Cadence（ケイデンス） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| キヤノン | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Carrier（キャリア） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| Ciena（シエナ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| Cisco（シスコ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| Coherent（コヒレント） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| Corning（コーニング） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Credo（クレド） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| デンソー | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Digital Realty（デジタル・リアルティ） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| ディスコ | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| Eaton（イートン） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| Entegris（インテグリス） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Equinix（エクイニクス） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| ファナック | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| フジクラ | L4 | 4 | 6 | 1 | 1 | 7 | 7 | 7 | C |
| 古河電気工業 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| GE Vernova（GEベルノバ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| GlobalFoundries（グローバルファウンドリーズ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| GlobalWafers（グローバルウェーハズ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| HANMI Semiconductor（ハンミ・セミコンダクター） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Hexagon（ヘキサゴン） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| イビデン | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Infineon（インフィニオン） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Intel（インテル） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| JCET（長電科技） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Johnson Controls（ジョンソンコントロールズ） | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| キーエンス | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Kinsus（景碩科技） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| キオクシアホールディングス | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| KLA（ケーエルエー） | L4 | 4 | 5 | 2 | 2 | 9 | 9 | 9 | C |
| KOKUSAI ELECTRIC（国際電気） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Lam Research（ラムリサーチ） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | A |
| レーザーテック | L4 | 3 | 6 | 2 | 1 | 9 | 9 | 9 | B |
| Legrand（ルグラン） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| Linde（リンデ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Lumentum（ルメンタム） | L4 | 4 | 7 | 0 | 1 | 11 | 11 | 11 | C |
| Marvell Technology（マーベル・テクノロジー） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| MediaTek（メディアテック） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Micron Technology（マイクロン・テクノロジー） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | A |
| 三菱電機 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Mobileye（モービルアイ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Monolithic Power Systems（モノリシック・パワー・システムズ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Nan Ya PCB（南亜電路板） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| ニコン | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| nVent（エヌベント） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| NVIDIA（エヌビディア） | L4 | 4 | 4 | 3 | 4 | 7 | 7 | 7 | C |
| NXP Semiconductors（NXPセミコンダクターズ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| オムロン | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| onsemi（オンセミ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Qualcomm（クアルコム） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| ルネサス エレクトロニクス | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| レゾナック・ホールディングス | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| ローム | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Samsung Electronics（サムスン電子） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| Sandisk（サンディスク） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| Schneider Electric（シュナイダーエレクトリック） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| SCREENホールディングス | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Seagate（シーゲイト） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| 信越化学工業 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| 新光電気工業 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Siemens Energy（シーメンス・エナジー） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| SK hynix（SKハイニックス） | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| SMC | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| SMIC（中芯国際） | L4 | 5 | 6 | 0 | 1 | 11 | 11 | 11 | C |
| STMicroelectronics（STマイクロエレクトロニクス） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| SUMCO | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| 住友電気工業 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Synopsys（シノプシス） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| TE Connectivity（TEコネクティビティ） | L4 | 4 | 5 | 2 | 1 | 9 | 9 | 9 | C |
| Tesla（テスラ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Texas Instruments（テキサス・インスツルメンツ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| 東京エレクトロン | L4 | 3 | 4 | 4 | 2 | 7 | 7 | 7 | B |
| Tower Semiconductor（タワーセミコンダクター） | L4 | 5 | 6 | 0 | 1 | 11 | 11 | 11 | C |
| Trane Technologies（トレイン・テクノロジーズ） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| TSMC（台湾積体電路製造） | L4 | 5 | 3 | 3 | 2 | 8 | 8 | 8 | C |
| UMC（聯華電子） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | A |
| Unimicron（欣興電子） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| Vertiv（ヴァーティブ） | L4 | 4 | 5 | 2 | 2 | 8 | 8 | 8 | C |
| Western Digital（ウエスタンデジタル） | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |
| 安川電機 | L4 | 3 | 4 | 4 | 1 | 7 | 7 | 7 | B |

## Audit freshness and boundaries

- `python scripts/audit-company-evidence-coverage.py --write` でJSON/Markdownを再生成する。
- CIは `--check` でinput digestと完全な生成物一致を確認する。Coverageの低さ自体はfailureにしない。
- 汎用IR、決算Source、legacy本文だけではCategoryをcompleteにしない。
- Evidence shardにCoverage Recordがない会社の`not-started`理由は、dataset状態として安全な`not-collected`に限定する。`not-disclosed` / `not-applicable`は推定しない。
- Batch 01はArm / ASMLのCompany Evidenceと必要最小限のShared Source / pending Source Policyのみを追加し、company JSON、financial data、facilities、relationshipsは変更しない。
