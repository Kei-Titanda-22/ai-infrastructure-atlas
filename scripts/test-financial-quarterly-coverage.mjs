import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, 'src', 'data');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const companies = await Promise.all((await readdir(join(dataDirectory, 'companies'))).filter(file => file.endsWith('.json')).sort().map(file => readJson(join(dataDirectory, 'companies', file))));
const coverage = await readJson(join(dataDirectory, 'financial-quarterly-coverage-v01.json'));
const history = (await Promise.all((await readdir(dataDirectory)).filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file)).sort().map(file => readJson(join(dataDirectory, file))))).flat();

assert.equal(companies.length, 100, 'registry contains 100 companies');
assert.equal(coverage.length, 100, 'coverage contains 100 companies');
assert.deepEqual(new Set(coverage.map(row => row.companyId)), new Set(companies.map(company => company.id)), 'coverage company IDs exactly match registry');
assert.equal(new Set(coverage.map(row => row.companyId)).size, coverage.length, 'coverage company IDs are unique');

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

const financialPage = await readFile(join(root, 'src', 'pages', 'financials.astro'), 'utf8');
assert.match(financialPage, /quarterlyChartRecords\s*=\s*quarterly\.slice\(-6\)/, 'quarterly chart is limited to the latest six records');
console.log(`Financial quarterly coverage OK: ${coverage.filter(row => row.coverageStatus === 'complete-six-quarters').length} complete companies`);
