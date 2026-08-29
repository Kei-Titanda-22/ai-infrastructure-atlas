#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'
COMPANIES = DATA / 'companies'
TEMPLATES = DATA / 'comparison-templates.json'

company_ids = {p.stem for p in COMPANIES.glob('*.json')}
templates = json.loads(TEMPLATES.read_text(encoding='utf-8'))
errors = []
seen_template_ids = set()

if len(company_ids) < 100:
    errors.append(f'v0.3 requires the v0.2 100-company baseline; found {len(company_ids)}')

for template in templates:
    tid = template.get('id')
    ids = template.get('companyIds', [])
    if not tid or tid in seen_template_ids:
        errors.append(f'invalid/duplicate comparison template id: {tid}')
    seen_template_ids.add(tid)
    if not (3 <= len(ids) <= 5):
        errors.append(f'{tid}: comparison template must contain 3-5 companies')
    if len(ids) != len(set(ids)):
        errors.append(f'{tid}: duplicate company in comparison template')
    missing = [cid for cid in ids if cid not in company_ids]
    if missing:
        errors.append(f'{tid}: unknown company ids: {missing}')
    if not template.get('name') or not template.get('description'):
        errors.append(f'{tid}: missing name/description')

if errors:
    print('v0.3 comparison validation FAILED')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

print(f'v0.3 comparison validation OK: {len(company_ids)} companies / {len(templates)} comparison templates')
