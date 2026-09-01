#!/usr/bin/env python3
"""Validate the governed, human-authored Company Evidence triage validation audit.

This script reproduces the 81-record stratified sample and validates the
committed audit artifact. It deliberately does not make source-meaning or
classification decisions.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TRIAGE_PATH = ROOT / "docs" / "company-evidence-gap-triage-v01.json"
AUDIT_PATH = ROOT / "docs" / "company-evidence-triage-validation-v01.json"

SAMPLE_SEED = "triage-validation-v01"
TRIAGE_VALUES = (
    "ACTIONABLE",
    "SUFFICIENT_PARTIAL",
    "NOT_DISCLOSED",
    "NOT_APPLICABLE",
    "DEFERRED",
    "REVIEW_REQUIRED",
)
SEVERITY_VALUES = ("NONE", "MINOR", "MATERIAL", "CRITICAL")

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
DEFERRED_QUOTAS = {
    "manufacturing-facilities": 6,
    "capacity-expansion": 6,
    "customer-end-market": 6,
    "strategy": 6,
}
EXPECTED_STRATA = {
    "SUFFICIENT_PARTIAL": 24,
    "DEFERRED": 24,
    "NOT_APPLICABLE": 28,
    "NOT_DISCLOSED": 5,
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(path: Path) -> str:
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def sample_hash(record: dict[str, Any]) -> str:
    value = f'{record["companyId"]}:{record["category"]}:{SAMPLE_SEED}'
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def select_sample(triage: dict[str, Any]) -> list[dict[str, Any]]:
    current = [
        record
        for record in triage["records"]
        if record.get("currentGap") and record.get("currentClassification")
    ]
    selected: list[dict[str, Any]] = []

    def take(classification: str, category: str, quota: int) -> None:
        population = [
            record
            for record in current
            if record["currentClassification"] == classification
            and record["category"] == category
        ]
        population.sort(key=lambda record: (sample_hash(record), record["id"]))
        selected.extend(population[: min(quota, len(population))])

    for category, quota in SUFFICIENT_PARTIAL_QUOTAS.items():
        take("SUFFICIENT_PARTIAL", category, quota)
    for category, quota in DEFERRED_QUOTAS.items():
        take("DEFERRED", category, quota)

    for classification in ("NOT_APPLICABLE", "NOT_DISCLOSED"):
        population = [
            record
            for record in current
            if record["currentClassification"] == classification
        ]
        population.sort(key=lambda record: (sample_hash(record), record["id"]))
        selected.extend(population)

    return selected


def expected_records(triage: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "sampleIndex": index,
            "sampleId": record["id"],
            "sampleHash": sample_hash(record),
            "stratum": record["currentClassification"],
            "companyId": record["companyId"],
            "companyName": record["companyName"],
            "category": record["category"],
            "originalClassification": record["currentClassification"],
        }
        for index, record in enumerate(select_sample(triage), start=1)
    ]


def require_string(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"missing/non-string {field}")


def validate_source(source: Any, record_id: str, errors: list[str]) -> None:
    if not isinstance(source, dict):
        errors.append(f"{record_id}: sourcesChecked entry is not an object")
        return
    for field in ("sourceId", "publisher", "title", "url", "reviewRole"):
        require_string(source.get(field), f"{record_id}.sourcesChecked[].{field}", errors)
    if source.get("sourceKind") not in {"existing-shared-source", "annual-report-or-filing", "targeted-official-source"}:
        errors.append(f"{record_id}: invalid sourceKind {source.get('sourceKind')!r}")
    if source.get("primarySource") is not True:
        errors.append(f"{record_id}: source review must use primarySource=true")


def validate_artifact(triage: dict[str, Any], audit: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    expected = expected_records(triage)
    records = audit.get("records")
    if not isinstance(records, list):
        return ["records must be an array"]

    required_top = (
        "schemaVersion",
        "baselineMain",
        "triageInputDigest",
        "sampleSeed",
        "sampleMethod",
        "sampleCount",
        "strata",
        "records",
        "materialMismatchCount",
        "criticalMismatchCount",
        "systemicPatterns",
        "remediation",
        "hardStop",
        "finalDecision",
    )
    for field in required_top:
        if field not in audit:
            errors.append(f"missing top-level field {field}")

    if audit.get("schemaVersion") != "0.1":
        errors.append("schemaVersion must be 0.1")
    if audit.get("sampleSeed") != SAMPLE_SEED:
        errors.append(f"sampleSeed must be {SAMPLE_SEED}")
    require_string(audit.get("baselineMain"), "baselineMain", errors)
    if isinstance(audit.get("baselineMain"), str) and (
        len(audit["baselineMain"]) != 40
        or any(character not in "0123456789abcdef" for character in audit["baselineMain"])
    ):
        errors.append("baselineMain must be a 40-character lowercase git SHA")
    require_string(audit.get("sampleMethod"), "sampleMethod", errors)
    if audit.get("triageInputDigest") != sha256_bytes(TRIAGE_PATH):
        errors.append("triageInputDigest is stale")
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
        sources = record.get("sourcesChecked")
        if not isinstance(sources, list) or not sources:
            errors.append(f"{record_id}: sourcesChecked must be a non-empty array")
        else:
            for source in sources:
                validate_source(source, record_id, errors)
        evidence = record.get("evidenceReviewed")
        if not isinstance(evidence, dict):
            errors.append(f"{record_id}: evidenceReviewed must be an object")
        else:
            for field in ("claimIds", "evidenceBindingIds"):
                if not isinstance(evidence.get(field), list):
                    errors.append(f"{record_id}: evidenceReviewed.{field} must be an array")
            if not isinstance(evidence.get("structuredLocatorCount"), int):
                errors.append(f"{record_id}: structuredLocatorCount must be an integer")

    actual_ids = [record.get("sampleId") for record in records]
    expected_ids = [record["sampleId"] for record in expected]
    if actual_ids != expected_ids:
        errors.append("record order does not match deterministic sample order")

    strata = Counter(record.get("stratum") for record in records)
    if dict(strata) != EXPECTED_STRATA:
        errors.append(f"strata distribution must be {EXPECTED_STRATA}, got {dict(strata)}")
    artifact_strata = audit.get("strata")
    if artifact_strata != EXPECTED_STRATA:
        errors.append("top-level strata summary mismatch")

    for classification, quotas in (
        ("SUFFICIENT_PARTIAL", SUFFICIENT_PARTIAL_QUOTAS),
        ("DEFERRED", DEFERRED_QUOTAS),
    ):
        for category, quota in quotas.items():
            population = sum(
                record.get("currentGap")
                and record.get("currentClassification") == classification
                and record.get("category") == category
                for record in triage["records"]
            )
            expected_quota = min(quota, population)
            actual_quota = sum(
                record.get("stratum") == classification
                and record.get("category") == category
                for record in records
            )
            if actual_quota != expected_quota:
                errors.append(
                    f"{classification}/{category}: expected quota {expected_quota}, got {actual_quota}"
                )

    severity_counts = Counter(record.get("severity") for record in records)
    exact_count = sum(record.get("matchStatus") == "exact" for record in records)
    minor_count = severity_counts["MINOR"]
    material_count = severity_counts["MATERIAL"]
    critical_count = severity_counts["CRITICAL"]
    summary = audit.get("summary", {})
    expected_summary = {
        "exactMatches": exact_count,
        "minorMismatches": minor_count,
        "materialMismatches": material_count,
        "criticalMismatches": critical_count,
    }
    if summary != expected_summary:
        errors.append(f"summary must be {expected_summary}")
    if audit.get("materialMismatchCount") != material_count:
        errors.append("materialMismatchCount mismatch")
    if audit.get("criticalMismatchCount") != critical_count:
        errors.append("criticalMismatchCount mismatch")

    for field in ("systemicPatterns",):
        if not isinstance(audit.get(field), list):
            errors.append(f"{field} must be an array")
    remediation = audit.get("remediation")
    if not isinstance(remediation, dict):
        errors.append("remediation must be an object")
    else:
        for field in ("required", "cycles", "rulesCorrected", "recordsReclassified", "newActionableFound", "newActionableProcessed"):
            if field not in remediation:
                errors.append(f"remediation missing {field}")
    decision = audit.get("finalDecision")
    if decision not in {"PASS", "HARD_STOP"}:
        errors.append("finalDecision must be PASS or HARD_STOP")
    if decision == "PASS":
        if critical_count != 0:
            errors.append("PASS requires CRITICAL=0")
        if material_count > 3:
            errors.append("PASS requires MATERIAL<=3")
        if audit.get("systemicPatterns"):
            errors.append("PASS requires no unresolved systemicPatterns")
    material_rate = material_count / len(records) if records else 0.0
    hard_stop = audit.get("hardStop")
    if not isinstance(hard_stop, dict):
        errors.append("hardStop must be an object")
    else:
        if hard_stop.get("triggered") != (decision == "HARD_STOP"):
            errors.append("hardStop.triggered must match finalDecision")
        if not isinstance(hard_stop.get("materialRate"), (int, float)):
            errors.append("hardStop.materialRate must be numeric")
        elif abs(float(hard_stop["materialRate"]) - material_rate) > 0.000001:
            errors.append("hardStop.materialRate mismatch")
    if material_rate > 0.10 and decision != "HARD_STOP":
        errors.append("MATERIAL rate over 10% requires HARD_STOP")
    if decision == "HARD_STOP":
        if material_rate <= 0.10 and critical_count == 0:
            errors.append("HARD_STOP requires a recorded hard-stop threshold")
        if not audit.get("systemicPatterns"):
            errors.append("HARD_STOP requires at least one systemicPattern")
        if isinstance(remediation, dict) and (
            remediation.get("cycles") != 0
            or remediation.get("newActionableProcessed") != 0
            or remediation.get("recordsReclassified") != 0
        ):
            errors.append("HARD_STOP artifact must not claim remediation work")

    return errors


def print_sample(triage: dict[str, Any]) -> None:
    sample = expected_records(triage)
    populations: dict[tuple[str, str], int] = defaultdict(int)
    for record in triage["records"]:
        if record.get("currentGap") and record.get("currentClassification"):
            populations[(record["currentClassification"], record["category"])] += 1
    for record in sample:
        population = populations[(record["stratum"], record["category"])]
        print(
            f'{record["sampleIndex"]:02d}\t{record["stratum"]}\t{record["category"]}\t'
            f'{record["companyId"]}\t{record["companyName"]}\t{record["sampleHash"][:12]}\tN={population}'
        )
    print(f"Sample count: {len(sample)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="validate the committed audit artifact")
    parser.add_argument("--print-sample", action="store_true", help="print the deterministic sample without interpreting it")
    args = parser.parse_args()
    if args.check == args.print_sample:
        parser.error("choose exactly one of --check or --print-sample")

    triage = load_json(TRIAGE_PATH)
    sample = expected_records(triage)
    if len(sample) != 81:
        print(f"expected 81 sampled records, got {len(sample)}", file=sys.stderr)
        return 1
    if args.print_sample:
        print_sample(triage)
        return 0
    if not AUDIT_PATH.exists():
        print(f"missing {AUDIT_PATH.relative_to(ROOT)}", file=sys.stderr)
        return 1
    audit = load_json(AUDIT_PATH)
    errors = validate_artifact(triage, audit)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(
        "Triage validation audit OK: "
        f'{audit["sampleCount"]} records / exact {audit["summary"]["exactMatches"]} / '
        f'MINOR {audit["summary"]["minorMismatches"]} / MATERIAL {audit["materialMismatchCount"]} / '
        f'CRITICAL {audit["criticalMismatchCount"]} / {audit["finalDecision"]}'
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
