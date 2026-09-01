#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'
DOCS = ROOT / 'docs'

REGISTRY_PATHS = {
    'product': DATA / 'product-registry-v01.json',
    'technology': DATA / 'technology-registry-v01.json',
    'market': DATA / 'market-registry-v01.json',
}
SCHEMA_PATH = DATA / 'entity-registry-schema-v01.json'
AUDIT_PATH = DOCS / 'phase8-pilot-minimal-registry-candidate-audit-v01.json'
EVIDENCE_MANIFEST_PATH = DATA / 'company-evidence-manifest.json'
SOURCE_MANIFEST_PATH = DATA / 'source-registry-manifest.json'
VALUE_CHAIN_PATH = DATA / 'value-chain.json'
RELATIONSHIPS_PATH = DATA / 'relationships.json'

PILOT_COMPANIES = [
    'nvidia',
    'broadcom',
    'applied-materials',
    'lam-research',
    'tokyo-electron',
]
ENTITY_TYPES = {'product', 'technology', 'market'}
CANDIDATE_ENTITY_TYPES = ENTITY_TYPES | {'value-chain-node'}
STATUSES = {'active', 'deprecated'}
DECISIONS = {'include', 'defer', 'reject'}
USAGES = {'endpoint', 'scope'}
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
TECHNOLOGY_KINDS = {
    'architecture',
    'manufacturing-process',
    'protocol',
    'material-technology',
    'process-technology',
}
MARKET_KINDS = {'end-market', 'demand-domain'}
ID_PATTERNS = {
    'product': re.compile(r'^product-category-[a-z0-9]+(?:-[a-z0-9]+)*$'),
    'technology': re.compile(r'^technology-[a-z0-9]+(?:-[a-z0-9]+)*$'),
    'market': re.compile(r'^market-[a-z0-9]+(?:-[a-z0-9]+)*$'),
}
LOCALE_PATTERN = re.compile(r'^[a-z]{2}(?:-[A-Z]{2})?$')
CANDIDATE_ID_PATTERN = re.compile(r'^candidate-[a-z0-9]+(?:-[a-z0-9]+)*$')
SHA_PATTERN = re.compile(r'^[0-9a-f]{64}$')
COMMIT_PATTERN = re.compile(r'^[0-9a-f]{40}$')

COMMON_KEYS = {
    'id',
    'entityType',
    'canonicalName',
    'displayNames',
    'aliases',
    'status',
    'replacedBy',
}
TYPE_KEYS = {
    'product': COMMON_KEYS | {'productKind'},
    'technology': COMMON_KEYS | {'technologyKind'},
    'market': COMMON_KEYS | {'marketKind'},
}
CANDIDATE_KEYS = {
    'candidateId',
    'proposedId',
    'entityType',
    'canonicalName',
    'aliases',
    'companies',
    'futureRelationTypes',
    'usage',
    'grounding',
    'locatorAvailability',
    'decision',
    'rationale',
}
GROUNDING_KEYS = {
    'companyId',
    'claimId',
    'evidenceBindingId',
    'sourceId',
    'locatorAvailable',
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def normalize_label(value: str) -> str:
    return unicodedata.normalize('NFKC', value).strip().casefold()


def stable_strings(values: Iterable[str]) -> list[str]:
    return sorted(values, key=lambda value: (normalize_label(value), value))


def corpus_digest(paths: Iterable[Path]) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths, key=lambda item: item.relative_to(ROOT).as_posix()):
        digest.update(path.relative_to(ROOT).as_posix().encode('utf-8'))
        digest.update(b'\0')
        digest.update(path.read_bytes())
        digest.update(b'\0')
    return digest.hexdigest()


def is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def has_structured_locator(locator: Any) -> bool:
    return (
        isinstance(locator, dict)
        and bool(locator)
        and any(is_nonempty_string(value) for value in locator.values())
    )


def validate_string_array(
    values: Any,
    label: str,
    errors: list[str],
    *,
    allowed: set[str] | None = None,
    nonempty: bool = False,
) -> list[str]:
    if not isinstance(values, list) or any(not is_nonempty_string(value) for value in values):
        errors.append(f'{label}: must be an array of non-empty strings')
        return []
    if nonempty and not values:
        errors.append(f'{label}: must not be empty')
    if len({normalize_label(value) for value in values}) != len(values):
        errors.append(f'{label}: contains an NFKC/casefold duplicate')
    if values != stable_strings(values):
        errors.append(f'{label}: must use stable normalized ordering')
    if allowed is not None:
        invalid = sorted(set(values) - allowed)
        if invalid:
            errors.append(f'{label}: invalid values {invalid}')
    return values


def validate_schema_contract(schema: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(schema, dict):
        return ['entity registry schema must be an object']
    definitions = schema.get('$defs')
    required_definitions = {
        'displayNames',
        'commonRecord',
        'productRecord',
        'technologyRecord',
        'marketRecord',
        'productRegistry',
        'technologyRegistry',
        'marketRegistry',
    }
    if not isinstance(definitions, dict) or set(definitions) != required_definitions:
        errors.append('entity registry schema definitions differ from the v0.1 contract')
        return errors
    product_kind = (
        definitions.get('productRecord', {})
        .get('allOf', [{}, {}])[1]
        .get('properties', {})
        .get('productKind', {})
        .get('const')
    )
    if product_kind != 'generic-category':
        errors.append('schema must fix Product.productKind to generic-category')
    if len(schema.get('oneOf', [])) != 3:
        errors.append('schema must expose exactly Product, Technology, and Market registry envelopes')
    return errors


def validate_registry_payloads(payloads: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    all_records: list[dict[str, Any]] = []
    all_ids: dict[str, str] = {}
    label_owners: dict[str, str] = {}

    if set(payloads) != ENTITY_TYPES:
        errors.append(f'registry payloads must be exactly {sorted(ENTITY_TYPES)}')

    for entity_type in sorted(ENTITY_TYPES):
        payload = payloads.get(entity_type)
        label = f'{entity_type} registry'
        if not isinstance(payload, dict):
            errors.append(f'{label}: envelope must be an object')
            continue
        if set(payload) != {'schemaVersion', 'entityType', 'records'}:
            errors.append(f'{label}: envelope keys differ from contract')
        if payload.get('schemaVersion') != '0.1':
            errors.append(f'{label}: schemaVersion must be 0.1')
        if payload.get('entityType') != entity_type:
            errors.append(f'{label}: entityType must be {entity_type}')
        records = payload.get('records')
        if not isinstance(records, list):
            errors.append(f'{label}: records must be an array')
            continue
        record_ids = [record.get('id') for record in records if isinstance(record, dict)]
        if len(record_ids) != len(records):
            errors.append(f'{label}: every record must be an object with an ID')
        elif record_ids != sorted(record_ids):
            errors.append(f'{label}: records must use stable ID ordering')

        for index, record in enumerate(records):
            record_label = f'{label}[{index}]'
            if not isinstance(record, dict):
                continue
            record_id = record.get('id', '<missing>')
            record_label = str(record_id)
            if set(record) != TYPE_KEYS[entity_type]:
                errors.append(f'{record_label}: record keys differ from {entity_type} contract')
            if not is_nonempty_string(record_id) or not ID_PATTERNS[entity_type].fullmatch(record_id):
                errors.append(f'{record_label}: invalid {entity_type} ID or prefix')
            if record.get('entityType') != entity_type:
                errors.append(f'{record_label}: entityType must be {entity_type}')
            previous_type = all_ids.get(record_id)
            if previous_type is not None:
                errors.append(f'{record_label}: duplicate global ID also present in {previous_type}')
            else:
                all_ids[record_id] = entity_type

            canonical_name = record.get('canonicalName')
            if not is_nonempty_string(canonical_name):
                errors.append(f'{record_label}: canonicalName must be non-empty')

            display_names = record.get('displayNames')
            if not isinstance(display_names, dict) or not display_names:
                errors.append(f'{record_label}: displayNames must be a non-empty object')
                display_names = {}
            else:
                if list(display_names) != sorted(display_names):
                    errors.append(f'{record_label}: displayNames locale keys must be stable-sorted')
                for locale, display_name in display_names.items():
                    if not LOCALE_PATTERN.fullmatch(locale) or not is_nonempty_string(display_name):
                        errors.append(f'{record_label}: invalid displayNames entry {locale!r}')

            aliases = validate_string_array(record.get('aliases'), f'{record_label}.aliases', errors)
            if is_nonempty_string(canonical_name):
                canonical_key = normalize_label(canonical_name)
                if canonical_key in {normalize_label(alias) for alias in aliases}:
                    errors.append(f'{record_label}: canonicalName must not be duplicated as an alias')

            status = record.get('status')
            if status not in STATUSES:
                errors.append(f'{record_label}: invalid status {status!r}')
            replaced_by = record.get('replacedBy')
            if replaced_by is not None and not is_nonempty_string(replaced_by):
                errors.append(f'{record_label}: replacedBy must be null or a non-empty ID')
            if status == 'active' and replaced_by is not None:
                errors.append(f'{record_label}: active records must have replacedBy null')

            if entity_type == 'product' and record.get('productKind') != 'generic-category':
                errors.append(f'{record_label}: Product must use productKind generic-category')
            if entity_type == 'technology' and record.get('technologyKind') not in TECHNOLOGY_KINDS:
                errors.append(f'{record_label}: invalid technologyKind')
            if entity_type == 'market' and record.get('marketKind') not in MARKET_KINDS:
                errors.append(f'{record_label}: invalid marketKind')

            labels = []
            if is_nonempty_string(canonical_name):
                labels.append(canonical_name)
            labels.extend(value for value in display_names.values() if is_nonempty_string(value))
            labels.extend(aliases)
            for value in labels:
                normalized = normalize_label(value)
                previous = label_owners.get(normalized)
                if previous is not None and previous != record_id:
                    errors.append(
                        f'{record_label}: cross-registry alias collision for {value!r} with {previous}'
                    )
                else:
                    label_owners[normalized] = record_id

            all_records.append(record)

    records_by_id = {
        record.get('id'): record
        for record in all_records
        if isinstance(record.get('id'), str)
    }
    for record in all_records:
        record_id = record.get('id')
        replaced_by = record.get('replacedBy')
        if replaced_by is None:
            continue
        replacement = records_by_id.get(replaced_by)
        if replacement is None:
            errors.append(f'{record_id}: replacedBy does not resolve: {replaced_by}')
        elif replacement.get('entityType') != record.get('entityType'):
            errors.append(f'{record_id}: replacedBy must stay within the same registry')

    for record in all_records:
        origin = record.get('id')
        cursor = origin
        seen: set[str] = set()
        while cursor is not None:
            if cursor in seen:
                errors.append(f'{origin}: replacement cycle detected')
                break
            seen.add(cursor)
            next_record = records_by_id.get(cursor)
            cursor = next_record.get('replacedBy') if next_record else None

    return errors


def load_evidence_corpus() -> tuple[dict[str, Any], dict[str, Any], list[Path]]:
    manifest = load_json(EVIDENCE_MANIFEST_PATH)
    paths = [EVIDENCE_MANIFEST_PATH] + [DATA / shard for shard in manifest['shards']]
    claims: dict[str, Any] = {}
    evidence: dict[str, Any] = {}
    for path in paths[1:]:
        payload = load_json(path)
        for claim in payload['claims']:
            claims[claim['id']] = claim
        for binding in payload['evidence']:
            evidence[binding['id']] = binding
    return claims, evidence, paths


def load_source_ids() -> tuple[set[str], list[Path]]:
    manifest = load_json(SOURCE_MANIFEST_PATH)
    paths = [SOURCE_MANIFEST_PATH] + [DATA / shard for shard in manifest['shards']]
    source_ids: set[str] = set()
    for path in paths[1:]:
        payload = load_json(path)
        if isinstance(payload, list):
            source_ids.update(record['id'] for record in payload)
    return source_ids, paths


def validate_candidate_audit(
    audit: Any,
    payloads: dict[str, Any],
) -> list[str]:
    errors: list[str] = []
    expected_top_keys = {
        'schemaVersion',
        'baselineMain',
        'auditScope',
        'inputDigests',
        'candidates',
        'summary',
    }
    if not isinstance(audit, dict):
        return ['candidate audit must be an object']
    if set(audit) != expected_top_keys:
        errors.append('candidate audit top-level keys differ from contract')
    if audit.get('schemaVersion') != '0.1':
        errors.append('candidate audit schemaVersion must be 0.1')
    if not isinstance(audit.get('baselineMain'), str) or not COMMIT_PATTERN.fullmatch(audit['baselineMain']):
        errors.append('candidate audit baselineMain must be a lowercase 40-character SHA')

    audit_scope = audit.get('auditScope')
    expected_scope = {
        'pilotCompanies': PILOT_COMPANIES,
        'webResearchPerformed': False,
        'relationRecordsCreated': 0,
    }
    if audit_scope != expected_scope:
        errors.append(f'candidate audit auditScope must be {expected_scope}')

    claims, evidence, evidence_paths = load_evidence_corpus()
    source_ids, source_paths = load_source_ids()
    company_paths = [DATA / 'companies' / f'{company_id}.json' for company_id in PILOT_COMPANIES]
    expected_digests = {
        'companyEvidenceCorpusSha256': corpus_digest(evidence_paths),
        'sourceRegistryCorpusSha256': corpus_digest(source_paths),
        'pilotCompanyCorpusSha256': corpus_digest(company_paths),
        'valueChainSha256': hashlib.sha256(VALUE_CHAIN_PATH.read_bytes()).hexdigest(),
        'relationshipsSha256': hashlib.sha256(RELATIONSHIPS_PATH.read_bytes()).hexdigest(),
    }
    digests = audit.get('inputDigests')
    if digests != expected_digests:
        errors.append('candidate audit inputDigests are stale or incomplete')
    elif any(not SHA_PATTERN.fullmatch(value) for value in digests.values()):
        errors.append('candidate audit inputDigests contain an invalid SHA-256')

    relationships = load_json(RELATIONSHIPS_PATH)
    if relationships != []:
        errors.append('relationships.json must remain an empty array')

    registry_records = {
        record['id']: record
        for entity_type in sorted(ENTITY_TYPES)
        for record in payloads[entity_type]['records']
    }
    candidates = audit.get('candidates')
    if not isinstance(candidates, list):
        return errors + ['candidate audit candidates must be an array']
    candidate_ids = [candidate.get('candidateId') for candidate in candidates if isinstance(candidate, dict)]
    if len(candidate_ids) != len(candidates):
        errors.append('every candidate must be an object with candidateId')
    elif candidate_ids != sorted(candidate_ids):
        errors.append('candidate records must use stable candidateId ordering')
    if len(set(candidate_ids)) != len(candidate_ids):
        errors.append('candidateId values must be unique')

    included_ids: set[str] = set()
    decision_counts: Counter[str] = Counter()
    included_type_counts: Counter[str] = Counter()
    included_grounding_count = 0
    included_locator_available = 0

    for index, candidate in enumerate(candidates):
        if not isinstance(candidate, dict):
            continue
        candidate_id = candidate.get('candidateId', f'candidate[{index}]')
        if set(candidate) != CANDIDATE_KEYS:
            errors.append(f'{candidate_id}: candidate keys differ from contract')
        if not is_nonempty_string(candidate_id) or not CANDIDATE_ID_PATTERN.fullmatch(candidate_id):
            errors.append(f'{candidate_id}: invalid candidateId')
        proposed_id = candidate.get('proposedId')
        if not is_nonempty_string(proposed_id):
            errors.append(f'{candidate_id}: proposedId must be non-empty')
        entity_type = candidate.get('entityType')
        if entity_type not in CANDIDATE_ENTITY_TYPES:
            errors.append(f'{candidate_id}: invalid entityType {entity_type!r}')
        if not is_nonempty_string(candidate.get('canonicalName')):
            errors.append(f'{candidate_id}: canonicalName must be non-empty')
        aliases = validate_string_array(candidate.get('aliases'), f'{candidate_id}.aliases', errors)
        companies = validate_string_array(
            candidate.get('companies'),
            f'{candidate_id}.companies',
            errors,
            allowed=set(PILOT_COMPANIES),
            nonempty=True,
        )
        validate_string_array(
            candidate.get('futureRelationTypes'),
            f'{candidate_id}.futureRelationTypes',
            errors,
            allowed=RELATION_TYPES,
            nonempty=True,
        )
        validate_string_array(
            candidate.get('usage'),
            f'{candidate_id}.usage',
            errors,
            allowed=USAGES,
            nonempty=True,
        )
        decision = candidate.get('decision')
        if decision not in DECISIONS:
            errors.append(f'{candidate_id}: invalid decision {decision!r}')
        else:
            decision_counts[decision] += 1
        if not is_nonempty_string(candidate.get('rationale')):
            errors.append(f'{candidate_id}: rationale must be non-empty')

        grounding = candidate.get('grounding')
        if not isinstance(grounding, list) or not grounding:
            errors.append(f'{candidate_id}: grounding must be a non-empty array')
            grounding = []
        locator_count = 0
        grounding_companies: set[str] = set()
        for grounding_index, item in enumerate(grounding):
            item_label = f'{candidate_id}.grounding[{grounding_index}]'
            if not isinstance(item, dict) or set(item) != GROUNDING_KEYS:
                errors.append(f'{item_label}: grounding keys differ from contract')
                continue
            company_id = item.get('companyId')
            grounding_companies.add(company_id)
            claim = claims.get(item.get('claimId'))
            binding = evidence.get(item.get('evidenceBindingId'))
            if company_id not in companies:
                errors.append(f'{item_label}: companyId is not listed by the candidate')
            if claim is None:
                errors.append(f'{item_label}: unknown Claim {item.get("claimId")}')
            elif claim.get('companyId') != company_id:
                errors.append(f'{item_label}: Claim companyId mismatch')
            if binding is None:
                errors.append(f'{item_label}: unknown Evidence Binding {item.get("evidenceBindingId")}')
            else:
                if binding.get('claimId') != item.get('claimId'):
                    errors.append(f'{item_label}: Evidence Binding Claim mismatch')
                if binding.get('sourceId') != item.get('sourceId'):
                    errors.append(f'{item_label}: Evidence Binding Source mismatch')
                locator_available = has_structured_locator(binding.get('locator'))
                if item.get('locatorAvailable') is not locator_available:
                    errors.append(f'{item_label}: locatorAvailable does not match the Binding')
                if locator_available:
                    locator_count += 1
                if decision == 'include' and binding.get('support') != 'supports':
                    errors.append(f'{item_label}: included candidates require a supports Binding')
            if item.get('sourceId') not in source_ids:
                errors.append(f'{item_label}: unknown Shared Source {item.get("sourceId")}')
        if grounding_companies != set(companies):
            errors.append(f'{candidate_id}: every listed company must have grounding')
        expected_locator_status = 'complete' if locator_count == len(grounding) else 'partial'
        if candidate.get('locatorAvailability') != expected_locator_status:
            errors.append(f'{candidate_id}: locatorAvailability must be {expected_locator_status}')

        if decision == 'include':
            if entity_type not in ENTITY_TYPES:
                errors.append(f'{candidate_id}: only Product, Technology, or Market can be included')
                continue
            included_ids.add(proposed_id)
            included_type_counts[entity_type] += 1
            included_grounding_count += len(grounding)
            included_locator_available += locator_count
            record = registry_records.get(proposed_id)
            if record is None:
                errors.append(f'{candidate_id}: included proposedId is missing from registries')
            else:
                if record.get('entityType') != entity_type:
                    errors.append(f'{candidate_id}: registry entityType mismatch')
                if record.get('canonicalName') != candidate.get('canonicalName'):
                    errors.append(f'{candidate_id}: registry canonicalName mismatch')
                if record.get('aliases') != aliases:
                    errors.append(f'{candidate_id}: registry aliases mismatch')
        elif proposed_id in registry_records:
            errors.append(f'{candidate_id}: deferred/rejected candidate leaked into a registry')

    if included_ids != set(registry_records):
        errors.append('included candidate IDs and registry record IDs must match exactly')

    expected_summary = {
        'totalCandidates': len(candidates),
        'decisionCounts': {
            'include': decision_counts['include'],
            'defer': decision_counts['defer'],
            'reject': decision_counts['reject'],
        },
        'includedRegistryCounts': {
            'product': included_type_counts['product'],
            'technology': included_type_counts['technology'],
            'market': included_type_counts['market'],
        },
        'includedGroundingCount': included_grounding_count,
        'includedLocatorCoverage': {
            'available': included_locator_available,
            'total': included_grounding_count,
        },
    }
    if audit.get('summary') != expected_summary:
        errors.append(f'candidate audit summary must be {expected_summary}')
    return errors


def validate_repository() -> tuple[list[str], dict[str, Any], dict[str, Any]]:
    payloads = {entity_type: load_json(path) for entity_type, path in REGISTRY_PATHS.items()}
    audit = load_json(AUDIT_PATH)
    errors = validate_schema_contract(load_json(SCHEMA_PATH))
    errors.extend(validate_registry_payloads(payloads))
    errors.extend(validate_candidate_audit(audit, payloads))
    return errors, payloads, audit


def main() -> int:
    errors, payloads, audit = validate_repository()
    if errors:
        print('Entity Registry validation FAILED')
        for error in errors:
            print(' -', error)
        return 1
    counts = {entity_type: len(payloads[entity_type]['records']) for entity_type in sorted(ENTITY_TYPES)}
    summary = audit['summary']
    print(
        'Entity Registry validation OK: '
        f"Product {counts['product']} / Technology {counts['technology']} / Market {counts['market']} / "
        f"candidates {summary['totalCandidates']} "
        f"(include {summary['decisionCounts']['include']} / "
        f"defer {summary['decisionCounts']['defer']} / "
        f"reject {summary['decisionCounts']['reject']}) / "
        f"grounding Locator {summary['includedLocatorCoverage']['available']}/"
        f"{summary['includedLocatorCoverage']['total']} / relationships 0"
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
