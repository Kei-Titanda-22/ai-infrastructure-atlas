#!/usr/bin/env python3
from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = ROOT / 'scripts' / 'validate-relation-foundation.py'
VALID_FIXTURE_PATH = ROOT / 'scripts' / 'fixtures' / 'relation-foundation-valid-v01.json'
INVALID_FIXTURE_PATH = ROOT / 'scripts' / 'fixtures' / 'relation-foundation-invalid-v01.json'

spec = importlib.util.spec_from_file_location('relation_validator', VALIDATOR_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError('Unable to load Relation foundation validator')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

fixture = json.loads(VALID_FIXTURE_PATH.read_text(encoding='utf-8'))
invalid_cases = json.loads(INVALID_FIXTURE_PATH.read_text(encoding='utf-8'))
populated = fixture['populated']
endpoint_ids = {key: set(values) for key, values in populated['endpointIds'].items()}
source_ids = set(populated['sourceIds'])


def validate(relations, bindings):
    return validator.validate_relation_payloads(relations, bindings, endpoint_ids, source_ids)


assert validate(fixture['empty']['relations'], fixture['empty']['bindings']) == []
baseline_errors = validate(populated['relations'], populated['bindings'])
if baseline_errors:
    raise AssertionError(f'Populated valid fixture failed: {baseline_errors!r}')

for case in invalid_cases:
    relations = copy.deepcopy(populated['relations'])
    bindings = copy.deepcopy(populated['bindings'])
    operation = case['operation']
    if operation == 'updateRelation':
        relations[0].update(case.get('values', {}))
    elif operation == 'updateScope':
        relations[0]['scope'].update(case.get('values', {}))
    elif operation == 'updateBinding':
        bindings[0].update(case.get('values', {}))
    elif operation == 'removeBindings':
        bindings = []
    elif operation == 'duplicateRelation':
        duplicate = copy.deepcopy(relations[0])
        duplicate['relationId'] = 'rel-company-a-produces-gpu-duplicate'
        relations.append(duplicate)
    else:
        raise AssertionError(f"Unknown invalid fixture operation: {operation}")
    errors = validate(relations, bindings)
    expected = case['expectedError']
    if not any(expected in error for error in errors):
        raise AssertionError(f"{case['name']}: expected {expected!r}; got {errors!r}")

# Endpoint matrix accepts exactly the adopted directional combinations.
assert validator.ENDPOINT_MATRIX == {
    'PRODUCES': {('company', 'product')},
    'DEVELOPS': {('company', 'technology')},
    'USES': {('company', 'technology'), ('product', 'technology')},
    'ENABLES': {('product', 'technology')},
    'SUPPLIES_TO': {('company', 'company'), ('company', 'market')},
    'COMPETES_WITH': {('company', 'company')},
    'OPERATES': {('company', 'facility')},
    'POSITIONED_IN': {
        ('company', 'value-chain-node'),
        ('product', 'value-chain-node'),
        ('technology', 'value-chain-node'),
    },
}

matrix_cases = {
    'PRODUCES': ('company', 'company-a', 'product', 'product-category-gpu', {}),
    'DEVELOPS': ('company', 'company-a', 'technology', 'technology-accelerated-computing-architecture', {}),
    'USES': ('product', 'product-category-gpu', 'technology', 'technology-accelerated-computing-architecture', {}),
    'ENABLES': (
        'product',
        'product-category-gpu',
        'technology',
        'technology-accelerated-computing-architecture',
        {'technologyIds': ['technology-accelerated-computing-architecture']},
    ),
    'SUPPLIES_TO': (
        'company',
        'company-a',
        'company',
        'company-b',
        {'productIds': ['product-category-gpu']},
    ),
    'COMPETES_WITH': (
        'company',
        'company-a',
        'company',
        'company-b',
        {'productIds': ['product-category-gpu']},
    ),
    'OPERATES': ('company', 'company-a', 'facility', 'facility-a', {}),
    'POSITIONED_IN': ('company', 'company-a', 'value-chain-node', 'compute', {}),
}
for relation_type, (subject_type, subject_id, object_type, object_id, scope_values) in matrix_cases.items():
    relation = copy.deepcopy(populated['relations'][0])
    relation_id = f"rel-fixture-{relation_type.lower().replace('_', '-')}"
    relation.update({
        'relationId': relation_id,
        'subjectType': subject_type,
        'subjectId': subject_id,
        'relationType': relation_type,
        'objectType': object_type,
        'objectId': object_id,
    })
    relation['scope'].update(scope_values)
    if relation_type == 'POSITIONED_IN':
        relation['claimType'] = 'atlas-analysis'
        relation['confidence'] = 'medium'
    binding = copy.deepcopy(populated['bindings'][0])
    binding['id'] = f"rel-evidence-fixture-{relation_type.lower().replace('_', '-')}"
    binding['relationId'] = relation_id
    matrix_errors = validate([relation], [binding])
    if matrix_errors:
        raise AssertionError(f'{relation_type} valid endpoint fixture failed: {matrix_errors!r}')

# Supersession and duplicate guards are tested independently of production data.
cycle_relations = [
    copy.deepcopy(populated['relations'][0]),
    copy.deepcopy(populated['relations'][0]),
]
cycle_relations[0]['relationId'] = 'rel-company-a-produces-gpu-a'
cycle_relations[0]['supersededBy'] = 'rel-company-a-produces-gpu-b'
cycle_relations[1]['relationId'] = 'rel-company-a-produces-gpu-b'
cycle_relations[1]['supersededBy'] = 'rel-company-a-produces-gpu-a'
cycle_relations.sort(key=lambda relation: relation['relationId'])
cycle_bindings = []
cycle_errors = validate(cycle_relations, cycle_bindings)
assert any('supersession cycle detected' in error for error in cycle_errors)

print(
    'Relation validator tests OK: 2 valid states / '
    f'{len(invalid_cases)} invalid fixtures / 8 accepted endpoint fixtures / supersession guard'
)
