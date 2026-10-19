import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const auditAsOfJst = '2026-10-20T08:28:21+09:00';
const baselineMainSha = 'd4fa4051d1e807e0ba8e55107874036a4e5b97ad';
const previous = await readJson('docs/financial-latest-period-audit-v11.json');
const coverage = await readJson('src/data/financial-quarterly-coverage-v01.json');
const added = await readJson('src/data/financial-history-v05-batch15.json');
const sourceShards = await readJson('src/data/source-registry-manifest.json');
const sources = (await Promise.all(sourceShards.shards.map(file => readJson(`src/data/${file}`)))).flat();
const sourceById = new Map(sources.map(source => [source.id, source]));
const coverageById = new Map(coverage.map(row => [row.companyId, row]));
const newlyChecked = new Map([
  ['digital-realty', { status: 'latest-confirmed', reason: '会社のQ2 2026 GAAP連結単独損益表の5期列とQ1 2026公表のQ1 2025比較列を照合し、連続6期を収録。Q3実績の公表予定は10月29日で、基準日時には未公表。' }],
  ['resonac-holdings', { status: 'latest-confirmed', reason: '取引所提出の2026 H1 IFRS連結累計と会社Q1正式資料の同一年・同単位・同利益定義の差分でQ2単独を確定。core営業利益は不使用。' }],
  ['mobileye', { status: 'latest-confirmed', reason: '会社Q1・Q2 2026 GAAP連結単独損益表を照合。Q1の減損による赤字を欠損・調整後利益へ置換しない。' }],
  ['stmicroelectronics', { status: 'latest-confirmed', reason: '会社Q2 2026正式財務諸表のUS GAAP連結損益とQ1比較欄を照合。Q3会社見通しは実績として扱わない。' }],
  ['synopsys', { status: 'latest-confirmed', reason: '会社FY2026 Q3正式連結損益表のUS GAAP単独期を照合。Ansys取得前後の過去連続6期は未確定で、Q3のみ収録。' }],
  ['kioxia', { status: 'latest-confirmed', reason: '公式IRニュースを基準日時に再確認。FY2027 Q2決算の公表予定は2026年10月30日で、未公表値を追加しない。' }],
]);

assert.equal(previous.records.length, 100);
assert.equal(coverage.length, 100);
const records = previous.records.map(old => {
  const row = coverageById.get(old.companyId);
  assert.ok(row, `${old.companyId}: coverage missing`);
  const additions = added.filter(record => record.companyId === old.companyId).sort((a, b) => a.endDate.localeCompare(b.endDate));
  const latestAdded = additions.at(-1);
  const direct = newlyChecked.get(old.companyId);
  const source = latestAdded && sourceById.get(latestAdded.sourceId);
  const result = {
    ...old,
    existingQuarterlyCountAtBase: old.loadedQuarterlyCount,
    loadedQuarterlyCount: row.actualQuarterCount,
    loadedLatestPeriod: row.latestPeriodLabel,
    loadedLatestEndDate: row.latestEndDate,
    loadedCoverageStatus: row.coverageStatus,
    reviewProvenance: direct ? 'direct-v12' : 'inherited-v11',
    addedPeriodLabels: additions.map(record => record.periodLabel),
  };
  if (direct) {
    result.latestPeriodAuditStatus = direct.status;
    result.officialLatestPeriod = latestAdded?.periodLabel ?? old.officialLatestPeriod;
    result.officialLatestEndDate = latestAdded?.endDate ?? old.officialLatestEndDate;
    result.officialLatestPublishedAt = source?.publishedAt ?? old.officialLatestPublishedAt;
    result.officialLatestSourceUrl = source?.url ?? old.officialLatestSourceUrl;
    result.checkedAt = '2026-10-20';
    result.reason = direct.reason;
  }
  return result;
});
assert.deepEqual(new Set(records.map(row => row.companyId)), new Set(coverage.map(row => row.companyId)));
const statuses = ['latest-confirmed', 'update-needed', 'non-quarterly-disclosure', 'unverified'];
const counts = Object.fromEntries(statuses.map(status => [status, records.filter(row => row.latestPeriodAuditStatus === status).length]));
const provenanceCounts = { directV12: records.filter(row => row.reviewProvenance === 'direct-v12').length, inheritedV11: records.filter(row => row.reviewProvenance === 'inherited-v11').length };
assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), 100);
assert.equal(provenanceCounts.directV12 + provenanceCounts.inheritedV11, 100);
const report = { schemaVersion: 'v12', auditAsOfJst, baselineMainSha, counts, provenanceCounts, records };
const json = `${JSON.stringify(report, null, 2)}\n`;
const markdown = [
  '# Financial latest-period audit v12',
  '',
  `- Audit cutoff (JST): ${auditAsOfJst}`,
  `- Baseline main: ${baselineMainSha}`,
  `- v12 directly checked: ${provenanceCounts.directV12}; v11 review inherited without refreshing checkedAt: ${provenanceCounts.inheritedV11}`,
  `- Latest confirmed: ${counts['latest-confirmed']} (includes inherited prior checks)` ,
  `- Update needed: ${counts['update-needed']}; non-quarterly disclosure: ${counts['non-quarterly-disclosure']}; unverified: ${counts.unverified}`,
  '- Six-quarter coverage and latest-period audit are separate classifications. Inherited v11 findings are not a fresh v12 confirmation.',
  '',
  '| Company ID | Quarterly at v11 → v12 | Loaded latest | Official latest | Audit status | Review provenance | Checked | New periods | Primary URL | Reason |',
  '| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...records.map(row => `| ${row.companyId} | ${row.existingQuarterlyCountAtBase} → ${row.loadedQuarterlyCount} | ${row.loadedLatestPeriod ?? '—'} (${row.loadedLatestEndDate ?? '—'}) | ${row.officialLatestPeriod ?? '—'} (${row.officialLatestEndDate ?? '—'}) | ${row.latestPeriodAuditStatus} | ${row.reviewProvenance} | ${row.checkedAt ?? '—'} | ${row.addedPeriodLabels.join(', ') || '—'} | ${row.officialLatestSourceUrl ? `[official](${row.officialLatestSourceUrl})` : '—'} | ${row.reason} |`),
  '',
].join('\n');
const jsonPath = join(root, 'docs', 'financial-latest-period-audit-v12.json');
const markdownPath = join(root, 'docs', 'financial-latest-period-audit-v12.md');
if (process.argv.includes('--write')) {
  await Promise.all([writeFile(jsonPath, json), writeFile(markdownPath, markdown)]);
  console.log(`Wrote v12 latest-period audit: ${provenanceCounts.directV12} direct, ${provenanceCounts.inheritedV11} inherited`);
} else if (process.argv.includes('--check')) {
  assert.equal(await readFile(jsonPath, 'utf8'), json, 'v12 audit JSON is stale');
  assert.equal(await readFile(markdownPath, 'utf8'), markdown, 'v12 audit Markdown is stale');
  console.log(`v12 latest-period audit current: ${provenanceCounts.directV12} direct, ${provenanceCounts.inheritedV11} inherited`);
} else {
  throw new Error('usage: node scripts/generate-financial-latest-period-audit-v12.mjs --write|--check');
}
