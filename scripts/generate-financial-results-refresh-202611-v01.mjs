import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { latestNormalizedFinancialRecord } from '../src/lib/financial-comparison-contract.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
export async function loadFinancialModule() {
  let source = await readFile(join(root, 'src/lib/financial-history.ts'), 'utf8');
  const imports = [...source.matchAll(/^import (\w+) from '\.\.\/data\/([^']+)';$/gm)];
  for (const [statement, name, path] of imports) source = source.replace(statement, `const ${name} = ${JSON.stringify(await read('src/data/' + path))};`);
  return import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
}
export function recordDigest(records) {
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  return createHash('sha256').update(JSON.stringify(canonical([...records].sort((a, b) => a.id.localeCompare(b.id, 'en'))))).digest('hex');
}

export async function generate() {
  const input = await read('src/data/financial-results-refresh-202611-v01.json');
  const batch = await read('src/data/financial-history-v05-batch23.json');
  const coverage = await read('src/data/financial-quarterly-coverage-v01.json');
  const loader = await loadFinancialModule();
  assert.equal(input.companies.length, 100);
  assert.deepEqual(new Set(input.companies.map(row => row.companyId)), new Set(coverage.map(row => row.companyId)));
  assert.equal(new Set(batch.map(row => row.id)).size, batch.length);
  const addedIds = new Set(batch.map(row => row.id));
  const retained = loader.financialHistory.filter(row => !addedIds.has(row.id));
  assert.equal(recordDigest(retained), input.baselineLoadedRecordDigest, 'all 715 loaded records, including overrides and provenance, remain unchanged');
  const byCoverage = new Map(coverage.map(row => [row.companyId, row]));
  const records = input.companies.map(row => {
    const history = loader.getFinancialHistory(row.companyId);
    const quarters = history.filter(record => record.periodType === 'quarterly');
    const annuals = history.filter(record => record.periodType === 'annual');
    const latest = loader.getLatestFinancialRecord(row.companyId);
    for (const candidate of row.candidates) {
      const actual = batch.find(record => record.id === candidate.recordId);
      assert.ok(actual, candidate.recordId);
      for (const metric of ['revenue', 'operatingProfit', 'operatingMargin']) assert.equal(actual.metrics[metric].value, candidate[metric], candidate.recordId + ':' + metric);
      for (const field of ['periodType', 'periodLabel', 'startDate', 'endDate', 'currency', 'unit', 'accountingBasis', 'sourceId']) assert.equal(actual[field], candidate[field], candidate.recordId + ':' + field);
    }
    const latestCaptured = row.latestPublishedPeriodCaptured === true;
    if (latestCaptured && row.latestDisclosure?.endDate) assert.equal(latest.endDate, row.latestDisclosure.endDate, row.companyId + ': latest disclosed end date is loaded');
    return { ...row, loadedQuarterCount: quarters.length, loadedAnnualCount: annuals.length,
      loadedLatestQuarter: quarters.at(-1)?.periodLabel ?? null, loadedLatestQuarterEndDate: quarters.at(-1)?.endDate ?? null,
      loadedLatestAnnual: annuals.at(-1)?.periodLabel ?? null, loadedLatestAnnualEndDate: annuals.at(-1)?.endDate ?? null,
      loadedLatestRecordId: latest.id, loadedCompareLatestRecordId: latestNormalizedFinancialRecord(row.companyId, loader.financialHistory).id,
      loadedCoverageStatus: byCoverage.get(row.companyId).coverageStatus,
      latestSixQuarterRecordIds: quarters.slice(-6).map(record => record.id),
      missingPublishedPeriodCount: latestCaptured ? 0 : row.missingPeriods?.length ?? null,
      loadedAccountingBases: [...new Set(history.map(record => record.accountingBasis))],
      loadedPeriods: history.map(record => ({ id: record.id, periodType: record.periodType, periodLabel: record.periodLabel, endDate: record.endDate, sourceId: record.sourceId, verifiedAt: record.verifiedAt })),
    };
  });
  const count = status => records.filter(row => row.status === status).length;
  const result = {
    schemaVersion: input.schemaVersion, cutoffJst: input.cutoffJst, baselineMain: input.baselineMain,
    scope: input.scope, baselineLoadedRecordDigest: input.baselineLoadedRecordDigest,
    counts: { ...loader.financialCoverage(), addedQuarterly: batch.filter(row => row.periodType === 'quarterly').length,
      addedAnnual: batch.filter(row => row.periodType === 'annual').length, updatedCompanies: new Set(batch.map(row => row.companyId)).size,
      routeOrSourceReviewedCompanies: records.length, originalNumbersReviewedCompanies: records.filter(row => ['adopted-comparable-original', 'current-original-reviewed'].includes(row.originalNumberReview)).length,
      latestCapturedAfterAddition: count('adopt'), alreadyCurrent: count('already-current'),
      nextAnnouncementWaiting: count('announcement-pending') + count('already-current-next-release-waiting'),
      historicalAdditionLatestHeld: count('adopt-historical-hold-latest'), seriesConnectionHeld: count('connection-held'),
      standalonePeriodEvidenceHeld: count('held-period-evidence'), originalUnretrieved: count('original-unretrieved'),
      completeSixQuarters: coverage.filter(row => row.coverageStatus === 'complete-six-quarters').length,
      partialQuarterly: coverage.filter(row => row.coverageStatus === 'partial-quarterly').length,
      awaiting: coverage.filter(row => row.coverageStatus === 'awaiting-next-quarter').length,
      needsReview: coverage.filter(row => row.coverageStatus === 'needs-review').length },
    caveats: [
      'All 100 companies received a dated source/route decision; original-table numbers and latest-period certainty are separately recorded. No claim of 100-company numerical verification or update.',
      'Six-quarter history coverage is not recency. Omron receives one historical US GAAP quarter; current IFRS remains held. Aptiv, Hexagon, Resonac and Shinko scope changes remain held.',
      'Source terms pending never imply permission for unattended acquisition. One-off source inspection and saved/not-saved evidence remain distinct.',
      'Six new annuals reconcile with their four quarters at published precision. Qualcomm, Infineon and Siemens Energy have explicitly documented one-million presentation rounding residuals; retained quarters are not rewritten.',
      'Pagefind semantic URL/fragment agreement and raw generated-file agreement are separate checks. No inference about prior CI dependency versions.',
    ], records,
  };
  const cell = value => String(value ?? '未確定').replaceAll('|', '\\|').replaceAll('\n', ' ');
  const md = [
    '# 2026年10～11月 決算実績保守更新', '',
    `- 固定調査基準日時：${input.cutoffJst}。取得・採否記録の日時とは別です。`,
    `- 基準main：${input.baselineMain}。正規loaderの100社を一つの調査単位として扱います。`,
    `- 追加：${result.counts.updatedCompanies}社、単独四半期${result.counts.addedQuarterly}件・通期${result.counts.addedAnnual}件。全履歴${result.counts.periods}件／100社。`,
    `- 歴史的6期coverage：${result.counts.completeSixQuarters}／${result.counts.partialQuarterly}／${result.counts.awaiting}／${result.counts.needsReview}。最新期追随とは別判定です。`,
    `- 最新期を追加した企業${result.counts.latestCapturedAfterAddition}、既に収録済み${result.counts.alreadyCurrent}、次回発表待ち${result.counts.nextAnnouncementWaiting}、歴史的追加のみ${result.counts.historicalAdditionLatestHeld}、系列接続保留${result.counts.seriesConnectionHeld}、単独期の証拠保留${result.counts.standalonePeriodEvidenceHeld}、原表取得未完了${result.counts.originalUnretrieved}。`, '',
    '## 全社の採否・収録最新期', '',
    '| companyId | 今回判定 | 収録最新四半期 | 収録最新年次 | 確認した開示 | 公表日 | 6期coverage |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...records.map(row => `| ${row.companyId} | ${cell(row.status)} | ${cell(row.loadedLatestQuarter)} (${cell(row.loadedLatestQuarterEndDate)}) | ${cell(row.loadedLatestAnnual)} | [${cell(row.latestDisclosure?.periodLabel)}](${row.source.url}) | ${cell(row.latestDisclosure?.publishedAt)} | ${row.loadedCoverageStatus} |`), '',
    '## 会社別原表・算出・不足証拠', '',
    ...records.flatMap(row => [`### ${row.companyId}`, '',
      `- 発行体：${cell(row.issuer.officialName)} (${cell(row.issuer.ticker)})。照合日：${row.auditDateJst}。`,
      `- [${cell(row.source.title)}](${row.source.url})。原表位置：${cell(row.source.position)}。`,
      `- 接続／保留：${cell(row.connection ?? row.reason ?? row.displaySummary)}。`,
      ...(row.latestDisclosure?.publicationDateQualification ? [`- 日付の区別：${row.latestDisclosure.publicationDateQualification}`] : []),
      `- 追加：${row.candidates.length}件。既存全履歴${row.loadedPeriods.length}件を保持。最新6点上限：${row.latestSixQuarterRecordIds.join(', ') || '四半期なし'}。`,
      ...row.candidates.filter(candidate => candidate.sourceSelection).map(candidate => `- 採用列 (${candidate.periodLabel})：${candidate.sourceSelection.columnHeader}、${candidate.sourceSelection.columnRole}、${candidate.sourceSelection.startDate}～${candidate.sourceSelection.endDate}。原表：${candidate.sourceSelection.table}／${candidate.sourceSelection.position}。`),
      ...row.candidates.map(candidate => `- ${candidate.periodLabel} (${candidate.startDate}–${candidate.endDate})：売上高 ${candidate.revenue}、未調整営業利益 ${candidate.operatingProfit}、営業利益率 ${candidate.operatingMargin}%。${candidate.accountingBasis}／${candidate.currency} ${candidate.unit}／${candidate.scope}。方式 ${candidate.method}。${JSON.stringify(candidate.calculation ?? {})} ${candidate.note ?? ''}`.trimEnd()),
      `- 資料保存・取得失敗・Web確認の証跡：JSONのsourceAcquisitionEvidenceとwebTraceEvidence。公表済み最新期の収録判定：${row.latestPublishedPeriodCaptured}。`, '',
    ]),
    '## 留保', '', ...result.caveats.map(text => '- ' + text), '',
    '- v20の履歴拡充終了記録は保持。本更新は新しい決算公表を契機とした保守で、Atlas全体の完成を意味しません。', '',
  ].join('\n');
  const outputs = [['docs/financial-results-refresh-202611-v01.json', JSON.stringify(result, null, 2) + '\n'], ['docs/financial-results-refresh-202611-v01.md', md]];
  return { outputs, result };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const { outputs, result } = await generate();
  if (process.argv.includes('--write')) for (const [path, text] of outputs) await writeFile(join(root, path), text);
  else if (process.argv.includes('--check')) for (const [path, text] of outputs) assert.equal(await readFile(join(root, path), 'utf8'), text, path + ': stale');
  else throw new Error('Use --write or --check');
  console.log(JSON.stringify(result.counts));
}
