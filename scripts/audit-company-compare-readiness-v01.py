#!/usr/bin/env python3
"""Build and validate the deterministic 100-company Compare readiness audit.

This audit is deliberately repository-only. It projects existing Company
Evidence without inventing Product, Technology, or Relation mappings.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DOCS = ROOT / "docs"
JSON_OUTPUT = DOCS / "company-compare-readiness-audit-v01.json"
MARKDOWN_OUTPUT = DOCS / "company-compare-readiness-audit-v01.md"

SCHEMA_VERSION = "0.1"
BASELINE_MAIN_SHA = "5afe410c8de549ee58fcd07a0e4de9d0df6e18af"
EXPECTED_COMPANY_COUNT = 100
EXPECTED_COVERAGE = {"complete": 321, "partial": 740, "not-started": 39}
EXPECTED_RELATIONS = 17
EXPECTED_RELATION_BINDINGS = 17
EXPECTED_REGISTRY_COUNTS = {"product": 11, "technology": 8, "market": 0}
EXPECTED_PROJECTION = {"P1": 20, "P2": 14, "P3": 0}
EXPECTED_MARKERS = 53
EXPECTED_TRIAGE_SAMPLE = 87
ACCEPTANCE_REVIEW_DECISION = "REVISE"
ORIGINAL_CLASSIFICATION_COUNTS = {
    "READY_EXISTING_EVIDENCE": 5,
    "DISPLAY_COPY_ONLY": 95,
    "REGISTRY_REQUIRED": 0,
    "RELATION_REQUIRED": 0,
    "EVIDENCE_HOLD": 0,
}

AXES = (
    "what",
    "aiRole",
    "products",
    "competitivePosition",
    "risks",
    "financialComparability",
)
AXIS_LABELS = {
    "what": "何をしている会社か",
    "aiRole": "AIインフラでの役割",
    "products": "主な製品",
    "competitivePosition": "技術・競争力",
    "risks": "主なリスク",
    "financialComparability": "財務比較",
}
AXIS_CATEGORIES = {
    "what": ("company-overview",),
    "aiRole": ("ai-infrastructure-role",),
    "products": ("products",),
    "competitivePosition": ("competitive-positioning", "technology"),
    "risks": ("risks",),
}
AXIS_RELATION_TYPES = {
    "what": set(),
    "aiRole": {"POSITIONED_IN"},
    "products": {"PRODUCES"},
    "competitivePosition": {"COMPETES_WITH", "DEVELOPS", "USES", "ENABLES"},
    "risks": set(),
}

STATUSES = ("complete", "partial", "missing", "notApplicable")
READINESS_CLASSES = (
    "READY_EXISTING_EVIDENCE",
    "DISPLAY_COPY_ONLY",
    "REGISTRY_REQUIRED",
    "RELATION_REQUIRED",
    "EVIDENCE_HOLD",
)
READY_CLASSES = {"READY_EXISTING_EVIDENCE", "DISPLAY_COPY_ONLY"}
PILOT_COMPANY_IDS = {
    "nvidia",
    "broadcom",
    "applied-materials",
    "lam-research",
    "tokyo-electron",
}
FIRST_BATCH_REVIEW_IDS = (
    "amd",
    "vertiv",
    "tsmc",
    "kioxia",
    "amphenol",
    "aptiv",
    "advantest",
    "asm-international",
    "air-liquide",
    "analog-devices",
    "abb",
    "globalfoundries",
    "micron",
    "arista",
    "bosch",
)
LOCATOR_FIELDS = {"page", "section", "heading", "table", "note", "anchor", "quotedLabel"}
GROUNDING_KEYS = (
    "claimIds",
    "companyEvidenceBindingIds",
    "relationIds",
    "relationEvidenceBindingIds",
    "sourceIds",
    "registryEntityIds",
    "valueChainNodeIds",
    "financialRecordIds",
    "metricDefinitionIds",
)
SCORE_BY_STATUS = {"complete": 2, "partial": 1, "missing": 0}
PRIORITY_ORDER = {"P1": 0, "P2": 1, "P3": 2}
FINANCIAL_REQUIRED_FIELDS = (
    "periodLabel",
    "endDate",
    "periodType",
    "currency",
    "unit",
    "accountingBasis",
    "sourceId",
)
NON_PRIMARY_SOURCE_TYPES = {"official-gazette-transcription"}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def stable_ids(values: Iterable[str]) -> list[str]:
    return sorted(set(values))


def has_content(value: Any) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(has_content(item) for item in value)
    return value is not None


def has_structured_locator(locator: Any) -> bool:
    return isinstance(locator, dict) and any(
        key in LOCATOR_FIELDS and has_content(value) for key, value in locator.items()
    )


def is_primary_source(source: dict[str, Any] | None) -> bool:
    if not source:
        return False
    source_type = source.get("sourceType")
    if not isinstance(source_type, str) or source_type in NON_PRIMARY_SOURCE_TYPES:
        return False
    accepted = (
        source_type in {"annual-report", "exchange-filing"}
        or source_type.startswith("official-")
        or source_type.startswith("company-")
        or source_type.startswith("parent-company-")
        or source_type.startswith("sec-")
        or source_type.startswith("edinet-")
        or source_type.startswith("tdnet-")
        or source_type.startswith("krx-")
        or source_type.startswith("hkex-")
    )
    return bool(
        accepted
        and has_content(source.get("publisher"))
        and has_content(source.get("title"))
        and has_content(source.get("url"))
    )


def grounding_snapshot(grounding: dict[str, list[str]]) -> dict[str, list[str]]:
    return {key: list(grounding[key]) for key in GROUNDING_KEYS}


def evidence_minimum_assessment(
    axis: str,
    grounding: dict[str, list[str]],
    errors: list[str],
) -> tuple[bool, str, list[str], str]:
    claim_count = len(grounding["claimIds"])
    relation_count = len(grounding["relationIds"])
    if axis in {"what", "risks"}:
        usable = claim_count > 0
    else:
        usable = claim_count > 0 or relation_count > 0

    paths: list[str] = []
    if claim_count:
        paths.append("company-evidence-claim")
    if relation_count:
        paths.append("relation")
    display_path = "+".join(paths) if paths else "unresolved"

    if usable:
        reason = (
            f"{AXIS_LABELS[axis]}専用の既存Evidence-backed Claim {claim_count}件"
            + (f"とRelation {relation_count}件" if relation_count else "")
            + "をBinding、structured Locator、Shared Sourceまで解決できる。"
            "legacy proseや一般的な会社説明からの推測は使用しない。"
        )
        return True, reason, [], display_path

    blocking = sorted(
        set(
            errors
            or [
                f"{AXIS_LABELS[axis]}を直接説明する既存Claim／Relationの解決可能なgroundingがない"
            ]
        )
    )
    reason = (
        f"{AXIS_LABELS[axis]}の最低表示条件を既存Claim／RelationとEvidence chainだけでは満たせない。"
    )
    return False, reason, blocking, display_path


def priority_sort_key(claim: dict[str, Any]) -> tuple[int, str]:
    return PRIORITY_ORDER.get(claim.get("priority"), 99), claim.get("id", "")


def select_axis_claims(
    company_id: str,
    axis: str,
    context: dict[str, Any],
) -> list[dict[str, Any]]:
    categories = AXIS_CATEGORIES[axis]
    candidates = [
        claim
        for claim in context["claims"].values()
        if claim.get("companyId") == company_id and claim.get("category") in categories
    ]
    p1 = sorted((claim for claim in candidates if claim.get("priority") == "P1"), key=priority_sort_key)
    if axis not in {"competitivePosition", "risks"}:
        return p1
    eligible_p2 = [
        claim
        for claim in candidates
        if claim.get("priority") == "P2"
        and isinstance(claim.get("asOf"), str)
        and bool(claim["asOf"])
    ]
    eligible_p2.sort(
        key=lambda claim: (-int(claim["asOf"].replace("-", "")), claim["id"])
    )
    return [*p1, *eligible_p2[:1]]


def add_unique(
    target: dict[str, dict[str, Any]],
    record: dict[str, Any],
    id_field: str,
    label: str,
    *,
    allow_identical_duplicate: bool = False,
) -> None:
    record_id = record.get(id_field)
    if not isinstance(record_id, str) or not record_id:
        raise ValueError(f"{label} has no non-empty {id_field}")
    previous = target.get(record_id)
    if previous is None:
        target[record_id] = record
        return
    if allow_identical_duplicate and previous == record:
        return
    raise ValueError(f"duplicate or conflicting {label} ID: {record_id}")


def source_paths() -> list[Path]:
    manifest_path = DATA / "source-registry-manifest.json"
    manifest = load_json(manifest_path)
    return [manifest_path, *(DATA / shard for shard in manifest["shards"])]


def evidence_paths() -> list[Path]:
    manifest_path = DATA / "company-evidence-manifest.json"
    manifest = load_json(manifest_path)
    return [manifest_path, *(DATA / shard for shard in manifest["shards"])]


def financial_paths() -> list[Path]:
    return [
        DATA / "financial-history.json",
        *sorted(DATA.glob("financial-history-v04-batch*.json")),
        DATA / "financial-history-v04-cashflow-overrides.json",
        DATA / "financial-metric-definitions-v04.json",
    ]


def audited_input_paths() -> list[Path]:
    paths = [
        *sorted((DATA / "companies").glob("*.json")),
        *evidence_paths(),
        *source_paths(),
        DATA / "relationships.json",
        DATA / "relation-evidence-bindings-v01.json",
        DATA / "product-registry-v01.json",
        DATA / "technology-registry-v01.json",
        DATA / "market-registry-v01.json",
        DATA / "value-chain.json",
        DATA / "company-compare-evidence-pilot-v01.json",
        *financial_paths(),
        ROOT / "scripts" / "fixtures" / "company-compare-japanese-display-v01.json",
        ROOT / "scripts" / "fixtures" / "company-compare-evidence-ui-snapshot-v01.json",
        ROOT / "scripts" / "fixtures" / "company-compare-artifact-size-baseline-v01.json",
        DOCS / "company-evidence-coverage-audit-v01.json",
        DOCS / "company-evidence-gap-triage-v02.json",
        DOCS / "company-evidence-triage-validation-v02.json",
        DOCS / "company-evidence-v1-coverage-close.md",
        DOCS / "company-compare-human-ux-review-v01.md",
    ]
    return sorted(set(paths), key=lambda path: path.relative_to(ROOT).as_posix())


def input_digest(paths: Iterable[Path]) -> str:
    digest = hashlib.sha256()
    for path in paths:
        relative = path.relative_to(ROOT).as_posix().encode("utf-8")
        digest.update(relative)
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return f"sha256:{digest.hexdigest()}"


def load_sources() -> dict[str, dict[str, Any]]:
    sources: dict[str, dict[str, Any]] = {}
    manifest = load_json(DATA / "source-registry-manifest.json")
    for shard in manifest["shards"]:
        records = load_json(DATA / shard)
        if not isinstance(records, list):
            raise ValueError(f"Source shard must be an array: {shard}")
        for record in records:
            source_id = record.get("id")
            if not isinstance(source_id, str) or not source_id:
                raise ValueError("Shared Source has no non-empty id")
            previous = sources.get(source_id)
            if previous and (
                previous.get("url") != record.get("url")
                or previous.get("companyId") != record.get("companyId")
            ):
                raise ValueError(f"conflicting Shared Source identity: {source_id}")
            # Match the production resolver: compatible later shards supply the
            # canonical metadata, while URL/company identity conflicts fail.
            sources[source_id] = record
    return sources


def load_company_evidence() -> tuple[
    dict[str, dict[str, Any]],
    dict[str, dict[str, Any]],
    dict[tuple[str, str], dict[str, Any]],
]:
    claims: dict[str, dict[str, Any]] = {}
    bindings: dict[str, dict[str, Any]] = {}
    coverage: dict[tuple[str, str], dict[str, Any]] = {}
    manifest = load_json(DATA / "company-evidence-manifest.json")
    for shard in manifest["shards"]:
        payload = load_json(DATA / shard)
        for record in payload.get("claims", []):
            add_unique(claims, record, "id", "Company Evidence Claim")
        for record in payload.get("evidence", []):
            add_unique(bindings, record, "id", "Company Evidence Binding")
        for record in payload.get("coverage", []):
            key = (record.get("companyId"), record.get("category"))
            if key in coverage:
                raise ValueError(f"duplicate Coverage record: {key[0]}:{key[1]}")
            coverage[key] = record
    return claims, bindings, coverage


def load_registry(path: Path, entity_type: str) -> dict[str, dict[str, Any]]:
    payload = load_json(path)
    records: dict[str, dict[str, Any]] = {}
    for record in payload.get("records", []):
        if record.get("entityType") != entity_type:
            raise ValueError(f"{path.name}: unexpected entityType for {record.get('id')}")
        add_unique(records, record, "id", f"{entity_type} registry entity")
    return records


def load_financial_history() -> dict[str, dict[str, Any]]:
    paths = [DATA / "financial-history.json", *sorted(DATA.glob("financial-history-v04-batch*.json"))]
    records: dict[str, dict[str, Any]] = {}
    for path in paths:
        for record in load_json(path):
            add_unique(records, record, "id", "Financial history record")
    overrides = {
        record["id"]: record
        for record in load_json(DATA / "financial-history-v04-cashflow-overrides.json")
    }
    unknown_overrides = sorted(set(overrides) - set(records))
    if unknown_overrides:
        raise ValueError(f"unknown Financial override IDs: {', '.join(unknown_overrides)}")
    for record_id, override in overrides.items():
        original = records[record_id]
        merged = {**original, **override}
        merged["metrics"] = {**original.get("metrics", {}), **override.get("metrics", {})}
        records[record_id] = merged
    return records


def load_context() -> dict[str, Any]:
    companies: dict[str, dict[str, Any]] = {}
    for path in sorted((DATA / "companies").glob("*.json")):
        record = load_json(path)
        add_unique(companies, record, "id", "Company")

    claims, company_bindings, coverage = load_company_evidence()
    sources = load_sources()
    relations: dict[str, dict[str, Any]] = {}
    for record in load_json(DATA / "relationships.json"):
        add_unique(relations, record, "relationId", "Relation")
    relation_bindings: dict[str, dict[str, Any]] = {}
    for record in load_json(DATA / "relation-evidence-bindings-v01.json"):
        add_unique(relation_bindings, record, "id", "Relation Evidence Binding")

    product_registry = load_registry(DATA / "product-registry-v01.json", "product")
    technology_registry = load_registry(DATA / "technology-registry-v01.json", "technology")
    market_registry = load_registry(DATA / "market-registry-v01.json", "market")
    registries = {**product_registry, **technology_registry, **market_registry}
    if len(registries) != len(product_registry) + len(technology_registry) + len(market_registry):
        raise ValueError("cross-registry entity ID collision")

    value_chain = load_json(DATA / "value-chain.json")
    value_chain_nodes = {record["id"] for record in value_chain}
    financial_records = load_financial_history()
    metric_definitions = {
        record["id"]: record for record in load_json(DATA / "financial-metric-definitions-v04.json")
    }
    projection = load_json(DATA / "company-compare-evidence-pilot-v01.json")
    display_fixture = load_json(
        ROOT / "scripts" / "fixtures" / "company-compare-japanese-display-v01.json"
    )

    context = {
        "companies": companies,
        "claims": claims,
        "companyBindings": company_bindings,
        "coverage": coverage,
        "sources": sources,
        "relations": relations,
        "relationBindings": relation_bindings,
        "productRegistry": product_registry,
        "technologyRegistry": technology_registry,
        "marketRegistry": market_registry,
        "registries": registries,
        "valueChainNodes": value_chain_nodes,
        "financialRecords": financial_records,
        "metricDefinitions": metric_definitions,
        "projection": projection,
        "displayFixture": display_fixture,
    }
    validate_fixed_baseline(context)
    return context


def projection_priority_counts(context: dict[str, Any]) -> Counter[str]:
    counts: Counter[str] = Counter()
    claims = context["claims"]
    for set_record in context["projection"].get("sets", []):
        for company in set_record.get("companies", []):
            for dimension in company.get("dimensions", []):
                for claim_id in dimension.get("initialClaimIds", []):
                    if claim_id not in claims:
                        raise ValueError(f"Projection references unknown Claim: {claim_id}")
                    counts[claims[claim_id].get("priority")] += 1
    return counts


def validate_fixed_baseline(context: dict[str, Any]) -> None:
    if len(context["companies"]) != EXPECTED_COMPANY_COUNT:
        raise ValueError(f"canonical Company count is {len(context['companies'])}, expected 100")
    if len(context["relations"]) != EXPECTED_RELATIONS:
        raise ValueError(f"Relation count is {len(context['relations'])}, expected 17")
    if len(context["relationBindings"]) != EXPECTED_RELATION_BINDINGS:
        raise ValueError(
            f"Relation Evidence Binding count is {len(context['relationBindings'])}, expected 17"
        )
    actual_registry_counts = {
        "product": len(context["productRegistry"]),
        "technology": len(context["technologyRegistry"]),
        "market": len(context["marketRegistry"]),
    }
    if actual_registry_counts != EXPECTED_REGISTRY_COUNTS:
        raise ValueError(f"Registry counts differ: {actual_registry_counts}")

    coverage_counts = Counter(record.get("collectionStatus") for record in context["coverage"].values())
    actual_coverage = {key: coverage_counts[key] for key in EXPECTED_COVERAGE}
    if actual_coverage != EXPECTED_COVERAGE:
        raise ValueError(f"Company Evidence Coverage differs: {actual_coverage}")
    if len(context["coverage"]) != EXPECTED_COMPANY_COUNT * 11:
        raise ValueError("Company Evidence Coverage does not contain 100 x 11 unique records")

    coverage_audit = load_json(DOCS / "company-evidence-coverage-audit-v01.json")
    maturity = coverage_audit.get("summary", {}).get("maturity", {})
    if coverage_audit.get("companyCount") != 100 or maturity.get("L4") != 100:
        raise ValueError("Company Evidence L4 baseline is not 100/100")
    if coverage_audit.get("summary", {}).get("coverage") != EXPECTED_COVERAGE:
        raise ValueError("Coverage Audit summary differs from canonical Coverage records")

    triage = load_json(DOCS / "company-evidence-gap-triage-v02.json")
    triage_current = triage.get("currentDistribution", {})
    if triage_current.get("ACTIONABLE") != 0 or triage_current.get("REVIEW_REQUIRED") != 0:
        raise ValueError("Gap Triage ACTIONABLE/REVIEW_REQUIRED is not 0/0")
    validation = load_json(DOCS / "company-evidence-triage-validation-v02.json")
    if (
        validation.get("sampleCount") != EXPECTED_TRIAGE_SAMPLE
        or validation.get("summary", {}).get("exactMatches") != EXPECTED_TRIAGE_SAMPLE
        or validation.get("finalDecision") != "PASS"
    ):
        raise ValueError("Triage Validation v0.2 is not 87/87 PASS")
    close_text = (DOCS / "company-evidence-v1-coverage-close.md").read_text(encoding="utf-8")
    if "Company Evidence v1 Coverage Close = YES" not in close_text:
        raise ValueError("Company Evidence v1 Coverage Close is not YES")

    priority_counts = projection_priority_counts(context)
    actual_projection = {key: priority_counts[key] for key in EXPECTED_PROJECTION}
    if actual_projection != EXPECTED_PROJECTION:
        raise ValueError(f"Projection P1/P2/P3 differs: {actual_projection}")
    pilot_ids = context["projection"].get("pilotCompanyIds")
    if set(pilot_ids or []) != PILOT_COMPANY_IDS or len(pilot_ids or []) != 5:
        raise ValueError("Company Compare Pilot Company IDs differ from the frozen five")
    display_ids = set(context["displayFixture"].get("companyDisplayNames", {}))
    if display_ids != PILOT_COMPANY_IDS:
        raise ValueError("Japanese Compare display fixture differs from the frozen Pilot five")
    snapshot = load_json(
        ROOT / "scripts" / "fixtures" / "company-compare-evidence-ui-snapshot-v01.json"
    )
    if snapshot.get("markerCount") != EXPECTED_MARKERS:
        raise ValueError("Company Compare marker count is not 53")
    size_baseline = load_json(
        ROOT / "scripts" / "fixtures" / "company-compare-artifact-size-baseline-v01.json"
    )
    if size_baseline.get("acceptedReason") != "Company Compare Pilot UI v0.1 Freeze":
        raise ValueError("Company Compare Pilot UI v0.1 Freeze is not the accepted baseline")


def empty_grounding() -> dict[str, list[str]]:
    return {key: [] for key in GROUNDING_KEYS}


def merge_grounding(*items: dict[str, list[str]]) -> dict[str, list[str]]:
    return {
        key: stable_ids(value for item in items for value in item.get(key, []))
        for key in GROUNDING_KEYS
    }


def coverage_state(record: dict[str, Any]) -> str:
    status = record.get("collectionStatus")
    if status == "complete":
        return "complete"
    if status == "partial":
        return "partial"
    if status == "not-started" and record.get("missingStatus") == "not-applicable":
        return "notApplicable"
    return "missing"


def relation_applies_to_company(relation: dict[str, Any], company_id: str, axis: str) -> bool:
    if relation.get("relationType") not in AXIS_RELATION_TYPES[axis]:
        return False
    if axis in {"aiRole", "products"}:
        return relation.get("subjectType") == "company" and relation.get("subjectId") == company_id
    return any(
        endpoint_type == "company" and endpoint_id == company_id
        for endpoint_type, endpoint_id in (
            (relation.get("subjectType"), relation.get("subjectId")),
            (relation.get("objectType"), relation.get("objectId")),
        )
    )


def relation_grounding(
    company_id: str,
    axis: str,
    context: dict[str, Any],
) -> tuple[dict[str, list[str]], list[str]]:
    grounding = empty_grounding()
    errors: list[str] = []
    for relation in sorted(context["relations"].values(), key=lambda item: item["relationId"]):
        if not relation_applies_to_company(relation, company_id, axis):
            continue
        relation_id = relation["relationId"]
        supports = sorted(
            (
                binding
                for binding in context["relationBindings"].values()
                if binding.get("relationId") == relation_id and binding.get("support") == "supports"
            ),
            key=lambda item: item["id"],
        )
        valid_supports = [
            binding
            for binding in supports
            if binding.get("sourceId") in context["sources"]
            and has_structured_locator(binding.get("locator"))
        ]
        if not valid_supports:
            errors.append(f"{relation_id}に解決可能なsupports Binding／Locator／Sourceがない")
            continue
        grounding["relationIds"].append(relation_id)
        grounding["relationEvidenceBindingIds"].extend(binding["id"] for binding in valid_supports)
        grounding["sourceIds"].extend(binding["sourceId"] for binding in valid_supports)
        scope = relation.get("scope") or {}
        grounding["registryEntityIds"].extend(scope.get("productIds") or [])
        grounding["registryEntityIds"].extend(scope.get("technologyIds") or [])
        grounding["registryEntityIds"].extend(scope.get("marketIds") or [])
        grounding["valueChainNodeIds"].extend(scope.get("valueChainNodeIds") or [])
        for endpoint_type, endpoint_id in (
            (relation.get("subjectType"), relation.get("subjectId")),
            (relation.get("objectType"), relation.get("objectId")),
        ):
            if endpoint_type in {"product", "technology", "market"}:
                grounding["registryEntityIds"].append(endpoint_id)
            elif endpoint_type == "valueChainNode":
                grounding["valueChainNodeIds"].append(endpoint_id)
    return merge_grounding(grounding), errors


def evidence_axis(company_id: str, axis: str, context: dict[str, Any]) -> dict[str, Any]:
    categories = AXIS_CATEGORIES[axis]
    coverage_records = [context["coverage"].get((company_id, category)) for category in categories]
    missing_records = [category for category, record in zip(categories, coverage_records) if record is None]
    claims = select_axis_claims(company_id, axis, context)
    grounding = empty_grounding()
    claim_errors: list[str] = []
    valid_claim_count = 0
    for claim in claims:
        claim_id = claim["id"]
        supports: list[dict[str, Any]] = []
        for binding_id in claim.get("evidenceIds", []):
            binding = context["companyBindings"].get(binding_id)
            if (
                binding
                and binding.get("claimId") == claim_id
                and binding.get("support") in {"supports", "context"}
                and binding.get("sourceId") in context["sources"]
                and has_structured_locator(binding.get("locator"))
            ):
                supports.append(binding)
        if not supports:
            claim_errors.append(f"{claim_id}に解決可能なsupports/context Binding／Locator／Sourceがない")
            continue
        valid_claim_count += 1
        grounding["claimIds"].append(claim_id)
        grounding["companyEvidenceBindingIds"].extend(binding["id"] for binding in supports)
        grounding["sourceIds"].extend(binding["sourceId"] for binding in supports)

    related, relation_errors = relation_grounding(company_id, axis, context)
    grounding = merge_grounding(grounding, related)
    errors = [*missing_records, *claim_errors, *relation_errors]
    states = [coverage_state(record) for record in coverage_records if record is not None]
    if missing_records or claim_errors or relation_errors or valid_claim_count == 0:
        status = "missing"
    elif states and all(state == "notApplicable" for state in states):
        status = "notApplicable"
    elif states and all(state == "complete" for state in states):
        status = "complete"
    elif any(state in {"complete", "partial"} for state in states):
        status = "partial"
    else:
        status = "missing"

    missing_content: list[str] = []
    for category, record in zip(categories, coverage_records):
        if record is None:
            missing_content.append(f"{category}のCoverage record")
            continue
        state = coverage_state(record)
        if state == "partial":
            missing_content.append(f"{category}のCoverageはpartialで、主要範囲を超える補足は未完了")
        elif state == "missing":
            missing_content.append(
                f"{category}は{record.get('missingStatus') or 'not-started'}のため表示根拠が未収録"
            )
    missing_content.extend(claim_errors)
    missing_content.extend(relation_errors)
    missing_content = sorted(set(missing_content))

    if status == "complete":
        reason = (
            f"{', '.join(categories)}のCoverageがcompleteで、既存Claim {valid_claim_count}件を"
            "structured Locator付きsupports/context BindingとShared Sourceへ解決できる。"
        )
    elif status == "partial":
        reason = (
            f"{', '.join(categories)}の主要内容は既存Claim {valid_claim_count}件と"
            "structured Locator付きsupports/context Bindingで説明できるが、Coverageにpartialを含む。"
        )
    elif status == "notApplicable":
        reason = f"{', '.join(categories)}は既存Coverageでnot-applicableと記録されている。"
    else:
        reason = (
            f"{', '.join(categories)}を既存Claim／supports Binding／structured Locator／"
            "Shared Sourceだけでは安全に表示できない。"
        )

    minimum_usable, minimum_reason, blocking_gaps, display_path = evidence_minimum_assessment(
        axis,
        grounding,
        errors,
    )
    priority_counts = Counter(claim.get("priority") for claim in claims if claim["id"] in grounding["claimIds"])
    return {
        "status": status,
        "reason": reason,
        **grounding,
        "groundingIds": grounding_snapshot(grounding),
        "minimumUsable": minimum_usable,
        "minimumUsableReason": minimum_reason,
        "blockingGaps": blocking_gaps,
        "displayPath": display_path,
        "claimPriorityCounts": {key: priority_counts[key] for key in ("P1", "P2", "P3")},
        "missingContent": missing_content,
        "legacyProseUsed": False,
        "inferenceUsed": False,
    }


def usable_metric(record: dict[str, Any], metric_id: str) -> bool:
    metric = record.get("metrics", {}).get(metric_id, {})
    return (
        metric.get("value") is not None
        and metric.get("status") in {"verified", "source-linked"}
        and isinstance(metric.get("basis"), str)
        and bool(metric["basis"].strip())
    )


def financial_record_minimum_gaps(
    record: dict[str, Any],
    context: dict[str, Any],
) -> list[str]:
    gaps = [field for field in FINANCIAL_REQUIRED_FIELDS if not has_content(record.get(field))]
    if not usable_metric(record, "revenue"):
        gaps.append("revenue metric／basis")
    if not usable_metric(record, "operatingMargin"):
        gaps.append("operatingMargin metric／basis")
    source = context["sources"].get(record.get("sourceId"))
    if not is_primary_source(source):
        gaps.append("一次資料として確認できるShared Source")
    return sorted(set(gaps))


def financial_axis(company_id: str, context: dict[str, Any]) -> dict[str, Any]:
    company_records = [
        record
        for record in context["financialRecords"].values()
        if record.get("companyId") == company_id
        and record.get("sourceId") in context["sources"]
        and usable_metric(record, "revenue")
    ]
    by_period_type: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in company_records:
        by_period_type[record.get("periodType", "")].append(record)
    for records in by_period_type.values():
        records.sort(key=lambda item: (item.get("endDate", ""), item["id"]), reverse=True)

    selected: list[dict[str, Any]] = []
    for period_type in ("quarterly", "annual"):
        candidates = by_period_type.get(period_type, [])
        if len(candidates) >= 2 and usable_metric(candidates[0], "operatingMargin"):
            selected = candidates[:2]
            break
    if not selected:
        for period_type in sorted(by_period_type):
            candidates = by_period_type[period_type]
            if len(candidates) >= 2 and usable_metric(candidates[0], "operatingMargin"):
                selected = candidates[:2]
                break

    grounding = empty_grounding()
    grounding["financialRecordIds"] = stable_ids(record["id"] for record in selected)
    grounding["sourceIds"] = stable_ids(record["sourceId"] for record in selected)
    grounding["metricDefinitionIds"] = [
        metric_id for metric_id in ("operatingMargin", "revenue") if metric_id in context["metricDefinitions"]
    ]
    grounding = merge_grounding(grounding)
    revenue_growth_defined = "revenueGrowth" in context["metricDefinitions"]
    minimum_records = [
        record for record in selected if not financial_record_minimum_gaps(record, context)
    ]
    minimum_usable = bool(minimum_records)
    if minimum_usable:
        minimum_reason = (
            f"正規化Financial historyの{len(minimum_records)}期間で、期間、通貨、単位、会計基準、"
            "Operating Margin、revenue、一次Shared Sourceを解決できる。"
            "会社単位の最低表示は可能で、集合単位のdefinition／period／basis互換性は表示時に再判定する。"
        )
        blocking_gaps: list[str] = []
    else:
        per_record_gaps = [
            f"{record['id']}: {', '.join(financial_record_minimum_gaps(record, context))}"
            for record in selected
            if financial_record_minimum_gaps(record, context)
        ]
        blocking_gaps = per_record_gaps or [
            "期間、通貨、単位、会計基準、Operating Margin、revenue、一次資料が揃うFinancial recordがない"
        ]
        minimum_reason = "会社単位のFinancial最低表示条件を満たす既存正規化recordがない。"

    missing_content: list[str] = []
    if not selected:
        status = "missing"
        reason = (
            "同一periodTypeの売上高2期と最新Operating Marginを、既存Financial recordと"
            "Shared Sourceへ解決できない。"
        )
        missing_content.append("比較可能な同一periodTypeの売上高2期とOperating Margin")
    elif not revenue_growth_defined:
        status = "partial"
        reason = (
            "正規化済みOperating Marginと同一periodTypeの売上高2期をShared Sourceへ解決できる。"
            "Revenue Growthの正規化指標定義は未収録で、比較集合ごとのperiod／basis判定も必要なためpartial。"
        )
        missing_content.extend(
            [
                "Revenue Growthの正規化指標定義",
                "比較集合ごとのperiod／basis適合判定",
            ]
        )
    else:
        status = "partial"
        reason = (
            "必要な正規化Financial recordは存在するが、比較集合ごとのperiod／basis適合判定が必要。"
        )
        missing_content.append("比較集合ごとのperiod／basis適合判定")

    return {
        "status": status,
        "reason": reason,
        **grounding,
        "groundingIds": grounding_snapshot(grounding),
        "minimumUsable": minimum_usable,
        "minimumUsableReason": minimum_reason,
        "blockingGaps": blocking_gaps,
        "displayPath": "normalized-financial-history" if minimum_usable else "unresolved",
        "minimumFinancialRecordIds": stable_ids(record["id"] for record in minimum_records),
        "companyLevelReadiness": "ready" if minimum_usable else "hold",
        "setLevelCompatibility": {
            "required": True,
            "status": "not-evaluated-at-company-level",
            "checks": ["metricDefinition", "periodType", "period", "basis"],
        },
        "claimPriorityCounts": {"P1": 0, "P2": 0, "P3": 0},
        "missingContent": missing_content,
        "legacyProseUsed": False,
        "inferenceUsed": False,
    }


def score_axes(axes: dict[str, dict[str, Any]]) -> tuple[int, int, float]:
    earned = sum(SCORE_BY_STATUS.get(axis["status"], 0) for axis in axes.values())
    applicable = sum(axis["status"] != "notApplicable" for axis in axes.values())
    maximum = applicable * 2
    percent = round((earned / maximum * 100) if maximum else 100.0, 1)
    return earned, maximum, percent


def structure_assessment(
    company_id: str,
    axes: dict[str, dict[str, Any]],
    context: dict[str, Any],
) -> dict[str, Any]:
    registry_ids = {
        registry_id
        for axis in axes.values()
        for registry_id in axis["registryEntityIds"]
    }
    registry_gaps = sorted(registry_ids - set(context["registries"]))

    projected_relation_ids: set[str] = set()
    projection_record_exists = False
    for set_record in context["projection"].get("sets", []):
        for company in set_record.get("companies", []):
            if company.get("companyId") != company_id:
                continue
            projection_record_exists = True
            projected_relation_ids.update(
                relation_id
                for dimension in company.get("dimensions", [])
                for relation_id in dimension.get("initialRelationIds", [])
            )
    relation_gaps = sorted(projected_relation_ids - set(context["relations"]))
    products_path = axes["products"]["displayPath"]
    claim_backed_axes = [axis for axis in AXES if axes[axis]["claimIds"]]
    relation_backed_axes = [axis for axis in AXES if axes[axis]["relationIds"]]
    if registry_gaps:
        reason = "既存の構造化表示が参照するcanonical Registry entityを解決できない。"
    elif relation_gaps:
        reason = "既存Projectionが要求するRelationを解決できない。"
    elif projection_record_exists:
        reason = "Frozen Pilot Projectionが要求するRegistry／Relation参照はすべて解決する。"
    else:
        reason = (
            "製品・役割・競争力を含む最低表示は既存Evidence-backed Claimのstatementを直接投影できる。"
            "会社別P1表示ではentityの横断集計・重複排除や新しい関係主張を行わないため、"
            "Registry／Relation追加を要求しない。未登録IDは推測していない。"
        )
    return {
        "registryRequired": bool(registry_gaps),
        "relationRequired": bool(relation_gaps),
        "unresolvedRegistryEntityIds": registry_gaps,
        "unresolvedRelationIds": relation_gaps,
        "productDisplayPath": products_path,
        "claimBackedAxes": claim_backed_axes,
        "relationBackedAxes": relation_backed_axes,
        "registryRequirementReason": (
            "既存Product Claimを会社別P1 copyへ直接投影し、entity横断の集計・roll-up・重複排除をしないため不要。"
            if not registry_gaps and axes["products"]["minimumUsable"]
            else reason
        ),
        "relationRequirementReason": (
            "AI role、Products、Competitive Positionは既存Evidence-backed Claimから直接表示でき、"
            "新しいCompany間・Company→entity関係を主張しないため不要。"
            if not relation_gaps
            and all(axes[axis]["minimumUsable"] for axis in ("aiRole", "products", "competitivePosition"))
            else reason
        ),
        "reason": reason,
        "inferenceUsed": False,
    }


def build_record(company_id: str, context: dict[str, Any]) -> dict[str, Any]:
    company = context["companies"][company_id]
    axes = {
        axis: (
            financial_axis(company_id, context)
            if axis == "financialComparability"
            else evidence_axis(company_id, axis, context)
        )
        for axis in AXES
    }
    score, maximum, percent = score_axes(axes)
    grounding = merge_grounding(*(axes[axis] for axis in AXES))
    structure = structure_assessment(company_id, axes, context)

    required_actions: list[dict[str, Any]] = []
    blocking_axes = [axis for axis in AXES if not axes[axis]["minimumUsable"]]
    if blocking_axes:
        for axis in blocking_axes:
            required_actions.append(
                {
                    "actionType": "RESOLVE_EVIDENCE_GAP",
                    "axis": axis,
                    "reason": axes[axis]["minimumUsableReason"],
                    "blockingGaps": axes[axis]["blockingGaps"],
                }
            )
        readiness = "EVIDENCE_HOLD"
    elif structure["registryRequired"]:
        required_actions.append(
            {
                "actionType": "EXPAND_REGISTRY",
                "axis": "structure",
                "reason": "表示に必要なcanonical Registry entityをbounded reviewで解決する。",
                "ids": structure["unresolvedRegistryEntityIds"],
            }
        )
        readiness = "REGISTRY_REQUIRED"
    elif structure["relationRequired"]:
        required_actions.append(
            {
                "actionType": "AUTHOR_RELATION",
                "axis": "structure",
                "reason": "表示に必要なRelationとdirect Evidence Bindingをbounded reviewで解決する。",
                "ids": structure["unresolvedRelationIds"],
            }
        )
        readiness = "RELATION_REQUIRED"
    elif company_id in PILOT_COMPANY_IDS:
        readiness = "READY_EXISTING_EVIDENCE"
    else:
        required_actions.append(
            {
                "actionType": "AUTHOR_COMPARE_DISPLAY_COPY",
                "axis": "all",
                "reason": "既存Claimを改変せず、Compare専用の短い日本語表示文を編集レビューする。",
            }
        )
        readiness = "DISPLAY_COPY_ONLY"

    relation_value_chain_ids = stable_ids(
        node_id
        for axis in axes.values()
        for node_id in axis["valueChainNodeIds"]
    )
    manual_notes = [
        "partial軸は主要内容を表示できるが、Coverage上の未完了範囲をcompleteとして扱わない。",
        "Financialは集合ごとの互換性判定を再実行し、比較不能を理由付きで表示する。",
        "未登録Product／Technology／Relationは推測せず、既存Claimをstatementのまま投影する。",
    ]
    if readiness == "DISPLAY_COPY_ONLY":
        manual_notes.append("Compare専用日本語copyは人間の編集レビュー後に確定する。")

    return {
        "companyId": company_id,
        "canonicalName": company.get("name"),
        "japaneseDisplayName": company.get("japaneseName"),
        "valueChainClassification": {
            "primaryLayer": company.get("primaryLayer"),
            "layers": company.get("layers", []),
            "resolvedValueChainNodeIds": relation_value_chain_ids,
        },
        "readinessClass": readiness,
        "requiredActions": required_actions,
        "structureAssessment": structure,
        "axes": axes,
        "score": score,
        "maximumScore": maximum,
        "coveragePercent": percent,
        "groundingIds": grounding,
        "manualReviewNotes": manual_notes,
    }


def eligible_for_first_batch(record: dict[str, Any]) -> bool:
    return bool(
        record["companyId"] not in PILOT_COMPANY_IDS
        and record["readinessClass"] in READY_CLASSES
        and all(axis["minimumUsable"] for axis in record["axes"].values())
        and not any(
            action["actionType"] in {"RESOLVE_EVIDENCE_GAP", "EXPAND_REGISTRY", "AUTHOR_RELATION"}
            for action in record["requiredActions"]
        )
    )


def recommended_first_batch(records: list[dict[str, Any]]) -> dict[str, Any]:
    records_by_id = {record["companyId"]: record for record in records}
    selected = [
        records_by_id[company_id]
        for company_id in FIRST_BATCH_REVIEW_IDS
        if eligible_for_first_batch(records_by_id[company_id])
    ]

    company_ids = [record["companyId"] for record in selected]
    distribution = Counter(record["valueChainClassification"]["primaryLayer"] for record in selected)
    return {
        "selectionMethod": (
            "Recheck the fixed 15-company acceptance-review list without replacement; retain only non-Pilot "
            "READY_EXISTING_EVIDENCE or DISPLAY_COPY_ONLY records whose six axes are minimumUsable=true and "
            "which require no Evidence, Registry, or Relation action."
        ),
        "targetSize": len(FIRST_BATCH_REVIEW_IDS),
        "companyIds": company_ids,
        "excludedCompanyIds": [
            company_id for company_id in FIRST_BATCH_REVIEW_IDS if company_id not in company_ids
        ],
        "valueChainDistribution": dict(sorted(distribution.items())),
    }


def major_grounding(axis: dict[str, Any]) -> dict[str, list[str]]:
    return {
        "claimIds": axis["claimIds"][:2],
        "relationIds": axis["relationIds"][:2],
        "bindingIds": stable_ids(
            [*axis["companyEvidenceBindingIds"], *axis["relationEvidenceBindingIds"]]
        )[:2],
        "financialRecordIds": axis["financialRecordIds"][:2],
        "sourceIds": axis["sourceIds"][:2],
    }


def first_batch_acceptance_review(
    records: list[dict[str, Any]],
    batch: dict[str, Any],
) -> list[dict[str, Any]]:
    records_by_id = {record["companyId"]: record for record in records}
    retained_ids = set(batch["companyIds"])
    reviews: list[dict[str, Any]] = []
    for company_id in FIRST_BATCH_REVIEW_IDS:
        record = records_by_id[company_id]
        financial = record["axes"]["financialComparability"]
        retained = company_id in retained_ids
        reviews.append(
            {
                "companyId": company_id,
                "readinessClass": record["readinessClass"],
                "axes": {
                    axis: {
                        "status": record["axes"][axis]["status"],
                        "minimumUsable": record["axes"][axis]["minimumUsable"],
                        "majorGroundingIds": major_grounding(record["axes"][axis]),
                    }
                    for axis in AXES
                },
                "registryRequirement": {
                    "required": record["structureAssessment"]["registryRequired"],
                    "reason": record["structureAssessment"]["registryRequirementReason"],
                },
                "relationRequirement": {
                    "required": record["structureAssessment"]["relationRequired"],
                    "reason": record["structureAssessment"]["relationRequirementReason"],
                },
                "financialCompanyLevel": {
                    "status": financial["companyLevelReadiness"],
                    "reason": financial["minimumUsableReason"],
                    "minimumFinancialRecordIds": financial["minimumFinancialRecordIds"],
                },
                "financialSetLevel": financial["setLevelCompatibility"],
                "retainedInFirstBatch": retained,
                "exclusionReason": None
                if retained
                else "6軸minimumUsableまたはEvidence／Registry／Relation action条件を満たさない。",
            }
        )
    return reviews


def build_artifact() -> tuple[dict[str, Any], dict[str, Any]]:
    context = load_context()
    records = [build_record(company_id, context) for company_id in sorted(context["companies"])]
    classifications = Counter(record["readinessClass"] for record in records)
    axis_summary = {
        axis: {
            status: sum(record["axes"][axis]["status"] == status for record in records)
            for status in STATUSES
        }
        for axis in AXES
    }
    minimum_summary = {
        axis: {
            "true": sum(record["axes"][axis]["minimumUsable"] is True for record in records),
            "false": sum(record["axes"][axis]["minimumUsable"] is False for record in records),
        }
        for axis in AXES
    }
    common_gaps = Counter(
        item
        for record in records
        for axis in AXES
        for item in record["axes"][axis]["missingContent"]
    )
    batch = recommended_first_batch(records)
    display_copy_records = [
        record for record in records if record["readinessClass"] == "DISPLAY_COPY_ONLY"
    ]
    display_copy_proof = {
        "companyCount": len(display_copy_records),
        "allSixAxesMinimumUsableCount": sum(
            all(axis["minimumUsable"] for axis in record["axes"].values())
            for record in display_copy_records
        ),
        "allAxesHaveCoreGroundingCount": sum(
            all(
                bool(axis["claimIds"] or axis["relationIds"] or axis["financialRecordIds"])
                for axis in record["axes"].values()
            )
            for record in display_copy_records
        ),
        "legacyProseUsedCompanyCount": sum(
            any(axis["legacyProseUsed"] for axis in record["axes"].values())
            for record in display_copy_records
        ),
        "nonCopyBlockingGapCompanyCount": sum(
            any(not axis["minimumUsable"] or axis["blockingGaps"] for axis in record["axes"].values())
            or record["structureAssessment"]["registryRequired"]
            or record["structureAssessment"]["relationRequired"]
            for record in display_copy_records
        ),
        "productClaimDirectProjectionCount": sum(
            "company-evidence-claim" in record["axes"]["products"]["displayPath"]
            for record in display_copy_records
        ),
        "financialCompanyLevelReadyCount": sum(
            record["axes"]["financialComparability"]["companyLevelReadiness"] == "ready"
            for record in display_copy_records
        ),
    }
    artifact = {
        "schemaVersion": SCHEMA_VERSION,
        "baselineMainSha": BASELINE_MAIN_SHA,
        "inputDigest": input_digest(audited_input_paths()),
        "companyCount": len(records),
        "acceptanceReview": {
            "decision": ACCEPTANCE_REVIEW_DECISION,
            "reason": (
                "The original classification totals remain supported, but the original artifact did not "
                "separate coverage status from minimum P1 usability or mechanically prove the 15-company review. "
                "This revision adds those contracts without changing production data."
            ),
            "originalClassificationCounts": ORIGINAL_CLASSIFICATION_COUNTS,
            "reviewedClassificationCounts": {
                key: classifications[key] for key in READINESS_CLASSES
            },
            "classificationCountsChanged": (
                {key: classifications[key] for key in READINESS_CLASSES}
                != ORIGINAL_CLASSIFICATION_COUNTS
            ),
        },
        "methodology": {
            "scope": "Repository-only audit of canonical Company, Evidence, Registry, Relation, and Financial data.",
            "evidenceProjection": (
                "Existing Company Evidence Claims are projected without changing statements; every used Claim "
                "must resolve through a supports or context Binding with structured Locator to a Shared Source."
            ),
            "structureRule": (
                "Product or Technology entity IDs and Relations are never inferred. Their absence is not a "
                "shortage when the six-axis display can use a grounded Claim directly; a Registry or Relation "
                "action is required only for an explicit structured assertion."
            ),
            "financialRule": (
                "Use normalized Financial history only. Company-level minimum usability requires at least one "
                "period with period, currency, unit, accounting basis, Operating Margin, revenue, and a primary "
                "Shared Source. Coverage status remains partial while Revenue Growth lacks a normalized definition; "
                "definition, period, and basis compatibility is recalculated for each comparison set."
            ),
            "minimumUsableRule": (
                "A partial axis may be minimumUsable=true only when a category-specific Claim or accepted Relation "
                "resolves through Binding, structured Locator, and Shared Source, or when Financial meets its "
                "company-level metadata and primary-source contract. Legacy prose is never grounding."
            ),
            "scoreRule": "complete=2, partial=1, missing=0, notApplicable excluded; percent rounded to one decimal.",
            "externalResearchUsed": False,
            "inferenceUsed": False,
        },
        "protectedBaseline": {
            "companyCount": 100,
            "relationCount": 17,
            "relationEvidenceBindingCount": 17,
            "registryCounts": EXPECTED_REGISTRY_COUNTS,
            "projectionPriorityCounts": EXPECTED_PROJECTION,
            "companyEvidenceCoverage": EXPECTED_COVERAGE,
            "maturityL4": 100,
            "actionablePending": 0,
            "reviewRequired": 0,
            "triageValidationV02": "87/87 PASS",
            "companyEvidenceV1CoverageClose": "YES",
            "companyCompareMarkerCount": 53,
        },
        "classificationCounts": {key: classifications[key] for key in READINESS_CLASSES},
        "axisCoverageSummary": axis_summary,
        "axisMinimumUsableSummary": minimum_summary,
        "displayCopyOnlyProof": display_copy_proof,
        "commonMissingContent": [
            {"reason": reason, "companyAxisCount": count}
            for reason, count in sorted(common_gaps.items(), key=lambda item: (-item[1], item[0]))
        ],
        "recommendedFirstBatch": batch,
        "firstBatchAcceptanceReview": first_batch_acceptance_review(records, batch),
        "hardStop": {
            "triggered": False,
            "reason": "Fixed baseline and repository-only structural audit gates are consistent.",
        },
        "records": records,
    }
    validate_artifact(artifact, context)
    return artifact, context


def validate_axis_grounding(
    axis: dict[str, Any],
    context: dict[str, Any],
    location: str,
    company_id: str,
    axis_name: str,
) -> None:
    known = {
        "claimIds": set(context["claims"]),
        "companyEvidenceBindingIds": set(context["companyBindings"]),
        "relationIds": set(context["relations"]),
        "relationEvidenceBindingIds": set(context["relationBindings"]),
        "sourceIds": set(context["sources"]),
        "registryEntityIds": set(context["registries"]),
        "valueChainNodeIds": set(context["valueChainNodes"]),
        "financialRecordIds": set(context["financialRecords"]),
        "metricDefinitionIds": set(context["metricDefinitions"]),
    }
    for key, known_ids in known.items():
        values = axis.get(key)
        if not isinstance(values, list) or values != sorted(set(values)):
            raise ValueError(f"{location}: {key} must be a unique stable array")
        unresolved = sorted(set(values) - known_ids)
        if unresolved:
            raise ValueError(f"{location}: unresolved {key}: {', '.join(unresolved)}")

    expected_nested_grounding = {key: axis[key] for key in GROUNDING_KEYS}
    if axis.get("groundingIds") != expected_nested_grounding:
        raise ValueError(f"{location}: groundingIds must match the stable axis grounding arrays")

    if not isinstance(axis.get("minimumUsable"), bool):
        raise ValueError(f"{location}: minimumUsable must be boolean")
    if not has_content(axis.get("minimumUsableReason")):
        raise ValueError(f"{location}: minimumUsableReason is required")
    if not isinstance(axis.get("blockingGaps"), list) or axis["blockingGaps"] != sorted(
        set(axis["blockingGaps"])
    ):
        raise ValueError(f"{location}: blockingGaps must be a unique stable array")
    if axis.get("legacyProseUsed") is not False:
        raise ValueError(f"{location}: legacyProseUsed must be false")
    if not has_content(axis.get("displayPath")):
        raise ValueError(f"{location}: displayPath is required")
    core_grounding = bool(
        axis["claimIds"] or axis["relationIds"] or axis["financialRecordIds"]
    )
    if axis["minimumUsable"] and (not core_grounding or axis["blockingGaps"]):
        raise ValueError(f"{location}: usable axis requires core grounding and no blockingGaps")
    if not axis["minimumUsable"] and not axis["blockingGaps"]:
        raise ValueError(f"{location}: unusable axis requires blockingGaps")

    for binding_id in axis["companyEvidenceBindingIds"]:
        binding = context["companyBindings"][binding_id]
        if (
            binding.get("support") not in {"supports", "context"}
            or binding.get("sourceId") not in axis["sourceIds"]
            or not has_structured_locator(binding.get("locator"))
        ):
            raise ValueError(f"{location}: Company Evidence Binding is not fully grounded: {binding_id}")
    for claim_id in axis["claimIds"]:
        claim = context["claims"][claim_id]
        if claim.get("companyId") != company_id:
            raise ValueError(f"{location}: Claim belongs to another Company: {claim_id}")
        if axis_name != "financialComparability" and claim.get("category") not in AXIS_CATEGORIES[axis_name]:
            raise ValueError(f"{location}: Claim category cannot ground this axis: {claim_id}")
        if not any(
            context["companyBindings"][binding_id].get("claimId") == claim_id
            for binding_id in axis["companyEvidenceBindingIds"]
        ):
            raise ValueError(f"{location}: Claim has no included grounded Binding: {claim_id}")
    for binding_id in axis["relationEvidenceBindingIds"]:
        binding = context["relationBindings"][binding_id]
        if binding.get("sourceId") not in axis["sourceIds"] or not has_structured_locator(binding.get("locator")):
            raise ValueError(f"{location}: Relation Evidence Binding is not fully grounded: {binding_id}")
    for relation_id in axis["relationIds"]:
        relation = context["relations"][relation_id]
        if not relation_applies_to_company(relation, company_id, axis_name):
            raise ValueError(f"{location}: Relation cannot ground this Company/axis: {relation_id}")
        if not any(
            context["relationBindings"][binding_id].get("relationId") == relation_id
            and context["relationBindings"][binding_id].get("support") == "supports"
            for binding_id in axis["relationEvidenceBindingIds"]
        ):
            raise ValueError(f"{location}: Relation has no included supports Binding: {relation_id}")

    for record_id in axis["financialRecordIds"]:
        record = context["financialRecords"][record_id]
        if record.get("companyId") != company_id:
            raise ValueError(f"{location}: Financial record belongs to another Company: {record_id}")
        if record.get("sourceId") not in axis["sourceIds"]:
            raise ValueError(f"{location}: Financial record Source is not included: {record_id}")

    if axis_name == "financialComparability":
        minimum_ids = axis.get("minimumFinancialRecordIds")
        if not isinstance(minimum_ids, list) or minimum_ids != sorted(set(minimum_ids)):
            raise ValueError(f"{location}: minimumFinancialRecordIds must be a unique stable array")
        if set(minimum_ids) - set(axis["financialRecordIds"]):
            raise ValueError(f"{location}: minimum Financial records must be included in grounding")
        actually_usable = [
            record_id
            for record_id in minimum_ids
            if not financial_record_minimum_gaps(context["financialRecords"][record_id], context)
        ]
        if axis["minimumUsable"] != bool(actually_usable):
            raise ValueError(f"{location}: Financial minimumUsable does not match required metadata/source")
        set_level = axis.get("setLevelCompatibility", {})
        if (
            set_level.get("required") is not True
            or set_level.get("status") != "not-evaluated-at-company-level"
            or set_level.get("checks") != ["metricDefinition", "periodType", "period", "basis"]
        ):
            raise ValueError(f"{location}: Financial set-level compatibility contract differs")


def validate_artifact(artifact: dict[str, Any], context: dict[str, Any]) -> None:
    records = artifact.get("records")
    if not isinstance(records, list) or len(records) != EXPECTED_COMPANY_COUNT:
        raise ValueError("Audit must contain exactly 100 Company records")
    actual_ids = [record.get("companyId") for record in records]
    expected_ids = sorted(context["companies"])
    if actual_ids != expected_ids or len(actual_ids) != len(set(actual_ids)):
        raise ValueError("Audit Company IDs are duplicate, missing, extra, or not canonical-order")
    if artifact.get("companyCount") != len(records):
        raise ValueError("companyCount does not match records")
    if artifact.get("baselineMainSha") != BASELINE_MAIN_SHA:
        raise ValueError("baselineMainSha differs from the accepted fixed baseline")

    classes = Counter()
    for record in records:
        company_id = record["companyId"]
        if record.get("canonicalName") != context["companies"][company_id].get("name"):
            raise ValueError(f"{company_id}: canonicalName differs from Company data")
        if record.get("japaneseDisplayName") != context["companies"][company_id].get("japaneseName"):
            raise ValueError(f"{company_id}: japaneseDisplayName differs from Company data")
        if tuple(record.get("axes", {}).keys()) != AXES:
            raise ValueError(f"{company_id}: all six axes must exist in canonical order")
        classes[record.get("readinessClass")] += 1
        if record.get("readinessClass") not in READINESS_CLASSES:
            raise ValueError(f"{company_id}: invalid readinessClass")
        structure = record.get("structureAssessment", {})
        if structure.get("inferenceUsed") is not False:
            raise ValueError(f"{company_id}: structure inferenceUsed must be false")
        if not isinstance(structure.get("unresolvedRegistryEntityIds"), list) or not isinstance(
            structure.get("unresolvedRelationIds"), list
        ):
            raise ValueError(f"{company_id}: invalid structure assessment")
        if not has_content(structure.get("registryRequirementReason")) or not has_content(
            structure.get("relationRequirementReason")
        ):
            raise ValueError(f"{company_id}: Registry/Relation requirement reasons are required")

        for axis_name, axis in record["axes"].items():
            if axis.get("status") not in STATUSES:
                raise ValueError(f"{company_id}/{axis_name}: invalid status")
            if axis.get("inferenceUsed") is not False:
                raise ValueError(f"{company_id}/{axis_name}: inferenceUsed must be false")
            if not axis.get("reason"):
                raise ValueError(f"{company_id}/{axis_name}: reason is required")
            if not isinstance(axis.get("missingContent"), list):
                raise ValueError(f"{company_id}/{axis_name}: missingContent must be an array")
            validate_axis_grounding(
                axis,
                context,
                f"{company_id}/{axis_name}",
                company_id,
                axis_name,
            )

        expected_grounding = merge_grounding(*(record["axes"][axis] for axis in AXES))
        if record.get("groundingIds") != expected_grounding:
            raise ValueError(f"{company_id}: aggregate groundingIds differ from axis grounding")
        score, maximum, percent = score_axes(record["axes"])
        if (
            record.get("score") != score
            or record.get("maximumScore") != maximum
            or record.get("coveragePercent") != percent
        ):
            raise ValueError(f"{company_id}: score formula mismatch")
        if record["readinessClass"] in READY_CLASSES and any(
            not axis["minimumUsable"] for axis in record["axes"].values()
        ):
            raise ValueError(f"{company_id}: displayable classification has an unusable axis")
        expected_readiness = (
            "EVIDENCE_HOLD"
            if any(not axis["minimumUsable"] for axis in record["axes"].values())
            else "REGISTRY_REQUIRED"
            if structure.get("registryRequired")
            else "RELATION_REQUIRED"
            if structure.get("relationRequired")
            else "READY_EXISTING_EVIDENCE"
            if company_id in PILOT_COMPANY_IDS
            else "DISPLAY_COPY_ONLY"
        )
        if record["readinessClass"] != expected_readiness:
            raise ValueError(f"{company_id}: readiness priority contract mismatch")
        if record["readinessClass"] == "READY_EXISTING_EVIDENCE" and company_id not in PILOT_COMPANY_IDS:
            raise ValueError(f"{company_id}: READY lacks the frozen Compare display/projection fixture")

    expected_class_counts = {key: classes[key] for key in READINESS_CLASSES}
    if artifact.get("classificationCounts") != expected_class_counts or sum(classes.values()) != 100:
        raise ValueError("classificationCounts do not sum to 100")

    expected_axis_summary = {
        axis: {
            status: sum(record["axes"][axis]["status"] == status for record in records)
            for status in STATUSES
        }
        for axis in AXES
    }
    if artifact.get("axisCoverageSummary") != expected_axis_summary:
        raise ValueError("axisCoverageSummary does not match Company records")

    expected_minimum_summary = {
        axis: {
            "true": sum(record["axes"][axis]["minimumUsable"] is True for record in records),
            "false": sum(record["axes"][axis]["minimumUsable"] is False for record in records),
        }
        for axis in AXES
    }
    if artifact.get("axisMinimumUsableSummary") != expected_minimum_summary:
        raise ValueError("axisMinimumUsableSummary does not match Company records")

    review = artifact.get("acceptanceReview", {})
    if (
        review.get("decision") != ACCEPTANCE_REVIEW_DECISION
        or review.get("originalClassificationCounts") != ORIGINAL_CLASSIFICATION_COUNTS
        or review.get("reviewedClassificationCounts") != expected_class_counts
        or review.get("classificationCountsChanged")
        != (expected_class_counts != ORIGINAL_CLASSIFICATION_COUNTS)
    ):
        raise ValueError("Acceptance Review summary differs from computed classifications")

    display_records = [
        record for record in records if record["readinessClass"] == "DISPLAY_COPY_ONLY"
    ]
    expected_display_proof = {
        "companyCount": len(display_records),
        "allSixAxesMinimumUsableCount": sum(
            all(axis["minimumUsable"] for axis in record["axes"].values())
            for record in display_records
        ),
        "allAxesHaveCoreGroundingCount": sum(
            all(
                bool(axis["claimIds"] or axis["relationIds"] or axis["financialRecordIds"])
                for axis in record["axes"].values()
            )
            for record in display_records
        ),
        "legacyProseUsedCompanyCount": sum(
            any(axis["legacyProseUsed"] for axis in record["axes"].values())
            for record in display_records
        ),
        "nonCopyBlockingGapCompanyCount": sum(
            any(not axis["minimumUsable"] or axis["blockingGaps"] for axis in record["axes"].values())
            or record["structureAssessment"]["registryRequired"]
            or record["structureAssessment"]["relationRequired"]
            for record in display_records
        ),
        "productClaimDirectProjectionCount": sum(
            "company-evidence-claim" in record["axes"]["products"]["displayPath"]
            for record in display_records
        ),
        "financialCompanyLevelReadyCount": sum(
            record["axes"]["financialComparability"]["companyLevelReadiness"] == "ready"
            for record in display_records
        ),
    }
    if artifact.get("displayCopyOnlyProof") != expected_display_proof:
        raise ValueError("DISPLAY_COPY_ONLY proof summary differs from Company records")

    batch_ids = artifact.get("recommendedFirstBatch", {}).get("companyIds", [])
    if len(batch_ids) != len(set(batch_ids)):
        raise ValueError("recommendedFirstBatch contains duplicate Company IDs")
    if set(batch_ids) & PILOT_COMPANY_IDS:
        raise ValueError("recommendedFirstBatch contains a frozen Pilot Company")
    records_by_id = {record["companyId"]: record for record in records}
    for company_id in batch_ids:
        record = records_by_id.get(company_id)
        if not record or record["readinessClass"] not in READY_CLASSES:
            raise ValueError(f"recommendedFirstBatch contains an ineligible Company: {company_id}")
        if any(not axis["minimumUsable"] for axis in record["axes"].values()):
            raise ValueError(f"recommendedFirstBatch contains an unusable axis: {company_id}")
        if any(
            action["actionType"] in {"RESOLVE_EVIDENCE_GAP", "EXPAND_REGISTRY", "AUTHOR_RELATION"}
            for action in record["requiredActions"]
        ):
            raise ValueError(f"recommendedFirstBatch contains a structural shortage: {company_id}")

    acceptance_rows = artifact.get("firstBatchAcceptanceReview")
    if not isinstance(acceptance_rows, list) or [
        row.get("companyId") for row in acceptance_rows
    ] != list(FIRST_BATCH_REVIEW_IDS):
        raise ValueError("firstBatchAcceptanceReview must cover the fixed 15 Companies in order")
    retained_ids = []
    for row in acceptance_rows:
        company_id = row["companyId"]
        record = records_by_id[company_id]
        if row.get("readinessClass") != record["readinessClass"]:
            raise ValueError(f"{company_id}: first-batch readinessClass differs")
        for axis in AXES:
            review_axis = row.get("axes", {}).get(axis, {})
            if (
                review_axis.get("status") != record["axes"][axis]["status"]
                or review_axis.get("minimumUsable") != record["axes"][axis]["minimumUsable"]
                or review_axis.get("majorGroundingIds") != major_grounding(record["axes"][axis])
            ):
                raise ValueError(f"{company_id}/{axis}: first-batch axis review differs")
        should_retain = eligible_for_first_batch(record)
        if row.get("retainedInFirstBatch") != should_retain:
            raise ValueError(f"{company_id}: first-batch retention decision differs")
        if should_retain:
            retained_ids.append(company_id)
            if row.get("exclusionReason") is not None:
                raise ValueError(f"{company_id}: retained Company must not have exclusionReason")
        elif not has_content(row.get("exclusionReason")):
            raise ValueError(f"{company_id}: excluded Company requires exclusionReason")
    if retained_ids != batch_ids or artifact["recommendedFirstBatch"].get("excludedCompanyIds") != [
        company_id for company_id in FIRST_BATCH_REVIEW_IDS if company_id not in retained_ids
    ]:
        raise ValueError("recommendedFirstBatch must equal retained acceptance-review Companies")
    if artifact.get("hardStop", {}).get("triggered") is not False:
        raise ValueError("hardStop must remain false after all audit validations pass")


def markdown_escape(value: Any) -> str:
    return str(value).replace("|", "\\|").replace("\r", " ").replace("\n", " ")


def display_company(record: dict[str, Any]) -> str:
    return f"{record['companyId']} — {record['japaneseDisplayName']}"


def status_minimum_cell(axis: dict[str, Any]) -> str:
    short = {"complete": "C", "partial": "P", "missing": "M", "notApplicable": "NA"}
    return f"{short[axis['status']]}/{'Y' if axis['minimumUsable'] else 'N'}"


def compact_major_grounding(review: dict[str, Any]) -> str:
    parts: list[str] = []
    for axis in AXES:
        grounding = review["axes"][axis]["majorGroundingIds"]
        core = [
            *grounding["claimIds"],
            *grounding["relationIds"],
            *grounding["financialRecordIds"],
        ]
        chain = [*core[:2], *grounding["bindingIds"][:1], *grounding["sourceIds"][:1]]
        parts.append(f"{axis}: " + " → ".join(f"`{item}`" for item in chain))
    return "<br>".join(parts)


def render_markdown(artifact: dict[str, Any]) -> str:
    records = artifact["records"]
    records_by_id = {record["companyId"]: record for record in records}
    acceptance = artifact["acceptanceReview"]
    lines = [
        "# 100社 Company Compare Readiness Audit v0.1",
        "",
        f"- Acceptance Review: **{acceptance['decision']}**",
        "- Revised artifact validation: **PASS**",
        f"- Baseline main: `{artifact['baselineMainSha']}`",
        f"- Input digest: `{artifact['inputDigest']}`",
        f"- 対象: canonical Company **{artifact['companyCount']}社**",
        "- 外部調査: **NO**",
        "- Company／Evidence／Source／Relation／Binding／Registry／Financial／UI変更: **NO**",
        "- Company Compareへの企業追加: **NO**",
        "",
        "## 1. 目的と対象",
        "",
        "Frozen Company Compare Pilotを100社へ展開する前に、現行repository内のcanonical Company、Company Evidence、Shared Source、Relation、Registry、Financialだけで、安全な比較表示を構成できるかを監査した。監査は表示やデータを変更せず、不足を分類する。",
        "",
        "Acceptance Reviewでは、旧成果物が`status=missing`だけをblocking条件としていた点を修正対象とした。分類件数は実データで再現したが、充足度と最低表示可能性を分離していなかったため判定を`REVISE`とし、本成果物へ機械検証可能な`minimumUsable`契約を追加した。",
        "",
        "## 2. 判定方法：充足度と最低表示可能性",
        "",
        "`status`はCoverageの網羅性、`minimumUsable`は安全なP1 Compare表示の最低条件を表す。各軸は`minimumUsableReason`、`blockingGaps`、`groundingIds`を保持する。`partial`でも直接groundingがあれば`minimumUsable=true`になり得るが、単に文章が存在するだけでは認めない。",
        "",
        "Claimは軸専用categoryからだけ選び、`Claim → supports/context Binding → structured Locator → Shared Source`を解決する。Relation使用時も`Relation → supports Binding → structured Locator → Shared Source`を解決する。legacy prose、一般常識、企業規模、competitor配列からの推測は0件である。",
        "",
        "Financialは正規化historyだけを使い、会社単位では1期間以上の期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを必須とする。Revenue Growthの正規化定義未収録とset単位のdefinition／period／basis互換性確認はpartial理由として残す。",
        "",
        "Product／Technology entity IDやRelationは推測していない。6軸が既存Claimだけで説明できる場合、Registry／Relationが存在しないこと自体を不足にはしない。構造化したentity／relation表示を新たに主張する場合だけ、別change-controlでRegistry／Relationを要求する。",
        "",
        "Readinessは`EVIDENCE_HOLD > REGISTRY_REQUIRED > RELATION_REQUIRED > DISPLAY_COPY_ONLY > READY_EXISTING_EVIDENCE`の優先順で、6軸の`minimumUsable`と構造不足から決定する。",
        "",
        "## 3. Acceptance ReviewとReadiness分類",
        "",
        "| Readiness class | 修正前 | 修正後 |",
        "| --- | ---: | ---: |",
    ]
    for readiness in READINESS_CLASSES:
        lines.append(
            f"| `{readiness}` | {acceptance['originalClassificationCounts'][readiness]} | "
            f"{artifact['classificationCounts'][readiness]} |"
        )

    lines.extend(
        [
            "",
            "## 4. 6軸の充足状況",
            "",
            "| 軸 | complete | partial | missing | notApplicable |",
            "| --- | ---: | ---: | ---: | ---: |",
        ]
    )
    for axis in AXES:
        summary = artifact["axisCoverageSummary"][axis]
        lines.append(
            f"| `{axis}`（{AXIS_LABELS[axis]}） | {summary['complete']} | {summary['partial']} | "
            f"{summary['missing']} | {summary['notApplicable']} |"
        )

    lines.extend(
        [
            "",
            "### Minimum usability",
            "",
            "| 軸 | minimumUsable=true | minimumUsable=false |",
            "| --- | ---: | ---: |",
        ]
    )
    for axis in AXES:
        summary = artifact["axisMinimumUsableSummary"][axis]
        lines.append(
            f"| `{axis}`（{AXIS_LABELS[axis]}） | {summary['true']} | {summary['false']} |"
        )

    proof = artifact["displayCopyOnlyProof"]
    lines.extend(
        [
            "",
            "### 95社のDISPLAY_COPY_ONLYが成立する根拠",
            "",
            f"- 対象：**{proof['companyCount']}社**",
            f"- 6軸すべて`minimumUsable=true`：**{proof['allSixAxesMinimumUsableCount']}社**",
            f"- 全軸にClaim／Relation／Financialのcore groundingあり：**{proof['allAxesHaveCoreGroundingCount']}社**",
            f"- legacy prose使用：**{proof['legacyProseUsedCompanyCount']}社**",
            f"- 日本語copy以外のblocking gap：**{proof['nonCopyBlockingGapCompanyCount']}社**",
            f"- Product Claimの直接投影経路あり：**{proof['productClaimDirectProjectionCount']}社**",
            f"- Financial会社単位minimum ready：**{proof['financialCompanyLevelReadyCount']}社**",
            "",
            "`DISPLAY_COPY_ONLY`は会社別準備として残るものがCompare専用日本語copyの編集レビューだけという意味である。set単位Financial compatibility gateは別途必須であり、どのsetでも全指標を表示できるという意味ではない。",
        ]
    )
    lines.extend(
        [
            "",
            "## 5. 100社一覧",
            "",
            "各軸は`status/minimumUsable`。`C=complete / P=partial / M=missing / NA=notApplicable / Y=usable / N=blocked`。",
            "",
            "| Company ID | canonical会社名 | 日本語表示名 | Primary Layer | Readiness | 得点 | what | aiRole | products | competitive | risks | financial |",
            "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
        ]
    )
    for record in records:
        axes = record["axes"]
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{record['companyId']}`",
                    markdown_escape(record["canonicalName"]),
                    markdown_escape(record["japaneseDisplayName"]),
                    markdown_escape(record["valueChainClassification"]["primaryLayer"]),
                    f"`{record['readinessClass']}`",
                    f"{record['score']}/{record['maximumScore']} ({record['coveragePercent']:.1f}%)",
                    status_minimum_cell(axes["what"]),
                    status_minimum_cell(axes["aiRole"]),
                    status_minimum_cell(axes["products"]),
                    status_minimum_cell(axes["competitivePosition"]),
                    status_minimum_cell(axes["risks"]),
                    status_minimum_cell(axes["financialComparability"]),
                ]
            )
            + " |"
        )

    lines.extend(["", "## 6. 分類別会社一覧", ""])
    for readiness in READINESS_CLASSES:
        matching = [record for record in records if record["readinessClass"] == readiness]
        lines.append(f"### {readiness}（{len(matching)}社）")
        lines.append("")
        if matching:
            lines.extend(f"- {display_company(record)}" for record in matching)
        else:
            lines.append("- 該当なし")
        lines.append("")

    lines.extend(["## 7. 主な共通不足", ""])
    common = artifact["commonMissingContent"][:12]
    if common:
        lines.extend(
            f"- {item['reason']}：{item['companyAxisCount']} company-axis records"
            for item in common
        )
    else:
        lines.append("- 該当なし")

    batch = artifact["recommendedFirstBatch"]
    lines.extend(
        [
            "",
            "## 8. 推奨first batch 15社の個別Acceptance Review",
            "",
            "指定15社を1社ずつ再判定し、不適格会社の自動補充は行わない。Registry／Relationの要否は、既存Claimを会社別P1 copyへ直接投影する現行経路を前提に判定した。",
            "",
            "| companyId | readinessClass | what | aiRole | products | competitive | risks | financial | 主要grounding ID | Registry | Relation | Financial会社単位 | set単位確認 | first batch | 除外理由 |",
            "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |",
        ]
    )
    for review in artifact["firstBatchAcceptanceReview"]:
        record = records_by_id[review["companyId"]]
        axes = record["axes"]
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{review['companyId']}`",
                    f"`{review['readinessClass']}`",
                    status_minimum_cell(axes["what"]),
                    status_minimum_cell(axes["aiRole"]),
                    status_minimum_cell(axes["products"]),
                    status_minimum_cell(axes["competitivePosition"]),
                    status_minimum_cell(axes["risks"]),
                    status_minimum_cell(axes["financialComparability"]),
                    compact_major_grounding(review),
                    ("必要" if review["registryRequirement"]["required"] else "不要")
                    + " — "
                    + markdown_escape(review["registryRequirement"]["reason"]),
                    ("必要" if review["relationRequirement"]["required"] else "不要")
                    + " — "
                    + markdown_escape(review["relationRequirement"]["reason"]),
                    markdown_escape(review["financialCompanyLevel"]["status"])
                    + " — "
                    + markdown_escape(review["financialCompanyLevel"]["reason"]),
                    "必要 — metricDefinition／periodType／period／basis",
                    "残す" if review["retainedInFirstBatch"] else "除外",
                    markdown_escape(review["exclusionReason"] or "—"),
                ]
            )
            + " |"
        )
    lines.extend(
        [
            "",
            f"結果：指定15社中 **{len(batch['companyIds'])}社を維持**、"
            f"**{len(batch['excludedCompanyIds'])}社を除外**。自動補充は0社。",
            "",
        ]
    )
    if batch["companyIds"]:
        for index, company_id in enumerate(batch["companyIds"], start=1):
            record = records_by_id[company_id]
            lines.append(
                f"{index}. {display_company(record)} — {record['valueChainClassification']['primaryLayer']} / "
                f"{record['coveragePercent']:.1f}% / `{record['readinessClass']}`"
            )
    if batch["excludedCompanyIds"]:
        lines.extend(["", "除外：" + ", ".join(batch["excludedCompanyIds"])])

    lines.extend(
        [
            "",
            "Value Chain分布："
            + " / ".join(
                f"{layer} {count}社" for layer, count in batch["valueChainDistribution"].items()
            ),
            "",
            "## 9. Registry／Relation追加が0件でよい理由",
            "",
            "100社すべてでProductsは専用のEvidence-backed Claimから最低1件を直接表示できる。今回の会社別P1 copyはProduct entity横断の集計、roll-up、同義語統合、重複排除を行わないため、Registry追加は表示の前提ではない。Registry IDを推測したrecordは0件である。",
            "",
            "AI role、Products、Competitive Positionも既存Evidence-backed Claimから直接表示できる。新しいCompany間関係やCompany→entity関係を主張せず、既存Relationの不在だけを不足扱いしないため、Relation追加は0件でよい。Relationが必要な将来表示は別change-controlとする。",
            "",
            "## 10. Financial partialの意味",
            "",
            "全100社は会社単位で、1期間以上の期間、通貨、単位、会計基準、Operating Margin、revenue、一次Shared Sourceを解決できる。一方、Revenue Growthの正規化definitionは未収録で、比較setが決まるまでdefinition／period／basis互換性を確定できない。このためCoverage statusは100社とも`partial`のまま維持する。`partial`は会社単位の最低表示不可を意味せず、set gateで`ok / caution / blocked`を理由付き判定する契約を示す。Company JSON fallback、FX換算、推測値は使用しない。",
            "",
            "## 11. 次工程で必要な作業",
            "",
            "1. 推奨batchについて、既存Claimを改変しない短い日本語Compare copyを人間が編集レビューする。",
            "2. 実際の比較setごとにFinancial compatibility contractを実行し、period／basis差とRevenue Growth定義未収録を理由付きで表示する。",
            "3. entity／relation行を新設する場合だけ、対象Claimを起点にbounded reviewし、Registry／Relation／Bindingを別PR・別change-controlで追加する。",
            "4. Frozen UIを使う実装PRは、本監査PRのmergeとは分離する。",
            "",
            "## 12. HARD STOP／未解決事項",
            "",
            "- HARD STOP: **NO**",
            "- Acceptance Reviewは`REVISE`。旧分類の件数は維持されたが、minimum usabilityと15社個別確認を成果物へ追加した。",
            "- competitivePositionとrisksは全社で主要内容をEvidence化済みだがCoverageはpartialであり、completeへ水増ししていない。",
            "- Registry／Relationを新たに必要とする表示主張は本監査で作っていない。未登録entity／relationを推測していない。",
            "- Compare専用copyの実レビュー、set単位Financial判定、実装、merge、deployは次工程であり未実施。",
            "",
            "## 監査契約",
            "",
            "- Generator / checker: [`audit-company-compare-readiness-v01.py`](../scripts/audit-company-compare-readiness-v01.py)",
            "- Company Evidence Close: [`company-evidence-v1-coverage-close.md`](./company-evidence-v1-coverage-close.md)",
            "- Company Compare Pilot contract: [`company-compare-pilot-contract-v01.md`](./company-compare-pilot-contract-v01.md)",
        ]
    )
    return "\n".join(lines) + "\n"


def validate_markdown_summary(markdown: str, artifact: dict[str, Any]) -> None:
    if f"- Acceptance Review: **{artifact['acceptanceReview']['decision']}**" not in markdown:
        raise ValueError("Markdown Acceptance Review decision is stale")
    for readiness in READINESS_CLASSES:
        expected = (
            f"| `{readiness}` | "
            f"{artifact['acceptanceReview']['originalClassificationCounts'][readiness]} | "
            f"{artifact['classificationCounts'][readiness]} |"
        )
        if expected not in markdown:
            raise ValueError(f"Markdown classification summary is stale: {readiness}")
    for axis in AXES:
        summary = artifact["axisCoverageSummary"][axis]
        expected = (
            f"| `{axis}`（{AXIS_LABELS[axis]}） | {summary['complete']} | {summary['partial']} | "
            f"{summary['missing']} | {summary['notApplicable']} |"
        )
        if expected not in markdown:
            raise ValueError(f"Markdown axis summary is stale: {axis}")
        minimum = artifact["axisMinimumUsableSummary"][axis]
        minimum_expected = (
            f"| `{axis}`（{AXIS_LABELS[axis]}） | {minimum['true']} | {minimum['false']} |"
        )
        if minimum_expected not in markdown:
            raise ValueError(f"Markdown minimumUsable summary is stale: {axis}")
    for company_id in FIRST_BATCH_REVIEW_IDS:
        if f"| `{company_id}` |" not in markdown:
            raise ValueError(f"Markdown first-batch review is missing: {company_id}")
    batch = artifact["recommendedFirstBatch"]
    expected_result = (
        f"結果：指定15社中 **{len(batch['companyIds'])}社を維持**、"
        f"**{len(batch['excludedCompanyIds'])}社を除外**。自動補充は0社。"
    )
    if expected_result not in markdown:
        raise ValueError("Markdown recommended batch result is stale")
    if "HARD STOP: **NO**" not in markdown:
        raise ValueError("Markdown HARD STOP result is stale")


def print_summary(artifact: dict[str, Any], prefix: str) -> None:
    classes = artifact["classificationCounts"]
    print(
        f"{prefix}: {artifact['acceptanceReview']['decision']} / {artifact['companyCount']} companies / "
        f"READY {classes['READY_EXISTING_EVIDENCE']} / COPY {classes['DISPLAY_COPY_ONLY']} / "
        f"REGISTRY {classes['REGISTRY_REQUIRED']} / RELATION {classes['RELATION_REQUIRED']} / "
        f"EVIDENCE_HOLD {classes['EVIDENCE_HOLD']} / "
        f"first batch {len(artifact['recommendedFirstBatch']['companyIds'])}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="write deterministic JSON and Markdown artifacts")
    mode.add_argument("--check", action="store_true", help="check persisted artifacts for freshness")
    args = parser.parse_args()

    try:
        artifact, _ = build_artifact()
        json_content = stable_json(artifact)
        markdown_content = render_markdown(artifact)
        validate_markdown_summary(markdown_content, artifact)
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"Company Compare readiness audit FAILED: {error}", file=sys.stderr)
        return 1

    if args.write:
        JSON_OUTPUT.write_text(json_content, encoding="utf-8", newline="\n")
        MARKDOWN_OUTPUT.write_text(markdown_content, encoding="utf-8", newline="\n")
        print(f"Wrote {JSON_OUTPUT.relative_to(ROOT)}")
        print(f"Wrote {MARKDOWN_OUTPUT.relative_to(ROOT)}")
        print_summary(artifact, "Company Compare readiness audit")
        return 0

    if args.check:
        stale: list[str] = []
        if not JSON_OUTPUT.exists() or JSON_OUTPUT.read_text(encoding="utf-8") != json_content:
            stale.append(str(JSON_OUTPUT.relative_to(ROOT)))
        if not MARKDOWN_OUTPUT.exists() or MARKDOWN_OUTPUT.read_text(encoding="utf-8") != markdown_content:
            stale.append(str(MARKDOWN_OUTPUT.relative_to(ROOT)))
        if stale:
            print(f"STALE: regenerate with --write: {', '.join(stale)}", file=sys.stderr)
            return 1
        try:
            persisted = load_json(JSON_OUTPUT)
            validate_markdown_summary(MARKDOWN_OUTPUT.read_text(encoding="utf-8"), persisted)
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            print(f"Company Compare readiness audit FAILED: {error}", file=sys.stderr)
            return 1
        print_summary(artifact, "Company Compare readiness audit check OK")
        return 0

    print_summary(artifact, "Company Compare readiness audit preview")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
