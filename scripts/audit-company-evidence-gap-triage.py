#!/usr/bin/env python3
"""Check the persisted Company Evidence gap-triage decisions.

Semantic classifications are reviewed data in the v0.2 JSON artifact. This
checker never infers a classification from Coverage, company size, source
count, or business-model keywords. It only validates the persisted review,
refreshes mechanical Coverage/action fields, and renders the Markdown view.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COVERAGE_PATH = ROOT / "docs" / "company-evidence-coverage-audit-v01.json"
JSON_PATH = ROOT / "docs" / "company-evidence-gap-triage-v02.json"
MD_PATH = ROOT / "docs" / "company-evidence-gap-triage-v02.md"

TRIAGE_VALUES = (
    "ACTIONABLE",
    "SUFFICIENT_PARTIAL",
    "NOT_DISCLOSED",
    "NOT_APPLICABLE",
    "DEFERRED",
    "REVIEW_REQUIRED",
)

SEMANTIC_FIELDS = (
    "id", "companyId", "companyName", "primaryLayer", "category",
    "baselineCoverageStatus", "baselineMissingStatus", "baselineClaimCount",
    "baselineEvidenceBindingCount", "baselineLocatorCount",
    "semanticClassification", "reasonCode", "rationale", "targetSourceIds",
    "reviewScope", "reviewedAt", "reviewedSourceIds", "reviewMethod",
    "sourceSearchBound", "reviewerBasis",
)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def semantic_digest(records: list[dict]) -> str:
    projection = [
        {key: record.get(key) for key in SEMANTIC_FIELDS}
        for record in sorted(records, key=lambda item: item["id"])
    ]
    raw = json.dumps(projection, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    return "sha256:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()


def coverage_index(coverage: dict) -> dict[tuple[str, str], dict]:
    result = {}
    for company in coverage["companies"]:
        for item in company["categoryCoverage"]:
            result[(company["companyId"], item["category"])] = {
                "companyName": company["companyName"],
                "primaryLayer": company["primaryLayer"],
                **item,
            }
    return result


def distribution(records: list[dict], field: str, *, gaps_only: bool = False) -> dict:
    counts = Counter(
        record[field]
        for record in records
        if (not gaps_only or record["currentGap"]) and record.get(field) is not None
    )
    return {value: counts[value] for value in TRIAGE_VALUES}


def grouped(records: list[dict], field: str) -> list[dict]:
    groups: dict[str, Counter] = defaultdict(Counter)
    for record in records:
        if not record["currentGap"]:
            continue
        groups[record[field]][record["currentClassification"]] += 1
    return [
        {
            field: key,
            "total": sum(counts.values()),
            "distribution": {value: counts[value] for value in TRIAGE_VALUES},
        }
        for key, counts in sorted(groups.items())
    ]


def refresh(report: dict, coverage: dict) -> dict:
    index = coverage_index(coverage)
    refreshed = []
    for persisted in report["records"]:
        record = dict(persisted)
        item = index.get((record["companyId"], record["category"]))
        if item is None:
            raise AssertionError(f'missing Coverage record for {record["id"]}')
        evidence_delta = item["evidenceBindingCount"] - record["baselineEvidenceBindingCount"]
        coverage_changed = item["collectionStatus"] != record["baselineCoverageStatus"]
        completed = record["semanticClassification"] == "ACTIONABLE" and (
            evidence_delta > 0 or coverage_changed
        )
        current_gap = item["collectionStatus"] != "complete"
        if not current_gap:
            current_classification = None
        elif record["semanticClassification"] == "ACTIONABLE" and completed:
            current_classification = "SUFFICIENT_PARTIAL" if item["collectionStatus"] == "partial" else "DEFERRED"
        else:
            current_classification = record["semanticClassification"]
        record.update({
            "currentCoverageStatus": item["collectionStatus"],
            "currentMissingStatus": item.get("missingStatus"),
            "currentClaimCount": item["claimCount"],
            "currentEvidenceBindingCount": item["evidenceBindingCount"],
            "currentLocatorCount": item["locatorCount"],
            "currentGap": current_gap,
            "currentClassification": current_classification,
            "actionStatus": "completed" if completed else (
                "pending" if record["semanticClassification"] == "ACTIONABLE" else "not-required"
            ),
            "actionEvidenceDelta": evidence_delta,
        })
        refreshed.append(record)

    pending = [record for record in refreshed if record["actionStatus"] == "pending"]
    completed = [record for record in refreshed if record["actionStatus"] == "completed"]
    result = dict(report)
    result["coverageInputDigest"] = coverage["inputDigest"]
    result["coverageCurrent"] = {
        "complete": coverage["summary"]["coverage"]["complete"],
        "partial": coverage["summary"]["coverage"]["partial"],
        "notStarted": coverage["summary"]["coverage"]["not-started"],
        "gaps": coverage["summary"]["coverage"]["partial"] + coverage["summary"]["coverage"]["not-started"],
    }
    result["semanticDecisionDistribution"] = distribution(refreshed, "semanticClassification")
    result["currentDistribution"] = distribution(refreshed, "currentClassification", gaps_only=True)
    result["actionable"] = {
        "reviewedRecords": result["semanticDecisionDistribution"]["ACTIONABLE"],
        "reviewedCompanies": len({record["companyId"] for record in refreshed if record["semanticClassification"] == "ACTIONABLE"}),
        "pendingRecords": len(pending),
        "pendingCompanies": len({record["companyId"] for record in pending}),
        "completedRecords": len(completed),
        "completedCompanies": len({record["companyId"] for record in completed}),
    }
    result["categorySummary"] = grouped(refreshed, "category")
    result["companySummary"] = grouped(refreshed, "companyId")
    result["records"] = sorted(refreshed, key=lambda item: (item["companyId"], item["category"]))
    return result


def validate(report: dict, coverage: dict) -> None:
    records = report["records"]
    assert report["schemaVersion"] == "0.2"
    assert len(records) == 779, f"expected 779 persisted gaps, got {len(records)}"
    assert len({record["id"] for record in records}) == 779, "duplicate record id"
    assert report["semanticDecisionDigest"] == semantic_digest(records), (
        "semantic decision digest mismatch; reviewed decisions must be changed explicitly"
    )
    assert sum(report["semanticDecisionDistribution"].values()) == 779
    assert sum(report["currentDistribution"].values()) == report["coverageCurrent"]["gaps"]
    assert report["semanticDecisionDistribution"]["REVIEW_REQUIRED"] == 0
    assert report["reviewScopeSummary"]["systemicAffectedRecords"] == 303
    assert report["reviewScopeSummary"]["deferredRecordsReReviewed"] == 300
    assert report["reviewScopeSummary"]["knownCorrectionsReviewed"] == 3
    current_ids = {
        f'{company["companyId"]}:{item["category"]}'
        for company in coverage["companies"]
        for item in company["categoryCoverage"]
        if item["collectionStatus"] != "complete"
    }
    assert current_ids == {record["id"] for record in records}, (
        "persisted triage IDs must correspond to all current Coverage gaps"
    )
    required_provenance = {
        "reviewedAt", "reviewedSourceIds", "reviewMethod", "semanticClassification",
        "rationale", "sourceSearchBound", "reviewerBasis",
    }
    remediation_records = 0
    for record in records:
        assert record["semanticClassification"] in TRIAGE_VALUES
        if record["currentClassification"] is not None:
            assert record["currentClassification"] in TRIAGE_VALUES
        if record["semanticClassification"] == "ACTIONABLE":
            assert record["targetSourceIds"], f'missing target source for {record["id"]}'
        if record["reviewScope"] == "systemic-remediation-v01":
            remediation_records += 1
            missing = required_provenance - record.keys()
            assert not missing, f'{record["id"]} missing provenance {sorted(missing)}'
            assert record["reviewedSourceIds"], f'no source reviewed for {record["id"]}'
            bound = record["sourceSearchBound"]
            assert bound["targetedOfficialSourceLimit"] == 2
            assert bound["secondarySourcesUsed"] is False
            assert date.fromisoformat(record["reviewedAt"]) <= date.today()
    assert remediation_records == 303, remediation_records


def markdown(report: dict) -> str:
    semantic = report["semanticDecisionDistribution"]
    current = report["currentDistribution"]
    scope = report["reviewScopeSummary"]
    lines = [
        "# Company Evidence Gap Triage v0.2", "",
        f'- Baseline main: `{report["baselineMain"]}`',
        f'- Supersedes: `{report["supersedes"]}`',
        f'- Semantic decision digest: `{report["semanticDecisionDigest"]}`',
        f'- Current Coverage gaps: `{report["coverageCurrent"]["gaps"]}` (`partial {report["coverageCurrent"]["partial"]}` + `not-started {report["coverageCurrent"]["notStarted"]}`)',
        f'- ACTIONABLE pending: `{report["actionable"]["pendingRecords"]}` records / `{report["actionable"]["pendingCompanies"]}` companies',
        "- Coverage answers whether a Category is complete; Triage answers whether it should be pursued.", "",
        "## Remediation scope", "",
        f'- Validation v0.1 affected records reviewed: `{scope["systemicAffectedRecords"]}`',
        f'- Former DEFERRED records independently re-reviewed: `{scope["deferredRecordsReReviewed"]}`',
        f'- Known Broadcom/Fujikura corrections reviewed: `{scope["knownCorrectionsReviewed"]}`',
        "- Every affected record retains its reviewed source IDs, bounded-search method, rationale, and reviewer basis in JSON.", "",
        "## Distribution", "",
        "| Classification | Reviewed decision | Current gap state |", "| --- | ---: | ---: |",
    ]
    for value in TRIAGE_VALUES:
        lines.append(f'| {value} | {semantic[value]} | {current[value]} |')
    lines += ["", "## Category summary", "",
        "| Category | Gaps | Actionable | Sufficient partial | Not disclosed | Not applicable | Deferred | Review required |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"]
    for row in report["categorySummary"]:
        dist = row["distribution"]
        lines.append(f'| {row["category"]} | {row["total"]} | {dist["ACTIONABLE"]} | {dist["SUFFICIENT_PARTIAL"]} | {dist["NOT_DISCLOSED"]} | {dist["NOT_APPLICABLE"]} | {dist["DEFERRED"]} | {dist["REVIEW_REQUIRED"]} |')
    lines += ["", "## Reviewed closure states", "",
        "| Record | Decision | Reviewed source | Rationale |", "| --- | --- | --- | --- |"]
    for record in report["records"]:
        if record["reviewScope"] != "systemic-remediation-v01" or record["semanticClassification"] == "ACTIONABLE":
            continue
        lines.append(f'| `{record["id"]}` | {record["semanticClassification"]} | {", ".join(record["reviewedSourceIds"])} | {record["rationale"]} |')
    lines += ["", "## Architecture", "",
        "- Semantic decisions are persisted reviewed records in this JSON artifact.",
        "- The audit script does not classify records. It checks enums, provenance, source-review bounds, digest, freshness, Coverage correspondence, and mechanical action completion.",
        "- `not-started → DEFERRED` fallback and the coarse Broadcom asset-light rule were removed.",
        "- Evidence changes are the only event that can move an ACTIONABLE record to a completed current state.",
        "- `SUFFICIENT_PARTIAL` remains Coverage `partial`; no complete count is inferred from Triage.", ""]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if not JSON_PATH.exists():
        print(f"Missing persisted semantic triage: {JSON_PATH.relative_to(ROOT)}")
        return 1
    persisted = load(JSON_PATH)
    coverage = load(COVERAGE_PATH)
    report = refresh(persisted, coverage)
    validate(report, coverage)
    json_text = dump(report)
    md_text = markdown(report)
    if args.write:
        JSON_PATH.write_text(json_text, encoding="utf-8", newline="\n")
        MD_PATH.write_text(md_text, encoding="utf-8", newline="\n")
        print(f'Gap triage v0.2: {len(report["records"])} records / ACTIONABLE {report["actionable"]["pendingRecords"]} pending / REVIEW_REQUIRED {report["currentDistribution"]["REVIEW_REQUIRED"]}')
        return 0
    stale = []
    if JSON_PATH.read_text(encoding="utf-8") != json_text:
        stale.append(str(JSON_PATH.relative_to(ROOT)))
    if not MD_PATH.exists() or MD_PATH.read_text(encoding="utf-8") != md_text:
        stale.append(str(MD_PATH.relative_to(ROOT)))
    if stale:
        print("Gap triage audit stale: " + ", ".join(stale))
        return 1
    print(f'Gap triage v0.2 OK: {len(report["records"])} records / ACTIONABLE {report["actionable"]["pendingRecords"]} pending / REVIEW_REQUIRED {report["currentDistribution"]["REVIEW_REQUIRED"]}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
