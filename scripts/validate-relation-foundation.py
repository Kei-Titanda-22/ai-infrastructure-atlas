#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'

RELATION_PATH = DATA / 'relationships.json'
BINDING_PATH = DATA / 'relation-evidence-bindings-v01.json'
AUTHORING_SCHEMA_PATH = DATA / 'relation-authoring-schema-v01.json'
BINDING_SCHEMA_PATH = DATA / 'relation-evidence-binding-schema-v01.json'
RESOLVED_SCHEMA_PATH = DATA / 'relation-resolved-schema-v01.json'
SOURCE_MANIFEST_PATH = DATA / 'source-registry-manifest.json'

RELATION_TYPES = {
    'PRODUCES',
    'DEVELOPS',
    'USES',
    'ENABLES',
    'SUPPLIES_TO',
    'COMPETES_WITH',
    'OPERATES',
    'POSITIONED_IN',
}
DEFERRED_RELATION_TYPES = {'SUBSTITUTES', 'EXPANDS', 'EXPOSED_TO'}
GUARDED_RELATION_TYPES = {'ENABLES', 'SUPPLIES_TO'}
ENTITY_TYPES = {'company', 'product', 'technology', 'value-chain-node', 'facility', 'market'}
ENDPOINT_MATRIX = {
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
CLAIM_TYPES = {'fact', 'company-guidance', 'company-positioning', 'atlas-analysis', 'estimate'}
IMPORTANCE = {'P1', 'P2', 'P3'}
CONFIDENCE = {'low', 'medium', 'high'}
SUPPORT = {'supports', 'context', 'contradicts'}
LOCATOR_FIELDS = {'page', 'section', 'heading', 'table', 'note', 'anchor', 'quotedLabel'}
SCOPE_ARRAY_FIELDS = ('productIds', 'technologyIds', 'valueChainNodeIds', 'marketIds', 'geographies')
CORE_SCOPE_FIELDS = ('productIds', 'technologyIds', 'valueChainNodeIds', 'marketIds')
SCOPE_KEYS = set(SCOPE_ARRAY_FIELDS) | {'businessUnit', 'capacityBasis'}
DERIVED_FIELDS = {'evidenceIds', 'sourceIds', 'freshnessStatus'}

RELATION_KEYS = {
    'relationId', 'subjectType', 'subjectId', 'relationType', 'objectType', 'objectId',
    'scope', 'statement', 'claimType', 'asOf', 'lastVerified', 'nextReview',
    'importance', 'displayPriority', 'confidence', 'validFrom', 'validTo', 'supersededBy',
}
BINDING_REQUIRED_KEYS = {'id', 'relationId', 'sourceId', 'support', 'locator', 'lastChecked'}
ID_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
RELATION_ID_PATTERN = re.compile(r'^rel-[a-z0-9]+(?:-[a-z0-9]+)*$')
BINDING_ID_PATTERN = re.compile(r'^rel-evidence-[a-z0-9]+(?:-[a-z0-9]+)*$')


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def is_date(value: Any) -> bool:
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def has_structured_locator(locator: Any) -> bool:
    return (
        isinstance(locator, dict)
        and bool(locator)
        and not (set(locator) - LOCATOR_FIELDS)
        and all(is_nonempty_string(value) for value in locator.values())
    )


def validate_schema_contracts(
    authoring_schema: Any,
    binding_schema: Any,
    resolved_schema: Any,
) -> list[str]:
    errors: list[str] = []
    authoring_relation = authoring_schema.get('$defs', {}).get('relation', {})
    authoring_properties = authoring_relation.get('properties', {})
    authoring_types = set(authoring_properties.get('relationType', {}).get('enum', []))
    if authoring_schema.get('type') != 'array' or authoring_types != RELATION_TYPES:
        errors.append('authoring schema must expose exactly the eight accepted Relation types')
    if DEFERRED_RELATION_TYPES & authoring_types:
        errors.append('authoring schema must reject deferred Relation types')
    if DERIVED_FIELDS & set(authoring_properties):
        errors.append('authoring schema must not persist derived fields')
    if set(authoring_relation.get('required', [])) != RELATION_KEYS:
        errors.append('authoring schema required fields differ from the v0.1 contract')
    if authoring_relation.get('additionalProperties') is not False:
        errors.append('authoring schema must reject unknown fields')

    binding = binding_schema.get('$defs', {}).get('binding', {})
    binding_properties = binding.get('properties', {})
    if binding_schema.get('type') != 'array':
        errors.append('Relation Evidence Binding schema must describe an array')
    if set(binding.get('required', [])) != BINDING_REQUIRED_KEYS:
        errors.append('Relation Evidence Binding required fields differ from the v0.1 contract')
    if set(binding_properties.get('support', {}).get('enum', [])) != SUPPORT:
        errors.append('Relation Evidence Binding support enum differs from the v0.1 contract')
    locator_fields = set(binding_schema.get('$defs', {}).get('locator', {}).get('properties', {}))
    if locator_fields != LOCATOR_FIELDS:
        errors.append('Relation Evidence Binding Locator fields differ from the frozen contract')

    resolved_relation = resolved_schema.get('$defs', {}).get('resolvedRelation', {})
    resolved_properties = resolved_relation.get('properties', {})
    if set(resolved_properties) != RELATION_KEYS | DERIVED_FIELDS:
        errors.append('resolved schema must contain authoring fields plus only the three derived fields')
    if resolved_relation.get('additionalProperties') is not False:
        errors.append('resolved schema must reject fields outside authoring fields plus derived fields')
    if set(resolved_relation.get('required', [])) != RELATION_KEYS | DERIVED_FIELDS:
        errors.append('resolved schema required fields must equal authoring required fields plus derived fields')

    for definition in ('id', 'date', 'scope'):
        authoring_definition = authoring_schema.get('$defs', {}).get(definition)
        resolved_definition = resolved_schema.get('$defs', {}).get(definition)
        if resolved_definition != authoring_definition:
            errors.append(f'resolved schema {definition} definition must match authoring schema exactly')
    for field in sorted(RELATION_KEYS):
        if resolved_properties.get(field) != authoring_properties.get(field):
            errors.append(f'resolved schema authoring field parity mismatch: {field}')

    evidence_ids = resolved_properties.get('evidenceIds', {})
    if evidence_ids != {
        'type': 'array',
        'items': {'type': 'string', 'pattern': BINDING_ID_PATTERN.pattern},
        'uniqueItems': True,
    }:
        errors.append('resolved evidenceIds must be unique Relation Evidence Binding IDs')
    source_ids = resolved_properties.get('sourceIds', {})
    if source_ids != {
        'type': 'array',
        'items': {'type': 'string', 'minLength': 1},
        'uniqueItems': True,
    }:
        errors.append('resolved sourceIds must be unique non-empty Source IDs')
    freshness = set(resolved_properties.get('freshnessStatus', {}).get('enum', []))
    if freshness != {'current', 'review-due', 'stale'}:
        errors.append('resolved Relation freshness must be current/review-due/stale only')
    if 'not-applicable' in freshness:
        errors.append('not-applicable belongs to Coverage, not Relation freshness')
    return errors


def load_endpoint_ids() -> dict[str, set[str]]:
    return {
        'company': {
            record['id']
            for path in sorted((DATA / 'companies').glob('*.json'))
            for record in [load_json(path)]
        },
        'product': {record['id'] for record in load_json(DATA / 'product-registry-v01.json')['records']},
        'technology': {record['id'] for record in load_json(DATA / 'technology-registry-v01.json')['records']},
        'market': {record['id'] for record in load_json(DATA / 'market-registry-v01.json')['records']},
        'facility': {record['id'] for record in load_json(DATA / 'facilities.json')},
        'value-chain-node': {record['id'] for record in load_json(DATA / 'value-chain.json')},
    }


def load_source_ids() -> set[str]:
    manifest = load_json(SOURCE_MANIFEST_PATH)
    source_ids: set[str] = set()
    for shard in manifest['shards']:
        payload = load_json(DATA / shard)
        if isinstance(payload, list):
            source_ids.update(
                record['id'] for record in payload
                if isinstance(record, dict) and isinstance(record.get('id'), str)
            )
    return source_ids


def validate_scope(
    relation_id: str,
    scope: Any,
    endpoint_ids: dict[str, set[str]],
    errors: list[str],
) -> dict[str, Any] | None:
    if not isinstance(scope, dict) or set(scope) != SCOPE_KEYS:
        errors.append(f'{relation_id}: scope keys differ from the v0.1 contract')
        return None
    for field in SCOPE_ARRAY_FIELDS:
        values = scope.get(field)
        if not isinstance(values, list) or any(not is_nonempty_string(value) for value in values):
            errors.append(f'{relation_id}: scope.{field} must be an array of non-empty IDs')
            continue
        if len(values) != len(set(values)):
            errors.append(f'{relation_id}: scope.{field} must contain unique IDs')
        if values != sorted(values):
            errors.append(f'{relation_id}: scope.{field} must use stable ID ordering')
        if field == 'geographies':
            invalid = sorted(value for value in values if not ID_PATTERN.fullmatch(value))
        else:
            entity_type = {
                'productIds': 'product',
                'technologyIds': 'technology',
                'valueChainNodeIds': 'value-chain-node',
                'marketIds': 'market',
            }[field]
            invalid = sorted(set(values) - endpoint_ids[entity_type])
        if invalid:
            errors.append(f'{relation_id}: scope.{field} contains unknown or invalid IDs {invalid}')
    if scope.get('businessUnit') is not None:
        errors.append(f'{relation_id}: scope.businessUnit must be null in v0.1')
    capacity_basis = scope.get('capacityBasis')
    if capacity_basis is not None and not is_nonempty_string(capacity_basis):
        errors.append(f'{relation_id}: scope.capacityBasis must be null or a non-empty string')
    return scope


def scope_has_dimension(scope: dict[str, Any], fields: Iterable[str] = SCOPE_ARRAY_FIELDS) -> bool:
    return any(bool(scope.get(field)) for field in fields)


def relation_signature(relation: dict[str, Any]) -> tuple[Any, ...]:
    subject = (relation.get('subjectType'), relation.get('subjectId'))
    object_ = (relation.get('objectType'), relation.get('objectId'))
    if relation.get('relationType') == 'COMPETES_WITH' and object_ < subject:
        subject, object_ = object_, subject
    return (
        subject,
        relation.get('relationType'),
        object_,
        stable_json(relation.get('scope')),
    )


def validity_overlaps(left: dict[str, Any], right: dict[str, Any]) -> bool:
    left_start = left.get('validFrom') or '0001-01-01'
    left_end = left.get('validTo') or '9999-12-31'
    right_start = right.get('validFrom') or '0001-01-01'
    right_end = right.get('validTo') or '9999-12-31'
    return left_start <= right_end and right_start <= left_end


def validate_relation_payloads(
    relations: Any,
    bindings: Any,
    endpoint_ids: dict[str, set[str]],
    source_ids: set[str],
) -> list[str]:
    errors: list[str] = []
    if not isinstance(relations, list):
        return ['Relation authoring data must be an array']
    if not isinstance(bindings, list):
        return ['Relation Evidence Binding data must be an array']

    relation_ids = [record.get('relationId') for record in relations if isinstance(record, dict)]
    if len(relation_ids) != len(relations):
        errors.append('every Relation must be an object with relationId')
    elif relation_ids != sorted(relation_ids):
        errors.append('Relation records must use stable relationId ordering')
    if len(relation_ids) != len(set(relation_ids)):
        errors.append('Relation IDs must be unique')

    relation_by_id = {
        record.get('relationId'): record
        for record in relations
        if isinstance(record, dict) and isinstance(record.get('relationId'), str)
    }

    for index, relation in enumerate(relations):
        if not isinstance(relation, dict):
            continue
        relation_id = relation.get('relationId', f'relation[{index}]')
        derived = DERIVED_FIELDS & set(relation)
        if derived:
            errors.append(f'{relation_id}: authoring Relation contains derived fields {sorted(derived)}')
        if set(relation) != RELATION_KEYS:
            errors.append(f'{relation_id}: authoring Relation keys differ from the v0.1 contract')
        if not isinstance(relation_id, str) or not RELATION_ID_PATTERN.fullmatch(relation_id):
            errors.append(f'{relation_id}: invalid Relation ID')

        relation_type = relation.get('relationType')
        if isinstance(relation_type, str) and relation_type in DEFERRED_RELATION_TYPES:
            errors.append(f'{relation_id}: deferred Relation type is not authorable: {relation_type}')
        elif not isinstance(relation_type, str) or relation_type not in RELATION_TYPES:
            errors.append(f'{relation_id}: unknown Relation type {relation_type!r}')

        subject_type = relation.get('subjectType')
        object_type = relation.get('objectType')
        if not isinstance(subject_type, str) or not isinstance(object_type, str) or subject_type not in ENTITY_TYPES or object_type not in ENTITY_TYPES:
            errors.append(f'{relation_id}: unknown endpoint entity type')
        elif isinstance(relation_type, str) and relation_type in RELATION_TYPES and (subject_type, object_type) not in ENDPOINT_MATRIX[relation_type]:
            errors.append(f'{relation_id}: endpoint kinds are incompatible with {relation_type}')

        subject_id = relation.get('subjectId')
        object_id = relation.get('objectId')
        if not is_nonempty_string(subject_id) or not ID_PATTERN.fullmatch(subject_id):
            errors.append(f'{relation_id}: invalid subject endpoint ID')
        elif isinstance(subject_type, str) and subject_type in endpoint_ids and subject_id not in endpoint_ids[subject_type]:
            errors.append(f'{relation_id}: unknown subject endpoint {subject_type}:{subject_id}')
        if not is_nonempty_string(object_id) or not ID_PATTERN.fullmatch(object_id):
            errors.append(f'{relation_id}: invalid object endpoint ID')
        elif isinstance(object_type, str) and object_type in endpoint_ids and object_id not in endpoint_ids[object_type]:
            errors.append(f'{relation_id}: unknown object endpoint {object_type}:{object_id}')
        if subject_type == object_type and subject_id == object_id:
            errors.append(f'{relation_id}: prohibited self-reference')
        if relation_type == 'COMPETES_WITH' and isinstance(subject_id, str) and isinstance(object_id, str):
            if subject_id >= object_id:
                errors.append(f'{relation_id}: COMPETES_WITH endpoints must use lexicographic canonical order')

        scope = validate_scope(str(relation_id), relation.get('scope'), endpoint_ids, errors)
        if scope is not None:
            if isinstance(relation_type, str) and relation_type in GUARDED_RELATION_TYPES and not scope_has_dimension(scope):
                errors.append(f'{relation_id}: guarded Relation requires at least one scope dimension')
            if relation_type == 'COMPETES_WITH' and not scope_has_dimension(scope, CORE_SCOPE_FIELDS):
                errors.append(f'{relation_id}: COMPETES_WITH requires product/technology/value-chain/market scope')
            if relation_type == 'SUPPLIES_TO' and object_type == 'company' and not scope_has_dimension(scope, CORE_SCOPE_FIELDS):
                errors.append(f'{relation_id}: Company SUPPLIES_TO requires product/technology/value-chain/market scope')

        statement = relation.get('statement')
        if not is_nonempty_string(statement) or len(statement) > 600:
            errors.append(f'{relation_id}: statement must be non-empty and at most 600 characters')
        claim_type = relation.get('claimType')
        confidence = relation.get('confidence')
        if not isinstance(claim_type, str) or claim_type not in CLAIM_TYPES:
            errors.append(f'{relation_id}: invalid claimType')
        if confidence is not None and (not isinstance(confidence, str) or confidence not in CONFIDENCE):
            errors.append(f'{relation_id}: confidence must be low/medium/high/null')
        if claim_type == 'fact' and confidence is not None:
            errors.append(f'{relation_id}: fact must have confidence null')
        if isinstance(claim_type, str) and claim_type in {'atlas-analysis', 'estimate'} and confidence not in CONFIDENCE:
            errors.append(f'{relation_id}: analysis/estimate requires confidence')
        if relation_type == 'POSITIONED_IN' and claim_type == 'fact':
            errors.append(f'{relation_id}: POSITIONED_IN Atlas mapping must not be authored as fact')

        if not is_date(relation.get('asOf')):
            errors.append(f'{relation_id}: asOf must be an ISO date')
        for field in ('lastVerified', 'nextReview', 'validFrom', 'validTo'):
            value = relation.get(field)
            if value is not None and not is_date(value):
                errors.append(f'{relation_id}: {field} must be an ISO date or null')
        if relation.get('lastVerified') is None:
            errors.append(f'{relation_id}: public Relation requires lastVerified')
        if is_date(relation.get('asOf')) and is_date(relation.get('lastVerified')):
            if relation['lastVerified'] < relation['asOf']:
                errors.append(f'{relation_id}: lastVerified must not precede asOf')
        if is_date(relation.get('lastVerified')) and is_date(relation.get('nextReview')):
            if relation['nextReview'] < relation['lastVerified']:
                errors.append(f'{relation_id}: nextReview must not precede lastVerified')
        if is_date(relation.get('validFrom')) and is_date(relation.get('validTo')):
            if relation['validTo'] < relation['validFrom']:
                errors.append(f'{relation_id}: validTo must not precede validFrom')
        if not isinstance(relation.get('importance'), str) or relation.get('importance') not in IMPORTANCE:
            errors.append(f'{relation_id}: invalid importance')
        display_priority = relation.get('displayPriority')
        if not isinstance(display_priority, int) or isinstance(display_priority, bool) or not 1 <= display_priority <= 99:
            errors.append(f'{relation_id}: displayPriority must be an integer from 1 to 99')

        superseded_by = relation.get('supersededBy')
        if superseded_by is not None:
            if not isinstance(superseded_by, str) or not RELATION_ID_PATTERN.fullmatch(superseded_by):
                errors.append(f'{relation_id}: supersededBy must be null or a Relation ID')
            elif superseded_by == relation_id:
                errors.append(f'{relation_id}: Relation cannot supersede itself')
            elif superseded_by not in relation_by_id:
                errors.append(f'{relation_id}: unknown supersededBy Relation {superseded_by}')
            elif relation_signature(relation_by_id[superseded_by]) != relation_signature(relation):
                errors.append(f'{relation_id}: supersededBy must preserve logical endpoint and scope')

    for relation in relations:
        if not isinstance(relation, dict) or not isinstance(relation.get('relationId'), str):
            continue
        origin = relation['relationId']
        cursor: str | None = origin
        seen: set[str] = set()
        while cursor is not None and cursor in relation_by_id:
            if cursor in seen:
                errors.append(f'{origin}: supersession cycle detected')
                break
            seen.add(cursor)
            next_id = relation_by_id[cursor].get('supersededBy')
            cursor = next_id if isinstance(next_id, str) else None

    for left_index, left in enumerate(relations):
        if not isinstance(left, dict):
            continue
        for right in relations[left_index + 1:]:
            if not isinstance(right, dict):
                continue
            if relation_signature(left) == relation_signature(right) and validity_overlaps(left, right):
                errors.append(
                    f"{left.get('relationId')} / {right.get('relationId')}: duplicate logical Relation with overlapping validity"
                )

    binding_ids = [record.get('id') for record in bindings if isinstance(record, dict)]
    if len(binding_ids) != len(bindings):
        errors.append('every Relation Evidence Binding must be an object with id')
    elif binding_ids != sorted(binding_ids):
        errors.append('Relation Evidence Binding records must use stable ID ordering')
    if len(binding_ids) != len(set(binding_ids)):
        errors.append('Relation Evidence Binding IDs must be unique')

    bindings_by_relation: dict[str, list[dict[str, Any]]] = {}
    binding_signatures: set[tuple[Any, ...]] = set()
    for index, binding in enumerate(bindings):
        if not isinstance(binding, dict):
            continue
        binding_id = binding.get('id', f'binding[{index}]')
        allowed_keys = BINDING_REQUIRED_KEYS | {'notes'}
        if set(binding) not in (BINDING_REQUIRED_KEYS, allowed_keys):
            errors.append(f'{binding_id}: Relation Evidence Binding keys differ from the v0.1 contract')
        if not isinstance(binding_id, str) or not BINDING_ID_PATTERN.fullmatch(binding_id):
            errors.append(f'{binding_id}: invalid Relation Evidence Binding ID')
        relation_id = binding.get('relationId')
        if not isinstance(relation_id, str) or relation_id not in relation_by_id:
            errors.append(f'{binding_id}: unknown Relation {relation_id}')
        else:
            bindings_by_relation.setdefault(relation_id, []).append(binding)
        source_id = binding.get('sourceId')
        if not is_nonempty_string(source_id) or source_id not in source_ids:
            errors.append(f'{binding_id}: unknown Shared Source {source_id}')
        if not isinstance(binding.get('support'), str) or binding.get('support') not in SUPPORT:
            errors.append(f'{binding_id}: invalid support')
        locator = binding.get('locator')
        if not has_structured_locator(locator):
            errors.append(f'{binding_id}: structured Locator is required and must use frozen fields')
        if not is_date(binding.get('lastChecked')):
            errors.append(f'{binding_id}: lastChecked must be an ISO date')
        if 'notes' in binding and not is_nonempty_string(binding.get('notes')):
            errors.append(f'{binding_id}: notes must be non-empty when present')
        signature = (stable_json(relation_id), stable_json(source_id), stable_json(locator))
        if signature in binding_signatures:
            errors.append(f'{binding_id}: duplicate Relation/Source/Locator Binding')
        binding_signatures.add(signature)

    for relation_id in relation_by_id:
        relation_bindings = bindings_by_relation.get(relation_id, [])
        supports = [binding for binding in relation_bindings if binding.get('support') == 'supports']
        if not supports:
            errors.append(f'{relation_id}: public Relation requires a direct supports Binding')
        elif not any(has_structured_locator(binding.get('locator')) for binding in supports):
            errors.append(f'{relation_id}: direct supports Binding requires a structured Locator')
        if any(binding.get('support') == 'contradicts' for binding in relation_bindings):
            errors.append(f'{relation_id}: unresolved contradicts Binding blocks publication')

    return errors


def validate_repository() -> list[str]:
    errors = validate_schema_contracts(
        load_json(AUTHORING_SCHEMA_PATH),
        load_json(BINDING_SCHEMA_PATH),
        load_json(RESOLVED_SCHEMA_PATH),
    )
    errors.extend(
        validate_relation_payloads(
            load_json(RELATION_PATH),
            load_json(BINDING_PATH),
            load_endpoint_ids(),
            load_source_ids(),
        )
    )
    return errors


def main() -> int:
    errors = validate_repository()
    if errors:
        print('Relation executable foundation validation FAILED')
        for error in errors:
            print(' -', error)
        return 1
    relations = load_json(RELATION_PATH)
    bindings = load_json(BINDING_PATH)
    print(
        'Relation executable foundation validation OK: '
        f'accepted types {len(RELATION_TYPES)} / deferred rejected {len(DEFERRED_RELATION_TYPES)} / '
        f'production Relations {len(relations)} / Relation Evidence Bindings {len(bindings)}'
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
