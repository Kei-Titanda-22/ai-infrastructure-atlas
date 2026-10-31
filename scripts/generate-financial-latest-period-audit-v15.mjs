import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const previous = await readJson('docs/financial-latest-period-audit-v14.json');
const coverage = await readJson('src/data/financial-quarterly-coverage-v01.json');
const additions = await readJson('src/data/financial-history-v05-batch18.json');
const manifest = await readJson('src/data/source-registry-manifest.json');
const sources = (await Promise.all(manifest.shards.map(name => readJson('src/data/' + name)))).flat();
const bySource = new Map(sources.map(source => [source.id, source]));
const byCoverage = new Map(coverage.map(row => [row.companyId, row]));
const targetIds = ['air-liquide','ajinomoto-fine-techno','aptiv','bosch','hanmi-semiconductor','hexagon','kinsus','kioxia','omron','schneider-electric','shinko-electric','sumco','unimicron'];
const targetSet = new Set(targetIds);
assert.equal(targetSet.size, 13);
assert.deepEqual([...targetSet].sort(), previous.records.filter(row => row.loadedCoverageStatus !== 'complete-six-quarters').map(row => row.companyId).sort(), 'v15 targets exactly the thirteen previously incomplete companies');
const adopted = new Set(additions.map(record => record.companyId));
assert.equal(additions.length, 24);
assert.deepEqual([...adopted].sort(), ['hanmi-semiconductor','kinsus','kioxia','sumco','unimicron'].sort());
const cutoff = '2026-10-31T11:02:55+09:00';
const blockers = {
  'air-liquide': {
    depth:'specific-blocker',url:'https://www.airliquide.com/third-quarter-2026-revenue',period:'Q3 2026',published:'2026-10-29',
    examined:'Issuer Q3 2026 revenue release and H1 2026 results https://www.airliquide.com/investors/first-half-2026-results.',
    locator:'Q3 release supplies sales and margin outlook; H1 report supplies six-month profit, not a standalone Q3 consolidated operating-profit row.',
    missing:'Issuer/regulator three-month Q3 IFRS operating profit (or same-series cumulative Q3 and H1 operating profit). Failure to find it is not proof of non-disclosure.'},
  'ajinomoto-fine-techno': {
    depth:'specific-blocker',url:'https://www.aft-website.com/',period:null,published:null,
    examined:'Subsidiary issuer site returned HTTP 403 through this retrieval route; Ajinomoto group IR is a different reporting entity.',
    locator:'No subsidiary-issued quarterly P&L with both sales and operating profit was read. Existing annual records are Japanese GAAP standalone.',
    missing:'AFT-issued or regulator-filed three-month subsidiary revenue and operating profit with a consistent reporting perimeter; parent consolidated rows cannot substitute.'},
  'aptiv': {
    depth:'specific-blocker',url:'https://ir.aptiv.com/news/news-details/2026/Aptiv-Reports-Second-Quarter-2026-Financial-Results/default.aspx',period:'Q2 2026',published:'2026-08-04',
    examined:'Issuer Q2 2026 results; Electrical Distribution Systems spin-off is presented as discontinued for all periods in that report.',
    locator:'Current quarter consolidated US GAAP sales and operating income exist, but existing Atlas annual records are not bridged to this post-separation continuing scope.',
    missing:'Official restated comparison table and annual-to-quarter scope bridge for the existing annual records. Do not silently mix pre- and post-spin-off series.'},
  'bosch': {
    depth:'specific-blocker',url:'https://www.bosch.com/company/investor-relations/',period:'H1 2026',published:null,
    examined:'Issuer investor-relations report archive with 2026 half-year and annual statements.',
    locator:'The inspected profit statement covers a half-year; no issuer three-month consolidated sales and operating-profit original table was obtained.',
    missing:'Actual standalone three-month consolidated operating profit paired with sales. Half-year profit must not be allocated equally.'},
  'hexagon': {
    depth:'specific-blocker',url:'https://hexagon.com/about/news-media/press-releases/2491677/hexagon-interim-report-1-january-30-september-2026',period:'Q3 2026',published:'2026-10-23',
    examined:'Issuer Q3 release and linked original PDF https://api.alertir.com/files/press/hexagon/202610228436-1.pdf; linked PDF returned HTTP 403.',
    locator:'Release lists EUR 1,049.1m net sales and adjusted EBITAC/EBIT1, which are not unadjusted IFRS operating profit. Octave separation also changes scope.',
    missing:'Accessible original IFRS three-month income statement and official Octave separation comparative bridge, including existing annual-scope reconciliation.'},
  'omron': {
    depth:'specific-blocker',url:'https://www.omron.com/global/en/ir/finance/latest_results/',period:'FY2027 Q1',published:null,
    examined:'Issuer latest-results archive and IFRS transition disclosure https://www.omron.com/global/en/assets/file/ir/irlib/20260513_01e.pdf.',
    locator:'The new quarter uses IFRS, while the two existing Atlas annual records use US GAAP. A comparable restated historical series was not secured.',
    missing:'Issuer-reported US-GAAP-to-IFRS restatement covering the existing annual history, or a separately authorized presentation basis.'},
  'schneider-electric': {
    depth:'specific-blocker',url:'https://www.se.com/ww/en/about-us/investor-relations/financial-results/',period:'Q3 2026 revenue',published:'2026-10-16',
    examined:'Issuer Q1 and Q3 revenue announcements and H1 2026 consolidated financial results.',
    locator:'Q1/Q3 original announcements provide revenue; unadjusted IFRS operating profit is supplied for H1 rather than both standalone quarters.',
    missing:'Same-quarter unadjusted consolidated IFRS operating profit or comparable cumulative Q1 and H1 rows. Adjusted EBITA and half-year allocation are not substitutes.'},
  'shinko-electric': {
    depth:'specific-blocker',url:'https://www.shinko.co.jp/english/ir/library/financial_results/',period:'FY2024 archive',published:null,
    examined:'Issuer financial-results archive and June 2025 delisting notice https://www.shinko.co.jp/english/news/docs/20250605-01_en.pdf.',
    locator:'The inspected archive ends before the ownership/listing change; current quarterly consolidated P&L and bridge to the existing Japanese-GAAP annual series were not retrieved.',
    missing:'Post-delisting issuer or regulator quarterly sales and operating-profit original table with a comparable reporting perimeter. Retrieval gap is not non-disclosure proof.'},
};
assert.deepEqual(Object.keys(blockers).sort(), targetIds.filter(id => !adopted.has(id)).sort());
const records = previous.records.map(old => {
  if (!targetSet.has(old.companyId)) return {...old, reviewProvenanceV15:'inherited-v14', reviewDepthV15:'inherited', reviewedAtV15:null};
  const row = byCoverage.get(old.companyId);
  assert.ok(row, old.companyId + ': coverage missing');
  const added = additions.filter(record => record.companyId === old.companyId).sort((a,b) => a.endDate.localeCompare(b.endDate));
  const evidence = added.map(record => {
    const source = bySource.get(record.sourceId);
    assert.equal(source?.companyId, record.companyId, record.id + ': source issuer mismatch');
    return {
      recordId:record.id,periodLabel:record.periodLabel,startDate:record.startDate,endDate:record.endDate,
      currency:record.currency,unit:record.unit,accountingBasis:record.accountingBasis,
      revenue:record.metrics.revenue.value,operatingProfit:record.metrics.operatingProfit.value,operatingMargin:record.metrics.operatingMargin.value,
      revenueBasis:record.metrics.revenue.basis,operatingProfitBasis:record.metrics.operatingProfit.basis,
      sourceId:record.sourceId,sourceUrl:source.url,sourceTitle:source.title,publishedAt:source.publishedAt,
    };
  });
  const blocker = blockers[old.companyId];
  return {
    ...old,
    loadedQuarterlyCount:row.actualQuarterCount, loadedLatestPeriod:row.latestPeriodLabel, loadedLatestEndDate:row.latestEndDate,
    loadedCoverageStatus:row.coverageStatus,
    reviewProvenanceV15:'direct-v15', reviewDepthV15:blocker?.depth ?? 'numeric-statement', reviewedAtV15:'2026-10-31',
    v15Outcome:blocker ? 'not-adopted' : 'adopted',
    v15OfficialLatestPeriod:blocker?.period ?? added.at(-1)?.periodLabel,
    v15OfficialLatestPublishedAt:blocker?.published ?? bySource.get(added.at(-1)?.sourceId)?.publishedAt ?? null,
    v15ReviewedOfficialUrl:blocker?.url ?? evidence.at(-1)?.sourceUrl,
    v15ExaminedMaterial:blocker?.examined ?? 'Issuer or regulator original consolidated statement; exact standalone columns and cumulative arithmetic are attached to each record below.',
    v15OriginalTableLocator:blocker?.locator ?? 'See each added record revenueBasis and operatingProfitBasis for original page, row, column and calculation.',
    v15MissingEvidence:blocker?.missing ?? null,
    addedV15Periods:evidence,
    v15LatestCapturedIsOfficialLatest:blocker ? false : true,
    v15LatestCaveat:'Fixed cutoff applies only to the thirteen targets; other 87 inherit previous review dates and outcomes. Six-quarter completeness is separate from publication recency.',
  };
});
assert.equal(records.length,100);
const counts = Object.fromEntries(['numeric-statement','publication-timing','specific-blocker','inherited'].map(key => [key,records.filter(row => row.reviewDepthV15 === key).length]));
assert.deepEqual(counts,{'numeric-statement':5,'publication-timing':0,'specific-blocker':8,inherited:87});
const result = {
  schemaVersion:'v15',auditAsOfJst:cutoff,baselineMainSha:'37f49f9ee3942c68044875a9942b47484c129d85',
  previousAuditAsOfJst:previous.auditAsOfJst,targetCount:13,targetIds,addedRecordCount:additions.length,
  adoptedCompanyCount:adopted.size,counts,
  caveat:'The 13 incomplete companies are directly reviewed; 87 completed companies inherit their prior checks. No claim is made that all 100 companies were freshly checked for the latest published quarter.',
  records,
};
const lines = [
  '# Financial latest-period audit v15','',
  '- Fixed cutoff (JST): '+cutoff,
  '- Baseline main: '+result.baselineMainSha,
  '- Target set: 13 previously incomplete companies; other 87 retain earlier check dates and judgments.',
  '- Adopted: '+adopted.size+' companies / '+additions.length+' actual standalone quarters.',
  '- Original numeric statements: '+counts['numeric-statement']+'; publication timing only: '+counts['publication-timing']+'; specific blockers: '+counts['specific-blocker']+'; inherited: '+counts.inherited+'.',
  '- Six-quarter coverage is distinct from original-table review and from confirmation of the newest published period.','',
  '## Target-by-target evidence and gaps','',
  '| Company | Prior → current quarters | Loaded latest | v15 depth / outcome | Official material and locator | New periods | Remaining evidence |',
  '| --- | ---: | --- | --- | --- | --- | --- |',
  ...records.filter(row=>targetSet.has(row.companyId)).map(row => '| '+row.companyId+' | '+(row.loadedQuarterlyCount-row.addedV15Periods.length)+' → '+row.loadedQuarterlyCount+' | '+(row.loadedLatestPeriod??'—')+' ('+(row.loadedLatestEndDate??'—')+') | '+row.reviewDepthV15+' / '+row.v15Outcome+' | [official]('+row.v15ReviewedOfficialUrl+') '+row.v15ExaminedMaterial+' — '+row.v15OriginalTableLocator+' | '+(row.addedV15Periods.map(e=>e.periodLabel).join(', ')||'—')+' | '+(row.v15MissingEvidence??'No value is inferred beyond the fixed cutoff.')+' |'),
  '', '## Added-record original rows and arithmetic','',
  ...records.filter(row=>row.addedV15Periods?.length).flatMap(row=>['### '+row.companyId,'',...row.addedV15Periods.flatMap(e=>[
    '- '+e.recordId+' / '+e.periodLabel+' ('+e.startDate+'–'+e.endDate+'), '+e.accountingBasis+', '+e.currency+' '+e.unit+': revenue '+e.revenue+', operating profit '+e.operatingProfit+', margin '+e.operatingMargin+'%.',
    '  - [Official source]('+e.sourceUrl+'): '+e.sourceTitle+' ('+e.publishedAt+').',
    '  - Revenue: '+e.revenueBasis,
    '  - Operating profit: '+e.operatingProfitBasis,
  ]),'']),
  '## Inherited 87 companies','',
  'Their v14 review dates, publication statuses and rationales are carried forward. No mass refresh or all-company latest-period check is claimed.','',
];
const json=JSON.stringify(result,null,2)+'\n';
const md=lines.join('\n');
const jsonPath=join(root,'docs/financial-latest-period-audit-v15.json');
const mdPath=join(root,'docs/financial-latest-period-audit-v15.md');
if(process.argv.includes('--write')){
  await Promise.all([writeFile(jsonPath,json),writeFile(mdPath,md)]);
  console.log('Wrote v15 audit: '+additions.length+' records / '+adopted.size+' companies; '+JSON.stringify(counts));
} else if(process.argv.includes('--check')){
  assert.equal(await readFile(jsonPath,'utf8'),json,'v15 audit JSON stale');
  assert.equal(await readFile(mdPath,'utf8'),md,'v15 audit Markdown stale');
  console.log('v15 audit current: '+JSON.stringify(counts));
} else throw new Error('usage: node scripts/generate-financial-latest-period-audit-v15.mjs --write|--check');
