export interface CompareDisplayIdentityLike {
  name: string;
  japaneseName?: string | null;
}

export interface CompareDisplayCopy {
  title: string;
  statement: string;
  groundingIds: readonly string[];
}

export interface CompareCanonicalDisplayItem {
  canonicalId: string;
  label: string;
  groundingIds: readonly string[];
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
});

export const comparePreservedProperNouns = Object.freeze([
  'NVIDIA',
  'Broadcom',
  'Applied Materials',
  'Lam Research',
  'Tokyo Electron',
  'NVIDIA AI Enterprise',
  'DGX Cloud',
  'GPU',
  'CPU',
  'DPU',
  'ASIC',
  'Ethernet',
]);

export const compareProductDisplayNameOverrides = Object.freeze<Record<string, string>>({
  'product-category-connectivity-semiconductor': '接続用半導体',
  'product-category-ethernet-switching-silicon': 'Ethernetスイッチ用半導体',
});

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
    '主な確認点',
    '顧客集中、大型案件の世代交代、半導体景気とAI投資の変動を主な確認点とする。',
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
    '複数工程を一体化',
    'Integrated Materials Solutionを、複数のプロセスと計測を一つのプラットフォームで組み合わせる技術として説明している。',
  ),
  'applied-materials-capacity-expansion-gap-closure': claimCopy(
    'applied-materials-capacity-expansion-gap-closure',
    'EPIC Centerへの投資',
    'EPIC Centerの整備に向け、7年間で最大40億ドルの追加投資総額を見込むと発表した。',
  ),
  'applied-risks': claimCopy(
    'applied-risks',
    '主な確認点',
    '先端半導体工場の投資サイクルと大口顧客の設備投資変動を、装置需要を左右する主な確認点とする。',
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
    'Building Gを開設',
    'オレゴン州Tualatinに6,500万米ドル・12万平方フィートのBuilding Gを開設し、研究開発業務向けに最大700の作業スペースを追加した。',
  ),
  'lam-research-risks': claimCopy(
    'lam-research-risks',
    '主な確認点',
    'メモリ向け製造装置需要の変動、輸出規制、工程シェア競争を主な確認点とする。',
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
    '主な確認点',
    '半導体製造装置の投資サイクル、輸出規制、特定工程での競争激化を主な確認点とする。',
  ),
});

export function companyCompareDisplayName(identity: CompareDisplayIdentityLike) {
  const japaneseName = identity.japaneseName?.trim();
  return japaneseName || identity.name.trim();
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
