import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
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
const historyFiles = (await readdir(join(root, 'src', 'data'))).filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file));
const allHistory = (await Promise.all(historyFiles.map(file => readJson(`src/data/${file}`)))).flat();
const coverageById = new Map(coverage.map(row => [row.companyId, row]));
const newlyChecked = new Map([
  ['asmpt', { status: 'latest-confirmed', reason: '会社のFY2025決算p.24・p.36、2026 Q1決算p.7・p.13、2026 Q2中間決算p.12・p.30の継続事業HKFRS連結売上高・reported営業利益を照合。NEXX売却後の再表示列を使い、2025 Q1～2026 Q2の6単独期を収録。Q3 2026決算は10月28日発表予定で基準日時には未公表。' }],
  ['digital-realty', { status: 'latest-confirmed', reason: '会社のQ2 2026 GAAP連結単独損益表の5期列とQ1 2026公表のQ1 2025比較列を照合し、連続6期を収録。Q3実績の公表予定は10月29日で、基準日時には未公表。' }],
  ['resonac-holdings', { status: 'latest-confirmed', reason: '取引所提出の2026 H1 IFRS連結累計と会社Q1正式資料の同一年・同単位・同利益定義の差分でQ2単独を確定。core営業利益は不使用。' }],
  ['mobileye', { status: 'latest-confirmed', reason: '会社Q1・Q2 2026 GAAP連結単独損益表を照合。Q1の減損による赤字を欠損・調整後利益へ置換しない。' }],
  ['stmicroelectronics', { status: 'latest-confirmed', reason: '会社Q2 2026正式財務諸表のUS GAAP連結損益とQ1比較欄を照合。Q3会社見通しは実績として扱わない。' }],
  ['synopsys', { status: 'latest-confirmed', reason: '会社FY2026 Q3正式連結損益表のUS GAAP単独期を照合。Ansys取得前後の過去連続6期は未確定で、Q3のみ収録。' }],
  ['kioxia', { status: 'latest-confirmed', reason: '公式IRニュースを基準日時に再確認。FY2027 Q2決算の公表予定は2026年10月30日で、未公表値を追加しない。' }],
]);
// A route check is not a numeric-statement check. Preserve v11's checkedAt and
// classification until the revenue, reported operating profit and scope are proved.
const limitedRechecks = new Map([
  ['abb', 'Q2 2026会社発表の連結key figuresを再訪。Q3公表予定日は基準日時当日だが、実績本文は未照合。過去4期の比較可能な事業構成を示す原表が不足。'],
  ['ajinomoto-fine-techno', '味の素の2026年公式発表一覧を再訪。親会社の連結Q1と子会社の合併方針はあるが、対象子会社自身の四半期連結売上・営業利益表に到達できず、親会社値を代用しない。'],
  ['aptiv', '8月4日付Q2 2026会社GAAP連結損益表を再訪。Electrical Distribution Systems分離後の継続事業とAtlas既存年次の同一定義を確定できず、単独Q2も混在させない。'],
  ['ase-technology', 'SEC提出Q2 2026 6-KのNT$ million連結損益表を再訪。基準日時までのQ3正式提出と連結営業利益の有無を提出一覧で確定できず、Q2収録済みを維持。'],
  ['fujikura', '公式提出PDFの取得を試みたが取得経路が失敗。会社IR一覧は確認したがFY2027 Q1原表と比較改訂列を再取得できず、旧判断を最新確認へ昇格しない。'],
  ['hanmi-semiconductor', 'v11で参照したhanmi.co.krは同名のHanmi Pharmaceuticalで対象会社の資料ではないと判明。対象のHanmi SemiconductorについてKRXのIR経路を確認したが連結四半期損益原表は未取得。'],
  ['hexagon', '7月29日付Q2 2026中間報告を再訪。会社概要にあるEBIT1/EBITACはIFRS営業利益と同一と確認できず、添付連結損益原表の該当列を確定するまで収録しない。'],
  ['jcet', '8月21日付CNINFO正式提出の2026半期報告p.6にRMB元のH1売上高を確認。単独Q2は同年度Q1の連結売上高・営業利益と同一改訂系列で差分化する必要があり、Q1原表との照合が未了。'],
  ['johnson-controls', '会社のQuarterly Results一覧を再訪したが、FY2026 Q3のGAAP連結売上高・営業利益の原表および既存年次と継続事業の対応を抽出できず保留。'],
  ['kinsus', '会社の2026月次売上ページはNT$ thousand売上を示すが営業利益を載せない。Financial Reports導線の2026 Q2連結損益原表に未到達で、月次売上から利益を推測しない。'],
  ['lasertec', '会社IRを再訪。2026年6月期の掲載は確認したが、基準日時までの最新四半期の連結売上・営業利益原表と公表日を特定できず保留。'],
  ['legrand', '会社IRの2026上期結果導線を再訪。上期の連結利益と四半期売上を同じ単独四半期利益へ分離するための原表が未確定。adjusted operating profitは代用しない。'],
  ['nikon', '会社IRの8月6日付FY2027 Q1決算PDF導線を再訪。原表のIFRS連結売上・営業利益と既存年次の改訂系列の数値照合が未了。'],
  ['omron', '会社IR入口を再訪。最新期の連結損益原表への固定URL・公表日・営業利益定義を再取得できず、一覧の存在だけで最新扱いしない。'],
  ['rohm', '会社IRの決算説明資料一覧を再訪。FY2027 Q1の正式損益原表と既存日本基準の利益定義・単位の照合が未了。'],
  ['schneider-electric', '会社IRに2026 Q3売上高（10月16日）と上期結果（7月30日）を確認。Q3単独の連結営業利益は同ページに示されず、売上だけで四半期recordを作らない。'],
  ['shinko-electric', '会社の財務結果アーカイブを再訪。確認できた一覧はFY2024までで、基準日時の独立会社としての直近連結四半期損益を確認できず保留。'],
  ['siemens-energy', '会社のプレス一覧は動的Loading表示でFY2026 Q3の原表本文を取得できず、発表の存在だけで売上・IFRS営業利益を採用しない。'],
  ['smc', '会社IRカレンダーでFY2027 Q1が8月7日公表、Q2が11月13日予定と確認。Q1の連結売上・営業利益の正式PDF原表はこの再訪では未抽出。'],
  ['smic', 'HKEX正式提出検索を再訪したが動的検索結果からQ2 2026提出書類の固定URLとIFRS連結売上・営業利益原表を特定できず保留。'],
  ['sumco', '会社IR入口を再訪。2026 Q2の正式連結損益原表、売上・営業利益、改訂系列を固定できず、旧確認未了を維持。'],
  ['unimicron', '会社公式サイトの取得を試みたがHTTP 502。規制当局の対象会社Q2 2026連結損益原表の固定URLも未取得で、二次索引の数値は採用しない。'],
  ['yaskawa', '会社のFinancial Reports一覧を再訪。10月9日付FY2027上期のIFRS連結H1とQ1の同一改訂系列原表を両方照合できず、Q2単独差分を作らない。'],
]);
const directLocators = new Map([
  ['digital-realty', 'Q2 2026 consolidated quarterly statements of operations; five-quarter GAAP comparison table'],
  ['resonac-holdings', '2026 H1 IFRS consolidated results p.1 and p.6; Q1 official results comparison'],
  ['mobileye', 'Q1 and Q2 2026 GAAP condensed consolidated statements of operations'],
  ['stmicroelectronics', 'Q2 2026 consolidated statements of income p.7 and Q1 comparison table'],
  ['synopsys', 'FY2026 Q3 condensed consolidated statements of income, three months ended July 31'],
  ['asmpt', 'FY2025 results p.24/p.36, 2026 Q1 results p.7/p.13, 2026 Q2 results p.12/p.30'],
  ['kioxia', 'Official IR news/calendar for FY2027 Q2 release timing; no numerical result table'],
]);
const targetIds = new Set([...previous.records.filter(row => ['update-needed', 'unverified'].includes(row.latestPeriodAuditStatus)).map(row => row.companyId), 'abb']);
assert.equal(targetIds.size, 29, 'v11 target set changed');
assert.deepEqual(new Set([...limitedRechecks.keys(), ...newlyChecked.keys()].filter(id => targetIds.has(id))), targetIds, 'v12 target route checks incomplete');

assert.equal(previous.records.length, 100);
assert.equal(coverage.length, 100);
const records = previous.records.map(old => {
  const row = coverageById.get(old.companyId);
  assert.ok(row, `${old.companyId}: coverage missing`);
  const additions = added.filter(record => record.companyId === old.companyId).sort((a, b) => a.endDate.localeCompare(b.endDate));
  const latestAdded = additions.at(-1);
  const direct = newlyChecked.get(old.companyId);
  const source = latestAdded && sourceById.get(latestAdded.sourceId);
  const companyHistory = allHistory.filter(record => record.companyId === old.companyId);
  const loadedCurrencyUnits = [...new Set(companyHistory.map(record => `${record.currency}:${record.unit}`))].sort();
  const loadedAccountingBases = [...new Set(companyHistory.map(record => record.accountingBasis))].sort();
  const result = {
    ...old,
    existingQuarterlyCountAtBase: old.loadedQuarterlyCount,
    loadedQuarterlyCount: row.actualQuarterCount,
    loadedLatestPeriod: row.latestPeriodLabel,
    loadedLatestEndDate: row.latestEndDate,
    loadedCoverageStatus: row.coverageStatus,
    reviewProvenance: direct ? 'direct-v12' : limitedRechecks.has(old.companyId) ? 'limited-v12' : 'inherited-v11',
    reviewDepth: direct ? (old.companyId === 'kioxia' ? 'publication-timing' : 'numeric-statement') : limitedRechecks.has(old.companyId) ? 'official-route-only' : 'inherited',
    reviewedAtV12: direct || limitedRechecks.has(old.companyId) ? '2026-10-20' : null,
    v12ReviewNote: limitedRechecks.get(old.companyId) ?? null,
    reviewedOfficialUrl: direct ? (source?.url ?? old.officialLatestSourceUrl) : limitedRechecks.has(old.companyId) ? (old.companyId === 'hanmi-semiconductor' ? old.supportingOfficialUrl : old.officialLatestSourceUrl) : null,
    reviewedPeriod: direct ? (latestAdded?.periodLabel ?? old.officialLatestPeriod) : null,
    reviewedPublicationDate: direct ? (source?.publishedAt ?? old.officialLatestPublishedAt) : null,
    originalTableLocator: directLocators.get(old.companyId) ?? null,
    loadedCurrencyUnits,
    loadedAccountingBases,
    consolidatedScopeVerifiedV12: direct && old.companyId !== 'kioxia' ? true : null,
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
const provenanceCounts = { directV12: records.filter(row => row.reviewProvenance === 'direct-v12').length, limitedV12: records.filter(row => row.reviewProvenance === 'limited-v12').length, inheritedV11: records.filter(row => row.reviewProvenance === 'inherited-v11').length };
assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), 100);
assert.equal(provenanceCounts.directV12 + provenanceCounts.limitedV12 + provenanceCounts.inheritedV11, 100);
const report = { schemaVersion: 'v12', auditAsOfJst, baselineMainSha, counts, provenanceCounts, records };
const json = `${JSON.stringify(report, null, 2)}\n`;
const markdown = [
  '# Financial latest-period audit v12',
  '',
  `- Audit cutoff (JST): ${auditAsOfJst}`,
  `- Baseline main: ${baselineMainSha}`,
  `- v12 numeric/timing checked: ${provenanceCounts.directV12}; official route attempted without full numeric proof: ${provenanceCounts.limitedV12}; v11 review inherited without refreshing checkedAt: ${provenanceCounts.inheritedV11}`,
  '- At the start of this follow-up, direct-v12 was Digital Realty, Resonac Holdings, Mobileye, STMicroelectronics, Synopsys and Kioxia; the other 24 target companies inherited v11. ASMPT was subsequently resolved with six HKFRS quarters; 23 target routes were revisited but remain limited checks.',
  `- Latest confirmed: ${counts['latest-confirmed']} (includes inherited prior checks)` ,
  `- Update needed: ${counts['update-needed']}; non-quarterly disclosure: ${counts['non-quarterly-disclosure']}; unverified: ${counts.unverified}`,
  '- Six-quarter coverage and latest-period audit are separate classifications. Inherited v11 findings are not a fresh v12 confirmation.',
  '',
  '| Company ID | Quarterly at v11 → v12 | Loaded latest | Official latest | Audit status | Review depth | Previous/full checked | v12 route visit | Loaded currency/unit/basis | Original table locator | New periods | Primary URL | Reason / unresolved evidence |',
  '| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...records.map(row => `| ${row.companyId} | ${row.existingQuarterlyCountAtBase} → ${row.loadedQuarterlyCount} | ${row.loadedLatestPeriod ?? '—'} (${row.loadedLatestEndDate ?? '—'}) | ${row.officialLatestPeriod ?? '—'} (${row.officialLatestEndDate ?? '—'}) | ${row.latestPeriodAuditStatus} | ${row.reviewDepth} | ${row.checkedAt ?? '—'} | ${row.reviewedAtV12 ?? '—'} | ${row.loadedCurrencyUnits.join(', ')} / ${row.loadedAccountingBases.join(', ')} | ${row.originalTableLocator ?? '未照合'} | ${row.addedPeriodLabels.join(', ') || '—'} | ${row.reviewedOfficialUrl ? `[official](${row.reviewedOfficialUrl})` : '—'} | ${row.v12ReviewNote ?? row.reason} |`),
  '',
].join('\n');
const jsonPath = join(root, 'docs', 'financial-latest-period-audit-v12.json');
const markdownPath = join(root, 'docs', 'financial-latest-period-audit-v12.md');
if (process.argv.includes('--write')) {
  await Promise.all([writeFile(jsonPath, json), writeFile(markdownPath, markdown)]);
  console.log(`Wrote v12 latest-period audit: ${provenanceCounts.directV12} direct, ${provenanceCounts.limitedV12} limited, ${provenanceCounts.inheritedV11} inherited`);
} else if (process.argv.includes('--check')) {
  assert.equal(await readFile(jsonPath, 'utf8'), json, 'v12 audit JSON is stale');
  assert.equal(await readFile(markdownPath, 'utf8'), markdown, 'v12 audit Markdown is stale');
  console.log(`v12 latest-period audit current: ${provenanceCounts.directV12} direct, ${provenanceCounts.limitedV12} limited, ${provenanceCounts.inheritedV11} inherited`);
} else {
  throw new Error('usage: node scripts/generate-financial-latest-period-audit-v12.mjs --write|--check');
}
