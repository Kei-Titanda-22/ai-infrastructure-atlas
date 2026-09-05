export const evidenceCompareFirstBatchStage1CompanyIds = ['amd', 'vertiv', 'tsmc'] as const;
export const evidenceCompareFirstBatchStage2CompanyIds = ['kioxia', 'amphenol', 'aptiv', 'advantest'] as const;
export const evidenceCompareFirstBatchCompanyIds = [
  ...evidenceCompareFirstBatchStage1CompanyIds,
  ...evidenceCompareFirstBatchStage2CompanyIds,
] as const;
