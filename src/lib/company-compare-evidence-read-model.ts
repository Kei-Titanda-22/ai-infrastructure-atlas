import productRegistry from '../data/product-registry-v01.json' with { type: 'json' };
import technologyRegistry from '../data/technology-registry-v01.json' with { type: 'json' };
import valueChain from '../data/value-chain.json' with { type: 'json' };
import {
  compareProductDisplayNameOverrides,
  compareProductIdsByClaimId,
  compareTechnologyIdsByClaimId,
  companyCompareDisplayName,
  companyCompareDisplayNameParts,
  dedupeCompareCanonicalItems,
  localizeCompareLocation,
  resolveCompareClaimDisplay,
  resolveCompareFinancialTablePresentation,
  resolveCompareProductDisplayDescription,
  type CompareCanonicalDisplayItem,
  type CompareDisplayCopy,
  type CompareDisplayNameParts,
  type CompareProductDisplayDescription,
} from './company-compare-display.ts';
import {
  firstBatchClaimDisplay,
  firstBatchCompanies,
  firstBatchCompanyIds,
  firstBatchProductEntries,
  firstBatchProductIdsByClaimId,
  firstBatchStages,
} from './company-compare-first-batch.ts';
import { companyEvidence, type CompanyEvidenceBinding, type CompanyEvidenceClaim } from './company-evidence.ts';
import { pilotCompareEvidenceProjection } from './company-compare-evidence-pilot.ts';
import { deriveRelationVerificationPresentation, type RelationVerificationPresentation } from './company-compare-evidence-ui.ts';
import { assessFinancialProjection } from './financial-comparison-contract.ts';
import { financialHistory, financialMetricDefinitions } from './financial-history.ts';
import {
  relationEvidenceBindingById,
  relationById,
  type RelationEvidenceBinding,
  type ResolvedRelation,
} from './relations.ts';
import { resolveSource, type SourceRecord } from './source-registry.ts';

export const compareEvidenceDimensionLabels: Readonly<Record<string, string>> = Object.freeze({
  'company-identity': '企業情報',
  'ai-role': 'AIインフラでの役割',
  'value-chain-position': '供給網上の位置',
  'key-products': '主な製品',
  'technology-moat': '技術・競争力',
  'capacity-roadmap': '設備能力・ロードマップ',
  financial: '財務',
  'key-risks': '主なリスク',
  'evidence-trace': '根拠の追跡・データ品質',
});

export const compareEvidencePrimaryDimensionIds = Object.freeze(
  pilotCompareEvidenceProjection.policy.dimensionOrder.filter(dimensionId => dimensionId !== 'evidence-trace'),
);

export interface CompareEvidenceIdentity {
  id: string;
  href: string;
  name: string;
  japaneseName?: string | null;
  officialName?: string | null;
  reading?: string | null;
  ticker?: string | null;
  country: string;
  primaryLayer: string;
  lastReviewed?: string | null;
  displayName?: string;
  displayNameParts?: CompareDisplayNameParts;
  displayCountry?: string;
}

export interface CompareEvidenceClaimEntry {
  claim: CompanyEvidenceClaim;
  bindings: CompanyEvidenceBinding[];
  sources: SourceRecord[];
  display: CompareDisplayCopy;
}

export interface CompareEvidenceRelationEntry {
  relation: ResolvedRelation;
  bindings: RelationEvidenceBinding[];
  sources: SourceRecord[];
  objectLabel: string;
  scopeLabel: string;
  verification: RelationVerificationPresentation;
  display: CompareDisplayCopy;
  productDescription: ({ productId: string } & CompareProductDisplayDescription) | null;
}

const claimById = new Map(companyEvidence.claims.map(claim => [claim.id, claim]));
const claimBindingById = new Map(companyEvidence.evidence.map(binding => [binding.id, binding]));
const financialRecordById = new Map(financialHistory.map(record => [record.id, record]));
const firstBatchProductEntryById = new Map(firstBatchProductEntries.map(record => [record.canonicalId, record]));

const productLabelById = new Map(productRegistry.records.map(record => [
  record.id,
  compareProductDisplayNameOverrides[record.id] || record.displayNames.ja || record.canonicalName,
]).concat(firstBatchProductEntries.map(record => [record.canonicalId, record.label])));
const technologyLabelById = new Map(technologyRegistry.records.map(record => [
  record.id,
  record.displayNames.ja || record.canonicalName,
]));
const valueChainLabelById = new Map(valueChain.map(record => [record.id, record.name]));

const relationObjectLabel = (relation: ResolvedRelation) => {
  if (relation.objectType === 'product') {
    return productLabelById.get(relation.objectId) ?? relation.objectId;
  }
  if (relation.objectType === 'technology') {
    return technologyLabelById.get(relation.objectId) ?? relation.objectId;
  }
  if (relation.objectType === 'value-chain-node') {
    return valueChainLabelById.get(relation.objectId) ?? relation.objectId;
  }
  return relation.objectId;
};

const resolveRequiredSource = (sourceId: string) => {
  const source = resolveSource(sourceId);
  if (!source) throw new Error(`Company Compare Evidence UI cannot resolve Source: ${sourceId}`);
  return source;
};

const resolveDisplayClaim = (claimId: string) => {
  const stageCopy = firstBatchClaimDisplay[claimId];
  if (!stageCopy) return resolveCompareClaimDisplay(claimId);
  return { ...stageCopy, groundingIds: [claimId] };
};

const resolveProductDescription = (productId: string) => {
  const stageEntry = firstBatchProductEntryById.get(productId);
  if (!stageEntry) return resolveCompareProductDisplayDescription(productId);
  return { description: stageEntry.description, groundingIds: [stageEntry.groundingId] };
};

const productIdsForClaim = (claimId: string) =>
  firstBatchProductIdsByClaimId[claimId] ?? compareProductIdsByClaimId[claimId] ?? [];

const resolveClaimEntry = (claimId: string, companyId: string): CompareEvidenceClaimEntry => {
  const claim = claimById.get(claimId);
  if (!claim) throw new Error(`Company Compare Evidence UI cannot resolve Claim: ${claimId}`);
  if (claim.companyId !== companyId) {
    throw new Error(`Company Compare Evidence UI Claim company mismatch: ${claimId}`);
  }
  const bindings = claim.evidenceIds.map(evidenceId => {
    const binding = claimBindingById.get(evidenceId);
    if (!binding) throw new Error(`Company Compare Evidence UI cannot resolve Binding: ${evidenceId}`);
    if (binding.claimId !== claim.id) {
      throw new Error(`Company Compare Evidence UI Binding Claim mismatch: ${evidenceId}`);
    }
    resolveRequiredSource(binding.sourceId);
    return binding;
  });
  const sources = [...new Map(bindings.map(binding => {
    const source = resolveRequiredSource(binding.sourceId);
    return [source.id, source] as const;
  })).values()];
  return { claim, bindings, sources, display: resolveDisplayClaim(claim.id) };
};

const labelIds = (ids: readonly string[], labels: ReadonlyMap<string, string>, label: string) => ids.map(id => {
  const value = labels.get(id);
  if (!value) throw new Error(`Company Compare Evidence UI cannot resolve ${label}: ${id}`);
  return value;
});

export const formatRelationScope = (relation: ResolvedRelation) => {
  const parts: string[] = [];
  if (relation.scope.productIds.length) {
    parts.push(`製品：${labelIds(relation.scope.productIds, productLabelById, 'Product').join('、')}`);
  }
  if (relation.scope.technologyIds.length) {
    parts.push(`技術：${labelIds(relation.scope.technologyIds, technologyLabelById, 'Technology').join('、')}`);
  }
  if (relation.scope.valueChainNodeIds.length) {
    parts.push(`供給網：${labelIds(relation.scope.valueChainNodeIds, valueChainLabelById, 'ValueChainNode').join('、')}`);
  }
  if (relation.scope.marketIds.length) parts.push(`市場：${relation.scope.marketIds.join('、')}`);
  if (relation.scope.geographies.length) parts.push(`地域：${relation.scope.geographies.join('、')}`);
  if (relation.scope.capacityBasis) parts.push(`能力基準：${relation.scope.capacityBasis}`);
  return parts.join(' / ') || '会社全体';
};

const relationDisplay = (
  relation: ResolvedRelation,
  objectLabel: string,
  identityById: ReadonlyMap<string, CompareEvidenceIdentity>,
): CompareDisplayCopy => {
  if (relation.relationType === 'PRODUCES') {
    return { title: objectLabel, statement: '', groundingIds: [relation.relationId] };
  }
  if (relation.relationType === 'POSITIONED_IN') {
    return { title: objectLabel, statement: '', groundingIds: [relation.relationId] };
  }
  if (relation.relationType === 'COMPETES_WITH') {
    const subject = identityById.get(relation.subjectId);
    const object = identityById.get(relation.objectId);
    if (!subject || !object) {
      throw new Error(`Company Compare display cannot resolve Relation endpoint: ${relation.relationId}`);
    }
    const products = labelIds(relation.scope.productIds, productLabelById, 'Product').join('・');
    return {
      title: '競合関係',
      statement: `${companyCompareDisplayName(subject)}と${companyCompareDisplayName(object)}は${products || '対象製品'}で競合する。`,
      groundingIds: [relation.relationId],
    };
  }
  throw new Error(`Company Compare display does not support Relation type: ${relation.relationType}`);
};

const resolveRelationEntry = (
  relationId: string,
  identityById: ReadonlyMap<string, CompareEvidenceIdentity>,
): CompareEvidenceRelationEntry => {
  const relation = relationById.get(relationId);
  if (!relation) throw new Error(`Company Compare Evidence UI cannot resolve Relation: ${relationId}`);
  const verification = deriveRelationVerificationPresentation(
    relation,
    relationEvidenceBindingById,
    sourceId => resolveSource(sourceId),
  );
  const bindings = relation.evidenceIds.map(evidenceId => {
    const binding = relationEvidenceBindingById.get(evidenceId);
    if (!binding) throw new Error(`Company Compare Evidence UI cannot resolve Relation Binding: ${evidenceId}`);
    if (binding.relationId !== relation.relationId) {
      throw new Error(`Company Compare Evidence UI Relation Binding mismatch: ${evidenceId}`);
    }
    resolveRequiredSource(binding.sourceId);
    return binding;
  });
  const sources = [...new Map(bindings.map(binding => {
    const source = resolveRequiredSource(binding.sourceId);
    return [source.id, source] as const;
  })).values()];
  const objectLabel = relationObjectLabel(relation);
  return {
    relation,
    bindings,
    sources,
    objectLabel,
    scopeLabel: formatRelationScope(relation),
    verification,
    display: relationDisplay(relation, objectLabel, identityById),
    productDescription: relation.relationType === 'PRODUCES'
      ? { productId: relation.objectId, ...resolveCompareProductDisplayDescription(relation.objectId) }
      : null,
  };
};

const productDisplayItem = (canonicalId: string, groundingIds: readonly string[]): CompareCanonicalDisplayItem => {
  const label = productLabelById.get(canonicalId);
  if (!label) throw new Error(`Company Compare display cannot resolve Product: ${canonicalId}`);
  const description = resolveProductDescription(canonicalId);
  return {
    canonicalId,
    label,
    groundingIds,
    description: description.description,
    descriptionGroundingIds: description.groundingIds,
  };
};

const displayTechnologies = (claims: readonly CompareEvidenceClaimEntry[]): CompareCanonicalDisplayItem[] =>
  dedupeCompareCanonicalItems(claims.flatMap(entry =>
    (compareTechnologyIdsByClaimId[entry.claim.id] ?? []).map(canonicalId => {
      const label = technologyLabelById.get(canonicalId);
      if (!label) throw new Error(`Company Compare display cannot resolve Technology: ${canonicalId}`);
      return { canonicalId, label, groundingIds: [entry.claim.id] };
    }),
  ));

const metricLabels: Readonly<Record<string, string>> = Object.freeze({
  operatingMargin: '営業利益率',
  revenueGrowth: '売上高成長率',
  revenue: '売上高',
  operatingProfit: '営業利益',
  freeCashFlow: 'フリーキャッシュフロー',
  capex: '設備投資',
  roic: 'ROIC',
});

const formatMetric = (metricId: string, value: number | null | undefined) => {
  if (value == null) return null;
  if (metricId === 'operatingMargin' || metricId === 'roic') {
    return `${Number(value).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}%`;
  }
  return Number(value).toLocaleString('ja-JP', { maximumFractionDigits: 3 });
};

const formatFinancialReference = (reference: any) => {
  const record = reference.financialRecordId ? financialRecordById.get(reference.financialRecordId) : null;
  const metric = record?.metrics?.[reference.metricId as keyof typeof record.metrics];
  if (reference.availability === 'available' && (!record || !metric || metric.value == null)) {
    throw new Error(`Company Compare Evidence UI Financial reference is unresolved: ${reference.companyId}:${reference.metricId}`);
  }
  return {
    ...reference,
    value: metric?.value ?? null,
    displayValue: formatMetric(reference.metricId, metric?.value),
    periodLabel: record?.periodLabel ?? null,
    endDate: record?.endDate ?? null,
    accountingBasis: record?.accountingBasis ?? null,
    metricBasis: metric?.basis ?? null,
    verifiedAt: record?.verifiedAt ?? null,
    source: record?.sourceId ? resolveRequiredSource(record.sourceId) : null,
  };
};

const buildExpandedFinancial = (companyId: string) => {
  const records = financialHistory
    .filter(record => record.companyId === companyId)
    .sort((left, right) => left.endDate.localeCompare(right.endDate) || left.id.localeCompare(right.id));
  const presentation = resolveCompareFinancialTablePresentation(records);
  return {
    presentation: {
      amountUnitLabel: presentation.amountUnitLabel,
      accountingBasisLabel: presentation.accountingBasisLabel,
    },
    records: records.map((record, recordIndex) => ({
      id: record.id,
      periodType: record.periodType,
      periodLabel: record.periodLabel,
      displayPeriodLabel: presentation.periodLabels[recordIndex],
      endDate: record.endDate,
      currency: record.currency,
      unit: record.unit,
      accountingBasis: record.accountingBasis,
      verifiedAt: record.verifiedAt,
      source: resolveRequiredSource(record.sourceId),
      metrics: Object.entries(record.metrics)
        .filter(([metricId, metric]) => metric.value != null && metricId in metricLabels)
        .map(([metricId, metric]) => ({
          metricId,
          label: metricLabels[metricId],
          value: metric.value,
          displayValue: formatMetric(metricId, metric.value),
          status: metric.status,
          basis: metric.basis,
        })),
    })),
  };
};

const buildDisplayOnlyProjectionCompany = (record: (typeof firstBatchCompanies)[number]) => {
  const projectedClaimIds = [...new Set(Object.values(record.dimensions).flat())];
  const projectedClaims = projectedClaimIds.map(claimId => {
    const claim = claimById.get(claimId);
    if (!claim) throw new Error(`Company Compare first-batch Claim does not resolve: ${claimId}`);
    if (claim.companyId !== record.companyId) {
      throw new Error(`Company Compare first-batch Claim company mismatch: ${record.companyId}:${claimId}`);
    }
    if (!claim.evidenceIds.length) throw new Error(`Company Compare first-batch Claim has no Evidence: ${claimId}`);
    return claim;
  });
  const bindings = projectedClaims.flatMap(claim => claim.evidenceIds.map(evidenceId => {
    const binding = claimBindingById.get(evidenceId);
    if (!binding || binding.claimId !== claim.id) {
      throw new Error(`Company Compare first-batch Binding does not resolve: ${claim.id}:${evidenceId}`);
    }
    resolveRequiredSource(binding.sourceId);
    return binding;
  }));
  const dimensions = pilotCompareEvidenceProjection.policy.dimensionOrder.map(dimensionId => ({
    dimensionId,
    initialClaimIds: dimensionId in record.dimensions
      ? [...record.dimensions[dimensionId as keyof typeof record.dimensions]]
      : [],
    initialRelationIds: [],
    projectionStatus: 'present',
    missingState: 'not-missing',
    missingReason: null,
    coverageContext: [],
    supplementalP2: false,
  }));
  return {
    companyId: record.companyId,
    dimensions,
    evidenceTrace: {
      companyEvidenceBindingIds: [...new Set(bindings.map(binding => binding.id))].sort(),
      companyEvidenceSourceIds: [...new Set(bindings.map(binding => binding.sourceId))].sort(),
      relationIds: [],
      relationEvidenceBindingIds: [],
      relationSourceIds: [],
    },
  };
};

export function buildCompanyCompareEvidenceReadModel(identities: CompareEvidenceIdentity[]) {
  const pilotCompanyIds = [...new Set(pilotCompareEvidenceProjection.sets.flatMap(setRecord => setRecord.orderedCompanyIds))];
  const supportedCompanyIds = [...pilotCompanyIds, ...firstBatchCompanyIds];
  const supportedCompanyIdSet = new Set(supportedCompanyIds);
  const identityById = new Map(identities.map(identity => [identity.id, {
    ...identity,
    displayName: companyCompareDisplayName(identity),
    displayNameParts: companyCompareDisplayNameParts(identity),
    displayCountry: supportedCompanyIdSet.has(identity.id) ? localizeCompareLocation(identity.country) : identity.country,
  }]));
  for (const companyId of supportedCompanyIds) {
    if (!identityById.has(companyId)) {
      throw new Error(`Company Compare Evidence UI cannot resolve Company: ${companyId}`);
    }
  }

  const projectedCompanies = new Map<string, any>([
    ...pilotCompareEvidenceProjection.sets.flatMap(setRecord =>
      setRecord.companies.map(company => [company.companyId, company] as const),
    ),
    ...firstBatchCompanies.map(record => [record.companyId, buildDisplayOnlyProjectionCompany(record)] as const),
  ]);
  const companies = supportedCompanyIds.map(companyId => {
    const projected = projectedCompanies.get(companyId);
    if (!projected) throw new Error(`Company Compare Evidence UI cannot resolve Projection company: ${companyId}`);
    const expandedFinancial = buildExpandedFinancial(companyId);
    return {
      identity: identityById.get(companyId)!,
      dimensions: projected.dimensions.map(dimension => {
        const claims = dimension.initialClaimIds.map(claimId => resolveClaimEntry(claimId, companyId));
        const relations = dimension.initialRelationIds.map(relationId => resolveRelationEntry(relationId, identityById));
        const relationProducts = relations
          .filter(entry => entry.relation.relationType === 'PRODUCES')
          .map(entry => productDisplayItem(entry.relation.objectId, [entry.relation.relationId]));
        const claimProducts = claims.flatMap(entry =>
          productIdsForClaim(entry.claim.id)
            .map(productId => productDisplayItem(productId, [entry.claim.id])),
        );
        const displayProducts = dedupeCompareCanonicalItems([...relationProducts, ...claimProducts]);
        return {
          ...dimension,
          claims,
          relations,
          displayProducts,
          displayTechnologies: displayTechnologies(claims),
        };
      }),
      evidenceTrace: projected.evidenceTrace,
      expandedFinancial: expandedFinancial.records,
      expandedFinancialPresentation: expandedFinancial.presentation,
    };
  });

  const sets = pilotCompareEvidenceProjection.sets.map(setRecord => ({
    setId: setRecord.setId,
    orderedCompanyIds: [...setRecord.orderedCompanyIds],
    financial: {
      ...setRecord.financial,
      metricStates: setRecord.financial.metricStates.map(metricState => ({
        ...metricState,
        companyMetricRefs: metricState.companyMetricRefs.map(formatFinancialReference),
      })),
    },
  }));
  const firstBatchFinancialSelections = firstBatchStages.flatMap(stage => stage.setId !== 'first-batch-stage-1'
    ? [stage, ...stage.orderedCompanyIds.map(companyId => ({
        setId: `${stage.setId}-${companyId}`,
        orderedCompanyIds: [companyId],
      }))]
    : [stage]);
  const firstBatchFinancialProjection = assessFinancialProjection(
    firstBatchFinancialSelections,
    ['operatingMargin', 'revenueGrowth'],
    financialHistory,
    [...financialMetricDefinitions.values()],
  );
  const presentationFinancialSets = [
    ...sets,
    ...firstBatchFinancialProjection.map(setRecord => ({
      setId: setRecord.setId,
      orderedCompanyIds: [...firstBatchFinancialSelections.find(selection => selection.setId === setRecord.setId)!.orderedCompanyIds],
      financial: {
        metricStates: setRecord.metricStates.map(metricState => ({
          ...metricState,
          companyMetricRefs: metricState.companyMetricRefs.map(formatFinancialReference),
        })),
      },
    })),
  ];

  const collectUsedSourceIds = (selectedCompanies: typeof companies) => {
    const sourceIds = new Set<string>();
    for (const company of selectedCompanies) {
      for (const dimension of company.dimensions) {
        dimension.claims.forEach(entry => entry.bindings.forEach(binding => sourceIds.add(binding.sourceId)));
        dimension.relations.forEach(entry => entry.bindings.forEach(binding => sourceIds.add(binding.sourceId)));
      }
    }
    return sourceIds;
  };
  const pilotUsedSourceIds = collectUsedSourceIds(companies.filter(company => pilotCompanyIds.includes(company.identity.id)));
  const firstBatchSourceGroups = firstBatchStages.map(stage => collectUsedSourceIds(
    companies.filter(company => stage.orderedCompanyIds.includes(company.identity.id as never)),
  ));
  const orderedSourceIds = [
    ...[...pilotUsedSourceIds].sort(),
    ...firstBatchSourceGroups.flatMap((group, index) => [...group]
      .filter(sourceId => !pilotUsedSourceIds.has(sourceId)
        && firstBatchSourceGroups.slice(0, index).every(previous => !previous.has(sourceId)))
      .sort()),
  ];
  const sourceNumberById = Object.fromEntries(
    orderedSourceIds.map((sourceId, index) => [sourceId, index + 1]),
  );

  return {
    schemaVersion: '0.1',
    pilotCompanyIds,
    supportedCompanyIds,
    dimensionOrder: [...compareEvidencePrimaryDimensionIds],
    dimensionLabels: compareEvidenceDimensionLabels,
    companies,
    sets,
    presentationFinancialSets,
    sourceNumberById,
  } as const;
}

export function companyCompareEvidenceSemanticSnapshot(identities: CompareEvidenceIdentity[]) {
  const model = buildCompanyCompareEvidenceReadModel(identities);
  const pilotCompanies = model.companies.filter(company => model.pilotCompanyIds.includes(company.identity.id));
  const claimEntries = pilotCompanies.flatMap(company => company.dimensions.flatMap(dimension => dimension.claims));
  const relationEntries = pilotCompanies.flatMap(company => company.dimensions.flatMap(dimension => dimension.relations));
  const financialStates = model.sets.flatMap(setRecord => setRecord.financial.metricStates);
  return {
    dimensionOrder: model.dimensionOrder,
    setCompanyIds: Object.fromEntries(model.sets.map(setRecord => [setRecord.setId, setRecord.orderedCompanyIds])),
    priorityCounts: {
      P1: claimEntries.filter(entry => entry.claim.priority === 'P1').length,
      P2: claimEntries.filter(entry => entry.claim.priority === 'P2').length,
      P3: claimEntries.filter(entry => entry.claim.priority === 'P3').length,
    },
    claimMarkerCount: claimEntries.length,
    relationMarkerCount: relationEntries.length,
    markerCount: claimEntries.length + relationEntries.length,
    unresolvedEvidenceCount: [...claimEntries, ...relationEntries].filter(entry => !entry.bindings.length || !entry.sources.length).length,
    relationPlacementCounts: Object.fromEntries(model.dimensionOrder.map(dimensionId => [
      dimensionId,
      pilotCompanies.reduce((count, company) => count + (company.dimensions.find(dimension => dimension.dimensionId === dimensionId)?.relations.length ?? 0), 0),
    ])),
    financialCounts: {
      ok: financialStates.filter(state => state.compatibility.code === 'ok').length,
      caution: financialStates.filter(state => state.compatibility.code === 'caution').length,
      blocked: financialStates.filter(state => state.compatibility.code === 'blocked').length,
    },
  };
}
