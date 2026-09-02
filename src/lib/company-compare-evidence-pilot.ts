import projection from '../data/company-compare-evidence-pilot-v01.json' with { type: 'json' };

export type PilotSetId = 'set-a' | 'set-b';
export type FinancialCompatibilityCode = 'ok' | 'caution' | 'blocked';

export interface ProjectionClaim {
  id: string;
  companyId: string;
  category: string;
  priority: 'P1' | 'P2' | 'P3';
  asOf?: string | null;
}

export interface CompareMetric {
  value: number | null;
  definitionId?: string | null;
  period?: string | null;
  basis?: string | null;
  verificationStatus?: string | null;
}

export interface CompareCompanyMetrics {
  id: string;
  metrics?: Record<string, CompareMetric>;
}

export interface FinancialCompatibility {
  code: FinancialCompatibilityCode;
  reasons: string[];
}

export const pilotCompareEvidenceProjection = projection;

export function selectSupplementalP2(
  claims: ProjectionClaim[],
  displayPriorityByCategory: Record<string, number>,
): ProjectionClaim[] {
  return claims
    .filter(claim =>
      claim.priority === 'P2'
      && Number.isInteger(displayPriorityByCategory[claim.category])
      && typeof claim.asOf === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(claim.asOf)
      && Boolean(claim.id),
    )
    .toSorted((left, right) => {
      const priority = displayPriorityByCategory[left.category] - displayPriorityByCategory[right.category];
      if (priority) return priority;
      const asOf = String(right.asOf).localeCompare(String(left.asOf));
      return asOf || left.id.localeCompare(right.id);
    })
    .slice(0, 1);
}

export function periodKind(metric: CompareMetric): string {
  const period = String(metric.period ?? '').toLowerCase();
  const basis = String(metric.basis ?? '').toLowerCase();
  if (/q[1-4]|quarter|四半期/.test(period)) return 'quarterly';
  if (/ttm|ltm/.test(period) || /ttm|ltm/.test(basis)) return 'ttm';
  if (/fy|fiscal year|通期|年度/.test(period)) return 'annual';
  return 'unknown';
}

export function basisFamily(metric: CompareMetric): string {
  const text = String(metric.basis ?? '').toLowerCase();
  if (/non.?gaap|adjusted|調整後/.test(text)) return 'adjusted';
  if (/ifrs/.test(text)) return 'ifrs';
  if (/gaap/.test(text)) return 'gaap';
  if (/atlas/.test(text)) return 'atlas';
  if (/reported|company disclosed|会社開示/.test(text)) return 'reported';
  return text;
}

// This is the data-only equivalent of the current Compare compatibility logic.
export function assessFinancialCompatibility(
  metricId: string,
  companies: CompareCompanyMetrics[],
): FinancialCompatibility {
  const entries = companies
    .map(company => company.metrics?.[metricId])
    .filter((metric): metric is CompareMetric => Boolean(metric && metric.value != null));
  if (entries.length < 2) return { code: 'blocked', reasons: ['2社以上に値がありません'] };
  const definitionIds = new Set(entries.map(metric => metric.definitionId).filter(Boolean));
  if (definitionIds.size > 1) return { code: 'blocked', reasons: ['指標定義が異なります'] };
  const kinds = new Set(entries.map(periodKind).filter(kind => kind !== 'unknown'));
  if (kinds.size > 1) return { code: 'blocked', reasons: ['四半期・通期・TTMなど期間区分が混在しています'] };
  const reasons: string[] = [];
  const periods = new Set(entries.map(metric => metric.period).filter(Boolean));
  if (periods.size > 1) reasons.push('対象期間が異なる');
  const bases = new Set(entries.map(basisFamily).filter(Boolean));
  if (bases.size > 1) reasons.push('算出基準が異なる');
  if (entries.some(metric => metric.verificationStatus && metric.verificationStatus !== 'verified')) {
    reasons.push('検証状態に注意');
  }
  return reasons.length
    ? { code: 'caution', reasons }
    : { code: 'ok', reasons: ['同一定義・同一期間'] };
}

export function retainAllMissingMetric(
  metricId: string,
  companies: CompareCompanyMetrics[],
) {
  const allMissing = companies.every(company => company.metrics?.[metricId]?.value == null);
  return {
    metricId,
    primaryVisible: !allMissing,
    retainedInDataQuality: allMissing,
  };
}

export function resolvePilotSet(setId: PilotSetId) {
  return projection.sets.find(set => set.setId === setId) ?? null;
}

export function relationProjectionForCompany(
  setId: PilotSetId,
  companyId: string,
  resolvedRelations: Array<{ relationId: string }>,
) {
  const company = resolvePilotSet(setId)?.companies.find(record => record.companyId === companyId);
  if (!company) return [];
  const allowed = new Set(company.evidenceTrace.relationIds);
  return resolvedRelations.filter(relation => allowed.has(relation.relationId));
}
