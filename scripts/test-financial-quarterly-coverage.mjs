import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceCompareSupportedCompanyIds } from '../src/lib/company-compare-evidence-ui.ts';
import { resolveCompareFinancialTablePresentation } from '../src/lib/company-compare-display.ts';

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
assert.equal(history.length, 560, 'tenth financial-history expansion yields 560 sourced periods');
assert.equal(coverage.filter(row => row.coverageStatus === 'complete-six-quarters').length, 69, 'seven additional companies reach six reported quarters');

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
  .filter(shard => shard !== 'document-sources-v05-batch11.json' && shard !== 'document-sources-v05-batch12.json' && shard !== 'document-sources-v05-batch13.json')
  .map(shard => readJson(join(dataDirectory, shard))))).flat().map(source => source.id));
assert.ok(eighthSources.every(source => !priorSourceIds.has(source.id)), 'new source IDs never collide with prior source registry entries');
assert.ok(eighthSources.every(source => /^https:\/\//.test(source.url) && source.publishedAt && source.retrievedAt), 'every new source has an official URL and dates');
assert.ok(eighthBatch.every(record => eighthSources.some(source => source.id === record.sourceId && source.companyId === record.companyId)), 'every new quarterly record resolves to its company official primary source');
const ninthBatch = await readJson(join(dataDirectory, 'financial-history-v05-batch12.json'));
const ninthSources = await readJson(join(dataDirectory, 'document-sources-v05-batch12.json'));
const ninthPolicies = await readJson(join(dataDirectory, 'document-source-policies-v05-batch12.json'));
assert.equal(ninthBatch.length, 45, 'ninth batch contains 45 sourced standalone quarters');
assert.equal(ninthSources.length, 31, 'ninth batch registers 31 official primary documents');
assert.equal(new Set(ninthBatch.map(record => record.id)).size, ninthBatch.length, 'ninth-batch record IDs are unique');
assert.equal(new Set(ninthSources.map(source => source.id)).size, ninthSources.length, 'ninth-batch source IDs are unique');
assert.deepEqual(new Set(ninthPolicies.map(policy => policy.sourceId)), new Set(ninthSources.map(source => source.id)), 'ninth-batch sources have one policy each');
assert.ok(ninthSources.every(source => !priorSourceIds.has(source.id) && !eighthSources.some(previous => previous.id === source.id)), 'ninth-batch source IDs do not collide');
assert.ok(ninthBatch.every(record => ninthSources.some(source => source.id === record.sourceId && source.companyId === record.companyId)), 'ninth-batch records resolve to official company sources');
assert.ok(ninthBatch.every(record => record.periodType === 'quarterly' && record.metrics.revenue.value != null && record.metrics.operatingProfit.value != null && record.metrics.operatingMargin.value != null), 'ninth-batch records contain sourced actual standalone sales and operating results');
const ninthBatchPeriods = new Map([
  ['tower-semiconductor', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['mediatek', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['asm-international', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['nan-ya-pcb', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['renesas', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['infineon', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['screen-holdings', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['eaton', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
]);
for (const [companyId, endDates] of ninthBatchPeriods) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.slice(-6).map(record => record.endDate), endDates, `${companyId}: latest six official standalone quarters are continuous`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: complete coverage`);
  for (const field of ['currency', 'unit', 'accountingBasis']) assert.equal(new Set(quarterly.slice(-6).map(record => record[field])).size, 1, `${companyId}: stable ${field}`);
}
for (const [id, revenue, operatingProfit] of [
  ['nan-ya-pcb-q4-2025', (40172990 - 29008401) / 1000, (1982415 - 1019461) / 1000],
  ['screen-holdings-fy2025-q4', 625269 - 459964, 135683 - 100619],
  ['screen-holdings-fy2026-q2', 274299 - 135785, 46454 - 24386],
  ['screen-holdings-fy2026-q3', 425352 - 274299, 77439 - 46454],
  ['screen-holdings-fy2026-q4', 605748 - 425352, 122522 - 77439],
  ['eaton-q4-2025', 27448 - 20393, 5209 - 3823],
]) {
  const record = ninthBatch.find(item => item.id === id);
  assert.ok(record, `${id}: cumulative-difference record exists`);
  assert.equal(record.metrics.revenue.value, revenue, `${id}: revenue difference reproduces`);
  assert.equal(record.metrics.operatingProfit.value, operatingProfit, `${id}: operating-profit difference reproduces`);
}
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
const tenthBatch = await readJson(join(dataDirectory, 'financial-history-v05-batch13.json'));
const tenthSources = await readJson(join(dataDirectory, 'document-sources-v05-batch13.json'));
const tenthPolicies = await readJson(join(dataDirectory, 'document-source-policies-v05-batch13.json'));
assert.equal(tenthBatch.length, 42, 'tenth batch contains 42 sourced actual standalone quarters');
assert.equal(new Set(tenthBatch.map(record => record.id)).size, tenthBatch.length, 'tenth-batch record IDs are unique');
assert.equal(new Set(tenthSources.map(source => source.id)).size, tenthSources.length, 'tenth-batch source IDs are unique');
assert.deepEqual(new Set(tenthPolicies.map(policy => policy.sourceId)), new Set(tenthSources.map(source => source.id)), 'tenth-batch sources each have one policy');
assert.ok(tenthSources.every(source => !priorSourceIds.has(source.id) && !eighthSources.some(previous => previous.id === source.id) && !ninthSources.some(previous => previous.id === source.id)), 'tenth-batch sources have no prior ID collision');
assert.ok(tenthSources.every(source => /^https:\/\//.test(source.url) && source.publishedAt && source.retrievedAt), 'tenth-batch sources retain official URLs and dates');
assert.ok(tenthBatch.every(record => tenthSources.some(source => source.id === record.sourceId && source.companyId === record.companyId)), 'every tenth-batch record resolves to its official company source');
for (const record of tenthBatch) {
  assert.equal(record.periodType, 'quarterly', `${record.id}: chart data is a standalone quarter`);
  assert.equal(record.metrics.operatingMargin.value, Math.round(record.metrics.operatingProfit.value / record.metrics.revenue.value * 1000) / 10, `${record.id}: margin uses the same quarter revenue and profit`);
  assert.equal(record.metrics.freeCashFlow.value, null, `${record.id}: unverified standalone cash flow is not invented`);
  assert.equal(record.metrics.capex.value, null, `${record.id}: unverified standalone capex is not invented`);
}
const tenthById = new Map(tenthBatch.map(record => [record.id, record]));
for (const [id, revenue, operatingProfit] of [
  ['fujikura-fy2025-q4', 979375 - 710987, 135519 - 96274],
  ['fujikura-fy2026-q2', 558994 - 267908, 90171 - 41086],
  ['fujikura-fy2026-q3', 854931 - 558994, 142196 - 90171],
  ['fujikura-fy2026-q4', 1182358 - 854931, 188707 - 142196],
  ['keyence-fy2024-q4', 1059145 - 775190, 549776 - 397034],
  ['keyence-fy2025-q2', 545301 - 261077, 272180 - 129301],
  ['keyence-fy2025-q3', 834605 - 545301, 416382 - 272180],
  ['keyence-fy2025-q4', 1169290 - 834605, 595759 - 416382],
  ['mitsubishi-electric-fy2025-q4', 5521711 - 4000351, 391850 - 303555],
  ['mitsubishi-electric-fy2026-q2', 2732504 - 1312896, 224366 - 111972],
  ['mitsubishi-electric-fy2026-q3', 4156010 - 2732504, 294757 - 224366],
  ['mitsubishi-electric-fy2026-q4', 5894747 - 4156010, 433095 - 294757],
  ['denso-fy2025-q4', (7161.8 - 5288.4) * 1000, (519 - 401.6) * 1000],
  ['denso-fy2026-q2', (3590.5 - 1754.1) * 1000, (211.4 - 107.2) * 1000],
  ['denso-fy2026-q3', (5495.5 - 3590.5) * 1000, (375.9 - 211.4) * 1000],
  ['denso-fy2026-q4', (7540 - 5495.5) * 1000, (552.5 - 375.9) * 1000],
]) {
  const record = tenthById.get(id);
  assert.ok(record, `${id}: derived standalone quarter exists`);
  assert.ok(Math.abs(record.metrics.revenue.value - revenue) < 0.000001, `${id}: revenue difference reproduces`);
  assert.ok(Math.abs(record.metrics.operatingProfit.value - operatingProfit) < 0.000001, `${id}: operating-profit difference reproduces`);
  assert.match(record.metrics.revenue.basis, /minus|差|−/, `${id}: calculation and source inputs are recorded`);
}
const sourceBillionValues = new Map([
  ['fanuc-fy2024-q4', [212.1, 48.4]],
  ['fanuc-fy2025-q1', [196.4, 42.4]],
  ['fanuc-fy2025-q2', [211.2, 43.5]],
  ['fanuc-fy2025-q3', [215.7, 41.7]],
  ['fanuc-fy2025-q4', [234.5, 56.1]],
  ['fanuc-fy2026-q1', [231.0, 53.5]],
  ['denso-fy2025-q4', [1873.4, 117.4]],
  ['denso-fy2026-q1', [1754.1, 107.2]],
  ['denso-fy2026-q2', [1836.4, 104.2]],
  ['denso-fy2026-q3', [1905.0, 164.5]],
  ['denso-fy2026-q4', [2044.5, 176.6]],
  ['denso-fy2027-q1', [1913.9, 84.2]],
]);
for (const [id, [sourceRevenue, sourceOperatingProfit]] of sourceBillionValues) {
  const record = tenthById.get(id);
  assert.equal(record.unit, 'million', `${id}: new quarter uses the existing annual JPY million display unit`);
  assert.equal(record.metrics.revenue.value, Math.round(sourceRevenue * 1000), `${id}: source revenue is converted exactly`);
  assert.equal(record.metrics.operatingProfit.value, Math.round(sourceOperatingProfit * 1000), `${id}: source operating profit is converted exactly`);
  assert.equal(record.metrics.operatingMargin.value, Math.round(sourceOperatingProfit / sourceRevenue * 1000) / 10, `${id}: margin is invariant under unit conversion`);
  for (const metricId of ['revenue', 'operatingProfit']) {
    assert.match(record.metrics[metricId].basis, /JPY billion × 1,000 = \d+ JPY million/, `${id}: original source unit and conversion are retained`);
    assert.match(record.metrics[metricId].basis, /source precision remains 0\.1 JPY billion \(100 JPY million\)/, `${id}: source rounding precision is retained`);
  }
}
for (const [companyId, fiscalYear] of [['fanuc', 'FY2025'], ['denso', 'FY2026']]) {
  const annual = history.find(record => record.companyId === companyId && record.periodType === 'annual' && record.periodLabel === fiscalYear);
  const quarters = tenthBatch.filter(record => record.companyId === companyId && record.periodLabel.startsWith(`${fiscalYear} Q`));
  assert.equal(quarters.length, 4, `${companyId}: four converted standalone quarters share ${fiscalYear}`);
  for (const metricId of ['revenue', 'operatingProfit']) {
    const roundedQuarterSum = quarters.reduce((sum, record) => sum + record.metrics[metricId].value, 0);
    assert.ok(Math.abs(roundedQuarterSum - annual.metrics[metricId].value) <= 200, `${companyId}: sum of 0.1-billion-rounded quarters remains within source precision of the existing million-unit annual figure`);
  }
}
const tenthPeriods = new Map([
  ['fujikura', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['kokusai-electric', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['fanuc', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['canon', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['keyence', ['2025-03-20', '2025-06-20', '2025-09-20', '2025-12-20', '2026-03-20', '2026-06-20']],
  ['mitsubishi-electric', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
  ['denso', ['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30']],
]);
for (const [companyId, endDates] of tenthPeriods) {
  const quarterly = quarterlyByCompany.get(companyId);
  assert.deepEqual(quarterly.slice(-6).map(record => record.endDate), endDates, `${companyId}: six consecutive actual standalone quarters`);
  assert.equal(coverage.find(row => row.companyId === companyId).coverageStatus, 'complete-six-quarters', `${companyId}: complete coverage`);
  for (const field of ['currency', 'unit', 'accountingBasis']) assert.equal(new Set(quarterly.slice(-6).map(record => record[field])).size, 1, `${companyId}: stable ${field}`);
  assert.ok(quarterly.slice(-6).every(record => record.metrics.revenue.value != null && record.metrics.operatingProfit.value != null && record.metrics.operatingMargin.value != null), `${companyId}: sales, operating profit and margin are nonempty`);
}
assert.equal(coverage.filter(row => row.coverageStatus === 'partial-quarterly').length, 4, 'four companies remain partially covered');
assert.equal(coverage.filter(row => row.coverageStatus === 'awaiting-next-quarter').length, 1, 'Kioxia remains pending an actual publication');
assert.equal(coverage.filter(row => row.coverageStatus === 'needs-review').length, 26, '26 companies remain under review');
assert.equal(coverage.find(row => row.companyId === 'nvidia').checkedAt, '2026-09-23', 'unreviewed baseline companies retain their original coverage check date');
assert.equal(coverage.find(row => row.companyId === 'fujikura').coverageStatus, 'complete-six-quarters', 'Fujikura is complete from the comparable official series');

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
const loaderPathByBinding = new Map(loaderImports.map(match => [match[1], match[2]]));
const loaderInput = (await Promise.all([...loaderAggregate[1].matchAll(/\.\.\.(\w+)/g)]
  .map(match => readJson(join(dataDirectory, loaderPathByBinding.get(match[1])))))).flat();
const overrideById = new Map((await readJson(join(dataDirectory, 'financial-history-v04-cashflow-overrides.json'))).map(record => [record.id, record]));
const loadedHistory = loaderInput.map(record => {
  const override = overrideById.get(record.id);
  return override ? { ...record, ...override, metrics: { ...record.metrics, ...override.metrics } } : record;
});
assert.equal(loadedHistory.length, history.length, 'actual loader order and overrides retain all records');
assert.deepEqual(new Set(loadedHistory.map(record => record.companyId)), new Set(companies.map(company => company.id)), 'actual loader covers all 100 companies');
const assertUniformFinancialDisplayUnits = records => {
  for (const company of companies) {
    const companyRecords = records.filter(record => record.companyId === company.id);
    resolveCompareFinancialTablePresentation(companyRecords);
  }
};
assert.doesNotThrow(() => assertUniformFinancialDisplayUnits(loadedHistory), 'the production Compare presentation accepts all 100 loaded company histories');
assert.throws(() => assertUniformFinancialDisplayUnits(loadedHistory.map(record => record.id === 'denso-fy2027-q1' ? { ...record, unit: 'billion' } : record)), /mixed currency or unit/, 'the production guard rejects the reported DENSO unit regression');
assert.throws(() => assertUniformFinancialDisplayUnits(loadedHistory.map(record => record.id === 'fanuc-fy2026-q1' ? { ...record, unit: 'billion' } : record)), /mixed currency or unit/, 'the production guard rejects the second FANUC unit regression');
assert.equal(new Set(history.map(record => record.id)).size, history.length, 'all direct JSON financial record IDs are unique');
const compareCompaniesWithoutFinancialHistory = evidenceCompareSupportedCompanyIds
  .filter(companyId => !history.some(record => record.companyId === companyId));
assert.deepEqual(compareCompaniesWithoutFinancialHistory, [], 'all supported Compare Evidence companies have at least one history record through the same loader batch set');
console.log(`Financial quarterly coverage OK: ${coverage.filter(row => row.coverageStatus === 'complete-six-quarters').length} complete companies`);
