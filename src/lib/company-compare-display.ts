export interface CompareDisplayIdentityLike {
  name: string;
  japaneseName?: string | null;
}

export interface CompareDisplayCopy {
  title: string;
  statement: string;
  groundingIds: readonly string[];
}

export interface CompareDisplayNameParts {
  accessibleName: string;
  primaryName: string;
  secondaryName: string | null;
}

export interface CompareSummaryClaimLike {
  id: string;
  priority: string;
}

export interface CompareSummaryRelationLike {
  relationId: string;
  relationType: string;
}

export interface CompareCanonicalDisplayItem {
  canonicalId: string;
  label: string;
  groundingIds: readonly string[];
  description?: string;
  descriptionGroundingIds?: readonly string[];
}

export interface CompareProductDisplayDescription {
  description: string;
  groundingIds: readonly string[];
}

export interface CompareFinancialDisplayRecordLike {
  periodLabel: string;
  currency: string;
  unit: string;
  accountingBasis: string;
}

export const compareFinancialAmountUnitLabels = Object.freeze<Record<string, string>>({
  'USD:million': '百万ドル',
  'JPY:million': '百万円',
  'TWD:billion': '十億台湾ドル',
});

export const compareFinancialAccountingBasisLabels = Object.freeze<Record<string, string>>({
  'US GAAP': '米国会計基準',
  'Japanese GAAP': '日本会計基準',
  'TIFRS consolidated': '台湾IFRS（連結）',
  IFRS: '国際財務報告基準（IFRS）',
});

const compareNamedQuarterPeriodLabels = Object.freeze<Record<string, string>>({
  'June 2025 quarter': '2025年6月期（四半期）',
  'March 2026 quarter': '2026年3月期（四半期）',
  'June 2026 quarter': '2026年6月期（四半期）',
});

export function formatCompareFinancialPeriodLabel(periodLabel: string) {
  const canonicalLabel = periodLabel.trim();
  const namedQuarter = compareNamedQuarterPeriodLabels[canonicalLabel];
  if (namedQuarter) return namedQuarter;

  const quarterFirst = canonicalLabel.match(/^Q([1-4]) FY(\d{4})$/);
  if (quarterFirst) return `${quarterFirst[2]}年度 第${quarterFirst[1]}四半期`;

  const fiscalYearFirst = canonicalLabel.match(/^FY(\d{4}) Q([1-4])$/);
  if (fiscalYearFirst) return `${fiscalYearFirst[1]}年度 第${fiscalYearFirst[2]}四半期`;

  const calendarQuarter = canonicalLabel.match(/^Q([1-4]) (\d{4})$/);
  if (calendarQuarter) return `${calendarQuarter[2]}年 第${calendarQuarter[1]}四半期`;

  const annual = canonicalLabel.match(/^FY(\d{4})$/);
  if (annual) return `${annual[1]}年度`;

  throw new Error(`Company Compare financial period label is unsupported: ${periodLabel}`);
}

export function resolveCompareFinancialTablePresentation(records: readonly CompareFinancialDisplayRecordLike[]) {
  if (!records.length) throw new Error('Company Compare financial table requires at least one record');
  const currencyUnitKeys = new Set(records.map(record => `${record.currency}:${record.unit}`));
  if (currencyUnitKeys.size !== 1) {
    throw new Error(`Company Compare financial table has mixed currency or unit: ${[...currencyUnitKeys].join(', ')}`);
  }
  const accountingBases = new Set(records.map(record => record.accountingBasis));
  if (accountingBases.size !== 1) {
    throw new Error(`Company Compare financial table has mixed accounting basis: ${[...accountingBases].join(', ')}`);
  }
  const currencyUnitKey = [...currencyUnitKeys][0];
  const accountingBasis = [...accountingBases][0];
  const amountUnitLabel = compareFinancialAmountUnitLabels[currencyUnitKey];
  const accountingBasisLabel = compareFinancialAccountingBasisLabels[accountingBasis];
  if (!amountUnitLabel) throw new Error(`Company Compare financial unit label is unsupported: ${currencyUnitKey}`);
  if (!accountingBasisLabel) throw new Error(`Company Compare accounting basis label is unsupported: ${accountingBasis}`);
  return {
    amountUnitLabel,
    accountingBasisLabel,
    periodLabels: records.map(record => formatCompareFinancialPeriodLabel(record.periodLabel)),
  } as const;
}

export const compareGenericTermTranslations = Object.freeze({
  compute: '演算',
  interconnect: '相互接続',
  system: 'システム',
  software: 'ソフトウェア',
  'switching silicon': 'スイッチ用半導体',
  'connectivity semiconductors': '接続用半導体',
  'Value Chain': '供給網上の位置',
  scope: '対象範囲',
  freshness: '更新状況',
  'developer ecosystem': '開発者エコシステム',
  'Integrated Materials Solution': '統合材料ソリューション',
  Tualatin: 'チュアラティン',
  'United States': '米国',
  Japan: '日本',
});

export const compareLocationDisplayNames = Object.freeze<Record<string, string>>({
  'United States': '米国',
  Japan: '日本',
  Taiwan: '台湾',
  Tualatin: 'チュアラティン',
  'Oregon, United States': '米国オレゴン州',
  Ireland: 'アイルランド',
  米国: '米国',
  日本: '日本',
  台湾: '台湾',
  チュアラティン: 'チュアラティン',
  米国オレゴン州: '米国オレゴン州',
  アイルランド: 'アイルランド',
});

export const comparePreservedProperNouns = Object.freeze([
  'Atlas',
  'AI',
  'NVIDIA',
  'Broadcom',
  'Applied Materials',
  'Lam Research',
  'Tokyo Electron',
  'NVIDIA AI Enterprise',
  'DGX Cloud',
  'Blackwell GPU',
  'Grace CPU',
  'BlueField DPU',
  'Spectrum-X',
  'Integrated Materials Solution',
  'EPIC Center',
  'Building G',
  'GPU',
  'CPU',
  'DPU',
  'ASIC',
  'Ethernet',
  '3D NAND',
  'DRAM',
  'HBM',
  'GAAP',
  'IFRS',
  'AMD',
  'Vertiv',
  'TSMC',
]);

export const compareProductDisplayNameOverrides = Object.freeze<Record<string, string>>({
  'product-category-connectivity-semiconductor': '接続用半導体',
  'product-category-ethernet-switching-silicon': 'Ethernetスイッチ用半導体',
});

export const compareProductDisplayDescriptions = Object.freeze<Record<string, CompareProductDisplayDescription>>({
  'product-category-coater-developer-equipment': {
    description: '半導体製造で、材料の塗布と現像を行う装置。',
    groundingIds: ['tokyo-electron-products', 'tokyo-electron-overview'],
  },
  'product-category-connectivity-semiconductor': {
    description: '機器やシステム間の接続を支える半導体。',
    groundingIds: ['broadcom-products', 'broadcom-overview', 'rel-broadcom-produces-connectivity-semiconductor'],
  },
  'product-category-cpu': {
    description: 'データセンター向け基盤で、計算処理を担うプロセッサー。',
    groundingIds: ['nvidia-products', 'nvidia-overview', 'rel-nvidia-produces-cpu'],
  },
  'product-category-custom-accelerator-asic': {
    description: '顧客用途に合わせて設計し、カスタム演算を担う半導体。',
    groundingIds: ['broadcom-products', 'broadcom-positioning', 'broadcom-ai-role', 'rel-broadcom-produces-custom-accelerator-asic'],
  },
  'product-category-dpu': {
    description: 'データセンターで、ネットワーク処理を担うプロセッサー。',
    groundingIds: ['nvidia-products', 'nvidia-networking', 'rel-nvidia-produces-dpu'],
  },
  'product-category-ethernet-switching-silicon': {
    description: 'Ethernetネットワークで、接続とスイッチングを担う半導体。',
    groundingIds: ['broadcom-products', 'broadcom-ai-role', 'rel-broadcom-produces-ethernet-switching-silicon'],
  },
  'product-category-gpu': {
    description: 'アクセラレーテッド・コンピューティングの演算を担うプロセッサー。',
    groundingIds: ['nvidia-products', 'nvidia-overview', 'rel-nvidia-produces-gpu'],
  },
  'product-category-semiconductor-deposition-equipment': {
    description: '半導体製造で、ウェーハ上へ材料を堆積させる装置。',
    groundingIds: ['applied-products', 'lam-research-products', 'tokyo-electron-products', 'rel-applied-materials-produces-semiconductor-deposition-equipment', 'rel-lam-research-produces-semiconductor-deposition-equipment'],
  },
  'product-category-semiconductor-etch-equipment': {
    description: 'ウェーハ材料を除去するエッチング装置。',
    groundingIds: ['lam-research-products', 'tokyo-electron-products', 'rel-lam-research-produces-semiconductor-etch-equipment'],
  },
  'product-category-wafer-cleaning-equipment': {
    description: 'ウェーハを洗浄する半導体製造装置。',
    groundingIds: ['lam-research-products', 'tokyo-electron-products', 'rel-lam-research-produces-wafer-cleaning-equipment'],
  },
  'product-category-wafer-fabrication-equipment': {
    description: '半導体製造のウェーハ前工程で使用する装置群。',
    groundingIds: ['applied-value-chain', 'lam-research-value-chain', 'tokyo-electron-value-chain', 'rel-lam-research-produces-wafer-fabrication-equipment'],
  },
});

export const compareProductIdsByClaimId = Object.freeze<Record<string, readonly string[]>>({
  'nvidia-products': [
    'product-category-gpu',
    'product-category-cpu',
    'product-category-dpu',
  ],
  'broadcom-products': [
    'product-category-custom-accelerator-asic',
    'product-category-ethernet-switching-silicon',
    'product-category-connectivity-semiconductor',
  ],
  'applied-products': ['product-category-semiconductor-deposition-equipment'],
  'lam-research-products': [
    'product-category-wafer-fabrication-equipment',
    'product-category-semiconductor-deposition-equipment',
    'product-category-semiconductor-etch-equipment',
    'product-category-wafer-cleaning-equipment',
  ],
  'tokyo-electron-products': [
    'product-category-coater-developer-equipment',
    'product-category-semiconductor-etch-equipment',
    'product-category-semiconductor-deposition-equipment',
    'product-category-wafer-cleaning-equipment',
  ],
});

export function resolveCompareProductDisplayDescription(productId: string) {
  const copy = compareProductDisplayDescriptions[productId];
  if (!copy) throw new Error(`Company Compare Product description is missing: ${productId}`);
  return copy;
}

const claimCopy = (id: string, title: string, statement: string): CompareDisplayCopy => ({
  title,
  statement,
  groundingIds: [id],
});

export const compareClaimDisplayCopy = Object.freeze<Record<string, CompareDisplayCopy>>({
  'nvidia-ai-role': claimCopy(
    'nvidia-ai-role',
    '演算・接続・ソフトウェアを統合',
    'Atlasでは、NVIDIAをAI向けの演算、ネットワーク、基盤ソフトウェアを統合する中核プラットフォーム企業と位置付ける。',
  ),
  'nvidia-value-chain': claimCopy(
    'nvidia-value-chain',
    '設計からクラスタ基盤まで担当',
    '先端半導体の設計とAIクラスタのシステム基盤を担い、製造は外部ファウンドリへ委託する。',
  ),
  'nvidia-products': claimCopy(
    'nvidia-products',
    '代表的な製品群',
    'Blackwell GPU、Grace CPU、BlueField DPU、Spectrum-Xネットワークを展開する。',
  ),
  'nvidia-positioning': claimCopy(
    'nvidia-positioning',
    '統合AI基盤',
    'GPU、ネットワーク、光技術、ソフトウェアを共同設計する統合AI基盤と自社説明している。',
  ),
  'nvidia-strategy-triage-remediation-v02': claimCopy(
    'nvidia-strategy-triage-remediation-v02',
    '基盤と開発環境を拡張',
    'GPU、CPU、DPU、相互接続、システム、ソフトウェアの一体化を進め、開発者エコシステム、NVIDIA AI Enterprise、DGX Cloudを拡張する方針を示している。',
  ),
  'nvidia-risks': claimCopy(
    'nvidia-risks',
    '外部製造への依存',
    '製造工程を第三者へ委託しており、供給制約や特定サプライヤーへの依存をリスクとして開示している。',
  ),
  'broadcom-ai-role': claimCopy(
    'broadcom-ai-role',
    'カスタム演算と接続を支える',
    'Atlasでは、BroadcomをAIクラスタのカスタム演算、スイッチング、接続を支える半導体企業と位置付ける。',
  ),
  'broadcom-value-chain': claimCopy(
    'broadcom-value-chain',
    '演算・半導体の供給層',
    '演算・半導体の層で、カスタム演算、スイッチング、接続を担う。',
  ),
  'broadcom-products': claimCopy(
    'broadcom-products',
    '製品構成',
    '下記の製品カテゴリを提供する。',
  ),
  'broadcom-positioning': claimCopy(
    'broadcom-positioning',
    '競争上の特徴',
    '大型顧客向けカスタム設計力、演算とネットワークの製品構成、高付加価値半導体の製品群を競争上の特徴として整理する。',
  ),
  'broadcom-technology': claimCopy(
    'broadcom-technology',
    '関連技術',
    'ASIC、スイッチ、ネットワークを、製品群を支える技術基盤として整理する。',
  ),
  'broadcom-strategy-triage-remediation-v02': claimCopy(
    'broadcom-strategy-triage-remediation-v02',
    '中核事業へ重点投資',
    '大型顧客向けカスタム設計力を生かし、技術開発、供給力、顧客対応を重点化する方針を示している。',
  ),
  'broadcom-risks': claimCopy(
    'broadcom-risks',
    '顧客集中とAI投資の変動',
    '顧客集中、大型案件の世代交代、半導体市況、AI投資の増減が業績を左右する可能性がある。',
  ),
  'applied-ai-role': claimCopy(
    'applied-ai-role',
    'AIチップの製造工程を支える',
    'Atlasでは、Applied MaterialsをAIチップの性能と電力効率を左右する材料形成・微細加工を担う半導体前工程製造装置企業と位置付ける。',
  ),
  'applied-value-chain': claimCopy(
    'applied-value-chain',
    '半導体工場へ工程装置を供給',
    '半導体メーカーやファウンドリの工場へ、ウェーハ工程装置を供給する製造装置層と整理する。',
  ),
  'applied-products': claimCopy(
    'applied-products',
    '材料工程を広くカバー',
    '材料の堆積、除去、改質、分析、デバイス接続に関わる装置・技術を展開する。',
  ),
  'applied-positioning': claimCopy(
    'applied-positioning',
    '材料・構造の共同最適化',
    '幅広いプロセス技術と計測技術を接続し、材料・構造を共同最適化できる点を差別化要素と自社説明している。',
  ),
  'applied-technology': claimCopy(
    'applied-technology',
    '統合材料ソリューション',
    '統合材料ソリューション（Integrated Materials Solution）を、複数のプロセスと計測を一つのプラットフォームで組み合わせる技術として説明している。',
  ),
  'applied-materials-capacity-expansion-gap-closure': claimCopy(
    'applied-materials-capacity-expansion-gap-closure',
    'EPIC Centerへの投資',
    'EPIC Centerの整備に向け、7年間で最大40億ドルの追加投資総額を見込むと発表した。',
  ),
  'applied-risks': claimCopy(
    'applied-risks',
    '顧客の設備投資に左右される需要',
    '先端半導体工場の投資サイクルと大口顧客の設備投資動向が、装置需要を大きく左右する。',
  ),
  'lam-research-ai-role': claimCopy(
    'lam-research-ai-role',
    '高アスペクト比工程と積層化の恩恵',
    'Atlasでは、Lam Researchを3D NAND、DRAM・HBM、先端ロジックの高アスペクト比工程や積層化の恩恵を受けやすい企業と位置付ける。',
  ),
  'lam-research-value-chain': claimCopy(
    'lam-research-value-chain',
    '半導体前工程製造装置の供給層',
    '3D NAND、DRAM・HBM、先端ロジック向けの半導体前工程製造装置を担う。',
  ),
  'lam-research-products': claimCopy(
    'lam-research-products',
    '製品構成',
    '下記の製品カテゴリを提供する。',
  ),
  'lam-research-positioning': claimCopy(
    'lam-research-positioning',
    '競争上の特徴',
    '高難度エッチング工程、メモリ工程への強い露出、高い設置ベースを競争上の特徴として整理する。',
  ),
  'lam-research-technology': claimCopy(
    'lam-research-technology',
    '関連技術',
    'エッチング、成膜、ウェーハ洗浄を、製品群を支える技術基盤として整理する。',
  ),
  'lam-research-capacity-expansion-triage-remediation-v02': claimCopy(
    'lam-research-capacity-expansion-triage-remediation-v02',
    '研究開発棟「Building G」を開設',
    '米国オレゴン州チュアラティンに6,500万米ドル・12万平方フィートの研究開発棟「Building G」を開設し、研究開発業務向けに最大700の作業スペースを追加した。',
  ),
  'lam-research-risks': claimCopy(
    'lam-research-risks',
    'メモリ投資・輸出規制・競争',
    'メモリ向け設備投資の増減、輸出規制、工程別のシェア競争が主な業績変動要因となる。',
  ),
  'tokyo-electron-ai-role': claimCopy(
    'tokyo-electron-ai-role',
    '先端ロジックとメモリ投資を取り込む',
    'Atlasでは、東京エレクトロンを先端ロジックとメモリの製造装置投資を幅広い工程で取り込む企業と位置付ける。',
  ),
  'tokyo-electron-value-chain': claimCopy(
    'tokyo-electron-value-chain',
    '半導体前工程製造装置の供給層',
    '先端ロジックとメモリ向けに、幅広い半導体前工程製造装置を供給する。',
  ),
  'tokyo-electron-products': claimCopy(
    'tokyo-electron-products',
    '主な製品',
    '塗布・現像装置、エッチング装置、成膜装置、洗浄装置を提供する。',
  ),
  'tokyo-electron-positioning': claimCopy(
    'tokyo-electron-positioning',
    '競争上の特徴',
    '複数の前工程への展開、大手顧客とのプロセス共同最適化、高い開発投資力を競争上の特徴として整理する。',
  ),
  'tokyo-electron-technology': claimCopy(
    'tokyo-electron-technology',
    '関連技術',
    '塗布・現像、エッチング、成膜を、製品群を支える技術基盤として整理する。',
  ),
  'tokyo-electron-capacity-expansion-triage-remediation-v02': claimCopy(
    'tokyo-electron-capacity-expansion-triage-remediation-v02',
    '東北生産・物流センターを整備',
    '岩手県奥州市に生産・物流センターを完成し、熱処理装置と枚葉式成膜装置の製造・倉庫機能を集約した。',
  ),
  'tokyo-electron-risks': claimCopy(
    'tokyo-electron-risks',
    '設備投資サイクルと輸出規制',
    '半導体製造装置の投資サイクル、輸出規制、特定工程での競争激化が主なリスクとなる。',
  ),
});

export function companyCompareDisplayName(identity: CompareDisplayIdentityLike) {
  const japaneseName = identity.japaneseName?.trim();
  return japaneseName || identity.name.trim();
}

export function companyCompareDisplayNameParts(identity: CompareDisplayIdentityLike): CompareDisplayNameParts {
  const primaryName = identity.name.trim();
  const japaneseName = identity.japaneseName?.trim();
  if (!japaneseName || japaneseName === primaryName) {
    return { accessibleName: primaryName, primaryName: japaneseName || primaryName, secondaryName: null };
  }
  const bilingualPrefix = `${primaryName}（`;
  if (japaneseName.startsWith(bilingualPrefix) && japaneseName.endsWith('）')) {
    return {
      accessibleName: japaneseName,
      primaryName,
      secondaryName: japaneseName.slice(primaryName.length),
    };
  }
  return {
    accessibleName: `${primaryName}（${japaneseName}）`,
    primaryName: japaneseName,
    secondaryName: null,
  };
}

export function localizeCompareLocation(canonicalValue: string) {
  const localized = compareLocationDisplayNames[canonicalValue];
  if (!localized) throw new Error(`Company Compare location mapping is missing: ${canonicalValue}`);
  return localized;
}

const representativeClaimId = (claims: readonly CompareSummaryClaimLike[]) =>
  claims.find(claim => claim.priority === 'P1')?.id
  ?? claims.find(claim => claim.priority === 'P2')?.id
  ?? null;

export function selectCompareSummaryClaimIds(
  dimensionId: string,
  sectionIndex: number,
  claims: readonly CompareSummaryClaimLike[],
  relations: readonly CompareSummaryRelationLike[],
) {
  if (dimensionId === 'key-products' && relations.some(relation => relation.relationType === 'PRODUCES')) return [];
  if (dimensionId === 'ai-role' && sectionIndex > 0 && relations.some(relation => relation.relationType === 'POSITIONED_IN')) return [];
  const claimId = representativeClaimId(claims);
  return claimId ? [claimId] : [];
}

export function selectCompareSummaryRelationIds(
  dimensionId: string,
  sectionIndex: number,
  relations: readonly CompareSummaryRelationLike[],
) {
  if (dimensionId === 'key-products') {
    return relations.filter(relation => relation.relationType === 'PRODUCES').slice(0, 3).map(relation => relation.relationId);
  }
  if (dimensionId === 'ai-role' && sectionIndex > 0) {
    const position = relations.find(relation => relation.relationType === 'POSITIONED_IN');
    return position ? [position.relationId] : [];
  }
  return [];
}

export function resolveCompareClaimDisplay(claimId: string) {
  const copy = compareClaimDisplayCopy[claimId];
  if (!copy) throw new Error(`Company Compare display copy is missing for Claim: ${claimId}`);
  if (copy.groundingIds.length !== 1 || copy.groundingIds[0] !== claimId) {
    throw new Error(`Company Compare display copy grounding mismatch: ${claimId}`);
  }
  return copy;
}

export function dedupeCompareCanonicalItems<T extends CompareCanonicalDisplayItem>(items: readonly T[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.canonicalId)) return false;
    seen.add(item.canonicalId);
    return true;
  });
}

export const compareTechnologyIdsByClaimId = Object.freeze<Record<string, readonly string[]>>({
  'nvidia-positioning': ['technology-accelerated-computing-architecture'],
  'broadcom-technology': ['technology-ethernet-networking'],
  'applied-technology': [
    'technology-semiconductor-materials-engineering',
    'technology-semiconductor-metrology',
  ],
  'lam-research-technology': [
    'technology-semiconductor-deposition',
    'technology-semiconductor-etching',
    'technology-wafer-cleaning',
  ],
  'tokyo-electron-technology': [
    'technology-semiconductor-coating-development',
    'technology-semiconductor-deposition',
    'technology-semiconductor-etching',
  ],
});

export const compareCompanyPresentationTokens = Object.freeze(['01', '02', '03', '04']);

export function companyPresentationTokenForOrder(index: number) {
  const label = compareCompanyPresentationTokens[index];
  if (!label) throw new Error(`Company Compare presentation order is outside 1-4: ${index + 1}`);
  return { index: index + 1, label, token: `company-${index + 1}` } as const;
}
