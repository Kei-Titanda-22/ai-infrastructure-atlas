#!/usr/bin/env python3
"""Validate the five-company Evidence UX Pilot without mutating repository data."""

from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PILOT = ROOT / "src/data/company-evidence-pilot-v02.json"
SCHEMA = ROOT / "docs/company-evidence-schema-v02.json"
SOURCE_MANIFEST = ROOT / "src/data/source-registry-manifest.json"
SOURCE_RESOLVER = ROOT / "src/lib/source-registry.ts"
FRESHNESS_HELPER = ROOT / "src/lib/evidence-freshness.ts"
EVIDENCE_COMPONENT = ROOT / "src/components/CompanyEvidenceClaim.astro"
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

    if data.get("schemaVersion") != "0.2":
        fail(errors, "schemaVersion must be 0.2 for the Pilot revision")
    schema = load(SCHEMA)
    if schema.get("properties", {}).get("schemaVersion", {}).get("const") != "0.2":
        fail(errors, "v0.2 schema must require schemaVersion 0.2")

    manifest = load(SOURCE_MANIFEST)
    manifest_shards = manifest.get("shards", [])
    expected_shards = sorted(path.name for path in (ROOT / "src/data").glob("*sources*.json") if "policies" not in path.name)
    if sorted(manifest_shards) != expected_shards:
        fail(errors, f"Source Registry manifest mismatch: missing={sorted(set(expected_shards) - set(manifest_shards))}, extra={sorted(set(manifest_shards) - set(expected_shards))}")
    if not SOURCE_RESOLVER.exists() or "source-registry-manifest.json" not in SOURCE_RESOLVER.read_text(encoding="utf-8"):
        fail(errors, "shared Source resolver must load the Source Registry manifest")
    freshness_text = FRESHNESS_HELPER.read_text(encoding="utf-8") if FRESHNESS_HELPER.exists() else ""
    component_text = EVIDENCE_COMPONENT.read_text(encoding="utf-8") if EVIDENCE_COMPONENT.exists() else ""
    if "deriveEvidenceFreshness" not in freshness_text or "deriveEvidenceFreshness" not in component_text:
        fail(errors, "Evidence freshness must be derived by the shared helper")
    if "2026-08-31T00:00:00Z" in component_text:
        fail(errors, "Evidence component must not contain a component-local reference date")

    company_ids = {path.stem for path in (ROOT / "src/data/companies").glob("*.json")}
    source_ids: set[str] = set()
    source_records: dict[str, dict] = {}
    conflicting_sources: set[str] = set()
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
                previous = source_records.get(source_id)
                if previous and (previous.get("url") != record.get("url") or previous.get("companyId") != record.get("companyId")):
                    conflicting_sources.add(source_id)
                source_records[source_id] = record
                source_ids.add(source_id)
    pilot_conflicting_sources = conflicting_sources & pilot_source_ids
    if pilot_conflicting_sources:
        fail(errors, f"Pilot uses conflicting duplicate source IDs: {sorted(pilot_conflicting_sources)}")

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
    priority_counts = Counter(claim.get("priority") for claim in claims)
    if priority_counts != Counter({"P1": 25, "P2": 9, "P3": 4}):
        fail(errors, f"unexpected v0.2 priority counts: {dict(priority_counts)}")
    for company_id in PILOT_COMPANIES:
        company_p1 = [claim for claim in claims if claim.get("companyId") == company_id and claim.get("priority") == "P1"]
        if len(company_p1) != 5:
            fail(errors, f"{company_id}: expected five P1 claims after revision")
        if not any(claim.get("category") in {"competitive-positioning", "technology"} and claim.get("claimType") == "company-positioning" for claim in company_p1):
            fail(errors, f"{company_id}: P1 must include an explicitly labeled company-positioning claim")

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
        if item.get("collectionStatus") == "partial" and item.get("missingStatus") is not None and not item.get("notes"):
            fail(errors, f"{key}: partial + missingStatus requires explanatory notes")
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
    print(f"Company Evidence v0.2 Pilot validation passed: {len(claims)} claims, {len(evidence)} evidence bindings, {len(coverage)} coverage records, {len(pilot_source_ids)} sources, P1/P2/P3={priority_counts['P1']}/{priority_counts['P2']}/{priority_counts['P3']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
