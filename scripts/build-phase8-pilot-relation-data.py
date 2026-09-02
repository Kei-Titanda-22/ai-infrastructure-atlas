#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from copy import deepcopy
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DOCS = ROOT / "docs"
BASELINE_MAIN = "41cf035a70fd0853f08972113025f3cdd56f50ff"
REVIEWED_AT = "2026-09-02"
PILOT_SETS = {
    "set-a": ["nvidia", "broadcom"],
    "set-b": ["applied-materials", "lam-research", "tokyo-electron"],
}
COMPANY_LABELS = {
    "nvidia": "NVIDIA",
    "broadcom": "Broadcom",
    "applied-materials": "Applied Materials",
    "lam-research": "Lam Research",
    "tokyo-electron": "Tokyo Electron",
}

RELATION_PATH = DATA / "relationships.json"
BINDING_PATH = DATA / "relation-evidence-bindings-v01.json"
AUDIT_JSON_PATH = DOCS / "phase8-pilot-relation-candidate-audit-v01.json"
AUDIT_MD_PATH = DOCS / "phase8-pilot-relation-candidate-audit-v01.md"
PROJECTION_PATH = DATA / "company-compare-evidence-pilot-v01.json"
IMPLEMENTATION_MD_PATH = DOCS / "phase8-pilot-relation-projection-v01.md"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def pretty_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def load_manifest_records(manifest_name: str, fields: tuple[str, ...]) -> dict[str, dict[str, Any]]:
    manifest = load_json(DATA / manifest_name)
    records: dict[str, dict[str, Any]] = {}
    for shard_name in manifest["shards"]:
        payload = load_json(DATA / shard_name)
        if isinstance(payload, list):
            shard_records = payload
        else:
            shard_records = [record for field in fields for record in payload.get(field, [])]
        for record in shard_records:
            record_id = record.get("id")
            if isinstance(record_id, str):
                previous = records.get(record_id)
                if previous and (
                    previous.get("url") != record.get("url")
                    or previous.get("companyId") != record.get("companyId")
                ):
                    raise ValueError(f"conflicting duplicate ID {record_id} in {manifest_name}")
                # Match the Source Registry loader: later compatible metadata wins.
                records[record_id] = record
    return records


def load_company_evidence() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]], list[dict[str, Any]]]:
    manifest = load_json(DATA / "company-evidence-manifest.json")
    claims: dict[str, dict[str, Any]] = {}
    bindings: dict[str, dict[str, Any]] = {}
    coverage: list[dict[str, Any]] = []
    for shard_name in manifest["shards"]:
        payload = load_json(DATA / shard_name)
        for record in payload["claims"]:
            if record["id"] in claims:
                raise ValueError(f"duplicate Claim ID {record['id']}")
            claims[record["id"]] = record
        for record in payload["evidence"]:
            if record["id"] in bindings:
                raise ValueError(f"duplicate Company Evidence Binding ID {record['id']}")
            bindings[record["id"]] = record
        coverage.extend(payload["coverage"])
    return claims, bindings, coverage


def empty_scope(**overrides: Any) -> dict[str, Any]:
    scope = {
        "productIds": [],
        "technologyIds": [],
        "valueChainNodeIds": [],
        "marketIds": [],
        "geographies": [],
        "businessUnit": None,
        "capacityBasis": None,
    }
    scope.update(overrides)
    return scope


PRODUCT_SPECS = [
    ("nvidia", "product-category-gpu", "nvidia-products", "nvidia-products-e1", 10),
    ("nvidia", "product-category-cpu", "nvidia-products", "nvidia-products-e1", 20),
    ("nvidia", "product-category-dpu", "nvidia-products", "nvidia-products-e1", 30),
    ("broadcom", "product-category-custom-accelerator-asic", "broadcom-products", "broadcom-products-e1", 10),
    ("broadcom", "product-category-ethernet-switching-silicon", "broadcom-products", "broadcom-products-e1", 20),
    ("broadcom", "product-category-connectivity-semiconductor", "broadcom-products", "broadcom-products-e1", 30),
    ("applied-materials", "product-category-semiconductor-deposition-equipment", "applied-products", "applied-products-e1", 10),
    ("lam-research", "product-category-wafer-fabrication-equipment", "lam-research-overview", "lam-research-overview-e1", 10),
    ("lam-research", "product-category-semiconductor-deposition-equipment", "lam-research-products", "lam-research-products-e1", 20),
    ("lam-research", "product-category-semiconductor-etch-equipment", "lam-research-products", "lam-research-products-e1", 30),
    ("lam-research", "product-category-wafer-cleaning-equipment", "lam-research-products", "lam-research-products-e1", 40),
]

POSITION_SPECS = [
    ("nvidia", "compute", "nvidia-value-chain", "nvidia-value-chain-e1", "high"),
    ("broadcom", "compute", "broadcom-value-chain", "broadcom-value-chain-e1", "high"),
    ("applied-materials", "manufacturing", "applied-value-chain", "applied-value-chain-e1", "high"),
    ("lam-research", "manufacturing", "lam-research-value-chain", "lam-research-value-chain-e1", "medium"),
]

COMPETITION_SPECS = [
    {
        "subjectId": "applied-materials",
        "objectId": "lam-research",
        "claimId": "lam-research-positioning",
        "bindingId": "lam-research-positioning-e1",
        "scope": empty_scope(
            productIds=["product-category-semiconductor-deposition-equipment"],
            technologyIds=["technology-semiconductor-deposition"],
            valueChainNodeIds=["manufacturing"],
        ),
        "statement": "Applied MaterialsとLam Researchは半導体成膜装置市場で競合する。",
        "displayPriority": 10,
        "verification": "verified: Lam Research FY2025 Form 10-K, Competition, lines identifying Applied Materials as the primary dielectric and metals deposition competitor",
    },
    {
        "subjectId": "lam-research",
        "objectId": "tokyo-electron",
        "claimId": "lam-research-positioning",
        "bindingId": "lam-research-positioning-e1",
        "scope": empty_scope(
            productIds=["product-category-semiconductor-etch-equipment", "product-category-wafer-cleaning-equipment"],
            technologyIds=["technology-semiconductor-etching", "technology-wafer-cleaning"],
            valueChainNodeIds=["manufacturing"],
        ),
        "statement": "Lam ResearchとTokyo Electronは半導体エッチング装置およびウェーハ洗浄装置市場で競合する。",
        "displayPriority": 20,
        "verification": "verified: Lam Research FY2025 Form 10-K, Competition, lines identifying Tokyo Electron in etch and wet-clean markets",
    },
]

DEFERRED_SPECS = [
    ("nvidia-develops-accelerated-computing", "nvidia", "DEVELOPS", "technology", "technology-accelerated-computing-architecture", "nvidia-overview", "nvidia-overview-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim establishes an NVIDIA accelerated-computing platform, but does not independently establish the generic DEVELOPS predicate."),
    ("nvidia-develops-ethernet-networking", "nvidia", "DEVELOPS", "technology", "technology-ethernet-networking", "nvidia-networking", "nvidia-networking-e1", "P3_INITIAL_EXCLUDED", "The only direct Technology Claim is P3 and the Pilot does not need this Relation to establish the initial read model."),
    ("broadcom-develops-ethernet-networking", "broadcom", "DEVELOPS", "technology", "technology-ethernet-networking", "broadcom-technology", "broadcom-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim grounds Ethernet capability but does not state the generic DEVELOPS predicate at Company scope."),
    ("applied-materials-develops-materials-engineering", "applied-materials", "DEVELOPS", "technology", "technology-semiconductor-materials-engineering", "applied-overview", "applied-overview-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "Materials engineering is grounded as a capability; development of the canonical Technology is not directly stated."),
    ("applied-materials-develops-metrology", "applied-materials", "DEVELOPS", "technology", "technology-semiconductor-metrology", "applied-technology", "applied-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "Metrology capability is grounded, but the generic DEVELOPS predicate is not direct enough for publication."),
    ("lam-research-develops-deposition", "lam-research", "DEVELOPS", "technology", "technology-semiconductor-deposition", "lam-research-technology", "lam-research-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim names process technologies without separately establishing a generic development Relation."),
    ("lam-research-develops-etching", "lam-research", "DEVELOPS", "technology", "technology-semiconductor-etching", "lam-research-technology", "lam-research-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim names process technologies without separately establishing a generic development Relation."),
    ("lam-research-develops-wafer-cleaning", "lam-research", "DEVELOPS", "technology", "technology-wafer-cleaning", "lam-research-technology", "lam-research-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim names process technologies without separately establishing a generic development Relation."),
    ("tokyo-electron-develops-coating-development", "tokyo-electron", "DEVELOPS", "technology", "technology-semiconductor-coating-development", "tokyo-electron-technology", "tokyo-electron-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim describes process coverage, not the generic DEVELOPS predicate."),
    ("tokyo-electron-develops-deposition", "tokyo-electron", "DEVELOPS", "technology", "technology-semiconductor-deposition", "tokyo-electron-technology", "tokyo-electron-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim describes process coverage, not the generic DEVELOPS predicate."),
    ("tokyo-electron-develops-etching", "tokyo-electron", "DEVELOPS", "technology", "technology-semiconductor-etching", "tokyo-electron-technology", "tokyo-electron-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim describes process coverage, not the generic DEVELOPS predicate."),
    ("tokyo-electron-develops-wafer-cleaning", "tokyo-electron", "DEVELOPS", "technology", "technology-wafer-cleaning", "tokyo-electron-technology", "tokyo-electron-technology-e1", "DIRECT_PREDICATE_NOT_ESTABLISHED", "The Claim describes process coverage, not the generic DEVELOPS predicate."),
    ("nvidia-competes-with-broadcom", "nvidia", "COMPETES_WITH", "company", "broadcom", "nvidia-positioning", "nvidia-positioning-e1", "CLAIM_BINDING_MISMATCH", "The registered NVIDIA filing names Broadcom, but the existing supporting Claim/Binding does not bind that named-competitor statement; no new Company Evidence Binding is allowed."),
    ("applied-materials-competes-with-tokyo-electron", "applied-materials", "COMPETES_WITH", "company", "tokyo-electron", "applied-positioning", "applied-positioning-e1", "NO_DIRECT_NAMED_COMPETITOR", "The bounded existing-source review did not produce a direct named-competitor statement for this pair."),
    ("applied-deposition-equipment-enables-deposition", "product-category-semiconductor-deposition-equipment", "ENABLES", "technology", "technology-semiconductor-deposition", "applied-products", "applied-products-e1", "GUARDED_GATE_NOT_MET", "The source links equipment and deposition activity, but does not directly state the canonical Product-to-Technology ENABLES Relation."),
    ("tokyo-electron-produces-coater-developer", "tokyo-electron", "PRODUCES", "product", "product-category-coater-developer-equipment", "tokyo-electron-products", "tokyo-electron-products-e1", "URL_LOCATOR_NOT_REPRODUCIBLE", "The registered IR index was retrievable, but the reviewed Products and Solutions locator and product text were not reproducible on that URL."),
    ("tokyo-electron-produces-deposition-equipment", "tokyo-electron", "PRODUCES", "product", "product-category-semiconductor-deposition-equipment", "tokyo-electron-products", "tokyo-electron-products-e1", "URL_LOCATOR_NOT_REPRODUCIBLE", "The registered IR index was retrievable, but the reviewed Products and Solutions locator and product text were not reproducible on that URL."),
    ("tokyo-electron-produces-etch-equipment", "tokyo-electron", "PRODUCES", "product", "product-category-semiconductor-etch-equipment", "tokyo-electron-products", "tokyo-electron-products-e1", "URL_LOCATOR_NOT_REPRODUCIBLE", "The registered IR index was retrievable, but the reviewed Products and Solutions locator and product text were not reproducible on that URL."),
    ("tokyo-electron-produces-wafer-cleaning-equipment", "tokyo-electron", "PRODUCES", "product", "product-category-wafer-cleaning-equipment", "tokyo-electron-products", "tokyo-electron-products-e1", "URL_LOCATOR_NOT_REPRODUCIBLE", "The registered IR index was retrievable, but the reviewed Products and Solutions locator and product text were not reproducible on that URL."),
    ("tokyo-electron-positioned-in-manufacturing", "tokyo-electron", "POSITIONED_IN", "value-chain-node", "manufacturing", "tokyo-electron-value-chain", "tokyo-electron-value-chain-e1", "URL_LOCATOR_NOT_REPRODUCIBLE", "The registered IR index was retrievable, but the reviewed Products and Solutions locator and grounding text were not reproducible on that URL."),
]

FACILITY_DEFER_SPECS = [
    ("tel-operates-nirasaki", "tel-nirasaki", "tokyo-electron-manufacturing-facilities-gap-closure-technology-solutions", "tokyo-electron-manufacturing-facilities-gap-closure-technology-solutions-e1", "facilities-tel-technology-solutions-2026"),
    ("tel-operates-oshu", "tel-oshu", "tokyo-electron-manufacturing-facilities-gap-closure-technology-solutions", "tokyo-electron-manufacturing-facilities-gap-closure-technology-solutions-e1", "facilities-tel-technology-solutions-2026"),
    ("tel-operates-taiwa", "tel-taiwa", "tokyo-electron-manufacturing-facilities-gap-closure-miyagi", "tokyo-electron-manufacturing-facilities-gap-closure-miyagi-e1", "facilities-tel-miyagi-2026"),
    ("tel-operates-koshi", "tel-koshi", "tokyo-electron-manufacturing-facilities-gap-closure-kyushu", "tokyo-electron-manufacturing-facilities-gap-closure-kyushu-e1", "facilities-tel-kyushu-2026"),
]


def make_relation_and_candidate(
    relation_id: str,
    subject_type: str,
    subject_id: str,
    relation_type: str,
    object_type: str,
    object_id: str,
    scope: dict[str, Any],
    statement: str,
    claim: dict[str, Any],
    company_binding: dict[str, Any],
    source: dict[str, Any],
    display_priority: int,
    claim_type: str | None = None,
    confidence: str | None = None,
    verification: str = "verified against the frozen Company Evidence Binding and registered Source URL",
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    effective_claim_type = claim_type or claim["claimType"]
    effective_confidence = confidence if effective_claim_type in {"atlas-analysis", "estimate"} else None
    relation = {
        "relationId": relation_id,
        "subjectType": subject_type,
        "subjectId": subject_id,
        "relationType": relation_type,
        "objectType": object_type,
        "objectId": object_id,
        "scope": scope,
        "statement": statement,
        "claimType": effective_claim_type,
        "asOf": claim["asOf"],
        "lastVerified": claim["lastVerified"],
        "nextReview": claim["nextReview"],
        "importance": claim["priority"],
        "displayPriority": display_priority,
        "confidence": effective_confidence,
        "validFrom": None,
        "validTo": None,
        "supersededBy": None,
    }
    evidence_id = "rel-evidence-" + relation_id.removeprefix("rel-")
    binding_note = (
        f"Atlas mapping rationale: frozen Claim {claim['id']} places the Company in the canonical Value Chain node; "
        f"direct source support is reused from Company Evidence Binding {company_binding['id']}."
        if relation_type == "POSITIONED_IN"
        else f"Direct Relation support reuses frozen Company Evidence Binding {company_binding['id']}."
    )
    binding = {
        "id": evidence_id,
        "relationId": relation_id,
        "sourceId": company_binding["sourceId"],
        "support": "supports",
        "locator": deepcopy(company_binding["locator"]),
        "lastChecked": company_binding["lastChecked"],
        "notes": binding_note,
    }
    candidate = {
        "candidateId": "candidate-" + relation_id.removeprefix("rel-"),
        "subjectType": subject_type,
        "subjectId": subject_id,
        "relationType": relation_type,
        "objectType": object_type,
        "objectId": object_id,
        "proposedScope": deepcopy(scope),
        "supportingClaimIds": [claim["id"]],
        "supportingCompanyEvidenceBindingIds": [company_binding["id"]],
        "sharedSourceIds": [source["id"]],
        "reviewedLocator": deepcopy(company_binding["locator"]),
        "proposedClaimType": effective_claim_type,
        "proposedImportance": claim["priority"],
        "proposedDisplayPriority": display_priority,
        "decision": "include",
        "reasonCode": "PUBLIC_GATE_PASS",
        "reviewNote": "Canonical endpoints, direct supports Binding, registered Shared Source, structured Locator, and Company-wide scope are all present.",
        "existingUrlVerificationResult": verification,
        "companyWideScopeEstablished": True,
        "guardedPublicGateResult": "pass" if relation_type in {"ENABLES", "SUPPLIES_TO"} else "not-guarded",
        "reviewedAt": REVIEWED_AT,
        "relationId": relation_id,
        "relationEvidenceBindingIds": [evidence_id],
    }
    return relation, binding, candidate


def build_relations_and_candidates() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    claims, company_bindings, _ = load_company_evidence()
    sources = load_manifest_records("source-registry-manifest.json", ())
    products = {record["id"]: record for record in load_json(DATA / "product-registry-v01.json")["records"]}
    relations: list[dict[str, Any]] = []
    bindings: list[dict[str, Any]] = []
    candidates: list[dict[str, Any]] = []

    for company_id, product_id, claim_id, binding_id, priority in PRODUCT_SPECS:
        product = products[product_id]
        relation_id = f"rel-{company_id}-produces-{product_id.removeprefix('product-category-')}"
        statement = f"{COMPANY_LABELS[company_id]}は{product['canonicalName']}を提供する。"
        relation, binding, candidate = make_relation_and_candidate(
            relation_id, "company", company_id, "PRODUCES", "product", product_id,
            empty_scope(), statement, claims[claim_id], company_bindings[binding_id],
            sources[company_bindings[binding_id]["sourceId"]], priority,
            claim_type="fact",
        )
        relations.append(relation); bindings.append(binding); candidates.append(candidate)

    for company_id, node_id, claim_id, binding_id, confidence in POSITION_SPECS:
        relation_id = f"rel-{company_id}-positioned-in-{node_id}"
        statement = f"Atlasでは{COMPANY_LABELS[company_id]}をValue Chainの{node_id}に位置付ける。"
        relation, binding, candidate = make_relation_and_candidate(
            relation_id, "company", company_id, "POSITIONED_IN", "value-chain-node", node_id,
            empty_scope(valueChainNodeIds=[node_id]), statement, claims[claim_id], company_bindings[binding_id],
            sources[company_bindings[binding_id]["sourceId"]], 10,
            claim_type="atlas-analysis", confidence=confidence,
        )
        relations.append(relation); bindings.append(binding); candidates.append(candidate)

    for spec in COMPETITION_SPECS:
        relation_id = f"rel-{spec['subjectId']}-competes-with-{spec['objectId']}"
        relation, binding, candidate = make_relation_and_candidate(
            relation_id, "company", spec["subjectId"], "COMPETES_WITH", "company", spec["objectId"],
            spec["scope"], spec["statement"], claims[spec["claimId"]], company_bindings[spec["bindingId"]],
            sources[company_bindings[spec["bindingId"]]["sourceId"]], spec["displayPriority"],
            claim_type="fact", verification=spec["verification"],
        )
        relations.append(relation); bindings.append(binding); candidates.append(candidate)

    for candidate_id, subject_id, relation_type, object_type, object_id, claim_id, binding_id, reason_code, note in DEFERRED_SPECS:
        claim = claims[claim_id]
        company_binding = company_bindings[binding_id]
        is_company_subject = subject_id in PILOT_SETS["set-a"] + PILOT_SETS["set-b"]
        candidates.append({
            "candidateId": "candidate-" + candidate_id,
            "subjectType": "company" if is_company_subject else "product",
            "subjectId": subject_id,
            "relationType": relation_type,
            "objectType": object_type,
            "objectId": object_id,
            "proposedScope": empty_scope(),
            "supportingClaimIds": [claim_id],
            "supportingCompanyEvidenceBindingIds": [binding_id],
            "sharedSourceIds": [company_binding["sourceId"]],
            "reviewedLocator": deepcopy(company_binding["locator"]),
            "proposedClaimType": claim["claimType"],
            "proposedImportance": claim["priority"],
            "proposedDisplayPriority": 50,
            "decision": "defer",
            "reasonCode": reason_code,
            "reviewNote": note,
            "existingUrlVerificationResult": "registered URL and frozen locator reviewed; public-gate predicate or binding requirement remains unmet",
            "companyWideScopeEstablished": False if reason_code in {"CLAIM_BINDING_MISMATCH", "GUARDED_GATE_NOT_MET"} else True,
            "guardedPublicGateResult": "fail" if relation_type in {"ENABLES", "SUPPLIES_TO"} else "not-guarded",
            "reviewedAt": REVIEWED_AT,
            "relationId": None,
            "relationEvidenceBindingIds": [],
        })

    for candidate_id, facility_id, claim_id, binding_id, source_id in FACILITY_DEFER_SPECS:
        facility_binding = company_bindings[binding_id]
        if facility_binding["sourceId"] != source_id:
            raise ValueError(f"{candidate_id}: Facility source does not match Company Evidence Binding")
        candidates.append({
            "candidateId": "candidate-" + candidate_id,
            "subjectType": "company",
            "subjectId": "tokyo-electron",
            "relationType": "OPERATES",
            "objectType": "facility",
            "objectId": facility_id,
            "proposedScope": empty_scope(),
            "supportingClaimIds": [claim_id],
            "supportingCompanyEvidenceBindingIds": [binding_id],
            "sharedSourceIds": [source_id],
            "reviewedLocator": deepcopy(facility_binding["locator"]),
            "proposedClaimType": "fact",
            "proposedImportance": "P2",
            "proposedDisplayPriority": 50,
            "decision": "defer",
            "reasonCode": "SUBSIDIARY_SCOPE_REQUIRES_CHANGE_CONTROL",
            "reviewNote": "The Facility is operated by a named Tokyo Electron subsidiary. v0.1 forbids free-text businessUnit and defers Relations that do not hold unambiguously at the Company endpoint.",
            "existingUrlVerificationResult": "registered official facility URL reviewed; subsidiary-level operator is explicit",
            "companyWideScopeEstablished": False,
            "guardedPublicGateResult": "not-guarded",
            "reviewedAt": REVIEWED_AT,
            "relationId": None,
            "relationEvidenceBindingIds": [],
        })

    relations.sort(key=lambda record: record["relationId"])
    bindings.sort(key=lambda record: record["id"])
    candidates.sort(key=lambda record: record["candidateId"])
    referenced_claims = sorted({claim_id for candidate in candidates for claim_id in candidate["supportingClaimIds"]})
    referenced_bindings = sorted({binding_id for candidate in candidates for binding_id in candidate["supportingCompanyEvidenceBindingIds"]})
    referenced_sources = sorted({source_id for candidate in candidates for source_id in candidate["sharedSourceIds"]})
    digest_payload = {
        "companies": [load_json(DATA / "companies" / f"{company_id}.json") for company_id in PILOT_SETS["set-a"] + PILOT_SETS["set-b"]],
        "claims": [claims[claim_id] for claim_id in referenced_claims],
        "bindings": [company_bindings[binding_id] for binding_id in referenced_bindings],
        "sources": [sources[source_id] for source_id in referenced_sources],
        "productRegistry": load_json(DATA / "product-registry-v01.json"),
        "technologyRegistry": load_json(DATA / "technology-registry-v01.json"),
        "marketRegistry": load_json(DATA / "market-registry-v01.json"),
        "valueChain": load_json(DATA / "value-chain.json"),
        "facilities": load_json(DATA / "facilities.json"),
    }
    digest = hashlib.sha256(stable_json(digest_payload).encode("utf-8")).hexdigest()
    decision_counts = {decision: sum(candidate["decision"] == decision for candidate in candidates) for decision in ("include", "defer", "reject")}
    type_counts = {
        relation_type: {
            decision: sum(candidate["relationType"] == relation_type and candidate["decision"] == decision for candidate in candidates)
            for decision in ("include", "defer", "reject")
        }
        for relation_type in sorted({candidate["relationType"] for candidate in candidates})
    }
    summary = {
        "candidateCount": len(candidates),
        "decisionCounts": decision_counts,
        "includedRelationCount": len(relations),
        "relationEvidenceBindingCount": len(bindings),
        "includedRelationTypeCounts": {relation_type: sum(relation["relationType"] == relation_type for relation in relations) for relation_type in sorted({relation["relationType"] for relation in relations})},
        "candidateTypeDecisionCounts": type_counts,
        "reasonCodeCounts": dict(sorted(Counter(candidate["reasonCode"] for candidate in candidates).items())),
        "includedSubjectCompanyCounts": {
            company_id: sum(relation["subjectType"] == "company" and relation["subjectId"] == company_id for relation in relations)
            for company_id in PILOT_SETS["set-a"] + PILOT_SETS["set-b"]
        },
        "includedInvolvedCompanyCounts": {
            company_id: sum(
                (relation["subjectType"] == "company" and relation["subjectId"] == company_id)
                or (relation["objectType"] == "company" and relation["objectId"] == company_id)
                for relation in relations
            )
            for company_id in PILOT_SETS["set-a"] + PILOT_SETS["set-b"]
        },
        "guarded": {
            "ENABLES": {"reviewed": sum(candidate["relationType"] == "ENABLES" for candidate in candidates), "included": sum(candidate["relationType"] == "ENABLES" and candidate["decision"] == "include" for candidate in candidates)},
            "SUPPLIES_TO": {"reviewed": 0, "included": 0, "note": "No canonical Company/Market candidate with a direct existing Claim/Binding was present in the bounded Pilot corpus."},
        },
        "unsupportedDeferredTypesAuthored": 0,
        "marketEndpointCandidates": 0,
    }
    return relations, bindings, candidates, {"inputDigest": digest, "summary": summary}


DIMENSION_POLICY = {
    "company-identity": {"p1Categories": [], "p2Categories": {}},
    "ai-role": {"p1Categories": ["ai-infrastructure-role"], "p2Categories": {}},
    "value-chain-position": {"p1Categories": ["value-chain-position"], "p2Categories": {}},
    "key-products": {"p1Categories": ["products"], "p2Categories": {}},
    "technology-moat": {"p1Categories": ["competitive-positioning"], "p2Categories": {"technology": 10}},
    "capacity-roadmap": {"p1Categories": [], "p2Categories": {"capacity-expansion": 10, "strategy": 20}},
    "financial": {"p1Categories": [], "p2Categories": {}},
    "key-risks": {"p1Categories": [], "p2Categories": {"risks": 10}},
    "evidence-trace": {"p1Categories": [], "p2Categories": {}},
}


def choose_p2(claims: list[dict[str, Any]], category_priorities: dict[str, int]) -> list[dict[str, Any]]:
    eligible = [
        claim for claim in claims
        if claim.get("priority") == "P2"
        and claim.get("category") in category_priorities
        and isinstance(claim.get("asOf"), str) and claim["asOf"]
        and isinstance(claim.get("id"), str) and claim["id"]
    ]
    eligible.sort(key=lambda claim: (category_priorities[claim["category"]], -int(claim["asOf"].replace("-", "")), claim["id"]))
    return eligible[:1]


def coverage_for_dimension(company_id: str, dimension_id: str, coverage: list[dict[str, Any]]) -> list[dict[str, str]]:
    categories = DIMENSION_POLICY[dimension_id]["p1Categories"] + list(DIMENSION_POLICY[dimension_id]["p2Categories"])
    return [
        {"category": record["category"], "collectionStatus": record["collectionStatus"]}
        for record in coverage
        if record["companyId"] == company_id and record["category"] in categories
    ]


def metric_period_kind(metric: dict[str, Any]) -> str:
    text = str(metric.get("period") or "").lower()
    basis = str(metric.get("basis") or "").lower()
    import re
    if re.search(r"q[1-4]|quarter|四半期", text):
        return "quarterly"
    if re.search(r"ttm|ltm", text) or re.search(r"ttm|ltm", basis):
        return "ttm"
    if re.search(r"fy|fiscal year|通期|年度", text):
        return "annual"
    return "unknown"


def metric_basis_family(metric: dict[str, Any]) -> str:
    import re
    text = str(metric.get("basis") or "").lower()
    if re.search(r"non.?gaap|adjusted|調整後", text):
        return "adjusted"
    if "ifrs" in text:
        return "ifrs"
    if "gaap" in text:
        return "gaap"
    if "atlas" in text:
        return "atlas"
    if re.search(r"reported|company disclosed|会社開示", text):
        return "reported"
    return text


def assess_metric(metric_id: str, company_records: list[dict[str, Any]]) -> dict[str, Any]:
    entries = [record.get("metrics", {}).get(metric_id) for record in company_records]
    entries = [metric for metric in entries if metric and metric.get("value") is not None]
    if len(entries) < 2:
        return {"code": "blocked", "reasons": ["2社以上に値がありません"]}
    definition_ids = {metric.get("definitionId") for metric in entries if metric.get("definitionId")}
    if len(definition_ids) > 1:
        return {"code": "blocked", "reasons": ["指標定義が異なります"]}
    kinds = {metric_period_kind(metric) for metric in entries} - {"unknown"}
    if len(kinds) > 1:
        return {"code": "blocked", "reasons": ["四半期・通期・TTMなど期間区分が混在しています"]}
    reasons: list[str] = []
    if len({metric.get("period") for metric in entries if metric.get("period")}) > 1:
        reasons.append("対象期間が異なる")
    if len({metric_basis_family(metric) for metric in entries if metric_basis_family(metric)}) > 1:
        reasons.append("算出基準が異なる")
    if any(metric.get("verificationStatus") and metric.get("verificationStatus") != "verified" for metric in entries):
        reasons.append("検証状態に注意")
    return {"code": "caution", "reasons": reasons} if reasons else {"code": "ok", "reasons": ["同一定義・同一期間"]}


def build_projection(relations: list[dict[str, Any]], bindings: list[dict[str, Any]]) -> dict[str, Any]:
    claims_by_id, company_bindings, coverage = load_company_evidence()
    claims_by_company: dict[str, list[dict[str, Any]]] = {}
    for claim in claims_by_id.values():
        claims_by_company.setdefault(claim["companyId"], []).append(claim)
    relation_ids_by_company: dict[str, list[str]] = {}
    for relation in relations:
        for endpoint_type, endpoint_id in ((relation["subjectType"], relation["subjectId"]), (relation["objectType"], relation["objectId"])):
            if endpoint_type == "company":
                relation_ids_by_company.setdefault(endpoint_id, []).append(relation["relationId"])
    binding_ids_by_relation: dict[str, list[str]] = {}
    source_ids_by_relation: dict[str, list[str]] = {}
    for binding in bindings:
        binding_ids_by_relation.setdefault(binding["relationId"], []).append(binding["id"])
        source_ids_by_relation.setdefault(binding["relationId"], []).append(binding["sourceId"])

    sets: list[dict[str, Any]] = []
    for set_id, company_ids in PILOT_SETS.items():
        company_records = [load_json(DATA / "companies" / f"{company_id}.json") for company_id in company_ids]
        companies: list[dict[str, Any]] = []
        for company_id in company_ids:
            company_claims = claims_by_company[company_id]
            dimensions: list[dict[str, Any]] = []
            all_initial_claim_ids: list[str] = []
            for dimension_id, policy in DIMENSION_POLICY.items():
                p1_claims = sorted(
                    [claim for claim in company_claims if claim["priority"] == "P1" and claim["category"] in policy["p1Categories"]],
                    key=lambda claim: claim["id"],
                )
                p2_claims = choose_p2(company_claims, policy["p2Categories"])
                initial_claim_ids = [claim["id"] for claim in p1_claims + p2_claims]
                if dimension_id == "company-identity":
                    status = "present"
                elif dimension_id == "financial":
                    status = "present"
                elif dimension_id == "evidence-trace":
                    status = "present"
                else:
                    status = "present" if initial_claim_ids else "missing"
                relation_ids = []
                if dimension_id == "value-chain-position":
                    relation_ids = sorted(relation["relationId"] for relation in relations if relation["subjectId"] == company_id and relation["relationType"] == "POSITIONED_IN")
                elif dimension_id == "key-products":
                    relation_ids = sorted(relation["relationId"] for relation in relations if relation["subjectId"] == company_id and relation["relationType"] == "PRODUCES")
                coverage_context = coverage_for_dimension(company_id, dimension_id, coverage)
                if status == "present":
                    missing_state = "not-missing"
                    missing_reason = None
                else:
                    statuses = [record["collectionStatus"] for record in coverage_context]
                    missing_state = "not-started" if statuses and all(item == "not-started" for item in statuses) else "not-projected"
                    missing_reason = "no-eligible-initial-claim-or-relation"
                dimensions.append({
                    "dimensionId": dimension_id,
                    "initialClaimIds": initial_claim_ids,
                    "initialRelationIds": relation_ids,
                    "projectionStatus": status,
                    "missingState": missing_state,
                    "missingReason": missing_reason,
                    "coverageContext": coverage_context,
                    "supplementalP2": bool(p2_claims),
                })
                all_initial_claim_ids.extend(initial_claim_ids)
            all_relation_ids = sorted(set(relation_ids_by_company.get(company_id, [])))
            evidence_ids = sorted({evidence_id for claim_id in all_initial_claim_ids for evidence_id in claims_by_id[claim_id]["evidenceIds"]})
            source_ids = sorted({company_bindings[evidence_id]["sourceId"] for evidence_id in evidence_ids})
            relation_evidence_ids = sorted({evidence_id for relation_id in all_relation_ids for evidence_id in binding_ids_by_relation.get(relation_id, [])})
            relation_source_ids = sorted({source_id for relation_id in all_relation_ids for source_id in source_ids_by_relation.get(relation_id, [])})
            companies.append({
                "companyId": company_id,
                "dimensions": dimensions,
                "evidenceTrace": {
                    "companyEvidenceBindingIds": evidence_ids,
                    "companyEvidenceSourceIds": source_ids,
                    "relationIds": all_relation_ids,
                    "relationEvidenceBindingIds": relation_evidence_ids,
                    "relationSourceIds": relation_source_ids,
                },
            })
        sets.append({
            "setId": set_id,
            "orderedCompanyIds": company_ids,
            "companies": companies,
            "financial": {
                "initialMetricIds": ["operatingMargin", "revenueGrowth"],
                "expandedMetricIds": ["roic", "financial-history"],
                "comparisonPolicyId": "existing-compare-compatibility-v01",
                "metricStates": [
                    {
                        "metricId": metric_id,
                        "companyMetricRefs": [{"companyId": company_id, "metricId": metric_id} for company_id in company_ids],
                        "compatibility": assess_metric(metric_id, company_records),
                    }
                    for metric_id in ("operatingMargin", "revenueGrowth")
                ],
                "prohibitedOperations": ["difference-rate", "fx-conversion", "ranking"],
            },
        })
    return {
        "schemaVersion": "0.1",
        "baselineMain": BASELINE_MAIN,
        "pilotCompanyIds": PILOT_SETS["set-a"] + PILOT_SETS["set-b"],
        "policy": {
            "dimensionOrder": list(DIMENSION_POLICY),
            "dimensionClaimMapping": DIMENSION_POLICY,
            "p2TieBreak": ["displayPriority:asc", "asOf:desc", "claimId:asc"],
            "p2MaxPerCompanyDimension": 1,
            "p3InitialCount": 0,
            "missingnessSource": "Company Evidence Coverage plus projection availability",
            "relationSource": "resolved Relation read model",
            "identitySource": "Company canonical record",
            "financialInitialMetricIds": ["operatingMargin", "revenueGrowth"],
        },
        "sets": sets,
    }


def render_audit_md(audit: dict[str, Any]) -> str:
    summary = audit["summary"]
    rows = []
    for relation_type, counts in summary["candidateTypeDecisionCounts"].items():
        rows.append(f"| {relation_type} | {counts['include']} | {counts['defer']} | {counts['reject']} |")
    return f"""# Phase 8 Pilot Relation Candidate Audit v0.1

Status: **Complete — bounded Pilot review**  
Baseline main: `{audit['baselineMain']}`  
Input digest: `{audit['inputDigest']}`

## Scope and decision rule

Set A is `nvidia → broadcom`; Set B is `applied-materials → lam-research → tokyo-electron`. Every explicit candidate was reviewed against the current Claim, frozen Company Evidence Binding, registered Shared Source, structured Locator, canonical endpoint, and Company-wide scope. `include` means every public gate passed; `defer` preserves a plausible candidate without publishing it; `reject` is reserved for a semantically invalid candidate. No search engine or new Source was used.

| Relation type | Include | Defer | Reject |
| --- | ---: | ---: | ---: |
{chr(10).join(rows)}

- Candidates: {summary['candidateCount']}
- Include / Defer / Reject: {summary['decisionCounts']['include']} / {summary['decisionCounts']['defer']} / {summary['decisionCounts']['reject']}
- Published Relations / Relation Evidence Bindings: {summary['includedRelationCount']} / {summary['relationEvidenceBindingCount']}
- Guarded `ENABLES`: reviewed {summary['guarded']['ENABLES']['reviewed']}, included {summary['guarded']['ENABLES']['included']}
- Guarded `SUPPLIES_TO`: reviewed {summary['guarded']['SUPPLIES_TO']['reviewed']}, included {summary['guarded']['SUPPLIES_TO']['included']}
- Deferred Relation types authored: 0
- Market endpoint candidates: 0

## Bounded source review

The registered Lam Research FY2025 Form 10-K was opened directly and its Competition section verified named competition with Applied Materials in deposition and with Tokyo Electron in etch and wet clean. Those two scoped `COMPETES_WITH` candidates passed. NVIDIA's registered filing names Broadcom, but the frozen Claim/Binding selected for the candidate does not bind that named-competitor statement; because Company Evidence may not be changed here, the Set A candidate is deferred. Tokyo Electron's registered IR index responded, but the Products and Solutions locator and grounding text were not reproducible on that URL, so its four `PRODUCES` candidates and one `POSITIONED_IN` candidate are deferred. Its four Facility candidates also remain deferred because the official pages identify subsidiary operators and v0.1 has no Company-scope registry.

`ENABLES` and `SUPPLIES_TO` remain guarded and may validly publish zero records. Co-occurrence, taxonomy similarity, legacy competitor arrays, and brand names were not converted into Relations.

## Broad and narrow Product protection

WFE and narrower deposition, etch, cleaning, and coater/developer categories coexist without hierarchy. No parent-child hierarchy, implicit Relation derivation, roll-up, aggregation, or deduplication is performed in either direction. A future hierarchy requires a separate Schema change.

## Artifact authority

The full record-level audit is [`phase8-pilot-relation-candidate-audit-v01.json`](./phase8-pilot-relation-candidate-audit-v01.json). Included records alone are authored into `src/data/relationships.json` and `src/data/relation-evidence-bindings-v01.json`.
"""


def render_implementation_md(audit: dict[str, Any], projection: dict[str, Any]) -> str:
    relation_counts = ", ".join(f"{key} {value}" for key, value in audit["summary"]["includedRelationTypeCounts"].items())
    claims, _, _ = load_company_evidence()
    initial_claim_ids = [
        claim_id
        for set_record in projection["sets"]
        for company in set_record["companies"]
        for dimension in company["dimensions"]
        for claim_id in dimension["initialClaimIds"]
    ]
    initial_priority_counts = {
        priority: sum(claims[claim_id]["priority"] == priority for claim_id in initial_claim_ids)
        for priority in ("P1", "P2", "P3")
    }
    missing_dimensions = sum(
        dimension["projectionStatus"] != "present"
        for set_record in projection["sets"]
        for company in set_record["companies"]
        for dimension in company["dimensions"]
    )
    financial_states = {
        state: sum(
            metric["compatibility"]["code"] == state
            for set_record in projection["sets"]
            for metric in set_record["financial"]["metricStates"]
        )
        for state in ("ok", "caution", "blocked")
    }
    return f"""# Phase 8 Pilot Relation / Projection Data v0.1

Status: **Draft implementation — data only, not merged**  
Baseline main: `{BASELINE_MAIN}`

## Outputs

- Relation authoring records: {audit['summary']['includedRelationCount']} ({relation_counts})
- Relation Evidence Bindings: {audit['summary']['relationEvidenceBindingCount']}
- Guarded `ENABLES` / `SUPPLIES_TO`: 0 / 0
- Pilot presets: Set A `nvidia → broadcom`; Set B `applied-materials → lam-research → tokyo-electron`
- Initial Financial: `operatingMargin`, `revenueGrowth` only
- Initial P1 / P2 / P3: {initial_priority_counts['P1']} / {initial_priority_counts['P2']} / {initial_priority_counts['P3']}
- Missing projected dimensions: {missing_dimensions}
- Financial compatibility `ok / caution / blocked`: {financial_states['ok']} / {financial_states['caution']} / {financial_states['blocked']}

## Projection contract

The canonical projection is `src/data/company-compare-evidence-pilot-v01.json`. It stores canonical IDs and derived missing/projection states; it does not duplicate Claim statements or financial values. P1 category mapping is explicit. Eligible P2 is selected at most once per company and dimension by policy `displayPriority` ascending, Claim `asOf` descending, then `claimId` ascending. A Claim missing required metadata is ineligible. The projection policy priority is placement metadata and does not alter Claim priority or Coverage.

Relations are referenced by Relation ID and resolved through the accepted Relation loader. Evidence trace retains Claim → Company Evidence Binding → Source and Relation → Relation Evidence Binding → Source chains. Missingness is derived from Coverage context plus projection availability; underlying records are never deleted.

Financial compatibility uses the existing Compare rules: fewer than two values, mismatched definitions, or mixed period kinds block comparison; period, basis, or verification differences produce caution. ROIC and absolute financial history are expanded-only. No FX conversion, ranking, difference-rate calculation, or new metric is introduced.

## Guardrails

No UI, route, component, style, workflow, Schema, Registry, Company, Company Evidence Claim/Binding/Coverage, Shared Source, Facility, Value Chain, or financial record/logic is changed. Browser QA is not applicable because this PR has no visible output. WFE and narrower equipment categories have no implicit hierarchy or roll-up.

## Validation

`build-phase8-pilot-relation-data.py --check` protects generated freshness. `validate-phase8-pilot-relation-data.py` audits candidate completeness, public gates, Relation/Binding correspondence, guarded-zero behavior, projection mapping, P2/P3 policy, evidence trace, Financial allowlist, Pilot ordering, and protected baseline counts. Synthetic tests cover P2 tie-break/exclusion, all-missing retention, Relation zero, and guarded zero.
"""


def build_artifacts() -> dict[Path, str]:
    relations, bindings, candidates, meta = build_relations_and_candidates()
    projection = build_projection(relations, bindings)
    audit = {
        "schemaVersion": "0.1",
        "baselineMain": BASELINE_MAIN,
        "reviewedAt": REVIEWED_AT,
        "sets": [{"setId": set_id, "orderedCompanyIds": ids} for set_id, ids in PILOT_SETS.items()],
        "inputDigest": meta["inputDigest"],
        "reviewMethod": {
            "corpus": "repository-only",
            "searchEngineUsed": False,
            "newSourcesAdded": False,
            "registeredUrlVerification": "direct-open only",
            "publicGate": ["canonical endpoints", "direct supports Relation Binding", "existing Shared Source", "structured Locator", "Company-wide scope"],
        },
        "summary": meta["summary"],
        "candidates": candidates,
    }
    return {
        RELATION_PATH: pretty_json(relations),
        BINDING_PATH: pretty_json(bindings),
        AUDIT_JSON_PATH: pretty_json(audit),
        AUDIT_MD_PATH: render_audit_md(audit),
        PROJECTION_PATH: pretty_json(projection),
        IMPLEMENTATION_MD_PATH: render_implementation_md(audit, projection),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write == args.check:
        parser.error("choose exactly one of --write or --check")
    artifacts = build_artifacts()
    if args.write:
        for path, content in artifacts.items():
            path.write_text(content, encoding="utf-8", newline="\n")
        print(f"Phase 8 Pilot Relation data written: {len(artifacts)} artifacts")
        return 0
    stale = [str(path.relative_to(ROOT)) for path, content in artifacts.items() if not path.exists() or path.read_text(encoding="utf-8") != content]
    if stale:
        print("Phase 8 Pilot Relation data freshness FAILED")
        for path in stale:
            print(" -", path)
        return 1
    print(f"Phase 8 Pilot Relation data freshness OK: {len(artifacts)} artifacts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
