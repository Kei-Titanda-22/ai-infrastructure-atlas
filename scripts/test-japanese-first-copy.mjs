import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  companyDisplayNameParts,
  compileJapaneseFirstPresentationEntries,
  japaneseFirstCanonicalDigest,
  japaneseFirstFixedUiLabels,
  resolveJapaneseFirstClaimPresentation,
} from '../src/lib/japanese-first-presentation.ts';
import { productInfo } from '../src/lib/display.ts';
import { compareGenericTermTranslations } from '../src/lib/company-compare-display.ts';
import { displayTerminology } from '../src/lib/display-terminology.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/japanese-first-copy-v01.json', import.meta.url), 'utf8'));
assert.equal(
  japaneseFirstCanonicalDigest('abc'),
  '6cc43f858fbb763301637b5af970e2a46b46f461f27e5a0f41e009c59b827b25',
  'canonical digests use standard SHA-256 of stable serialization',
);
assert.match(
  readFileSync(new URL('../src/lib/japanese-first-presentation.ts', import.meta.url), 'utf8'),
  /import\.meta\.glob\([^)]*japanese-first-copy-\*\.json/,
  'future presentation overlays load from the deterministic data glob',
);
assert.deepEqual(Object.fromEntries(Object.entries(fixture.fixedUi).map(([key]) => [key, japaneseFirstFixedUiLabels[key]])), fixture.fixedUi, 'fixed UI labels are exact');
assert.notEqual(japaneseFirstFixedUiLabels['Value Chain'], '供給網上の位置', 'Value Chain is not conflated with supply chain');
for (const [canonicalValue, label] of Object.entries(fixture.structuredTerms)) {
  assert.equal(productInfo(canonicalValue).label, label, `${canonicalValue}: structured exact mapping`);
}
assert.equal(compareGenericTermTranslations['Value Chain'], fixture.fixedUi['Value Chain'], 'Compare uses the same Value Chain presentation');
for (const [term, description] of Object.entries(fixture.terminology)) {
  assert.equal(displayTerminology.find(item => item.term === term)?.description, description, `${term}: first-use explanation is exact`);
}

const canonical = fixture.canonicalClaim;
const translated = { ...fixture.translatedClaim, canonicalDigest: japaneseFirstCanonicalDigest(canonical) };
const entries = compileJapaneseFirstPresentationEntries([translated]);
assert.deepEqual(resolveJapaneseFirstClaimPresentation(canonical, canonical, entries), { title: translated.title, statement: translated.statement, decision: 'translate' });
assert.throws(() => resolveJapaneseFirstClaimPresentation({ ...canonical, statement: `${canonical.statement}!` }, canonical, entries), /digest is stale/);
assert.throws(() => compileJapaneseFirstPresentationEntries([translated, translated]), /duplicate key/);
assert.throws(() => compileJapaneseFirstPresentationEntries([{ ...translated, entityType: 'unknown' }]), /entity type is unsupported/);
assert.throws(() => compileJapaneseFirstPresentationEntries([{ ...translated, title: '' }]), /requires title and statement/);
assert.throws(() => compileJapaneseFirstPresentationEntries([{ ...translated, decision: 'preserve', title: undefined, statement: undefined }]), /preserve decision requires reason/);
assert.equal(canonical.title, fixture.canonicalClaim.title, 'canonical object is not mutated');

const partsById = new Map(fixture.names.map(identity => [identity.id, companyDisplayNameParts(identity)]));
assert.deepEqual(partsById.get('applied-materials'), {
  accessibleName: 'Applied Materials（アプライド・マテリアルズ）',
  primaryName: 'Applied Materials',
  secondaryName: '（アプライド・マテリアルズ）',
  visualName: 'Applied Materials（アプライド・マテリアルズ）',
});
assert.equal(partsById.get('tokyo-electron').secondaryName, null, 'Japanese-primary names stay single-line');
assert.equal(partsById.get('sumco').secondaryName, null, 'matching names are not duplicated');
for (const [id, parts] of partsById) {
  assert.ok(parts.accessibleName && parts.primaryName, `${id}: accessible company identity is present`);
}
console.log('Japanese-first presentation foundation tests OK: fixed UI / digest reject / company identity contract');
