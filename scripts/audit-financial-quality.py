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
SPECIAL_FLAG_ORDER = (
    "goodwill-impairment",
    "discontinued-operations",
    "non-consolidated-subsidiary",
    "reit",
    "reconstructed-operating-income",
    "net-basis-capex",
    "broad-capex",
    "company-reported-fcf",
    "adjusted-or-non-gaap-fcf",
    "derived-single-quarter",
    "unclassified-capex-definition",
    "special-operating-profit-definition",
)

# Entity structure is not yet normalized in company JSON. Keep the comparison
# control explicit rather than inferring a subsidiary from generic prose.
NON_CONSOLIDATED_SUBSIDIARIES = {"ajinomoto-fine-techno"}

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
    "specialFlags": {
        "goodwill-impairment": "Reported result includes or discusses goodwill impairment",
        "discontinued-operations": "Continuing/discontinued-operation boundaries affect comparison",
        "non-consolidated-subsidiary": "Non-consolidated subsidiary company-only disclosure",
        "reit": "REIT financial/capital-investment structure",
        "reconstructed-operating-income": "Operating income is reconstructed",
        "net-basis-capex": "Capex is disclosed on a net basis",
        "broad-capex": "Capex uses a broader non-current-asset definition",
        "company-reported-fcf": "FCF value comes from a company-reported measure",
        "adjusted-or-non-gaap-fcf": "Company-reported FCF is adjusted or Non-GAAP",
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


def special_flags(
    record: dict[str, Any],
    company: dict[str, Any],
    capex_category: str,
    operating_profit_category: str,
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
    if fcf.get("value") is not None and has_any(
        fcf_text,
        (r"^company-reported.*\bnon-gaap\b", r"^company-reported.*\badjusted (?:fcf|free cash flow)\b"),
    ):
        flags.add("adjusted-or-non-gaap-fcf")
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
    missing_companies = sorted({record["companyId"] for record in records} - set(company_by_id))
    if missing_companies:
        raise ValueError(f"history references unknown companies: {missing_companies}")

    metric_status_counts: Counter[str] = Counter()
    missing_reason_counts: Counter[str] = Counter()
    cash_flow_counts: Counter[str] = Counter()
    capex_counts: Counter[str] = Counter()
    operating_profit_counts: Counter[str] = Counter()
    special_flag_counts: Counter[str] = Counter()
    company_records: dict[str, list[dict[str, Any]]] = defaultdict(list)
    record_audits: list[dict[str, Any]] = []

    for record in sorted(records, key=lambda item: (item["companyId"], item["endDate"], item["id"])):
        company = company_by_id[record["companyId"]]
        cash_flow_category = classify_cash_flow(record)
        capex_category = classify_capex(record, company)
        operating_profit_category = classify_operating_profit(record)
        flags = special_flags(record, company, capex_category, operating_profit_category)
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
        flags: set[str] = set()
        for audit in audits:
            status_counts.update(status_bucket(status) for status in audit["metricStatuses"].values())
            cash_counts[audit["cashFlowCoverage"]] += 1
            capex_definition_counts[audit["capexDefinition"]] += 1
            operating_definition_counts[audit["operatingProfitDefinition"]] += 1
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
    adjusted_or_non_gaap_fcf = [
        audit["id"]
        for audit in record_audits
        if "adjusted-or-non-gaap-fcf" in audit["specialFlags"]
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

    verified_dates = [record.get("verifiedAt") for record in records if record.get("verifiedAt")]
    history_paths = [
        path
        for path in input_paths
        if path.name == "financial-history.json"
        or re.fullmatch(r"financial-history-v04-batch\d+\.json", path.name)
    ]
    return {
        "schemaVersion": 1,
        "classificationRuleVersion": 1,
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
            "specialFlags": ordered_counts(special_flag_counts, SPECIAL_FLAG_ORDER),
        },
        "actionQueues": {
            "sourceLinked": source_linked,
            "needsReview": needs_review,
            "oneSidedCashFlow": one_sided_cash_flow,
            "unclassifiedCapexDefinition": unclassified_capex,
            "adjustedOrNonGaapFcf": adjusted_or_non_gaap_fcf,
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
    if action_queues["adjustedOrNonGaapFcf"]:
        formatted = ", ".join(f"`{record_id}`" for record_id in action_queues["adjustedOrNonGaapFcf"])
        lines.append(f"- adjusted / Non-GAAP FCF: {formatted}")
    else:
        lines.append("- adjusted / Non-GAAP FCF: なし")
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
