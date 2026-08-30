import baseFinancialHistory from '../data/financial-history.json';
import equipmentFinancialHistory from '../data/financial-history-v04-batch2.json';
import computeNetworkDcHistory from '../data/financial-history-v04-batch3.json';
import networkStorageHistory from '../data/financial-history-v04-batch4.json';
import kioxiaHistory from '../data/financial-history-v04-batch5.json';
import tokyoElectronHistory from '../data/financial-history-v04-batch6.json';
import samsungMarvellCredoHistory from '../data/financial-history-v04-batch7.json';
import westernDigitalHistory from '../data/financial-history-v04-batch8.json';
import foundryAnalogHistory from '../data/financial-history-v04-batch9.json';
import opticalPowerHistory from '../data/financial-history-v04-batch10.json';
import osatSubstrateHistory from '../data/financial-history-v04-batch11.json';
import materialsHistory from '../data/financial-history-v04-batch12.json';
import powerInfrastructureHistory from '../data/financial-history-v04-batch13.json';
import powerHvacHistory from '../data/financial-history-v04-batch14.json';
import legrandHistory from '../data/financial-history-v04-batch15.json';
import schneiderSiemensEnergyHistory from '../data/financial-history-v04-batch16.json';
import osatMaterialsHistory from '../data/financial-history-v04-batch17.json';
import edaPowerSemisHistory from '../data/financial-history-v04-batch18.json';
import powerSemiconductorHistory from '../data/financial-history-v04-batch19.json';
import equipmentExpansionHistory from '../data/financial-history-v04-batch20.json';
import cashFlowOverrides from '../data/financial-history-v04-cashflow-overrides.json';
import metricDefinitions from '../data/financial-metric-definitions-v04.json';

const overrideById = new Map(cashFlowOverrides.map(item => [item.id, item]));

export const financialHistory = [...baseFinancialHistory, ...equipmentFinancialHistory, ...computeNetworkDcHistory, ...networkStorageHistory, ...kioxiaHistory, ...tokyoElectronHistory, ...samsungMarvellCredoHistory, ...westernDigitalHistory, ...foundryAnalogHistory, ...opticalPowerHistory, ...osatSubstrateHistory, ...materialsHistory, ...powerInfrastructureHistory, ...powerHvacHistory, ...legrandHistory, ...schneiderSiemensEnergyHistory, ...osatMaterialsHistory, ...edaPowerSemisHistory, ...powerSemiconductorHistory, ...equipmentExpansionHistory].map(record => {
  const override = overrideById.get(record.id);
  if (!override) return record;
  return {
    ...record,
    ...override,
    metrics: {
      ...record.metrics,
      ...override.metrics,
    },
  };
});
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
  const currency: Record<string, string> = { USD: '米ドル', JPY: '円', TWD: '台湾ドル', KRW: '韓国ウォン', EUR: 'ユーロ', CNY: '人民元' };
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
