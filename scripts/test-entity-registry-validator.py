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


def load_payloads():
    return {
        entity_type: json.loads(path.read_text(encoding='utf-8'))
        for entity_type, path in validator.REGISTRY_PATHS.items()
    }


def expect_error(payloads, fragment: str) -> None:
    errors = validator.validate_registry_payloads(payloads)
    if not any(fragment in error for error in errors):
        raise AssertionError(f'Expected error containing {fragment!r}; got {errors!r}')


baseline = load_payloads()
baseline_errors = validator.validate_registry_payloads(baseline)
if baseline_errors:
    raise AssertionError(f'Baseline registry fixture failed: {baseline_errors!r}')
assert validator.normalize_label(' ＧＰＵ ') == 'gpu'
assert validator.normalize_label('GpU') == 'gpu'
assert validator.normalize_label(' 日本語label ') == '日本語label'

invalid_product_kind = copy.deepcopy(baseline)
invalid_product_kind['product']['records'][0]['productKind'] = 'named-family'
expect_error(invalid_product_kind, 'generic-category')

unknown_field = copy.deepcopy(baseline)
unknown_field['technology']['records'][0]['description'] = 'not part of identity contract'
expect_error(unknown_field, 'record keys differ')

cross_registry_collision = copy.deepcopy(baseline)
cross_registry_collision['technology']['records'][0]['aliases'] = ['ＧＰＵ']
expect_error(cross_registry_collision, 'cross-registry alias collision')

unsupported_casefold_label = copy.deepcopy(baseline)
unsupported_casefold_label['product']['records'][0]['aliases'] = ['Straße']
expect_error(unsupported_casefold_label, 'unsupported label')

unstable_order = copy.deepcopy(baseline)
unstable_order['product']['records'] = list(reversed(unstable_order['product']['records']))
expect_error(unstable_order, 'stable ID ordering')

replacement_cycle = copy.deepcopy(baseline)
first, second = replacement_cycle['product']['records'][:2]
first['status'] = 'deprecated'
second['status'] = 'deprecated'
first['replacedBy'] = second['id']
second['replacedBy'] = first['id']
expect_error(replacement_cycle, 'replacement cycle')

duplicate_id = copy.deepcopy(baseline)
duplicate_id['technology']['records'][0]['id'] = duplicate_id['product']['records'][0]['id']
expect_error(duplicate_id, 'duplicate global ID')

print('Entity Registry validator tests OK: normalization fixtures / 1 valid registry / 7 invalid invariants')
