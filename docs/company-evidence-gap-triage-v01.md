# Company Evidence Gap Triage v0.1

- Baseline main: `b6c43183b6d7c91107c1b8122fc7e0bdd9c08349`
- Initial gaps: `779` (`partial 442` + `not-started 337`)
- Current gaps: `779` (`partial 451` + `not-started 328`)
- ACTIONABLE pending: `0` records / `0` companies
- CoverageとTriageは別管理。SUFFICIENT_PARTIALはCoverage上partialのままでよい。

## Distribution

| Classification | Initial | Current gaps |
| --- | ---: | ---: |
| ACTIONABLE | 10 | 0 |
| SUFFICIENT_PARTIAL | 436 | 446 |
| NOT_DISCLOSED | 5 | 5 |
| NOT_APPLICABLE | 28 | 28 |
| DEFERRED | 300 | 300 |
| REVIEW_REQUIRED | 0 | 0 |

## Category summary

| Category | Gaps | Actionable | Sufficient partial | Not disclosed | Not applicable | Deferred | Review required |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ai-infrastructure-role | 95 | 0 | 95 | 0 | 0 | 0 | 0 |
| capacity-expansion | 97 | 2 | 6 | 0 | 14 | 75 | 0 |
| company-overview | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| competitive-positioning | 100 | 1 | 99 | 0 | 0 | 0 | 0 |
| customer-end-market | 100 | 0 | 20 | 4 | 0 | 76 | 0 |
| manufacturing-facilities | 87 | 6 | 1 | 0 | 14 | 66 | 0 |
| risks | 100 | 1 | 98 | 1 | 0 | 0 | 0 |
| strategy | 100 | 0 | 17 | 0 | 0 | 83 | 0 |
| technology | 99 | 0 | 99 | 0 | 0 | 0 | 0 |

## ACTIONABLE queue

| Company | Category | Status | Target Source | Rationale |
| --- | --- | --- | --- | --- |
| アドバンテスト | manufacturing-facilities | completed | facilities-advantest-japan-2026 | 公式国内拠点ページと既存Facility recordがあり、主要生産・R&D拠点を直接確認できる。 |
| Applied Materials（アプライド・マテリアルズ） | capacity-expansion | completed | official-applied-materials-epic-center | 会社の公式R&D施設投資発表という具体的projectを1件確認すれば、generic Capexと分離して改善できる。 |
| フジクラ | manufacturing-facilities | completed | facilities-fujikura-profile-2026 | 既存の公式会社概要が国内主要拠点を列挙し、1 Sourceで施設Categoryを安全に改善できる。 |
| Intel（インテル） | manufacturing-facilities | completed | sec-intel-2025-10k | 年次Form 10-KのProperties/Manufacturing開示で主要fab footprintを確認でき、AI供給上の重要度が高い。 |
| キオクシアホールディングス | manufacturing-facilities | completed | facilities-kioxia-corporate-profile-2026 | 公式会社案内が四日市・北上の量産拠点を直接示し、Atlas利用価値が高い。 |
| Micron Technology（マイクロン・テクノロジー） | manufacturing-facilities | completed | sec-micron-2025-10k | 年次Form 10-KのManufacturing/Properties開示で主要メモリ製造拠点を確認できる。 |
| 東京エレクトロン | manufacturing-facilities | completed | facilities-tel-technology-solutions-2026, facilities-tel-miyagi-2026, facilities-tel-kyushu-2026 | 公式拠点ページ群が装置別の開発・製造機能を直接示し、少数Sourceで主要範囲を改善できる。 |
| TSMC（台湾積体電路製造） | competitive-positioning | completed | corporate-tsmc-annual-report-2025-ch5 | 公式年次報告書のtechnology leadership開示からCompany positioningをAtlas分析と分離して追加できる。 |
| TSMC（台湾積体電路製造） | risks | completed | official-tsmc-annual-report-2025 | 公式年次報告書のRisk Factorsを1 Sourceで確認でき、P1企業の未着手gapとして利用価値が高い。 |
| Vertiv（ヴァーティブ） | capacity-expansion | completed | official-vertiv-capacity-expansion | 会社の公式manufacturing-capacity発表が期待でき、AIデータセンター供給制約の理解に直接寄与する。 |

## Company summary

| Company | Gaps | Actionable | Sufficient partial | Not disclosed | Not applicable | Deferred | Review required |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ABB（エービービー） | 7 | 0 | 6 | 0 | 0 | 1 | 0 |
| アドバンテスト | 8 | 1 | 4 | 0 | 0 | 3 | 0 |
| Air Liquide（エア・リキード） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| 味の素ファインテクノ | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| AMD（アドバンスト・マイクロ・デバイセズ） | 8 | 0 | 6 | 0 | 2 | 0 | 0 |
| Amkor Technology（アムコー・テクノロジー） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Amphenol（アンフェノール） | 7 | 0 | 5 | 0 | 0 | 2 | 0 |
| Analog Devices（アナログ・デバイセズ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Applied Materials（アプライド・マテリアルズ） | 7 | 1 | 4 | 1 | 0 | 1 | 0 |
| Aptiv（アプティブ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Arista Networks（アリスタ・ネットワークス） | 8 | 0 | 6 | 0 | 2 | 0 | 0 |
| Arm（アーム） | 8 | 0 | 6 | 0 | 2 | 0 | 0 |
| ASE Technology（ASEテクノロジー） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| ASM International（ASMインターナショナル） | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| ASML（エーエスエムエル） | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| ASMPT（エーエスエムピーティー） | 7 | 0 | 6 | 0 | 0 | 1 | 0 |
| Besi（BEセミコンダクター・インダストリーズ） | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| Bosch（ボッシュ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Broadcom（ブロードコム） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| Cadence（ケイデンス） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| キヤノン | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Carrier（キャリア） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Ciena（シエナ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Cisco（シスコ） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| Coherent（コヒレント） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Corning（コーニング） | 7 | 0 | 5 | 0 | 0 | 2 | 0 |
| Credo（クレド） | 8 | 0 | 6 | 0 | 2 | 0 | 0 |
| デンソー | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Digital Realty（デジタル・リアルティ） | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| ディスコ | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Eaton（イートン） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Entegris（インテグリス） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Equinix（エクイニクス） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| ファナック | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| フジクラ | 7 | 1 | 3 | 2 | 0 | 1 | 0 |
| 古河電気工業 | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| GE Vernova（GEベルノバ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| GlobalFoundries（グローバルファウンドリーズ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| GlobalWafers（グローバルウェーハズ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| HANMI Semiconductor（ハンミ・セミコンダクター） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Hexagon（ヘキサゴン） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| イビデン | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Infineon（インフィニオン） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Intel（インテル） | 8 | 1 | 4 | 0 | 0 | 3 | 0 |
| JCET（長電科技） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Johnson Controls（ジョンソンコントロールズ） | 8 | 0 | 6 | 0 | 0 | 2 | 0 |
| キーエンス | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Kinsus（景碩科技） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| キオクシアホールディングス | 8 | 1 | 4 | 0 | 0 | 3 | 0 |
| KLA（ケーエルエー） | 7 | 0 | 5 | 0 | 0 | 2 | 0 |
| KOKUSAI ELECTRIC（国際電気） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Lam Research（ラムリサーチ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| レーザーテック | 8 | 0 | 6 | 0 | 0 | 2 | 0 |
| Legrand（ルグラン） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Linde（リンデ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Lumentum（ルメンタム） | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| Marvell Technology（マーベル・テクノロジー） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| MediaTek（メディアテック） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| Micron Technology（マイクロン・テクノロジー） | 8 | 1 | 4 | 0 | 0 | 3 | 0 |
| 三菱電機 | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Mobileye（モービルアイ） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| Monolithic Power Systems（モノリシック・パワー・システムズ） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| Nan Ya PCB（南亜電路板） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| ニコン | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| nVent（エヌベント） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| NVIDIA（エヌビディア） | 7 | 0 | 3 | 1 | 2 | 1 | 0 |
| NXP Semiconductors（NXPセミコンダクターズ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| オムロン | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| onsemi（オンセミ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Qualcomm（クアルコム） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| ルネサス エレクトロニクス | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| レゾナック・ホールディングス | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| ローム | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Samsung Electronics（サムスン電子） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Sandisk（サンディスク） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Schneider Electric（シュナイダーエレクトリック） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| SCREENホールディングス | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Seagate（シーゲイト） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| 信越化学工業 | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| 新光電気工業 | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Siemens Energy（シーメンス・エナジー） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| SK hynix（SKハイニックス） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| SMC | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| SMIC（中芯国際） | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| STMicroelectronics（STマイクロエレクトロニクス） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| SUMCO | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| 住友電気工業 | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Synopsys（シノプシス） | 8 | 0 | 4 | 0 | 2 | 2 | 0 |
| TE Connectivity（TEコネクティビティ） | 7 | 0 | 5 | 0 | 0 | 2 | 0 |
| Tesla（テスラ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Texas Instruments（テキサス・インスツルメンツ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| 東京エレクトロン | 8 | 1 | 4 | 0 | 0 | 3 | 0 |
| Tower Semiconductor（タワーセミコンダクター） | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| Trane Technologies（トレイン・テクノロジーズ） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| TSMC（台湾積体電路製造） | 6 | 2 | 2 | 1 | 0 | 1 | 0 |
| UMC（聯華電子） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Unimicron（欣興電子） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| Vertiv（ヴァーティブ） | 7 | 1 | 5 | 0 | 0 | 1 | 0 |
| Western Digital（ウエスタンデジタル） | 8 | 0 | 4 | 0 | 0 | 4 | 0 |
| 安川電機 | 8 | 0 | 4 | 0 | 0 | 4 | 0 |

## Decision rules

- ACTIONABLEは結果を見る前に固定した10 records / 9 companiesのみ。公式一次資料1〜3件で改善可能かつAtlas利用価値が高い。
- partialで主要Claimとstructured Evidenceが既にあるgapは、追加探索の限界効用が低いためSUFFICIENT_PARTIAL。
- 明示的な非開示はNOT_DISCLOSED。顧客名・capacity・market positionを推測しない。
- fabless / IP / software等の自社製造・自社capacityはNOT_APPLICABLE。
- その他のnot-startedは、bounded searchで安全に閉じる見込みが低いためDEFERRED。
- REVIEW_REQUIREDは0。Coverageのcomplete件数を分類根拠に使用しない。
