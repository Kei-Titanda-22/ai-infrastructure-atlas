#!/usr/bin/env python3
from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = ROOT / 'scripts' / 'validate-entity-registry.py'

spec = importlib.util.spec_from_file_location('entity_registry_validator', VALIDATOR_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError('Unable to load Entity Registry validator')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

audit = json.loads(validator.AUDIT_PATH.read_text(encoding='utf-8'))
claims, evidence, duplicate_claim_ids, duplicate_evidence_ids = validator.load_evidence_corpus()
sources, duplicate_source_ids = validator.load_source_records()
companies, duplicate_company_ids = validator.load_pilot_company_records()
value_chain = validator.load_json(validator.VALUE_CHAIN_PATH)
relationships = validator.load_json(validator.RELATIONSHIPS_PATH)


def calculate(
    *,
    candidate_audit= audit,
    claim_records=claims,
    evidence_records=evidence,
    source_records=sources,
    duplicate_claims=duplicate_claim_ids,
    duplicate_evidence=duplicate_evidence_ids,
    duplicate_sources=duplicate_source_ids,
):
    return validator.targeted_input_digests(
        candidate_audit['candidates'],
        claim_records,
        evidence_records,
        source_records,
        companies,
        value_chain,
        relationships,
        duplicate_claim_ids=duplicate_claims,
        duplicate_evidence_ids=duplicate_evidence,
        duplicate_source_ids=duplicate_sources,
        duplicate_company_ids=duplicate_company_ids,
    )


baseline = calculate()
assert baseline == audit['inputDigests']

claim_ids, evidence_ids, source_ids = validator.candidate_reference_ids(audit['candidates'])
claim_id = sorted(claim_ids)[0]
evidence_id = sorted(evidence_ids)[0]
source_id = sorted(source_ids)[0]

unreferenced_claim_id = next(record_id for record_id in sorted(claims) if record_id not in claim_ids)
unrelated_claims = copy.deepcopy(claims)
unrelated_claims[unreferenced_claim_id]['statement'] = 'unrelated change'
assert calculate(claim_records=unrelated_claims) == baseline

unreferenced_source_id = next(record_id for record_id in sorted(sources) if record_id not in source_ids)
unrelated_sources = copy.deepcopy(sources)
unrelated_sources[unreferenced_source_id]['title'] = 'unrelated source change'
assert calculate(source_records=unrelated_sources) == baseline

for field in ('statement', 'claimType', 'priority', 'asOf'):
    changed_claims = copy.deepcopy(claims)
    changed_claims[claim_id][field] = f'changed-{field}'
    assert (
        calculate(claim_records=changed_claims)['referencedClaimRecordsSha256']
        != baseline['referencedClaimRecordsSha256']
    )

for field, value in (
    ('support', 'changed-support'),
    ('sourceId', 'changed-source'),
    ('locator', {'heading': 'changed locator'}),
    ('lastChecked', '2099-12-31'),
):
    changed_evidence = copy.deepcopy(evidence)
    changed_evidence[evidence_id][field] = value
    assert (
        calculate(evidence_records=changed_evidence)['referencedEvidenceBindingRecordsSha256']
        != baseline['referencedEvidenceBindingRecordsSha256']
    )

changed_sources = copy.deepcopy(sources)
changed_sources[source_id]['title'] = 'changed referenced source metadata'
assert (
    calculate(source_records=changed_sources)['referencedSharedSourceRecordsSha256']
    != baseline['referencedSharedSourceRecordsSha256']
)

unknown_reference = copy.deepcopy(audit)
unknown_reference['candidates'][0]['grounding'][0]['claimId'] = 'unknown-claim'
try:
    calculate(candidate_audit=unknown_reference)
except ValueError as error:
    assert 'unknown Claim' in str(error)
else:
    raise AssertionError('Unknown targeted Claim reference was accepted')

for label, kwargs in (
    ('Claim', {'duplicate_claims': {claim_id}}),
    ('Evidence Binding', {'duplicate_evidence': {evidence_id}}),
    ('Shared Source', {'duplicate_sources': {source_id}}),
):
    try:
        calculate(**kwargs)
    except ValueError as error:
        assert f'duplicate {label}' in str(error)
    else:
        raise AssertionError(f'Duplicate targeted {label} reference was accepted')

print(
    'Entity Registry targeted digest tests OK: '
    'unrelated records ignored / referenced Claim, Binding, Source changes detected / '
    'unknown and duplicate references rejected'
)
