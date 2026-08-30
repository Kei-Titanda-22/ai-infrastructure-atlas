export type FinancialChartMetricId = 'revenue' | 'operatingProfit' | 'operatingMargin' | 'freeCashFlow' | 'capex';

const UNIT_MULTIPLIER: Record<string, number> = {
  million: 1_000_000,
  billion: 1_000_000_000,
  trillion: 1_000_000_000_000,
};

function formatCompactNumber(value: number) {
  const absolute = Math.abs(value);
  const maximumFractionDigits = absolute >= 100 ? 0 : absolute >= 10 ? 1 : 2;
  return value.toLocaleString('ja-JP', { maximumFractionDigits });
}

function amountParts(value: number, unit: string) {
  const baseValue = value * (UNIT_MULTIPLIER[unit] ?? 1);
  const absolute = Math.abs(baseValue);

  if (absolute >= 1_000_000_000_000) return { value: baseValue / 1_000_000_000_000, suffix: 'T' };
  if (absolute >= 1_000_000_000) return { value: baseValue / 1_000_000_000, suffix: 'B' };
  if (absolute >= 1_000_000) return { value: baseValue / 1_000_000, suffix: 'M' };
  if (absolute >= 1_000) return { value: baseValue / 1_000, suffix: 'K' };
  return { value: baseValue, suffix: '' };
}

export function formatCompactFinancialValue(
  value: number,
  metricId: FinancialChartMetricId,
  currency: string,
  unit: string,
) {
  if (metricId === 'operatingMargin') return `${formatCompactNumber(value)}%`;

  const baseValue = value * (UNIT_MULTIPLIER[unit] ?? 1);
  const absolute = Math.abs(baseValue);
  if (currency === 'JPY') {
    if (absolute >= 1_000_000_000_000) return `${formatCompactNumber(baseValue / 1_000_000_000_000)}兆円`;
    if (absolute >= 100_000_000) return `${formatCompactNumber(baseValue / 100_000_000)}億円`;
    return `${formatCompactNumber(baseValue / 1_000_000)}百万円`;
  }

  const compact = amountParts(value, unit);
  return `${currency} ${formatCompactNumber(compact.value)}${compact.suffix}`;
}

export function formatFinancialAxisValue(
  value: number,
  metricId: FinancialChartMetricId,
  currency: string,
  unit: string,
) {
  if (metricId === 'operatingMargin') return `${formatCompactNumber(value)}%`;
  const baseValue = value * (UNIT_MULTIPLIER[unit] ?? 1);
  const absolute = Math.abs(baseValue);
  if (currency === 'JPY') {
    if (absolute >= 1_000_000_000_000) return `${formatCompactNumber(baseValue / 1_000_000_000_000)}兆`;
    if (absolute >= 100_000_000) return `${formatCompactNumber(baseValue / 100_000_000)}億`;
    return formatCompactNumber(value);
  }
  const compact = amountParts(value, unit);
  return `${formatCompactNumber(compact.value)}${compact.suffix}`;
}

export function buildFinancialScale(values: number[], tickCount = 4) {
  if (values.length === 0) return { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  if (rawMin === rawMax) return { min: rawMin - 1, max: rawMax + 1, ticks: [rawMin - 1, rawMin, rawMax + 1] };

  const roughStep = (rawMax - rawMin) / tickCount;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / power;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  const step = niceFraction * power;
  const min = Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step;
  const ticks: number[] = [];
  for (let value = min; value <= max + step / 2 && ticks.length < 7; value += step) {
    ticks.push(Math.abs(value) < step / 1_000 ? 0 : Number(value.toPrecision(12)));
  }
  return { min, max, ticks };
}
