import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const previous = await read('docs/financial-latest-period-audit-v17.json');
const coverage = await read('src/data/financial-quarterly-coverage-v01.json');
const additions = await read('src/data/financial-history-v05-batch21.json');
const existingHexagon = (await read('src/data/financial-history-v04-batch34.json')).filter(record => record.companyId === 'hexagon');
const newSources = await read('src/data/document-sources-v05-batch21.json');
const oldSources = await read('src/data/document-sources-v04-batch34.json');
const sourceById = new Map([...oldSources, ...newSources].map(source => [source.id, source]));
const coverageById = new Map(coverage.map(row => [row.companyId, row]));
const targets = ['air-liquide', 'ajinomoto-fine-techno', 'bosch', 'hexagon', 'omron', 'schneider-electric'];
assert.equal(previous.records.length, 100);
assert.deepEqual(previous.records.filter(row => row.loadedCoverageStatus === 'needs-review').map(row => row.companyId).sort(), targets);
assert.equal(additions.length, 8);
assert.ok(additions.every(record => record.companyId === 'hexagon'));
assert.equal(existingHexagon.length, 2);
const hexagonAccountingBases = [...new Set([...existingHexagon, ...additions].map(record => record.accountingBasis))].sort();

const reviewed = {
  hexagon: {
    category: 'original-statement-connected-historical-series',
    officialLatestPeriod: 'Q3 2026 continuing operations after Octave distribution',
    officialLatestPublishedAt: '2026-10-23',
    latestCapturedPeriod: 'Q4 2025 pre-Octave full group',
    latestCapturedIsOfficialLatest: false,
    missingEvidence: 'The 2026 Q3 official original table is available; it reports the post-Octave continuing perimeter. Its FY2025 continuing sales 3999.3 and operating earnings 692.8 plus disclosed Octave discontinued 1425.3 and 231.6 reconcile to the existing full-group annual 5424.6 and 924.4. This bridge proves the scope change, not identity with the pre-spin quarterly series. A distinct presentation/restatement contract is needed before appending post-spin quarters.',
    materials: [
      {url:'https://mb.cision.com/Main/387/4143164/3420675.pdf',publishedAt:'2025-04-30',location:'PDF physical/printed p13, Condensed income statement, Net sales and Operating earnings, Q1 2025 actual / Q1 2024 comparative three-month columns',finding:'2025 1322.8 / 267.2; 2024 1299.9 / 335.9 EUR million.'},
      {url:'https://mb.cision.com/Main/387/4210938/3590765.pdf',publishedAt:'2025-07-25',location:'PDF physical/printed p15, Condensed income statement, Q2 2025 actual / Q2 2024 comparative three-month columns',finding:'2025 1369.9 / 313.2; 2024 1353.4 / 360.5 EUR million. Operating net sales 1370.7 is adjusted and excluded.'},
      {url:'https://mb.cision.com/Main/387/4255763/3742997.pdf',publishedAt:'2025-10-24',location:'PDF physical/printed p15, Condensed income statement, Q3 2025 actual / Q3 2024 comparative three-month columns',finding:'2025 1303.1 / -12.9; 2024 1299.8 / 334.4 EUR million. EBIT1 349.3 is adjusted and excluded.'},
      {url:'https://mb.cision.com/Main/387/4300053/3907199.pdf',publishedAt:'2026-01-30',location:'PDF physical/printed p15, Condensed income statement, Q4 2025 actual / Q4 2024 comparative three-month columns',finding:'2025 1428.8 / 356.9; 2024 1448.0 / 401.4 EUR million. Existing annual source reused.'},
      {url:'https://mb.cision.com/Main/387/4413836/4335597.pdf',publishedAt:'2026-10-23',location:'PDF physical/printed p16, post-Octave continuing Condensed income statement; physical/printed p25, Discontinued Operations note and Octave Condensed income statement',finding:'Q3 2026 continuing 1049.1 / 541.7; FY2025 continuing 3999.3 / 692.8 plus Octave discontinued 1425.3 / 231.6 reconciles to retained full-group annual.'},
    ],
  },
  omron: {
    category:'original-numbers-retrieved-series-not-connectable',
    officialLatestPeriod:'FY2026 Q1 IFRS', officialLatestPublishedAt:'2026-08-05',
    missingEvidence:'Existing annual records are DMB-reclassified US GAAP. The FY2025 nine-month original is pre-reclassification; data book printed p2 is reclassified annual actual/plan and p13 is pre-reclassification quarterly reference, with FY25 Q4/H2/FY explicitly not US GAAP disclosed actuals. An official comparable quarterly US GAAP restatement and a bridge to the new IFRS series remain necessary; JPY billion can be converted at published precision and is not the blocker.',
    materials:[
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260513_financial_results.pdf',publishedAt:'2026-05-13',location:'PDF physical p1, reclassified FY2025 annual consolidated income statement',finding:'Annual scope is post-DMB reclassification.'},
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260205_financial_results.pdf',publishedAt:'2026-02-05',location:'PDF physical p1, FY2025 nine-month pre-reclassification statement',finding:'614288 / 33855 JPY million; cannot subtract from reclassified annual.'},
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260513_data_e.pdf',publishedAt:'2026-05-13',location:'Printed p2 annual actual/plan; pp11-12 scope notes; p13 pre-DMB quarterly reference',finding:'FY25 Q4/H2/FY reference values are not US GAAP disclosed actuals.'},
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260805_financial_results.pdf',publishedAt:'2026-08-05',location:'PDF physical p1, FY2026 Q1 IFRS statement',finding:'Revenue 209864 and operating profit 18857 JPY million; separate accounting basis.'},
    ],
  },
  'air-liquide': {
    category:'official-series-sales-only-or-half-year-profit', officialLatestPeriod:'Q3 2026 sales', officialLatestPublishedAt:'2026-10-29',
    missingEvidence:'Q3 2026 three-month unadjusted consolidated operating income, or same-series nine-month cumulative operating income with H1 comparison. The H1 six-month profit cannot be split evenly; inspected materials do not prove non-disclosure across all official channels.',
    materials:[
      {url:'https://www.airliquide.com/sites/airliquide.com/files/2026-10/air-liquide-pr-q3-2026-air-liquide-accelerates-driven-by-sales-growth-and-the-launch-of-its-strategic-plan.pdf',publishedAt:'2026-10-29',location:'PDF physical p1, Q3 Group Revenue',finding:'Q3 sales 7259 EUR million; matching three-month operating income absent from inspected report.'},
      {url:'https://www.airliquide.com/sites/airliquide.com/files/2026-07/air-liquide-first-half-2026-financial-report.pdf',publishedAt:'2026-07-28',location:'PDF physical p28 / printed p26, Consolidated income statement, H1 2026 column',finding:'H1 sales 13827.9 and unadjusted operating income 2770.4 EUR million; six-month values only.'},
    ],
  },
  bosch: {
    category:'official-series-half-year-only', officialLatestPeriod:'H1 2026', officialLatestPublishedAt:'2026-09-23',
    missingEvidence:'Same three-month consolidated sales and unadjusted operating earnings in an issuer or regulator original statement; H1 cannot be split.',
    materials:[{url:'https://assets.bosch.com/media/global/bosch_group/our_figures/pdf/bosch-half-year-financial-report-2026.pdf',publishedAt:'2026-09-23',location:'PDF physical/printed p23, Consolidated income statement, Jan 1–Jun 30',finding:'H1 sales 46410 and EBIT 1977 EUR million; no three-month column in the inspected statement.'}],
  },
  'schneider-electric': {
    category:'official-list-quarterly-sales-and-half-year-results', officialLatestPeriod:'Q3 2026 revenues', officialLatestPublishedAt:'2026-10-16',
    missingEvidence:'A three-month unadjusted IFRS consolidated operating-profit original, or matching cumulative statements. Official index lists Q1 and Q3 Revenues with Accounts NA and H1 Results; H1 accounts PDF was not retrieved in this audit. Adjusted EBITA is excluded.',
    materials:[{url:'https://www.se.com/ww/en/about-us/investor-relations/financial-results/',publishedAt:'2026-10-16',location:'Official results index, 2026 Q1 Revenues / H1 Results / Q3 Revenues rows and Accounts column',finding:'Q1/Q3 Accounts NA; Q3 headline revenue about EUR 11.5bn rounded. Underlying H1 original accounts not retrieved.'}],
  },
  'ajinomoto-fine-techno': {
    category:'subsidiary-quarterly-original-not-retrieved', officialLatestPeriod:'FY2026 annual subsidiary result', officialLatestPublishedAt:'2026-08-06',
    missingEvidence:'AFT own JGAAP non-consolidated three-month sales and operating-profit original. Subsidiary /news and /company/summary returned HTTP 403 via available route; access failure does not establish nondisclosure. Parent consolidated Q1 is another issuer and cannot substitute.',
    materials:[{url:'https://www.ajinomoto.com/cms_wp_ajnmt_global/wp-content/uploads/pdf/2026_08_06_01E.pdf',publishedAt:'2026-08-06',location:'PDF physical p2, Absorbed Company column, FY2026 non-consolidated JGAAP',finding:'AFT annual sales 98383 and operating profit 53012 JPY million; not a standalone quarter.'}],
  },
};
const records = previous.records.map(old => {
  const id = old.companyId;
  if (!targets.includes(id)) return {...old,reviewProvenanceV18:'inherited-v17',reviewDepthV18:'inherited',reviewedAtV18:null};
  const info = reviewed[id];
  const loaded = coverageById.get(id);
  const addedV18Periods = id === 'hexagon' ? additions.map(record => ({
    recordId:record.id,periodLabel:record.periodLabel,startDate:record.startDate,endDate:record.endDate,
    revenue:record.metrics.revenue.value,operatingProfit:record.metrics.operatingProfit.value,
    operatingMargin:record.metrics.operatingMargin.value,currency:record.currency,unit:record.unit,
    accountingBasis:record.accountingBasis,sourceId:record.sourceId,
    sourceUrl:sourceById.get(record.sourceId)?.url,
    revenueBasis:record.metrics.revenue.basis,operatingProfitBasis:record.metrics.operatingProfit.basis,
  })) : [];
  assert.ok(addedV18Periods.every(record => record.sourceUrl));
  return {
    ...old,loadedAccountingBases:id === 'hexagon' ? hexagonAccountingBases : old.loadedAccountingBases,
    loadedQuarterlyCount:loaded.actualQuarterCount,loadedLatestPeriod:loaded.latestPeriodLabel,
    loadedLatestEndDate:loaded.latestEndDate,loadedCoverageStatus:loaded.coverageStatus,
    reviewProvenanceV18:'direct-v18',reviewDepthV18:info.category,
    reviewedAtV18:'2026-11-03',v18Outcome:id === 'hexagon' ? 'adopted-historical' : 'held',
    v18OfficialLatestPeriod:info.officialLatestPeriod,
    v18OfficialLatestPublishedAt:info.officialLatestPublishedAt,
    v18LatestCapturedPeriod:id === 'hexagon' ? info.latestCapturedPeriod : old.loadedLatestPeriod,
    v18LatestCapturedIsOfficialLatest:id === 'hexagon' ? false : null,
    v18ReviewedMaterials:info.materials,v18MissingEvidence:info.missingEvidence,
    addedV18Periods,
  };
});
const counts = Object.fromEntries([...new Set(Object.values(reviewed).map(item=>item.category))].map(category=>[category,records.filter(row=>row.reviewDepthV18===category).length]));
const json = {
  schemaVersion:'v18',auditAsOfJst:'2026-11-03T21:37:29+09:00',
  baselineMainSha:'06400907de4ba917b5713d26736d88ed15166055',
  previousAuditAsOfJst:previous.auditAsOfJst,targetCount:6,targetIds:targets,
  directlyReviewedCount:6,inheritedNonTargetCount:94,addedRecordCount:8,adoptedCompanyCount:1,
  counts,caveat:'Hexagon eight pre-Octave quarters are historically consecutive, but its post-Octave 2026 published period is not included. Other five retain specific evidence gaps. Original-table verification, six-quarter completeness and latest published period are separate conclusions. Non-target 94 company review dates are inherited.',
  records,
};
assert.equal(records.length,100);
assert.equal(records.filter(row=>row.reviewProvenanceV18==='direct-v18').length,6);
assert.equal(records.filter(row=>row.reviewProvenanceV18==='inherited-v17').length,94);
assert.equal(coverage.filter(row=>row.coverageStatus==='complete-six-quarters').length,95);
assert.deepEqual(coverage.filter(row=>row.coverageStatus!=='complete-six-quarters').map(row=>row.companyId).sort(),targets.filter(id=>id!=='hexagon'));
const hexagon = records.find(row=>row.companyId==='hexagon');
assert.equal(hexagon.addedV18Periods.length,8);
assert.equal(hexagon.loadedQuarterlyCount,8);
const md = [
  '# Financial latest-period audit v18','',
  `- Fixed review cutoff (JST): ${json.auditAsOfJst}`,
  `- Baseline main: ${json.baselineMainSha}`,
  '- Six target companies directly reviewed; 94 non-target companies inherit earlier judgments and check dates.',
  '- Hexagon: eight historical pre-Octave quarters adopted. Six consecutive quarters do not imply capture of the latest published post-Octave quarter.','',
  '## Hexagon: adopted pre-Octave full-group IFRS series','',
  '| Quarter | Revenue (EUR million) | Operating earnings (EUR million) | Source |',
  '| --- | ---: | ---: | --- |',
  ...hexagon.addedV18Periods.map(row=>`| ${row.periodLabel} | ${row.revenue.toFixed(1)} | ${row.operatingProfit.toFixed(1)} | [original statement](${row.sourceUrl}) |`),
  '',
  '- FY2024 reconciliation: revenue 1299.9 + 1353.4 + 1299.8 + 1448.0 = 5401.1; operating earnings 335.9 + 360.5 + 334.4 + 401.4 = 1432.2.',
  '- FY2025 reconciliation: revenue 1322.8 + 1369.9 + 1303.1 + 1428.8 = 5424.6; operating earnings 267.2 + 313.2 - 12.9 + 356.9 = 924.4.',
  '- No cumulative difference, unit conversion, estimate, FCF or Capex added. Direct three-month unadjusted Net sales and Operating earnings from the official tables.',
  `- Post-spin held: ${hexagon.v18MissingEvidence}`,'',
  '## Company-by-company evidence and decision','',
  ...targets.flatMap(id=>{
    const row=records.find(item=>item.companyId===id);
    return [
      `### ${id}`, '',
      `- Existing/loaded quarters: ${row.loadedQuarterlyCount}; latest stored: ${row.loadedLatestPeriod ?? 'annual only'} (${row.loadedLatestEndDate ?? 'n/a'}).`,
      `- Latest official period checked: ${row.v18OfficialLatestPeriod}; published ${row.v18OfficialLatestPublishedAt}. Outcome: ${row.v18Outcome}.`,
      `- Missing evidence or series caveat: ${row.v18MissingEvidence}`,
      ...row.v18ReviewedMaterials.map(item=>`- [Official material](${item.url}), published ${item.publishedAt}; ${item.location}. ${item.finding}`),
      '',
    ];
  }),
  '## Interpretation','',
  '- This audit does not declare all official channels non-disclosing when a particular original was inaccessible.',
  '- Hexagon current-period continuing operations, Aptiv post-spin and Shinko post-delisting freshness remain separate tasks.',
  '- Coverage complete: 95 companies; historical six-quarter coverage is distinct from latest-period capture.',
  '',
].join('\n');
const jsonText=`${JSON.stringify(json,null,2)}\n`;
const check=process.argv.includes('--check');
const jsonPath=join(root,'docs/financial-latest-period-audit-v18.json');
const mdPath=join(root,'docs/financial-latest-period-audit-v18.md');
if(check){
  assert.equal(await readFile(jsonPath,'utf8'),jsonText,'v18 audit JSON is current');
  assert.equal(await readFile(mdPath,'utf8'),md,'v18 audit Markdown is current');
  console.log('Financial latest-period audit v18 is current: 6 reviewed, 8 adopted records.');
} else if(process.argv.includes('--write')){
  await Promise.all([writeFile(jsonPath,jsonText),writeFile(mdPath,md)]);
  console.log('Wrote financial latest-period audit v18.');
} else throw new Error('usage: node scripts/generate-financial-latest-period-audit-v18.mjs --write|--check');
