import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const prior = await readJson('docs/financial-latest-period-audit-v12.json');
const coverage = await readJson('src/data/financial-quarterly-coverage-v01.json');
const additions = await readJson('src/data/financial-history-v05-batch16.json');
const sourceManifest = await readJson('src/data/source-registry-manifest.json');
const sources = (await Promise.all(sourceManifest.shards.map(file => readJson('src/data/' + file)))).flat();
const sourceById = new Map(sources.map(source => [source.id, source]));
const historyFiles = (await readdir(join(root, 'src', 'data')))
  .filter(file => file === 'financial-history.json' || /^financial-history-v0[45]-batch\d+\.json$/.test(file));
const allHistory = (await Promise.all(historyFiles.map(file => readJson('src/data/' + file)))).flat();
const coverageById = new Map(coverage.map(row => [row.companyId, row]));
const cutoff = '2026-10-24T13:19:37+09:00';
const baselineMainSha = '4fe0e56f84e308ea47d38ecc37e60835f76ac7b4';

const specificFindings = {
  'ajinomoto-fine-techno': {
    reviewDepthV13: 'specific-blocker', outcome: 'not-adopted',
    officialUrl: 'https://www.aft-website.com/',
    examined: 'Ajinomoto Fine-Techno issuer site and Ajinomoto group FY2026 Q1 consolidated release',
    locator: 'Issuer site has corporate/technology and merger information; group release presents parent consolidated results, not subsidiary quarterly P&L.',
    missingEvidence: 'AFT-issued or regulator-filed consolidated quarterly revenue AND operating profit for the same three-month period. Parent Ajinomoto figures cannot substitute for the subsidiary. Access failure is not treated as proof of nondisclosure.',
  },
  'aptiv': {
    reviewDepthV13: 'numeric-statement', outcome: 'not-adopted',
    officialUrl: 'https://ir.aptiv.com/news/news-details/2026/Aptiv-Reports-Second-Quarter-2026-Financial-Results/default.aspx',
    examined: 'Issuer Q2 2026 release, consolidated US GAAP three-month statement, published 2026-08-04',
    locator: 'Three months ended June 30 2026 current column: net sales USD 3,274 million; operating income USD 367 million. Electrical Distribution Systems separated in April 2026 and prior periods in this release are presented as discontinued.',
    missingEvidence: 'Existing Atlas FY2024/FY2025 annual records include the pre-separation business. A formal comparable restatement/reconciliation for those annual records is needed before connecting the continuing-operations quarter; existing records may not be silently rewritten.',
  },
  'ase-technology': {
    reviewDepthV13: 'publication-timing', outcome: 'no-new-quarter',
    officialUrl: 'https://www.sec.gov/Archives/edgar/data/1122411/000095010326011351/dp250868_6k.htm',
    examined: 'Issuer SEC Form 6-K Q2 2026 consolidated income statement, TWD million',
    locator: 'Q2 2026 current three-month sales and operating income are already present in Atlas history.',
    missingEvidence: 'As of the fixed cutoff, a later Q3 2026 issuer filing with both consolidated revenue and operating income was not confirmed; do not treat a calendar or monthly sales as a new realized quarter.',
  },
  'fujikura': {
    reviewDepthV13: 'publication-timing', outcome: 'no-new-quarter',
    officialUrl: 'https://ssl4.eir-parts.net/doc/5803/tdnet/2866589/00.pdf',
    examined: 'Issuer FY2027 Q1 official filing URL and company IR index https://www.fujikura.co.jp/ir/',
    locator: 'The specified EIR PDF could not be fetched through the current retrieval path; FY2027 Q1 is already in Atlas history.',
    missingEvidence: 'At the fixed cutoff, an issuer-filed FY2027 Q2 actual consolidated quarterly sales/operating-income table and its comparative restatement series were not obtained. Do not infer from forecast or report schedule.',
  },
  'hexagon': {
    reviewDepthV13: 'specific-blocker', outcome: 'not-adopted',
    officialUrl: 'https://hexagon.com/company/newsroom/press-releases/2026/hexagon-interim-report-1-january---30-september-2026',
    examined: 'Issuer Q3 2026 report page (2026-10-23) and attached original PDF https://api.alertir.com/files/press/hexagon/202610228436-1.pdf',
    locator: 'Press table provides Q3 net sales EUR 1,049.1 million and EBITAC/EBIT1, but the consolidated IFRS operating-profit statement PDF returned HTTP 403 to this retrieval route.',
    missingEvidence: 'Unadjusted IFRS consolidated operating profit for the standalone Q3 and a comparable scope after the May 2026 Octave separation. EBITAC/EBIT1 cannot be silently substituted.',
  },
  'kinsus': {
    reviewDepthV13: 'publication-timing', outcome: 'not-adopted',
    officialUrl: 'https://www.kinsus.com.tw/zh-tw/html/committees/index',
    examined: 'Issuer audit committee records approve 2026 Q2 consolidated financial report on 2026-07-31; issuer monthly-revenue page lists sales only.',
    locator: '2026 Q2 report approval date is visible, but no issuer/MOPS fixed PDF with the consolidated statement of comprehensive income was obtained.',
    missingEvidence: 'Kinsus 3189 Q2 2026 filed consolidated P&L, both April–June revenue and operating profit in the same TWD unit, plus verified issuer identity. Monthly sales do not establish operating profit.',
  },
  'legrand': {
    reviewDepthV13: 'specific-blocker', outcome: 'not-adopted',
    officialUrl: 'https://www.legrand.com/en/investors-and-shareholders/regulated-information/2026',
    examined: 'Issuer Q1 results and H1 2026 regulated reports; H1 results published 2026-07-29',
    locator: 'H1 consolidated profit may be reported, while Q1 press figures emphasize sales and adjusted operating margin.',
    missingEvidence: 'Unadjusted IFRS consolidated Q1 operating profit in the same H1 reporting series is required to derive standalone Q2. Half-year profit cannot be halved or replaced by adjusted operating profit.',
  },
  'omron': {
    reviewDepthV13: 'specific-blocker', outcome: 'not-adopted',
    officialUrl: 'https://www.omron.com/global/en/ir/finance/latest_results/',
    examined: 'Issuer FY2027 Q1 IFRS results and prior FY2026 annual US GAAP records',
    locator: 'FY2027 Q1 current consolidated IFRS statement shows JPY-million revenue and operating profit; existing Atlas annual records use US GAAP.',
    missingEvidence: 'A documented issuer comparable IFRS restatement series for the existing annual/quarterly history or an explicitly separated presentation contract. The new IFRS Q1 must not be joined to the existing US GAAP company series.',
  },
  'schneider-electric': {
    reviewDepthV13: 'specific-blocker', outcome: 'not-adopted',
    officialUrl: 'https://www.se.com/ww/en/about-us/investor-relations/financial-results/',
    examined: 'Issuer Q3 2026 sales release (2026-10-16) and H1 2026 report',
    locator: 'Q3 publication supplies consolidated sales; H1 statement supplies period profit, not a Q3 standalone IFRS operating-profit line.',
    missingEvidence: 'Q3 2026 standalone consolidated IFRS operating profit with the same scope; adjusted EBITA or H1/2 cannot substitute.',
  },
  'shinko-electric': {
    reviewDepthV13: 'publication-timing', outcome: 'not-adopted',
    officialUrl: 'https://www.shinko.co.jp/english/ir/library/financial_results/',
    examined: 'Issuer financial-results archive, available listing checked through FY2024',
    locator: 'A current standalone consolidated Q1/Q2 2026 statement with revenue and operating income was not located in the issuer archive.',
    missingEvidence: 'A post-ownership-change issuer or regulator-filed quarterly P&L and an explicit comparable perimeter to the existing Atlas history. Archive absence alone is not proof of permanent nondisclosure.',
  },
  'sumco': {
    reviewDepthV13: 'publication-timing', outcome: 'not-adopted',
    officialUrl: 'https://www.sumcosi.com/english/ir/library/presentations.html',
    examined: 'Issuer 2026 financial-results library; older FY2025 H1 and annual exchange filings',
    locator: 'Dynamic IR listing did not yield a fixed, readable issuer FY2026 Q2 consolidated statement in this retrieval route.',
    missingEvidence: 'FY2026 Q1 and H1 current-series Japanese GAAP sales and operating profit original rows, filing dates and any restatement note; a calendar/forecast cannot determine Q2 standalone.',
  },
  'unimicron': {
    reviewDepthV13: 'specific-blocker', outcome: 'not-adopted',
    officialUrl: 'https://www.unimicron.com/',
    examined: 'Issuer site returned HTTP 502; Taiwan MOPS consolidated-report route sought',
    locator: 'No fixed issuer/MOPS 2026 Q2 original consolidated P&L was retrieved through the attempted official routes.',
    missingEvidence: 'Verified Unimicron issuer code and 2026 Q2 TWD IFRS three-month consolidated revenue and operating income from a filed report; retrieval failure is not evidence of nondisclosure.',
  },
};
const targetIds = new Set(prior.records.filter(row => row.reviewDepth === 'official-route-only').map(row => row.companyId));
assert.equal(targetIds.size, 23, 'v12 official-route-only target count changed');
const expectedIds = 'abb ajinomoto-fine-techno aptiv ase-technology fujikura hanmi-semiconductor hexagon jcet johnson-controls kinsus lasertec legrand nikon omron rohm schneider-electric shinko-electric siemens-energy smc smic sumco unimicron yaskawa'.split(' ');
assert.deepEqual([...targetIds].sort(), expectedIds.sort(), 'v13 target IDs changed');
const adopted = new Set(additions.map(row => row.companyId));
assert.equal(adopted.size + Object.keys(specificFindings).length, 23, 'every target needs adopted data or specific disposition');
for (const id of adopted) assert.ok(targetIds.has(id) && !specificFindings[id], id + ': unexpected/duplicated finding');

const records = prior.records.map(old => {
  if (!targetIds.has(old.companyId)) return { ...old, reviewProvenanceV13: 'inherited-v12', reviewDepthV13: 'inherited', reviewedAtV13: null };
  const row = coverageById.get(old.companyId);
  assert.ok(row, old.companyId + ': coverage missing');
  const added = additions.filter(record => record.companyId === old.companyId).sort((a, b) => a.endDate.localeCompare(b.endDate));
  const history = allHistory.filter(record => record.companyId === old.companyId);
  const evidence = added.map(record => {
    const source = sourceById.get(record.sourceId);
    assert.ok(source?.url, record.id + ': source missing');
    return { recordId: record.id, periodLabel: record.periodLabel, startDate: record.startDate, endDate: record.endDate, currency: record.currency, unit: record.unit, accountingBasis: record.accountingBasis, revenue: record.metrics.revenue.value, operatingProfit: record.metrics.operatingProfit.value, operatingMargin: record.metrics.operatingMargin.value, revenueBasis: record.metrics.revenue.basis, operatingProfitBasis: record.metrics.operatingProfit.basis, sourceId: record.sourceId, sourceUrl: source.url, sourceTitle: source.title, publishedAt: source.publishedAt };
  });
  const finding = specificFindings[old.companyId];
  const latestNew = evidence.at(-1);
  return {
    ...old,
    quarterlyCountAtV12: row.actualQuarterCount - added.length,
    loadedQuarterlyCount: row.actualQuarterCount,
    loadedLatestPeriod: row.latestPeriodLabel,
    loadedLatestEndDate: row.latestEndDate,
    loadedCoverageStatus: row.coverageStatus,
    loadedCurrencyUnits: [...new Set(history.map(r => r.currency + ':' + r.unit))].sort(),
    loadedAccountingBases: [...new Set(history.map(r => r.accountingBasis))].sort(),
    reviewProvenanceV13: 'direct-v13',
    reviewDepthV13: finding?.reviewDepthV13 ?? 'numeric-statement',
    reviewedAtV13: '2026-10-24',
    v13Outcome: finding?.outcome ?? 'adopted',
    v13ReviewedOfficialUrl: finding?.officialUrl ?? latestNew?.sourceUrl,
    v13ExaminedMaterial: finding?.examined ?? 'Issuer/regulator original consolidated quarterly statement(s); source titles, dates, columns and arithmetic attached to each added record below.',
    v13OriginalTableLocator: finding?.locator ?? 'See each added record revenueBasis and operatingProfitBasis for original page/table/current or comparative column and exact arithmetic.',
    v13MissingEvidence: finding?.missingEvidence ?? null,
    addedV13Periods: evidence,
    v13LatestCapturedIsOfficialLatest: null,
    v13LatestCaveat: 'v13 cutoff is fixed; a full post-filing issuer-calendar sweep for this company is not asserted by the record addition alone.',
  };
});
assert.equal(records.length, 100);
assert.deepEqual(new Set(records.map(r => r.companyId)), new Set(coverage.map(r => r.companyId)));
const counts = Object.fromEntries(['numeric-statement','publication-timing','specific-blocker','inherited'].map(k => [k, records.filter(r => r.reviewDepthV13 === k).length]));
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),100);
const result = { schemaVersion: 'v13', auditAsOfJst: cutoff, baselineMainSha, previousAuditAsOfJst: prior.auditAsOfJst, targetCount: 23, targetIds: [...targetIds].sort(), addedRecordCount: additions.length, adoptedCompanyCount: adopted.size, counts, caveat: 'v13 covers the 23 v12 official-route-only targets. The other 77 inherit v12 status and dates. Adding a verified quarter does not alone prove publication recency or all-100 latest-period freshness.', records };
const lines = [
  '# Financial latest-period audit v13',
  '',
  '- Fixed cutoff (JST): ' + cutoff,
  '- Baseline main: ' + baselineMainSha,
  '- Previous cutoff: ' + prior.auditAsOfJst,
  '- Target set: 23 v12 official-route-only companies; other 77 inherit their prior judgments/dates.',
  '- Newly adopted: ' + adopted.size + ' companies / ' + additions.length + ' standalone quarter records.',
  '- Numeric original statements: ' + counts['numeric-statement'] + '; publication timing or route only: ' + counts['publication-timing'] + '; specific retrieval/comparability blockers: ' + counts['specific-blocker'] + '; inherited: ' + counts.inherited + '.',
  '- An added period is not automatically a verified latest published period. v12 latest-status counts remain historical unless the new company-specific publication sweep is proved.',
  '',
  '## Target-by-target evidence and gaps',
  '',
  '| Company | v12 → v13 quarterly | Loaded latest | v13 depth/outcome | Official material / locator | New periods | Missing evidence or caveat |',
  '| --- | ---: | --- | --- | --- | --- | --- |',
  ...records.filter(r => targetIds.has(r.companyId)).map(r => '| ' + r.companyId + ' | ' + (r.loadedQuarterlyCount - r.addedV13Periods.length) + ' → ' + r.loadedQuarterlyCount + ' | ' + (r.loadedLatestPeriod ?? '—') + ' (' + (r.loadedLatestEndDate ?? '—') + ') | ' + r.reviewDepthV13 + ' / ' + r.v13Outcome + ' | [official](' + r.v13ReviewedOfficialUrl + ') ' + r.v13ExaminedMaterial + ' — ' + r.v13OriginalTableLocator + ' | ' + (r.addedV13Periods.map(x=>x.periodLabel).join(', ') || '—') + ' | ' + (r.v13MissingEvidence ?? r.v13LatestCaveat) + ' |'),
  '',
  '## Added-record original rows and arithmetic',
  '',
  ...records.filter(r => r.addedV13Periods?.length).flatMap(r => [
    '### ' + r.companyId,
    '',
    ...r.addedV13Periods.flatMap(e => [
      '- ' + e.recordId + ' / ' + e.periodLabel + ' (' + e.startDate + '–' + e.endDate + '), ' + e.accountingBasis + ', ' + e.currency + ' ' + e.unit + ': revenue ' + e.revenue + ', operating profit ' + e.operatingProfit + ', margin ' + e.operatingMargin + '%.',
      '  - [Official source](' + e.sourceUrl + '): ' + e.sourceTitle + ' (' + e.publishedAt + ').',
      '  - Revenue: ' + e.revenueBasis,
      '  - Operating profit: ' + e.operatingProfitBasis,
    ]),
    '',
  ]),
  '## Other 77 companies',
  '',
  'The other 77 rows in the JSON inherit v12 audit dates, publication status and rationale without a v13 refresh. Six-quarter coverage and latest-publication status are distinct.',
  '',
];
const json = JSON.stringify(result,null,2) + '\n';
const md = lines.join('\n');
const jsonPath = join(root,'docs','financial-latest-period-audit-v13.json');
const mdPath = join(root,'docs','financial-latest-period-audit-v13.md');
if (process.argv.includes('--write')) {
  await Promise.all([writeFile(jsonPath,json),writeFile(mdPath,md)]);
  console.log('Wrote v13 audit: '+additions.length+' records / '+adopted.size+' companies; target depth '+JSON.stringify(counts));
} else if (process.argv.includes('--check')) {
  assert.equal(await readFile(jsonPath,'utf8'),json,'v13 audit JSON stale');
  assert.equal(await readFile(mdPath,'utf8'),md,'v13 audit Markdown stale');
  console.log('v13 audit current: '+JSON.stringify(counts));
} else throw new Error('usage: node scripts/generate-financial-latest-period-audit-v13.mjs --write|--check');
