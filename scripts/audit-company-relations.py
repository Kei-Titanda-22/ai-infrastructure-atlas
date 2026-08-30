#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPANY_DIR = ROOT / 'src' / 'data' / 'companies'
companies = [json.loads(path.read_text(encoding='utf-8')) for path in sorted(COMPANY_DIR.glob('*.json'))]
company_by_id = {company['id']: company for company in companies}

incoming = {company['id']: set() for company in companies}
asymmetric = []
unknown_links = []
for company in companies:
    cid = company['id']
    for peer_id in company.get('competitors', []):
        peer = company_by_id.get(peer_id)
        if peer is None:
            unknown_links.append((cid, peer_id))
            continue
        incoming[peer_id].add(cid)
        if cid not in peer.get('competitors', []):
            asymmetric.append((cid, peer_id))

effective_peers = {}
for company in companies:
    cid = company['id']
    effective_peers[cid] = set(company.get('competitors', [])) | incoming[cid]

no_effective_competitors = sorted(cid for cid, peers in effective_peers.items() if not peers)
explicitly_empty = sorted(company['id'] for company in companies if not company.get('competitors'))

print(f'Competitor coverage audit: {len(companies)} companies')
print(f'Explicit competitor arrays: {len(companies) - len(explicitly_empty)} populated / {len(explicitly_empty)} empty')
if no_effective_competitors:
    print(f'WARNING: {len(no_effective_competitors)} companies have no effective competitor relation in either direction: {", ".join(no_effective_competitors)}')
else:
    print('Effective competitor coverage: every company has at least one relation')

if asymmetric:
    formatted = ', '.join(f'{left}->{right}' for left, right in sorted(asymmetric))
    print(f'INFO: {len(asymmetric)} one-way stored links are resolved bidirectionally in company-page display: {formatted}')
else:
    print('Stored competitor symmetry: no one-way links detected')

if unknown_links:
    formatted = ', '.join(f'{left}->{right}' for left, right in sorted(unknown_links))
    print(f'WARNING: {len(unknown_links)} competitor links reference unknown companies: {formatted}')
    raise SystemExit(1)
