import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, 'src', 'data');
const outputPath = join(dataDirectory, 'financial-quarterly-coverage-v01.json');
const reportPath = join(root, 'docs', 'financial-quarterly-coverage-v01.md');
const baselineCheckedAt = '2026-09-23';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

const sourceManifest = await readJson(join(dataDirectory, 'source-registry-manifest.json'));
const sources = (await Promise.all(sourceManifest.shards.map(async shard => readJson(join(dataDirectory, shard))))).flat();
const sourceById = new Map(sources.map(source => [source.id, source]));
const companyFiles = (await readdir(join(dataDirectory, 'companies'))).filter(file => file.endsWith('.json')).sort();
const companies = await Promise.all(companyFiles.map(file => readJson(join(dataDirectory, 'companies', file))));
const historyFiles = (await readdir(dataDirectory))
  .filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file))
  .sort((left, right) => left.localeCompare(right, 'en'));
const history = (await Promise.all(historyFiles.map(file => readJson(join(dataDirectory, file))))).flat();

const quarterlyByCompany = new Map(companies.map(company => [company.id, []]));
for (const record of history) {
  if (record.periodType === 'quarterly') quarterlyByCompany.get(record.companyId)?.push(record);
}
for (const records of quarterlyByCompany.values()) records.sort((left, right) => left.endDate.localeCompare(right.endDate));

const coverageEntry = company => {
  const quarterly = quarterlyByCompany.get(company.id) ?? [];
  const latest = quarterly.at(-1);
  const fallbackRecord = history
    .filter(record => record.companyId === company.id)
    .sort((left, right) => left.endDate.localeCompare(right.endDate))
    .at(-1);
  const source = sourceById.get(latest?.sourceId ?? fallbackRecord?.sourceId);
  if (!source?.url) throw new Error(`${company.id}: no official source URL resolves from normalized history`);
  const checkedAt = quarterly.reduce((latestCheckedAt, record) => {
    const recordSource = sourceById.get(record.sourceId);
    if (!recordSource?.retrievedAt) throw new Error(`${company.id}: missing quarterly source retrieval date for ${record.id}`);
    return recordSource.retrievedAt > latestCheckedAt ? recordSource.retrievedAt : latestCheckedAt;
  }, source.retrievedAt > baselineCheckedAt ? source.retrievedAt : baselineCheckedAt);

  if (company.id === 'kioxia') {
    return {
      companyId: company.id,
      disclosureCadence: 'quarterly',
      actualQuarterCount: quarterly.length,
      targetQuarterCount: 6,
      latestPeriodLabel: latest?.periodLabel ?? null,
      latestEndDate: latest?.endDate ?? null,
      coverageStatus: 'awaiting-next-quarter',
      blockerReason: 'FY2027 Q2は現時点で公式実績が未公表のため収録しない。公式IRカレンダー上の発表予定は実績値ではない。',
      officialSourceUrl: source.url,
      checkedAt,
    };
  }

  if (quarterly.length >= 6) {
    return {
      companyId: company.id,
      disclosureCadence: 'quarterly',
      actualQuarterCount: quarterly.length,
      targetQuarterCount: 6,
      latestPeriodLabel: latest?.periodLabel ?? null,
      latestEndDate: latest?.endDate ?? null,
      coverageStatus: 'complete-six-quarters',
      blockerReason: null,
      officialSourceUrl: source.url,
      checkedAt,
    };
  }

  if (quarterly.length > 0) {
    return {
      companyId: company.id,
      disclosureCadence: 'quarterly',
      actualQuarterCount: quarterly.length,
      targetQuarterCount: 6,
      latestPeriodLabel: latest?.periodLabel ?? null,
      latestEndDate: latest?.endDate ?? null,
      coverageStatus: 'partial-quarterly',
      blockerReason: '一次資料で検証済みの単独四半期は6件未満。未収録期を予想・均等割り・為替換算で補完しない。',
      officialSourceUrl: source.url,
      checkedAt,
    };
  }

  return {
    companyId: company.id,
    disclosureCadence: 'needs-review',
    actualQuarterCount: 0,
    targetQuarterCount: 6,
    latestPeriodLabel: null,
    latestEndDate: null,
    coverageStatus: 'needs-review',
    blockerReason: '既存の公式通期資料はあるが、四半期開示頻度、会計基準、通貨、改訂系列の連続性をまだ確定できていない。推定値は収録しない。',
    officialSourceUrl: source.url,
    checkedAt,
  };
};

const coverage = companies.map(coverageEntry).sort((left, right) => left.companyId.localeCompare(right.companyId, 'en'));
if (coverage.length !== 100 || new Set(coverage.map(row => row.companyId)).size !== 100) throw new Error('coverage must contain each registry company exactly once');

const statusOrder = [
  'complete-six-quarters',
  'partial-quarterly',
  'awaiting-next-quarter',
  'semiannual-only',
  'annual-only',
  'private-no-quarterly-disclosure',
  'needs-review',
];
const count = status => coverage.filter(row => row.coverageStatus === status).length;
const completeCompanies = coverage.filter(row => row.coverageStatus === 'complete-six-quarters').map(row => row.companyId);
const coverageJson = `${JSON.stringify(coverage, null, 2)}\n`;
const historyDigest = createHash('sha256').update(historyFiles.map(file => file).join('\n')).digest('hex');
const latestCheckedAt = coverage.map(row => row.checkedAt).sort().at(-1);
const report = [
  '# Financial quarterly coverage v0.1',
  '',
  `- Checked at: ${latestCheckedAt}`,
  `- Registry companies: ${coverage.length}`,
  `- Financial-history shard manifest digest: ${historyDigest}`,
  `- Complete six quarters: ${count('complete-six-quarters')}`,
  `- Partial quarterly (1–5): ${count('partial-quarterly')}`,
  `- Awaiting next reported quarter: ${count('awaiting-next-quarter')}`,
  `- Semiannual only: ${count('semiannual-only')}`,
  `- Annual only: ${count('annual-only')}`,
  `- Private/no quarterly disclosure: ${count('private-no-quarterly-disclosure')}`,
  `- Needs review: ${count('needs-review')}`,
  '',
  '## Companies with six or more actual quarterly records',
  '',
  completeCompanies.length ? completeCompanies.map(id => `- ${id}`).join('\n') : '- None',
  '',
  '## Per-company coverage',
  '',
  '| companyId | cadence | actual / target | latest period | status | blocker | official source |',
  '| --- | --- | ---: | --- | --- | --- | --- |',
  ...coverage.map(row => `| ${row.companyId} | ${row.disclosureCadence} | ${row.actualQuarterCount} / ${row.targetQuarterCount} | ${row.latestPeriodLabel ?? '—'} (${row.latestEndDate ?? '—'}) | ${row.coverageStatus} | ${row.blockerReason ?? '—'} | [official](${row.officialSourceUrl}) |`),
  '',
].join('\n');

const check = process.argv.includes('--check');
if (check) {
  const [existingCoverage, existingReport] = await Promise.all([readFile(outputPath, 'utf8'), readFile(reportPath, 'utf8')]);
  if (existingCoverage !== coverageJson || existingReport !== report) throw new Error('coverage JSON or report is stale; run with --write');
  console.log(`Financial quarterly coverage is current: ${coverage.length} companies`);
} else if (process.argv.includes('--write')) {
  await mkdir(dirname(reportPath), { recursive: true });
  await Promise.all([writeFile(outputPath, coverageJson), writeFile(reportPath, report)]);
  console.log(`Wrote financial quarterly coverage: ${coverage.length} companies`);
} else {
  throw new Error('usage: node scripts/generate-financial-quarterly-coverage.mjs --write|--check');
}
