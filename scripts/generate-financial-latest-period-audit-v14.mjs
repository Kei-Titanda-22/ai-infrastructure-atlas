import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const previous = await readJson('docs/financial-latest-period-audit-v13.json');
const coverage = await readJson('src/data/financial-quarterly-coverage-v01.json');
const additions = await readJson('src/data/financial-history-v05-batch17.json');
const manifest = await readJson('src/data/source-registry-manifest.json');
const sources = (await Promise.all(manifest.shards.map(name => readJson('src/data/' + name)))).flat();
const bySource = new Map(sources.map(source => [source.id, source]));
const byCoverage = new Map(coverage.map(row => [row.companyId, row]));
const targetIds = [
  'abb', 'ajinomoto-fine-techno', 'hanmi-semiconductor', 'hexagon', 'johnson-controls',
  'kioxia', 'legrand', 'mobileye', 'omron', 'resonac-holdings', 'rohm',
  'schneider-electric', 'siemens-energy', 'stmicroelectronics', 'synopsys',
  'unimicron', 'yaskawa',
];
const targetSet = new Set(targetIds);
assert.equal(targetSet.size, 17);
assert.deepEqual([...targetSet].sort(), [
  ...previous.records.filter(r => r.loadedCoverageStatus === 'partial-quarterly').map(r => r.companyId),
  ...previous.records.filter(r => r.loadedCoverageStatus === 'awaiting-next-quarter').map(r => r.companyId),
  'ajinomoto-fine-techno','hexagon','legrand','omron','schneider-electric','unimicron',
].sort().filter((id, index, all) => all.indexOf(id) === index), 'the 17 target set must match coverage plus inherited blockers');
const adopted = new Set(additions.map(r => r.companyId));
assert.equal(additions.length, 40);
assert.equal(adopted.size, 10);
const cutoff = '2026-10-29T16:45:37+09:00';
const blockers = {
  'ajinomoto-fine-techno': {
    depth: 'specific-blocker', outcome: 'not-adopted',
    url: 'https://www.aft-website.com/',
    examined: 'Issuer corporate/technology pages and Ajinomoto group consolidated results.',
    locator: 'Parent group figures identify a different reporting entity; no subsidiary-issued three-month consolidated/standalone sales and operating-profit original table was retrieved.',
    missing: 'AFT-issued or regulator-filed actual quarterly P&L for both metrics and the subsidiary perimeter. A parent consolidated row cannot substitute.',
  },
  'hanmi-semiconductor': {
    depth: 'specific-blocker', outcome: 'not-adopted',
    url: 'https://kind.krx.co.kr/external/2026/05/15/001759/20260515003902/11013.htm',
    examined: 'KRX filing of issuer 042700 for 2026 Q1 and public KRX disclosure route for subsequent period.',
    locator: 'Existing Q1 2025 and Q1 2026 records are from issuer filings; a fixed official 2025 Q2–Q4 and 2026 Q2 consolidated income statement with exact three-month sales and operating profit was not secured.',
    missing: 'Matching issuer 042700 KRX/DART quarterly filings and same K-IFRS consolidated statement columns; same-name company matches are excluded.',
  },
  'hexagon': {
    depth: 'specific-blocker', outcome: 'not-adopted',
    url: 'https://hexagon.com/company/newsroom/press-releases/2026/hexagon-interim-report-1-january---30-september-2026',
    examined: 'Issuer Q3 2026 release dated October 23 and linked original PDF https://api.alertir.com/files/press/hexagon/202610228436-1.pdf.',
    locator: 'Release shows net sales EUR 1,049.1m with adjusted EBITAC/EBIT1. Original IFRS income-statement PDF returned HTTP 403 via the retrieval route; May 2026 Octave separation affects scope.',
    missing: 'Unadjusted consolidated IFRS operating income for the same standalone quarter and issuer restated comparable series after the Octave separation.',
  },
  'kioxia': {
    depth: 'publication-timing', outcome: 'awaiting-next-quarter',
    url: 'https://www.kioxia-holdings.com/en-jp/ir/news.html',
    examined: 'Issuer IR news and planned FY2027 Q2 results announcement.',
    locator: 'Next formal results announcement is scheduled for October 30 2026 after the fixed October 29 16:45 JST cutoff; a forecast or schedule is not realized earnings.',
    missing: 'Issuer FY2027 Q2 actual consolidated IFRS revenue and operating-profit statement published by the fixed cutoff.',
  },
  'omron': {
    depth: 'specific-blocker', outcome: 'not-adopted',
    url: 'https://www.omron.com/global/en/assets/file/ir/irlib/20260513_01e.pdf',
    examined: 'Issuer IFRS transition disclosure and FY2027 Q1 latest-results archive https://www.omron.com/global/en/ir/finance/latest_results/.',
    locator: 'New three-month results are IFRS; two existing Atlas annual records are US GAAP.',
    missing: 'Issuer restated comparable IFRS history spanning the existing records, or a separately authorized reporting-basis presentation. Do not join IFRS quarter to US GAAP series.',
  },
  'schneider-electric': {
    depth: 'specific-blocker', outcome: 'not-adopted',
    url: 'https://www.se.com/ww/en/about-us/investor-relations/financial-results/',
    examined: 'Issuer October 16 2026 Q3 sales publication and H1 consolidated financial report.',
    locator: 'Q3 issuer publication supplies sales but not unadjusted standalone IFRS operating profit; H1 consolidated income cannot be split into Q1/Q2 without Q1 profit.',
    missing: 'Same-quarter unadjusted consolidated IFRS operating profit, rather than adjusted EBITA, FFO or half-year allocation.',
  },
  'unimicron': {
    depth: 'specific-blocker', outcome: 'not-adopted',
    url: 'https://www.unimicron.com/',
    examined: 'Issuer site and Taiwan MOPS consolidated filing route.',
    locator: 'Issuer site returned HTTP 502 through this route; a fixed regulator-filed consolidated statement tied to the correct issuer code was not obtained.',
    missing: 'Verified Unimicron issuer identity and filed three-month TWD IFRS revenue plus operating income original rows. Retrieval failure is not a nondisclosure finding.',
  },
};
assert.deepEqual(Object.keys(blockers).sort(), targetIds.filter(id => !adopted.has(id)).sort());
const records = previous.records.map(old => {
  if (!targetSet.has(old.companyId)) return { ...old, reviewProvenanceV14: 'inherited-v13', reviewDepthV14: 'inherited', reviewedAtV14: null };
  const row = byCoverage.get(old.companyId);
  assert.ok(row, old.companyId + ': coverage missing');
  const added = additions.filter(record => record.companyId === old.companyId).sort((a,b) => a.endDate.localeCompare(b.endDate));
  const evidence = added.map(record => {
    const source = bySource.get(record.sourceId);
    assert.equal(source?.companyId, record.companyId, record.id + ': primary source mismatch');
    return {
      recordId: record.id, periodLabel: record.periodLabel, startDate: record.startDate, endDate: record.endDate,
      currency: record.currency, unit: record.unit, accountingBasis: record.accountingBasis,
      revenue: record.metrics.revenue.value, operatingProfit: record.metrics.operatingProfit.value,
      operatingMargin: record.metrics.operatingMargin.value,
      revenueBasis: record.metrics.revenue.basis, operatingProfitBasis: record.metrics.operatingProfit.basis,
      sourceId: record.sourceId, sourceUrl: source.url, sourceTitle: source.title, publishedAt: source.publishedAt,
    };
  });
  const blocker = blockers[old.companyId];
  return {
    ...old,
    loadedQuarterlyCount: row.actualQuarterCount,
    loadedLatestPeriod: row.latestPeriodLabel,
    loadedLatestEndDate: row.latestEndDate,
    loadedCoverageStatus: row.coverageStatus,
    reviewProvenanceV14: 'direct-v14',
    reviewDepthV14: blocker?.depth ?? 'numeric-statement',
    reviewedAtV14: '2026-10-29',
    v14Outcome: blocker?.outcome ?? 'adopted',
    v14ReviewedOfficialUrl: blocker?.url ?? evidence.at(-1)?.sourceUrl,
    v14ExaminedMaterial: blocker?.examined ?? 'Issuer/regulator consolidated original statement current/comparative columns listed per new record.',
    v14OriginalTableLocator: blocker?.locator ?? 'Each new record stores exact original row or cumulative-difference formula and source locator.',
    v14MissingEvidence: blocker?.missing ?? null,
    addedV14Periods: evidence,
    v14LatestCapturedIsOfficialLatest: null,
    v14LatestCaveat: 'The cutoff is fixed. Adding a backfilled or verified quarter does not prove a full all-company latest-publication sweep.',
  };
});
assert.equal(records.length, 100);
const counts = Object.fromEntries(['numeric-statement','publication-timing','specific-blocker','inherited'].map(key => [key, records.filter(r => r.reviewDepthV14 === key).length]));
assert.deepEqual(counts, {'numeric-statement':10,'publication-timing':1,'specific-blocker':6,inherited:83});
const result = {
  schemaVersion:'v14',auditAsOfJst:cutoff,baselineMainSha:'4405f3ef8d984f340e3257101f58361158038aee',
  previousAuditAsOfJst:previous.auditAsOfJst,targetCount:17,targetIds,addedRecordCount:additions.length,
  adoptedCompanyCount:adopted.size,counts,
  caveat:'The 17 targets have direct v14 disposition; other 83 inherit prior review dates and outcomes. Six-quarter coverage and latest published period are separate judgments.',
  records,
};
const lines = [
  '# Financial latest-period audit v14','',
  '- Fixed cutoff (JST): '+cutoff,
  '- Baseline main: '+result.baselineMainSha,
  '- Target set: 10 partial, 1 awaiting, 6 previous specific blockers; other 83 inherit previous dates/outcomes.',
  '- Adopted: '+adopted.size+' companies / '+additions.length+' actual standalone quarters.',
  '- Numeric original statements: '+counts['numeric-statement']+'; publication timing: '+counts['publication-timing']+'; specific blockers: '+counts['specific-blocker']+'; inherited: '+counts.inherited+'.',
  '- No assertion that all 100 companies have the latest published quarter. Numeric coverage and publication recency are separate.','',
  '## Target-by-target original evidence and gaps','',
  '| Company | Prior → current quarters | Loaded latest | v14 depth / outcome | Official material and locator | New periods | Remaining evidence |',
  '| --- | ---: | --- | --- | --- | --- | --- |',
  ...records.filter(r=>targetSet.has(r.companyId)).map(r => '| '+r.companyId+' | '+(r.loadedQuarterlyCount-r.addedV14Periods.length)+' → '+r.loadedQuarterlyCount+' | '+(r.loadedLatestPeriod??'—')+' ('+(r.loadedLatestEndDate??'—')+') | '+r.reviewDepthV14+' / '+r.v14Outcome+' | [official]('+r.v14ReviewedOfficialUrl+') '+r.v14ExaminedMaterial+' — '+r.v14OriginalTableLocator+' | '+(r.addedV14Periods.map(x=>x.periodLabel).join(', ')||'—')+' | '+(r.v14MissingEvidence??r.v14LatestCaveat)+' |'),
  '', '## Added-record original rows and arithmetic','',
  ...records.filter(r=>r.addedV14Periods?.length).flatMap(r=>['### '+r.companyId,'',...r.addedV14Periods.flatMap(e=>[
    '- '+e.recordId+' / '+e.periodLabel+' ('+e.startDate+'–'+e.endDate+'), '+e.accountingBasis+', '+e.currency+' '+e.unit+': revenue '+e.revenue+', operating profit '+e.operatingProfit+', margin '+e.operatingMargin+'%.',
    '  - [Official source]('+e.sourceUrl+'): '+e.sourceTitle+' ('+e.publishedAt+').',
    '  - Revenue: '+e.revenueBasis,
    '  - Operating profit: '+e.operatingProfitBasis,
  ]),'']),
  '## Inherited 83 companies','',
  'Their v13 review dates, publication statuses and rationales are carried forward. No mass refresh is claimed.','',
];
const json=JSON.stringify(result,null,2)+'\n';
const md=lines.join('\n');
const jsonPath=join(root,'docs/financial-latest-period-audit-v14.json');
const mdPath=join(root,'docs/financial-latest-period-audit-v14.md');
if(process.argv.includes('--write')){
  await Promise.all([writeFile(jsonPath,json),writeFile(mdPath,md)]);
  console.log('Wrote v14 audit: '+additions.length+' records / '+adopted.size+' companies; '+JSON.stringify(counts));
} else if(process.argv.includes('--check')){
  assert.equal(await readFile(jsonPath,'utf8'),json,'v14 audit JSON stale');
  assert.equal(await readFile(mdPath,'utf8'),md,'v14 audit Markdown stale');
  console.log('v14 audit current: '+JSON.stringify(counts));
} else throw new Error('usage: node scripts/generate-financial-latest-period-audit-v14.mjs --write|--check');
