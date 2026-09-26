import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceCompareSupportedCompanyIds } from '../src/lib/company-compare-evidence-ui.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, 'src', 'data');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const companies = await Promise.all((await readdir(join(dataDirectory, 'companies'))).filter(file => file.endsWith('.json')).sort().map(file => readJson(join(dataDirectory, 'companies', file))));
const coverage = await readJson(join(dataDirectory, 'financial-quarterly-coverage-v01.json'));
const historyFileNames = (await readdir(dataDirectory))
  .filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file))
  .sort();
const history = (await Promise.all(historyFileNames.map(file => readJson(join(dataDirectory, file)))))
  .flat();

assert.equal(companies.length, 100, 'registry contains 100 companies');
assert.equal(coverage.length, 100, 'coverage contains 100 companies');
assert.deepEqual(new Set(coverage.map(row => row.companyId)), new Set(companies.map(company => company.id)), 'coverage company IDs exactly match registry');
assert.equal(new Set(coverage.map(row => row.companyId)).size, coverage.length, 'coverage company IDs are unique');
assert.equal(history.length, 473, 'eighth financial-history expansion yields 473 sourced periods');
assert.equal(coverage.filter(row => row.coverageStatus === 'complete-six-quarters').length, 54, 'ten additional companies reach six reported quarters');

const quarterlyByCompany = new Map(companies.map(company => [company.id, []]));
for (const record of history) if (record.periodType === 'quarterly') quarterlyByCompany.get(record.companyId)?.push(record);
for (const records of quarterlyByCompany.values()) records.sort((left, right) => left.endDate.localeCompare(right.endDate));

for (const row of coverage) {
  const quarterly = quarterlyByCompany.get(row.companyId) ?? [];
  assert.equal(row.actualQuarterCount, quarterly.length, `${row.companyId}: actual count derives from records`);
  assert.equal(row.targetQuarterCount, 6, `${row.companyId}: target is six actual quarters`);
  assert.match(row.officialSourceUrl, /^https:\/\//, `${row.companyId}: official URL is recorded`);
  if (quarterly.length) {
    assert.equal(row.latestEndDate, quarterly.at(-1).endDate, `${row.companyId}: latest end date matches records`);
    assert.equal(row.latestPeriodLabel, quarterly.at(-1).periodLabel, `${row.companyId}: latest label matches records`);
  }
  if (row.coverageStatus === 'complete-six-quarters') assert.ok(quarterly.length >= 6, `${row.companyId}: complete status requires six actual quarters`);
}

const kioxia = coverage.find(row => row.companyId === 'kioxia');
assert.equal(kioxia.coverageStatus, 'awaiting-next-quarter', 'Kioxia waits for the next published actual quarter');
assert.equal(kioxia.actualQuarterCount, 5, 'Kioxia retains five reported quarters');
assert.ok(!history.some(record => record.companyId === 'kioxia' && record.periodLabel === 'FY2027 Q2'), 'Kioxia FY2027 Q2 is not inserted before publication');

const furukawa = quarterlyByCompany.get('furukawa-electric');
assert.equal(furukawa.length, 6, 'Furukawa Electric has six quarterly records');
assert.deepEqual(furukawa.map(record => record.endDate), ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30'], 'Furukawa periods are chronological single quarters');
assert.equal(coverage.find(row => row.companyId === 'furukawa-electric').coverageStatus, 'complete-six-quarters', 'Furukawa coverage is complete');

const phaseTwoEndDates = new Map([
  ['asml', ['2025-03-30', '2025-06-29', '2025-09-28', '2025-12-31', '2026-03-29', '2026-06-28']],
  ['tokyo-electron', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['tsmc', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['sk-hynix', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['broadcom', ['2025-05-04', '2025-08-03', '2025-11-02', '2026-02-01', '2026-05-03', '2026-08-02']],
  ['kla', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
]);
for (const [companyId, endDates] of phaseTwoEndDates) {
  assert.deepEqual(quarterlyByCompany.get(companyId).map(record => record.endDate), endDates, `${companyId}: six reported standalone quarters are chronological`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: coverage is complete`);
}

const phaseThreeEndDates = new Map([
  ['advantest', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['disco', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['arista', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['vertiv', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['entegris', ['2025-03-29', '2025-06-28', '2025-09-27', '2025-12-31', '2026-03-28', '2026-06-27']],
]);
for (const [companyId, endDates] of phaseThreeEndDates) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.map(record => record.endDate), endDates, `${companyId}: six official standalone quarters are chronological`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: coverage is complete`);
}
const sixthBatchPeriods = new Map([
  ['sumitomo-electric', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['ciena', ['2025-05-03', '2025-08-02', '2025-11-01', '2026-01-31', '2026-05-02', '2026-08-01']],
  ['coherent', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['credo', ['2025-02-01', '2025-05-03', '2025-08-02', '2025-11-01', '2026-01-31', '2026-05-02']],
  ['lumentum', ['2025-03-29', '2025-06-28', '2025-09-27', '2025-12-27', '2026-03-28', '2026-06-27']],
  ['samsung-electronics', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
]);
for (const [companyId, endDates] of sixthBatchPeriods) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.map(record => record.endDate), endDates, `${companyId}: six consecutive official standalone quarters`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: complete coverage`);
  assert.equal(coverage.find(row => row.companyId === companyId).checkedAt, '2026-09-25', `${companyId}: coverage check date follows its official source retrieval`);
  assert.equal(new Set(quarterly.map(record => record.currency)).size, 1, `${companyId}: stable currency`);
  assert.equal(new Set(quarterly.map(record => record.unit)).size, 1, `${companyId}: stable unit`);
  assert.equal(new Set(quarterly.map(record => record.accountingBasis)).size, 1, `${companyId}: stable accounting basis`);
}
const seventhBatchPeriods = new Map([
  ['besi', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['onsemi', ['2025-04-04', '2025-07-04', '2025-10-03', '2025-12-31', '2026-04-03', '2026-07-03']],
  ['cadence', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['monolithic-power', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['linde', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
]);
for (const [companyId, endDates] of seventhBatchPeriods) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.slice(-6).map(record => record.endDate), endDates, `${companyId}: latest six standalone quarters are continuous`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: complete coverage`);
  assert.equal(new Set(quarterly.map(record => record.currency)).size, 1, `${companyId}: stable currency`);
  assert.equal(new Set(quarterly.map(record => record.unit)).size, 1, `${companyId}: stable unit`);
  assert.equal(new Set(quarterly.map(record => record.accountingBasis)).size, 1, `${companyId}: stable accounting basis`);
  assert.ok(quarterly.every(record => record.metrics.revenue.value != null && record.metrics.operatingProfit.value != null && record.metrics.operatingMargin.value != null), `${companyId}: actual quarterly revenue, operating income, and margin are present`);
}
assert.equal((await readJson(join(dataDirectory, 'financial-history-v05-batch10.json'))).length, 29, 'seventh batch contains 29 sourced standalone quarters');
const eighthBatch = await readJson(join(dataDirectory, 'financial-history-v05-batch11.json'));
assert.equal(eighthBatch.length, 50, 'eighth batch contains 50 official standalone quarters');
assert.equal(new Set(eighthBatch.map(record => record.id)).size, eighthBatch.length, 'eighth-batch record IDs are unique');
const eighthSources = await readJson(join(dataDirectory, 'document-sources-v05-batch11.json'));
const eighthPolicies = await readJson(join(dataDirectory, 'document-source-policies-v05-batch11.json'));
assert.equal(eighthSources.length, 39, 'eighth batch registers 39 official primary documents');
assert.equal(new Set(eighthSources.map(source => source.id)).size, eighthSources.length, 'eighth-batch source IDs are unique');
assert.deepEqual(new Set(eighthPolicies.map(policy => policy.sourceId)), new Set(eighthSources.map(source => source.id)), 'every new source has exactly one policy');
const sourceManifest = await readJson(join(dataDirectory, 'source-registry-manifest.json'));
const priorSourceIds = new Set((await Promise.all(sourceManifest.shards
  .filter(shard => shard !== 'document-sources-v05-batch11.json')
  .map(shard => readJson(join(dataDirectory, shard))))).flat().map(source => source.id));
assert.ok(eighthSources.every(source => !priorSourceIds.has(source.id)), 'new source IDs never collide with prior source registry entries');
assert.ok(eighthSources.every(source => /^https:\/\//.test(source.url) && source.publishedAt && source.retrievedAt), 'every new source has an official URL and dates');
assert.ok(eighthBatch.every(record => eighthSources.some(source => source.id === record.sourceId && source.companyId === record.companyId)), 'every new quarterly record resolves to its company official primary source');
const eighthById = new Map(eighthBatch.map(record => [record.id, record]));
for (const [id, revenue, operatingProfit] of [
  ['ge-vernova-q4-2025', 38068 - 27112, 1388 - 787],
  ['nvent-q4-2025', 3893.1 - 2826.4, 616.8 - 453],
  ['globalwafers-q4-2025', (60597938 - 46095865) / 1000, (8636332 - 6257154) / 1000],
  ['ibiden-q4-fy2024', 369436 - 270337, 47621 - 34857],
  ['ibiden-q2-fy2025', 195485 - 97464, 32573 - 17636],
  ['ibiden-q3-fy2025', 298621 - 195485, 44527 - 32573],
  ['ibiden-q4-fy2025', 416201 - 298621, 62027 - 44527],
  ['shin-etsu-chemical-q4-fy2024', 2561249 - 1929698, 742105 - 584439],
  ['shin-etsu-chemical-q2-fy2025', 1284522 - 628549, 333935 - 166803],
  ['shin-etsu-chemical-q3-fy2025', 1934000 - 1284522, 498026 - 333935],
  ['shin-etsu-chemical-q4-fy2025', 2573969 - 1934000, 635204 - 498026],
  ['corning-q4-2025', 15629 - 11414, 2279 - 1607],
  ['equinix-q4-2025', 9217 - 6797, 1848 - 1426],
  ['tesla-q4-2025', 94827 - 69926, 4355 - 2946],
  ['te-connectivity-q4-fy2025', 17262 - 12513, 3211 - 2295],
  ['arm-q4-fy2025', 4007 - 2766, 831 - 421],
  ['arm-q4-fy2026', 4920 - 3430, 900 - 462],
]) {
  const record = eighthById.get(id);
  assert.ok(record, `${id}: cumulative-difference record is present`);
  assert.ok(Math.abs(record.metrics.revenue.value - revenue) < 0.000001, `${id}: revenue arithmetic is exact`);
  assert.ok(Math.abs(record.metrics.operatingProfit.value - operatingProfit) < 0.000001, `${id}: operating profit arithmetic is exact`);
  assert.match(record.metrics.revenue.basis, /minus|差|−/, `${id}: source cumulative-difference formula is recorded`);
}
const eighthBatchPeriods = new Map([
  ['ge-vernova', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['globalwafers', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['ibiden', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['nvent', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['shin-etsu-chemical', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['corning', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['equinix', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['tesla', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['te-connectivity', ['2025-03-28', '2025-06-27', '2025-09-26', '2025-12-26', '2026-03-27', '2026-06-26']],
  ['arm', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
]);
for (const [companyId, endDates] of eighthBatchPeriods) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.map(record => record.endDate), endDates, `${companyId}: exactly six continuous official standalone quarters`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: complete coverage`);
  for (const field of ['currency', 'unit', 'accountingBasis']) assert.equal(new Set(quarterly.map(record => record[field])).size, 1, `${companyId}: stable ${field}`);
  assert.ok(quarterly.every(record => record.metrics.revenue.value != null && record.metrics.operatingProfit.value != null && record.metrics.operatingMargin.value != null), `${companyId}: revenue and operating profit share six periods`);
}
assert.equal(new Set(history.map(record => record.id)).size, history.length, 'record IDs remain unique across all batches');
assert.equal(coverage.filter(row => row.coverageStatus === 'partial-quarterly').length, 6, 'six companies remain partially covered');
assert.equal(coverage.filter(row => row.coverageStatus === 'awaiting-next-quarter').length, 1, 'Kioxia remains pending an actual publication');
assert.equal(coverage.filter(row => row.coverageStatus === 'needs-review').length, 39, '39 companies remain under review');
assert.equal(coverage.find(row => row.companyId === 'nvidia').checkedAt, '2026-09-23', 'unreviewed baseline companies retain their original coverage check date');
assert.equal(coverage.find(row => row.companyId === 'fujikura').coverageStatus, 'needs-review', 'Fujikura remains unfilled without verified comparable six-quarter series');

const phaseFourEndDates = new Map([
  ['western-digital', ['2025-03-28', '2025-06-27', '2025-10-03', '2026-01-02', '2026-04-03', '2026-07-03']],
  ['ase-technology', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['globalfoundries', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['umc', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['cisco', ['2025-04-26', '2025-07-26', '2025-10-25', '2026-01-24', '2026-04-25', '2026-07-25']],
]);
for (const [companyId, endDates] of phaseFourEndDates) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.map(record => record.endDate), endDates, `${companyId}: six official standalone quarters are chronological`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: coverage is complete`);
}

const phaseFiveEndDates = new Map([
  ['nxp', ['2025-03-30', '2025-06-29', '2025-09-28', '2025-12-31', '2026-03-29', '2026-06-28']],
  ['seagate', ['2024-12-27', '2025-03-28', '2025-06-27', '2025-10-03', '2026-01-02', '2026-04-03', '2026-07-03']],
  ['carrier', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['trane-technologies', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['marvell', ['2025-05-03', '2025-08-02', '2025-11-01', '2026-01-31', '2026-05-02', '2026-08-01']],
]);
for (const [companyId, endDates] of phaseFiveEndDates) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.map(record => record.endDate), endDates, `${companyId}: reported standalone periods include a consecutive six-quarter window`);
  assert.deepEqual(quarterly.slice(-6).map(record => record.periodLabel),
    companyId === 'seagate'
      ? ['Q3 FY2025', 'Q4 FY2025', 'Q1 FY2026', 'Q2 FY2026', 'Q3 FY2026', 'Q4 FY2026']
      : companyId === 'marvell'
        ? ['Q1 FY2026', 'Q2 FY2026', 'Q3 FY2026', 'Q4 FY2026', 'Q1 FY2027', 'Q2 FY2027']
        : ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'],
    `${companyId}: latest six chart points are uninterrupted fiscal/calendar quarters`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: coverage is complete`);
  assert.ok(quarterly.every(record => record.currency === 'USD' && record.unit === 'million' && record.accountingBasis === 'US GAAP'), `${companyId}: reporting unit and accounting basis stay continuous`);
}

const derivedQuarterChecks = new Map([
  ['disco-q4-fy2024', { revenue: 393313 - 272596, operatingProfit: 166834 - 115098 }],
  ['disco-q2-fy2025', { revenue: 194537 - 89914, operatingProfit: 78871 - 34480 }],
  ['disco-q3-fy2025', { revenue: 303828 - 194537, operatingProfit: 126212 - 78871 }],
  ['disco-q4-fy2025', { revenue: 436889 - 303828, operatingProfit: 184989 - 126212 }],
]);
for (const [recordId, expected] of derivedQuarterChecks) {
  const record = history.find(item => item.id === recordId);
  assert.ok(record, `${recordId}: derived quarter exists`);
  assert.equal(record.metrics.revenue.value, expected.revenue, `${recordId}: sales difference reproduces`);
  assert.equal(record.metrics.operatingProfit.value, expected.operatingProfit, `${recordId}: operating-profit difference reproduces`);
  assert.match(record.metrics.revenue.basis, /minus|−/, `${recordId}: source periods and formula are documented`);
}

const financialPage = await readFile(join(root, 'src', 'pages', 'financials.astro'), 'utf8');
assert.match(financialPage, /quarterlyChartRecords\s*=\s*quarterly\.slice\(-6\)/, 'quarterly chart is limited to the latest six records');
const financialLoader = await readFile(join(root, 'src', 'lib', 'financial-history.ts'), 'utf8');
const loaderImports = [...financialLoader.matchAll(/^import\s+(\w+)\s+from\s+'\.\.\/data\/(financial-history(?:-v0[45]-batch\d+)?\.json)';$/gm)];
const loaderAggregate = financialLoader.match(/export const financialHistory = \[([\s\S]*?)\]\.map\(record => \{/);
assert.ok(loaderAggregate, 'financial history loader has one explicit aggregate before overrides');
const loaderBindings = [...loaderAggregate[1].matchAll(/\.\.\.(\w+)/g)].map(match => match[1]).sort();
const importedBindings = loaderImports.map(match => match[1]).sort();
const importedFileNames = loaderImports.map(match => match[2]).sort();
assert.deepEqual(loaderBindings, importedBindings, 'financial loader spreads every imported history batch exactly once');
assert.deepEqual(importedFileNames, historyFileNames, 'Astro financial loader and direct JSON audit use exactly the same history batch set');
assert.equal(new Set(history.map(record => record.id)).size, history.length, 'all direct JSON financial record IDs are unique');
const compareCompaniesWithoutFinancialHistory = evidenceCompareSupportedCompanyIds
  .filter(companyId => !history.some(record => record.companyId === companyId));
assert.deepEqual(compareCompaniesWithoutFinancialHistory, [], 'all supported Compare Evidence companies have at least one history record through the same loader batch set');
console.log(`Financial quarterly coverage OK: ${coverage.filter(row => row.coverageStatus === 'complete-six-quarters').length} complete companies`);
