"""Contract tests for the Pilot authoring change-scope guard."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_company_evidence_pilot", ROOT / "scripts" / "validate-company-evidence-pilot.py"
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PilotScopeContractTest(unittest.TestCase):
    def test_financial_history_only_is_allowed_without_pilot_authoring(self):
        self.assertEqual(
            MODULE.pilot_scope_errors(["src/data/financial-history-v05-batch01.json"]),
            [],
        )

    def test_financial_history_and_generated_projection_are_allowed(self):
        self.assertEqual(
            MODULE.pilot_scope_errors(
                [
                    "src/data/financial-history-v05-batch01.json",
                    "src/data/company-compare-evidence-pilot-v01.json",
                    "docs/phase8-pilot-relation-projection-v01.md",
                ]
            ),
            [],
        )

    def test_pilot_authoring_and_financial_history_is_rejected(self):
        errors = MODULE.pilot_scope_errors(
            [
                "src/data/company-evidence-pilot-v02.json",
                "src/data/financial-history-v05-batch01.json",
            ]
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("financial-history", errors[0])

    def test_pilot_authoring_and_company_claim_or_facility_is_rejected(self):
        errors = MODULE.pilot_scope_errors(
            [
                "src/data/company-evidence-pilot-v02.json",
                "src/data/companies/nvidia.json",
                "src/data/claims.json",
                "src/data/facilities.json",
            ]
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("companies/nvidia.json", errors[0])
        self.assertIn("claims.json", errors[0])
        self.assertIn("facilities.json", errors[0])


if __name__ == "__main__":
    unittest.main()
