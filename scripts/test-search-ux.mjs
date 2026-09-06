import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { buildSearchText, matchesSearchTokens, normalizeSearchText, searchTokens } from '../src/lib/search-normalization.ts';
import { createSearchComboboxController } from '../src/scripts/search-combobox-controller.ts';
import { buildPagefindCompanyAliasMap, createPagefindQueryPlan, createPagefindSearchAdapter } from '../src/lib/pagefind-search-adapter.ts';

const fixture = JSON.parse(await readFile(new URL('./fixtures/search-ux-v01.json', import.meta.url), 'utf8'));
const companiesDirectory = new URL('../src/data/companies/', import.meta.url);
const companies = await Promise.all((await readdir(companiesDirectory)).filter(name => name.endsWith('.json')).sort().map(async name => JSON.parse(await readFile(new URL(`../src/data/companies/${name}`, import.meta.url), 'utf8'))));

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

console.log('PASS: search normalization and IME combobox contracts');
