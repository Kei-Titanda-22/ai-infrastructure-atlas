import stage1Data from '../data/company-compare-first-batch-stage1-v01.json' with { type: 'json' };
import stage2Data from '../data/company-compare-first-batch-stage2-v01.json' with { type: 'json' };
import stage3Data from '../data/company-compare-first-batch-stage3-v01.json' with { type: 'json' };
import stage4Data from '../data/company-compare-first-batch-stage4-v01.json' with { type: 'json' };
import remainingBatch1Data from '../data/company-compare-remaining-batch1-v01.json' with { type: 'json' };
import {
  evidenceCompareFirstBatchCompanyIds,
  evidenceCompareFirstBatchStage1CompanyIds,
  evidenceCompareFirstBatchStage2CompanyIds,
  evidenceCompareFirstBatchStage3CompanyIds,
  evidenceCompareFirstBatchStage4CompanyIds,
  evidenceCompareRemainingBatch1CompanyIds,
} from './company-compare-supported-companies.ts';

export const firstBatchStage1CompanyIds = evidenceCompareFirstBatchStage1CompanyIds;
export const firstBatchStage2CompanyIds = evidenceCompareFirstBatchStage2CompanyIds;
export const firstBatchStage3CompanyIds = evidenceCompareFirstBatchStage3CompanyIds;
export const firstBatchStage4CompanyIds = evidenceCompareFirstBatchStage4CompanyIds;
export const firstBatchCompanyIds = evidenceCompareFirstBatchCompanyIds;
export const remainingBatch1CompanyIds = evidenceCompareRemainingBatch1CompanyIds;
export type FirstBatchStage1CompanyId = typeof firstBatchStage1CompanyIds[number];
export type FirstBatchStage2CompanyId = typeof firstBatchStage2CompanyIds[number];
export type FirstBatchStage3CompanyId = typeof firstBatchStage3CompanyIds[number];
export type FirstBatchStage4CompanyId = typeof firstBatchStage4CompanyIds[number];
export type FirstBatchCompanyId = typeof firstBatchCompanyIds[number];
export type DisplayOnlyProjectionCompanyId = FirstBatchCompanyId | typeof remainingBatch1CompanyIds[number];

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
  companyId: DisplayOnlyProjectionCompanyId;
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

function validateFirstBatchData(
  value: any,
  expectedStage: 'first-batch-stage-1' | 'first-batch-stage-2' | 'first-batch-stage-3' | 'first-batch-stage-4' | 'remaining-rollout-batch-1',
  expectedCompanyIds: readonly DisplayOnlyProjectionCompanyId[],
) {
  if (value.schemaVersion !== '0.1' || value.stage !== expectedStage) {
    throw new Error(`Company Compare ${expectedStage} metadata mismatch`);
  }
  if (JSON.stringify(value.companyIds) !== JSON.stringify(expectedCompanyIds)) {
    throw new Error(`Company Compare ${expectedStage} Company IDs mismatch`);
  }
  if (value.companies.length !== expectedCompanyIds.length) {
    throw new Error(`Company Compare ${expectedStage} Company count mismatch`);
  }

  const seenCompanies = new Set<string>();
  const seenProducts = new Set<string>();
  const records = value.companies.map((raw: any) => {
    if (!expectedCompanyIds.includes(raw.companyId as DisplayOnlyProjectionCompanyId)) {
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
    const claimDisplay = Object.fromEntries(Object.entries(raw.claimDisplay).map(([claimId, value]) => {
      const copy = value as FirstBatchDisplayCopy;
      return [claimId, Object.freeze({
      title: requireNonEmpty(copy.title, `${claimId} display title`),
      statement: requireNonEmpty(copy.statement, `${claimId} display statement`),
    })];
    }));
    const portfolio = raw.productPortfolio;
    if (!claimIds.has(portfolio.groundingId)
      || portfolio.summaryVisible !== false
      || portfolio.expandedVisible !== true) {
      throw new Error(`Company Compare first-batch Product portfolio contract mismatch: ${raw.companyId}`);
    }
    const productEntries = raw.productEntries.map((entry: any) => {
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

export const firstBatchStage1Companies = validateFirstBatchData(stage1Data, 'first-batch-stage-1', firstBatchStage1CompanyIds);
export const firstBatchStage2Companies = validateFirstBatchData(stage2Data, 'first-batch-stage-2', firstBatchStage2CompanyIds);
export const firstBatchStage3Companies = validateFirstBatchData(stage3Data, 'first-batch-stage-3', firstBatchStage3CompanyIds);
export const firstBatchStage4Companies = validateFirstBatchData(stage4Data, 'first-batch-stage-4', firstBatchStage4CompanyIds);
export const remainingBatch1Companies = validateFirstBatchData(remainingBatch1Data, 'remaining-rollout-batch-1', remainingBatch1CompanyIds);
export const firstBatchCompanies = Object.freeze([...firstBatchStage1Companies, ...firstBatchStage2Companies, ...firstBatchStage3Companies, ...firstBatchStage4Companies]);
export const firstBatchStage1CompanyById = new Map(firstBatchStage1Companies.map(record => [record.companyId, record]));
export const firstBatchStage2CompanyById = new Map(firstBatchStage2Companies.map(record => [record.companyId, record]));
export const firstBatchStage3CompanyById = new Map(firstBatchStage3Companies.map(record => [record.companyId, record]));
export const firstBatchStage4CompanyById = new Map(firstBatchStage4Companies.map(record => [record.companyId, record]));
export const firstBatchStage1ClaimDisplay = Object.freeze(Object.fromEntries(
  firstBatchStage1Companies.flatMap(record => Object.entries(record.claimDisplay)),
));
export const firstBatchStage2ClaimDisplay = Object.freeze(Object.fromEntries(
  firstBatchStage2Companies.flatMap(record => Object.entries(record.claimDisplay)),
));
export const firstBatchStage3ClaimDisplay = Object.freeze(Object.fromEntries(
  firstBatchStage3Companies.flatMap(record => Object.entries(record.claimDisplay)),
));
export const firstBatchStage4ClaimDisplay = Object.freeze(Object.fromEntries(
  firstBatchStage4Companies.flatMap(record => Object.entries(record.claimDisplay)),
));
export const remainingBatch1ClaimDisplay = Object.freeze(Object.fromEntries(
  remainingBatch1Companies.flatMap(record => Object.entries(record.claimDisplay)),
));
export const firstBatchClaimDisplay = Object.freeze({ ...firstBatchStage1ClaimDisplay, ...firstBatchStage2ClaimDisplay, ...firstBatchStage3ClaimDisplay, ...firstBatchStage4ClaimDisplay });
export const firstBatchStage1ProductEntries = Object.freeze(
  firstBatchStage1Companies.flatMap(record => record.productEntries),
);
export const firstBatchStage2ProductEntries = Object.freeze(
  firstBatchStage2Companies.flatMap(record => record.productEntries),
);
export const firstBatchStage3ProductEntries = Object.freeze(
  firstBatchStage3Companies.flatMap(record => record.productEntries),
);
export const firstBatchStage4ProductEntries = Object.freeze(
  firstBatchStage4Companies.flatMap(record => record.productEntries),
);
export const remainingBatch1ProductEntries = Object.freeze(
  remainingBatch1Companies.flatMap(record => record.productEntries),
);
export const firstBatchProductEntries = Object.freeze([...firstBatchStage1ProductEntries, ...firstBatchStage2ProductEntries, ...firstBatchStage3ProductEntries, ...firstBatchStage4ProductEntries]);
export const firstBatchStage1ProductById = new Map(firstBatchStage1ProductEntries.map(record => [record.canonicalId, record]));
export const firstBatchStage2ProductById = new Map(firstBatchStage2ProductEntries.map(record => [record.canonicalId, record]));
export const firstBatchStage3ProductById = new Map(firstBatchStage3ProductEntries.map(record => [record.canonicalId, record]));
export const firstBatchStage4ProductById = new Map(firstBatchStage4ProductEntries.map(record => [record.canonicalId, record]));
export const firstBatchStage1ProductIdsByClaimId = Object.freeze(Object.fromEntries(
  firstBatchStage1Companies.map(record => [record.productPortfolio.groundingId, record.productEntries.map(entry => entry.canonicalId)]),
));
export const firstBatchStage2ProductIdsByClaimId = Object.freeze(Object.fromEntries(
  firstBatchStage2Companies.map(record => [record.productPortfolio.groundingId, record.productEntries.map(entry => entry.canonicalId)]),
));
export const firstBatchStage3ProductIdsByClaimId = Object.freeze(Object.fromEntries(
  firstBatchStage3Companies.map(record => [record.productPortfolio.groundingId, record.productEntries.map(entry => entry.canonicalId)]),
));
export const firstBatchStage4ProductIdsByClaimId = Object.freeze(Object.fromEntries(
  firstBatchStage4Companies.map(record => [record.productPortfolio.groundingId, record.productEntries.map(entry => entry.canonicalId)]),
));
export const remainingBatch1ProductIdsByClaimId = Object.freeze(Object.fromEntries(
  remainingBatch1Companies.map(record => [record.productPortfolio.groundingId, record.productEntries.map(entry => entry.canonicalId)]),
));
export const firstBatchProductIdsByClaimId = Object.freeze({
  ...firstBatchStage1ProductIdsByClaimId,
  ...firstBatchStage2ProductIdsByClaimId,
  ...firstBatchStage3ProductIdsByClaimId,
  ...firstBatchStage4ProductIdsByClaimId,
});
export const firstBatchStages = Object.freeze([
  Object.freeze({ setId: 'first-batch-stage-1', orderedCompanyIds: [...firstBatchStage1CompanyIds] }),
  Object.freeze({ setId: 'first-batch-stage-2', orderedCompanyIds: [...firstBatchStage2CompanyIds] }),
  Object.freeze({ setId: 'first-batch-stage-3', orderedCompanyIds: [...firstBatchStage3CompanyIds] }),
  Object.freeze({ setId: 'first-batch-stage-4', orderedCompanyIds: [...firstBatchStage4CompanyIds] }),
]);
export const remainingBatch1Stage = Object.freeze({
  setId: 'remaining-rollout-batch-1',
  orderedCompanyIds: [...remainingBatch1CompanyIds],
});
