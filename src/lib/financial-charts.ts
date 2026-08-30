import { formatFinancialMetric, unitLabel, type FinancialMetricId, type FinancialRecord } from './financial-history';
import { formatCompactFinancialValue, type FinancialChartMetricId } from './financial-chart-format';

type FinancialMetric = {
  value: number | null;
  status: string;
  basis: string;
};

export type FinancialChartRecord = {
  id: string;
  periodType: 'quarterly' | 'annual';
  periodLabel: string;
  endDate: string;
  currency: string;
  unit: string;
  metrics: Record<FinancialChartMetricId, FinancialMetric>;
};

export type FinancialChange = {
  label: 'QoQ' | 'YoY' | '前収録期比';
  value: number;
  text: string;
  direction: 'positive' | 'negative' | 'flat';
};

export type FinancialChartPoint = {
  period: string;
  endDate: string;
  value: number;
  exactValue: string;
  compactValue: string;
  tooltipValue: string;
  change: FinancialChange | null;
};

function comparisonLabel(current: FinancialChartRecord, previous: FinancialChartRecord): FinancialChange['label'] {
  const days = Math.round((Date.parse(current.endDate) - Date.parse(previous.endDate)) / 86_400_000);
  if (current.periodType === 'annual' && days >= 300 && days <= 430) return 'YoY';
  if (current.periodType === 'quarterly' && days >= 60 && days <= 130) return 'QoQ';
  if (current.periodType === 'quarterly' && days >= 300 && days <= 430) return 'YoY';
  return '前収録期比';
}

function formatSigned(value: number, suffix: string) {
  const normalized = Math.abs(value) < 0.05 ? 0 : value;
  const sign = normalized > 0 ? '+' : '';
  return `${sign}${normalized.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}${suffix}`;
}

function calculateChange(
  current: FinancialChartRecord,
  previous: FinancialChartRecord,
  metricId: FinancialChartMetricId,
): FinancialChange | null {
  const currentValue = current.metrics[metricId].value;
  const previousValue = previous.metrics[metricId].value;
  if (currentValue == null || previousValue == null) return null;

  const label = comparisonLabel(current, previous);
  if (metricId !== 'operatingMargin' && previousValue < 0 && currentValue >= 0) {
    return { label, value: currentValue - previousValue, text: '黒字転換', direction: 'positive' };
  }
  if (metricId !== 'operatingMargin' && previousValue >= 0 && currentValue < 0) {
    return { label, value: currentValue - previousValue, text: '赤字転落', direction: 'negative' };
  }

  const value = metricId === 'operatingMargin'
    ? currentValue - previousValue
    : previousValue === 0
      ? Number.NaN
      : ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  if (!Number.isFinite(value)) return null;

  return {
    label,
    value,
    text: formatSigned(value, metricId === 'operatingMargin' ? 'pt' : '%'),
    direction: value > 0.05 ? 'positive' : value < -0.05 ? 'negative' : 'flat',
  };
}

export function normalizeFinancialSeries(records: FinancialChartRecord[], metricId: FinancialChartMetricId) {
  const sorted = [...records]
    .filter(record => record.metrics?.[metricId]?.value != null)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  const points: FinancialChartPoint[] = sorted.map((record, index) => {
    const value = Number(record.metrics[metricId].value);
    const exactValue = formatFinancialMetric(record as FinancialRecord, metricId as FinancialMetricId) ?? '—';
    const metricUnit = metricId === 'operatingMargin' ? '' : unitLabel(record as FinancialRecord);
    return {
      period: record.periodLabel,
      endDate: record.endDate,
      value,
      exactValue,
      compactValue: formatCompactFinancialValue(value, metricId, record.currency, record.unit),
      tooltipValue: metricUnit ? `${exactValue}（${metricUnit}）` : exactValue,
      change: index > 0 ? calculateChange(record, sorted[index - 1], metricId) : null,
    };
  });

  const latestRecord = sorted.at(-1) ?? null;
  return {
    points,
    latest: points.at(-1) ?? null,
    currency: latestRecord?.currency ?? '',
    unit: latestRecord?.unit ?? '',
    unitText: latestRecord ? (metricId === 'operatingMargin' ? '%' : unitLabel(latestRecord as FinancialRecord)) : '',
  };
}
