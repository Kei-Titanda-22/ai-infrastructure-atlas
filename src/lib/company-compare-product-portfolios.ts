import {
  firstBatchStage1Companies,
  firstBatchStage1CompanyIds,
} from './company-compare-first-batch.ts';

export const companyCompareProductPortfolioCompanyIds = [
  'nvidia',
  'broadcom',
  'applied-materials',
  'lam-research',
  'tokyo-electron',
  ...firstBatchStage1CompanyIds,
] as const;

export type CompanyCompareProductPortfolioCompanyId = typeof companyCompareProductPortfolioCompanyIds[number];

export interface CompanyCompareProductPortfolioSummary {
  title: string;
  body: string;
  groundingId: string;
  summaryVisible: false;
  expandedVisible: true;
}

const requireRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

const prohibitedProductPortfolioCopy = new Set([
  '製品構成',
  '下記の製品カテゴリを提供する。',
  '主な製品',
  '以下の製品を提供する。',
]);

export function validateCompanyCompareProductPortfolioSummaries(
  value: unknown,
  knownGroundingIds?: ReadonlySet<string>,
): Readonly<Record<CompanyCompareProductPortfolioCompanyId, CompanyCompareProductPortfolioSummary>> {
  const summaries = requireRecord(value, 'Company Compare Product portfolio summaries');
  const expectedIds = [...companyCompareProductPortfolioCompanyIds].sort();
  const actualIds = Object.keys(summaries).sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error('Company Compare Product portfolio summaries must cover the exact supported companies');
  }

  const resolved = Object.fromEntries(companyCompareProductPortfolioCompanyIds.map(companyId => {
    const record = requireRecord(summaries[companyId], `Company Compare Product portfolio summary: ${companyId}`);
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const body = typeof record.body === 'string' ? record.body.trim() : '';
    const groundingId = typeof record.groundingId === 'string' ? record.groundingId.trim() : '';
    if (!title || !body || !groundingId) {
      throw new Error(`Company Compare Product portfolio summary fields must be non-empty: ${companyId}`);
    }
    if (prohibitedProductPortfolioCopy.has(title) || prohibitedProductPortfolioCopy.has(body)) {
      throw new Error(`Company Compare Product portfolio summary uses prohibited generic copy: ${companyId}`);
    }
    if (record.summaryVisible !== false || record.expandedVisible !== true) {
      throw new Error(`Company Compare Product portfolio visibility contract mismatch: ${companyId}`);
    }
    if (knownGroundingIds && !knownGroundingIds.has(groundingId)) {
      throw new Error(`Company Compare Product portfolio grounding does not resolve: ${companyId}:${groundingId}`);
    }
    return [companyId, Object.freeze({ title, body, groundingId, summaryVisible: false as const, expandedVisible: true as const })];
  }));

  return Object.freeze(resolved) as Readonly<Record<CompanyCompareProductPortfolioCompanyId, CompanyCompareProductPortfolioSummary>>;
}

export function getCompanyCompareProductPortfolioSummaries() {
  return validateCompanyCompareProductPortfolioSummaries({
    nvidia: {
      title: '演算とネットワークを横断',
      body: 'Blackwell GPU、Grace CPU、BlueField DPU、Spectrum-Xネットワークを展開する。',
      groundingId: 'nvidia-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    broadcom: {
      title: '接続・演算を担う半導体群',
      body: '接続用半導体、カスタムアクセラレータASIC、Ethernetスイッチ用半導体を展開する。',
      groundingId: 'broadcom-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    'applied-materials': {
      title: '材料工程を広くカバー',
      body: '材料の堆積、除去、改質、分析、デバイス接続に関わる装置・技術を展開する。',
      groundingId: 'applied-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    'lam-research': {
      title: '成膜・エッチング・洗浄を横断',
      body: '成膜、エッチング、ウェーハ洗浄を中心に、複数の前工程装置を展開する。',
      groundingId: 'lam-research-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    'tokyo-electron': {
      title: '前工程の主要工程を幅広くカバー',
      body: '塗布・現像、エッチング、成膜、洗浄の各工程に対応する装置を展開する。',
      groundingId: 'tokyo-electron-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    ...Object.fromEntries(firstBatchStage1Companies.map(record => [record.companyId, record.productPortfolio])),
  });
}

export function resolveCompanyCompareProductPortfolioSummary(
  companyId: string,
  knownGroundingIds?: ReadonlySet<string>,
): CompanyCompareProductPortfolioSummary {
  const companyCompareProductPortfolioSummaries = getCompanyCompareProductPortfolioSummaries();
  const summary = companyCompareProductPortfolioSummaries[companyId as CompanyCompareProductPortfolioCompanyId];
  if (!summary) throw new Error(`Company Compare Product portfolio summary is missing: ${companyId}`);
  if (knownGroundingIds && !knownGroundingIds.has(summary.groundingId)) {
    throw new Error(`Company Compare Product portfolio grounding does not resolve: ${companyId}:${summary.groundingId}`);
  }
  return summary;
}

