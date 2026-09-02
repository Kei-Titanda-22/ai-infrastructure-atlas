export type FinancialCompatibilityCode = 'ok' | 'caution' | 'blocked';

export interface NormalizedFinancialMetric {
  value: number | null;
  status?: string | null;
  basis?: string | null;
}

export interface NormalizedFinancialRecord {
  id: string;
  companyId: string;
  periodType?: string | null;
  periodLabel?: string | null;
  endDate?: string | null;
  accountingBasis?: string | null;
  metrics?: Record<string, NormalizedFinancialMetric>;
}

export interface NormalizedMetricDefinition {
  id: string;
}

export type FinancialMetricAvailability =
  | 'available'
  | 'company-missing'
  | 'period-missing'
  | 'metric-definition-missing'
  | 'metric-missing'
  | 'value-missing';

export interface FinancialMetricReference {
  companyId: string;
  metricId: string;
  financialRecordId: string | null;
  availability: FinancialMetricAvailability;
  periodType: string | null;
  status: string | null;
}

export interface FinancialCompatibility {
  code: FinancialCompatibilityCode;
  reasons: string[];
}

export interface FinancialComparisonResult {
  metricId: string;
  normalizedMetricDefinitionId: string | null;
  companyMetricRefs: FinancialMetricReference[];
  compatibility: FinancialCompatibility;
}

const compareRecord = (left: NormalizedFinancialRecord, right: NormalizedFinancialRecord) => {
  const byDate = String(left.endDate ?? '').localeCompare(String(right.endDate ?? ''));
  return byDate || left.id.localeCompare(right.id);
};

export function latestNormalizedFinancialRecord(
  companyId: string,
  history: NormalizedFinancialRecord[],
): NormalizedFinancialRecord | null {
  return [...history]
    .filter(record => record.companyId === companyId)
    .sort(compareRecord)
    .at(-1) ?? null;
}

export function assessNormalizedFinancialCompatibility(
  metricId: string,
  companyIds: string[],
  history: NormalizedFinancialRecord[],
  metricDefinitions: NormalizedMetricDefinition[],
): FinancialComparisonResult {
  const hasDefinition = metricDefinitions.some(definition => definition.id === metricId);
  const resolved = companyIds.map(companyId => {
    const record = latestNormalizedFinancialRecord(companyId, history);
    const metric = record?.metrics?.[metricId];
    let availability: FinancialMetricAvailability = 'available';
    if (!record) availability = 'company-missing';
    else if (!record.periodType || !record.periodLabel || !record.endDate) availability = 'period-missing';
    else if (!hasDefinition) availability = 'metric-definition-missing';
    else if (!metric) availability = 'metric-missing';
    else if (metric.value == null) availability = 'value-missing';
    return { companyId, record, metric, availability };
  });
  const companyMetricRefs = resolved.map(({ companyId, record, metric, availability }) => ({
    companyId,
    metricId,
    financialRecordId: record?.id ?? null,
    availability,
    periodType: record?.periodType ?? null,
    status: metric?.status ?? null,
  }));
  const result = (compatibility: FinancialCompatibility): FinancialComparisonResult => ({
    metricId,
    normalizedMetricDefinitionId: hasDefinition ? metricId : null,
    companyMetricRefs,
    compatibility,
  });

  if (!hasDefinition) {
    return result({ code: 'blocked', reasons: ['正規化指標定義がありません'] });
  }
  if (resolved.some(item => item.availability === 'period-missing')) {
    return result({ code: 'blocked', reasons: ['収録期間metadataがありません'] });
  }
  const entries = resolved.filter(item => item.availability === 'available');
  if (entries.length < 2) {
    return result({ code: 'blocked', reasons: ['2社以上に値がありません'] });
  }
  const periodTypes = new Set(entries.map(item => item.record?.periodType));
  if (periodTypes.size > 1) {
    return result({ code: 'blocked', reasons: ['四半期と通期が混在しています'] });
  }

  const reasons: string[] = [];
  if (entries.length < companyIds.length) reasons.push(`${companyIds.length - entries.length}社が未収録`);
  const accountingBases = new Set(entries.map(item => item.record?.accountingBasis));
  if (accountingBases.size > 1) reasons.push('会計基準が異なる');
  const periods = new Set(entries.map(item => `${item.record?.periodLabel}|${item.record?.endDate}`));
  if (periods.size > 1) reasons.push('最新収録期間が異なる');
  if (entries.some(item => item.metric?.status !== 'verified')) reasons.push('未検証値を含む');
  return result(reasons.length
    ? { code: 'caution', reasons }
    : { code: 'ok', reasons: ['期間・定義・算出基準が一致'] });
}

export function assessFinancialProjection(
  sets: Array<{ setId: string; orderedCompanyIds: string[] }>,
  metricIds: string[],
  history: NormalizedFinancialRecord[],
  metricDefinitions: NormalizedMetricDefinition[],
) {
  return sets.map(setRecord => ({
    setId: setRecord.setId,
    metricStates: metricIds.map(metricId => assessNormalizedFinancialCompatibility(
      metricId,
      setRecord.orderedCompanyIds,
      history,
      metricDefinitions,
    )),
  }));
}
