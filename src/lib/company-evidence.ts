import manifest from '../data/company-evidence-manifest.json';

export interface CompanyEvidenceClaim {
  id: string;
  companyId: string;
  category: string;
  subcategory?: string;
  claimType: 'fact' | 'company-guidance' | 'company-positioning' | 'atlas-analysis' | 'estimate';
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  statement: string;
  evidenceIds: string[];
  verificationStatus: 'verified' | 'source-linked' | 'needs-review';
  confidence?: 'low' | 'medium' | 'high';
  asOf: string;
  lastVerified: string | null;
  nextReview: string | null;
  notes?: string;
}

export interface CompanyEvidenceBinding {
  id: string;
  claimId: string;
  sourceId: string;
  support: 'supports' | 'context' | 'contradicts';
  locator: Record<string, string>;
  lastChecked: string;
  notes?: string;
}

export interface CompanyEvidenceCoverage {
  companyId: string;
  category: string;
  collectionStatus: 'complete' | 'partial' | 'not-started';
  missingStatus?: 'not-collected' | 'primary-source-unchecked' | 'not-disclosed' | 'not-applicable';
  lastReviewed: string | null;
  nextReview: string | null;
  notes?: string;
}

interface CompanyEvidenceShard {
  schemaVersion: '0.2';
  claims: CompanyEvidenceClaim[];
  evidence: CompanyEvidenceBinding[];
  coverage: CompanyEvidenceCoverage[];
}

const shardModules = import.meta.glob('../data/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export const companyEvidenceShards = Object.freeze([...manifest.shards]);

const shards = companyEvidenceShards.map(shard => {
  const payload = shardModules[`../data/${shard}`];
  if (!payload || typeof payload !== 'object') throw new Error(`Company Evidence shard is missing or invalid: ${shard}`);
  const data = payload as CompanyEvidenceShard;
  if (data.schemaVersion !== '0.2' || !Array.isArray(data.claims) || !Array.isArray(data.evidence) || !Array.isArray(data.coverage)) {
    throw new Error(`Company Evidence shard does not satisfy the frozen v0.2 envelope: ${shard}`);
  }
  return data;
});

export const companyEvidence = Object.freeze({
  schemaVersion: '0.2' as const,
  claims: shards.flatMap(shard => shard.claims),
  evidence: shards.flatMap(shard => shard.evidence),
  coverage: shards.flatMap(shard => shard.coverage),
});

export const companyEvidenceCompanyIds = new Set(companyEvidence.coverage.map(record => record.companyId));
