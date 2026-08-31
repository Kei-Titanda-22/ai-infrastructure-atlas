#!/usr/bin/env python3
"""Validate the frozen Company Evidence v0.2 contract without mutating data."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FREEZE_DOC = ROOT / "docs/company-evidence-freeze-v01.md"
SCHEMA_PATH = ROOT / "docs/company-evidence-schema-v02.json"
DATA_PATH = ROOT / "src/data/company-evidence-pilot-v02.json"
MANIFEST_PATH = ROOT / "src/data/source-registry-manifest.json"
RESOLVER_PATH = ROOT / "src/lib/source-registry.ts"
FRESHNESS_PATH = ROOT / "src/lib/evidence-freshness.ts"
CLAIM_COMPONENT_PATH = ROOT / "src/components/CompanyEvidenceClaim.astro"
CLAIMS_COMPONENT_PATH = ROOT / "src/components/CompanyEvidenceClaims.astro"
COMPANY_PAGE_PATH = ROOT / "src/pages/companies/[id].astro"
PILOT_STYLE_PATH = ROOT / "src/styles/company-evidence-v02.css"
HUMAN_TEST_ASSETS = [
    ROOT / "docs/company-evidence-human-test-protocol-v01.md",
    ROOT / "docs/company-evidence-human-test-answer-key-v01.md",
    ROOT / "docs/company-evidence-human-test-results-template-v01.md",
    ROOT / "docs/company-evidence-human-test-results-template-v01.csv",
]

EXPECTED_SCHEMA_VERSION = "0.2"
EXPECTED_BASELINE_SHA = "c265ed91c306bf5461eb8d056179c8de589c2245"
CLAIM_TYPES = {"fact", "company-guidance", "company-positioning", "atlas-analysis", "estimate"}
PRIORITIES = {"P1", "P2", "P3"}
VERIFY = {"verified", "source-linked", "needs-review"}
SUPPORT = {"supports", "context", "contradicts"}
COLLECTION = {"complete", "partial", "not-started"}
MISSING = {"not-collected", "primary-source-unchecked", "not-disclosed", "not-applicable"}
LOCATORS = {"page", "section", "heading", "table", "note", "anchor", "quotedLabel"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fail(errors: list[str], message: str):
    errors.append(message)


def duplicates(values: list[str | None]) -> list[str]:
    return sorted(value for value, count in Counter(values).items() if value and count > 1)


def enum(schema: dict, definition: str, property_name: str) -> set[str]:
    return set(schema["$defs"][definition]["properties"][property_name]["enum"])


def main() -> int:
    errors: list[str] = []
    required_files = [
        FREEZE_DOC, SCHEMA_PATH, DATA_PATH, MANIFEST_PATH, RESOLVER_PATH,
        FRESHNESS_PATH, CLAIM_COMPONENT_PATH, CLAIMS_COMPONENT_PATH,
        COMPANY_PAGE_PATH, PILOT_STYLE_PATH, *HUMAN_TEST_ASSETS,
    ]
    for path in required_files:
        if not path.exists():
            fail(errors, f"required Freeze artifact is missing: {path.relative_to(ROOT)}")
    if errors:
        return report(errors)

    freeze_doc = FREEZE_DOC.read_text(encoding="utf-8")
    schema = load(SCHEMA_PATH)
    data = load(DATA_PATH)

    required_freeze_terms = [
        "Freeze decision: **YES**",
        EXPECTED_BASELINE_SHA,
        "Frozen Company Evidence Schema version: `0.2`",
        "Company Claim → Evidence Binding → Shared Source Registry",
        "One information level has at most one Disclosure",
        "Human Test executed: **NO**",
        "100-company Company Evidence Coverage Audit",
        "fromCompanyId",
        "toCompanyId",
        "evidenceSourceIds",
        "backward compatibility",
        "version bump",
    ]
    for term in required_freeze_terms:
        if term not in freeze_doc:
            fail(errors, f"Freeze document is missing required contract text: {term}")

    schema_version = schema.get("properties", {}).get("schemaVersion", {}).get("const")
    if schema_version != EXPECTED_SCHEMA_VERSION or data.get("schemaVersion") != EXPECTED_SCHEMA_VERSION:
        fail(errors, "Schema artifact and Company Evidence data must remain on frozen version 0.2")
    expected_enums = [
        ("claim", "claimType", CLAIM_TYPES),
        ("claim", "priority", PRIORITIES),
        ("claim", "verificationStatus", VERIFY),
        ("evidenceBinding", "support", SUPPORT),
        ("coverageRecord", "collectionStatus", COLLECTION),
        ("coverageRecord", "missingStatus", MISSING),
    ]
    for definition, property_name, expected in expected_enums:
        if enum(schema, definition, property_name) != expected:
            fail(errors, f"frozen enum changed: {definition}.{property_name}")
    locator_schema = set(schema["$defs"]["locator"]["properties"])
    if locator_schema != LOCATORS:
        fail(errors, "frozen Locator fields changed")

    company_ids = {path.stem for path in (ROOT / "src/data/companies").glob("*.json")}
    manifest = load(MANIFEST_PATH)
    manifest_shards = manifest.get("shards", [])
    expected_shards = sorted(path.name for path in (ROOT / "src/data").glob("*sources*.json") if "policies" not in path.name)
    if sorted(manifest_shards) != expected_shards:
        fail(errors, "Shared Source Registry manifest does not match Source shards")

    source_records: dict[str, dict] = {}
    source_ids: set[str] = set()
    for shard in manifest_shards:
        path = ROOT / "src/data" / shard
        if not path.exists():
            fail(errors, f"Source shard is missing: {shard}")
            continue
        records = load(path)
        if not isinstance(records, list):
            fail(errors, f"Source shard must contain an array: {shard}")
            continue
        for record in records:
            source_id = record.get("id") if isinstance(record, dict) else None
            if not source_id:
                fail(errors, f"Source record without ID in {shard}")
                continue
            previous = source_records.get(source_id)
            if previous and (previous.get("url") != record.get("url") or previous.get("companyId") != record.get("companyId")):
                fail(errors, f"conflicting Shared Source ID: {source_id}")
            source_records[source_id] = record
            source_ids.add(source_id)

    policies: dict[str, dict] = {}
    for path in (ROOT / "src/data").glob("*policies*.json"):
        records = load(path)
        if isinstance(records, list):
            for record in records:
                if isinstance(record, dict) and record.get("sourceId"):
                    policies[record["sourceId"]] = record

    claims = data.get("claims", [])
    evidence = data.get("evidence", [])
    coverage = data.get("coverage", [])
    claim_ids = [claim.get("id") for claim in claims]
    evidence_ids = [binding.get("id") for binding in evidence]
    for label, values in (("Claim", claim_ids), ("Evidence Binding", evidence_ids)):
        repeated = duplicates(values)
        if repeated:
            fail(errors, f"duplicate {label} IDs: {repeated}")
    claim_by_id = {claim.get("id"): claim for claim in claims}
    evidence_by_id = {binding.get("id"): binding for binding in evidence}

    for claim in claims:
        claim_id = claim.get("id", "<missing>")
        if claim.get("companyId") not in company_ids:
            fail(errors, f"{claim_id}: unknown Company ID")
        if claim.get("claimType") not in CLAIM_TYPES:
            fail(errors, f"{claim_id}: invalid claimType")
        if claim.get("priority") not in PRIORITIES:
            fail(errors, f"{claim_id}: invalid priority")
        if claim.get("verificationStatus") not in VERIFY:
            fail(errors, f"{claim_id}: invalid Verification Status")
        if claim.get("claimType") in {"atlas-analysis", "estimate"} and claim.get("confidence") not in {"low", "medium", "high"}:
            fail(errors, f"{claim_id}: Atlas Analysis/estimate requires confidence")
        if claim.get("claimType") == "fact" and claim.get("confidence"):
            fail(errors, f"{claim_id}: fact must not carry analysis confidence")
        ids = claim.get("evidenceIds")
        if not isinstance(ids, list) or len(ids) != len(set(ids)):
            fail(errors, f"{claim_id}: evidenceIds must be a unique array")
            ids = ids or []
        if claim.get("verificationStatus") in {"verified", "source-linked"} and not ids:
            fail(errors, f"{claim_id}: linked status requires Evidence")
        for evidence_id in ids:
            binding = evidence_by_id.get(evidence_id)
            if not binding:
                fail(errors, f"{claim_id}: unknown Evidence Binding {evidence_id}")
            elif binding.get("claimId") != claim_id:
                fail(errors, f"{claim_id}: Evidence Binding points to another Claim")

    evidence_signatures: set[tuple[str, str, str]] = set()
    for binding in evidence:
        evidence_id = binding.get("id", "<missing>")
        claim = claim_by_id.get(binding.get("claimId"))
        if not claim:
            fail(errors, f"{evidence_id}: orphan Evidence Binding")
        if binding.get("sourceId") not in source_ids:
            fail(errors, f"{evidence_id}: unknown Shared Source ID")
        if binding.get("support") not in SUPPORT:
            fail(errors, f"{evidence_id}: invalid support value")
        locator = binding.get("locator")
        if not isinstance(locator, dict) or not locator or set(locator) - LOCATORS or any(not isinstance(value, str) or not value.strip() for value in (locator or {}).values()):
            fail(errors, f"{evidence_id}: invalid structured Locator")
            locator = locator or {}
        signature = (str(binding.get("claimId")), str(binding.get("sourceId")), json.dumps(locator, sort_keys=True, ensure_ascii=False))
        if signature in evidence_signatures:
            fail(errors, f"{evidence_id}: duplicate Claim/Source/Locator binding")
        evidence_signatures.add(signature)
        if claim and claim.get("verificationStatus") == "verified":
            if binding.get("support") != "supports":
                fail(errors, f"{evidence_id}: verified Claim requires supports Evidence")
            if policies.get(binding.get("sourceId"), {}).get("reviewStatus") != "reviewed":
                fail(errors, f"{evidence_id}: verified Claim requires reviewed Source Policy")

    coverage_keys: set[tuple[str, str]] = set()
    categories = set(schema["$defs"]["category"]["enum"])
    for item in coverage:
        key = (item.get("companyId"), item.get("category"))
        if key in coverage_keys:
            fail(errors, f"duplicate Coverage record: {key}")
        coverage_keys.add(key)
        if key[0] not in company_ids or key[1] not in categories:
            fail(errors, f"invalid Coverage Company/category: {key}")
        if item.get("collectionStatus") not in COLLECTION:
            fail(errors, f"{key}: invalid collectionStatus")
        missing = item.get("missingStatus")
        if missing is not None and missing not in MISSING:
            fail(errors, f"{key}: invalid Missing Status")
        if item.get("collectionStatus") == "not-started" and missing not in MISSING:
            fail(errors, f"{key}: not-started requires Missing Status")
        if item.get("collectionStatus") == "partial" and missing is not None and not item.get("notes"):
            fail(errors, f"{key}: partial + Missing Status requires notes")

    resolver = RESOLVER_PATH.read_text(encoding="utf-8")
    freshness = FRESHNESS_PATH.read_text(encoding="utf-8")
    claim_component = CLAIM_COMPONENT_PATH.read_text(encoding="utf-8")
    claims_component = CLAIMS_COMPONENT_PATH.read_text(encoding="utf-8")
    company_page = COMPANY_PAGE_PATH.read_text(encoding="utf-8")
    pilot_style = PILOT_STYLE_PATH.read_text(encoding="utf-8")

    if "source-registry-manifest.json" not in resolver or "publishedAt: source.publishedAt ?? null" not in resolver:
        fail(errors, "Shared Source resolver contract changed")
    if "deriveEvidenceFreshness" not in freshness or "deriveEvidenceFreshness" not in claim_component:
        fail(errors, "Company Evidence must use the shared Freshness helper")
    if "2026-08-31T00:00:00Z" in claim_component:
        fail(errors, "Company Evidence component must not hard-code a reference date")

    supplement = re.search(r'<details class="pilot-research-supplement">(.*?)</details>', company_page, re.DOTALL)
    if not supplement:
        fail(errors, "Supplementary Research disclosure is missing")
    else:
        body = supplement.group(1)
        claim_groups = body.count("<CompanyEvidenceClaims")
        if "<details" in body or claim_groups == 0 or body.count("flattenSecondary") != claim_groups:
            fail(errors, "Supplementary Research must render content directly with one disclosure level")
    if "secondaryClaims.length > 0 && flattenSecondary" not in claims_component or "pilot-claim-stack-flat" not in claims_component:
        fail(errors, "flattenSecondary regression guard is missing")

    evidence_hooks = [
        'class="evidence-marker"', "data-evidence-open", 'aria-haspopup="dialog"',
        'class="evidence-drawer"', 'class="source-open"', "一次資料を開く",
        "min-width:2.75rem", "min-height:2.75rem",
    ]
    for hook in evidence_hooks:
        if hook not in claim_component:
            fail(errors, f"Evidence UX hook is missing: {hook}")
    for hook in ("event.key === 'Escape'", "trigger?.focus()", "dialog.showModal()"):
        if hook not in company_page:
            fail(errors, f"Evidence drawer interaction hook is missing: {hook}")

    page_hooks = ["source-bibliography", "pilot-snapshot-rail", "pilot-analysis-label", "Atlasによる分析"]
    for hook in page_hooks:
        if hook not in company_page and hook not in pilot_style:
            fail(errors, f"frozen Company page hook is missing: {hook}")
    if re.search(r"\.pilot-claim-analysis\s*\{[^}]*border-left", claim_component + "\n" + pilot_style, re.DOTALL):
        fail(errors, "Atlas Analysis Claim-side border must remain absent")
    if ".evidence-pilot .pilot-claim-topline { display: none; }" not in pilot_style:
        fail(errors, "repeated Claim-level epistemic labels must remain visually suppressed in Pilot UI")

    if errors:
        return report(errors)
    print(
        "Company Evidence Freeze v0.1 validation passed: "
        f"Schema {EXPECTED_SCHEMA_VERSION} / {len(claims)} Claims / "
        f"{len(evidence)} Evidence Bindings / {len(source_ids)} Shared Sources / "
        "generic regression contract active"
    )
    return 0


def report(errors: list[str]) -> int:
    print("Company Evidence Freeze validation FAILED", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
