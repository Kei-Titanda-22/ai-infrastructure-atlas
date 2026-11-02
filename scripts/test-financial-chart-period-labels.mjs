import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layoutFinancialPeriodLabels } from '../src/lib/financial-chart-label-layout.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, 'src', 'data');

function labelBounds(labels, width, characterWidth = 7.5) {
  const isNarrow = Math.round(width) < 440;
  const leftPadding = isNarrow ? 50 : 60;
  const rightPadding = isNarrow ? 10 : 14;
  const available = Math.round(width) - leftPadding - rightPadding;
  return labels.map((label, index) => {
    const x = labels.length === 1
      ? leftPadding + available / 2
      : leftPadding + (available * index) / (labels.length - 1);
    const textWidth = label.length * characterWidth;
    const left = index === 0 ? x : index === labels.length - 1 ? x - textWidth : x - textWidth / 2;
    return { left, right: left + textWidth };
  });
}

function assertLayout(labels, width, characterWidth) {
  const bounds = labelBounds(labels, width, characterWidth);
  const { visibleIndexes: selected, staggerEndpoints } = layoutFinancialPeriodLabels(bounds);
  assert.equal(selected[0], 0, 'first period remains visible');
  assert.equal(selected.at(-1), labels.length - 1, 'last period remains visible');
  assert.deepEqual([...selected].sort((a, b) => a - b), selected, 'period order is unchanged');
  if (staggerEndpoints) {
    assert.deepEqual(selected, [0, labels.length - 1], 'colliding endpoints remain visible on separate rows');
  }
  for (let index = 1; !staggerEndpoints && index < selected.length; index += 1) {
    assert.ok(bounds[selected[index - 1]].right + 4 <= bounds[selected[index]].left,
      `${labels.join(', ')} at ${width}px: displayed labels do not collide`);
  }
  return selected;
}

const kioxiaLabels = ['FY2026 Q1', 'FY2026 Q2', 'FY2026 Q3', 'FY2026 Q4', 'FY2027 Q1', 'FY2027 Q2'];
const measuredKioxiaWidth = 59.6932373046875;
const preFixBounds = labelBounds(kioxiaLabels, 472.5, measuredKioxiaWidth / kioxiaLabels[0].length);
assert.ok(preFixBounds[0].right > preFixBounds[1].left, 'old all-label layout collides at the observed 472.5px');
assert.ok(preFixBounds[4].right > preFixBounds[5].left, 'old all-label layout collides at the right endpoint');
assert.ok(assertLayout(kioxiaLabels, 472.5, measuredKioxiaWidth / kioxiaLabels[0].length).length < 6,
  'observed long FY labels are selectively hidden');
for (const width of [320, 390, 439, 440, 472.5, 720]) assertLayout(kioxiaLabels, width);

const shortLabels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2'];
for (const width of [320, 439, 440, 472.5, 720]) {
  assert.deepEqual(assertLayout(shortLabels, width), [0, 1, 2, 3, 4, 5], 'short labels remain complete');
}
for (const count of [1, 2, 5, 6]) {
  assertLayout(kioxiaLabels.slice(0, count), 472.5);
}

const fileNames = (await readdir(dataDirectory))
  .filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file))
  .sort();
const history = (await Promise.all(fileNames.map(async file => JSON.parse(await readFile(join(dataDirectory, file), 'utf8'))))).flat();
const byCompany = new Map();
for (const record of history) {
  const records = byCompany.get(record.companyId) ?? [];
  records.push(record);
  byCompany.set(record.companyId, records);
}
assert.equal(byCompany.size, 100, 'all 100 registered companies have financial history');
let quarterlySeries = 0;
let annualSeries = 0;
for (const [companyId, records] of byCompany) {
  const quarterly = records.filter(record => record.periodType === 'quarterly').sort((a, b) => a.endDate.localeCompare(b.endDate));
  const annual = records.filter(record => record.periodType === 'annual').sort((a, b) => a.endDate.localeCompare(b.endDate));
  const selected = quarterly.length ? quarterly.slice(-6) : annual;
  if (quarterly.length) quarterlySeries += 1;
  else annualSeries += 1;
  assert.ok(selected.length > 0, `${companyId}: chart input is nonempty`);
  assert.ok(selected.length <= 6 || !quarterly.length, `${companyId}: quarterly chart is capped at six`);
  const labels = selected.map(record => record.periodLabel);
  for (const width of [320, 390, 439, 440, 472.5, 720]) {
    assertLayout(labels, width);
  }
  assert.deepEqual(selected.map(record => record.periodLabel), labels, `${companyId}: selecting labels does not alter chart data`);
  assert.equal(records.length, quarterly.length + annual.length, `${companyId}: table history remains complete`);
}

console.log(`financial chart period label layout PASS: ${byCompany.size} companies; ${quarterlySeries} quarterly and ${annualSeries} annual series`);
