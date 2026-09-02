import relationshipRecords from '../data/relationships.json' with { type: 'json' };
import relationEvidenceBindingRecords from '../data/relation-evidence-bindings-v01.json' with { type: 'json' };
import { deriveEvidenceFreshness } from './evidence-freshness.ts';

export const relationSchemaVersion = '0.1' as const;

export type RelationEntityType =
  | 'company'
  | 'product'
  | 'technology'
  | 'value-chain-node'
  | 'facility'
  | 'market';

export type RelationType =
  | 'PRODUCES'
  | 'DEVELOPS'
  | 'USES'
  | 'ENABLES'
  | 'SUPPLIES_TO'
  | 'COMPETES_WITH'
  | 'OPERATES'
  | 'POSITIONED_IN';

export type RelationClaimType =
  | 'fact'
  | 'company-guidance'
  | 'company-positioning'
  | 'atlas-analysis'
  | 'estimate';

export type RelationImportance = 'P1' | 'P2' | 'P3';
export type RelationConfidence = 'low' | 'medium' | 'high' | null;
export type RelationFreshnessStatus = 'current' | 'review-due' | 'stale';
export type RelationSupport = 'supports' | 'context' | 'contradicts';

export interface RelationScope {
  productIds: readonly string[];
  technologyIds: readonly string[];
  valueChainNodeIds: readonly string[];
  marketIds: readonly string[];
  geographies: readonly string[];
  businessUnit: null;
  capacityBasis: string | null;
}

export interface AuthoringRelation {
  relationId: string;
  subjectType: RelationEntityType;
  subjectId: string;
  relationType: RelationType;
  objectType: RelationEntityType;
  objectId: string;
  scope: RelationScope;
  statement: string;
  claimType: RelationClaimType;
  asOf: string;
  lastVerified: string | null;
  nextReview: string | null;
  importance: RelationImportance;
  displayPriority: number;
  confidence: RelationConfidence;
  validFrom: string | null;
  validTo: string | null;
  supersededBy: string | null;
}

export interface RelationEvidenceBinding {
  id: string;
  relationId: string;
  sourceId: string;
  support: RelationSupport;
  locator: Readonly<Record<string, string>>;
  lastChecked: string;
  notes?: string;
}

export interface ResolvedRelation extends AuthoringRelation {
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  freshnessStatus: RelationFreshnessStatus;
}

const compareText = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;

const assertStableIdOrder = <T>(records: readonly T[], idOf: (record: T) => string, label: string) => {
  const ids = records.map(idOf);
  const expected = [...ids].sort(compareText);
  if (ids.some((id, index) => id !== expected[index])) {
    throw new Error(`${label} records are not in stable ID order`);
  }
};

const assertUniqueIds = <T>(records: readonly T[], idOf: (record: T) => string, label: string) => {
  const seen = new Set<string>();
  for (const record of records) {
    const id = idOf(record);
    if (seen.has(id)) throw new Error(`Duplicate ${label} ID: ${id}`);
    seen.add(id);
  }
};

const freezeScope = (scope: RelationScope): RelationScope => Object.freeze({
  ...scope,
  productIds: Object.freeze([...scope.productIds]),
  technologyIds: Object.freeze([...scope.technologyIds]),
  valueChainNodeIds: Object.freeze([...scope.valueChainNodeIds]),
  marketIds: Object.freeze([...scope.marketIds]),
  geographies: Object.freeze([...scope.geographies]),
});

const freezeRelation = (relation: AuthoringRelation): AuthoringRelation => Object.freeze({
  ...relation,
  scope: freezeScope(relation.scope),
});

const freezeBinding = (binding: RelationEvidenceBinding): RelationEvidenceBinding => Object.freeze({
  ...binding,
  locator: Object.freeze({ ...binding.locator }),
});

export const deriveRelationFreshness = (
  nextReview: string | null | undefined,
  referenceDate = new Date(),
): RelationFreshnessStatus => {
  const freshness = deriveEvidenceFreshness(nextReview, referenceDate).key;
  // Relation freshness has no not-applicable state. A missing review date cannot
  // establish currency, so the conservative resolved state is stale.
  return freshness === 'not-applicable' ? 'stale' : freshness;
};

export const buildResolvedRelations = (
  authoringRelations: readonly AuthoringRelation[],
  evidenceBindings: readonly RelationEvidenceBinding[],
  referenceDate = new Date(),
): readonly ResolvedRelation[] => {
  assertUniqueIds(authoringRelations, relation => relation.relationId, 'Relation');
  assertUniqueIds(evidenceBindings, binding => binding.id, 'Relation Evidence Binding');

  const relationIds = new Set(authoringRelations.map(relation => relation.relationId));
  const bindingsByRelation = new Map<string, RelationEvidenceBinding[]>();
  for (const binding of evidenceBindings) {
    if (!relationIds.has(binding.relationId)) {
      throw new Error(`Relation Evidence Binding references unknown Relation: ${binding.relationId}`);
    }
    const group = bindingsByRelation.get(binding.relationId) ?? [];
    group.push(binding);
    bindingsByRelation.set(binding.relationId, group);
  }

  return Object.freeze(
    [...authoringRelations]
      .sort((left, right) => compareText(left.relationId, right.relationId))
      .map(relation => {
        const bindings = [...(bindingsByRelation.get(relation.relationId) ?? [])]
          .sort((left, right) => compareText(left.id, right.id));
        const evidenceIds = Object.freeze(bindings.map(binding => binding.id));
        const sourceIds = Object.freeze([...new Set(bindings.map(binding => binding.sourceId))].sort(compareText));
        return Object.freeze({
          ...freezeRelation(relation),
          evidenceIds,
          sourceIds,
          freshnessStatus: deriveRelationFreshness(relation.nextReview, referenceDate),
        });
      }),
  );
};

const productionRelations = (relationshipRecords as unknown as AuthoringRelation[]).map(freezeRelation);
const productionBindings = (relationEvidenceBindingRecords as unknown as RelationEvidenceBinding[]).map(freezeBinding);

assertStableIdOrder(productionRelations, relation => relation.relationId, 'Relation');
assertStableIdOrder(productionBindings, binding => binding.id, 'Relation Evidence Binding');

export const relations = Object.freeze(productionRelations);
export const relationEvidenceBindings = Object.freeze(productionBindings);
export const resolvedRelations = buildResolvedRelations(relations, relationEvidenceBindings);

export const relationById: ReadonlyMap<string, ResolvedRelation> = new Map(
  resolvedRelations.map(relation => [relation.relationId, relation]),
);

export const relationEvidenceBindingById: ReadonlyMap<string, RelationEvidenceBinding> = new Map(
  relationEvidenceBindings.map(binding => [binding.id, binding]),
);

export const resolveRelation = (relationId: string) => relationById.get(relationId);

export const resolveRelationEvidence = (relationId: string) => Object.freeze(
  relationEvidenceBindings.filter(binding => binding.relationId === relationId),
);

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeObjectKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([left], [right]) => compareText(left, right))
        .map(([key, nestedValue]) => [key, canonicalizeObjectKeys(nestedValue)]),
    );
  }
  return value;
};

const canonicalizeResolvedRelation = (relation: ResolvedRelation) => ({
  ...relation,
  scope: {
    ...relation.scope,
    productIds: [...relation.scope.productIds].sort(compareText),
    technologyIds: [...relation.scope.technologyIds].sort(compareText),
    valueChainNodeIds: [...relation.scope.valueChainNodeIds].sort(compareText),
    marketIds: [...relation.scope.marketIds].sort(compareText),
    geographies: [...relation.scope.geographies].sort(compareText),
  },
  evidenceIds: [...relation.evidenceIds].sort(compareText),
  sourceIds: [...relation.sourceIds].sort(compareText),
});

export const serializeResolvedRelations = (records: readonly ResolvedRelation[]) => JSON.stringify(
  canonicalizeObjectKeys(
    [...records]
      .sort((left, right) => compareText(left.relationId, right.relationId))
      .map(canonicalizeResolvedRelation),
  ),
);
