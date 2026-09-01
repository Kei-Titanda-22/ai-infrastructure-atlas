# Company Evidence v1 Coverage Close

- Decision: **Company Evidence v1 Coverage Close = YES**
- Close date: `2026-09-01`
- Validation baseline main: `d8b6e223ec49bd454a0fd1276989723b0810a2d0`
- Validation: `Company Evidence Triage Validation v0.2 = PASS`
- ACTIONABLE pending: `0`
- REVIEW_REQUIRED: `0`

## Meaning of this close

Company Evidence v1 Coverage is closed because all 100 companies have primary Company Evidence at maturity L4, structured Evidence Binding and Locator operations are in place, high-value ACTIONABLE gaps have been processed, and every remaining gap has a persistent reviewed Triage decision. The original DEFERRED fallback failure was corrected through a bounded primary-source re-review of the affected 300 records, followed by two independent validation-remediation cycles and a final deterministic v0.2 PASS.

The final v0.2 cycle audited 87 records: 24 SUFFICIENT_PARTIAL, all 9 remaining DEFERRED, all 30 NOT_APPLICABLE, all 0 NOT_DISCLOSED, and 24 non-overlapping records representing the four remediated former-DEFERRED Categories. It returned 87 exact matches, 0 MINOR, 0 MATERIAL, 0 CRITICAL, and no unresolved systemic pattern.

## Coverage state

| Measure | Close state |
| --- | ---: |
| Companies | 100 |
| Maturity L4 | 100 |
| Complete Categories | 321 |
| Partial Categories | 740 |
| Not-started Categories | 39 |
| ACTIONABLE pending | 0 |
| SUFFICIENT_PARTIAL | 740 |
| NOT_DISCLOSED | 0 |
| NOT_APPLICABLE | 30 |
| DEFERRED | 9 |
| REVIEW_REQUIRED | 0 |

This close does **not** mean `complete = 1,100`. Remaining partial and not-started records are valid closure states when their reviewed Triage decision is SUFFICIENT_PARTIAL, NOT_APPLICABLE, or bounded-review DEFERRED. Coverage status describes evidence completeness; Triage describes whether further work has sufficient current value. They remain separate.

## Closure basis

1. The Validation v0.1 HARD STOP was accepted as a functioning quality gate rather than overridden.
2. The affected 300 former-DEFERRED records were individually re-reviewed against existing Evidence/Shared Sources, annual filings or reports, and at most two targeted official sources.
3. Broadcom's hybrid manufacturing model and Fujikura's risks Category mismatch were corrected explicitly.
4. The re-review identified 288 ACTIONABLE records; all were processed through Runbook-governed company batches with structured Locators.
5. Validation v0.2 then detected two additional systemic patterns. Four customer/end-market decisions and two remaining capacity-expansion decisions were corrected; all five new ACTIONABLE records were processed.
6. The final v0.2 cycle uses the independent seed `triage-validation-v02`, includes all residual DEFERRED and NOT_APPLICABLE records, and passes the defined close gate.

## Protected contracts

- Financial values and financial history: unchanged; final financial diff `0`
- Relationships: unchanged
- Global Visual System and production UI: unchanged by the final validation/close change
- Company Evidence Schema: unchanged
- Freeze contract: unchanged
- Source Policy approval state: unchanged; newly introduced policies remain `pending`
- Unrelated legacy company data and unrelated Evidence: unchanged

The authoritative record-level audit is `docs/company-evidence-triage-validation-v02.json`; the human-readable decision record is `docs/company-evidence-triage-validation-v02.md`. Future work may refresh evidence or revisit a bounded DEFERRED record when new official disclosure appears, but that is maintenance after v1 Coverage Close, not pending v1 closure work.
