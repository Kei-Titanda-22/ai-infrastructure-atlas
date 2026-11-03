import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const previous = await read('docs/financial-latest-period-audit-v16.json');
const coverage = await read('src/data/financial-quarterly-coverage-v01.json');
const additions = await read('src/data/financial-history-v05-batch20.json');
const newSources = await read('src/data/document-sources-v05-batch20.json');
const oldSources = await read('src/data/document-sources-v05-batch19.json');
const sourceById = new Map([...oldSources, ...newSources].map(source => [source.id, source]));
const coverageById = new Map(coverage.map(row => [row.companyId, row]));
const targets = ['air-liquide','ajinomoto-fine-techno','aptiv','bosch','hexagon','omron','schneider-electric'];
assert.deepEqual(coverage.filter(row => row.coverageStatus !== 'complete-six-quarters').map(row => row.companyId).sort(), targets.filter(id => id !== 'aptiv'));
assert.equal(previous.records.length, 100);
assert.equal(additions.length, 6);
assert.ok(additions.every(record => record.companyId === 'aptiv'));

const reviewed = [
  {url:'https://www.sec.gov/Archives/edgar/data/1521332/000152133225000027/aptv-20250331.htm',title:'Aptiv Q1 2025 Form 10-Q',publishedAt:'2025-05-01',location:'Printed p4, Consolidated Statements of Operations, three months ended March 31 2025 and 2024; Net sales and Operating income',finding:'Q1 2025 4,825 / 448; Q1 2024 comparative 4,901 / 419, USD million, US GAAP, pre-spin issuer-wide.'},
  {url:'https://www.sec.gov/Archives/edgar/data/1521332/000152133225000040/aptv-20250630.htm',title:'Aptiv Q2 2025 Form 10-Q',publishedAt:'2025-07-31',location:'Printed p4, Consolidated Statements of Operations, three months ended June 30 2025 and 2024; Net sales and Operating income',finding:'Q2 2025 5,208 / 486; Q2 2024 comparative 5,051 / 441, USD million, US GAAP, pre-spin issuer-wide.'},
  {url:'https://www.sec.gov/Archives/edgar/data/1521332/000152133225000051/aptv-20250930.htm',title:'Aptiv Q3 2025 Form 10-Q',publishedAt:'2025-10-30',location:'Printed p4, Consolidated Statements of Operations, three months ended September 30 2025 and 2024; Net sales and Operating (loss) income',finding:'Q3 2024 comparative 4,854 / 503; Q3 2025 existing Atlas record 5,212 / −175 includes goodwill impairment 648. No replacement.'},
  {url:'https://ir.aptiv.com/news/news-details/2026/Aptiv-Reports-Fourth-Quarter-2025-Financial-Results/',title:'Aptiv Q4 2025 financial results',publishedAt:'2026-02-02',location:'Consolidated Statements of Operations, three months and years ended December 31 2025/2024; Net sales and Operating income',finding:'Q4 2024 comparative 4,907 / 479; Q4 2025 current 5,153 / 425. FY2024 19,713 / 1,842 and FY2025 20,398 / 1,184 match existing annual records.'},
  {url:'https://www.sec.gov/Archives/edgar/data/1521332/000152133226000048/aptv-20260331.htm',title:'Aptiv Q1 2026 Form 10-Q',publishedAt:'2026-05-05',location:'Printed p3, Consolidated Statements of Operations, three months ended March 31 2026 and 2025; Net sales and Operating income',finding:'Q1 2026 5,086 / 378. Quarter ended before April 1 EDS spin-off; Q1 2025 comparative 4,825 / 448 matches pre-spin Atlas series.'},
  {url:'https://ir.aptiv.com/news/news-details/2026/Aptiv-Reports-Second-Quarter-2026-Financial-Results/default.aspx',title:'Aptiv Q2 2026 financial results',publishedAt:'2026-08-04',location:'Continuing-operations results following EDS spin-off; current and re-presented comparative columns',finding:'Q2 2026 3,274 / 367 and re-presented Q2 2025 3,199 / 325 exclude EDS. These are not mixed into the original pre-spin series.'},
];

const records = previous.records.map(old => {
  if (old.companyId !== 'aptiv') return {...old, reviewProvenanceV17:'inherited-v16',reviewDepthV17:'inherited',reviewedAtV17:null};
  const loaded = coverageById.get('aptiv');
  const addedV17Periods = additions.map(record => ({
    recordId:record.id,periodLabel:record.periodLabel,startDate:record.startDate,endDate:record.endDate,
    currency:record.currency,unit:record.unit,accountingBasis:record.accountingBasis,
    revenue:record.metrics.revenue.value,operatingProfit:record.metrics.operatingProfit.value,
    operatingMargin:record.metrics.operatingMargin.value,sourceId:record.sourceId,
    sourceUrl:sourceById.get(record.sourceId)?.url,
    revenueBasis:record.metrics.revenue.basis,operatingProfitBasis:record.metrics.operatingProfit.basis
  }));
  assert.ok(addedV17Periods.every(record => record.sourceUrl));
  return {
    ...old,loadedQuarterlyCount:loaded.actualQuarterCount,loadedLatestPeriod:loaded.latestPeriodLabel,
    loadedLatestEndDate:loaded.latestEndDate,loadedCoverageStatus:loaded.coverageStatus,
    reviewProvenanceV17:'direct-v17',reviewDepthV17:'numeric-statement',reviewedAtV17:'2026-11-02',
    v17Outcome:'adopted',v17OfficialLatestPeriod:'Q2 2026 continuing operations',
    v17OfficialLatestPublishedAt:'2026-08-04',v17LatestCapturedPeriod:'Q1 2026 pre-spin issuer-wide',
    v17LatestCapturedIsOfficialLatest:false,v17ReviewedMaterials:reviewed,addedV17Periods,
    v17AnnualReconciliation:{fy2024:{revenue:'4901+5051+4854+4907=19713',operatingProfit:'419+441+503+479=1842'},fy2025:{revenue:'4825+5208+5212+5153=20398',operatingProfit:'448+486-175+425=1184'}},
    v17MissingEvidence:'Official annual and quarterly restatement bridge connecting original pre-EDS-spin issuer-wide history to Q2 2026 onward continuing operations. The six-quarter pre-spin completeness does not establish current-period freshness.',
    v17ScopeCaveat:'Q1 2026 reporting period predates the 2026-04-01 EDS spin-off. Q2 2026 onward is post-spin continuing operations and remains excluded.'
  };
});
const json = {
  schemaVersion:'v17',auditAsOfJst:'2026-11-02T16:30:46+09:00',
  baselineMainSha:'85b3a5fb84e56532c76a2a9a93f307c02c262034',
  previousAuditAsOfJst:previous.auditAsOfJst,targetCount:7,targetIds:targets,
  directlyReviewedCount:1,inheritedTargetCount:6,inheritedNonTargetCount:93,
  addedRecordCount:6,adoptedCompanyCount:1,
  caveat:'Only Aptiv original statements were re-reviewed for v17. The other six incomplete companies and 93 non-target companies inherit prior findings and dates. Original-table verification, six consecutive quarters and latest reported period are separate conclusions.',
  records
};
assert.equal(records.length,100);
assert.equal(records.filter(row=>row.reviewProvenanceV17==='direct-v17').length,1);
const aptiv = records.find(row=>row.companyId==='aptiv');
assert.equal(aptiv.loadedQuarterlyCount,7);
assert.equal(aptiv.loadedCoverageStatus,'complete-six-quarters');
const md = [
  '# Financial latest-period audit v17','',
  `- Fixed review cutoff (JST): ${json.auditAsOfJst}`,
  `- Baseline main: ${json.baselineMainSha}`,
  '- Original tables directly checked: Aptiv 1 company. Six other incomplete companies and 93 non-target companies inherit earlier findings and dates.',
  '- Added: six direct three-month US GAAP records for Aptiv. Existing 2025 Q3 loss and both annual records remain unchanged.',
  '- Six consecutive quarters, current publication recency and original-statement verification are separate judgments.','',
  '## Aptiv: adopted pre-spin series','',
  '| Period | Revenue (USD million) | Operating profit (USD million) | Source |',
  '| --- | ---: | ---: | --- |',
  ...aptiv.addedV17Periods.map(row=>`| ${row.periodLabel} | ${row.revenue} | ${row.operatingProfit} | [original statement](${row.sourceUrl}) |`),
  '| Q3 2025 (existing) | 5212 | -175 | [SEC 10-Q](https://www.sec.gov/Archives/edgar/data/1521332/000152133225000051/aptv-20250930.htm) |','',
  `- FY2024 cross-check: revenue ${aptiv.v17AnnualReconciliation.fy2024.revenue}; operating profit ${aptiv.v17AnnualReconciliation.fy2024.operatingProfit}.`,
  `- FY2025 cross-check: revenue ${aptiv.v17AnnualReconciliation.fy2025.revenue}; operating profit ${aptiv.v17AnnualReconciliation.fy2025.operatingProfit}.`,
  `- Latest captured: ${aptiv.v17LatestCapturedPeriod}. Official latest checked: ${aptiv.v17OfficialLatestPeriod}, announced ${aptiv.v17OfficialLatestPublishedAt}.`,
  `- Held: ${aptiv.v17MissingEvidence}`,'',
  '## Official original tables checked','',
  ...reviewed.map(item=>`- [${item.title}](${item.url}) — published ${item.publishedAt}; ${item.location}. ${item.finding}`),
  '', '## Other incomplete companies','',
  ...records.filter(row=>targets.includes(row.companyId)&&row.companyId!=='aptiv').map(row=>`- ${row.companyId}: inherited v16 finding; ${row.v16MissingEvidence ?? row.reason ?? 'see prior audit'}`),
  '', '- Other 93 companies retain prior review dates and judgments. This v17 audit does not claim their current-period freshness.',''
].join('\n');
const jsonPath = join(root,'docs/financial-latest-period-audit-v17.json');
const mdPath = join(root,'docs/financial-latest-period-audit-v17.md');
if (process.argv.includes('--write')) {
  await Promise.all([writeFile(jsonPath,JSON.stringify(json,null,2)+'\n'),writeFile(mdPath,md)]);
  console.log('Wrote v17 latest-period audit: 100 rows, Aptiv reviewed, six records');
} else if (process.argv.includes('--check')) {
  assert.equal(await readFile(jsonPath,'utf8'),JSON.stringify(json,null,2)+'\n');
  assert.equal(await readFile(mdPath,'utf8'),md);
  console.log('v17 latest-period audit current');
} else throw Error('usage: --write|--check');
