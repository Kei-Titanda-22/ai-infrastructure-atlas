#!/usr/bin/env python3
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'

history_files = ['financial-history.json', 'financial-history-v04-batch2.json', 'financial-history-v04-batch3.json', 'financial-history-v04-batch4.json']
history = []
for filename in history_files:
    history.extend(json.loads((DATA / filename).read_text(encoding='utf-8')))

overrides = json.loads((DATA / 'financial-history-v04-cashflow-overrides.json').read_text(encoding='utf-8'))
history_by_id = {record['id']: record for record in history}
seen_override_ids = set()
errors = []
for override in overrides:
    rid = override.get('id')
    if not rid or rid in seen_override_ids:
        errors.append(f'duplicate or missing cash-flow override id: {rid}')
        continue
    seen_override_ids.add(rid)
    target = history_by_id.get(rid)
    if target is None:
        errors.append(f'cash-flow override references unknown history record: {rid}')
        continue
    override_metrics = override.get('metrics', {})
    invalid_metric_ids = set(override_metrics) - {'freeCashFlow', 'capex'}
    if invalid_metric_ids:
        errors.append(f'{rid}: cash-flow override may only patch FCF/Capex, got {sorted(invalid_metric_ids)}')
    target.update({key: value for key, value in override.items() if key not in {'id', 'metrics'}})
    target['metrics'].update(override_metrics)

source_files = ['sources.json', 'sources-v02.json', 'document-sources.json', 'document-sources-v04.json']
sources = []
for filename in source_files:
    sources.extend(json.loads((DATA / filename).read_text(encoding='utf-8')))
audits = json.loads((DATA / 'metric-audits.json').read_text(encoding='utf-8'))
company_files = list((DATA / 'companies').glob('*.json'))
company_ids = {path.stem for path in company_files}
source_by_id = {item['id']: item for item in sources}

v04_sources = json.loads((DATA / 'document-sources-v04.json').read_text(encoding='utf-8'))
v04_policies = json.loads((DATA / 'document-source-policies-v04.json').read_text(encoding='utf-8'))
v04_source_ids = {item['id'] for item in v04_sources}
v04_policy_ids = {item['sourceId'] for item in v04_policies}
if v04_source_ids != v04_policy_ids:
    errors.append(
        f'v0.4 source-policy mismatch: missing policies={sorted(v04_source_ids - v04_policy_ids)}, '
        f'orphan policies={sorted(v04_policy_ids - v04_source_ids)}'
    )
for policy in v04_policies:
    if policy.get('reviewStatus') != 'pending':
        errors.append(f'{policy.get("sourceId")}: new v0.4 source policy must remain pending until terms review')
    if policy.get('automatedRetrieval') != 'unknown':
        errors.append(f'{policy.get("sourceId")}: automated retrieval must remain unknown before review')
    if policy.get('internalPolicy') != 'manual-reference-only-until-reviewed':
        errors.append(f'{policy.get("sourceId")}: unexpected internalPolicy {policy.get("internalPolicy")}')

required_metrics = {'revenue', 'operatingProfit', 'operatingMargin', 'freeCashFlow', 'capex'}
allowed_period_types = {'quarterly', 'annual'}
value_statuses = {'verified', 'source-linked', 'needs-review'}
missing_statuses = {'not-collected', 'primary-source-unchecked', 'not-calculable', 'not-disclosed', 'not-applicable'}
allowed_statuses = value_statuses | missing_statuses
seen_ids = set()
seen_period_keys = set()

for record in history:
    rid = record.get('id')
    cid = record.get('companyId')
    if not rid or rid in seen_ids:
        errors.append(f'duplicate or missing record id: {rid}')
    seen_ids.add(rid)

    if cid not in company_ids:
        errors.append(f'{rid}: unknown companyId {cid}')
    period_type = record.get('periodType')
    if period_type not in allowed_period_types:
        errors.append(f'{rid}: invalid periodType {period_type}')
    if not record.get('periodLabel') or not record.get('endDate'):
        errors.append(f'{rid}: periodLabel/endDate required')
    else:
        try:
            date.fromisoformat(record['endDate'])
        except ValueError:
            errors.append(f'{rid}: invalid ISO endDate {record.get("endDate")}')
    if not record.get('currency') or not record.get('unit') or not record.get('accountingBasis'):
        errors.append(f'{rid}: currency/unit/accountingBasis required')

    period_key = (cid, period_type, record.get('endDate'))
    if period_key in seen_period_keys:
        errors.append(f'{rid}: duplicate company/period/endDate {period_key}')
    seen_period_keys.add(period_key)

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

    capex = metrics['capex']['value']
    if capex is not None and capex < 0:
        errors.append(f'{rid}: capex must be stored as a positive expenditure magnitude')

    cash_inputs = record.get('cashFlowInputs')
    fcf = metrics['freeCashFlow']['value']
    if cash_inputs:
        operating_cash_flow = cash_inputs.get('operatingCashFlow')
        capex_cash_outflow = cash_inputs.get('capexCashOutflow')
        if operating_cash_flow is None or capex_cash_outflow is None:
            errors.append(f'{rid}: cashFlowInputs requires operatingCashFlow and capexCashOutflow')
        else:
            if capex is None or abs(capex - capex_cash_outflow) > 0.01:
                errors.append(f'{rid}: capex does not match cashFlowInputs capexCashOutflow')
            expected_fcf = operating_cash_flow - capex_cash_outflow
            if fcf is None or abs(fcf - expected_fcf) > 0.01:
                errors.append(f'{rid}: FCF mismatch: stored={fcf}, expected={expected_fcf}')
    elif fcf is not None and str(metrics['freeCashFlow'].get('basis', '')).startswith('Atlas算出'):
        errors.append(f'{rid}: Atlas-calculated FCF requires cashFlowInputs')

    has_verified = any(metric.get('status') == 'verified' for metric in metrics.values())
    if has_verified and not record.get('verifiedAt'):
        errors.append(f'{rid}: verified metric requires verifiedAt')

period_types = {record['periodType'] for record in history}
if period_types != allowed_period_types:
    errors.append(f'v0.4 history must contain quarterly and annual records; got {period_types}')

covered_companies = {record['companyId'] for record in history}
audited_companies = {
    audit['companyId']
    for audit in audits
    if audit.get('metricId') == 'operatingMargin' and audit.get('verificationStatus') == 'verified'
}
missing_audited = audited_companies - covered_companies
if missing_audited:
    errors.append(f'verified operating-margin companies missing from history: {sorted(missing_audited)}')

records_by_company = {}
for record in history:
    records_by_company.setdefault(record['companyId'], []).append(record)
multi_period_companies = {cid for cid, rows in records_by_company.items() if len(rows) >= 2}
verified_metrics = sum(
    1 for record in history for metric in record['metrics'].values() if metric['status'] == 'verified'
)
cashflow_periods = sum(
    1 for record in history
    if record['metrics']['freeCashFlow']['value'] is not None and record['metrics']['capex']['value'] is not None
)

# v0.4 network/storage regression floor. Future expansion may exceed these counts.
if len(history) < 59:
    errors.append(f'v0.4 history regression: expected at least 59 periods, got {len(history)}')
if len(covered_companies) < 20:
    errors.append(f'v0.4 coverage regression: expected at least 20 companies, got {len(covered_companies)}')
if len(multi_period_companies) < 18:
    errors.append(f'v0.4 history regression: expected at least 18 multi-period companies, got {len(multi_period_companies)}')
if verified_metrics < 255:
    errors.append(f'v0.4 history regression: expected at least 255 verified metrics, got {verified_metrics}')
if cashflow_periods < 39:
    errors.append(f'v0.4 cash-flow regression: expected at least 39 FCF/Capex periods, got {cashflow_periods}')
if len(v04_sources) < 7:
    errors.append(f'v0.4 source regression: expected at least 7 document sources+policies, got {len(v04_sources)}')

if errors:
    print('v0.4 financial-history validation FAILED')
    for error in errors:
        print(f' - {error}')
    raise SystemExit(1)

print(
    f'v0.4 financial-history validation OK: '
    f'{len(history)} periods / {len(covered_companies)} companies / '
    f'{len(multi_period_companies)} multi-period companies / '
    f'{verified_metrics} verified metrics / {cashflow_periods} FCF+Capex periods / '
    f'{len(overrides)} cash-flow overrides / {len(v04_sources)} v0.4 document sources+policies'
)
