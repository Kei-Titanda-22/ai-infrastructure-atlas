import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { buildSearchText, matchesSearchTokens, normalizeSearchText, searchTokens } from '../src/lib/search-normalization.ts';
import { createSearchComboboxController } from '../src/scripts/search-combobox-controller.ts';
import { buildPagefindCompanyAliasMap, createPagefindQueryPlan, createPagefindSearchAdapter } from '../src/lib/pagefind-search-adapter.ts';

const fixture = JSON.parse(await readFile(new URL('./fixtures/search-ux-v01.json', import.meta.url), 'utf8'));
const companiesDirectory = new URL('../src/data/companies/', import.meta.url);
const companies = await Promise.all((await readdir(companiesDirectory)).filter(name => name.endsWith('.json')).sort().map(async name => JSON.parse(await readFile(new URL(`../src/data/companies/${name}`, import.meta.url), 'utf8'))));
const facilities = JSON.parse(await readFile(new URL('../src/data/facilities.json', import.meta.url), 'utf8'));
const companyDirectorySource = await readFile(new URL('../src/pages/companies/index.astro', import.meta.url), 'utf8');
const companyDetailSource = await readFile(new URL('../src/pages/companies/[id].astro', import.meta.url), 'utf8');
const companyDirectoryStyles = await readFile(new URL('../src/styles/global-visual-v01.css', import.meta.url), 'utf8');

assert.equal(companies.length, 100, 'the Company Search fixture covers all one hundred Companies');
for (const testCase of fixture.normalization) assert.equal(normalizeSearchText(testCase.input), testCase.expected, `normalizes ${testCase.input}`);
for (const emptyQuery of fixture.emptyQueries) assert.deepEqual(searchTokens(emptyQuery), [], 'empty input has no candidate tokens');
assert.deepEqual(searchTokens(fixture.symbolOnlyQuery), [normalizeSearchText(fixture.symbolOnlyQuery)], 'symbols are preserved rather than discarded');

const identities = companies.map(company => ({
  id: company.id,
  searchText: buildSearchText([company.id, company.name, company.japaneseName, company.reading, company.ticker]),
  values: [company.id, company.name, company.japaneseName, company.reading, company.ticker].filter(Boolean),
}));
const identityOwners = new Map();
for (const company of identities) {
  for (const value of company.values) {
    const normalized = normalizeSearchText(value);
    if (!normalized) continue;
    const owners = identityOwners.get(normalized) ?? new Set();
    owners.add(company.id);
    identityOwners.set(normalized, owners);
  }
}
const collisions = [...identityOwners.values()].filter(owners => owners.size > 1);
assert.equal(collisions.length, fixture.expectedIdentityCollisionCount, 'normalized identity values do not collide across Companies');
for (const testCase of fixture.companyQueries) {
  const company = identities.find(candidate => candidate.id === testCase.companyId);
  assert.ok(company && matchesSearchTokens(company.searchText, testCase.query), `${testCase.query} resolves ${testCase.companyId}`);
}
assert.equal(identities.some(company => matchesSearchTokens(company.searchText, fixture.unmatchedQuery)), false, 'unmatched input has no Company result');

const directory = fixture.companyDirectory;
assert.equal(companies.length, directory.expectedCompanyCount, 'the Company directory still renders all one hundred Companies');
assert.match(companyDirectorySource, new RegExp(`<table class="data-table ${directory.tableClass}" id="${directory.tableId}">`), 'the Company directory has the fixture-defined semantic table');
const headerMatch = companyDirectorySource.match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/)?.[1] ?? '';
assert.deepEqual([...headerMatch.matchAll(/<th[^>]*>([^<]+)<\/th>/g)].map(match => match[1]), directory.headers, 'the Company directory retains the exact five scan-friendly headers');
assert.doesNotMatch(headerMatch, /主要拠点|更新日|最終確認日/, 'the Company directory headers omit facilities and review metadata');
assert.match(companyDirectorySource, /<tbody id="company-tbody">/, 'the Company directory keeps one table body for all Companies');
assert.match(companyDirectorySource, /<tr data-company-row/, 'each Company directory entry is one semantic table row');
assert.doesNotMatch(companyDirectorySource, /company-directory-grid|company-directory-card|company-directory-facts|company-directory-tags/, 'the Company directory has no card-grid contract');
assert.match(companyDirectoryStyles, /\.global-visual-companies \.company-index-table \{[\s\S]*?min-width: 0 !important;[\s\S]*?table-layout: fixed !important;/, 'the Company table overrides legacy fixed horizontal minimum widths');
assert.match(companyDirectoryStyles, /\.global-visual-companies \.company-index-table tbody,[\s\S]*?\.global-visual-companies \.company-index-table td \{[\s\S]*?display: block;/, 'mobile restacks the same semantic table rows');
const mobileFilterVisibility = directory.mobileFilterVisibility;
assert.match(companyDirectoryStyles, new RegExp(`${mobileFilterVisibility.rowSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{\\s*display:\\s*${mobileFilterVisibility.display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;`), 'mobile rows keep the hidden attribute as a forced display-none contract');
const mobileStackRuleIndex = companyDirectoryStyles.indexOf('.global-visual-companies .company-index-table tbody,');
const hiddenRowRuleIndex = companyDirectoryStyles.indexOf(mobileFilterVisibility.rowSelector);
assert.ok(hiddenRowRuleIndex > mobileStackRuleIndex, 'the mobile hidden-row rule follows the mobile display-block rule');
assert.match(companyDirectorySource, /row\.hidden = !hit;/, 'search and every existing filter continue to use the shared hidden-row contract');
for (const filterInput of mobileFilterVisibility.filterInputs) {
  const selector = filterInput === 'search' ? 'input' : filterInput;
  assert.match(companyDirectorySource, new RegExp(`${selector}\\?\\.addEventListener\\('(input|change)', apply\\)`), `${filterInput} continues to apply the shared hidden-row filter contract`);
}
assert.match(companyDirectoryStyles, /\.global-visual-companies \.company-index-table td\.company-col \{[\s\S]*?width: 100% !important;/, 'mobile gives the Company cell its full row width instead of retaining the desktop column ratio');
assert.match(companyDirectorySource, /data-sort-updated=\{d\.lastReviewed\}/, 'updated-date sort remains a non-visible canonical sort datum');
assert.match(companyDirectorySource, /new Set\(\['name','country','updated'\]\)/, 'all existing sort keys, including updated, remain URL-compatible');
assert.match(companyDirectorySource, /withBase\(`companies\/\$\{company\.id\}\//, 'each table row retains its canonical Company detail URL');
const rowTemplate = companyDirectorySource.match(/<tr data-company-row[\s\S]*?<\/tr>/)?.[0] ?? '';
assert.equal((companyDirectorySource.match(/\{companies\.map\(company/g) ?? []).length, 1, 'desktop and mobile use one Company-row rendering path');
for (const header of directory.headers) assert.match(rowTemplate, new RegExp(`data-label="${header}"`), `${header} is labelled when the same table row stacks on mobile`);
assert.doesNotMatch(rowTemplate, /d\.aiRole|company-index-sites|company-directory-tags/, 'table rows omit the card-only AI role, facilities, and tag presentation');
for (const excluded of directory.excludedVisibleLabels) {
  assert.doesNotMatch(rowTemplate, new RegExp(excluded), `${excluded} is not rendered inside a Company table row or its accessible descendants`);
}
assert.match(companyDetailSource, /<dt>最終確認日<\/dt>/, 'Company detail pages retain the last-reviewed display');
assert.match(companyDetailSource, /<th>拠点<\/th>/, 'Company detail pages retain facilities');

const facilitiesByCompany = new Map();
for (const facility of facilities) {
  const list = facilitiesByCompany.get(facility.companyId) ?? [];
  list.push(facility);
  facilitiesByCompany.set(facility.companyId, list);
}
const directoryRows = companies.map(company => ({
  id: company.id,
  country: company.country,
  layer: company.primaryLayer,
  tags: company.tags,
  sortName: company.japaneseName || company.name,
  sortCountry: company.country,
  sortUpdated: company.lastReviewed,
  searchText: buildSearchText([
    company.id, company.name, company.japaneseName, company.reading, company.ticker ?? '', company.country,
    company.primaryLayer, company.summary, company.aiRole, ...company.tags, ...company.products,
    ...(facilitiesByCompany.get(company.id) ?? []).flatMap(site => [site.name, site.city, site.region, site.country]),
  ]),
}));
for (const testCase of directory.facilitySearchQueries) {
  const row = directoryRows.find(candidate => candidate.id === testCase.companyId);
  assert.ok(row && matchesSearchTokens(row.searchText, testCase.query), `${testCase.kind} query ${testCase.query} remains searchable without being card content`);
}
for (const filter of directory.filters) {
  const count = directoryRows.filter(row => (
    filter.kind === 'country' ? row.country === filter.value
      : filter.kind === 'layer' ? row.layer === filter.value
        : row.tags.includes(filter.value)
  )).length;
  assert.equal(count, filter.expectedCount, `${filter.kind} filter keeps its expected Company count`);
}
for (const sortKey of directory.sortKeys) {
  const field = `sort${sortKey.charAt(0).toUpperCase()}${sortKey.slice(1)}`;
  const ascending = directoryRows.slice().sort((a, b) => a[field].localeCompare(b[field], 'ja', { numeric: true }));
  assert.equal(ascending.length, directory.expectedCompanyCount, `${sortKey} still orders every Company table row`);
  for (let index = 1; index < ascending.length; index++) {
    assert.ok(ascending[index - 1][field].localeCompare(ascending[index][field], 'ja', { numeric: true }) <= 0, `${sortKey} ascending order remains deterministic`);
  }
}
assert.match(companyDirectorySource, /sortButtons\.forEach\(button => button\.addEventListener\('click',[\s\S]*?sortRows\(\); updateUrl\(\); \}\)\);/, `${mobileFilterVisibility.sortKey} sorting only reorders the existing rows without applying filters`);
assert.match(companyDirectorySource, /history\.replaceState/, 'filter and sort query parameters still round-trip through the existing URL path');

const aliases = buildPagefindCompanyAliasMap(companies.map(company => ({
  href: `/companies/${company.id}/`,
  values: [company.name, company.japaneseName, company.reading, company.ticker, company.id],
})));
for (const testCase of fixture.pagefind.primaryQueries) assert.deepEqual(createPagefindQueryPlan(testCase.input), { primary: testCase.expected, supplemental: testCase.supplemental }, `plans Pagefind query ${testCase.input}`);
assert.equal(Object.keys(aliases).length, identityOwners.size, 'the one-hundred Company alias map has no normalized collisions');

const pagefindCalls = [];
const pagefindResponses = new Map([
  ['ふじくら', [{ url: '/companies/other/', meta: { title: 'Other' } }, { url: '/companies/fujikura/', meta: { title: 'Fujikura' } }]],
  ['フジクラ', [{ url: '/companies/fujikura/', meta: { title: 'Fujikura duplicate' } }]],
  ['amd', [{ url: '/companies/amd/', meta: { title: 'AMD' } }]],
]);
const adapter = createPagefindSearchAdapter({
  aliases,
  search: async query => {
    pagefindCalls.push(query);
    if (query === 'フジクラ') throw new Error('supplemental unavailable');
    return { results: (pagefindResponses.get(query) || []).map(item => ({ data: async () => item })) };
  },
});
const kanaRun = await adapter.run('ふじくら');
assert.deepEqual(pagefindCalls, ['ふじくら', 'フジクラ'], 'runs primary then one distinct kana supplemental query');
assert.equal(kanaRun.results[0]?.url, '/companies/fujikura/', 'an exact Company alias pins an existing Company Page result only');
assert.equal(kanaRun.results.length, 2, 'supplemental failure retains the primary result set');
const duplicateRun = await adapter.run('ふじくら');
assert.equal(duplicateRun.deduped, true, 'compositionend with the same value does not search twice');
assert.equal(pagefindCalls.length, 2, 'duplicate input leaves Pagefind calls unchanged');
const mergeAdapter = createPagefindSearchAdapter({
  aliases,
  search: async query => ({ results: (query === 'かな'
    ? [{ url: '/companies/other/', meta: { title: 'Primary first' } }, { url: '/companies/fujikura/', meta: { title: 'Primary second' } }]
    : [{ url: '/companies/fujikura/', meta: { title: 'Supplemental duplicate' } }, { url: '/companies/amd/', meta: { title: 'Supplemental only' } }]
  ).map(item => ({ data: async () => item })) }),
});
const mergeRun = await mergeAdapter.run('かな');
assert.deepEqual(mergeRun.results.map(item => item.url), ['/companies/other/', '/companies/fujikura/', '/companies/amd/'], 'primary order is retained, supplemental results follow, and URLs are unique');
const prefixAdapter = createPagefindSearchAdapter({
  aliases,
  search: async () => ({ results: [{ data: async () => ({ url: '/companies/other/' }) }, { data: async () => ({ url: '/companies/fujikura/' }) }] }),
});
assert.equal((await prefixAdapter.run('ふじ')).results[0]?.url, '/companies/other/', 'a partial alias does not rerank Pagefind results');
const amdRun = await adapter.run('ＡＭＤ');
assert.equal(amdRun.results[0]?.url, '/companies/amd/', 'non-kana exact alias uses one primary result');
assert.deepEqual(pagefindCalls.slice(-1), ['amd'], 'non-kana query runs once');
const emptyRun = await adapter.run('');
assert.equal(emptyRun.empty, true, 'empty query resets without calling Pagefind');
assert.equal(pagefindCalls.length, 3, 'empty query produces zero Pagefind calls');

const failingAdapter = createPagefindSearchAdapter({ aliases, search: async () => { throw new Error('Pagefind unavailable'); } });
assert.equal((await failingAdapter.run('壊れた検索')).error, true, 'primary failure is returned for an error status without an unhandled exception');
let resolveStale;
const staleAdapter = createPagefindSearchAdapter({
  aliases,
  search: query => query === 'first'
    ? new Promise(resolve => { resolveStale = resolve; })
    : Promise.resolve({ results: [{ data: async () => ({ url: '/companies/amd/' }) }] }),
});
const staleRun = staleAdapter.run('first');
const currentRun = await staleAdapter.run('second');
resolveStale({ results: [{ data: async () => ({ url: '/companies/fujikura/' }) }] });
const staleResponse = await staleRun;
assert.equal(staleAdapter.isCurrent(staleResponse.revision), false, 'a stale response cannot replace the current query');
assert.equal(currentRun.results[0]?.url, '/companies/amd/', 'the current query result remains available');

class FakeElement {
  constructor() { this.attributes = new Map(); this.children = []; this.listeners = new Map(); this.hidden = false; this.dataset = {}; this.value = ''; this.id = ''; this.textContent = ''; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  addEventListener(type, handler) { const listeners = this.listeners.get(type) ?? []; listeners.push(handler); this.listeners.set(type, listeners); }
  dispatch(type, event = {}) { for (const handler of this.listeners.get(type) ?? []) handler({ target: this, preventDefault() { this.defaultPrevented = true; }, ...event }); }
}

const input = new FakeElement();
const listbox = new FakeElement();
listbox.id = 'fixture-listbox';
const status = new FakeElement();
const selected = [];
const options = [{ id: 'fujikura' }, { id: 'kioxia' }];
const controller = createSearchComboboxController({
  input,
  listbox,
  status,
  optionIdPrefix: 'fixture-option',
  getMatches: query => query ? options : [],
  renderOption: option => { const element = new FakeElement(); element.dataset.searchOptionId = option.id; return element; },
  select: option => selected.push(option.id),
});
input.value = 'ふじくら';
input.dispatch('compositionstart');
input.dispatch('input', { isComposing: true });
assert.equal(listbox.hidden, false, 'composition input updates candidates');
assert.equal(status.textContent, '2件の候補があります。', 'composition input announces candidate count');
input.dispatch('keydown', { key: 'Enter', isComposing: true, keyCode: 229 });
assert.deepEqual(selected, [], 'IME Enter does not select or navigate');
input.dispatch('compositionend');
input.dispatch('keydown', { key: 'ArrowDown', keyCode: 40 });
assert.equal(input.getAttribute('aria-activedescendant'), 'fixture-option-kioxia', 'ArrowDown advances the active option');
input.dispatch('keydown', { key: 'Enter', keyCode: 13 });
assert.deepEqual(selected, ['kioxia'], 'committed Enter selects exactly once');
input.value = 'ふじくら';
controller.refresh(true);
input.dispatch('keydown', { key: 'Escape', keyCode: 27 });
assert.equal(listbox.hidden, true, 'Escape closes candidates');
controller.refresh(true);
input.dispatch('keydown', { key: 'Tab', keyCode: 9 });
assert.equal(listbox.hidden, true, 'Tab closes candidates without selecting');

if (process.argv.includes('--dist')) {
  const companyDirectoryHtml = await readFile(new URL('../dist/companies/index.html', import.meta.url), 'utf8');
  const visibleText = companyDirectoryHtml
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ');
  assert.match(companyDirectoryHtml, new RegExp(`<table class="data-table ${directory.tableClass}" id="${directory.tableId}">`), 'built Company directory contains the semantic table');
  assert.equal((companyDirectoryHtml.match(/data-company-row/g) ?? []).length, directory.expectedCompanyCount, 'built Company directory contains all one hundred table rows');
  assert.doesNotMatch(companyDirectoryHtml, /company-directory-grid|company-directory-card|company-directory-facts|company-directory-tags/, 'built Company directory contains no card-grid presentation');
  for (const excluded of directory.excludedVisibleLabels) assert.doesNotMatch(visibleText, new RegExp(excluded), `${excluded} is absent from built Company directory visible text`);
  for (const testCase of directory.facilitySearchQueries) assert.doesNotMatch(visibleText, new RegExp(testCase.query), `${testCase.kind} search token is not restored as visible card content`);
}

console.log('PASS: search normalization and IME combobox contracts');
