#!/usr/bin/env python3
"""Validate the five-company Evidence UX Pilot without mutating repository data."""

from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PILOT = ROOT / "src/data/company-evidence-pilot-v01.json"
PILOT_COMPANIES = {"nvidia", "tsmc", "applied-materials", "fujikura", "vertiv"}
CATEGORIES = {
    "company-overview", "ai-infrastructure-role", "products", "technology",
    "value-chain-position", "manufacturing-facilities", "capacity-expansion",
    "customer-end-market", "competitive-positioning", "strategy", "risks",
}
CLAIM_TYPES = {"fact", "company-guidance", "company-positioning", "atlas-analysis", "estimate"}
PRIORITIES = {"P1", "P2", "P3"}
VERIFY = {"verified", "source-linked", "needs-review"}
COLLECTION = {"complete", "partial", "not-started"}
MISSING = {"not-collected", "primary-source-unchecked", "not-disclosed", "not-applicable"}
LOCATORS = {"page", "section", "heading", "table", "note", "anchor", "quotedLabel"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fail(errors: list[str], message: str):
    errors.append(message)


def changed_paths() -> list[str]:
    commands = [
        ["git", "diff", "--name-only", "origin/main...HEAD"],
        ["git", "diff", "--name-only"],
        ["git", "diff", "--name-only", "--cached"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ]
    names: set[str] = set()
    for command in commands:
        result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, check=False)
        if result.returncode == 0:
            names.update(line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip())
    return sorted(names)


def main() -> int:
    errors: list[str] = []
    data = load(PILOT)
    claims = data.get("claims", [])
    evidence = data.get("evidence", [])
    coverage = data.get("coverage", [])
    pilot_source_ids = {binding.get("sourceId") for binding in evidence if binding.get("sourceId")}

    if data.get("schemaVersion") != "0.1":
        fail(errors, "schemaVersion must remain 0.1 during the Pilot")

    company_ids = {path.stem for path in (ROOT / "src/data/companies").glob("*.json")}
    source_ids: set[str] = set()
    duplicate_sources: set[str] = set()
    for path in (ROOT / "src/data").glob("*sources*.json"):
        if "policies" in path.name:
            continue
        try:
            records = load(path)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if not isinstance(records, list):
            continue
        for record in records:
            source_id = record.get("id") if isinstance(record, dict) else None
            if source_id:
                if source_id in source_ids:
                    duplicate_sources.add(source_id)
                source_ids.add(source_id)
    pilot_duplicate_sources = duplicate_sources & pilot_source_ids
    if pilot_duplicate_sources:
        fail(errors, f"Pilot uses duplicate source IDs: {sorted(pilot_duplicate_sources)}")

    policies: dict[str, dict] = {}
    for path in (ROOT / "src/data").glob("*policies*.json"):
        try:
            records = load(path)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if isinstance(records, list):
            for record in records:
                if isinstance(record, dict) and record.get("sourceId"):
                    policies[record["sourceId"]] = record

    claim_ids = [claim.get("id") for claim in claims]
    evidence_ids = [binding.get("id") for binding in evidence]
    for label, values in (("claim", claim_ids), ("evidence", evidence_ids)):
        dupes = sorted(value for value, count in Counter(values).items() if value and count > 1)
        if dupes:
            fail(errors, f"duplicate {label} IDs: {dupes}")
    claim_by_id = {claim.get("id"): claim for claim in claims}
    evidence_by_id = {binding.get("id"): binding for binding in evidence}

    if {claim.get("companyId") for claim in claims} != PILOT_COMPANIES:
        fail(errors, "claims must cover exactly the five fixed Pilot companies")

    for claim in claims:
        cid = claim.get("id", "<missing>")
        company_id = claim.get("companyId")
        if company_id not in company_ids or company_id not in PILOT_COMPANIES:
            fail(errors, f"{cid}: unknown or non-Pilot companyId {company_id}")
        if claim.get("category") not in CATEGORIES:
            fail(errors, f"{cid}: invalid category")
        if claim.get("claimType") not in CLAIM_TYPES:
            fail(errors, f"{cid}: invalid claimType")
        if claim.get("priority") not in PRIORITIES:
            fail(errors, f"{cid}: invalid priority")
        if claim.get("verificationStatus") not in VERIFY:
            fail(errors, f"{cid}: invalid verificationStatus")
        if claim.get("claimType") in {"atlas-analysis", "estimate"} and claim.get("confidence") not in {"low", "medium", "high"}:
            fail(errors, f"{cid}: analysis/estimate requires confidence")
        if claim.get("claimType") == "fact" and claim.get("confidence"):
            fail(errors, f"{cid}: fact must not masquerade as an analysis confidence score")
        ids = claim.get("evidenceIds")
        if not isinstance(ids, list) or len(ids) != len(set(ids)):
            fail(errors, f"{cid}: evidenceIds must be a unique array")
            ids = ids or []
        if claim.get("verificationStatus") in {"verified", "source-linked"} and not ids:
            fail(errors, f"{cid}: linked status requires evidence")
        for evidence_id in ids:
            binding = evidence_by_id.get(evidence_id)
            if not binding:
                fail(errors, f"{cid}: unknown evidence ID {evidence_id}")
            elif binding.get("claimId") != cid:
                fail(errors, f"{cid}: evidence {evidence_id} points to another claim")

    evidence_tuples: set[tuple] = set()
    for binding in evidence:
        eid = binding.get("id", "<missing>")
        claim = claim_by_id.get(binding.get("claimId"))
        if not claim:
            fail(errors, f"{eid}: orphan evidence")
        if binding.get("sourceId") not in source_ids:
            fail(errors, f"{eid}: unknown sourceId {binding.get('sourceId')}")
        if binding.get("support") not in {"supports", "context", "contradicts"}:
            fail(errors, f"{eid}: invalid support")
        locator = binding.get("locator")
        if not isinstance(locator, dict) or not locator or set(locator) - LOCATORS or any(not isinstance(value, str) or not value.strip() for value in (locator or {}).values()):
            fail(errors, f"{eid}: locator must contain only non-empty allowed fields")
        signature = (binding.get("claimId"), binding.get("sourceId"), json.dumps(locator, sort_keys=True, ensure_ascii=False))
        if signature in evidence_tuples:
            fail(errors, f"{eid}: duplicate claim/source/locator binding")
        evidence_tuples.add(signature)
        if claim and claim.get("verificationStatus") == "verified":
            if binding.get("support") != "supports":
                fail(errors, f"{eid}: verified claim requires supports evidence")
            if policies.get(binding.get("sourceId"), {}).get("reviewStatus") != "reviewed":
                fail(errors, f"{eid}: verified claim uses a Source Policy that is not reviewed")

    coverage_keys: set[tuple[str, str]] = set()
    for item in coverage:
        key = (item.get("companyId"), item.get("category"))
        if key in coverage_keys:
            fail(errors, f"duplicate coverage record {key}")
        coverage_keys.add(key)
        if key[0] not in PILOT_COMPANIES or key[1] not in CATEGORIES:
            fail(errors, f"invalid coverage record {key}")
        if item.get("collectionStatus") not in COLLECTION:
            fail(errors, f"{key}: invalid collectionStatus")
        if item.get("missingStatus") is not None and item.get("missingStatus") not in MISSING:
            fail(errors, f"{key}: invalid missingStatus")
        if item.get("collectionStatus") == "not-started" and item.get("missingStatus") not in MISSING:
            fail(errors, f"{key}: not-started requires missingStatus")
    expected_coverage = {(company_id, category) for company_id in PILOT_COMPANIES for category in CATEGORIES}
    if coverage_keys != expected_coverage:
        fail(errors, f"coverage must contain all 55 company/category pairs; missing={sorted(expected_coverage - coverage_keys)}")

    forbidden = []
    for path in changed_paths():
        if path.startswith("src/data/companies/") or path.startswith("src/data/financial-history") or "cashflow-overrides" in path or path in {"src/data/claims.json", "src/data/facilities.json", "src/data/relationships.json"}:
            forbidden.append(path)
    if forbidden:
        fail(errors, f"changes outside Pilot scope: {forbidden}")

    # Legacy narrative remains read-only and cannot be promoted automatically.
    if any(claim.get("verificationStatus") == "verified" for claim in claims):
        print("NOTE: verified claims exist; Source Policy checks were enforced")
    else:
        print("NOTE: 0 verified claims: all Pilot Source Policies remain pending; no legacy field was auto-promoted")

    if errors:
        print("Company Evidence Pilot validation FAILED", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Company Evidence Pilot validation passed: {len(claims)} claims, {len(evidence)} evidence bindings, {len(coverage)} coverage records, {len(pilot_source_ids)} sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
