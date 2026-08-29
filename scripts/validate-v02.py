#!/usr/bin/env python3
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'
companies = [json.loads(p.read_text(encoding='utf-8')) for p in (DATA / 'companies').glob('*.json')]
value_chain = json.loads((DATA / 'value-chain.json').read_text(encoding='utf-8'))
errors = []
if len(companies) < 100:
    errors.append(f'v0.2 baseline regression: expected at least 100 companies, got {len(companies)}')
ids = [c['id'] for c in companies]
if len(ids) != len(set(ids)):
    errors.append('duplicate company id in v0.2 baseline')
for company in companies:
    if not company.get('sourceIds'):
        errors.append(f"{company.get('id')}: no sourceIds")
for stage in value_chain:
    labels = [link.get('label') for link in stage.get('links', [])]
    if len(labels) != len(set(labels)):
        errors.append(f"{stage.get('id')}: duplicate value-chain link label")
if errors:
    print('v0.2 baseline validation FAILED')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)
print(f'v0.2 baseline validation OK: {len(companies)} companies / {len(value_chain)} value-chain stages')
