#!/usr/bin/env python3
"""Validate the human-authored Company Evidence Triage Validation v0.2.

This checker reproduces the deterministic sample and validates artifact,
source-registry, Claim/Evidence, Locator, summary, freshness, and gate
consistency. It deliberately does not infer source meaning or classifications.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TRIAGE_PATH = ROOT / "docs" / "company-evidence-gap-triage-v02.json"
TRIAGE_V01_PATH = ROOT / "docs" / "company-evidence-gap-triage-v01.json"
AUDIT_PATH = ROOT / "docs" / "company-evidence-triage-validation-v02.json"
SOURCE_MANIFEST_PATH = ROOT / "src" / "data" / "source-registry-manifest.json"
EVIDENCE_MANIFEST_PATH = ROOT / "src" / "data" / "company-evidence-manifest.json"

SAMPLE_SEED = "triage-validation-v02"
TRIAGE_VALUES = (
    "ACTIONABLE",
    "SUFFICIENT_PARTIAL",
    "NOT_DISCLOSED",
    "NOT_APPLICABLE",
    "DEFERRED",
    "REVIEW_REQUIRED",
)
SEVERITY_VALUES = ("NONE", "MINOR", "MATERIAL", "CRITICAL")
SOURCE_KINDS = (
    "existing-shared-source",
    "annual-report-or-filing",
    "targeted-official-source",
)

SUFFICIENT_PARTIAL_QUOTAS = {
    "ai-infrastructure-role": 4,
    "technology": 4,
    "competitive-positioning": 4,
    "risks": 4,
    "customer-end-market": 2,
    "strategy": 2,
    "capacity-expansion": 2,
    "company-overview": 1,
    "manufacturing-facilities": 1,
}
REMEDIATED_FORMER_DEFERRED_QUOTAS = {
    "manufacturing-facilities": 6,
    "capacity-expansion": 6,
    "customer-end-market": 6,
    "strategy": 6,
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(path: Path) -> str:
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def sample_hash(record: dict[str, Any]) -> str:
    value = f'{record["companyId"]}:{record["category"]}:{SAMPLE_SEED}'
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def current_records(triage: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        record
        for record in triage["records"]
        if record.get("currentGap") and record.get("currentClassification")
    ]


def select_sample(triage: dict[str, Any], triage_v01: dict[str, Any]) -> list[dict[str, Any]]:
    current = current_records(triage)
    selected: list[dict[str, Any]] = []
    selected_ids: set[str] = set()

    def add(records: list[dict[str, Any]], stratum: str, sample_role: str) -> None:
        for record in records:
            if record["id"] in selected_ids:
                continue
            selected.append({"record": record, "stratum": stratum, "sampleRole": sample_role})
            selected_ids.add(record["id"])

    for category, quota in SUFFICIENT_PARTIAL_QUOTAS.items():
        population = [
            record for record in current
            if record["currentClassification"] == "SUFFICIENT_PARTIAL"
            and record["category"] == category
        ]
        population.sort(key=lambda record: (sample_hash(record), record["id"]))
        add(population[: min(quota, len(population))], "SUFFICIENT_PARTIAL", "base-stratified")

    deferred = [record for record in current if record["currentClassification"] == "DEFERRED"]
    deferred.sort(key=lambda record: (sample_hash(record), record["id"]))
    add(deferred[: min(24, len(deferred))], "DEFERRED", "all-remaining-if-under-24")

    for classification in ("NOT_APPLICABLE", "NOT_DISCLOSED"):
        population = [record for record in current if record["currentClassification"] == classification]
        population.sort(key=lambda record: (sample_hash(record), record["id"]))
        add(population, classification, "all-records")

    former_deferred_ids = {
        record["id"]
        for record in triage_v01["records"]
        if record.get("currentGap") and record.get("currentClassification") == "DEFERRED"
    }
    if len(former_deferred_ids) != 300:
        raise AssertionError(f"expected 300 v0.1 DEFERRED records, got {len(former_deferred_ids)}")
    for category, quota in REMEDIATED_FORMER_DEFERRED_QUOTAS.items():
        population = [
            record for record in current
            if record["id"] in former_deferred_ids
            and record["currentClassification"] == "SUFFICIENT_PARTIAL"
            and record["category"] == category
            and record["id"] not in selected_ids
        ]
        population.sort(key=lambda record: (sample_hash(record), record["id"]))
        add(
            population[: min(quota, len(population))],
            "REMEDIATED_FORMER_DEFERRED",
            "post-remediation-representation",
        )

    return selected


def expected_records(triage: dict[str, Any], triage_v01: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "sampleIndex": index,
            "sampleId": item["record"]["id"],
            "sampleHash": sample_hash(item["record"]),
            "stratum": item["stratum"],
            "sampleRole": item["sampleRole"],
            "companyId": item["record"]["companyId"],
            "companyName": item["record"]["companyName"],
            "category": item["record"]["category"],
            "originalClassification": item["record"]["currentClassification"],
        }
        for index, item in enumerate(select_sample(triage, triage_v01), start=1)
    ]


def load_sources() -> dict[str, dict[str, Any]]:
    manifest = load_json(SOURCE_MANIFEST_PATH)
    sources: dict[str, dict[str, Any]] = {}
    for shard in manifest["shards"]:
        for source in load_json(ROOT / "src" / "data" / shard):
            sources.setdefault(source["id"], source)
    return sources


def load_evidence() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    manifest = load_json(EVIDENCE_MANIFEST_PATH)
    claims: dict[str, dict[str, Any]] = {}
    bindings: dict[str, dict[str, Any]] = {}
    for shard in manifest["shards"]:
        payload = load_json(ROOT / "src" / "data" / shard)
        for claim in payload.get("claims", []):
            claims[claim["id"]] = claim
        for binding in payload.get("evidence", []):
            bindings[binding["id"]] = binding
    return claims, bindings


def expected_evidence(
    company_id: str,
    category: str,
    claims: dict[str, dict[str, Any]],
    bindings: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    claim_ids = sorted(
        claim_id for claim_id, claim in claims.items()
        if claim.get("companyId") == company_id and claim.get("category") == category
    )
    claim_set = set(claim_ids)
    binding_ids = sorted(
        binding_id for binding_id, binding in bindings.items()
        if binding.get("claimId") in claim_set
    )
    locator_count = sum(bool(bindings[binding_id].get("locator")) for binding_id in binding_ids)
    return {
        "claimIds": claim_ids,
        "evidenceBindingIds": binding_ids,
        "structuredLocatorCount": locator_count,
    }


def require_string(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"missing/non-string {field}")


def validate_source(
    source: Any,
    record_id: str,
    registry: dict[str, dict[str, Any]],
    errors: list[str],
) -> None:
    if not isinstance(source, dict):
        errors.append(f"{record_id}: sourcesChecked entry is not an object")
        return
    for field in ("sourceId", "publisher", "title", "url", "reviewRole"):
        require_string(source.get(field), f"{record_id}.sourcesChecked[].{field}", errors)
    if source.get("sourceKind") not in SOURCE_KINDS:
        errors.append(f"{record_id}: invalid sourceKind {source.get('sourceKind')!r}")
    if source.get("primarySource") is not True:
        errors.append(f"{record_id}: source review must use primarySource=true")
    registered = registry.get(source.get("sourceId"))
    if registered is None:
        if source.get("sourceKind") != "targeted-official-source":
            errors.append(
                f"{record_id}: unregistered source {source.get('sourceId')} must be "
                "a targeted-official-source"
            )
        return
    for field in ("publisher", "title", "url"):
        if source.get(field) != registered.get(field):
            errors.append(f"{record_id}: {source.get('sourceId')}.{field} differs from Shared Source")


def validate_artifact(
    triage: dict[str, Any],
    triage_v01: dict[str, Any],
    audit: dict[str, Any],
) -> list[str]:
    errors: list[str] = []
    expected = expected_records(triage, triage_v01)
    records = audit.get("records")
    if not isinstance(records, list):
        return ["records must be an array"]
    sources = load_sources()
    claims, bindings = load_evidence()

    required_top = (
        "schemaVersion", "baselineMain", "triageInputDigest", "sampleSeed",
        "sampleMethod", "sampleCount", "strata", "records", "summary",
        "materialMismatchCount", "criticalMismatchCount", "systemicPatterns",
        "resolvedSystemicPatterns", "validationCycles", "priorRemediation",
        "remediation", "coverage", "triageDistribution", "hardStop",
        "finalDecision",
    )
    for field in required_top:
        if field not in audit:
            errors.append(f"missing top-level field {field}")
    if audit.get("schemaVersion") != "0.2":
        errors.append("schemaVersion must be 0.2")
    if audit.get("sampleSeed") != SAMPLE_SEED:
        errors.append(f"sampleSeed must be {SAMPLE_SEED}")
    if audit.get("triageInputDigest") != sha256_bytes(TRIAGE_PATH):
        errors.append("triageInputDigest is stale")
    require_string(audit.get("sampleMethod"), "sampleMethod", errors)
    baseline = audit.get("baselineMain")
    if not isinstance(baseline, str) or len(baseline) != 40 or any(c not in "0123456789abcdef" for c in baseline):
        errors.append("baselineMain must be a 40-character lowercase git SHA")
    if audit.get("sampleCount") != len(expected) or len(records) != len(expected):
        errors.append(f"sampleCount/records must equal {len(expected)}")
    if len({record.get("sampleId") for record in records}) != len(records):
        errors.append("duplicate sampleId")

    expected_by_id = {record["sampleId"]: record for record in expected}
    for index, record in enumerate(records, start=1):
        record_id = record.get("sampleId", f"record[{index}]")
        expected_record = expected_by_id.get(record_id)
        if expected_record is None:
            errors.append(f"unexpected sampleId {record_id}")
            continue
        for field, value in expected_record.items():
            if record.get(field) != value:
                errors.append(f"{record_id}: {field} must be {value!r}")
        independent = record.get("independentClassification")
        severity = record.get("severity")
        if independent not in TRIAGE_VALUES:
            errors.append(f"{record_id}: invalid independentClassification {independent!r}")
        if severity not in SEVERITY_VALUES:
            errors.append(f"{record_id}: invalid severity {severity!r}")
        exact = independent == record.get("originalClassification")
        if exact != (record.get("matchStatus") == "exact"):
            errors.append(f"{record_id}: matchStatus inconsistent with classifications")
        if exact and severity != "NONE":
            errors.append(f"{record_id}: exact match must use severity NONE")
        if not exact and severity == "NONE":
            errors.append(f"{record_id}: mismatch must have a severity")
        require_string(record.get("businessModelAssessment"), f"{record_id}.businessModelAssessment", errors)
        require_string(record.get("rationale"), f"{record_id}.rationale", errors)
        try:
            reviewed_at = date.fromisoformat(record.get("reviewedAt", ""))
            if reviewed_at > date.today():
                errors.append(f"{record_id}: reviewedAt is in the future")
        except ValueError:
            errors.append(f"{record_id}: invalid reviewedAt")
        bound = record.get("sourceReviewBound")
        if not isinstance(bound, dict):
            errors.append(f"{record_id}: sourceReviewBound must be an object")
        else:
            if bound.get("targetedOfficialSourceLimit") != 2:
                errors.append(f"{record_id}: targetedOfficialSourceLimit must be 2")
            targeted_count = bound.get("targetedOfficialSourcesChecked")
            if not isinstance(targeted_count, int) or not 0 <= targeted_count <= 2:
                errors.append(f"{record_id}: targetedOfficialSourcesChecked must be an integer from 0 to 2")
            if bound.get("secondarySourcesUsed") is not False:
                errors.append(f"{record_id}: secondarySourcesUsed must be false")
        checked = record.get("sourcesChecked")
        if not isinstance(checked, list) or not checked:
            errors.append(f"{record_id}: sourcesChecked must be a non-empty array")
        else:
            if len({source.get("sourceId") for source in checked if isinstance(source, dict)}) != len(checked):
                errors.append(f"{record_id}: duplicate sourcesChecked sourceId")
            for source in checked:
                validate_source(source, record_id, sources, errors)
        expected_review = expected_evidence(record["companyId"], record["category"], claims, bindings)
        if record.get("evidenceReviewed") != expected_review:
            errors.append(f"{record_id}: evidenceReviewed does not match repository Claims/Evidence")

    if [record.get("sampleId") for record in records] != [record["sampleId"] for record in expected]:
        errors.append("record order does not match deterministic sample order")

    sampled_strata = Counter(record["stratum"] for record in expected)
    expected_strata = {
        "SUFFICIENT_PARTIAL": sampled_strata["SUFFICIENT_PARTIAL"],
        "DEFERRED": sampled_strata["DEFERRED"],
        "NOT_APPLICABLE": sampled_strata["NOT_APPLICABLE"],
        "NOT_DISCLOSED": sampled_strata["NOT_DISCLOSED"],
        "REMEDIATED_FORMER_DEFERRED": sampled_strata["REMEDIATED_FORMER_DEFERRED"],
    }
    if audit.get("strata") != expected_strata:
        errors.append(f"strata must be {expected_strata}")
    if expected_strata.get("SUFFICIENT_PARTIAL") != 24:
        errors.append("base SUFFICIENT_PARTIAL sample must contain 24 records")
    if expected_strata.get("REMEDIATED_FORMER_DEFERRED") != 24:
        errors.append("former-DEFERRED remediation representation must contain 24 records")
    if expected_strata.get("DEFERRED", 0) != triage["currentDistribution"]["DEFERRED"]:
        errors.append("all remaining DEFERRED records must be sampled when fewer than 24")
    if expected_strata.get("NOT_APPLICABLE", 0) != triage["currentDistribution"]["NOT_APPLICABLE"]:
        errors.append("all NOT_APPLICABLE records must be sampled")
    if expected_strata.get("NOT_DISCLOSED", 0) != triage["currentDistribution"]["NOT_DISCLOSED"]:
        errors.append("all NOT_DISCLOSED records must be sampled")

    for category, quota in REMEDIATED_FORMER_DEFERRED_QUOTAS.items():
        actual = sum(
            record.get("stratum") == "REMEDIATED_FORMER_DEFERRED"
            and record.get("category") == category
            for record in records
        )
        if actual != quota:
            errors.append(f"former-DEFERRED {category}: expected {quota}, got {actual}")

    severity_counts = Counter(record.get("severity") for record in records)
    expected_summary = {
        "exactMatches": sum(record.get("matchStatus") == "exact" for record in records),
        "minorMismatches": severity_counts["MINOR"],
        "materialMismatches": severity_counts["MATERIAL"],
        "criticalMismatches": severity_counts["CRITICAL"],
    }
    if audit.get("summary") != expected_summary:
        errors.append(f"summary must be {expected_summary}")
    material_count = severity_counts["MATERIAL"]
    critical_count = severity_counts["CRITICAL"]
    if audit.get("materialMismatchCount") != material_count:
        errors.append("materialMismatchCount mismatch")
    if audit.get("criticalMismatchCount") != critical_count:
        errors.append("criticalMismatchCount mismatch")
    if not isinstance(audit.get("systemicPatterns"), list):
        errors.append("systemicPatterns must be an array")

    resolved_patterns = audit.get("resolvedSystemicPatterns")
    if not isinstance(resolved_patterns, list):
        errors.append("resolvedSystemicPatterns must be an array")
    else:
        for index, pattern in enumerate(resolved_patterns, start=1):
            if not isinstance(pattern, dict):
                errors.append(f"resolvedSystemicPatterns[{index}] must be an object")
                continue
            for field in ("id", "finding", "affectedRecords", "correction", "verification"):
                if field not in pattern:
                    errors.append(f"resolvedSystemicPatterns[{index}] missing {field}")
            if not isinstance(pattern.get("affectedRecords"), list) or not pattern.get("affectedRecords"):
                errors.append(f"resolvedSystemicPatterns[{index}].affectedRecords must be non-empty")

    cycles = audit.get("validationCycles")
    if not isinstance(cycles, list) or len(cycles) != 3:
        errors.append("validationCycles must contain cycle 0, 1, and 2")
    else:
        expected_cycle_numbers = [0, 1, 2]
        if [cycle.get("cycle") for cycle in cycles if isinstance(cycle, dict)] != expected_cycle_numbers:
            errors.append("validationCycles must be ordered as cycle 0, 1, and 2")
        for cycle in cycles:
            if not isinstance(cycle, dict):
                errors.append("validationCycles entries must be objects")
                continue
            for field in (
                "cycle", "baselineMain", "sampleCount", "exactMatches",
                "minorMismatches", "materialMismatches", "criticalMismatches",
                "systemicPatterns", "decision",
            ):
                if field not in cycle:
                    errors.append(f"validationCycles[{cycle.get('cycle')}] missing {field}")
            if cycle.get("decision") not in {"REMEDIATE", "PASS", "HARD_STOP"}:
                errors.append(f"validationCycles[{cycle.get('cycle')}]: invalid decision")
            counts = [
                cycle.get("exactMatches"), cycle.get("minorMismatches"),
                cycle.get("materialMismatches"), cycle.get("criticalMismatches"),
            ]
            if all(isinstance(value, int) for value in counts):
                if sum(counts) != cycle.get("sampleCount"):
                    errors.append(
                        f"validationCycles[{cycle.get('cycle')}]: result counts must equal sampleCount"
                    )
            if not isinstance(cycle.get("systemicPatterns"), list):
                errors.append(f"validationCycles[{cycle.get('cycle')}].systemicPatterns must be an array")
            findings = cycle.get("findings", [])
            if not isinstance(findings, list):
                errors.append(f"validationCycles[{cycle.get('cycle')}].findings must be an array")
            else:
                for finding in findings:
                    if not isinstance(finding, dict):
                        errors.append(f"validationCycles[{cycle.get('cycle')}].findings entries must be objects")
                        continue
                    for field in ("recordId", "original", "independent", "severity", "sourceId"):
                        if field not in finding:
                            errors.append(f"validationCycles[{cycle.get('cycle')}].finding missing {field}")
                    if finding.get("sourceId") not in sources:
                        errors.append(
                            f"validationCycles[{cycle.get('cycle')}]: unknown finding sourceId "
                            f"{finding.get('sourceId')}"
                        )

    prior = audit.get("priorRemediation")
    if not isinstance(prior, dict):
        errors.append("priorRemediation must be an object")
    else:
        expected_prior = {
            "formerDeferredReReviewed": 300,
            "knownCorrectionsReviewed": 3,
            "actionableProcessed": 288,
            "actionablePending": 0,
        }
        for field, value in expected_prior.items():
            if prior.get(field) != value:
                errors.append(f"priorRemediation.{field} must be {value}")
    remediation = audit.get("remediation")
    if not isinstance(remediation, dict):
        errors.append("remediation must be an object")
    else:
        for field in (
            "required", "cycles", "rulesCorrected", "recordsReclassified",
            "newActionableFound", "newActionableProcessed", "claimsAdded",
            "evidenceAdded", "structuredLocatorsAdded", "sourcesReused",
            "sourcesAdded", "pullRequests",
        ):
            if field not in remediation:
                errors.append(f"remediation missing {field}")
        if remediation.get("required") is not True:
            errors.append("remediation.required must be true")
        if remediation.get("cycles") != 2:
            errors.append("remediation.cycles must be 2")
        if remediation.get("recordsReclassified") != 6:
            errors.append("remediation.recordsReclassified must be 6")
        if remediation.get("newActionableFound") != 5:
            errors.append("remediation.newActionableFound must be 5")
        if remediation.get("newActionableProcessed") != 5:
            errors.append("remediation.newActionableProcessed must be 5")
        for field in ("claimsAdded", "evidenceAdded", "structuredLocatorsAdded"):
            if remediation.get(field) != 5:
                errors.append(f"remediation.{field} must be 5")
        if not isinstance(remediation.get("pullRequests"), list) or len(remediation.get("pullRequests", [])) != 2:
            errors.append("remediation.pullRequests must contain the two validation-remediation PRs")

    coverage = audit.get("coverage")
    expected_coverage = {
        "beforeValidationRemediation": {"complete": 321, "partial": 738, "notStarted": 41},
        "afterValidationRemediation": {"complete": 321, "partial": 740, "notStarted": 39},
    }
    if coverage != expected_coverage:
        errors.append(f"coverage must be {expected_coverage}")

    triage_distribution = audit.get("triageDistribution")
    expected_triage_distribution = {
        "ACTIONABLE": 0,
        "SUFFICIENT_PARTIAL": 740,
        "NOT_DISCLOSED": 0,
        "NOT_APPLICABLE": 30,
        "DEFERRED": 9,
        "REVIEW_REQUIRED": 0,
    }
    if triage_distribution != expected_triage_distribution:
        errors.append(f"triageDistribution must be {expected_triage_distribution}")

    decision = audit.get("finalDecision")
    if decision not in {"PASS", "HARD_STOP"}:
        errors.append("finalDecision must be PASS or HARD_STOP")
    material_rate = material_count / len(records) if records else 0.0
    hard_stop = audit.get("hardStop")
    if not isinstance(hard_stop, dict):
        errors.append("hardStop must be an object")
    else:
        if hard_stop.get("triggered") != (decision == "HARD_STOP"):
            errors.append("hardStop.triggered must match finalDecision")
        if abs(float(hard_stop.get("materialRate", -1)) - material_rate) > 0.000001:
            errors.append("hardStop.materialRate mismatch")
    if decision == "PASS":
        if critical_count != 0:
            errors.append("PASS requires CRITICAL=0")
        if material_count > 3:
            errors.append("PASS requires MATERIAL<=3")
        if material_rate > 0.10:
            errors.append("PASS requires MATERIAL rate <=10%")
        if audit.get("systemicPatterns"):
            errors.append("PASS requires no unresolved systemicPatterns")
        if not cycles or not isinstance(cycles[-1], dict) or cycles[-1].get("decision") != "PASS":
            errors.append("PASS requires final validation cycle decision PASS")
    if decision == "HARD_STOP" and critical_count == 0 and material_rate <= 0.10:
        errors.append("HARD_STOP requires a recorded hard-stop threshold")

    return errors


def print_sample(triage: dict[str, Any], triage_v01: dict[str, Any]) -> None:
    sample = expected_records(triage, triage_v01)
    populations: dict[tuple[str, str], int] = defaultdict(int)
    for record in current_records(triage):
        populations[(record["currentClassification"], record["category"])] += 1
    for record in sample:
        print(
            f'{record["sampleIndex"]:02d}\t{record["stratum"]}\t{record["category"]}\t'
            f'{record["companyId"]}\t{record["companyName"]}\t{record["sampleHash"][:12]}\t'
            f'{record["sampleRole"]}'
        )
    print(f"Sample count: {len(sample)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--print-sample", action="store_true")
    args = parser.parse_args()
    if args.check == args.print_sample:
        parser.error("choose exactly one of --check or --print-sample")

    triage = load_json(TRIAGE_PATH)
    triage_v01 = load_json(TRIAGE_V01_PATH)
    if args.print_sample:
        print_sample(triage, triage_v01)
        return 0
    if not AUDIT_PATH.exists():
        print(f"missing {AUDIT_PATH.relative_to(ROOT)}", file=sys.stderr)
        return 1
    audit = load_json(AUDIT_PATH)
    errors = validate_artifact(triage, triage_v01, audit)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(
        "Triage validation v0.2 OK: "
        f'{audit["sampleCount"]} records / exact {audit["summary"]["exactMatches"]} / '
        f'MINOR {audit["summary"]["minorMismatches"]} / MATERIAL {audit["materialMismatchCount"]} / '
        f'CRITICAL {audit["criticalMismatchCount"]} / {audit["finalDecision"]}'
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
