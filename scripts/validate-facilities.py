#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data'
companies = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((DATA / 'companies').glob('*.json'))]
facilities = json.loads((DATA / 'facilities.json').read_text(encoding='utf-8'))
sources = json.loads((DATA / 'facility-sources.json').read_text(encoding='utf-8'))
policies = json.loads((DATA / 'facility-source-policies.json').read_text(encoding='utf-8'))
brand_assets = json.loads((DATA / 'brand-assets.json').read_text(encoding='utf-8'))

errors = []
company_ids = {c['id'] for c in companies}
facility_ids = [f.get('id') for f in facilities]
source_ids = {s.get('id') for s in sources}
policy_ids = {p.get('sourceId') for p in policies}
brand_company_ids = [b.get('companyId') for b in brand_assets]

if len(facility_ids) != len(set(facility_ids)):
    errors.append('Duplicate facility id detected')
if source_ids != policy_ids:
    errors.append(f'Facility source/policy mismatch: sources={sorted(source_ids)} policies={sorted(policy_ids)}')

allowed_types = {'fab', 'plant', 'rd-production', 'rd', 'works'}
required = {'id','companyId','name','city','region','country','facilityType','role','sourceId','status'}
for facility in facilities:
    fid = facility.get('id', '<missing>')
    if set(facility) != required:
        errors.append(f'{fid}: facility keys differ from contract')
        continue
    if facility['companyId'] not in company_ids:
        errors.append(f'{fid}: unknown companyId {facility["companyId"]}')
    if facility['sourceId'] not in source_ids:
        errors.append(f'{fid}: unknown facility sourceId {facility["sourceId"]}')
    if facility['facilityType'] not in allowed_types:
        errors.append(f'{fid}: invalid facilityType {facility["facilityType"]}')
    if facility['status'] != 'verified':
        errors.append(f'{fid}: published facility must be verified')
    if not all(facility[k] for k in ('name','city','region','country','role')):
        errors.append(f'{fid}: missing location/role metadata')

if len(brand_company_ids) != len(set(brand_company_ids)):
    errors.append('Duplicate brand asset company record')
if set(brand_company_ids) != company_ids:
    errors.append('Brand asset registry must contain exactly one record per company')
for brand in brand_assets:
    status = brand.get('reviewStatus')
    if status not in {'pending','reviewed','blocked'}:
        errors.append(f'{brand.get("companyId")}: invalid brand reviewStatus')
    if brand.get('displayAllowed'):
        if status != 'reviewed' or not brand.get('assetUrl') or not brand.get('rightsPageUrl'):
            errors.append(f'{brand.get("companyId")}: logo display requires reviewed rights + asset URL')

if errors:
    print('Facility/brand validation FAILED')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

print(f'Facility/brand validation OK: {len(facilities)} facilities / {len(sources)} facility sources / {len(brand_assets)} brand-rights records')
