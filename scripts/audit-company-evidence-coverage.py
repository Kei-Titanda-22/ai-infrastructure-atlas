#!/usr/bin/env python3
"""Generate the deterministic 100-company Company Evidence coverage audit."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DEFAULT_JSON = ROOT / "docs" / "company-evidence-coverage-audit-v01.json"
DEFAULT_MARKDOWN = ROOT / "docs" / "company-evidence-coverage-audit-v01.md"

CATEGORIES = (
    "company-overview",
    "ai-infrastructure-role",
    "products",
    "technology",
    "value-chain-position",
    "manufacturing-facilities",
    "capacity-expansion",
    "customer-end-market",
    "competitive-positioning",
    "strategy",
    "risks",
)
COVERAGE_STATUSES = ("complete", "partial", "not-started")
MISSING_STATUSES = (
    "not-collected",
    "primary-source-unchecked",
    "not-disclosed",
    "not-applicable",
)
LOCATOR_FIELDS = ("page", "section", "heading", "table", "note", "anchor", "quotedLabel")
PILOT_COMPANIES = ("nvidia", "tsmc", "applied-materials", "fujikura", "vertiv")
LEGACY_FIELDS = {
    "summary": "company-overview",
    "aiRole": "ai-infrastructure-role",
    "products": "products",
    "strengths": "competitive-positioning",
    "risks": "risks",
}
DIRECT_SOURCE_TYPE_CATEGORIES = {
    "official-product": ("products",),
    "official-product-press-release": ("products",),
    "official-facility-directory": ("manufacturing-facilities",),
    "official-corporate-profile": ("company-overview",),
}
MULTI_CATEGORY_SOURCE_TYPES = {
    "annual-report",
    "company-annual-report",
    "edinet-annual-securities-report",
    "hkex-annual-report",
    "krx-annual-business-report",
    "official-annual-report",
    "official-annual-securities-report",
    "official-corporate",
    "official-corporate-profile",
    "official-form-20-f",
    "official-investor-presentation",
    "official-ir",
    "sec-10-k",
    "sec-form-10-k",
    "sec-form-20-f",
}
CORE_LAYERS = {
    "Compute & Silicon",
    "Data Center & Facilities",
    "Foundry & Logic Manufacturing",
    "Memory",
    "Network & Optical",
    "Wafer Fab Equipment",
}
AI_RELEVANT_TAGS = {
    "GPU",
    "AI accelerator",
    "AI networking",
    "HBM",
    "NAND",
    "advanced packaging",
    "cooling",
    "data center",
    "data center cable",
    "fiber connectivity",
    "foundry",
    "optical fiber",
    "power distribution",
    "semiconductor equipment",
    "ファウンドリ",
    "先端パッケージ",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def has_content(value: Any) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(has_content(item) for item in value)
    return value is not None


def sorted_unique(values: Iterable[str | None]) -> list[str]:
    return sorted({value for value in values if isinstance(value, str) and value})


def collect_source_ids(value: Any) -> set[str]:
    found: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "sourceId" and isinstance(child, str) and child:
                found.add(child)
            elif key in {"sourceIds", "evidenceSourceIds"} and isinstance(child, list):
                found.update(item for item in child if isinstance(item, str) and item)
            else:
                found.update(collect_source_ids(child))
    elif isinstance(value, list):
        for child in value:
            found.update(collect_source_ids(child))
    return found


def normalized_digest(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths, key=lambda item: item.relative_to(ROOT).as_posix()):
        relative = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(text.encode("utf-8"))
        digest.update(b"\0")
    return f"sha256:{digest.hexdigest()}"


def parse_date(value: Any) -> date | None:
    if not isinstance(value, str) or len(value) < 10:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def collect_observation_dates(value: Any, parent_key: str = "") -> list[date]:
    dates: list[date] = []
    allowed = {"retrievedAt", "publishedAt", "lastReviewed", "asOf", "lastVerified", "lastChecked", "verifiedAt", "endDate"}
    if isinstance(value, dict):
        for key, child in value.items():
            if key in allowed:
                parsed = parse_date(child)
                if parsed:
                    dates.append(parsed)
            dates.extend(collect_observation_dates(child, key))
    elif isinstance(value, list):
        for child in value:
            dates.extend(collect_observation_dates(child, parent_key))
    return dates


def load_sources(manifest: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]], dict[str, Any], list[Path]]:
    all_records: list[dict[str, Any]] = []
    canonical: dict[str, dict[str, Any]] = {}
    occurrences: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    shard_paths: list[Path] = []
    for shard in manifest["shards"]:
        path = DATA / shard
        shard_paths.append(path)
        records = load_json(path)
        if not isinstance(records, list):
            raise ValueError(f"Source shard must be an array: {path.relative_to(ROOT)}")
        for raw in records:
            record = dict(raw)
            record["publishedAt"] = record.get("publishedAt")
            all_records.append(record)
            occurrences[record["id"]].append(record)
            canonical[record["id"]] = record

    conflicting_ids: list[str] = []
    for source_id, records in occurrences.items():
        signatures = {(item.get("companyId"), item.get("url")) for item in records}
        if len(signatures) > 1:
            conflicting_ids.append(source_id)

    urls: defaultdict[str, set[str]] = defaultdict(set)
    for source_id, record in canonical.items():
        url = record.get("url")
        if isinstance(url, str) and url:
            urls[url].add(source_id)
    duplicate_url_groups = [
        {"url": url, "sourceIds": sorted(source_ids)}
        for url, source_ids in sorted(urls.items())
        if len(source_ids) > 1
    ]
    audit = {
        "registryRecordCount": len(all_records),
        "uniqueSourceCount": len(canonical),
        "duplicateSourceIdCount": sum(1 for records in occurrences.values() if len(records) > 1),
        "duplicateSourceIds": sorted(source_id for source_id, records in occurrences.items() if len(records) > 1),
        "conflictingDuplicateSourceIdCount": len(conflicting_ids),
        "conflictingDuplicateSourceIds": sorted(conflicting_ids),
        "duplicateUrlCount": len(duplicate_url_groups),
        "duplicateUrls": duplicate_url_groups,
    }
    return all_records, canonical, audit, shard_paths


def locator_state(binding: dict[str, Any]) -> tuple[bool, list[str], list[str]]:
    locator = binding.get("locator")
    if not isinstance(locator, dict) or not locator:
        return False, [], []
    used = [field for field in LOCATOR_FIELDS if has_content(locator.get(field))]
    invalid = sorted(field for field in locator if field not in LOCATOR_FIELDS or not has_content(locator[field]))
    return bool(used) and not invalid, used, invalid


def importance_score(company: dict[str, Any]) -> tuple[int, str]:
    raw = company.get("scores", {}).get("aiExposure", {}).get("value")
    if isinstance(raw, (int, float)):
        score = max(1, min(5, int(round(raw))))
        return score, "existing provisional aiExposure used only as a priority aid"
    base = 4 if company.get("primaryLayer") in CORE_LAYERS else 3
    if set(company.get("tags", [])) & AI_RELEVANT_TAGS:
        base += 1
    return min(5, base), "primaryLayer and existing tags used as a priority aid"


def markdown_cell(value: Any) -> str:
    text = str(value).replace("|", "\\|").replace("\n", " ")
    return text or "—"


def build_report() -> dict[str, Any]:
    company_paths = sorted((DATA / "companies").glob("*.json"))
    companies = [load_json(path) for path in company_paths]
    companies.sort(key=lambda item: item["id"])
    company_by_id = {company["id"]: company for company in companies}

    evidence_manifest_path = DATA / "company-evidence-manifest.json"
    evidence_manifest = load_json(evidence_manifest_path)
    evidence_paths = [DATA / shard for shard in evidence_manifest["shards"]]
    evidence_payloads = [load_json(path) for path in evidence_paths]
    claims = [claim for payload in evidence_payloads for claim in payload["claims"]]
    evidence = [binding for payload in evidence_payloads for binding in payload["evidence"]]
    coverage_records = [record for payload in evidence_payloads for record in payload["coverage"]]
    pilot_claim_by_id = {claim["id"]: claim for claim in claims}
    evidence_by_claim: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for binding in evidence:
        evidence_by_claim[binding["claimId"]].append(binding)
    coverage_by_pair = {(item["companyId"], item["category"]): item for item in coverage_records}

    manifest_path = DATA / "source-registry-manifest.json"
    manifest = load_json(manifest_path)
    all_source_records, sources, source_registry_audit, shard_paths = load_sources(manifest)
    sources_by_company: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in sources.values():
        if record.get("companyId") in company_by_id:
            sources_by_company[record["companyId"]].append(record)

    facilities_path = DATA / "facilities.json"
    facilities = load_json(facilities_path)
    facilities_by_company: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for facility in facilities:
        facilities_by_company[facility["companyId"]].append(facility)

    legacy_claims_path = DATA / "claims.json"
    legacy_claims = load_json(legacy_claims_path)
    legacy_claims_by_company: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for claim in legacy_claims:
        legacy_claims_by_company[claim["companyId"]].append(claim)

    financial_paths = sorted(DATA.glob("financial-history*.json"))
    financial_paths.extend([DATA / "sector-kpis.json", DATA / "roic-calculations.json"])
    financial_source_ids: defaultdict[str, set[str]] = defaultdict(set)
    financial_payloads: list[Any] = []
    for path in financial_paths:
        payload = load_json(path)
        financial_payloads.append(payload)
        records = payload if isinstance(payload, list) else [payload]
        for record in records:
            if isinstance(record, dict) and record.get("companyId") in company_by_id:
                financial_source_ids[record["companyId"]].update(collect_source_ids(record))

    input_paths = [*company_paths, evidence_manifest_path, *evidence_paths, manifest_path, facilities_path, legacy_claims_path, *shard_paths, *financial_paths]
    observation_dates: list[date] = []
    for value in (companies, evidence_payloads, all_source_records, facilities, legacy_claims, financial_payloads):
        observation_dates.extend(collect_observation_dates(value))
    data_as_of_date = max(observation_dates)
    data_as_of = data_as_of_date.isoformat()

    claims_by_company_category: defaultdict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for claim in claims:
        claims_by_company_category[(claim["companyId"], claim["category"])].append(claim)

    direct_sources: defaultdict[tuple[str, str], set[str]] = defaultdict(set)
    for claim in claims:
        pair = (claim["companyId"], claim["category"])
        for binding in evidence_by_claim[claim["id"]]:
            if binding["sourceId"] in sources:
                direct_sources[pair].add(binding["sourceId"])
    for company_id, records in facilities_by_company.items():
        direct_sources[(company_id, "manufacturing-facilities")].update(
            record["sourceId"] for record in records if record.get("sourceId") in sources
        )
    for company_id, records in sources_by_company.items():
        for record in records:
            for category in DIRECT_SOURCE_TYPE_CATEGORIES.get(record.get("sourceType"), ()):
                direct_sources[(company_id, category)].add(record["id"])

    locator_usage = Counter({field: 0 for field in LOCATOR_FIELDS})
    invalid_locator_bindings: list[dict[str, Any]] = []
    missing_locator_bindings: list[str] = []
    valid_locator_binding_ids: set[str] = set()
    for binding in evidence:
        valid, used, invalid = locator_state(binding)
        locator_usage.update(used)
        if valid:
            valid_locator_binding_ids.add(binding["id"])
        elif not used:
            missing_locator_bindings.append(binding["id"])
        else:
            invalid_locator_bindings.append({"bindingId": binding["id"], "invalidFields": invalid})

    company_reports: list[dict[str, Any]] = []
    field_totals = {
        field: Counter(
            {
                "contentPresent": 0,
                "directEvidenceAvailable": 0,
                "claimLevelBindingAvailable": 0,
                "migrationCandidate": 0,
                "evidenceGap": 0,
            }
        )
        for field in LEGACY_FIELDS
    }
    maturity_counts = Counter({f"L{level}": 0 for level in range(5)})
    maturity_dimensions = Counter(
        {
            "companyLevelSourceCompanies": 0,
            "directCategorySourcePairs": 0,
            "claimEvidenceBindingPairs": 0,
            "structuredLocatorPairs": 0,
            "freezeReadyPairs": 0,
        }
    )
    source_quality_totals = Counter(
        {
            "companySourceIdReferences": 0,
            "companySourceIdResolved": 0,
            "orphanSourceIdReferences": 0,
            "companyIdMismatchReferences": 0,
            "publishedAtNullReferences": 0,
            "staleIshReferences": 0,
            "financialSourceReferences": 0,
            "financialSourceResolved": 0,
        }
    )

    for company in companies:
        company_id = company["id"]
        company_source_ids = sorted_unique(company.get("sourceIds", []))
        resolved_company_sources = [sources[source_id] for source_id in company_source_ids if source_id in sources]
        orphan_company_sources = sorted(source_id for source_id in company_source_ids if source_id not in sources)
        mismatch_company_sources = sorted(
            source_id
            for source_id in company_source_ids
            if source_id in sources and sources[source_id].get("companyId") != company_id
        )
        financial_ids = sorted(financial_source_ids[company_id])
        financial_resolved = [source_id for source_id in financial_ids if source_id in sources]
        financial_orphans = [source_id for source_id in financial_ids if source_id not in sources]
        financial_mismatches = [
            source_id
            for source_id in financial_resolved
            if sources[source_id].get("companyId") != company_id
        ]
        facility_ids = sorted_unique(record.get("sourceId") for record in facilities_by_company[company_id])
        legacy_claim_source_ids = sorted_unique(
            source_id
            for legacy_claim in legacy_claims_by_company[company_id]
            for source_id in legacy_claim.get("sourceIds", [])
        )
        pilot_evidence_source_ids = sorted_unique(
            binding["sourceId"]
            for claim in claims
            if claim["companyId"] == company_id
            for binding in evidence_by_claim[claim["id"]]
        )
        all_referenced_source_ids = sorted_unique(
            [*company_source_ids, *financial_ids, *facility_ids, *legacy_claim_source_ids, *pilot_evidence_source_ids]
        )
        published_null = sorted(
            source_id
            for source_id in all_referenced_source_ids
            if source_id in sources and sources[source_id].get("publishedAt") is None
        )
        stale_ish = sorted(
            source_id
            for source_id in all_referenced_source_ids
            if source_id in sources
            and parse_date(sources[source_id].get("publishedAt"))
            and (data_as_of_date - parse_date(sources[source_id].get("publishedAt"))).days > 730
        )
        all_orphans = sorted_unique(
            [*orphan_company_sources, *financial_orphans, *[sid for sid in facility_ids + legacy_claim_source_ids + pilot_evidence_source_ids if sid not in sources]]
        )
        all_mismatches = sorted_unique(
            [
                *mismatch_company_sources,
                *financial_mismatches,
                *[
                    source_id
                    for source_id in facility_ids + legacy_claim_source_ids + pilot_evidence_source_ids
                    if source_id in sources and sources[source_id].get("companyId") != company_id
                ],
            ]
        )

        category_rows: list[dict[str, Any]] = []
        company_level_source_available = bool(resolved_company_sources)
        for category in CATEGORIES:
            pair = (company_id, category)
            pair_claims = claims_by_company_category[pair]
            pair_bindings = [binding for claim in pair_claims for binding in evidence_by_claim[claim["id"]]]
            pair_locators = [binding for binding in pair_bindings if binding["id"] in valid_locator_binding_ids]
            source_ids = sorted(direct_sources[pair])
            legacy_fields = [field for field, mapped_category in LEGACY_FIELDS.items() if mapped_category == category]
            legacy_present = any(has_content(company.get(field)) for field in legacy_fields)
            migration_candidate = legacy_present and not pair_bindings and company_level_source_available

            if pair in coverage_by_pair:
                frozen = coverage_by_pair[pair]
                status = frozen["collectionStatus"]
                missing_status = frozen.get("missingStatus")
                notes = frozen.get("notes", "Frozen Schema v0.2 Coverage Recordをそのまま使用。")
            elif legacy_present or source_ids:
                status = "partial"
                missing_status = None
                if legacy_present and source_ids:
                    notes = "Legacy contentとcategory-direct Sourceはあるが、Freeze SchemaのClaim-level Evidence Bindingは未作成。"
                elif legacy_present:
                    notes = "Legacy contentはあるが、category-direct Source / Claim-level Evidence Bindingは未収録。"
                else:
                    notes = "Category-direct Sourceはあるが、Freeze SchemaのClaim-level Evidence Bindingは未作成。"
            else:
                status = "not-started"
                missing_status = "not-collected"
                notes = "このrepository内にcategory-direct Evidenceを収録していない。非開示・対象外とは推定しない。"

            freeze_ready = bool(pair_claims and pair_bindings and len(pair_locators) == len(pair_bindings))
            row = {
                "category": category,
                "collectionStatus": status,
                "missingStatus": missing_status,
                "directSourceCount": len(source_ids),
                "directSourceIds": source_ids,
                "claimCount": len(pair_claims),
                "evidenceBindingCount": len(pair_bindings),
                "locatorCount": len(pair_locators),
                "legacyContentPresent": legacy_present,
                "migrationCandidate": migration_candidate,
                "freezeSchemaReady": freeze_ready,
                "notes": notes,
            }
            category_rows.append(row)
            if source_ids:
                maturity_dimensions["directCategorySourcePairs"] += 1
            if pair_claims and pair_bindings:
                maturity_dimensions["claimEvidenceBindingPairs"] += 1
            if pair_locators:
                maturity_dimensions["structuredLocatorPairs"] += 1
            if freeze_ready:
                maturity_dimensions["freezeReadyPairs"] += 1

        coverage_counts = Counter(row["collectionStatus"] for row in category_rows)
        direct_pair_count = sum(row["directSourceCount"] > 0 for row in category_rows)
        company_claims = [claim for claim in claims if claim["companyId"] == company_id]
        company_bindings = [binding for claim in company_claims for binding in evidence_by_claim[claim["id"]]]
        locator_count = sum(binding["id"] in valid_locator_binding_ids for binding in company_bindings)
        if company_bindings and locator_count == len(company_bindings):
            maturity_level = "L4"
            maturity_label = "Claim + Evidence + structured Locator"
        elif company_bindings:
            maturity_level = "L3"
            maturity_label = "Claim + Evidence"
        elif direct_pair_count:
            maturity_level = "L2"
            maturity_label = "category-direct Sources"
        elif resolved_company_sources:
            maturity_level = "L1"
            maturity_label = "company-level Sources"
        else:
            maturity_level = "L0"
            maturity_label = "legacy content only"
        maturity_counts[maturity_level] += 1
        if resolved_company_sources:
            maturity_dimensions["companyLevelSourceCompanies"] += 1

        legacy_state: dict[str, Any] = {}
        for field, category in LEGACY_FIELDS.items():
            row = next(item for item in category_rows if item["category"] == category)
            content_present = has_content(company.get(field))
            direct_available = row["directSourceCount"] > 0
            binding_available = row["evidenceBindingCount"] > 0
            migration_candidate = content_present and not binding_available and company_level_source_available
            evidence_gap = content_present and not binding_available
            legacy_state[field] = {
                "state": "content-present" if content_present else "content-missing",
                "directEvidenceAvailable": direct_available,
                "claimLevelBindingAvailable": binding_available,
                "migrationCandidate": migration_candidate,
                "evidenceGap": evidence_gap,
            }
            totals = field_totals[field]
            totals["contentPresent"] += int(content_present)
            totals["directEvidenceAvailable"] += int(direct_available)
            totals["claimLevelBindingAvailable"] += int(binding_available)
            totals["migrationCandidate"] += int(migration_candidate)
            totals["evidenceGap"] += int(evidence_gap)

        multi_category_sources = sorted(
            record["id"]
            for record in sources_by_company[company_id]
            if record.get("sourceType") in MULTI_CATEGORY_SOURCE_TYPES
        )
        importance, importance_basis = importance_score(company)
        evidence_gaps = [row["category"] for row in category_rows if row["collectionStatus"] != "complete"]
        migration_candidates = [row["category"] for row in category_rows if row["migrationCandidate"]]
        coverage_deficit = coverage_counts["not-started"] * 2 + coverage_counts["partial"]
        priority_score = (
            coverage_deficit * 10
            + importance * 4
            + min(len(multi_category_sources), 3) * 2
            + len(migration_candidates)
        )

        source_quality_totals["companySourceIdReferences"] += len(company_source_ids)
        source_quality_totals["companySourceIdResolved"] += len(resolved_company_sources)
        source_quality_totals["orphanSourceIdReferences"] += len(all_orphans)
        source_quality_totals["companyIdMismatchReferences"] += len(all_mismatches)
        source_quality_totals["publishedAtNullReferences"] += len(published_null)
        source_quality_totals["staleIshReferences"] += len(stale_ish)
        source_quality_totals["financialSourceReferences"] += len(financial_ids)
        source_quality_totals["financialSourceResolved"] += len(financial_resolved)

        company_reports.append(
            {
                "companyId": company_id,
                "companyName": company.get("japaneseName") or company.get("name"),
                "primaryLayer": company.get("primaryLayer"),
                "sourceCount": len(company_source_ids),
                "resolvedSourceCount": len(resolved_company_sources),
                "registrySourceCount": len(sources_by_company[company_id]),
                "financialSourceCount": len(financial_ids),
                "claimCount": len(company_claims),
                "legacyClaimCount": len(legacy_claims_by_company[company_id]),
                "evidenceBindingCount": len(company_bindings),
                "locatorCount": locator_count,
                "directCategorySourcePairCount": direct_pair_count,
                "maturity": {"level": maturity_level, "label": maturity_label},
                "coverageCounts": {status: coverage_counts[status] for status in COVERAGE_STATUSES},
                "categoryCoverage": category_rows,
                "legacyContentState": legacy_state,
                "evidenceGaps": evidence_gaps,
                "migrationCandidates": migration_candidates,
                "priorityBand": "",
                "priorityScore": priority_score,
                "priorityInputs": {
                    "coverageDeficit": coverage_deficit,
                    "aiInfrastructureImportance": importance,
                    "importanceBasis": importance_basis,
                    "multiCategorySourceLeverage": len(multi_category_sources),
                    "migrationEaseCandidates": len(migration_candidates),
                },
                "sourceQuality": {
                    "sourceIds": company_source_ids,
                    "resolvedSourceIds": sorted(record["id"] for record in resolved_company_sources),
                    "registrySourceCount": len(sources_by_company[company_id]),
                    "financialSourceIds": financial_ids,
                    "orphanSourceIds": all_orphans,
                    "companyIdMismatchSourceIds": all_mismatches,
                    "publishedAtNullSourceIds": published_null,
                    "staleIshSourceIds": stale_ish,
                    "multiCategorySourceIds": multi_category_sources,
                },
                "notes": [
                    "Priority is an audit workflow aid, not a Company Evaluation Score.",
                    "Generic company-level and financial Sources do not make a Category complete.",
                ],
            }
        )

    priority_c = [
        company
        for company in company_reports
        if company["maturity"]["level"] in {"L3", "L4"} and company["coverageCounts"]["complete"] >= 4
    ]
    remaining = [company for company in company_reports if company not in priority_c]
    remaining.sort(key=lambda item: (-item["priorityScore"], item["companyId"]))
    priority_a_count = max(10, len(remaining) // 5)
    priority_a = remaining[:priority_a_count]
    priority_b = remaining[priority_a_count:]
    for company in priority_a:
        company["priorityBand"] = "A"
    for company in priority_b:
        company["priorityBand"] = "B"
    for company in priority_c:
        company["priorityBand"] = "C"
    company_reports.sort(key=lambda item: item["companyId"])

    coverage_totals = Counter(row["collectionStatus"] for company in company_reports for row in company["categoryCoverage"])
    missing_totals = Counter(
        row["missingStatus"]
        for company in company_reports
        for row in company["categoryCoverage"]
        if row["missingStatus"]
    )
    category_summary: list[dict[str, Any]] = []
    for category in CATEGORIES:
        rows = [
            row
            for company in company_reports
            for row in company["categoryCoverage"]
            if row["category"] == category
        ]
        counts = Counter(row["collectionStatus"] for row in rows)
        category_summary.append(
            {
                "category": category,
                "completeCompanies": counts["complete"],
                "partialCompanies": counts["partial"],
                "notStartedCompanies": counts["not-started"],
                "directSourceCompanies": sum(row["directSourceCount"] > 0 for row in rows),
                "claimEvidenceCompanies": sum(row["evidenceBindingCount"] > 0 for row in rows),
                "migrationCandidateCompanies": sum(row["migrationCandidate"] for row in rows),
            }
        )

    field_summary = {field: dict(counts) for field, counts in field_totals.items()}
    priority_lists = {
        band: [company["companyId"] for company in sorted(company_reports, key=lambda item: item["companyId"]) if company["priorityBand"] == band]
        for band in ("A", "B", "C")
    }
    ranked = sorted(company_reports, key=lambda item: (-item["priorityScore"], item["companyId"]))
    next_batch = []
    for company in [item for item in ranked if item["priorityBand"] == "A"][:8]:
        inputs = company["priorityInputs"]
        counts = company["coverageCounts"]
        next_batch.append(
            {
                "companyId": company["companyId"],
                "companyName": company["companyName"],
                "reasons": [
                    f"Coverage gap: {counts['not-started']} not-started / {counts['partial']} partial",
                    f"AI Infrastructure importance aid: {inputs['aiInfrastructureImportance']}/5",
                    f"Source leverage: {inputs['multiCategorySourceLeverage']} broad primary Sources",
                    f"Migration ease: {inputs['migrationEaseCandidates']} legacy-field candidates",
                ],
            }
        )

    coverage_value = lambda item: item["coverageCounts"]["complete"] * 2 + item["coverageCounts"]["partial"]
    highest_value = max(coverage_value(company) for company in company_reports)
    lowest_value = min(coverage_value(company) for company in company_reports)
    highest = [company["companyId"] for company in company_reports if coverage_value(company) == highest_value]
    lowest = [company["companyId"] for company in company_reports if coverage_value(company) == lowest_value]

    source_registry_audit.update(
        {
            "publishedAtNullUniqueSources": sum(record.get("publishedAt") is None for record in sources.values()),
            "staleIshUniqueSources": sum(
                bool(parse_date(record.get("publishedAt")))
                and (data_as_of_date - parse_date(record.get("publishedAt"))).days > 730
                for record in sources.values()
            ),
            "staleIshThresholdDays": 730,
            **dict(source_quality_totals),
        }
    )
    locator_audit = {
        "bindingCount": len(evidence),
        "validLocatorCount": len(valid_locator_binding_ids),
        "missingLocatorCount": len(missing_locator_bindings),
        "missingLocatorBindingIds": sorted(missing_locator_bindings),
        "invalidLocatorCount": len(invalid_locator_bindings),
        "invalidLocators": invalid_locator_bindings,
        "fieldUsage": {field: locator_usage[field] for field in LOCATOR_FIELDS},
    }
    report = {
        "schemaVersion": "0.1",
        "generatedAt": f"{data_as_of}T00:00:00Z",
        "dataAsOf": data_as_of,
        "inputDigest": normalized_digest(input_paths),
        "companyCount": len(company_reports),
        "categoryCount": len(CATEGORIES),
        "pairCount": len(company_reports) * len(CATEGORIES),
        "categories": list(CATEGORIES),
        "auditMethodology": {
            "evidenceBaseline": "src/data/company-evidence-manifest.json resolves frozen Schema v0.2 Evidence shards; their Coverage Records are authoritative.",
            "unenrichedRule": "For companies without a Coverage Record, legacy content or an explicit typed/category Source yields partial, never complete; otherwise not-started/not-collected.",
            "directSourceRule": "Only Claim Evidence, Facility references, and narrowly typed product/facility/profile Sources are category-direct.",
            "migrationCandidateRule": "Legacy content plus a resolved company-level primary Source and no Claim-level Evidence Binding; human category/Locator review is still required.",
            "priorityRule": "Coverage deficit is primary; existing AI importance signals, broad-source leverage, and migration ease only break ties. Top one-fifth of non-C companies is A; mature Pilot baseline is C; the remainder is B.",
            "priorityIsCompanyEvaluation": False,
            "coverageQualityFloor": False,
            "inputFileCount": len(input_paths),
        },
        "summary": {
            "coverage": {status: coverage_totals[status] for status in COVERAGE_STATUSES},
            "missingStatus": {status: missing_totals[status] for status in MISSING_STATUSES},
            "maturity": {f"L{level}": maturity_counts[f"L{level}"] for level in range(5)},
            "evidenceMaturityDimensions": dict(maturity_dimensions),
            "fieldLevelLegacy": field_summary,
            "sourceQuality": source_registry_audit,
            "locatorAudit": locator_audit,
            "priorityBands": {band: len(ids) for band, ids in priority_lists.items()},
            "highestCoverage": {"score": highest_value, "companyIds": highest},
            "lowestCoverage": {"score": lowest_value, "companyIds": lowest},
        },
        "categorySummary": category_summary,
        "priorityBands": priority_lists,
        "topEvidenceGaps": sorted(
            category_summary,
            key=lambda item: (-item["notStartedCompanies"], item["category"]),
        ),
        "nextRecommendedBatch": next_batch,
        "companies": company_reports,
    }
    validate_report(report, coverage_by_pair)
    return report


def validate_report(report: dict[str, Any], evidence_coverage: dict[tuple[str, str], dict[str, Any]]) -> None:
    errors: list[str] = []
    if report["companyCount"] != 100:
        errors.append(f"expected 100 companies, got {report['companyCount']}")
    if report["categoryCount"] != 11:
        errors.append(f"expected 11 categories, got {report['categoryCount']}")
    if report["pairCount"] != 1100:
        errors.append(f"expected 1100 pairs, got {report['pairCount']}")
    pairs = [row for company in report["companies"] for row in company["categoryCoverage"]]
    if len(pairs) != 1100:
        errors.append(f"company rows contain {len(pairs)} pairs")
    for company in report["companies"]:
        if len(company["categoryCoverage"]) != len(CATEGORIES):
            errors.append(f"{company['companyId']} does not contain all categories")
        for row in company["categoryCoverage"]:
            if row["collectionStatus"] not in COVERAGE_STATUSES:
                errors.append(f"invalid coverage status: {company['companyId']} / {row['category']}")
            if row["collectionStatus"] == "not-started" and row["missingStatus"] not in MISSING_STATUSES:
                errors.append(f"not-started missingStatus absent: {company['companyId']} / {row['category']}")
            if row["collectionStatus"] == "partial" and row["missingStatus"] and not row["notes"]:
                errors.append(f"partial missingStatus note absent: {company['companyId']} / {row['category']}")
            pair = (company["companyId"], row["category"])
            if pair in evidence_coverage:
                frozen = evidence_coverage[pair]
                if row["collectionStatus"] != frozen["collectionStatus"] or row["missingStatus"] != frozen.get("missingStatus"):
                    errors.append(f"Evidence Coverage baseline mismatch: {company['companyId']} / {row['category']}")
    if sum(report["summary"]["coverage"].values()) != 1100:
        errors.append("coverage totals do not sum to 1100")
    if report["summary"]["sourceQuality"]["conflictingDuplicateSourceIdCount"]:
        errors.append("conflicting duplicate Source IDs detected")
    if report["summary"]["sourceQuality"]["orphanSourceIdReferences"]:
        errors.append("orphan Source ID references detected")
    if report["summary"]["sourceQuality"]["companyIdMismatchReferences"]:
        errors.append("Source/company mismatches detected")
    if errors:
        raise ValueError("Coverage audit validation failed:\n- " + "\n- ".join(errors))


def render_json(report: dict[str, Any]) -> str:
    return json.dumps(report, ensure_ascii=False, indent=2) + "\n"


def render_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    coverage = summary["coverage"]
    lines = [
        "# 100-company Company Evidence Coverage Audit v0.1",
        "",
        f"- Data as of: `{report['dataAsOf']}`",
        f"- Input digest: `{report['inputDigest']}`",
        f"- Scope: {report['companyCount']} companies × {report['categoryCount']} categories = {report['pairCount']:,} pairs",
        "- Company Evidence enrichment: **Arm / ASML only**",
        "- This is a coverage audit, not a Company Evaluation Score.",
        "",
        "## Executive summary",
        "",
        f"Freeze Schema v0.2の11 Categoryを100社へ投影し、{report['pairCount']:,} pairを機械監査した。Pilot 5社の既存Coverage Recordを維持し、Batch 01のArm / ASMLはmanifest経由のCoverage Recordを正とする。残る93社ではlegacy本文や汎用IR Sourceだけをcompleteへ昇格していない。",
        "",
        f"結果はcomplete **{coverage['complete']}**、partial **{coverage['partial']}**、not-started **{coverage['not-started']}**。低CoverageはCI failureにせず、次の一次資料補強順を作るbaselineとして固定する。",
        "",
        "## 100-company totals",
        "",
        "| Companies | Categories | Pairs | Complete | Partial | Not-started |",
        "| ---: | ---: | ---: | ---: | ---: | ---: |",
        f"| {report['companyCount']} | {report['categoryCount']} | {report['pairCount']:,} | {coverage['complete']} | {coverage['partial']} | {coverage['not-started']} |",
        "",
        "## Category coverage",
        "",
        "| Category | Complete | Partial | Not-started | Direct Source | Claim + Evidence | Migration candidate |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for item in report["categorySummary"]:
        lines.append(
            f"| `{item['category']}` | {item['completeCompanies']} | {item['partialCompanies']} | "
            f"{item['notStartedCompanies']} | {item['directSourceCompanies']} | "
            f"{item['claimEvidenceCompanies']} | {item['migrationCandidateCompanies']} |"
        )
    lines.extend(["", "## Missing status", "", "| Status | Pairs |", "| --- | ---: |"])
    for status in MISSING_STATUSES:
        lines.append(f"| `{status}` | {summary['missingStatus'][status]} |")

    maturity = summary["maturity"]
    dimensions = summary["evidenceMaturityDimensions"]
    lines.extend(
        [
            "",
            "## Evidence maturity",
            "",
            "| Level | Meaning | Companies |",
            "| --- | --- | ---: |",
            f"| L0 | legacy content only | {maturity['L0']} |",
            f"| L1 | company-level Sources | {maturity['L1']} |",
            f"| L2 | category-direct Sources | {maturity['L2']} |",
            f"| L3 | Claim + Evidence | {maturity['L3']} |",
            f"| L4 | Claim + Evidence + Locator | {maturity['L4']} |",
            "",
            "A/B/C/D/Eを別集計した結果：",
            "",
            f"- Company-level Sourceあり: {dimensions['companyLevelSourceCompanies']} companies",
            f"- Category-direct Sourceあり: {dimensions['directCategorySourcePairs']} pairs",
            f"- Claim-level Evidence Bindingあり: {dimensions['claimEvidenceBindingPairs']} pairs",
            f"- Structured Locatorあり: {dimensions['structuredLocatorPairs']} pairs",
            f"- Freeze Schemaでそのまま移行可能: {dimensions['freezeReadyPairs']} pairs",
            "",
            "## Field-level legacy provenance",
            "",
            "| Field | Content present | Direct evidence | Claim binding | Migration candidate | Evidence gap |",
            "| --- | ---: | ---: | ---: | ---: | ---: |",
        ]
    )
    for field, values in summary["fieldLevelLegacy"].items():
        lines.append(
            f"| `{field}` | {values['contentPresent']} | {values['directEvidenceAvailable']} | "
            f"{values['claimLevelBindingAvailable']} | {values['migrationCandidate']} | {values['evidenceGap']} |"
        )

    source = summary["sourceQuality"]
    locator = summary["locatorAudit"]
    lines.extend(
        [
            "",
            "## Source quality",
            "",
            f"- Registry records / unique Sources: {source['registryRecordCount']} / {source['uniqueSourceCount']}",
            f"- Company `sourceIds` references / resolved: {source['companySourceIdReferences']} / {source['companySourceIdResolved']}",
            f"- Financial Source references / resolved: {source['financialSourceReferences']} / {source['financialSourceResolved']}",
            f"- Orphan Source references: {source['orphanSourceIdReferences']}",
            f"- Company/source mismatches: {source['companyIdMismatchReferences']}",
            f"- Compatible duplicate Source IDs: {source['duplicateSourceIdCount']}",
            f"- Conflicting duplicate Source IDs: {source['conflictingDuplicateSourceIdCount']}",
            f"- Duplicate URLs across distinct IDs: {source['duplicateUrlCount']}",
            f"- `publishedAt: null`: {source['publishedAtNullUniqueSources']} unique Sources",
            f"- stale-ish (publishedAtがdataAsOfより{source['staleIshThresholdDays']}日超前): {source['staleIshUniqueSources']} unique Sources",
            "",
            "### Locator audit",
            "",
            f"Bindings {locator['bindingCount']} / valid Locators {locator['validLocatorCount']} / missing {locator['missingLocatorCount']} / invalid {locator['invalidLocatorCount']}。",
            "",
            "| Locator field | Uses |",
            "| --- | ---: |",
        ]
    )
    for field in LOCATOR_FIELDS:
        lines.append(f"| `{field}` | {locator['fieldUsage'][field]} |")

    lines.extend(
        [
            "",
            "## Pilot baseline",
            "",
            "Pilot 5社はFreeze baselineを変更せず、既存55 Coverage Recordと整合する。",
            "",
            "| Company | Complete | Partial | Not-started | Claims | Evidence | Locators | Maturity |",
            "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
        ]
    )
    for company in report["companies"]:
        if company["companyId"] not in PILOT_COMPANIES:
            continue
        counts = company["coverageCounts"]
        lines.append(
            f"| {markdown_cell(company['companyName'])} | {counts['complete']} | {counts['partial']} | "
            f"{counts['not-started']} | {company['claimCount']} | {company['evidenceBindingCount']} | "
            f"{company['locatorCount']} | {company['maturity']['level']} |"
        )

    for band in ("A", "B", "C"):
        lines.extend(["", f"## Priority {band} companies", ""])
        lines.append(", ".join(f"`{company_id}`" for company_id in report["priorityBands"][band]) or "—")
        if band == "A":
            lines.extend(
                [
                    "",
                    "PriorityはCoverage不足を主軸に、既存のAI重要度signal、複数Categoryへ使える一次Source、legacy migration候補を補助軸として決定した。会社規模・株価は使用していない。",
                ]
            )

    lines.extend(
        [
            "",
            "## Top evidence gaps",
            "",
            "| Category | Not-started | Partial |",
            "| --- | ---: | ---: |",
        ]
    )
    for item in report["topEvidenceGaps"]:
        lines.append(f"| `{item['category']}` | {item['notStartedCompanies']} | {item['partialCompanies']} |")

    migration_counts = Counter(
        category
        for company in report["companies"]
        for category in company["migrationCandidates"]
    )
    lines.extend(
        [
            "",
            "## Migration candidates",
            "",
            "Legacy contentとcompany-level一次Sourceがあり、Claim-level Evidence Bindingが未作成のpair。直接移行を保証せず、Category・Claim type・Locatorの人手reviewを必須とする。",
            "",
            "| Category | Candidate pairs |",
            "| --- | ---: |",
        ]
    )
    for category in CATEGORIES:
        lines.append(f"| `{category}` | {migration_counts[category]} |")

    lines.extend(
        [
            "",
            "## Next recommended batch",
            "",
            "更新後のaudit結果から、将来の一次資料補強候補を8社に限定した。この監査は次Batchを開始しない。",
            "",
            "| Company | Reasons |",
            "| --- | --- |",
        ]
    )
    for item in report["nextRecommendedBatch"]:
        lines.append(f"| {markdown_cell(item['companyName'])} | {markdown_cell('; '.join(item['reasons']))} |")

    lines.extend(
        [
            "",
            "## Company table",
            "",
            "| Company | Maturity | Complete | Partial | Not-started | Sources | Claims | Evidence | Locators | Priority |",
            "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
        ]
    )
    for company in report["companies"]:
        counts = company["coverageCounts"]
        lines.append(
            f"| {markdown_cell(company['companyName'])} | {company['maturity']['level']} | {counts['complete']} | "
            f"{counts['partial']} | {counts['not-started']} | {company['sourceCount']} | {company['claimCount']} | "
            f"{company['evidenceBindingCount']} | {company['locatorCount']} | {company['priorityBand']} |"
        )

    lines.extend(
        [
            "",
            "## Audit freshness and boundaries",
            "",
            "- `python scripts/audit-company-evidence-coverage.py --write` でJSON/Markdownを再生成する。",
            "- CIは `--check` でinput digestと完全な生成物一致を確認する。Coverageの低さ自体はfailureにしない。",
            "- 汎用IR、決算Source、legacy本文だけではCategoryをcompleteにしない。",
            "- Evidence shardにCoverage Recordがない会社の`not-started`理由は、dataset状態として安全な`not-collected`に限定する。`not-disclosed` / `not-applicable`は推定しない。",
            "- Batch 01はArm / ASMLのCompany Evidenceと必要最小限のShared Source / pending Source Policyのみを追加し、company JSON、financial data、facilities、relationshipsは変更しない。",
            "",
        ]
    )
    return "\n".join(lines)


def print_summary(report: dict[str, Any]) -> None:
    coverage = report["summary"]["coverage"]
    missing = report["summary"]["missingStatus"]
    maturity = report["summary"]["maturity"]
    print(
        "Company Evidence coverage audit: "
        f"{report['companyCount']} companies / {report['categoryCount']} categories / {report['pairCount']} pairs"
    )
    print(
        "Coverage: "
        f"complete={coverage['complete']} / partial={coverage['partial']} / not-started={coverage['not-started']}"
    )
    print("Missing: " + " / ".join(f"{status}={missing[status]}" for status in MISSING_STATUSES))
    print("Maturity: " + " / ".join(f"L{level}={maturity[f'L{level}']}" for level in range(5)))
    print("Priority: " + " / ".join(f"{band}={report['summary']['priorityBands'][band]}" for band in ("A", "B", "C")))


def resolve_output(path_value: str, default: Path) -> Path:
    if not path_value:
        return default
    path = Path(path_value)
    return path if path.is_absolute() else ROOT / path


def check_output(path: Path, expected: str) -> bool:
    if not path.exists():
        print(f"STALE: missing audit output {path.relative_to(ROOT)}", file=sys.stderr)
        return False
    actual = path.read_text(encoding="utf-8")
    if actual != expected:
        print(f"STALE: regenerate {path.relative_to(ROOT)} with --write", file=sys.stderr)
        return False
    print(f"Current audit output: {path.relative_to(ROOT)}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="write deterministic JSON and Markdown reports")
    mode.add_argument("--check", action="store_true", help="fail when committed reports do not match current inputs")
    parser.add_argument("--json-output", default="", help="JSON path relative to the repository root")
    parser.add_argument("--markdown-output", default="", help="Markdown path relative to the repository root")
    args = parser.parse_args()

    json_path = resolve_output(args.json_output, DEFAULT_JSON)
    markdown_path = resolve_output(args.markdown_output, DEFAULT_MARKDOWN)
    try:
        report = build_report()
    except (KeyError, TypeError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    json_output = render_json(report)
    markdown_output = render_markdown(report)
    print_summary(report)

    if args.write:
        for path, content in ((json_path, json_output), (markdown_path, markdown_output)):
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
            print(f"Wrote {path.relative_to(ROOT)}")
    elif args.check:
        if not check_output(json_path, json_output) or not check_output(markdown_path, markdown_output):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
