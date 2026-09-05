export const evidenceCompareFirstBatchStage1CompanyIds = ['amd', 'vertiv', 'tsmc'] as const;
export const evidenceCompareFirstBatchStage2CompanyIds = ['kioxia', 'amphenol', 'aptiv', 'advantest'] as const;
export const evidenceCompareFirstBatchStage3CompanyIds = ['asm-international', 'air-liquide', 'analog-devices', 'abb'] as const;
export const evidenceCompareFirstBatchStage4CompanyIds = ['globalfoundries', 'micron', 'arista', 'bosch'] as const;
export const evidenceCompareRemainingBatch1CompanyIds = [
  'cadence', 'marvell', 'nxp', 'renesas', 'synopsys',
  'digital-realty', 'ge-vernova', 'schneider-electric', 'ciena', 'corning',
  'lumentum', 'fanuc', 'smc', 'asml', 'kokusai-electric',
  'screen-holdings', 'linde', 'shinko-electric', 'seagate', 'besi',
] as const;
export const evidenceCompareRemainingBatch2CompanyIds = [
  'infineon', 'mitsubishi-electric', 'onsemi', 'rohm', 'texas-instruments',
  'eaton', 'legrand', 'siemens-energy', 'cisco', 'credo',
  'te-connectivity', 'keyence', 'tesla', 'canon', 'lasertec',
  'entegris', 'resonac-holdings', 'sumco', 'western-digital', 'disco',
] as const;
export const evidenceCompareFirstBatchCompanyIds = [
  ...evidenceCompareFirstBatchStage1CompanyIds,
  ...evidenceCompareFirstBatchStage2CompanyIds,
  ...evidenceCompareFirstBatchStage3CompanyIds,
  ...evidenceCompareFirstBatchStage4CompanyIds,
] as const;
