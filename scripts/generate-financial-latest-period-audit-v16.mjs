import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const previous = await read('docs/financial-latest-period-audit-v15.json');
const coverage = await read('src/data/financial-quarterly-coverage-v01.json');
const additions = await read('src/data/financial-history-v05-batch19.json');
const sources = await read('src/data/document-sources-v05-batch19.json');
const blockers = await read('src/data/financial-quarterly-blockers-v16.json');
const sourceById = new Map(sources.map(source => [source.id, source]));
const coverageById = new Map(coverage.map(row => [row.companyId, row]));
const targetIds = ['air-liquide','ajinomoto-fine-techno','aptiv','bosch','hexagon','omron','schneider-electric','shinko-electric'];
const targetSet = new Set(targetIds);
assert.deepEqual(targetIds, previous.records.filter(row => row.loadedCoverageStatus === 'needs-review').map(row => row.companyId).sort());
assert.equal(additions.length, 7);
assert.deepEqual([...new Set(additions.map(row => row.companyId))].sort(), ['aptiv','shinko-electric']);
assert.deepEqual(Object.keys(blockers.reasons).sort(), targetIds);

const findings = {
  'air-liquide': {
    latest:'Q3 2026 revenue', published:'2026-10-29', depth:'statement-scope-reviewed',
    reviewed:[
      {url:'https://www.airliquide.com/third-quarter-2026-revenue',title:'Third Quarter 2026 Revenue',location:'Q3 2026 release, sales-only activity report',finding:'Three-month sales are published; no matching three-month unadjusted consolidated operating-profit statement in this release.'},
      {url:'https://www.airliquide.com/sites/airliquide.com/files/2026-07/air-liquide-first-half-2026-financial-report.pdf',title:'First Half 2026 Financial Report',location:'PDF physical p26 onward / printed p25 onward, condensed consolidated statements; activity report p5 OIR',finding:'Revenue and recurring operating income cover six months. Q2 revenue is shown but a standalone Q2 unadjusted operating-profit row is not established.'}
    ],
    missing:'A company/regulator original three-month unadjusted operating-profit figure, or same-series cumulative Q3 and H1 profit figures; H1 cannot be divided equally.'
  },
  'ajinomoto-fine-techno': {
    latest:null,published:null,depth:'retrieval-blocked',
    reviewed:[{url:'https://www.aft-website.com/',title:'Ajinomoto Fine-Techno issuer site',location:'Issuer home route',finding:'HTTP 403 in the current retrieval path. No subsidiary-issued quarterly income statement read; parent Ajinomoto IR is a different reporting entity.'}],
    missing:'Issuer/regulator quarterly standalone revenue and operating-profit original table for Ajinomoto Fine-Techno itself, compatible with existing Japanese-GAAP standalone annual records. Retrieval failure is not non-disclosure evidence.'
  },
  'aptiv': {
    latest:'Q2 2026',published:'2026-08-04',depth:'numeric-statement',
    reviewed:[
      {url:'https://www.sec.gov/Archives/edgar/data/1521332/000152133225000051/aptv-20250930.htm',title:'Aptiv 2025 Q3 Form 10-Q',location:'Printed p4, Consolidated Statements of Operations, three months ended September 30 2025 current column; Net sales and Operating (loss) income',finding:'Pre-2026 EDS spin-off GAAP revenue USD 5,212 million and operating loss USD 175 million, including a USD 648 million goodwill impairment, match the pre-spin annual reporting scope.'},
      {url:'https://www.sec.gov/Archives/edgar/data/1521332/000152133226000061/aptv-20260630.htm',title:'Aptiv 2026 Q2 Form 10-Q',location:'Printed p3, continuing-operations Consolidated Statements of Operations, three months ended June 30 2026',finding:'Current sales USD 3,274 million and operating income USD 367 million are post-EDS-spin continuing operations. The 2025 comparative is re-presented on that basis; existing annual Atlas records are pre-spin.'},
      {url:'https://www.sec.gov/Archives/edgar/data/1521332/000152133225000051/0001521332-25-000051-index.htm',title:'SEC filing index',location:'Filing Date and Period of Report',finding:'The pre-spin 2025 Q3 10-Q was filed 2025-10-30, before the fixed v16 cutoff.'}
    ],
    missing:'Official bridge/restated annual and quarterly series connecting the pre-spin 2024–2025 Atlas annual scope to post-spin continuing operations; additional older quarters are outside this adopted one-quarter proof.'
  },
  'bosch': {
    latest:'H1 2026',published:'2026-09-23',depth:'statement-scope-reviewed',
    reviewed:[{url:'https://assets.bosch.com/media/global/bosch_group/our_figures/pdf/bosch-half-year-financial-report-2026.pdf',title:'Bosch Half-year financial report 2026',location:'Physical p1 contents; printed p23 consolidated income statement',finding:'Official consolidated statement spans January–June 2026. The report states it is the first half-year report and does not establish separate three-month sales and unadjusted EBIT in this inspected series.'}],
    missing:'Issuer/regulator consolidated three-month sales and operating profit from the same quarter; half-year totals cannot be apportioned.'
  },
  'hexagon': {
    latest:'Q3 2026',published:'2026-10-22',depth:'retrieval-and-scope-blocked',
    reviewed:[
      {url:'https://hexagon.com/about/news-media/press-releases/2491677/hexagon-interim-report-1-january-30-september-2026',title:'Hexagon Q3 2026 interim announcement',location:'Issuer highlights, continuing operations',finding:'Highlights emphasize adjusted EBITAC/EBIT1 rather than a same-quarter unadjusted IFRS operating-profit row.'},
      {url:'https://api.alertir.com/files/press/hexagon/202610228436-1.pdf',title:'Hexagon Q3 2026 attached report',location:'Linked issuer PDF',finding:'HTTP 403 in current retrieval path; original consolidated income-statement rows and Octave comparison columns could not be read.'},
      {url:'https://hexagon.com/about/news-media/press-releases/2425681/hexagon-announces-update-on-planned-spin-off-of-octave',title:'Octave spin-off update',location:'Issuer announcement on historical carve-out basis',finding:'Octave carve-out is described as US GAAP while Hexagon segment reporting is IFRS; this is not an annual-to-quarter restatement bridge.'}
    ],
    missing:'Retrievable issuer/regulator Q3 original statement with unadjusted IFRS operating profit and explicit comparable continuing-operation columns bridging the existing annual scope after Octave separation.'
  },
  'omron': {
    latest:'FY2026 Q1',published:'2026-08-05',depth:'numeric-but-scope-blocked',
    reviewed:[
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260513_financial_results.pdf',title:'FY2025 consolidated results under US GAAP',location:'PDF physical p1 sales/profit table, printed p~15 statement',finding:'Existing Atlas annual series uses FY2025 767,351 / 59,935 and FY2024 715,379 / 53,446 JPY million after DMB discontinued-operation reclassification.'},
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260205_financial_results.pdf',title:'FY2025 Q3 US GAAP results',location:'PDF physical p1 cumulative table and printed p11 consolidated income statement',finding:'Before the DMB discontinued-operation reclassification, 2025 nine-month sales 614,288 and operating income 33,855 JPY million were published; direct subtraction from the later restated annual would mix scopes.'},
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260513_01e.pdf',title:'Notice of voluntary IFRS adoption',location:'PDF p1 disclosure schedule',finding:'FY2026 Q1 onward is IFRS, whereas the Atlas FY2024–FY2025 annual history is US GAAP.'},
      {url:'https://www.omron.com/global/en/assets/file/ir/irlib/20260513_data_e.pdf',title:'FY2025 financial databook',location:'PDF physical/printed p2 annual Financial Highlights; pp11–12 Notes on Reclassification and reference scope; p13 pre-reclassification quarterly Financial Highlights',finding:'P2 gives DMB-reclassified FY24/FY25 annual actuals under US GAAP and FY26 plan under IFRS, not a quarterly table. Pp11–12 explain the DMB discontinued-operation reclassification and identify the following pages as pre-reclassification reference material. P13 has quarterly figures before DMB reclassification; FY25 Q4, second-half and full-year values are explicitly reference figures not disclosed under US GAAP. JPY billion can be converted to JPY million while retaining the published 0.1-billion precision; the unresolved issue is matching reporting scope and accounting basis, not unit size.'}
    ],
    missing:'Official quarterly sales and operating-income series on the same DMB-reclassified US-GAAP scope as the existing FY24/FY25 annual records, plus an issuer-supported accounting and scope bridge before connecting FY26 IFRS quarters. Published JPY-billion figures are usable only with their original rounding precision when scope and basis match.'
  },
  'schneider-electric': {
    latest:'Q3 2026 revenue',published:'2026-10-16',depth:'statement-scope-reviewed',
    reviewed:[{url:'https://www.se.com/ww/en/about-us/investor-relations/financial-results/',title:'Schneider Electric 2026 financial results',location:'2026 publication table: Q1 Revenues, Half-Year Results, Q3 Revenues; Accounts marked NA for Q1/Q3',finding:'Q1 and Q3 provide sales; the H1 consolidated result is six months. The quarterly sales announcements do not supply same-three-month unadjusted IFRS operating profit.'}],
    missing:'Issuer/regulator Q1 or Q3 unadjusted IFRS operating-profit statement or same-series cumulative values supporting a standalone subtraction; adjusted EBITA is not a substitute.'
  },
  'shinko-electric': {
    latest:'FY2024 Q4',published:'2025-04-24',depth:'numeric-statement',
    reviewed:[
      {url:'https://www.shinko.co.jp/ir/docs/bn2025_q1.pdf',title:'FY2025 Q1 consolidated results',location:'Printed p6, Q1 consolidated P&L current/comparative columns',finding:'Japanese GAAP, JPY million, FY2025 Q1 53,358 / 7,254 and FY2024 Q1 comparative 49,206 / 3,695.'},
      {url:'https://www.shinko.co.jp/ir/docs/bn2025_q2.pdf',title:'FY2025 H1 consolidated results',location:'Printed p6, H1 consolidated P&L current/comparative columns',finding:'FY2025 H1 108,330 / 12,724 and FY2024 H1 comparative 105,109 / 11,470 JPY million.'},
      {url:'https://www.shinko.co.jp/ir/docs/bn2025_q3.pdf',title:'FY2025 Q3 consolidated results',location:'Printed p6, nine-month consolidated P&L current/comparative columns; printed p9 tax accounting note',finding:'FY2025 nine months 159,891 / 19,121 and FY2024 nine months 156,638 / 17,996 JPY million. Tax accounting policy changed without correction restatement; revenue/operating-profit rows retain comparable scope.'},
      {url:'https://www.shinko.co.jp/ir/docs/bn2025.pdf',title:'FY2025 consolidated annual results',location:'Printed p1 current/comparative full-year sales and operating profit',finding:'FY2025 215,022 / 25,354 and FY2024 209,972 / 24,810 JPY million, consistent with Atlas annual rows.'},
      {url:'https://www.shinko.co.jp/english/ir/faq/',title:'Issuer FAQ on delisting',location:'Financial section and tender-offer FAQ',finding:'Shares were delisted 2025-06-06; the cited issuer archive covers results before delisting.'}
    ],
    missing:'Post-delisting issuer/regulator quarterly statement if assessing newer periods; the six added quarters end March 2025 and do not prove 2026 publication recency.'
  }
};
assert.deepEqual(Object.keys(findings).sort(), targetIds);

const records = previous.records.map(old => {
  if (!targetSet.has(old.companyId)) return {...old, reviewProvenanceV16:'inherited-v15', reviewDepthV16:'inherited', reviewedAtV16:null};
  const coverageRow = coverageById.get(old.companyId);
  const finding = findings[old.companyId];
  const added = additions.filter(record => record.companyId === old.companyId).sort((a,b)=>a.endDate.localeCompare(b.endDate));
  return {
    ...old,
    loadedQuarterlyCount:coverageRow.actualQuarterCount,
    loadedLatestPeriod:coverageRow.latestPeriodLabel,
    loadedLatestEndDate:coverageRow.latestEndDate,
    loadedCoverageStatus:coverageRow.coverageStatus,
    reviewProvenanceV16:'direct-v16', reviewDepthV16:finding.depth, reviewedAtV16:'2026-11-02',
    v16Outcome:added.length ? 'adopted' : 'not-adopted',
    v16OfficialLatestPeriod:finding.latest,
    v16OfficialLatestPublishedAt:finding.published,
    v16ReviewedMaterials:finding.reviewed,
    v16MissingEvidence:finding.missing,
    v16CoverageBlockerReason:blockers.reasons[old.companyId],
    addedV16Periods:added.map(record => ({
      recordId:record.id,periodLabel:record.periodLabel,startDate:record.startDate,endDate:record.endDate,
      currency:record.currency,unit:record.unit,accountingBasis:record.accountingBasis,
      revenue:record.metrics.revenue.value,operatingProfit:record.metrics.operatingProfit.value,
      operatingMargin:record.metrics.operatingMargin.value,
      revenueBasis:record.metrics.revenue.basis,operatingProfitBasis:record.metrics.operatingProfit.basis,
      sourceId:record.sourceId,sourceUrl:sourceById.get(record.sourceId).url
    })),
    v16RecencyCaveat:'Six-quarter completeness, original-statement verification, and latest published period captured are separate conclusions. The 92 non-target companies inherit their prior review dates.'
  };
});
assert.equal(records.length,100);
assert.equal(records.filter(row=>row.reviewProvenanceV16==='direct-v16').length,8);
assert.equal(records.filter(row=>row.reviewProvenanceV16==='inherited-v15').length,92);
assert.deepEqual(coverage.filter(row=>row.coverageStatus!=='complete-six-quarters').map(row=>row.companyId).sort(),targetIds.filter(id=>id!=='shinko-electric').sort());
const json={schemaVersion:'v16',auditAsOfJst:'2026-11-02T13:45:29+09:00',baselineMainSha:'7a6d8d8fe44b8760a9e507f38beb111629ede4b8',previousAuditAsOfJst:previous.auditAsOfJst,targetCount:8,targetIds,addedRecordCount:7,adoptedCompanyCount:2,counts:{'numeric-statement':2,'numeric-but-scope-blocked':1,'statement-scope-reviewed':3,'retrieval-blocked':1,'retrieval-and-scope-blocked':1,inherited:92},caveat:'Only eight targets were re-reviewed at the v16 cutoff. The other 92 retain prior judgments; six-quarter completeness is not latest-period freshness.',records};
const markdown=[
 '# Financial latest-period audit v16','',
 `- Fixed review cutoff (JST): ${json.auditAsOfJst}`,
 `- Baseline main: ${json.baselineMainSha}`,
 '- Directly reviewed: 8 companies; other 92 inherit v15 review dates and outcomes.',
 '- Added: 7 standalone quarterly records, Aptiv 1 and Shinko Electric 6.',
 '- Original-statement values, current publication recency, and six-quarter completeness are separate judgments.','',
 '## Target results','',
 '| Company | v16 depth | Added | Loaded coverage | Latest official material | Remaining evidence |',
 '| --- | --- | ---: | --- | --- | --- |',
 ...records.filter(row=>targetSet.has(row.companyId)).map(row=>`| ${row.companyId} | ${row.reviewDepthV16} | ${row.addedV16Periods.length} | ${row.loadedCoverageStatus} (${row.loadedQuarterlyCount}) | ${row.v16OfficialLatestPeriod ?? '未確認'} | ${row.v16MissingEvidence} |`),
 '', '## Reviewed primary materials and original-table locations','',
 ...records.filter(row=>targetSet.has(row.companyId)).flatMap(row=>[
   `### ${row.companyId}`,'',
   `- Coverage blocker: ${row.v16CoverageBlockerReason}`,
   `- Latest publication checked: ${row.v16OfficialLatestPeriod ?? '未確認'}; publication date: ${row.v16OfficialLatestPublishedAt ?? '未確認'}.`,
   ...row.v16ReviewedMaterials.map(item=>`- [${item.title}](${item.url}) — ${item.location}. ${item.finding}`),
   ...row.addedV16Periods.map(item=>`- Adopted ${item.periodLabel} (${item.startDate}–${item.endDate}): revenue ${item.revenue}, operating profit ${item.operatingProfit} ${item.currency} ${item.unit}. ${item.revenueBasis} ${item.operatingProfitBasis}`),
   `- Unresolved: ${row.v16MissingEvidence}`,'',
 ]),
].join('\n').trimEnd()+'\n';
const jsonPath=join(root,'docs/financial-latest-period-audit-v16.json');
const mdPath=join(root,'docs/financial-latest-period-audit-v16.md');
if (process.argv.includes('--write')) {
  await Promise.all([writeFile(jsonPath,JSON.stringify(json,null,2)+'\n'),writeFile(mdPath,markdown)]);
  console.log('Wrote v16 latest-period audit: 100 rows, 8 reviewed, 7 records');
} else if (process.argv.includes('--check')) {
  assert.equal(await readFile(jsonPath,'utf8'),JSON.stringify(json,null,2)+'\n');
  assert.equal(await readFile(mdPath,'utf8'),markdown);
  console.log('v16 latest-period audit current');
} else throw Error('usage: --write|--check');
