#!/usr/bin/env python3
"""Generate/check the governed Company Evidence gap triage.

Coverage answers whether a category is complete. Triage answers whether the
remaining gap is worth pursuing in this closure phase. The first generated
record set is retained as the phase baseline; later writes refresh current
coverage and automatically close ACTIONABLE work only when evidence/coverage
actually changes.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COVERAGE_PATH = ROOT / "docs" / "company-evidence-coverage-audit-v01.json"
JSON_PATH = ROOT / "docs" / "company-evidence-gap-triage-v01.json"
MD_PATH = ROOT / "docs" / "company-evidence-gap-triage-v01.md"
BASELINE_MAIN = "b6c43183b6d7c91107c1b8122fc7e0bdd9c08349"
REVIEWED_AT = "2026-09-01"

TRIAGE_VALUES = (
    "ACTIONABLE",
    "SUFFICIENT_PARTIAL",
    "NOT_DISCLOSED",
    "NOT_APPLICABLE",
    "DEFERRED",
    "REVIEW_REQUIRED",
)

# Explicit business-model decisions. These companies do not own the kind of
# manufacturing/capacity footprint described by these categories. This is a
# triage decision only; it does not rewrite Coverage or company data.
ASSET_LIGHT = {
    "amd", "arm", "arista", "broadcom", "cadence", "cisco", "credo",
    "marvell", "mediatek", "mobileye", "monolithic-power", "nvidia",
    "qualcomm", "synopsys",
}

# Bounded, high-value queue fixed before follow-up results are seen.
ACTIONABLE = {
    ("fujikura", "manufacturing-facilities"): (
        ["facilities-fujikura-profile-2026"],
        "既存の公式会社概要が国内主要拠点を列挙し、1 Sourceで施設Categoryを安全に改善できる。",
    ),
    ("advantest", "manufacturing-facilities"): (
        ["facilities-advantest-japan-2026"],
        "公式国内拠点ページと既存Facility recordがあり、主要生産・R&D拠点を直接確認できる。",
    ),
    ("kioxia", "manufacturing-facilities"): (
        ["facilities-kioxia-corporate-profile-2026"],
        "公式会社案内が四日市・北上の量産拠点を直接示し、Atlas利用価値が高い。",
    ),
    ("tokyo-electron", "manufacturing-facilities"): (
        ["facilities-tel-technology-solutions-2026", "facilities-tel-miyagi-2026", "facilities-tel-kyushu-2026"],
        "公式拠点ページ群が装置別の開発・製造機能を直接示し、少数Sourceで主要範囲を改善できる。",
    ),
    ("intel", "manufacturing-facilities"): (
        ["sec-intel-2025-10k"],
        "年次Form 10-KのProperties/Manufacturing開示で主要fab footprintを確認でき、AI供給上の重要度が高い。",
    ),
    ("micron", "manufacturing-facilities"): (
        ["sec-micron-2025-10k"],
        "年次Form 10-KのManufacturing/Properties開示で主要メモリ製造拠点を確認できる。",
    ),
    ("applied-materials", "capacity-expansion"): (
        ["official-applied-materials-epic-center"],
        "会社の公式R&D施設投資発表という具体的projectを1件確認すれば、generic Capexと分離して改善できる。",
    ),
    ("vertiv", "capacity-expansion"): (
        ["official-vertiv-capacity-expansion"],
        "会社の公式manufacturing-capacity発表が期待でき、AIデータセンター供給制約の理解に直接寄与する。",
    ),
    ("tsmc", "competitive-positioning"): (
        ["corporate-tsmc-annual-report-2025-ch5"],
        "公式年次報告書のtechnology leadership開示からCompany positioningをAtlas分析と分離して追加できる。",
    ),
    ("tsmc", "risks"): (
        ["official-tsmc-annual-report-2025"],
        "公式年次報告書のRisk Factorsを1 Sourceで確認でき、P1企業の未着手gapとして利用価値が高い。",
    ),
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def classify(company_id: str, item: dict) -> tuple[str, str, str, list[str]]:
    key = (company_id, item["category"])
    missing = item.get("missingStatus")
    if key in ACTIONABLE:
        sources, rationale = ACTIONABLE[key]
        return "ACTIONABLE", "bounded-primary-source-leverage", rationale, sources
    if missing == "not-disclosed":
        return "NOT_DISCLOSED", "explicit-non-disclosure", "既存一次資料確認で非開示が明示または合理的に確認済み。顧客名等を推測しない。", []
    if missing == "not-applicable" or (
        company_id in ASSET_LIGHT
        and item["category"] in {"manufacturing-facilities", "capacity-expansion"}
    ):
        return "NOT_APPLICABLE", "asset-light-business-model", "fabless、IP、software等のbusiness model上、自社製造拠点・自社増産能力として追跡するCategoryではない。", []
    if item["collectionStatus"] == "partial":
        return "SUFFICIENT_PARTIAL", "major-claim-already-evidenced", "主要Claimはstructured Evidence付きで利用可能。complete化のための追加探索は限界効用が低い。", []
    return "DEFERRED", "bounded-search-low-leverage", "情報が存在する可能性はあるが、現在の直接Source leverageが低く、1〜3件の上限で安全に閉じる見込みが不足する。", []


def current_index(coverage: dict) -> dict[tuple[str, str], dict]:
    result = {}
    for company in coverage["companies"]:
        for item in company["categoryCoverage"]:
            result[(company["companyId"], item["category"])] = {
                "companyName": company["companyName"],
                "primaryLayer": company["primaryLayer"],
                **item,
            }
    return result


def initialize_records(coverage: dict) -> list[dict]:
    records = []
    for company in coverage["companies"]:
        for item in company["categoryCoverage"]:
            if item["collectionStatus"] == "complete":
                continue
            triage, code, rationale, target_sources = classify(company["companyId"], item)
            records.append({
                "id": f'{company["companyId"]}:{item["category"]}',
                "companyId": company["companyId"],
                "companyName": company["companyName"],
                "primaryLayer": company["primaryLayer"],
                "category": item["category"],
                "baselineCoverageStatus": item["collectionStatus"],
                "baselineMissingStatus": item.get("missingStatus"),
                "baselineClaimCount": item["claimCount"],
                "baselineEvidenceBindingCount": item["evidenceBindingCount"],
                "baselineLocatorCount": item["locatorCount"],
                "initialClassification": triage,
                "initialReasonCode": code,
                "initialRationale": rationale,
                "targetSourceIds": target_sources,
                "reviewedAt": REVIEWED_AT,
            })
    return sorted(records, key=lambda x: (x["companyId"], x["category"]))


def build() -> dict:
    coverage = load(COVERAGE_PATH)
    existing = load(JSON_PATH) if JSON_PATH.exists() else None
    records = existing["records"] if existing else initialize_records(coverage)
    index = current_index(coverage)
    refreshed = []
    for baseline in records:
        record = {k: v for k, v in baseline.items() if not k.startswith("current") and k not in {"actionStatus", "actionEvidenceDelta"}}
        item = index[(record["companyId"], record["category"])]
        evidence_delta = item["evidenceBindingCount"] - record["baselineEvidenceBindingCount"]
        coverage_changed = item["collectionStatus"] != record["baselineCoverageStatus"]
        completed = record["initialClassification"] == "ACTIONABLE" and (evidence_delta > 0 or coverage_changed)
        current_gap = item["collectionStatus"] != "complete"
        if record["initialClassification"] == "ACTIONABLE" and completed and current_gap:
            current_classification = "SUFFICIENT_PARTIAL" if item["collectionStatus"] == "partial" else "DEFERRED"
        elif current_gap:
            current_classification = record["initialClassification"]
        else:
            current_classification = None
        record.update({
            "currentCoverageStatus": item["collectionStatus"],
            "currentMissingStatus": item.get("missingStatus"),
            "currentClaimCount": item["claimCount"],
            "currentEvidenceBindingCount": item["evidenceBindingCount"],
            "currentLocatorCount": item["locatorCount"],
            "currentGap": current_gap,
            "currentClassification": current_classification,
            "actionStatus": "completed" if completed else ("pending" if record["initialClassification"] == "ACTIONABLE" else "not-required"),
            "actionEvidenceDelta": evidence_delta,
        })
        refreshed.append(record)

    initial = Counter(r["initialClassification"] for r in refreshed)
    current = Counter(r["currentClassification"] for r in refreshed if r["currentGap"])
    pending = [r for r in refreshed if r["actionStatus"] == "pending"]
    completed = [r for r in refreshed if r["actionStatus"] == "completed"]

    def grouped(field: str):
        groups = defaultdict(Counter)
        for rec in refreshed:
            key = rec[field]
            groups[key][rec["initialClassification"]] += 1
        return [
            {field: key, "total": sum(counts.values()), "distribution": {v: counts[v] for v in TRIAGE_VALUES}}
            for key, counts in sorted(groups.items())
        ]

    return {
        "schemaVersion": "0.1",
        "phase": "Evidence Gap Final Triage & Closure Phase",
        "baselineMain": BASELINE_MAIN,
        "reviewedAt": REVIEWED_AT,
        "coverageInputDigest": coverage["inputDigest"],
        "coverageBaseline": {"complete": 321, "partial": 442, "notStarted": 337, "gaps": 779},
        "coverageCurrent": {
            "complete": coverage["summary"]["coverage"]["complete"],
            "partial": coverage["summary"]["coverage"]["partial"],
            "notStarted": coverage["summary"]["coverage"]["not-started"],
            "gaps": coverage["summary"]["coverage"]["partial"] + coverage["summary"]["coverage"]["not-started"],
        },
        "initialDistribution": {value: initial[value] for value in TRIAGE_VALUES},
        "currentDistribution": {value: current[value] for value in TRIAGE_VALUES},
        "actionable": {
            "initialRecords": initial["ACTIONABLE"],
            "initialCompanies": len({r["companyId"] for r in refreshed if r["initialClassification"] == "ACTIONABLE"}),
            "pendingRecords": len(pending),
            "pendingCompanies": len({r["companyId"] for r in pending}),
            "completedRecords": len(completed),
            "completedCompanies": len({r["companyId"] for r in completed}),
        },
        "categorySummary": grouped("category"),
        "companySummary": grouped("companyId"),
        "records": refreshed,
    }


def markdown(report: dict) -> str:
    lines = [
        "# Company Evidence Gap Triage v0.1", "",
        f'- Baseline main: `{report["baselineMain"]}`',
        f'- Initial gaps: `{report["coverageBaseline"]["gaps"]}` (`partial {report["coverageBaseline"]["partial"]}` + `not-started {report["coverageBaseline"]["notStarted"]}`)',
        f'- Current gaps: `{report["coverageCurrent"]["gaps"]}` (`partial {report["coverageCurrent"]["partial"]}` + `not-started {report["coverageCurrent"]["notStarted"]}`)',
        f'- ACTIONABLE pending: `{report["actionable"]["pendingRecords"]}` records / `{report["actionable"]["pendingCompanies"]}` companies',
        "- CoverageとTriageは別管理。SUFFICIENT_PARTIALはCoverage上partialのままでよい。", "",
        "## Distribution", "",
        "| Classification | Initial | Current gaps |", "| --- | ---: | ---: |",
    ]
    for value in TRIAGE_VALUES:
        lines.append(f'| {value} | {report["initialDistribution"][value]} | {report["currentDistribution"][value]} |')
    lines += ["", "## Category summary", "", "| Category | Gaps | Actionable | Sufficient partial | Not disclosed | Not applicable | Deferred | Review required |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"]
    for row in report["categorySummary"]:
        d = row["distribution"]
        lines.append(f'| {row["category"]} | {row["total"]} | {d["ACTIONABLE"]} | {d["SUFFICIENT_PARTIAL"]} | {d["NOT_DISCLOSED"]} | {d["NOT_APPLICABLE"]} | {d["DEFERRED"]} | {d["REVIEW_REQUIRED"]} |')
    lines += ["", "## ACTIONABLE queue", "", "| Company | Category | Status | Target Source | Rationale |", "| --- | --- | --- | --- | --- |"]
    for rec in report["records"]:
        if rec["initialClassification"] != "ACTIONABLE":
            continue
        lines.append(f'| {rec["companyName"]} | {rec["category"]} | {rec["actionStatus"]} | {", ".join(rec["targetSourceIds"])} | {rec["initialRationale"]} |')
    lines += ["", "## Company summary", "", "| Company | Gaps | Actionable | Sufficient partial | Not disclosed | Not applicable | Deferred | Review required |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"]
    names = {r["companyId"]: r["companyName"] for r in report["records"]}
    for row in report["companySummary"]:
        d = row["distribution"]
        lines.append(f'| {names[row["companyId"]]} | {row["total"]} | {d["ACTIONABLE"]} | {d["SUFFICIENT_PARTIAL"]} | {d["NOT_DISCLOSED"]} | {d["NOT_APPLICABLE"]} | {d["DEFERRED"]} | {d["REVIEW_REQUIRED"]} |')
    lines += ["", "## Decision rules", "", "- ACTIONABLEは結果を見る前に固定した10 records / 9 companiesのみ。公式一次資料1〜3件で改善可能かつAtlas利用価値が高い。", "- partialで主要Claimとstructured Evidenceが既にあるgapは、追加探索の限界効用が低いためSUFFICIENT_PARTIAL。", "- 明示的な非開示はNOT_DISCLOSED。顧客名・capacity・market positionを推測しない。", "- fabless / IP / software等の自社製造・自社capacityはNOT_APPLICABLE。", "- その他のnot-startedは、bounded searchで安全に閉じる見込みが低いためDEFERRED。", "- REVIEW_REQUIREDは0。Coverageのcomplete件数を分類根拠に使用しない。", ""]
    return "\n".join(lines)


def validate(report: dict):
    records = report["records"]
    assert len(records) == 779, f"expected 779 baseline gaps, got {len(records)}"
    assert len({r["id"] for r in records}) == 779, "duplicate triage record id"
    assert sum(report["initialDistribution"].values()) == 779
    assert report["initialDistribution"]["REVIEW_REQUIRED"] == 0
    for record in records:
        assert record["initialClassification"] in TRIAGE_VALUES
        if record["currentClassification"] is not None:
            assert record["currentClassification"] in TRIAGE_VALUES
        if record["initialClassification"] == "ACTIONABLE":
            assert record["targetSourceIds"]
    current_gaps = report["coverageCurrent"]["gaps"]
    assert sum(report["currentDistribution"].values()) == current_gaps


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    report = build()
    validate(report)
    json_text = dump(report)
    md_text = markdown(report)
    if args.write:
        JSON_PATH.write_text(json_text, encoding="utf-8", newline="\n")
        MD_PATH.write_text(md_text, encoding="utf-8", newline="\n")
        print(f'Gap triage: {len(report["records"])} records / ACTIONABLE {report["actionable"]["pendingRecords"]} pending / REVIEW_REQUIRED {report["currentDistribution"]["REVIEW_REQUIRED"]}')
        print(f"Wrote {JSON_PATH.relative_to(ROOT)}")
        print(f"Wrote {MD_PATH.relative_to(ROOT)}")
        return 0
    errors = []
    if not JSON_PATH.exists() or JSON_PATH.read_text(encoding="utf-8") != json_text:
        errors.append(str(JSON_PATH.relative_to(ROOT)))
    if not MD_PATH.exists() or MD_PATH.read_text(encoding="utf-8") != md_text:
        errors.append(str(MD_PATH.relative_to(ROOT)))
    if errors:
        print("Gap triage audit stale: " + ", ".join(errors))
        return 1
    print(f'Gap triage audit OK: {len(report["records"])} records / ACTIONABLE {report["actionable"]["pendingRecords"]} pending / REVIEW_REQUIRED {report["currentDistribution"]["REVIEW_REQUIRED"]}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
