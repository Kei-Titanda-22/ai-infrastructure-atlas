#!/usr/bin/env python3
"""Generate a deterministic quality audit for normalized financial history."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DEFAULT_JSON = ROOT / "docs" / "financial-quality-audit.json"
DEFAULT_MARKDOWN = ROOT / "docs" / "financial-quality-audit.md"

METRIC_IDS = ("revenue", "operatingProfit", "operatingMargin", "freeCashFlow", "capex")
VALUE_STATUSES = ("verified", "source-linked", "needs-review")
MISSING_STATUSES = (
    "not-collected",
    "primary-source-unchecked",
    "not-calculable",
    "not-disclosed",
    "not-applicable",
)
STATUS_BUCKETS = (*VALUE_STATUSES, "missing")

CASH_FLOW_CATEGORIES = (
    "both-present",
    "fcf-missing-only",
    "capex-missing-only",
    "both-missing",
)
CAPEX_CATEGORIES = (
    "gross-ppe",
    "ppe-plus-intangible",
    "broader-non-current-assets",
    "net-capex",
    "reit-or-real-estate-investment",
    "not-collected",
    "unclassified",
)
OPERATING_PROFIT_CATEGORIES = (
    "direct-gaap-ifrs-operating-income",
    "ebit",
    "reconstructed-operating-income",
    "source-linked",
    "special-case",
)
ADJUSTED_NON_GAAP_FCF_ASSESSMENTS = (
    "atlas-formula-aligned",
    "atlas-definition-difference",
    "unresolved",
    "not-applicable",
)
SPECIAL_FLAG_ORDER = (
    "goodwill-impairment",
    "discontinued-operations",
    "non-consolidated-subsidiary",
    "reit",
    "reconstructed-operating-income",
    "net-basis-capex",
    "broad-capex",
    "company-reported-fcf",
    "non-gaap-fcf-atlas-formula-aligned",
    "fcf-atlas-definition-difference",
    "adjusted-or-non-gaap-fcf-unresolved",
    "cash-flow-inputs-missing",
    "fcf-capex-scope-mismatch",
    "derived-single-quarter",
    "unclassified-capex-definition",
    "special-operating-profit-definition",
)

# Entity structure is not yet normalized in company JSON. Keep the comparison
# control explicit rather than inferring a subsidiary from generic prose.
NON_CONSOLIDATED_SUBSIDIARIES = {"ajinomoto-fine-techno"}

# These are regression expectations, not classification inputs. The classifier
# must derive the result from basis text; CI then protects the reviewed 13-period
# split from silently regressing when the rules change.
EXPECTED_ADJUSTED_NON_GAAP_FCF = {
    "atlas-formula-aligned": {
        "amd-q2-2025",
        "amd-q1-2026",
        "amd-q2-2026",
        "asml-q2-2025",
        "asml-q3-2025",
        "asml-q4-2025",
        "asml-q1-2026",
        "asml-q2-2026",
    },
    "atlas-definition-difference": {
        "abb-q2-2025",
        "abb-q2-2026",
        "micron-q3-fy2026",
        "vertiv-q2-2025",
        "vertiv-q2-2026",
    },
    "unresolved": set(),
}

CATEGORY_DESCRIPTIONS = {
    "cashFlowCoverage": {
        "both-present": "FCF and Capex both have values",
        "fcf-missing-only": "FCF is missing while Capex has a value",
        "capex-missing-only": "Capex is missing while FCF has a value",
        "both-missing": "FCF and Capex are both missing",
    },
    "capexDefinition": {
        "gross-ppe": "Gross/standard cash PP&E expenditure; no net, intangible, broader-asset, or real-estate qualifier detected",
        "ppe-plus-intangible": "PP&E plus intangible assets or capitalized software/development",
        "broader-non-current-assets": "A broader non-current/fixed/long-term asset cash-investment line",
        "net-capex": "Capex or PP&E cash spending disclosed on a net basis",
        "reit-or-real-estate-investment": "REIT or investment-property/real-estate investment definition",
        "not-collected": "No Capex value is collected and no REIT/real-estate definition supersedes the missing classification",
        "unclassified": "A value exists, but basis text does not safely map to another definition category",
    },
    "operatingProfitDefinition": {
        "direct-gaap-ifrs-operating-income": "Direct reported GAAP/IFRS operating income/profit/loss/earnings",
        "ebit": "Reported EBIT used as the operating-profit measure",
        "reconstructed-operating-income": "Atlas reconstructs operating income from reported operating line items",
        "source-linked": "Value is retained as source-linked rather than verified",
        "special-case": "Missing, period-derived, or otherwise not safely classified as a direct reported measure",
    },
    "adjustedNonGaapFcfAssessment": {
        "atlas-formula-aligned": "Adjusted/Non-GAAP label is present, but the disclosed formula is operating cash flow minus the same cash-Capex scope used by Atlas",
        "atlas-definition-difference": "Adjusted/Non-GAAP FCF includes a definition difference such as sale proceeds, net Capex, incentives, or an additional scope component",
        "unresolved": "Adjusted/Non-GAAP FCF is populated but basis text does not close the formula safely",
        "not-applicable": "The record is not a populated company-reported adjusted/Non-GAAP FCF",
    },
    "specialFlags": {
        "goodwill-impairment": "Reported result includes or discusses goodwill impairment",
        "discontinued-operations": "Continuing/discontinued-operation boundaries affect comparison",
        "non-consolidated-subsidiary": "Non-consolidated subsidiary company-only disclosure",
        "reit": "REIT financial/capital-investment structure",
        "reconstructed-operating-income": "Operating income is reconstructed",
        "net-basis-capex": "Capex is disclosed on a net basis",
        "broad-capex": "Capex uses a broader non-current-asset definition",
        "company-reported-fcf": "FCF value comes from a company-reported measure",
        "non-gaap-fcf-atlas-formula-aligned": "Adjusted/Non-GAAP wording is present, but the disclosed formula matches Atlas FCF scope",
        "fcf-atlas-definition-difference": "FCF uses a definition that differs from Atlas gross cash-Capex normalization",
        "adjusted-or-non-gaap-fcf-unresolved": "Adjusted/Non-GAAP FCF formula cannot be closed from current basis text",
        "cash-flow-inputs-missing": "A populated FCF record does not have complete cashFlowInputs",
        "fcf-capex-scope-mismatch": "The populated FCF subtracts a cash-investment component outside the stored Capex value's scope",
        "derived-single-quarter": "A single-quarter value is derived from cumulative periods",
        "unclassified-capex-definition": "A populated Capex value remains definition-unclassified",
        "special-operating-profit-definition": "Operating-profit definition is classified as a special case",
    },
}


def batch_number(path: Path) -> int:
    match = re.search(r"batch(\d+)", path.name)
    return int(match.group(1)) if match else 0


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_inputs() -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]], list[Path], int]:
    history_paths = [DATA / "financial-history.json"]
    history_paths.extend(sorted(DATA.glob("financial-history-v04-batch*.json"), key=batch_number))
    records: list[dict[str, Any]] = []
    for path in history_paths:
        records.extend(load_json(path))

    records = copy.deepcopy(records)
    record_by_id = {record["id"]: record for record in records}
    overrides_path = DATA / "financial-history-v04-cashflow-overrides.json"
    overrides = load_json(overrides_path)
    for override in overrides:
        target = record_by_id.get(override["id"])
        if target is None:
            raise ValueError(f"cash-flow override references unknown record: {override['id']}")
        target.update({key: value for key, value in override.items() if key not in {"id", "metrics"}})
        target["metrics"].update(override.get("metrics", {}))

    company_paths = sorted((DATA / "companies").glob("*.json"))
    companies = [load_json(path) for path in company_paths]
    company_by_id = {company["id"]: company for company in companies}
    # The digest tracks financial facts only. Company names/tags still feed the
    # rendered report and are compared by --check, while unrelated company
    # metadata edits do not force a meaningless digest-only report update.
    input_paths = [*history_paths, overrides_path]
    return records, company_by_id, input_paths, len(overrides)


def combined_input_digest(paths: Iterable[Path]) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths, key=lambda item: item.relative_to(ROOT).as_posix()):
        relative = path.relative_to(ROOT).as_posix().encode("utf-8")
        digest.update(relative)
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def basis_text(record: dict[str, Any], metric_id: str | None = None) -> str:
    parts = [str(record.get("accountingBasis", ""))]
    metrics = record.get("metrics", {})
    if metric_id:
        parts.append(str(metrics.get(metric_id, {}).get("basis", "")))
    else:
        parts.extend(str(metric.get("basis", "")) for metric in metrics.values())
    cash_inputs = record.get("cashFlowInputs", {})
    parts.append(str(cash_inputs.get("capexBasis", "")))
    return " ".join(part for part in parts if part).lower()


def is_reit(company: dict[str, Any]) -> bool:
    tags = {str(tag).strip().lower() for tag in company.get("tags", [])}
    descriptive_text = " ".join(
        str(company.get(key, "")) for key in ("summary", "aiRole", "officialName")
    ).lower()
    return "reit" in tags or re.search(r"\breit\b", descriptive_text, flags=re.IGNORECASE) is not None


def has_any(text: str, patterns: Iterable[str]) -> bool:
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def classify_cash_flow(record: dict[str, Any]) -> str:
    has_fcf = record["metrics"]["freeCashFlow"].get("value") is not None
    has_capex = record["metrics"]["capex"].get("value") is not None
    if has_fcf and has_capex:
        return "both-present"
    if not has_fcf and has_capex:
        return "fcf-missing-only"
    if has_fcf and not has_capex:
        return "capex-missing-only"
    return "both-missing"


def classify_capex(record: dict[str, Any], company: dict[str, Any]) -> str:
    capex = record["metrics"]["capex"]
    text = " ".join(
        [
            basis_text(record, "capex"),
            str(record["metrics"]["freeCashFlow"].get("basis", "")).lower(),
        ]
    )

    if is_reit(company) or has_any(
        text,
        (r"\binvestment propert(?:y|ies)\b", r"\binvestments? in real estate\b", r"\breal-estate investment\b"),
    ):
        return "reit-or-real-estate-investment"
    if capex.get("value") is None:
        return "not-collected"
    if has_any(
        text,
        (
            r"\bnet capital expenditures?\b",
            r"\bcapital expenditures?, net\b",
            r"\b(?:property(?:, plant)? and equipment|pp&e|tangible assets), net\b",
            r"\bnet (?:cash )?(?:payments?|spending|capex)\b",
            r"\bnet of (?:asset )?sales\b",
            r"\binvestments? (?:in )?(?:tangible assets|property and equipment), net\b",
        ),
    ):
        return "net-capex"
    if has_any(text, (r"\bnon-current assets?\b", r"\bother long-term assets?\b")):
        return "broader-non-current-assets"
    if has_any(
        text,
        (
            r"\bintangible assets?\b",
            r"\bcapitalized software\b",
            r"\bcapitali[sz]ed (?:development|r&d)\b",
            r"無形(?:固定)?資産",
            r"有形及び無形固定資産",
        ),
    ):
        return "ppe-plus-intangible"
    if has_any(
        text,
        (
            r"\bgross (?:cash )?(?:capex|capital expenditures?|payments?|purchases?)\b",
            r"\b(?:purchase|purchases|acquisition|acquisitions|additions|payments) of (?:property|pp&e|tangible|fixed assets?)",
            r"\bproperty, plant (?:&|and) equipment\b",
            r"\bproperty and equipment\b",
            r"\bpp&e\b",
            r"\btangible assets?\b",
            r"有形固定資産",
        ),
    ):
        return "gross-ppe"
    return "unclassified"


def classify_operating_profit(record: dict[str, Any]) -> str:
    metric = record["metrics"]["operatingProfit"]
    status = metric.get("status")
    text = basis_text(record, "operatingProfit")
    if status == "source-linked":
        return "source-linked"
    if has_any(text, (r"atlas再構成", r"\breconstruct(?:ed|ion)\b", r"atlas算出")):
        return "reconstructed-operating-income"
    if has_any(text, (r"\breported ebit\b", r"\bconsolidated reported ebit\b")):
        return "ebit"
    if metric.get("value") is None or status != "verified" or "単四半期化" in text:
        return "special-case"
    if has_any(
        text,
        (
            r"\boperating (?:income|profit|loss|earnings|result)\b",
            r"\bincome from operations\b",
            r"\bprofit from operations\b",
            r"\bloss from operations\b",
            r"営業利益",
        ),
    ):
        return "direct-gaap-ifrs-operating-income"
    return "special-case"


def is_adjusted_or_non_gaap_fcf(record: dict[str, Any]) -> bool:
    fcf = record["metrics"]["freeCashFlow"]
    text = str(fcf.get("basis", "")).lower().lstrip()
    return fcf.get("value") is not None and has_any(
        text,
        (
            r"^company-reported.*\bnon-gaap\b",
            r"^company-reported.*\badjusted (?:fcf|free cash flow)\b",
        ),
    )


def adjusted_non_gaap_fcf_assessment(record: dict[str, Any]) -> tuple[str, list[str]]:
    if not is_adjusted_or_non_gaap_fcf(record):
        return "not-applicable", []

    fcf_text = str(record["metrics"]["freeCashFlow"].get("basis", "")).lower()
    capex_text = str(record["metrics"]["capex"].get("basis", "")).lower()
    combined = f"{fcf_text} {capex_text}"
    difference_reasons: list[str] = []

    if has_any(combined, (r"\bnet capital expenditures?\b", r"\bcapital expenditures?, net\b")):
        difference_reasons.append("net-capex")
    if has_any(fcf_text, (r"\bsale proceeds\b", r"\bproceeds from (?:the )?sale\b")):
        difference_reasons.append("includes-asset-sale-proceeds")
    if has_any(fcf_text, (r"\bgovernment incentives?\b", r"\bgovernment subsidies\b")):
        difference_reasons.append("includes-government-incentives")
    if has_any(fcf_text, (r"\bcapitalized software\b",)) and has_any(
        capex_text,
        (r"別途.*capitalized software", r"capitalized software.*(?:separate|別途|exclude)"),
    ):
        difference_reasons.append("capitalized-software-outside-capex")

    if difference_reasons:
        return "atlas-definition-difference", difference_reasons

    has_operating_cash_flow = has_any(
        fcf_text,
        (
            r"\boperating cash flow\b",
            r"\bcash flow from operating activities\b",
            r"\bnet cash provided by operating activities\b",
        ),
    )
    has_cash_capex = has_any(
        fcf_text,
        (
            r"\bpurchases? of (?:property(?:, plant)? and equipment|pp&e)",
            r"\bcapital expenditures?\b",
        ),
    )
    has_subtraction = has_any(fcf_text, (r"\s[−-]\s", r"\bminus\b"))
    if has_operating_cash_flow and has_cash_capex and has_subtraction:
        return "atlas-formula-aligned", ["operating-cash-flow-minus-cash-capex"]

    return "unresolved", ["formula-not-closed-from-basis"]


def cash_flow_inputs_status(record: dict[str, Any]) -> str:
    if record["metrics"]["freeCashFlow"].get("value") is None:
        return "not-applicable"
    cash_inputs = record.get("cashFlowInputs")
    if not isinstance(cash_inputs, dict):
        return "missing"
    required = ("operatingCashFlow", "capexCashOutflow")
    return "complete" if all(cash_inputs.get(key) is not None for key in required) else "missing"


def fcf_capex_scope_mismatch_reasons(record: dict[str, Any]) -> list[str]:
    metrics = record["metrics"]
    if metrics["freeCashFlow"].get("value") is None or metrics["capex"].get("value") is None:
        return []
    fcf_text = str(metrics["freeCashFlow"].get("basis", "")).lower()
    capex_text = str(metrics["capex"].get("basis", "")).lower()
    reasons: list[str] = []
    if has_any(fcf_text, (r"\bcapitalized software\b",)) and has_any(
        capex_text,
        (r"別途.*capitalized software", r"capitalized software.*(?:separate|別途|exclude)"),
    ):
        reasons.append("fcf-includes-capitalized-software-capex-excludes-it")
    return reasons


def special_flags(
    record: dict[str, Any],
    company: dict[str, Any],
    capex_category: str,
    operating_profit_category: str,
    adjusted_fcf_assessment: str,
    cash_inputs_status: str,
    scope_mismatch_reasons: list[str],
) -> list[str]:
    text = basis_text(record)
    fcf = record["metrics"]["freeCashFlow"]
    fcf_text = str(fcf.get("basis", "")).lower()
    flags: set[str] = set()

    if has_any(text, (r"\bgoodwill impairment\b", r"のれん.*減損")):
        flags.add("goodwill-impairment")
    if has_any(text, (r"\bdiscontinued operations?\b", r"\bdiscontinuation\b", r"非継続事業")):
        flags.add("discontinued-operations")
    if record["companyId"] in NON_CONSOLIDATED_SUBSIDIARIES:
        flags.add("non-consolidated-subsidiary")
    if is_reit(company):
        flags.add("reit")
    if operating_profit_category == "reconstructed-operating-income":
        flags.add("reconstructed-operating-income")
    if operating_profit_category == "special-case":
        flags.add("special-operating-profit-definition")
    if capex_category == "net-capex":
        flags.add("net-basis-capex")
    if capex_category == "broader-non-current-assets":
        flags.add("broad-capex")
    if capex_category == "unclassified":
        flags.add("unclassified-capex-definition")
    if fcf.get("value") is not None and fcf_text.lstrip().startswith("company-reported"):
        flags.add("company-reported-fcf")
    assessment_flags = {
        "atlas-formula-aligned": "non-gaap-fcf-atlas-formula-aligned",
        "atlas-definition-difference": "fcf-atlas-definition-difference",
        "unresolved": "adjusted-or-non-gaap-fcf-unresolved",
    }
    if adjusted_fcf_assessment in assessment_flags:
        flags.add(assessment_flags[adjusted_fcf_assessment])
    if cash_inputs_status == "missing":
        flags.add("cash-flow-inputs-missing")
    if scope_mismatch_reasons:
        flags.add("fcf-capex-scope-mismatch")
    if has_any(text, (r"単四半期化", r"\bsingle-quarter.*derived\b", r"\bcumulative difference\b")):
        flags.add("derived-single-quarter")

    return [flag for flag in SPECIAL_FLAG_ORDER if flag in flags]


def ordered_counts(counter: Counter[str], order: Iterable[str]) -> dict[str, int]:
    return {key: counter.get(key, 0) for key in order}


def status_bucket(status: str) -> str:
    if status in VALUE_STATUSES:
        return status
    if status in MISSING_STATUSES:
        return "missing"
    raise ValueError(f"unknown metric status: {status}")


def build_report() -> dict[str, Any]:
    records, company_by_id, input_paths, override_count = load_inputs()
    record_by_id = {record["id"]: record for record in records}
    missing_companies = sorted({record["companyId"] for record in records} - set(company_by_id))
    if missing_companies:
        raise ValueError(f"history references unknown companies: {missing_companies}")

    metric_status_counts: Counter[str] = Counter()
    missing_reason_counts: Counter[str] = Counter()
    cash_flow_counts: Counter[str] = Counter()
    capex_counts: Counter[str] = Counter()
    operating_profit_counts: Counter[str] = Counter()
    adjusted_fcf_assessment_counts: Counter[str] = Counter()
    special_flag_counts: Counter[str] = Counter()
    company_records: dict[str, list[dict[str, Any]]] = defaultdict(list)
    record_audits: list[dict[str, Any]] = []

    for record in sorted(records, key=lambda item: (item["companyId"], item["endDate"], item["id"])):
        company = company_by_id[record["companyId"]]
        cash_flow_category = classify_cash_flow(record)
        capex_category = classify_capex(record, company)
        operating_profit_category = classify_operating_profit(record)
        adjusted_fcf_category, adjusted_fcf_reasons = adjusted_non_gaap_fcf_assessment(record)
        cash_inputs_status = cash_flow_inputs_status(record)
        scope_mismatch_reasons = fcf_capex_scope_mismatch_reasons(record)
        flags = special_flags(
            record,
            company,
            capex_category,
            operating_profit_category,
            adjusted_fcf_category,
            cash_inputs_status,
            scope_mismatch_reasons,
        )
        metric_statuses = {metric_id: record["metrics"][metric_id]["status"] for metric_id in METRIC_IDS}
        missing_metrics = [
            metric_id for metric_id in METRIC_IDS if record["metrics"][metric_id].get("value") is None
        ]

        for status in metric_statuses.values():
            metric_status_counts[status_bucket(status)] += 1
            if status in MISSING_STATUSES:
                missing_reason_counts[status] += 1
        cash_flow_counts[cash_flow_category] += 1
        capex_counts[capex_category] += 1
        operating_profit_counts[operating_profit_category] += 1
        adjusted_fcf_assessment_counts[adjusted_fcf_category] += 1
        special_flag_counts.update(flags)

        audit = {
            "id": record["id"],
            "companyId": record["companyId"],
            "periodType": record["periodType"],
            "periodLabel": record["periodLabel"],
            "endDate": record["endDate"],
            "metricStatuses": metric_statuses,
            "missingMetrics": missing_metrics,
            "cashFlowCoverage": cash_flow_category,
            "capexDefinition": capex_category,
            "operatingProfitDefinition": operating_profit_category,
            "adjustedNonGaapFcfAssessment": adjusted_fcf_category,
            "adjustedNonGaapFcfAssessmentReasons": adjusted_fcf_reasons,
            "cashFlowInputsStatus": cash_inputs_status,
            "fcfCapexScopeMismatchReasons": scope_mismatch_reasons,
            "specialFlags": flags,
        }
        record_audits.append(audit)
        company_records[record["companyId"]].append(audit)

    company_audits: list[dict[str, Any]] = []
    for company_id in sorted(company_records):
        audits = company_records[company_id]
        status_counts: Counter[str] = Counter()
        cash_counts: Counter[str] = Counter()
        capex_definition_counts: Counter[str] = Counter()
        operating_definition_counts: Counter[str] = Counter()
        adjusted_fcf_counts: Counter[str] = Counter()
        flags: set[str] = set()
        for audit in audits:
            status_counts.update(status_bucket(status) for status in audit["metricStatuses"].values())
            cash_counts[audit["cashFlowCoverage"]] += 1
            capex_definition_counts[audit["capexDefinition"]] += 1
            operating_definition_counts[audit["operatingProfitDefinition"]] += 1
            adjusted_fcf_counts[audit["adjustedNonGaapFcfAssessment"]] += 1
            flags.update(audit["specialFlags"])
        company = company_by_id[company_id]
        company_audits.append(
            {
                "companyId": company_id,
                "name": company.get("name", company_id),
                "japaneseName": company.get("japaneseName", company.get("name", company_id)),
                "periods": len(audits),
                "metricStatusCounts": ordered_counts(status_counts, STATUS_BUCKETS),
                "cashFlowCoverage": ordered_counts(cash_counts, CASH_FLOW_CATEGORIES),
                "capexDefinitions": ordered_counts(capex_definition_counts, CAPEX_CATEGORIES),
                "operatingProfitDefinitions": ordered_counts(
                    operating_definition_counts, OPERATING_PROFIT_CATEGORIES
                ),
                "adjustedNonGaapFcfAssessments": ordered_counts(
                    adjusted_fcf_counts, ADJUSTED_NON_GAAP_FCF_ASSESSMENTS
                ),
                "specialFlags": [flag for flag in SPECIAL_FLAG_ORDER if flag in flags],
            }
        )

    source_linked = [
        {
            "recordId": audit["id"],
            "metrics": [metric for metric, status in audit["metricStatuses"].items() if status == "source-linked"],
        }
        for audit in record_audits
        if "source-linked" in audit["metricStatuses"].values()
    ]
    needs_review = [
        {
            "recordId": audit["id"],
            "metrics": [metric for metric, status in audit["metricStatuses"].items() if status == "needs-review"],
        }
        for audit in record_audits
        if "needs-review" in audit["metricStatuses"].values()
    ]
    one_sided_cash_flow = [
        {"recordId": audit["id"], "coverage": audit["cashFlowCoverage"]}
        for audit in record_audits
        if audit["cashFlowCoverage"] in {"fcf-missing-only", "capex-missing-only"}
    ]
    unclassified_capex = [
        audit["id"] for audit in record_audits if audit["capexDefinition"] == "unclassified"
    ]
    adjusted_fcf_queues = {
        category: [
            {
                "recordId": audit["id"],
                "companyId": audit["companyId"],
                "periodLabel": audit["periodLabel"],
                "value": record_by_id[audit["id"]]["metrics"]["freeCashFlow"]["value"],
                "status": record_by_id[audit["id"]]["metrics"]["freeCashFlow"]["status"],
                "basis": record_by_id[audit["id"]]["metrics"]["freeCashFlow"]["basis"],
                "sourceId": record_by_id[audit["id"]]["sourceId"],
                "reasons": audit["adjustedNonGaapFcfAssessmentReasons"],
            }
            for audit in record_audits
            if audit["adjustedNonGaapFcfAssessment"] == category
        ]
        for category in (
            "atlas-formula-aligned",
            "atlas-definition-difference",
            "unresolved",
        )
    }
    cash_flow_inputs_missing = [
        audit["id"] for audit in record_audits if audit["cashFlowInputsStatus"] == "missing"
    ]
    fcf_capex_scope_mismatch = [
        {"recordId": audit["id"], "reasons": audit["fcfCapexScopeMismatchReasons"]}
        for audit in record_audits
        if audit["fcfCapexScopeMismatchReasons"]
    ]

    total_metrics = len(records) * len(METRIC_IDS)
    if sum(metric_status_counts.values()) != total_metrics:
        raise AssertionError("metric status classification does not cover every metric")
    if sum(cash_flow_counts.values()) != len(records):
        raise AssertionError("cash-flow classification does not cover every period")
    if sum(capex_counts.values()) != len(records):
        raise AssertionError("Capex definition classification does not cover every period")
    if sum(operating_profit_counts.values()) != len(records):
        raise AssertionError("operating-profit classification does not cover every period")
    if sum(adjusted_fcf_assessment_counts.values()) != len(records):
        raise AssertionError("adjusted/Non-GAAP FCF assessment does not cover every period")
    for category, expected_ids in EXPECTED_ADJUSTED_NON_GAAP_FCF.items():
        observed_ids = {
            audit["id"]
            for audit in record_audits
            if audit["adjustedNonGaapFcfAssessment"] == category
        }
        if observed_ids != expected_ids:
            raise AssertionError(
                f"reviewed adjusted/Non-GAAP FCF regression for {category}: "
                f"expected={sorted(expected_ids)} observed={sorted(observed_ids)}"
            )

    verified_dates = [record.get("verifiedAt") for record in records if record.get("verifiedAt")]
    history_paths = [
        path
        for path in input_paths
        if path.name == "financial-history.json"
        or re.fullmatch(r"financial-history-v04-batch\d+\.json", path.name)
    ]
    return {
        "schemaVersion": 2,
        "classificationRuleVersion": 2,
        "dataAsOf": max(verified_dates) if verified_dates else None,
        "inputDigestSha256": combined_input_digest(input_paths),
        "inputs": {
            "historyFiles": [path.relative_to(ROOT).as_posix() for path in history_paths],
            "companyFiles": len(company_by_id),
            "cashFlowOverrides": override_count,
        },
        "definitions": CATEGORY_DESCRIPTIONS,
        "summary": {
            "companies": len(company_records),
            "periods": len(records),
            "metrics": total_metrics,
            "metricStatusCounts": ordered_counts(metric_status_counts, STATUS_BUCKETS),
            "missingReasonCounts": ordered_counts(missing_reason_counts, MISSING_STATUSES),
            "cashFlowCoverage": ordered_counts(cash_flow_counts, CASH_FLOW_CATEGORIES),
            "capexDefinitions": ordered_counts(capex_counts, CAPEX_CATEGORIES),
            "operatingProfitDefinitions": ordered_counts(
                operating_profit_counts, OPERATING_PROFIT_CATEGORIES
            ),
            "adjustedNonGaapFcfAssessments": ordered_counts(
                adjusted_fcf_assessment_counts, ADJUSTED_NON_GAAP_FCF_ASSESSMENTS
            ),
            "specialFlags": ordered_counts(special_flag_counts, SPECIAL_FLAG_ORDER),
        },
        "actionQueues": {
            "sourceLinked": source_linked,
            "needsReview": needs_review,
            "oneSidedCashFlow": one_sided_cash_flow,
            "unclassifiedCapexDefinition": unclassified_capex,
            "nonGaapFcfAtlasFormulaAligned": adjusted_fcf_queues["atlas-formula-aligned"],
            "adjustedNonGaapFcfAtlasDefinitionDifference": adjusted_fcf_queues[
                "atlas-definition-difference"
            ],
            "adjustedNonGaapFcfUnresolved": adjusted_fcf_queues["unresolved"],
            "cashFlowInputsMissing": cash_flow_inputs_missing,
            "fcfCapexScopeMismatch": fcf_capex_scope_mismatch,
        },
        "companies": company_audits,
        "records": record_audits,
    }


def markdown_cell(value: Any) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def render_count_table(title: str, counts: dict[str, int], descriptions: dict[str, str]) -> list[str]:
    lines = [f"## {title}", "", "| 分類 | 件数 | 定義 |", "| --- | ---: | --- |"]
    for key, count in counts.items():
        lines.append(f"| `{key}` | {count} | {markdown_cell(descriptions[key])} |")
    lines.append("")
    return lines


def render_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# 100社財務品質監査",
        "",
        f"データ基準日: **{report['dataAsOf']}**",
        "",
        f"入力SHA-256: `{report['inputDigestSha256']}`",
        "",
        "生成: `python scripts/audit-financial-quality.py --write`",
        "",
        "このレポートは財務値を書き換えず、正規化履歴の検証状態、欠損、FCF/Capex充足、定義差、比較上の特殊要因を機械的に可視化する。自由記述の `basis` を明示ルールで分類し、安全に分類できない値は `unclassified` のまま残す。JSON版には全期間の判定を収録する。",
        "",
        "## 全体サマリー",
        "",
        "| 項目 | 件数 |",
        "| --- | ---: |",
        f"| 企業 | {summary['companies']} |",
        f"| 期間 | {summary['periods']} |",
        f"| 指標 | {summary['metrics']} |",
        f"| cash-flow override | {report['inputs']['cashFlowOverrides']} |",
        "",
    ]
    lines.extend(
        render_count_table(
            "指標の検証状態",
            summary["metricStatusCounts"],
            {
                "verified": "一次資料と値・算式を検証済み",
                "source-linked": "Sourceに紐付くがverifiedではない値",
                "needs-review": "値はあるが再確認が必要",
                "missing": "欠損理由ステータスを持つ値なし指標",
            },
        )
    )
    lines.extend(
        render_count_table(
            "FCF / Capex充足",
            summary["cashFlowCoverage"],
            report["definitions"]["cashFlowCoverage"],
        )
    )
    lines.extend(
        render_count_table(
            "Capex定義",
            summary["capexDefinitions"],
            report["definitions"]["capexDefinition"],
        )
    )
    lines.extend(
        render_count_table(
            "Operating Profit定義",
            summary["operatingProfitDefinitions"],
            report["definitions"]["operatingProfitDefinition"],
        )
    )
    lines.extend(
        render_count_table(
            "Adjusted / Non-GAAP FCF判定",
            summary["adjustedNonGaapFcfAssessments"],
            report["definitions"]["adjustedNonGaapFcfAssessment"],
        )
    )

    lines.extend(["## 特殊比較フラグ", "", "| フラグ | 期間数 | 定義 |", "| --- | ---: | --- |"])
    for flag, count in summary["specialFlags"].items():
        lines.append(
            f"| `{flag}` | {count} | {markdown_cell(report['definitions']['specialFlags'][flag])} |"
        )
    lines.append("")

    action_queues = report["actionQueues"]
    lines.extend(["## 要確認キュー", ""])
    if action_queues["sourceLinked"]:
        formatted = ", ".join(
            f"`{item['recordId']}` ({', '.join(item['metrics'])})" for item in action_queues["sourceLinked"]
        )
        lines.append(f"- source-linked: {formatted}")
    else:
        lines.append("- source-linked: なし")
    if action_queues["needsReview"]:
        formatted = ", ".join(
            f"`{item['recordId']}` ({', '.join(item['metrics'])})" for item in action_queues["needsReview"]
        )
        lines.append(f"- needs-review: {formatted}")
    else:
        lines.append("- needs-review: なし")
    if action_queues["oneSidedCashFlow"]:
        formatted = ", ".join(
            f"`{item['recordId']}` ({item['coverage']})" for item in action_queues["oneSidedCashFlow"]
        )
        lines.append(f"- FCF/Capex片側欠損: {formatted}")
    else:
        lines.append("- FCF/Capex片側欠損: なし")
    if action_queues["unclassifiedCapexDefinition"]:
        formatted = ", ".join(f"`{record_id}`" for record_id in action_queues["unclassifiedCapexDefinition"])
        lines.append(f"- Capex定義未分類: {formatted}")
    else:
        lines.append("- Capex定義未分類: なし")
    if action_queues["nonGaapFcfAtlasFormulaAligned"]:
        formatted = ", ".join(
            f"`{item['recordId']}`" for item in action_queues["nonGaapFcfAtlasFormulaAligned"]
        )
        lines.append(f"- Non-GAAP表記・Atlas算式一致（値変更対象外）: {formatted}")
    else:
        lines.append("- Non-GAAP表記・Atlas算式一致（値変更対象外）: なし")
    if action_queues["adjustedNonGaapFcfAtlasDefinitionDifference"]:
        formatted = ", ".join(
            f"`{item['recordId']}` ({', '.join(item['reasons'])})"
            for item in action_queues["adjustedNonGaapFcfAtlasDefinitionDifference"]
        )
        lines.append(f"- Atlas定義差あり（一次資料再確認）: {formatted}")
    else:
        lines.append("- Atlas定義差あり（一次資料再確認）: なし")
    if action_queues["adjustedNonGaapFcfUnresolved"]:
        formatted = ", ".join(
            f"`{item['recordId']}` ({', '.join(item['reasons'])})"
            for item in action_queues["adjustedNonGaapFcfUnresolved"]
        )
        lines.append(f"- adjusted / Non-GAAP算式未解決: {formatted}")
    else:
        lines.append("- adjusted / Non-GAAP算式未解決: なし")
    if action_queues["cashFlowInputsMissing"]:
        formatted = ", ".join(f"`{record_id}`" for record_id in action_queues["cashFlowInputsMissing"])
        lines.append(f"- cashFlowInputs未登録（FCF値あり）: {formatted}")
    else:
        lines.append("- cashFlowInputs未登録（FCF値あり）: なし")
    if action_queues["fcfCapexScopeMismatch"]:
        formatted = ", ".join(
            f"`{item['recordId']}` ({', '.join(item['reasons'])})"
            for item in action_queues["fcfCapexScopeMismatch"]
        )
        lines.append(f"- FCF/Capex scope mismatch: {formatted}")
    else:
        lines.append("- FCF/Capex scope mismatch: なし")
    lines.append("")

    lines.extend(
        [
            "## 会社別監査",
            "",
            "V/S/R/M = verified / source-linked / needs-review / missing。CF列は FCF+Capex両方あり / FCFのみ欠損 / Capexのみ欠損 / 両方欠損。",
            "",
            "| companyId | 企業 | 期間 | V | S | R | M | CF両方 | FCF欠 | Capex欠 | 両方欠 | 特殊フラグ |",
            "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
        ]
    )
    for company in report["companies"]:
        status = company["metricStatusCounts"]
        cash = company["cashFlowCoverage"]
        flags = ", ".join(company["specialFlags"]) or "—"
        lines.append(
            "| {company_id} | {name} | {periods} | {verified} | {source_linked} | {needs_review} | "
            "{missing} | {both} | {fcf_missing} | {capex_missing} | {both_missing} | {flags} |".format(
                company_id=markdown_cell(company["companyId"]),
                name=markdown_cell(company["japaneseName"]),
                periods=company["periods"],
                verified=status["verified"],
                source_linked=status["source-linked"],
                needs_review=status["needs-review"],
                missing=status["missing"],
                both=cash["both-present"],
                fcf_missing=cash["fcf-missing-only"],
                capex_missing=cash["capex-missing-only"],
                both_missing=cash["both-missing"],
                flags=markdown_cell(flags),
            )
        )
    lines.append("")
    lines.extend(
        [
            "## 運用ルール",
            "",
            "- 財務履歴、cash-flow override、会社メタデータが変わったら `--write` でJSON/Markdownを再生成する。",
            "- CIは `--check` で入力SHA-256と全分類を再計算し、コミット済みレポートとの差分を検出する。",
            "- 分類は比較上の監査ラベルであり、各指標の一次根拠は引き続きレコードの `sourceId` と `basis` を正とする。",
            "- adjusted / Non-GAAPのAtlas定義判定、`cashFlowInputs` 登録状態、FCF/Capex scope一致は独立軸として扱う。",
            "- `unclassified`、`source-linked`、`needs-review` は隠さず、次の一次資料監査候補として扱う。",
            "",
        ]
    )
    return "\n".join(lines)


def render_json(report: dict[str, Any]) -> str:
    return json.dumps(report, ensure_ascii=False, indent=2) + "\n"


def print_summary(report: dict[str, Any]) -> None:
    summary = report["summary"]
    statuses = summary["metricStatusCounts"]
    cash = summary["cashFlowCoverage"]
    print(
        "Financial quality audit: "
        f"{summary['companies']} companies / {summary['periods']} periods / {summary['metrics']} metrics"
    )
    print(
        "Metric status: "
        f"verified={statuses['verified']} / source-linked={statuses['source-linked']} / "
        f"needs-review={statuses['needs-review']} / missing={statuses['missing']}"
    )
    print(
        "FCF/Capex coverage: "
        f"both={cash['both-present']} / FCF-only-missing={cash['fcf-missing-only']} / "
        f"Capex-only-missing={cash['capex-missing-only']} / both-missing={cash['both-missing']}"
    )
    print(
        "Definition queues: "
        f"unclassified-capex={summary['capexDefinitions']['unclassified']} / "
        f"special-operating-profit={summary['operatingProfitDefinitions']['special-case']}"
    )
    adjusted = summary["adjustedNonGaapFcfAssessments"]
    print(
        "Adjusted/Non-GAAP FCF: "
        f"Atlas-aligned={adjusted['atlas-formula-aligned']} / "
        f"definition-difference={adjusted['atlas-definition-difference']} / "
        f"unresolved={adjusted['unresolved']}"
    )
    print(
        "Independent cash-flow flags: "
        f"inputs-missing={summary['specialFlags']['cash-flow-inputs-missing']} / "
        f"scope-mismatch={summary['specialFlags']['fcf-capex-scope-mismatch']}"
    )


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
    mode.add_argument("--check", action="store_true", help="fail when committed reports do not match current data")
    parser.add_argument("--json-output", default="", help="JSON path relative to the repository root")
    parser.add_argument("--markdown-output", default="", help="Markdown path relative to the repository root")
    args = parser.parse_args()

    json_path = resolve_output(args.json_output, DEFAULT_JSON)
    markdown_path = resolve_output(args.markdown_output, DEFAULT_MARKDOWN)
    report = build_report()
    json_output = render_json(report)
    markdown_output = render_markdown(report)
    print_summary(report)

    if args.write:
        for path, content in ((json_path, json_output), (markdown_path, markdown_output)):
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
            print(f"Wrote {path.relative_to(ROOT)}")
    elif args.check:
        if not all(
            (
                check_output(json_path, json_output),
                check_output(markdown_path, markdown_output),
            )
        ):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
