#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DOCS = ROOT / "docs"
PILOT_IDS = ["nvidia", "broadcom", "applied-materials", "lam-research", "tokyo-electron"]
ACCEPTED_TYPES = {"PRODUCES", "DEVELOPS", "USES", "ENABLES", "SUPPLIES_TO", "COMPETES_WITH", "OPERATES", "POSITIONED_IN"}
DEFERRED_TYPES = {"SUBSTITUTES", "EXPANDS", "EXPOSED_TO"}
DECISIONS = {"include", "defer", "reject"}
REQUIRED_CANDIDATE_FIELDS = {
    "candidateId", "subjectType", "subjectId", "relationType", "objectType", "objectId",
    "proposedScope", "supportingClaimIds", "supportingCompanyEvidenceBindingIds", "sharedSourceIds",
    "reviewedLocator", "proposedClaimType", "proposedImportance", "proposedDisplayPriority",
    "decision", "reasonCode", "reviewNote", "existingUrlVerificationResult",
    "companyWideScopeEstablished", "guardedPublicGateResult", "reviewedAt",
    "relationId", "relationEvidenceBindingIds",
}
DIMENSIONS = [
    "company-identity", "ai-role", "value-chain-position", "key-products", "technology-moat",
    "capacity-roadmap", "financial", "key-risks", "evidence-trace",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_company_evidence() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    manifest = load_json(DATA / "company-evidence-manifest.json")
    claims: dict[str, dict[str, Any]] = {}
    bindings: dict[str, dict[str, Any]] = {}
    for shard in manifest["shards"]:
        payload = load_json(DATA / shard)
        claims.update({record["id"]: record for record in payload["claims"]})
        bindings.update({record["id"]: record for record in payload["evidence"]})
    return claims, bindings


def load_sources() -> set[str]:
    manifest = load_json(DATA / "source-registry-manifest.json")
    return {
        record["id"]
        for shard in manifest["shards"]
        for record in load_json(DATA / shard)
    }


def validate() -> list[str]:
    errors: list[str] = []
    audit = load_json(DOCS / "phase8-pilot-relation-candidate-audit-v01.json")
    relations = load_json(DATA / "relationships.json")
    relation_bindings = load_json(DATA / "relation-evidence-bindings-v01.json")
    projection = load_json(DATA / "company-compare-evidence-pilot-v01.json")
    claims, company_bindings = load_company_evidence()
    sources = load_sources()
    relation_by_id = {record["relationId"]: record for record in relations}
    relation_binding_by_id = {record["id"]: record for record in relation_bindings}

    candidates = audit.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return ["candidate audit must contain a non-empty candidates array"]
    candidate_ids = [record.get("candidateId") for record in candidates]
    if candidate_ids != sorted(candidate_ids) or len(candidate_ids) != len(set(candidate_ids)):
        errors.append("candidate IDs must be unique and stably sorted")
    for candidate in candidates:
        candidate_id = candidate.get("candidateId", "candidate-without-id")
        if set(candidate) != REQUIRED_CANDIDATE_FIELDS:
            errors.append(f"{candidate_id}: candidate fields differ from the v0.1 audit contract")
        if candidate.get("decision") not in DECISIONS:
            errors.append(f"{candidate_id}: invalid or undecided decision")
        if candidate.get("relationType") not in ACCEPTED_TYPES:
            errors.append(f"{candidate_id}: Relation type is not one of the eight accepted types")
        if candidate.get("relationType") in DEFERRED_TYPES:
            errors.append(f"{candidate_id}: deferred Relation type must not be reviewed for authoring")
        if not candidate.get("supportingClaimIds") or not candidate.get("supportingCompanyEvidenceBindingIds") or not candidate.get("sharedSourceIds"):
            errors.append(f"{candidate_id}: repository grounding is incomplete")
        for claim_id in candidate.get("supportingClaimIds", []):
            if claim_id not in claims:
                errors.append(f"{candidate_id}: unknown supporting Claim {claim_id}")
        for binding_id in candidate.get("supportingCompanyEvidenceBindingIds", []):
            binding = company_bindings.get(binding_id)
            if not binding:
                errors.append(f"{candidate_id}: unknown supporting Company Evidence Binding {binding_id}")
            elif binding.get("locator") != candidate.get("reviewedLocator"):
                errors.append(f"{candidate_id}: reviewed Locator differs from the frozen Binding")
        for source_id in candidate.get("sharedSourceIds", []):
            if source_id not in sources:
                errors.append(f"{candidate_id}: unknown Shared Source {source_id}")
        if candidate.get("decision") == "include":
            relation_id = candidate.get("relationId")
            if not candidate.get("companyWideScopeEstablished"):
                errors.append(f"{candidate_id}: included candidate lacks Company-wide scope")
            if relation_id not in relation_by_id:
                errors.append(f"{candidate_id}: included candidate has no authored Relation")
            binding_ids = candidate.get("relationEvidenceBindingIds", [])
            if not binding_ids or any(binding_id not in relation_binding_by_id for binding_id in binding_ids):
                errors.append(f"{candidate_id}: included candidate lacks authored Relation Evidence Binding")
            if candidate.get("relationType") in {"ENABLES", "SUPPLIES_TO"} and candidate.get("guardedPublicGateResult") != "pass":
                errors.append(f"{candidate_id}: guarded Relation did not pass its public gate")
        else:
            if candidate.get("relationId") is not None or candidate.get("relationEvidenceBindingIds"):
                errors.append(f"{candidate_id}: non-included candidate leaked into production Relation data")

    included_relation_ids = {candidate["relationId"] for candidate in candidates if candidate["decision"] == "include"}
    if included_relation_ids != set(relation_by_id):
        errors.append("included candidate set and production Relation set differ")
    included_binding_ids = {binding_id for candidate in candidates if candidate["decision"] == "include" for binding_id in candidate["relationEvidenceBindingIds"]}
    if included_binding_ids != set(relation_binding_by_id):
        errors.append("included candidate set and Relation Evidence Binding set differ")
    if any(relation["relationType"] in {"ENABLES", "SUPPLIES_TO"} for relation in relations):
        errors.append("guarded ENABLES/SUPPLIES_TO must remain zero for this Pilot audit")
    if any(relation["relationType"] in DEFERRED_TYPES for relation in relations):
        errors.append("deferred Relation type was authored")
    for relation in relations:
        company_endpoints = [
            endpoint_id for endpoint_type, endpoint_id in ((relation["subjectType"], relation["subjectId"]), (relation["objectType"], relation["objectId"]))
            if endpoint_type == "company"
        ]
        if not company_endpoints or any(company_id not in PILOT_IDS for company_id in company_endpoints):
            errors.append(f"{relation['relationId']}: Relation escapes the Pilot 5 companies")
        supports = [binding for binding in relation_bindings if binding["relationId"] == relation["relationId"] and binding["support"] == "supports"]
        if not supports or any(not binding.get("locator") for binding in supports):
            errors.append(f"{relation['relationId']}: direct structured support is missing")

    summary = audit.get("summary", {})
    decision_counts = Counter(candidate["decision"] for candidate in candidates)
    if summary.get("candidateCount") != len(candidates) or summary.get("decisionCounts") != {key: decision_counts[key] for key in ("include", "defer", "reject")}:
        errors.append("candidate audit summary counts are stale")
    if summary.get("includedRelationCount") != len(relations) or summary.get("relationEvidenceBindingCount") != len(relation_bindings):
        errors.append("Relation/Binding summary counts are stale")
    actual_type_counts = Counter(relation["relationType"] for relation in relations)
    if summary.get("includedRelationTypeCounts") != dict(sorted(actual_type_counts.items())):
        errors.append("Relation type summary is stale")

    if projection.get("pilotCompanyIds") != PILOT_IDS:
        errors.append("projection Pilot company order differs from the adopted Set A/Set B order")
    if projection.get("policy", {}).get("dimensionOrder") != DIMENSIONS:
        errors.append("projection dimensions differ from the adopted nine-dimension order")
    if projection.get("policy", {}).get("p3InitialCount") != 0:
        errors.append("initial P3 must be zero")
    if projection.get("policy", {}).get("financialInitialMetricIds") != ["operatingMargin", "revenueGrowth"]:
        errors.append("initial Financial allowlist must be Operating Margin and Revenue Growth only")
    expected_sets = {"set-a": ["nvidia", "broadcom"], "set-b": ["applied-materials", "lam-research", "tokyo-electron"]}
    for set_record in projection.get("sets", []):
        set_id = set_record.get("setId")
        if set_record.get("orderedCompanyIds") != expected_sets.get(set_id):
            errors.append(f"{set_id}: ordered Company IDs are stale")
        financial = set_record.get("financial", {})
        if financial.get("initialMetricIds") != ["operatingMargin", "revenueGrowth"]:
            errors.append(f"{set_id}: initial Financial metrics differ from the contract")
        metric_states = financial.get("metricStates", [])
        if [state.get("metricId") for state in metric_states] != ["operatingMargin", "revenueGrowth"]:
            errors.append(f"{set_id}: Financial compatibility states differ from the initial allowlist")
        for state in metric_states:
            if state.get("compatibility", {}).get("code") not in {"ok", "caution", "blocked"}:
                errors.append(f"{set_id} / {state.get('metricId')}: invalid Financial compatibility state")
            expected_refs = [{"companyId": company_id, "metricId": state.get("metricId")} for company_id in expected_sets[set_id]]
            if state.get("companyMetricRefs") != expected_refs:
                errors.append(f"{set_id} / {state.get('metricId')}: Company metric references are stale")
        if set(financial.get("prohibitedOperations", [])) != {"difference-rate", "fx-conversion", "ranking"}:
            errors.append(f"{set_id}: prohibited Financial operations are incomplete")
        if any(key in json.dumps(financial, ensure_ascii=False) for key in ('"value"', 'revenueHistory', 'operatingProfit')):
            errors.append(f"{set_id}: projection duplicates Financial values or absolute history")
        for company in set_record.get("companies", []):
            dimension_records = company.get("dimensions", [])
            if [record.get("dimensionId") for record in dimension_records] != DIMENSIONS:
                errors.append(f"{company.get('companyId')}: dimension order is stale")
            seen_claim_ids: set[str] = set()
            for dimension in dimension_records:
                initial_claim_ids = dimension.get("initialClaimIds", [])
                if dimension.get("projectionStatus") == "present":
                    if dimension.get("missingState") != "not-missing" or dimension.get("missingReason") is not None:
                        errors.append(f"{company.get('companyId')} / {dimension.get('dimensionId')}: present projection has stale missing state")
                elif not dimension.get("missingState") or not dimension.get("missingReason"):
                    errors.append(f"{company.get('companyId')} / {dimension.get('dimensionId')}: missing projection lacks state/reason")
                if any(claims[claim_id]["priority"] == "P3" for claim_id in initial_claim_ids):
                    errors.append(f"{company.get('companyId')}: P3 leaked into initial projection")
                p2_claim_ids = [claim_id for claim_id in initial_claim_ids if claims[claim_id]["priority"] == "P2"]
                if len(p2_claim_ids) > 1:
                    errors.append(f"{company.get('companyId')} / {dimension.get('dimensionId')}: more than one P2 projection")
                if seen_claim_ids & set(initial_claim_ids):
                    errors.append(f"{company.get('companyId')}: Claim duplicated across initial dimensions")
                seen_claim_ids.update(initial_claim_ids)
            trace = company.get("evidenceTrace", {})
            expected_evidence = sorted({evidence_id for claim_id in seen_claim_ids for evidence_id in claims[claim_id]["evidenceIds"]})
            if trace.get("companyEvidenceBindingIds") != expected_evidence:
                errors.append(f"{company.get('companyId')}: Company Evidence trace is incomplete")
            if any(relation_id not in relation_by_id for relation_id in trace.get("relationIds", [])):
                errors.append(f"{company.get('companyId')}: Relation trace contains unknown Relation")
            if any(binding_id not in relation_binding_by_id for binding_id in trace.get("relationEvidenceBindingIds", [])):
                errors.append(f"{company.get('companyId')}: Relation Evidence trace contains unknown Binding")

    if len(relations) != 17 or len(relation_bindings) != 17:
        errors.append("expected reviewed Pilot publication count is Relation/Binding 17/17")
    if summary.get("guarded", {}).get("ENABLES", {}).get("included") != 0 or summary.get("guarded", {}).get("SUPPLIES_TO", {}).get("included") != 0:
        errors.append("guarded zero-record result is stale")
    if summary.get("unsupportedDeferredTypesAuthored") != 0 or summary.get("marketEndpointCandidates") != 0:
        errors.append("deferred-type or Market protection summary is stale")
    return errors


def main() -> int:
    freshness = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build-phase8-pilot-relation-data.py"), "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if freshness.returncode:
        print(freshness.stdout, end="")
        print(freshness.stderr, end="")
        return freshness.returncode
    errors = validate()
    if errors:
        print("Phase 8 Pilot Relation / projection validation FAILED")
        for error in errors:
            print(" -", error)
        return 1
    audit = load_json(DOCS / "phase8-pilot-relation-candidate-audit-v01.json")
    print(
        "Phase 8 Pilot Relation / projection validation OK: "
        f"candidates {audit['summary']['candidateCount']} / Relations 17 / Bindings 17 / guarded 0 / P3 0"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
