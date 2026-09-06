import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { buildSearchText, matchesSearchTokens, normalizeSearchText, searchTokens } from '../src/lib/search-normalization.ts';
import { createSearchComboboxController } from '../src/scripts/search-combobox-controller.ts';

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
