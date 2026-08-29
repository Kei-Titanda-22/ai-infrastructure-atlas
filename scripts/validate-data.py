#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data'
companies = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((DATA / 'companies').glob('*.json'))]
layers = json.loads((DATA / 'layers.json').read_text(encoding='utf-8'))
sources = json.loads((DATA / 'sources.json').read_text(encoding='utf-8'))
source_policies = json.loads((DATA / 'source-policies.json').read_text(encoding='utf-8'))
metric_definitions = json.loads((DATA / 'metric-definitions.json').read_text(encoding='utf-8'))
score_definitions = json.loads((DATA / 'score-definitions.json').read_text(encoding='utf-8'))
governance = json.loads((DATA / 'governance.json').read_text(encoding='utf-8'))

errors = []
ids = [c['id'] for c in companies]
id_set = set(ids)
layer_set = {l['name'] for l in layers}
source_ids = {s['id'] for s in sources}
policy_ids = [p['sourceId'] for p in source_policies]
metric_definition_ids = {m['id'] for m in metric_definitions}
score_definition_ids = {s['id'] for s in score_definitions}

if len(companies) != 20:
    errors.append(f'Expected 20 companies, found {len(companies)}')
if len(id_set) != len(ids):
    errors.append('Duplicate company id detected')
if len(governance) != 9 or [r.get('id') for r in governance] != list(range(1, 10)):
    errors.append('Project constitution mirror must contain exactly Articles 1-9')
if len(policy_ids) != len(set(policy_ids)):
    errors.append('Duplicate source policy record detected')
if set(policy_ids) != source_ids:
    missing = sorted(source_ids - set(policy_ids))
    orphan = sorted(set(policy_ids) - source_ids)
    if missing:
        errors.append(f'Sources missing policy records: {missing}')
    if orphan:
        errors.append(f'Orphan source policy records: {orphan}')

allowed_policy_states = {'pending', 'reviewed', 'blocked'}
allowed_terms_states = {'unknown', 'allowed', 'restricted', 'prohibited', 'not-applicable'}
for p in source_policies:
    if p.get('reviewStatus') not in allowed_policy_states:
        errors.append(f"{p.get('sourceId')}: invalid policy reviewStatus")
    for key in ('automatedRetrieval', 'redistribution', 'commercialUse', 'attributionRequirement'):
        if p.get(key) not in allowed_terms_states:
            errors.append(f"{p.get('sourceId')}: invalid {key} state")
    if p.get('reviewStatus') != 'reviewed' and p.get('internalPolicy') != 'manual-reference-only-until-reviewed':
        errors.append(f"{p.get('sourceId')}: unreviewed source must remain manual-reference-only")

for company in companies:
    cid = company['id']
    if company['primaryLayer'] not in layer_set:
        errors.append(f'{cid}: unknown primary layer')
    for layer in company['layers']:
        if layer not in layer_set:
            errors.append(f'{cid}: unknown layer {layer}')
    for source_id in company.get('sourceIds', []):
        if source_id not in source_ids:
            errors.append(f'{cid}: missing source reference {source_id}')
    for competitor in company['competitors']:
        if competitor not in id_set:
            errors.append(f'{cid}: missing competitor reference {competitor}')
    for score_name, score in company['scores'].items():
        required = {'value', 'direction', 'confidence', 'status', 'rationale', 'definitionId', 'asOf', 'assessmentSource', 'evidenceSourceIds'}
        if set(score) != required:
            errors.append(f'{cid}: {score_name} score keys differ from constitution policy')
            continue
        if not 0 <= score['value'] <= 5:
            errors.append(f'{cid}: {score_name} out of 0-5 range')
        if score['definitionId'] != score_name or score['definitionId'] not in score_definition_ids:
            errors.append(f'{cid}: {score_name} missing/incorrect score definition')
        if not score['asOf'] or not score['assessmentSource']:
            errors.append(f'{cid}: {score_name} lacks assessment source/asOf')
        for source_id in score.get('evidenceSourceIds', []):
            if source_id not in source_ids:
                errors.append(f'{cid}: {score_name} missing evidence source {source_id}')
    for metric_name, metric in company['metrics'].items():
        required = {'value', 'unit', 'basis', 'definitionId', 'asOf', 'period', 'sourceId'}
        if set(metric) != required:
            errors.append(f'{cid}: {metric_name} metric keys differ from constitution policy')
            continue
        if metric['definitionId'] != metric_name or metric['definitionId'] not in metric_definition_ids:
            errors.append(f'{cid}: {metric_name} missing/incorrect metric definition')
        # Constitution Article 2: a published numeric value cannot exist without provenance.
        if metric['value'] is not None:
            if not metric['sourceId']:
                errors.append(f'{cid}: {metric_name} has value but no sourceId')
            elif metric['sourceId'] not in source_ids:
                errors.append(f'{cid}: {metric_name} references unknown sourceId {metric["sourceId"]}')
            if not metric['asOf']:
                errors.append(f'{cid}: {metric_name} has value but no asOf')
            if not metric['definitionId']:
                errors.append(f'{cid}: {metric_name} has value but no definitionId')

if errors:
    print('Validation FAILED')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

pending = sum(1 for p in source_policies if p['reviewStatus'] == 'pending')
print(
    f'Validation OK: {len(companies)} companies / {len(layers)} layers / '
    f'{len(sources)} sources / {len(source_policies)} source policies ({pending} pending) / '
    f'{len(metric_definitions)} metric definitions / 9 constitutional articles'
)
