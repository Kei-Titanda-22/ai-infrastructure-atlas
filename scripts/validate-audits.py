#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'
companies = {p.stem: json.loads(p.read_text(encoding='utf-8')) for p in (DATA / 'companies').glob('*.json')}
sources = json.loads((DATA / 'sources.json').read_text(encoding='utf-8'))
v02_sources_path = DATA / 'sources-v02.json'
v02_sources = json.loads(v02_sources_path.read_text(encoding='utf-8')) if v02_sources_path.exists() else []
document_sources = json.loads((DATA / 'document-sources.json').read_text(encoding='utf-8'))
facility_sources = json.loads((DATA / 'facility-sources.json').read_text(encoding='utf-8'))
audits = json.loads((DATA / 'metric-audits.json').read_text(encoding='utf-8'))
claims = json.loads((DATA / 'claims.json').read_text(encoding='utf-8'))
status_policy = json.loads((DATA / 'metric-status-policy.json').read_text(encoding='utf-8'))
value_chain = json.loads((DATA / 'value-chain.json').read_text(encoding='utf-8'))
update_log = json.loads((DATA / 'update-log.json').read_text(encoding='utf-8'))

source_ids = {s['id'] for s in [*sources, *v02_sources, *document_sources, *facility_sources]}
errors = []

allowed_missing = {'not-collected','primary-source-unchecked','not-calculable','not-disclosed','not-applicable'}
if status_policy.get('defaultNullReason') not in allowed_missing:
    errors.append('metric-status-policy defaultNullReason is invalid')

seen_overrides = set()
for override in status_policy.get('overrides', []):
    cid = override.get('companyId')
    mid = override.get('metricId')
    key = (cid, mid)
    if key in seen_overrides:
        errors.append(f'duplicate metric-status override: {cid}/{mid}')
    seen_overrides.add(key)
    if cid not in companies:
        errors.append(f'metric-status override has unknown companyId: {cid}')
        continue
    if mid not in companies[cid].get('metrics', {}):
        errors.append(f'metric-status override has unknown metricId: {cid}/{mid}')
    if override.get('missingReason') not in allowed_missing:
        errors.append(f'metric-status override has invalid missingReason: {cid}/{mid}')

seen = set()
for audit in audits:
    aid = audit.get('id')
    if aid in seen:
        errors.append(f'duplicate metric audit id: {aid}')
    seen.add(aid)
    cid = audit.get('companyId')
    mid = audit.get('metricId')
    if cid not in companies:
        errors.append(f'{aid}: unknown companyId {cid}')
        continue
    metric = companies[cid].get('metrics', {}).get(mid)
    if not metric:
        errors.append(f'{aid}: unknown metricId {mid}')
        continue
    if audit.get('sourceId') not in source_ids:
        errors.append(f'{aid}: unknown sourceId')
    if audit.get('verificationStatus') != 'verified':
        errors.append(f'{aid}: audit registry accepts verified records only')
    calc = audit.get('calculation', {})
    ctype = calc.get('type')
    try:
        if ctype == 'ratio-percent':
            recomputed = calc['numerator'] / calc['denominator'] * 100
        elif ctype == 'growth-percent':
            recomputed = (calc['current'] / calc['prior'] - 1) * 100
        else:
            errors.append(f'{aid}: unsupported calculation type {ctype}')
            continue
    except (KeyError, ZeroDivisionError, TypeError) as exc:
        errors.append(f'{aid}: calculation failed: {exc}')
        continue
    if abs(recomputed - audit.get('recomputedValue', 10**99)) > 0.0001:
        errors.append(f'{aid}: stored recomputedValue differs from calculation')
    if metric.get('value') is None or abs(metric['value'] - audit.get('displayValue', 10**99)) > 0.011:
        errors.append(f'{aid}: company metric differs from audited displayValue')

claim_ids = set()
for claim in claims:
    cid = claim.get('companyId')
    claim_id = claim.get('id')
    if claim_id in claim_ids:
        errors.append(f'duplicate claim id: {claim_id}')
    claim_ids.add(claim_id)
    if cid not in companies:
        errors.append(f'{claim_id}: unknown companyId')
    if claim.get('type') not in {'fact','analysis','estimate'}:
        errors.append(f'{claim_id}: invalid claim type')
    if not claim.get('sourceIds'):
        errors.append(f'{claim_id}: claim has no evidence sources')
    for sid in claim.get('sourceIds', []):
        if sid not in source_ids:
            errors.append(f'{claim_id}: unknown evidence source {sid}')

for stage in value_chain:
    if not stage.get('number') or not stage.get('name') or not stage.get('links'):
        errors.append(f'value-chain stage incomplete: {stage.get("id")}')

for entry in update_log:
    if entry.get('companyId') is not None and entry['companyId'] not in companies:
        errors.append(f'update-log unknown companyId: {entry.get("companyId")}')

if errors:
    print('Audit/evidence validation FAILED')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

print(f'Audit/evidence validation OK: {len(audits)} verified metric audits / {len(claims)} evidence claims / {len(value_chain)} value-chain stages / {len(update_log)} update-log entries / {len(status_policy.get("overrides", []))} missing-reason overrides')
