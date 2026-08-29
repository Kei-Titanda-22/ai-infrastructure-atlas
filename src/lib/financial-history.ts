import financialHistory from '../data/financial-history.json';
import metricDefinitions from '../data/financial-metric-definitions-v04.json';

export type FinancialRecord = (typeof financialHistory)[number];
export type FinancialMetricId = keyof FinancialRecord['metrics'];

export const financialMetricDefinitions = new Map(metricDefinitions.map(item => [item.id, item]));

export function getFinancialHistory(companyId: string, periodType?: 'quarterly' | 'annual') {
  return financialHistory
    .filter(record => record.companyId === companyId && (!periodType || record.periodType === periodType))
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
}

export function getLatestFinancialRecord(companyId: string) {
  return getFinancialHistory(companyId).at(-1);
}

export function financialCoverage() {
  const companyIds = new Set(financialHistory.map(record => record.companyId));
  const verifiedMetricCount = financialHistory.reduce((count, record) => count + Object.values(record.metrics).filter(metric => metric.status === 'verified').length, 0);
  return {
    companies: companyIds.size,
    periods: financialHistory.length,
    quarterly: financialHistory.filter(record => record.periodType === 'quarterly').length,
    annual: financialHistory.filter(record => record.periodType === 'annual').length,
    verifiedMetrics: verifiedMetricCount,
  };
}

export function unitLabel(record: FinancialRecord) {
  const currency: Record<string, string> = { USD: '米ドル', JPY: '円', TWD: '台湾ドル', KRW: '韓国ウォン', EUR: 'ユーロ' };
  const scale: Record<string, string> = { million: '百万', billion: '十億', trillion: '兆' };
  return `${currency[record.currency] ?? record.currency}・${scale[record.unit] ?? record.unit}`;
}

export function formatFinancialMetric(record: FinancialRecord, metricId: FinancialMetricId) {
  const metric = record.metrics[metricId];
  if (metric.value == null) return null;
  const value = Number(metric.value);
  if (metricId === 'operatingMargin') return `${value.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}%`;
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 4 });
}

export function financialStatusLabel(status: string) {
  const labels: Record<string, string> = {
    verified: '検証済み',
    'source-linked': '一次資料紐付け済み',
    'needs-review': '要再検証',
    'not-collected': '未収録',
    'primary-source-unchecked': '一次資料未確認',
    'not-calculable': '算出不能',
    'not-disclosed': '非開示',
    'not-applicable': '対象外',
  };
  return labels[status] ?? status;
}

export { financialHistory };
