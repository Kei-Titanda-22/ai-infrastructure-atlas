#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPANY_DIR = ROOT / 'src' / 'data' / 'companies'
companies = [json.loads(path.read_text(encoding='utf-8')) for path in sorted(COMPANY_DIR.glob('*.json'))]
company_by_id = {company['id']: company for company in companies}

empty_competitors = sorted(company['id'] for company in companies if not company.get('competitors'))
asymmetric = []
for company in companies:
    cid = company['id']
    for peer_id in company.get('competitors', []):
        peer = company_by_id.get(peer_id)
        if peer and cid not in peer.get('competitors', []):
            asymmetric.append((cid, peer_id))

print(f'Competitor coverage audit: {len(companies)} companies')
if empty_competitors:
    print(f'WARNING: {len(empty_competitors)} companies have no competitors: {", ".join(empty_competitors)}')
else:
    print('Competitor coverage: every company has at least one competitor')

if asymmetric:
    formatted = ', '.join(f'{left}->{right}' for left, right in sorted(asymmetric))
    print(f'WARNING: {len(asymmetric)} asymmetric competitor links: {formatted}')
else:
    print('Competitor symmetry: no one-way links detected')
