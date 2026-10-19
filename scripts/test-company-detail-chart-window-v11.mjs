import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, 'src', 'data');
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const companyFiles = (await readdir(join(dataDirectory, 'companies'))).filter(file => file.endsWith('.json'));
const companies = await Promise.all(companyFiles.map(file => readJson(join(dataDirectory, 'companies', file))));
const historyFiles = (await readdir(dataDirectory))
  .filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file));
const records = (await Promise.all(historyFiles.map(file => readJson(join(dataDirectory, file))))).flat();
const byCompany = new Map(companies.map(company => [company.id, []]));
for (const record of records) byCompany.get(record.companyId)?.push(record);
for (const history of byCompany.values()) history.sort((a, b) => a.endDate.localeCompare(b.endDate));

assert.equal(companies.length, 100, 'all 100 company detail routes are in scope');
assert.ok([...byCompany.values()].every(history => history.length > 0), 'every company retains its financial history');
const loader = await readFile(join(root, 'src', 'lib', 'financial-history.ts'), 'utf8');
const detail = await readFile(join(root, 'src', 'pages', 'companies', '[id].astro'), 'utf8');
assert.match(loader, /\.sort\(\(a, b\) => a\.endDate\.localeCompare\(b\.endDate\)\)/, 'loader returns period-end ascending history');
assert.match(detail, /pilotQuarterlyHistory\.length > 0 \? pilotQuarterlyHistory\.slice\(-6\) : pilotAnnualHistory/, 'only the company-detail chart input takes the last six quarters');
assert.match(detail, /FinancialChart records=\{pilotChartHistory\} metricId="revenue"/, 'revenue chart uses the shared window');
assert.match(detail, /FinancialChart records=\{pilotChartHistory\} metricId="operatingMargin"/, 'operating-margin chart uses the same window');

const longHistory = [...byCompany].filter(([, history]) => history.filter(record => record.periodType === 'quarterly').length >= 7)
  .map(([id]) => id).sort();
for (const id of ['asml', 'besi', 'credo', 'micron', 'nan-ya-pcb', 'seagate', 'tsmc']) {
  assert.ok(longHistory.includes(id), `${id}: previously long history remains in scope`);
}

if (process.argv.includes('--dist')) {
  const decodeAttribute = value => value.replaceAll('&quot;', '"').replaceAll('&amp;', '&');
  let checked = 0;
  let annualFallback = 0;
  for (const company of companies) {
    const history = byCompany.get(company.id);
    const quarterly = history.filter(record => record.periodType === 'quarterly');
    const annual = history.filter(record => record.periodType === 'annual');
    const window = quarterly.length ? quarterly.slice(-6) : annual;
    const html = await readFile(join(root, 'dist', 'companies', company.id, 'index.html'), 'utf8');
    const charts = [...html.matchAll(/<div class="financial-chart-plot" data-financial-trend data-series="([^"]+)" data-metric-id="([^"]+)"/g)];
    if (!quarterly.length) {
      assert.equal(charts.length, 0, `${company.id}: annual-only fallback does not become a quarterly trend`);
      if (annual.some(record => record.metrics?.revenue?.value != null)) {
        assert.match(html, /class="financial-chart financial-chart--annual"/, `${company.id}: annual fallback remains visible`);
      }
      annualFallback++;
      continue;
    }
    assert.equal(charts.length, 2, `${company.id}: both quarterly charts are rendered`);
    for (const metricId of ['revenue', 'operatingMargin']) {
      const chart = charts.find(match => match[2] === metricId);
      assert.ok(chart, `${company.id}: ${metricId} chart exists`);
      const points = JSON.parse(decodeAttribute(chart[1]));
      const expected = window.filter(record => record.metrics?.[metricId]?.value != null);
      assert.deepEqual(points.map(point => point.endDate), expected.map(record => record.endDate), `${company.id}: ${metricId} uses only the latest six quarter inputs in order`);
      assert.deepEqual(points.map(point => point.period), expected.map(record => record.periodLabel), `${company.id}: ${metricId} periods match source records`);
      assert.deepEqual(points.map(point => point.value), expected.map(record => record.metrics[metricId].value), `${company.id}: ${metricId} values match source records`);
      assert.ok(points.length <= 6, `${company.id}: ${metricId} has no more than six points`);
    }
    const [revenue, margin] = ['revenue', 'operatingMargin'].map(metricId => JSON.parse(decodeAttribute(charts.find(match => match[2] === metricId)[1])));
    if (window.every(record => record.metrics?.revenue?.value != null && record.metrics?.operatingMargin?.value != null)) {
      assert.deepEqual(revenue.map(point => point.endDate), margin.map(point => point.endDate), `${company.id}: both complete metric charts share the same periods`);
    }
    checked++;
  }
  console.log(`Company-detail chart window OK: ${checked} quarterly routes, ${annualFallback} annual fallbacks, ${longHistory.length} seven-plus-quarter histories`);
} else {
  console.log(`Company-detail chart source contract OK: 100 companies, ${longHistory.length} seven-plus-quarter histories`);
}
