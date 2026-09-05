import data from '../data/company-compare-first-batch-stage1-v01.json' with { type: 'json' };
import { evidenceCompareFirstBatchStage1CompanyIds } from './company-compare-supported-companies.ts';

export const firstBatchStage1CompanyIds = evidenceCompareFirstBatchStage1CompanyIds;
export type FirstBatchStage1CompanyId = typeof firstBatchStage1CompanyIds[number];

export const firstBatchStage1DimensionIds = [
  'ai-role',
  'value-chain-position',
  'key-products',
  'technology-moat',
  'capacity-roadmap',
  'key-risks',
] as const;

export interface FirstBatchDisplayCopy {
  title: string;
  statement: string;
}

export interface FirstBatchProductEntry {
  canonicalId: string;
  label: string;
  description: string;
  groundingId: string;
}

export interface FirstBatchCompanyDisplayProjection {
  companyId: FirstBatchStage1CompanyId;
  readinessClass: 'DISPLAY_COPY_ONLY';
  dimensions: Record<(typeof firstBatchStage1DimensionIds)[number], string[]>;
  claimDisplay: Record<string, FirstBatchDisplayCopy>;
  productPortfolio: {
    title: string;
    body: string;
    groundingId: string;
    summaryVisible: false;
    expandedVisible: true;
  };
  productEntries: FirstBatchProductEntry[];
}

const requireNonEmpty = (value: unknown, label: string) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be non-empty`);
  return value.trim();
};

function validateFirstBatchStage1Data(value: typeof data) {
  if (value.schemaVersion !== '0.1' || value.stage !== 'first-batch-stage-1') {
    throw new Error('Company Compare first-batch Stage 1 metadata mismatch');
  }
  if (JSON.stringify(value.companyIds) !== JSON.stringify(firstBatchStage1CompanyIds)) {
    throw new Error('Company Compare first-batch Stage 1 IDs must be amd / vertiv / tsmc');
  }
  if (value.companies.length !== firstBatchStage1CompanyIds.length) {
    throw new Error('Company Compare first-batch Stage 1 must contain exactly three companies');
  }

  const seenCompanies = new Set<string>();
  const seenProducts = new Set<string>();
  const records = value.companies.map(raw => {
    if (!firstBatchStage1CompanyIds.includes(raw.companyId as FirstBatchStage1CompanyId)) {
      throw new Error(`Unexpected Company Compare first-batch Company: ${raw.companyId}`);
    }
    if (seenCompanies.has(raw.companyId)) throw new Error(`Duplicate Company Compare first-batch Company: ${raw.companyId}`);
    seenCompanies.add(raw.companyId);
    if (raw.readinessClass !== 'DISPLAY_COPY_ONLY') {
      throw new Error(`Company Compare first-batch readiness mismatch: ${raw.companyId}`);
    }
    const dimensionIds = Object.keys(raw.dimensions);
    if (JSON.stringify(dimensionIds) !== JSON.stringify(firstBatchStage1DimensionIds)) {
      throw new Error(`Company Compare first-batch dimensions mismatch: ${raw.companyId}`);
    }
    const claimIds = new Set<string>();
    for (const dimensionId of firstBatchStage1DimensionIds) {
      const ids = raw.dimensions[dimensionId];
      if (!Array.isArray(ids) || ids.length === 0 || ids.some(id => !requireNonEmpty(id, `${raw.companyId}:${dimensionId} Claim ID`))) {
        throw new Error(`Company Compare first-batch dimension is not minimum usable: ${raw.companyId}:${dimensionId}`);
      }
      ids.forEach(id => claimIds.add(id));
    }
    if (JSON.stringify(Object.keys(raw.claimDisplay).sort()) !== JSON.stringify([...claimIds].sort())) {
      throw new Error(`Company Compare first-batch display copy must cover exactly the projected Claims: ${raw.companyId}`);
    }
    const claimDisplay = Object.fromEntries(Object.entries(raw.claimDisplay).map(([claimId, copy]) => [claimId, Object.freeze({
      title: requireNonEmpty(copy.title, `${claimId} display title`),
      statement: requireNonEmpty(copy.statement, `${claimId} display statement`),
    })]));
    const portfolio = raw.productPortfolio;
    if (!claimIds.has(portfolio.groundingId)
      || portfolio.summaryVisible !== false
      || portfolio.expandedVisible !== true) {
      throw new Error(`Company Compare first-batch Product portfolio contract mismatch: ${raw.companyId}`);
    }
    const productEntries = raw.productEntries.map(entry => {
      if (!entry.canonicalId.startsWith(`display-product-${raw.companyId}-`)) {
        throw new Error(`Company Compare first-batch display Product ID mismatch: ${entry.canonicalId}`);
      }
      if (seenProducts.has(entry.canonicalId)) throw new Error(`Duplicate Company Compare display Product: ${entry.canonicalId}`);
      seenProducts.add(entry.canonicalId);
      if (!claimIds.has(entry.groundingId)) {
        throw new Error(`Company Compare first-batch Product grounding does not resolve: ${entry.canonicalId}`);
      }
      return Object.freeze({
        canonicalId: entry.canonicalId,
        label: requireNonEmpty(entry.label, `${entry.canonicalId} label`),
        description: requireNonEmpty(entry.description, `${entry.canonicalId} description`),
        groundingId: entry.groundingId,
      });
    });
    if (!productEntries.length || productEntries.some(entry => entry.groundingId !== portfolio.groundingId)) {
      throw new Error(`Company Compare first-batch Product entries must share the reviewed Product Claim: ${raw.companyId}`);
    }
    return Object.freeze({
      companyId: raw.companyId,
      readinessClass: raw.readinessClass,
      dimensions: Object.freeze(Object.fromEntries(firstBatchStage1DimensionIds.map(id => [id, Object.freeze([...raw.dimensions[id]])]))),
      claimDisplay: Object.freeze(claimDisplay),
      productPortfolio: Object.freeze({
        title: requireNonEmpty(portfolio.title, `${raw.companyId} Product portfolio title`),
        body: requireNonEmpty(portfolio.body, `${raw.companyId} Product portfolio body`),
        groundingId: portfolio.groundingId,
        summaryVisible: false as const,
        expandedVisible: true as const,
      }),
      productEntries: Object.freeze(productEntries),
    });
  });
  return Object.freeze(records) as readonly FirstBatchCompanyDisplayProjection[];
}

export const firstBatchStage1Companies = validateFirstBatchStage1Data(data);
export const firstBatchStage1CompanyById = new Map(firstBatchStage1Companies.map(record => [record.companyId, record]));
export const firstBatchStage1ClaimDisplay = Object.freeze(Object.fromEntries(
  firstBatchStage1Companies.flatMap(record => Object.entries(record.claimDisplay)),
));
export const firstBatchStage1ProductEntries = Object.freeze(
  firstBatchStage1Companies.flatMap(record => record.productEntries),
);
export const firstBatchStage1ProductById = new Map(firstBatchStage1ProductEntries.map(record => [record.canonicalId, record]));
export const firstBatchStage1ProductIdsByClaimId = Object.freeze(Object.fromEntries(
  firstBatchStage1Companies.map(record => [record.productPortfolio.groundingId, record.productEntries.map(entry => entry.canonicalId)]),
));
