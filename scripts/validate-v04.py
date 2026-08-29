#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'

history = json.loads((DATA / 'financial-history.json').read_text(encoding='utf-8'))
source_files = ['sources.json', 'sources-v02.json', 'document-sources.json']
sources = []
for filename in source_files:
    sources.extend(json.loads((DATA / filename).read_text(encoding='utf-8')))
audits = json.loads((DATA / 'metric-audits.json').read_text(encoding='utf-8'))
company_files = list((DATA / 'companies').glob('*.json'))
company_ids = {path.stem for path in company_files}
source_by_id = {item['id']: item for item in sources}

required_metrics = {'revenue', 'operatingProfit', 'operatingMargin', 'freeCashFlow', 'capex'}
allowed_period_types = {'quarterly', 'annual'}
value_statuses = {'verified', 'source-linked', 'needs-review'}
missing_statuses = {'not-collected', 'primary-source-unchecked', 'not-calculable', 'not-disclosed', 'not-applicable'}
allowed_statuses = value_statuses | missing_statuses
errors = []
seen_ids = set()

for record in history:
    rid = record.get('id')
    cid = record.get('companyId')
    if not rid or rid in seen_ids:
        errors.append(f'duplicate or missing record id: {rid}')
    seen_ids.add(rid)

    if cid not in company_ids:
        errors.append(f'{rid}: unknown companyId {cid}')
    if record.get('periodType') not in allowed_period_types:
        errors.append(f'{rid}: invalid periodType {record.get("periodType")}')
    if not record.get('periodLabel') or not record.get('endDate'):
        errors.append(f'{rid}: periodLabel/endDate required')
    if not record.get('currency') or not record.get('unit') or not record.get('accountingBasis'):
        errors.append(f'{rid}: currency/unit/accountingBasis required')

    source_id = record.get('sourceId')
    source = source_by_id.get(source_id)
    if source is None:
        errors.append(f'{rid}: unknown sourceId {source_id}')
    elif source.get('companyId') and source.get('companyId') != cid:
        errors.append(f'{rid}: source company mismatch {source.get("companyId")} != {cid}')

    metrics = record.get('metrics', {})
    if set(metrics) != required_metrics:
        errors.append(f'{rid}: metric set mismatch: {sorted(metrics)}')
        continue

    for metric_id, metric in metrics.items():
        status = metric.get('status')
        value = metric.get('value')
        if status not in allowed_statuses:
            errors.append(f'{rid}/{metric_id}: invalid status {status}')
        if value is None and status not in missing_statuses:
            errors.append(f'{rid}/{metric_id}: null value requires missing status, got {status}')
        if value is not None and status not in value_statuses:
            errors.append(f'{rid}/{metric_id}: populated value cannot use missing status {status}')
        if not metric.get('basis'):
            errors.append(f'{rid}/{metric_id}: basis required')

    revenue = metrics['revenue']['value']
    operating_profit = metrics['operatingProfit']['value']
    operating_margin = metrics['operatingMargin']['value']
    if revenue not in (None, 0) and operating_profit is not None and operating_margin is not None:
        recomputed = operating_profit / revenue * 100
        if abs(recomputed - operating_margin) > 0.51:
            errors.append(
                f'{rid}: operating margin mismatch: stored={operating_margin:.3f}, recomputed={recomputed:.3f}'
            )

    has_verified = any(metric.get('status') == 'verified' for metric in metrics.values())
    if has_verified and not record.get('verifiedAt'):
        errors.append(f'{rid}: verified metric requires verifiedAt')

period_types = {record['periodType'] for record in history}
if period_types != allowed_period_types:
    errors.append(f'v0.4 seed must contain quarterly and annual records; got {period_types}')

covered_companies = {record['companyId'] for record in history}
audited_companies = {
    audit['companyId']
    for audit in audits
    if audit.get('metricId') == 'operatingMargin' and audit.get('verificationStatus') == 'verified'
}
missing_audited = audited_companies - covered_companies
if missing_audited:
    errors.append(f'verified operating-margin companies missing from history: {sorted(missing_audited)}')

if errors:
    print('v0.4 financial-history validation FAILED')
    for error in errors:
        print(f' - {error}')
    raise SystemExit(1)

verified_metrics = sum(
    1 for record in history for metric in record['metrics'].values() if metric['status'] == 'verified'
)
print(
    f'v0.4 financial-history validation OK: '
    f'{len(history)} periods / {len(covered_companies)} companies / {verified_metrics} verified metrics'
)
