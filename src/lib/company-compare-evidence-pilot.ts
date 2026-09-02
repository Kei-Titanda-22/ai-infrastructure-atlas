import projection from '../data/company-compare-evidence-pilot-v01.json' with { type: 'json' };

export type PilotSetId = 'set-a' | 'set-b';

export interface ProjectionClaim {
  id: string;
  companyId: string;
  category: string;
  priority: 'P1' | 'P2' | 'P3';
  asOf?: string | null;
}

export interface CompareCompanyMetrics {
  id: string;
  metrics?: Record<string, { value: number | null }>;
}

export const pilotCompareEvidenceProjection = projection;

export function selectSupplementalP2(
  claims: ProjectionClaim[],
  categoryProjectionPriority: Record<string, number>,
): ProjectionClaim[] {
  return claims
    .filter(claim =>
      claim.priority === 'P2'
      && Number.isInteger(categoryProjectionPriority[claim.category])
      && typeof claim.asOf === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(claim.asOf)
      && Boolean(claim.id),
    )
    .toSorted((left, right) => {
      const priority = categoryProjectionPriority[left.category] - categoryProjectionPriority[right.category];
      if (priority) return priority;
      const asOf = String(right.asOf).localeCompare(String(left.asOf));
      return asOf || left.id.localeCompare(right.id);
    })
    .slice(0, 1);
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

export interface ProjectionRelation {
  relationId: string;
  relationType: string;
  subjectType: string;
  subjectId: string;
  objectType: string;
  objectId: string;
}

export function initialRelationIdsForDimension(
  companyId: string,
  dimensionId: string,
  relations: ProjectionRelation[],
): string[] {
  return [...new Set(relations.filter(relation => {
    if (dimensionId === 'value-chain-position') {
      return relation.relationType === 'POSITIONED_IN'
        && relation.subjectType === 'company'
        && relation.subjectId === companyId;
    }
    if (dimensionId === 'key-products') {
      return relation.relationType === 'PRODUCES'
        && relation.subjectType === 'company'
        && relation.subjectId === companyId;
    }
    if (dimensionId === 'technology-moat') {
      return relation.relationType === 'COMPETES_WITH'
        && ((relation.subjectType === 'company' && relation.subjectId === companyId)
          || (relation.objectType === 'company' && relation.objectId === companyId));
    }
    return false;
  }).map(relation => relation.relationId))].sort();
}
