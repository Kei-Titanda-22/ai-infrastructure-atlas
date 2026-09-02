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

authoring_schema = validator.load_json(validator.AUTHORING_SCHEMA_PATH)
binding_schema = validator.load_json(validator.BINDING_SCHEMA_PATH)
resolved_schema = validator.load_json(validator.RESOLVED_SCHEMA_PATH)
schema_errors = validator.validate_schema_contracts(authoring_schema, binding_schema, resolved_schema)
if schema_errors:
    raise AssertionError(f'Baseline schema contract failed: {schema_errors!r}')
weakened_resolved = copy.deepcopy(resolved_schema)
weakened_resolved['$defs']['resolvedRelation']['properties']['relationId'].pop('pattern')
assert any(
    'authoring field parity mismatch: relationId' in error
    for error in validator.validate_schema_contracts(authoring_schema, binding_schema, weakened_resolved)
)
weakened_derived = copy.deepcopy(resolved_schema)
weakened_derived['$defs']['resolvedRelation']['properties']['evidenceIds']['items'].pop('pattern')
assert any(
    'evidenceIds must be unique Relation Evidence Binding IDs' in error
    for error in validator.validate_schema_contracts(authoring_schema, binding_schema, weakened_derived)
)

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
    elif operation == 'addContradictsBinding':
        contradicts = copy.deepcopy(bindings[0])
        contradicts['id'] = 'rel-evidence-company-a-produces-gpu-contradicts'
        contradicts['support'] = 'contradicts'
        contradicts['locator'] = {'heading': 'Contradictory statement'}
        bindings.append(contradicts)
    elif operation == 'duplicateBindingId':
        bindings.append(copy.deepcopy(bindings[0]))
    elif operation == 'duplicateLogicalBinding':
        duplicate = copy.deepcopy(bindings[0])
        duplicate['id'] = 'rel-evidence-company-a-produces-gpu-duplicate'
        bindings.append(duplicate)
    elif operation == 'unstableRelationOrder':
        unordered = copy.deepcopy(relations[0])
        unordered['relationId'] = 'rel-a-company-a-produces-gpu'
        relations.append(unordered)
        unordered_binding = copy.deepcopy(bindings[0])
        unordered_binding['id'] = 'rel-evidence-z-unordered-relation'
        unordered_binding['relationId'] = unordered['relationId']
        bindings.append(unordered_binding)
    elif operation == 'unstableBindingOrder':
        unordered = copy.deepcopy(bindings[0])
        unordered['id'] = 'rel-evidence-a-unordered-binding'
        unordered['support'] = 'context'
        unordered['locator'] = {'heading': 'Additional context'}
        bindings.append(unordered)
    elif operation == 'invalidSupersededSignature':
        successor = copy.deepcopy(relations[0])
        successor['relationId'] = 'rel-company-a-produces-gpu-successor'
        successor['scope']['productIds'] = ['product-category-gpu']
        relations[0]['supersededBy'] = successor['relationId']
        relations.append(successor)
        successor_binding = copy.deepcopy(bindings[0])
        successor_binding['id'] = 'rel-evidence-company-a-produces-gpu-successor'
        successor_binding['relationId'] = successor['relationId']
        bindings.append(successor_binding)
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

matrix_cases = fixture['endpointMatrixCases']
expected_combinations = {
    (relation_type, subject_type, object_type)
    for relation_type, combinations in validator.ENDPOINT_MATRIX.items()
    for subject_type, object_type in combinations
}
actual_combinations = {
    (case['relationType'], case['subjectType'], case['objectType'])
    for case in matrix_cases
}
assert len(matrix_cases) == 12
assert actual_combinations == expected_combinations
for case in matrix_cases:
    relation = copy.deepcopy(populated['relations'][0])
    relation.update({
        'relationId': case['relationId'],
        'subjectType': case['subjectType'],
        'subjectId': case['subjectId'],
        'relationType': case['relationType'],
        'objectType': case['objectType'],
        'objectId': case['objectId'],
        'scope': copy.deepcopy(case['scope']),
        'claimType': case['claimType'],
        'confidence': case['confidence'],
        'statement': f"Valid endpoint fixture: {case['name']}.",
    })
    binding = copy.deepcopy(populated['bindings'][0])
    binding['id'] = f"rel-evidence-{case['name']}"
    binding['relationId'] = case['relationId']
    binding['support'] = case['support']
    matrix_errors = validate([relation], [binding])
    if matrix_errors:
        raise AssertionError(f"{case['name']} valid endpoint fixture failed: {matrix_errors!r}")

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
    f'{len(invalid_cases)} invalid fixtures / 12 endpoint matrix fixtures / '
    'authoring-resolved schema parity / supersession guard'
)
