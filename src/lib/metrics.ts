import metricAudits from '../data/metric-audits.json';
import metricStatusPolicy from '../data/metric-status-policy.json';

export type MetricAudit = (typeof metricAudits)[number];

export function getMetricAudit(companyId: string, metricId: string) {
  return metricAudits.find(audit => audit.companyId === companyId && audit.metricId === metricId);
}

export function getMetricState(companyId: string, metricId: string, metric: any, calculatedVerified = false) {
  if (metric?.value == null) {
    const override = metricStatusPolicy.overrides.find((item: any) => item.companyId === companyId && item.metricId === metricId);
    const reason = override?.missingReason || metricStatusPolicy.defaultNullReason;
    return { code: reason, label: metricStatusPolicy.missingReasons[reason as keyof typeof metricStatusPolicy.missingReasons] || '未収録', kind: 'missing' };
  }

  const audit = getMetricAudit(companyId, metricId);
  if (audit?.verificationStatus === 'verified' || calculatedVerified) {
    return { code: 'verified', label: metricStatusPolicy.verificationLabels.verified, kind: 'verified' };
  }
  if (metric?.sourceId) {
    return { code: 'source-linked', label: metricStatusPolicy.verificationLabels['source-linked'], kind: 'review' };
  }
  return { code: 'needs-review', label: metricStatusPolicy.verificationLabels['needs-review'], kind: 'review' };
}

export function formatMetricValue(metric: any) {
  if (!metric || metric.value == null) return null;
  const value = Number(metric.value);
  if (metric.unit === 'x') return `${value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}倍`;
  if (metric.unit === '%') return `${value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}%`;
  return `${value.toLocaleString('ja-JP')} ${metric.unit}`;
}

export function auditFormula(audit: any) {
  if (!audit?.calculation) return null;
  const c = audit.calculation;
  if (c.type === 'ratio-percent') return `${c.numeratorLabel} ${Number(c.numerator).toLocaleString('ja-JP')}${c.unit} ÷ ${c.denominatorLabel} ${Number(c.denominator).toLocaleString('ja-JP')}${c.unit} × 100`;
  if (c.type === 'growth-percent') return `（${c.currentLabel} ${Number(c.current).toLocaleString('ja-JP')}${c.unit} ÷ ${c.priorLabel} ${Number(c.prior).toLocaleString('ja-JP')}${c.unit} − 1）× 100`;
  return null;
}
