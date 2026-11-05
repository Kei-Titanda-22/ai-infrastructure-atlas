import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const previous = await read('docs/financial-latest-period-audit-v18.json');
const coverage = await read('src/data/financial-quarterly-coverage-v01.json');
const batch = await read('src/data/financial-history-v05-batch22.json');
const sources = await read('src/data/document-sources-v05-batch22.json');
const blockers = await read('src/data/financial-quarterly-blockers-v19.json');
const targetIds = ['air-liquide', 'ajinomoto-fine-techno', 'bosch', 'omron', 'schneider-electric'];
assert.equal(previous.records.length, 100);
assert.deepEqual(previous.records.filter(row => row.loadedCoverageStatus === 'needs-review').map(row => row.companyId).sort(), targetIds);
assert.equal(batch.length, 1);
assert.equal(batch[0].id, 'omron-fy2025-q1-v19');
assert.equal(sources.length, 1);
assert.equal(sources[0].id, batch[0].sourceId);
const coverageById = new Map(coverage.map(row => [row.companyId, row]));
const latest = {
  'air-liquide': { period: 'Q3 2026 revenue only', publishedAt: '2026-10-29', depth: 'sales-quarter-and-half-year-profit' },
  'ajinomoto-fine-techno': { period: 'FY2026 annual subsidiary result', publishedAt: '2026-08-06', depth: 'subsidiary-quarterly-original-unretrieved' },
  bosch: { period: 'H1 2026', publishedAt: '2026-09-23', depth: 'six-month-original-only' },
  omron: { period: 'FY2026 Q1 IFRS', publishedAt: '2026-08-05', depth: 'original-us-gaap-comparative-connected' },
  'schneider-electric': { period: 'Q3 2026 revenue only', publishedAt: '2026-10-16', depth: 'half-year-original-quarterly-profit-unconfirmed' },
};
const records = previous.records.map(row => {
  const id = row.companyId;
  if (!targetIds.includes(id)) return { ...row, reviewProvenanceV19: 'inherited-v18', reviewDepthV19: 'inherited', reviewedAtV19: null };
  const loaded = coverageById.get(id);
  return {
    ...row,
    loadedQuarterlyCount: loaded.actualQuarterCount,
    loadedLatestPeriod: loaded.latestPeriodLabel,
    loadedLatestEndDate: loaded.latestEndDate,
    loadedCoverageStatus: loaded.coverageStatus,
    reviewProvenanceV19: 'direct-v19',
    reviewDepthV19: latest[id].depth,
    reviewedAtV19: '2026-11-04',
    v19Outcome: id === 'omron' ? 'one-historical-quarter-adopted' : 'held',
    v19OfficialLatestPeriod: latest[id].period,
    v19OfficialLatestPublishedAt: latest[id].publishedAt,
    v19LatestPublishedPeriodCaptured: false,
    v19MissingEvidence: blockers.reasons[id],
    addedV19Periods: id === 'omron' ? [{
      recordId: batch[0].id, periodLabel: batch[0].periodLabel,
      startDate: batch[0].startDate, endDate: batch[0].endDate,
      revenue: batch[0].metrics.revenue.value,
      operatingProfit: batch[0].metrics.operatingProfit.value,
      operatingMargin: batch[0].metrics.operatingMargin.value,
      currency: batch[0].currency, unit: batch[0].unit,
      accountingBasis: batch[0].accountingBasis,
      sourceId: batch[0].sourceId, sourceUrl: sources[0].url,
      sourcePublishedAt: sources[0].publishedAt,
      sourceRetrievedAt: sources[0].retrievedAt,
      originalLocation: 'PDF physical p.24 / printed p.22; FY2025 Q1 US GAAP comparative column; DMB note physical p.16 / printed p.14; FY2025 annual bridge physical p.26 / printed p.24',
      derivation: 'Direct three-month column, JPY million identity conversion; 5815 / 166526 × 100 rounded to 3.5%.',
    }] : [],
  };
});
assert.equal(records.length, 100);
assert.equal(records.filter(row => row.reviewProvenanceV19 === 'direct-v19').length, 5);
assert.equal(records.filter(row => row.reviewProvenanceV19 === 'inherited-v18').length, 95);
assert.equal(coverage.filter(row => row.coverageStatus === 'complete-six-quarters').length, 95);
assert.equal(coverage.filter(row => row.coverageStatus === 'partial-quarterly').length, 1);
assert.equal(coverage.filter(row => row.coverageStatus === 'needs-review').length, 4);
const json = {
  schemaVersion: 'v19',
  auditAsOfJst: '2026-11-04T22:10:20+09:00',
  baselineMainSha: '669286f0151199721290edb6b10cedec922ddab5',
  previousAuditAsOfJst: previous.auditAsOfJst,
  targetIds, targetCount: 5, directlyReviewedCount: 5, inheritedNonTargetCount: 95,
  addedRecordCount: 1, adoptedCompanyCount: 1,
  counts: { complete: 95, partial: 1, awaiting: 0, needsReview: 4 },
  caveat: 'Omron FY2025 Q1 is a connected historical US GAAP quarter. The FY2026 IFRS published quarter is not added. Original-table verification, six-quarter coverage, and latest-period capture remain separate. The other four retain specific evidence gaps; 95 non-target review dates are inherited.',
  records,
};
const md = [
  '# Financial latest-period audit v19', '',
  '- Fixed review cutoff (JST): 2026-11-04 22:10:20.',
  '- Baseline main: 669286f0151199721290edb6b10cedec922ddab5.',
  '- Five companies reviewed; 95 non-target judgments and check dates inherited.',
  '- One historical Omron quarter adopted. Coverage: 95 complete / 1 partial / 0 awaiting / 4 needs review. Latest published Omron IFRS quarter is not captured.', '',
  '## Omron FY2025 Q1', '',
  '- April 1–June 30 2025, DMB-reclassified consolidated continuing operations, US GAAP, JPY million.',
  '- [Official JPX original](https://www2.jpx.co.jp/disc/66450/140120260804509051.pdf), published August 5 2026; PDF physical p.24 / printed p.22, US GAAP comparative three-month column: net sales 166,526, operating income 5,815. Adjacent IFRS values excluded.',
  '- The filing cover identifies the fiscal year ending March 2027. The adopted column is the prior FY2025 Q1 comparative.',
  '- Physical p.26 / printed p.24 repeats retained FY2025 US GAAP annual 767,351 / 59,935. Physical p.16 / printed p.14 documents DMB discontinued operations.',
  '- Direct three-month values, no subtraction or conversion. Operating margin = 5,815 ÷ 166,526 × 100 = 3.5% (one decimal). FCF and capex remain uncollected.',
  '- Q2–Q4 comparable US GAAP statements and the bridge to FY2026 IFRS remain unresolved.', '',
  '## Other four companies', '',
  ...targetIds.filter(id => id !== 'omron').flatMap(id => [
    `### ${id}`, '',
    `- Latest official period reviewed: ${latest[id].period}; published ${latest[id].publishedAt}.`,
    `- Specific remaining evidence: ${blockers.reasons[id]}`, '',
  ]),
  '## Scope', '',
  '- No claim that all 100 companies were updated to their latest published period.',
  '- Aptiv post-EDS separation, Hexagon post-Octave separation and Shinko post-delisting freshness remain separate inherited work.', '',
].join('\n');
const jsonText = `${JSON.stringify(json, null, 2)}\n`;
const jsonPath = join(root, 'docs/financial-latest-period-audit-v19.json');
const mdPath = join(root, 'docs/financial-latest-period-audit-v19.md');
if (process.argv.includes('--check')) {
  assert.equal(await readFile(jsonPath, 'utf8'), jsonText);
  assert.equal(await readFile(mdPath, 'utf8'), md);
  console.log('Financial latest-period audit v19 is current.');
} else if (process.argv.includes('--write')) {
  await Promise.all([writeFile(jsonPath, jsonText), writeFile(mdPath, md)]);
  console.log('Wrote financial latest-period audit v19.');
} else throw new Error('usage: --write|--check');
