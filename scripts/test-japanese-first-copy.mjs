import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import {
  companyDisplayNameParts,
  compileJapaneseFirstPresentationEntries,
  japaneseFirstCanonicalDigest,
  japaneseFirstFixedUiLabels,
  resolveJapaneseFirstClaimPresentation,
  resolveJapaneseFirstPresentation,
} from '../src/lib/japanese-first-presentation.ts';
import {
  getCompanyCompareProductPortfolioSummaries,
  resolveCompanyCompareProductPortfolioPresentation,
  resolveCompanyCompareProductPortfolioSummary,
} from '../src/lib/company-compare-product-portfolios.ts';
import {
  firstBatchCompanies,
  firstBatchProductEntries,
  remainingBatch1Companies,
  remainingBatch1ProductEntries,
  remainingBatch2Companies,
  remainingBatch2ProductEntries,
  remainingBatch3Companies,
  remainingBatch3ProductEntries,
  remainingBatch4Companies,
  remainingBatch4ProductEntries,
} from '../src/lib/company-compare-first-batch.ts';
import {
  compareGenericTermTranslations,
  compareProductDisplayDescriptions,
  compareProductDisplayNameOverrides,
} from '../src/lib/company-compare-display.ts';
import { productInfo } from '../src/lib/display.ts';
import { displayTerminology } from '../src/lib/display-terminology.ts';

const readJson = relativePath => JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fixturePath = new URL('./fixtures/japanese-first-copy-v01.json', import.meta.url);
const fixtureSource = readFileSync(fixturePath, 'utf8');
const fixture = JSON.parse(fixtureSource);
const overlayDataFiles = readdirSync(new URL('../src/data/', import.meta.url))
  .filter(file => /^japanese-first-copy-batch\d+-v\d+\.json$/.test(file))
  .sort();
const overlayPayloads = overlayDataFiles.map(file => readJson(`../src/data/${file}`));
const batch1 = overlayPayloads.find(payload => payload.version === 'japanese-first-copy-batch1-v01');
const batch2 = overlayPayloads.find(payload => payload.version === 'japanese-first-copy-batch2-v01');
const manifest = readJson('../src/data/japanese-first-copy-manifest-v01.json');

assert.ok(batch1, 'Batch 1 presentation data is registered by the generic file contract');
assert.ok(batch2, 'Batch 2 presentation data is registered by the existing generic file contract');
assert.deepEqual(
  overlayDataFiles,
  ['japanese-first-copy-batch1-v01.json', 'japanese-first-copy-batch2-v01.json'],
  'the generic loader discovers the two approved presentation overlays without source changes',
);

const fixedBatch1CompanyIds = [
  'kla', 'johnson-controls', 'tower-semiconductor', 'corning', 'smic', 'te-connectivity', 'credo', 'digital-realty',
  'lumentum', 'asmpt', 'marvell', 'sumitomo-electric', 'furukawa-electric', 'eaton', 'besi', 'nvent', 'fujikura',
  'schneider-electric', 'equinix', 'vertiv', 'intel', 'screen-holdings', 'cisco', 'arista', 'trane-technologies',
  'coherent', 'kokusai-electric', 'ge-vernova', 'legrand', 'samsung-electronics', 'fanuc', 'siemens-energy',
  'ciena', 'qualcomm', 'carrier', 'rohm', 'amd', 'micron', 'amphenol', 'mediatek', 'renesas', 'tesla', 'disco',
  'monolithic-power', 'onsemi', 'lam-research', 'stmicroelectronics', 'asml', 'sk-hynix', 'texas-instruments',
];
const fixedBatch2CandidateCounts = {
  abb: 1, advantest: 13, 'air-liquide': 3, 'ajinomoto-fine-techno': 0, amkor: 10,
  'analog-devices': 6, 'applied-materials': 15, aptiv: 6, arm: 2, 'ase-technology': 12,
  'asm-international': 15, bosch: 12, broadcom: 17, cadence: 6, canon: 8, denso: 7,
  entegris: 7, globalfoundries: 8, globalwafers: 11, 'hanmi-semiconductor': 6, hexagon: 13,
  ibiden: 9, infineon: 11, jcet: 16, keyence: 8, kinsus: 10, kioxia: 8, lasertec: 13,
  linde: 7, 'mitsubishi-electric': 17, mobileye: 11, 'nan-ya-pcb': 8, nikon: 12, nvidia: 11,
  nxp: 16, omron: 16, 'resonac-holdings': 13, sandisk: 17, seagate: 13,
  'shin-etsu-chemical': 8, 'shinko-electric': 12, smc: 13, sumco: 13, synopsys: 10,
  'tokyo-electron': 17, tsmc: 16, umc: 13, unimicron: 8, 'western-digital': 11, yaskawa: 15,
};
const fixedBatch2CompanyIds = Object.keys(fixedBatch2CandidateCounts);

assert.equal(
  japaneseFirstCanonicalDigest('abc'),
  '6cc43f858fbb763301637b5af970e2a46b46f461f27e5a0f41e009c59b827b25',
  'canonical digests use standard SHA-256 of stable serialization',
);

const presentationSource = readFileSync(new URL('../src/lib/japanese-first-presentation.ts', import.meta.url), 'utf8');
assert.match(
  presentationSource,
  /import\.meta\.glob\('\.\.\/data\/japanese-first-copy-batch\*-v\*\.json'/,
  'future presentation overlays load from the literal deterministic data glob',
);
assert.match(presentationSource, /import\.meta\.env\?\.SSR === true/, 'the runtime overlay registry is created in Vite SSR builds');
assert.match(presentationSource, /Object\.entries\(registeredModules\)[\s\S]*?\.sort\(\(\[left\], \[right\]\) => left\.localeCompare\(right\)\)/, 'overlay modules are sorted before compilation');
assert.doesNotMatch(presentationSource, /import\.meta\.glob\s*\?/, 'the broken runtime feature-test no longer disables the Vite glob');
assert.doesNotMatch(presentationSource, /japanese-first-copy-batch1-v01\.json/, 'the runtime loader does not directly import Batch 1');
assert.doesNotMatch(presentationSource, /node:fs|readFileSync|require\s*\(|process\.env|eval\s*\(|new Function/, 'the runtime loader uses no filesystem, environment, or dynamic-code fallback');
assert.doesNotMatch(presentationSource, /companyId\s*===|switch\s*\(\s*companyId/, 'the presentation loader has no company-specific branch');
assert.throws(
  () => resolveJapaneseFirstPresentation('claim', 'outside-vite', {}, { title: 'Title', statement: 'Statement' }),
  /registry is unavailable outside the Vite SSR build/,
  'an unavailable runtime registry fails explicitly instead of behaving like an empty overlay',
);

assert.deepEqual(Object.fromEntries(Object.entries(fixture.fixedUi).map(([key]) => [key, japaneseFirstFixedUiLabels[key]])), fixture.fixedUi, 'fixed UI labels are exact');
assert.notEqual(japaneseFirstFixedUiLabels['Value Chain'], '供給網上の位置', 'Value Chain is not conflated with supply chain');
const purposePresetDefinitions = JSON.parse(readFileSync(new URL('../src/data/company-compare-evidence-presets-v01.json', import.meta.url), 'utf8'));
const purposePresetFixture = fixture.companyComparePurposePresets;
const purposePresets = purposePresetDefinitions;
assert.deepEqual(purposePresets, purposePresetFixture.presets, 'purpose preset definitions are independent fixture-exact Japanese copy and ordered Company IDs');
assert.equal(purposePresets.length, purposePresetFixture.count, 'purpose preset count is fixed');
assert.equal(purposePresets.flatMap(preset => preset.companyIds).length, purposePresetFixture.slotCount, 'purpose preset Company slots are fixed');
assert.equal(new Set(purposePresets.flatMap(preset => preset.companyIds)).size, purposePresetFixture.uniqueCompanyCount, 'purpose preset unique Company count is fixed');
for (const preset of purposePresets) {
  assert.equal(preset.companyIds.length, 4, `${preset.id}: four Company IDs are exact`);
  assert.equal(new Set(preset.companyIds).size, 4, `${preset.id}: Company IDs are unique inside the preset`);
  const exactMatch = purposePresets.find(candidate => candidate.companyIds.length === preset.companyIds.length && candidate.companyIds.every((id, index) => id === preset.companyIds[index]));
  assert.equal(exactMatch?.id, preset.id, `${preset.id}: exact ordered IDs identify the active preset`);
  assert.equal(purposePresets.find(candidate => candidate.companyIds.every((id, index) => id === [...preset.companyIds].reverse()[index])) ?? null, null, `${preset.id}: reordered IDs remain a custom selection`);
}
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
assert.deepEqual(resolveJapaneseFirstClaimPresentation(canonical, canonical, entries), { ...canonical, title: translated.title, statement: translated.statement, decision: 'translate' });
assert.throws(() => resolveJapaneseFirstClaimPresentation({ ...canonical, statement: `${canonical.statement}!` }, canonical, entries), /digest is stale/);
assert.throws(() => compileJapaneseFirstPresentationEntries([translated, translated]), /duplicate key/);
assert.throws(() => compileJapaneseFirstPresentationEntries([{ ...translated, entityType: 'unknown' }]), /entity type is unsupported/);
assert.throws(() => compileJapaneseFirstPresentationEntries([{ ...translated, title: '' }]), /requires title and statement/);
assert.throws(() => compileJapaneseFirstPresentationEntries([{ ...translated, decision: 'preserve', title: undefined, statement: undefined }]), /preserve decision requires reason/);
assert.equal(canonical.title, fixture.canonicalClaim.title, 'canonical object is not mutated');

const preservedEntry = {
  entityType: 'claim',
  stableKey: 'preserved-claim',
  decision: 'preserve',
  reason: 'Formal product name',
  canonicalDigest: japaneseFirstCanonicalDigest(canonical),
};
assert.deepEqual(
  resolveJapaneseFirstPresentation('claim', preservedEntry.stableKey, canonical, canonical, compileJapaneseFirstPresentationEntries([preservedEntry])),
  { ...canonical, decision: 'preserve', reason: preservedEntry.reason },
  'preserve decisions retain canonical copy and their reason',
);

const canonicalPortfolio = Object.freeze({
  title: 'Canonical portfolio title',
  body: 'Canonical portfolio body.',
  groundingId: 'fixture-portfolio-grounding',
  summaryVisible: false,
  expandedVisible: true,
});
const portfolioEntry = {
  entityType: 'portfolio',
  stableKey: canonicalPortfolio.groundingId,
  decision: 'translate',
  title: '日本語の製品群見出し',
  statement: '日本語の製品群概要。',
  canonicalDigest: japaneseFirstCanonicalDigest({
    groundingId: canonicalPortfolio.groundingId,
    title: canonicalPortfolio.title,
    body: canonicalPortfolio.body,
  }),
};
const portfolioEntries = compileJapaneseFirstPresentationEntries([portfolioEntry]);
assert.deepEqual(resolveCompanyCompareProductPortfolioPresentation(canonicalPortfolio, portfolioEntries), {
  ...canonicalPortfolio,
  title: portfolioEntry.title,
  body: portfolioEntry.statement,
}, 'Portfolio title and body resolve through the groundingId presentation key');
assert.deepEqual(resolveCompanyCompareProductPortfolioPresentation(canonicalPortfolio, new Map()), canonicalPortfolio, 'unregistered Portfolio overlays retain canonical copy');
assert.throws(
  () => resolveCompanyCompareProductPortfolioPresentation({ ...canonicalPortfolio, title: `${canonicalPortfolio.title}!` }, portfolioEntries),
  /digest is stale/,
  'a changed canonical Portfolio title rejects its stale digest',
);
assert.throws(
  () => resolveCompanyCompareProductPortfolioPresentation({ ...canonicalPortfolio, body: `${canonicalPortfolio.body}!` }, portfolioEntries),
  /digest is stale/,
  'a changed canonical Portfolio body rejects its stale digest',
);
assert.throws(() => compileJapaneseFirstPresentationEntries([portfolioEntry, portfolioEntry]), /duplicate key/, 'duplicate groundingId presentation entries reject');
assert.throws(() => resolveCompanyCompareProductPortfolioSummary('nvidia', new Set()), /grounding does not resolve/, 'unknown Portfolio grounding IDs reject');
assert.equal(canonicalPortfolio.title, 'Canonical portfolio title', 'canonical Portfolio title is not mutated');
assert.equal(canonicalPortfolio.body, 'Canonical portfolio body.', 'canonical Portfolio body is not mutated');
const portfolioSource = readFileSync(new URL('../src/lib/company-compare-product-portfolios.ts', import.meta.url), 'utf8');
assert.doesNotMatch(portfolioSource, /companyId\s*===\s*['"]|case\s+['"]/, 'Portfolio presentation has no company-specific branch');
assert.equal(createHash('sha256').update(presentationSource).digest('hex'), 'cc0a9f83bd01c346963a69c3d1245dc0aceb48dc9ac25f465972bc54f68ef87f', 'the generic overlay loader source is unchanged');
assert.equal(createHash('sha256').update(portfolioSource).digest('hex'), '5a6404f0e67e1206125e6894306c16c89bff5f930eec889b5a830f7ac1d72474', 'the shared Portfolio resolver source is unchanged');

const canonicalFacility = Object.freeze({ facilityId: 'fixture-facility', title: 'Canonical facility', statement: 'Canonical facility statement.' });
const facilityEntry = {
  entityType: 'facility',
  stableKey: canonicalFacility.facilityId,
  decision: 'translate',
  title: '試験用施設',
  statement: '試験用施設の説明。',
  canonicalDigest: japaneseFirstCanonicalDigest(canonicalFacility),
};
assert.deepEqual(
  resolveJapaneseFirstPresentation('facility', canonicalFacility.facilityId, canonicalFacility, canonicalFacility, compileJapaneseFirstPresentationEntries([facilityEntry])),
  { ...canonicalFacility, title: facilityEntry.title, statement: facilityEntry.statement, decision: 'translate' },
  'the shared resolver supports facilityId without a company branch',
);

const evidenceManifest = readJson('../src/data/company-evidence-manifest.json');
const evidenceClaims = evidenceManifest.shards.flatMap(shard => readJson(`../src/data/${shard}`).claims);
const claimById = new Map(evidenceClaims.map(claim => [claim.id, claim]));
assert.equal(claimById.size, 1_062, 'the frozen canonical Claim set remains complete');

const projectionCompanies = [
  ...firstBatchCompanies,
  ...remainingBatch1Companies,
  ...remainingBatch2Companies,
  ...remainingBatch3Companies,
  ...remainingBatch4Companies,
];
const displayOnlyProducts = [
  ...firstBatchProductEntries,
  ...remainingBatch1ProductEntries,
  ...remainingBatch2ProductEntries,
  ...remainingBatch3ProductEntries,
  ...remainingBatch4ProductEntries,
];
const productRegistry = readJson('../src/data/product-registry-v01.json');
const productRegistryById = new Map(productRegistry.records.map(product => [product.id, product]));
const productById = new Map(displayOnlyProducts.map(product => [product.canonicalId, product]));
for (const [productId, description] of Object.entries(compareProductDisplayDescriptions)) {
  const product = productRegistryById.get(productId);
  assert.ok(product, `${productId}: Compare Product resolves in the canonical registry`);
  productById.set(productId, {
    canonicalId: productId,
    label: compareProductDisplayNameOverrides[productId] ?? product.displayNames?.ja ?? product.canonicalName,
    description: description.description,
  });
}
const rawPortfolioById = new Map(Object.values(getCompanyCompareProductPortfolioSummaries()).map(portfolio => [portfolio.groundingId, portfolio]));

const productOwnerById = new Map();
const portfolioOwnerById = new Map();
for (const company of projectionCompanies) {
  portfolioOwnerById.set(company.productPortfolio.groundingId, company.companyId);
  for (const product of company.productEntries) productOwnerById.set(product.canonicalId, company.companyId);
}
const pilotPortfolioOwners = {
  'nvidia-products': 'nvidia',
  'broadcom-products': 'broadcom',
  'applied-products': 'applied-materials',
  'lam-research-products': 'lam-research',
  'tokyo-electron-products': 'tokyo-electron',
};
for (const [groundingId, companyId] of Object.entries(pilotPortfolioOwners)) portfolioOwnerById.set(groundingId, companyId);

const canonicalForEntry = entry => {
  if (entry.entityType === 'claim') {
    const claim = claimById.get(entry.stableKey);
    if (!claim) throw new Error(`Overlay Claim does not resolve: ${entry.stableKey}`);
    return { canonical: { id: claim.id, title: claim.title, statement: claim.statement }, companyId: claim.companyId };
  }
  if (entry.entityType === 'product') {
    const product = productById.get(entry.stableKey);
    const companyId = productOwnerById.get(entry.stableKey);
    if (!product || !companyId) throw new Error(`Overlay Product does not resolve: ${entry.stableKey}`);
    return { canonical: { canonicalId: product.canonicalId, label: product.label, description: product.description }, companyId };
  }
  if (entry.entityType === 'portfolio') {
    const portfolio = rawPortfolioById.get(entry.stableKey);
    const companyId = portfolioOwnerById.get(entry.stableKey);
    if (!portfolio || !companyId) throw new Error(`Overlay Portfolio does not resolve: ${entry.stableKey}`);
    return { canonical: { groundingId: portfolio.groundingId, title: portfolio.title, body: portfolio.body }, companyId };
  }
  throw new Error(`Batch overlay entity type has no canonical catalog: ${entry.entityType}`);
};

assert.deepEqual(batch1.companyIds, fixedBatch1CompanyIds, 'Batch 1 data keeps the exact reviewed 50-company order');
assert.deepEqual(batch2.companyIds, fixedBatch2CompanyIds, 'Batch 2 data keeps the exact reviewed 50-company order');
assert.deepEqual(manifest.companyIds, [...fixedBatch1CompanyIds, ...fixedBatch2CompanyIds], 'manifest covers the exact reviewed 100-company order');
assert.equal(batch1.baseMainSha, 'c7d0e0022fa280f0f9a3bd90259b2e9132251939', 'Batch 1 data records the approved base main');
assert.equal(batch2.baseMainSha, 'a9a58be520a6aabfe0c3f63558ce2a189d3b7020', 'Batch 2 data records the approved base main');
assert.equal(manifest.baseMainSha, batch2.baseMainSha, 'combined manifest records the Batch 2 base main');
assert.equal(batch1.entries.length, 535, 'Batch 1 contains the reviewed 535 stable presentation entries');
assert.equal(batch2.entries.length, 163, 'Batch 2 contains the reviewed entries plus four approved Applied Materials canonical-fallback overlays');
assert.equal(manifest.auditCandidateCount, 2_487, 'all 2,487 audited display candidates are retained');
assert.equal(manifest.translateCount, 2_487, 'all reviewed candidates have a translate decision');
assert.equal(manifest.preserveCount, 0, 'no candidate is silently preserved');
assert.equal(manifest.unresolvedCount, 0, 'no audited candidate remains unresolved');
assert.equal(manifest.overlayEntryCount, batch1.entries.length + batch2.entries.length, 'manifest overlay count matches both registered batches');
assert.equal(manifest.duplicateStableKeyCount, 0, 'manifest records no duplicate stable key');
assert.equal(manifest.staleCanonicalDigestCount, 0, 'manifest records no stale canonical digest');
assert.equal(manifest.batch1EntryCount, batch1.entries.length, 'Batch 1 entry count is retained');
assert.equal(manifest.batch2EntryCount, batch2.entries.length, 'Batch 2 entry count is exact');
assert.equal(manifest.canonicalDigestVerification, 'PASS', 'manifest records canonical digest verification');
assert.deepEqual(manifest.entries, [], 'the audit manifest is not an executable overlay envelope');

const batch1EntryKeys = batch1.entries.map(entry => `${entry.entityType}:${entry.stableKey}`);
const batch2EntryKeys = batch2.entries.map(entry => `${entry.entityType}:${entry.stableKey}`);
const batchEntryKeys = [...batch1EntryKeys, ...batch2EntryKeys].sort();
assert.deepEqual(batch1EntryKeys, [...batch1EntryKeys].sort(), 'Batch 1 entries are stably sorted by type and stable key');
assert.deepEqual(batch2EntryKeys, [...batch2EntryKeys].sort(), 'Batch 2 entries are stably sorted by type and stable key');
assert.equal(new Set(batchEntryKeys).size, batchEntryKeys.length, 'the two batches have no duplicate entityType and stableKey pair');
assert.deepEqual(manifest.stableKeys, batchEntryKeys, 'manifest stable keys exactly match both executable overlays');
assert.deepEqual(manifest.stableKeys, [...manifest.stableKeys].sort(), 'manifest stable keys are stably sorted');
const batch1Manifest = manifest.batches.find(batch => batch.version === batch1.version);
const batch2Manifest = manifest.batches.find(batch => batch.version === batch2.version);
assert.ok(batch1Manifest && batch2Manifest, 'manifest records both versioned batch summaries');
assert.deepEqual(batch1Manifest.companyIds, fixedBatch1CompanyIds, 'Batch 1 manifest boundary is unchanged');
assert.equal(batch1Manifest.auditCandidateCount, 1_957, 'Batch 1 candidate total is unchanged');
assert.equal(batch1Manifest.overlayEntryCount, 535, 'Batch 1 overlay total is unchanged');
assert.deepEqual(batch1Manifest.stableKeys, batch1EntryKeys, 'Batch 1 stable-key set is unchanged');
assert.deepEqual(batch2Manifest.companyIds, fixedBatch2CompanyIds, 'Batch 2 manifest boundary is exact');
assert.equal(batch2Manifest.auditCandidateCount, 530, 'Batch 2 candidate total is exact');
assert.equal(batch2Manifest.overlayEntryCount, batch2.entries.length, 'Batch 2 manifest entry total is exact');
assert.deepEqual(batch2Manifest.stableKeys, batch2EntryKeys, 'Batch 2 stable keys match the executable overlay');
assert.deepEqual(manifest.crossBatchValidation, {
  companyOverlapCount: 0,
  stableKeyOverlapCount: 0,
  totalCompanyCount: 100,
  totalAuditCandidateCount: 2_487,
  unresolvedCount: 0,
  staleCanonicalDigestCount: 0,
  orphanEntryCount: 0,
}, 'cross-batch boundary checks are explicit');
assert.deepEqual(
  Object.fromEntries(['claim', 'product', 'portfolio', 'facility'].map(type => [type, batch1.entries.filter(entry => entry.entityType === type).length])),
  { claim: 380, product: 118, portfolio: 37, facility: 0 },
  'Batch 1 entity-type totals are exact',
);

const compiledBatchEntries = compileJapaneseFirstPresentationEntries(batch1.entries);
const entryKeysByCompany = new Map(fixedBatch1CompanyIds.map(companyId => [companyId, []]));
const canonicalTextByEntry = new Map();
for (const entry of batch1.entries) {
  assert.equal(entry.decision, 'translate', `${entry.entityType}:${entry.stableKey}: decision is explicit`);
  assert.deepEqual(Object.keys(entry).sort(), ['canonicalDigest', 'decision', 'entityType', 'stableKey', 'statement', 'title'], `${entry.entityType}:${entry.stableKey}: overlay fields are exact`);
  assert.match(`${entry.title}${entry.statement}`, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u, `${entry.entityType}:${entry.stableKey}: translated copy contains Japanese text`);
  const { canonical: canonicalValue, companyId } = canonicalForEntry(entry);
  assert.ok(entryKeysByCompany.has(companyId), `${entry.entityType}:${entry.stableKey}: owner belongs to the fixed Batch 1 set`);
  entryKeysByCompany.get(companyId).push(`${entry.entityType}:${entry.stableKey}`);
  assert.equal(entry.canonicalDigest, japaneseFirstCanonicalDigest(canonicalValue), `${entry.entityType}:${entry.stableKey}: canonical digest is current`);
  const before = JSON.stringify(canonicalValue);
  const fallback = entry.entityType === 'product'
    ? { title: canonicalValue.label, statement: canonicalValue.description }
    : entry.entityType === 'portfolio'
      ? { title: canonicalValue.title, statement: canonicalValue.body }
      : { title: canonicalValue.title, statement: canonicalValue.statement };
  const resolved = resolveJapaneseFirstPresentation(entry.entityType, entry.stableKey, canonicalValue, fallback, compiledBatchEntries);
  assert.equal(resolved.title, entry.title, `${entry.entityType}:${entry.stableKey}: title resolves`);
  assert.equal(resolved.statement, entry.statement, `${entry.entityType}:${entry.stableKey}: statement resolves`);
  assert.equal(resolved.decision, 'translate', `${entry.entityType}:${entry.stableKey}: resolution is translated`);
  assert.equal(JSON.stringify(canonicalValue), before, `${entry.entityType}:${entry.stableKey}: canonical input is not mutated`);
  assert.ok(entry.title !== fallback.title || entry.statement !== fallback.statement, `${entry.entityType}:${entry.stableKey}: overlay makes an explicit presentation change`);
  canonicalTextByEntry.set(`${entry.entityType}:${entry.stableKey}`, `${fallback.title} ${fallback.statement}`);
}
assert.deepEqual([...entryKeysByCompany.keys()], fixedBatch1CompanyIds, 'entry ownership includes exactly the fixed Batch 1 companies');

assert.equal(manifest.companies.length, 100, 'manifest has one audit record per supported company');
const batch1CompanyAudits = manifest.companies.slice(0, 50);
const batch2CompanyAudits = manifest.companies.slice(50);
assert.deepEqual(batch1CompanyAudits.map(company => company.companyId), fixedBatch1CompanyIds, 'Batch 1 company records preserve the reviewed order');
assert.deepEqual(batch2CompanyAudits.map(company => company.companyId), fixedBatch2CompanyIds, 'Batch 2 company records preserve the reviewed order');
let auditedCandidates = 0;
for (const company of batch1CompanyAudits) {
  assert.equal(company.candidateCount, company.compareCandidateCount + company.companyPageCandidateCount, `${company.companyId}: surface counts total correctly`);
  assert.equal(company.translateCount, company.candidateCount, `${company.companyId}: every candidate has a translate decision`);
  assert.equal(company.preserveCount, 0, `${company.companyId}: preserve count is zero`);
  assert.equal(company.unresolvedCount, 0, `${company.companyId}: unresolved count is zero`);
  assert.deepEqual(company.stableKeys, [...entryKeysByCompany.get(company.companyId)].sort(), `${company.companyId}: audit stable keys match executable entries`);
  assert.deepEqual(company.stableKeys, [...company.stableKeys].sort(), `${company.companyId}: audit stable keys are sorted`);
  assert.deepEqual(company.candidateLedger.map(record => record.surface), ['compare', 'company-page'], `${company.companyId}: both audited surfaces are recorded`);
  for (const record of company.candidateLedger) {
    assert.equal(record.decision, 'translate', `${company.companyId}:${record.surface}: ledger decision is explicit`);
    if (record.count === 0) {
      assert.equal(record.candidateIdRange, null, `${company.companyId}:${record.surface}: an empty surface has no candidate range`);
      continue;
    }
    const match = record.candidateIdRange.match(new RegExp(`^${escapeRegex(company.companyId)}:${record.surface}:001-(\\d{3})$`));
    assert.ok(match, `${company.companyId}:${record.surface}: candidate range is stable`);
    assert.equal(Number(match[1]), record.count, `${company.companyId}:${record.surface}: candidate range matches count`);
  }
  auditedCandidates += company.candidateCount;
}
assert.equal(auditedCandidates, 1_957, 'company audit ledgers total 1,957 candidates');

const compiledAllEntries = compileJapaneseFirstPresentationEntries([...batch1.entries, ...batch2.entries]);
const p2Audit = fixture.p2CopyAudit;
assert.equal(p2Audit.version, 'japanese-first-copy-p2-v01', 'P2 copy ledger is versioned');
assert.equal(p2Audit.baseMain, '46f3aceca5c793cd269197cada3788c97a84b04b', 'P2 copy ledger records the audited main');
assert.equal(p2Audit.auditFixRows, 62, 'P2 ledger keeps the 62 approved audit FIX rows');
assert.equal(p2Audit.rows.length, 62, 'P2 ledger has one record per approved audit row');
const p2ExpandedTargets = p2Audit.rows.flatMap((auditRow, auditRowIndex) => auditRow.targets.map(auditTarget => ({
  auditRowIndex,
  companyId: auditRow.companyId,
  ...auditTarget,
})));
assert.equal(p2Audit.expandedOverlayEntries, 67, 'P2 ledger records the measured expanded overlay count');
assert.equal(p2ExpandedTargets.length, 67, '62 audit rows expand to the measured 67 overlay entries');
assert.deepEqual(
  p2Audit.targetCompanyIds,
  [...new Set(p2Audit.rows.map(auditRow => auditRow.companyId))].sort(),
  'P2 ledger target-company set is exact and sorted',
);
assert.equal(p2Audit.targetCompanyIds.length, 42, 'P2 copy fixes affect exactly 42 companies');
const p2CompositeKeys = p2ExpandedTargets.map(target => `${target.overlayBatch}:${target.kind}:${target.groundingId}`);
assert.equal(new Set(p2CompositeKeys).size, p2CompositeKeys.length, 'P2 overlay batch, kind, and grounding ID keys are unique');

const overlayPayloadByVersion = new Map(overlayPayloads.map(payload => [payload.version, payload]));
const p2SupersededCompositeKeys = new Set([
  'japanese-first-copy-batch2-v01:claim:applied-value-chain',
]);
let p2ZeroMatches = 0;
let p2MultipleMatches = 0;
let p2CurrentValueMismatches = 0;
for (const target of p2ExpandedTargets) {
  const payload = overlayPayloadByVersion.get(target.overlayBatch);
  assert.ok(payload, `${target.overlayBatch}: P2 target overlay batch exists`);
  const matches = payload.entries.filter(entry => entry.entityType === target.kind && entry.stableKey === target.groundingId);
  if (matches.length === 0) p2ZeroMatches += 1;
  if (matches.length > 1) p2MultipleMatches += 1;
  assert.equal(matches.length, 1, `${target.overlayBatch}:${target.kind}:${target.groundingId}: resolves exactly once`);
  const entry = matches[0];
  assert.equal(canonicalForEntry(entry).companyId, target.companyId, `${target.kind}:${target.groundingId}: audited owner is unchanged`);
  const compositeKey = `${target.overlayBatch}:${target.kind}:${target.groundingId}`;
  if (p2SupersededCompositeKeys.has(compositeKey)) {
    assert.deepEqual(
      target.after,
      {
        title: '半導体工場の工程装置を供給',
        statement: 'AtlasではApplied Materialsを、半導体メーカーやファウンドリの半導体工場へウェハ工程装置を供給する製造装置層として整理する。',
      },
      `${target.kind}:${target.groundingId}: P2 history remains independently recorded before the approved naming refinement`,
    );
    assert.equal(entry.canonicalDigest, japaneseFirstCanonicalDigest(canonicalForEntry(entry).canonical), `${target.kind}:${target.groundingId}: canonical digest is unchanged`);
    continue;
  }
  for (const [field, expected] of Object.entries(target.after)) {
    if (entry[field] !== expected) p2CurrentValueMismatches += 1;
    assert.equal(entry[field], expected, `${target.kind}:${target.groundingId}:${field}: approved P2 full copy is exact`);
    assert.notEqual(target.before[field], expected, `${target.kind}:${target.groundingId}:${field}: before and after contracts differ`);
    assert.ok(!entry[field].includes(target.before[field]), `${target.kind}:${target.groundingId}:${field}: audited old full copy is absent`);
  }
  assert.equal(entry.canonicalDigest, japaneseFirstCanonicalDigest(canonicalForEntry(entry).canonical), `${target.kind}:${target.groundingId}: canonical digest is unchanged`);
}
assert.equal(p2ZeroMatches, 0, 'P2 audit has no zero-match overlay target');
assert.equal(p2MultipleMatches, 0, 'P2 audit has no unintended multi-match overlay target');
assert.equal(p2CurrentValueMismatches, 0, 'P2 audit has no current-value mismatch');

const presentationEntrySha256 = entry => createHash('sha256')
  .update(JSON.stringify({ title: entry.title, statement: entry.statement }))
  .digest('hex');
assert.equal(p2Audit.reviewEntries.length, 1, 'the one Corning REVIEW entry remains outside FIX');
assert.equal(p2Audit.reviewEntries[0].key, 'claim:corning-positioning', 'the Corning REVIEW key is exact');
assert.equal(
  p2Audit.reviewEntries[0].sha256,
  'cfabc8e3e3e41d72d69a629d85875e524050ed5b99a802f4c478d7d0ca615ef6',
  'the P2 ledger preserves the historical Corning REVIEW presentation digest',
);
assert.equal(p2Audit.preserveEntries.length, 14, '14 overlay PRESERVE entries remain unchanged');
for (const protectedEntry of p2Audit.preserveEntries) {
  const entry = [...batch1.entries, ...batch2.entries].find(candidate => `${candidate.entityType}:${candidate.stableKey}` === protectedEntry.key);
  assert.ok(entry, `${protectedEntry.key}: protected presentation entry exists`);
  assert.equal(presentationEntrySha256(entry), protectedEntry.sha256, `${protectedEntry.key}: PRESERVE presentation remains byte-equivalent`);
}
assert.deepEqual(
  companyDisplayNameParts(fixture.names.find(identity => identity.id === 'applied-materials')),
  p2Audit.appliedMaterialsNameContract,
  'the fifteenth PRESERVE item keeps the Applied Materials identity presentation contract',
);
assert.equal(p2Audit.numericEquivalence.length, 7, 'all seven display-only numeric conversions are independently fixed');
for (const conversion of p2Audit.numericEquivalence) {
  assert.equal(BigInt(conversion.beforeValue), BigInt(conversion.afterValue), `${conversion.key}: before and after values are arithmetically identical`);
  const entry = [...batch1.entries, ...batch2.entries].find(candidate => `${candidate.entityType}:${candidate.stableKey}` === conversion.key);
  assert.ok(entry, `${conversion.key}: numeric conversion target exists`);
  const displayText = `${entry.title}\n${entry.statement}`;
  assert.ok(displayText.includes(conversion.after), `${conversion.key}: converted Japanese display is present`);
  assert.ok(!displayText.includes(conversion.before), `${conversion.key}: old numeric display is absent`);
  assert.ok(['USD', 'JPY', 'square-foot'].includes(conversion.baseUnit), `${conversion.key}: conversion base unit is explicit`);
}
assert.equal(batch1.entries.length + batch2.entries.length, 698, 'Corning and Applied Materials presentation updates register all 698 overlays');
assert.equal(manifest.auditCandidateCount, 2_487, 'P2 copy changes preserve all 2,487 audited decisions');
assert.deepEqual(manifest.stableKeys, [...batch1EntryKeys, ...batch2EntryKeys].sort(), 'P2 copy changes preserve the complete stable-key set');

const corningAppliedPresentation = fixture.corningAppliedMaterialsPresentation;
assert.equal(corningAppliedPresentation.version, 'corning-applied-materials-presentation-v01', 'the Corning and Applied Materials presentation contract is versioned');
assert.equal(corningAppliedPresentation.baseMain, 'b3875e7c8c05a53da5dc8856141ed1f11dad03c0', 'the Corning and Applied Materials presentation contract records its base main');
assert.deepEqual(corningAppliedPresentation.targetCompanyIds, ['applied-materials', 'corning'], 'the presentation contract targets exactly the two approved companies');
assert.equal(corningAppliedPresentation.targets.length, 9, 'the presentation contract records all nine approved Claims');
assert.equal(corningAppliedPresentation.existingOverlayKeys.length, 5, 'the presentation contract records the five existing overlay updates');
assert.equal(corningAppliedPresentation.newOverlayKeys.length, 4, 'the presentation contract records the four canonical-fallback Claim overlays');
assert.deepEqual(
  [...corningAppliedPresentation.existingOverlayKeys, ...corningAppliedPresentation.newOverlayKeys].sort(),
  corningAppliedPresentation.targets.map(target => `${target.kind}:${target.groundingId}`).sort(),
  'every independently specified Corning or Applied Materials target is classified exactly once',
);
assert.deepEqual(corningAppliedPresentation.expectedOverlayCounts, { total: 698, claim: 542, portfolio: 38, product: 118 }, 'the aggregate overlay counts are exact');
const corningAppliedCompositeKeys = corningAppliedPresentation.targets.map(target => `${target.overlayBatch}:${target.kind}:${target.groundingId}`);
assert.equal(new Set(corningAppliedCompositeKeys).size, 9, 'the Corning and Applied Materials overlay composite keys are unique');
let corningAppliedZeroMatches = 0;
let corningAppliedMultipleMatches = 0;
for (const target of corningAppliedPresentation.targets) {
  const payload = overlayPayloadByVersion.get(target.overlayBatch);
  assert.ok(payload, `${target.overlayBatch}: Corning or Applied Materials overlay batch is registered`);
  const matches = payload.entries.filter(entry => entry.entityType === target.kind && entry.stableKey === target.groundingId);
  if (matches.length === 0) corningAppliedZeroMatches += 1;
  if (matches.length > 1) corningAppliedMultipleMatches += 1;
  assert.equal(matches.length, 1, `${target.overlayBatch}:${target.kind}:${target.groundingId}: resolves exactly once`);
  const entry = matches[0];
  const canonical = canonicalForEntry(entry);
  assert.equal(canonical.companyId, target.companyId, `${target.kind}:${target.groundingId}: approved owner is exact`);
  assert.equal(entry.canonicalDigest, target.canonicalDigest, `${target.kind}:${target.groundingId}: fixture canonical digest is exact`);
  assert.equal(entry.canonicalDigest, japaneseFirstCanonicalDigest(canonical.canonical), `${target.kind}:${target.groundingId}: canonical digest is current`);
  assert.deepEqual({ title: entry.title, statement: entry.statement }, target.after, `${target.kind}:${target.groundingId}: approved full presentation copy is exact`);
  assert.notDeepEqual(target.before, target.after, `${target.kind}:${target.groundingId}: independent before and after copy differ`);
  for (const [field, previous] of Object.entries(target.before)) {
    if (target.after[field] !== previous) {
      assert.notEqual(entry[field], previous, `${target.kind}:${target.groundingId}:${field}: old presentation copy is absent`);
    }
  }
}
assert.equal(corningAppliedZeroMatches, 0, 'Corning and Applied Materials have no zero-match Claim target');
assert.equal(corningAppliedMultipleMatches, 0, 'Corning and Applied Materials have no multi-match Claim target');
const corningTarget = corningAppliedPresentation.targets.find(target => target.groundingId === 'corning-positioning');
assert.equal(corningTarget.after.statement, 'Corningは光通信の主要製品群で市場を主導する立場にあり、大規模製造の経験、光ファイバの製造プロセス、技術面での先導力、知的財産がコスト優位性をもたらすと説明している。', 'Corning preserves distinct market leadership and technology leadership in the approved full sentence');
const appliedTargets = corningAppliedPresentation.targets.filter(target => target.companyId === 'applied-materials');
assert.equal(appliedTargets.length, 8, 'Applied Materials has exactly eight approved presentation Claim targets');
for (const target of appliedTargets) {
  const entry = overlayPayloadByVersion.get(target.overlayBatch).entries.find(candidate => candidate.entityType === target.kind && candidate.stableKey === target.groundingId);
  assert.ok(!`${entry.title}\n${entry.statement}`.match(/\bApplied Materials\b/), `${target.groundingId}: Japanese presentation has no standalone English Applied Materials name`);
  assert.ok(`${entry.title}\n${entry.statement}`.includes('アプライド・マテリアルズ'), `${target.groundingId}: Japanese presentation uses the approved short name`);
}
const allEntityTypeCounts = [...batch1.entries, ...batch2.entries].reduce((counts, entry) => ({ ...counts, [entry.entityType]: (counts[entry.entityType] ?? 0) + 1 }), {});
assert.deepEqual(allEntityTypeCounts, { claim: 542, portfolio: 38, product: 118 }, 'Claim, Portfolio, and Product overlay counts are exact');
const batch2EntryKeysByCompany = new Map(fixedBatch2CompanyIds.map(companyId => [companyId, []]));
const batch2CanonicalTextByEntry = new Map();
for (const entry of batch2.entries) {
  assert.equal(entry.decision, 'translate', `${entry.entityType}:${entry.stableKey}: Batch 2 decision is explicit`);
  assert.deepEqual(
    Object.keys(entry).sort(),
    ['canonicalDigest', 'decision', 'entityType', 'stableKey', 'statement', 'title'],
    `${entry.entityType}:${entry.stableKey}: Batch 2 overlay fields are exact`,
  );
  assert.match(`${entry.title}${entry.statement}`, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u, `${entry.entityType}:${entry.stableKey}: Batch 2 copy contains Japanese text`);
  const { canonical: canonicalValue, companyId } = canonicalForEntry(entry);
  assert.ok(batch2EntryKeysByCompany.has(companyId), `${entry.entityType}:${entry.stableKey}: owner belongs to Batch 2`);
  batch2EntryKeysByCompany.get(companyId).push(`${entry.entityType}:${entry.stableKey}`);
  assert.equal(entry.canonicalDigest, japaneseFirstCanonicalDigest(canonicalValue), `${entry.entityType}:${entry.stableKey}: Batch 2 canonical digest is current`);
  const before = JSON.stringify(canonicalValue);
  const fallback = entry.entityType === 'product'
    ? { title: canonicalValue.label, statement: canonicalValue.description }
    : entry.entityType === 'portfolio'
      ? { title: canonicalValue.title, statement: canonicalValue.body }
      : { title: canonicalValue.title, statement: canonicalValue.statement };
  const resolved = resolveJapaneseFirstPresentation(entry.entityType, entry.stableKey, canonicalValue, fallback, compiledAllEntries);
  assert.equal(resolved.title, entry.title, `${entry.entityType}:${entry.stableKey}: Batch 2 title resolves`);
  assert.equal(resolved.statement, entry.statement, `${entry.entityType}:${entry.stableKey}: Batch 2 statement resolves`);
  assert.equal(resolved.decision, 'translate', `${entry.entityType}:${entry.stableKey}: Batch 2 resolution is translated`);
  assert.equal(JSON.stringify(canonicalValue), before, `${entry.entityType}:${entry.stableKey}: Batch 2 canonical input is not mutated`);
  assert.ok(entry.title !== fallback.title || entry.statement !== fallback.statement, `${entry.entityType}:${entry.stableKey}: Batch 2 overlay changes presentation`);
  batch2CanonicalTextByEntry.set(`${entry.entityType}:${entry.stableKey}`, `${fallback.title} ${fallback.statement}`);
}
assert.equal([...batch2EntryKeysByCompany.values()].filter(keys => keys.length > 0).length, 49, 'all Batch 2 companies except Ajinomoto Fine-Techno receive overlays');
assert.deepEqual(batch2EntryKeysByCompany.get('ajinomoto-fine-techno'), [], 'Ajinomoto Fine-Techno receives no unnecessary overlay');

let batch2AuditedCandidates = 0;
for (const company of batch2CompanyAudits) {
  assert.equal(company.candidateCount, fixedBatch2CandidateCounts[company.companyId], `${company.companyId}: Batch 2 candidate count is exact`);
  assert.equal(company.translateCount, company.candidateCount, `${company.companyId}: every Batch 2 candidate is decided`);
  assert.equal(company.preserveCount, 0, `${company.companyId}: Batch 2 preserve count is zero`);
  assert.equal(company.unresolvedCount, 0, `${company.companyId}: Batch 2 unresolved count is zero`);
  assert.equal(company.overlayEntryCount, batch2EntryKeysByCompany.get(company.companyId).length, `${company.companyId}: Batch 2 overlay count is exact`);
  assert.deepEqual(company.stableKeys, [...batch2EntryKeysByCompany.get(company.companyId)].sort(), `${company.companyId}: Batch 2 stable keys match executable entries`);
  batch2AuditedCandidates += company.candidateCount;
}
assert.equal(batch2AuditedCandidates, 530, 'Batch 2 audit records total 530 candidates');
assert.equal(auditedCandidates + batch2AuditedCandidates, 2_487, 'all 100 companies total 2,487 candidates');

const batchOverlayText = batch1.entries.map(entry => `${entry.title} ${entry.statement}`).join('\n');
for (const phrase of [
  'Power管理', 'Power変圧器', 'Digitalインフラ', 'Connectivityチップ', 'サーバー CPU', 'サーバー CPUs',
  'ルーター 基盤', ' / ', '物理AI', '12-インチ', 'データ-センター', 'まで跨る', '位置付ける企業と位置付ける',
]) {
  assert.ok(!batchOverlayText.includes(phrase), `reviewed Japanese copy omits the mechanical remnant: ${phrase}`);
}
const generalEnglishTerms = [
  'data center', 'advanced packaging', 'wafer', 'memory', 'foundry', 'network', 'server', 'software', 'cable',
  'metrology', 'portfolio', 'power', 'service', 'system', 'compute', 'connectivity', 'freshness', 'scope',
  'value chain', 'evidence', 'physical AI',
];
const countGeneralTerms = text => generalEnglishTerms.reduce((count, term) => {
  const escaped = escapeRegex(term).replace(/\\ /g, '\\s+');
  return count + (text.match(new RegExp(`(?<![A-Za-z])${escaped}s?(?![A-Za-z])`, 'gi')) ?? []).length;
}, 0);
const canonicalGeneralTermCount = [...canonicalTextByEntry.values()].reduce((count, text) => count + countGeneralTerms(text), 0);
const translatedGeneralTermCount = countGeneralTerms(batchOverlayText);
const generalTermReduction = 1 - translatedGeneralTermCount / canonicalGeneralTermCount;
assert.ok(canonicalGeneralTermCount > 0, 'general-term reduction has a non-empty canonical baseline');
assert.ok(generalTermReduction >= 0.95, `targeted English general terms are reduced by at least 95% (actual ${(generalTermReduction * 100).toFixed(2)}%)`);

const batch2OverlayText = batch2.entries.map(entry => `${entry.title} ${entry.statement}`).join('\n');
const batch2CanonicalGeneralTermCount = [...batch2CanonicalTextByEntry.values()].reduce((count, text) => count + countGeneralTerms(text), 0);
const batch2TranslatedGeneralTermCount = countGeneralTerms(batch2OverlayText);
const batch2GeneralTermReduction = 1 - batch2TranslatedGeneralTermCount / batch2CanonicalGeneralTermCount;
assert.ok(batch2CanonicalGeneralTermCount > 0, 'Batch 2 general-term reduction has a non-empty canonical baseline');
assert.ok(batch2GeneralTermReduction >= 0.95, `Batch 2 targeted English general terms are reduced by at least 95% (actual ${(batch2GeneralTermReduction * 100).toFixed(2)}%)`);
for (const phrase of ['Globalウェハ', '規模d', '主導的企業ship', 'パートナーship', '演算r', 'Kyoガスe', '向け向け']) {
  assert.ok(!batch2OverlayText.includes(phrase), `Batch 2 copy omits the mechanical remnant: ${phrase}`);
}

const overlayByKey = compiledBatchEntries;
const allOverlayByKey = compiledAllEntries;
assert.equal(
  overlayByKey.get('claim:asml-ai-role').statement,
  'AtlasではASMLを、AIサーバー向け先端ロジックとHBMを含むメモリの微細化を、リソグラフィ装置とプロセス制御で支える半導体前工程装置企業と位置付ける。',
  'ASML follows the approved Japanese-first direction',
);
assert.equal(
  overlayByKey.get('claim:fujikura-value-chain').statement,
  'Atlasではフジクラを、光ファイバを高密度ケーブルと接続ソリューションへ加工し、データセンターの物理ネットワークへ供給する層として整理する。',
  'Fujikura follows the approved Japanese-first direction',
);
assert.equal(
  overlayByKey.get('claim:samsung-electronics-strategy-triage-remediation-v02').statement,
  'Samsung Electronicsは、HBM4・GDDR7による高付加価値メモリ、先端GAAプロセスと成熟プロセスの改善、AI・HPC向けファウンドリ顧客基盤の拡大を中長期成長の重点とする。',
  'Samsung Electronics follows the approved Japanese-first direction',
);
assert.equal(
  overlayByKey.get('claim:sk-hynix-capacity-expansion-triage-remediation-v02').statement,
  'SK hynixはAIメモリ需要に備え、Yongin Semiconductor Clusterへ120兆ウォン、Cheongju M15Xへ20兆ウォン、インディアナ州先端パッケージ工場へ5.2兆ウォンを投じる計画を開示している。',
  'SK hynix follows the approved Japanese-first direction',
);
assert.equal(
  allOverlayByKey.get('claim:nvidia-strategy-triage-remediation-v02').statement,
  'NVIDIAはGPU、CPU、DPU、相互接続、システム、ソフトウェアを統合する高速計算基盤を拡張し、開発者エコシステム、NVIDIA AI Enterprise、DGX Cloudを通じてAI基盤における主導的地位を強化する方針を示している。',
  'NVIDIA follows the approved Batch 2 Japanese-first direction',
);
assert.equal(
  allOverlayByKey.get('claim:broadcom-products').statement,
  'Broadcom（ブロードコム）は、カスタムAIアクセラレーター／ASIC、Ethernetスイッチ向け半導体、接続・通信向け半導体を提供する。',
  'Broadcom follows the approved Batch 2 Japanese-first direction',
);
assert.equal(
  allOverlayByKey.get('claim:applied-products').statement,
  '半導体向け製品群は、材料の堆積、除去、改質、分析、デバイス接続に関わる装置・技術を含む。',
  'Applied Materials follows the approved Batch 2 Japanese-first direction',
);
assert.equal(
  allOverlayByKey.get('claim:tsmc-value-chain').statement,
  'AtlasではTSMCを、ファブレス企業の設計データをウェハ製造と先端パッケージへ変換する上流製造工程として整理する。',
  'TSMC follows the approved Batch 2 Japanese-first direction',
);
assert.ok(!batch2.entries.some(entry => canonicalForEntry(entry).companyId === 'ajinomoto-fine-techno'), 'Ajinomoto Fine-Techno has zero Batch 2 entries');
assert.equal(
  claimById.get('ajinomoto-fine-techno-ai-role').statement,
  'Atlasでは味の素ファインテクノを、CPU・GPUなど高性能半導体のパッケージ基板に使われるABFを通じて、AI計算基盤の高密度化に接続する企業と位置付ける。',
  'Ajinomoto Fine-Techno canonical presentation remains unchanged',
);

const klaPortfolio = [...rawPortfolioById.values()].find(portfolio => portfolioOwnerById.get(portfolio.groundingId) === 'kla');
const klaPortfolioEntry = overlayByKey.get(`portfolio:${klaPortfolio.groundingId}`);
const resolvedKlaPortfolio = resolveCompanyCompareProductPortfolioPresentation(klaPortfolio, overlayByKey);
assert.equal(resolvedKlaPortfolio.title, klaPortfolioEntry.title, 'KLA Expanded model receives the translated Portfolio title');
assert.equal(resolvedKlaPortfolio.body, klaPortfolioEntry.statement, 'KLA Expanded model receives the translated Portfolio body');
assert.equal(resolveCompanyCompareProductPortfolioPresentation(klaPortfolio, overlayByKey).body, resolvedKlaPortfolio.body, 'shared Portfolio presentation is deterministic across consumers');
const tsmcPortfolio = [...rawPortfolioById.values()].find(portfolio => portfolioOwnerById.get(portfolio.groundingId) === 'tsmc');
assert.deepEqual(resolveCompanyCompareProductPortfolioPresentation(tsmcPortfolio, allOverlayByKey), tsmcPortfolio, 'an unregistered Batch 2 Portfolio remains canonical');

const companyClaimComponentSource = readFileSync(new URL('../src/components/CompanyEvidenceClaim.astro', import.meta.url), 'utf8');
const compareClaimComponentSource = readFileSync(new URL('../src/components/CompanyCompareEvidenceClaim.astro', import.meta.url), 'utf8');
const compareClaimAssetComponentSource = readFileSync(new URL('../src/components/CompanyCompareEvidenceCompanyAsset.astro', import.meta.url), 'utf8');
const compareReadModelSource = readFileSync(new URL('../src/lib/company-compare-evidence-read-model.ts', import.meta.url), 'utf8');
assert.match(companyClaimComponentSource, /resolveJapaneseFirstClaimPresentation/, 'company pages use the shared Claim presentation resolver');
assert.match(compareReadModelSource, /resolveJapaneseFirstClaimPresentation/, 'Company Compare uses the shared Claim presentation resolver');
assert.match(compareClaimComponentSource, /drawer-claim-context[\s\S]*?<h4>\{drawerDisplayTitle\}<\/h4><p class="drawer-statement">\{drawerDisplayStatement\}<\/p>/, 'Compare drawer receives its explicit presentation title and statement');
assert.match(companyClaimComponentSource, /drawer-claim-context[\s\S]*?<h4>\{presentation\.title\}<\/h4><p class="drawer-statement">\{presentation\.statement\}<\/p>/, 'Company drawer receives the resolved presentation title and statement');
assert.doesNotMatch(compareClaimComponentSource, /drawer-claim-context[\s\S]*?\{claim\.(?:title|statement)\}/, 'Compare drawer has no raw canonical Claim display fallback');
assert.doesNotMatch(companyClaimComponentSource, /drawer-claim-context[\s\S]*?\{claim\.(?:title|statement)\}/, 'Company drawer has no raw canonical Claim display fallback');
assert.match(compareClaimAssetComponentSource, /drawerDisplayTitle=\{entry\.display\.title\}/, 'Compare drawer receives the shared resolved Claim title independently of body projection labels');
assert.match(compareClaimAssetComponentSource, /drawerDisplayStatement=\{entry\.display\.statement\}/, 'Compare drawer receives the shared resolved Claim statement independently of body projection labels');
const overlayClaimEntries = [...batch1.entries, ...batch2.entries].filter(entry => entry.entityType === 'claim');
assert.equal(overlayClaimEntries.length, 542, 'all 542 registered Claim overlays are covered by the drawer presentation contract');
const overlayClaimCompanyIds = new Set(overlayClaimEntries.map(entry => canonicalForEntry(entry).companyId));
assert.equal(overlayClaimCompanyIds.size, 99, 'the drawer presentation contract covers exactly 99 companies');
for (const entry of overlayClaimEntries) {
  const { canonical: canonicalClaim } = canonicalForEntry(entry);
  const resolved = resolveJapaneseFirstClaimPresentation(canonicalClaim, { title: canonicalClaim.title, statement: canonicalClaim.statement }, allOverlayByKey);
  assert.deepEqual(
    { title: resolved.title, statement: resolved.statement },
    { title: entry.title, statement: entry.statement },
    `${entry.stableKey}: body and both drawer consumers resolve the same registered presentation Claim copy`,
  );
}
const ajinomotoDrawerFallback = claimById.get('ajinomoto-fine-techno-ai-role');
assert.deepEqual(
  resolveJapaneseFirstClaimPresentation(ajinomotoDrawerFallback, { title: ajinomotoDrawerFallback.title, statement: ajinomotoDrawerFallback.statement }, allOverlayByKey),
  { title: ajinomotoDrawerFallback.title, statement: ajinomotoDrawerFallback.statement, decision: 'canonical' },
  'Ajinomoto Fine-Techno retains the canonical Claim fallback in both drawer consumers',
);
const asmlCanonical = claimById.get('asml-ai-role');
const asmlFallback = { title: asmlCanonical.title, statement: asmlCanonical.statement };
assert.deepEqual(
  resolveJapaneseFirstClaimPresentation(asmlCanonical, asmlFallback, overlayByKey),
  resolveJapaneseFirstClaimPresentation(asmlCanonical, asmlFallback, overlayByKey),
  'the same Claim key resolves identically for Compare and company-page consumers',
);

const pilotCompanyIds = ['nvidia', 'broadcom', 'applied-materials', 'lam-research', 'tokyo-electron'];
const allSupportedCompanyIds = [...pilotCompanyIds, ...projectionCompanies.map(company => company.companyId)].sort();
assert.equal(allSupportedCompanyIds.length, 100, 'artifact freeze derives the complete 100-company set');
assert.equal(new Set(allSupportedCompanyIds).size, 100, 'artifact freeze company paths are unique');
const expectedArtifactPaths = ['index.html', ...allSupportedCompanyIds.map(companyId => `${companyId}/index.html`)].sort();

const validateShaEntries = entriesToValidate => {
  const paths = entriesToValidate.map(([path]) => path);
  if (new Set(paths).size !== paths.length) throw new Error('artifact SHA path is duplicated');
  for (const [path, sha] of entriesToValidate) {
    if (!path || !/^[a-f0-9]{64}$/.test(sha)) throw new Error('artifact SHA entry is invalid');
  }
};
const validateFreezeFixture = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('artifact freeze fixture must be an object');
  if (typeof value.activeArtifactFreezeVersion !== 'string' || !value.activeArtifactFreezeVersion.trim()) throw new Error('active artifact freeze version is invalid');
  if (!Array.isArray(value.artifactFreezes) || !value.artifactFreezes.length) throw new Error('artifact freeze history is invalid');
  const versions = value.artifactFreezes.map(freeze => freeze?.version);
  if (versions.some(version => typeof version !== 'string' || !version.trim())) throw new Error('artifact freeze version is invalid');
  if (new Set(versions).size !== versions.length) throw new Error('artifact freeze version is duplicated');
  const matches = value.artifactFreezes.filter(freeze => freeze.version === value.activeArtifactFreezeVersion);
  if (matches.length !== 1) throw new Error('active artifact freeze version must resolve exactly once');
  for (const freeze of value.artifactFreezes) {
    const map = freeze.sha256ByPath;
    if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error('artifact SHA map is invalid');
    const paths = Object.keys(map);
    if (paths.length !== 101) throw new Error('artifact SHA path count is invalid');
    if (JSON.stringify(paths) !== JSON.stringify([...paths].sort())) throw new Error('artifact SHA paths are not sorted');
    if (JSON.stringify(paths) !== JSON.stringify(expectedArtifactPaths)) throw new Error('artifact SHA path set is invalid');
    validateShaEntries(Object.entries(map));
  }
  return { active: matches[0], freezes: value.artifactFreezes };
};

const { active: activeFreeze, freezes } = validateFreezeFixture(fixture);
const foundationFreeze = freezes.find(freeze => freeze.version === 'japanese-first-presentation-foundation-v01');
assert.ok(foundationFreeze, 'PR #173 foundation freeze remains in history');
assert.equal(foundationFreeze.metadata.baseMain, '27d6c537f55a223afbd58311d0366cdadd3f8dc0', 'foundation freeze retains its original base main');
assert.equal(foundationFreeze.metadata.purpose, 'PR #173 Japanese-first presentation foundation approved final artifacts', 'foundation freeze retains its purpose');
assert.equal(
  createHash('sha256').update(JSON.stringify(Object.fromEntries(expectedArtifactPaths.map(path => [path, foundationFreeze.sha256ByPath[path]])))).digest('hex'),
  '926308c93a170814b821d823ad2a636957a463e77659cdead8841928c38f15e6',
  'foundation path and SHA history is byte-for-byte unchanged',
);
const batch1Freeze = freezes.find(freeze => freeze.version === 'japanese-first-copy-batch1-v01');
assert.ok(batch1Freeze, 'PR #174 Batch 1 artifact freeze remains in history');
const foundationToBatch1ChangedPaths = expectedArtifactPaths.filter(path => batch1Freeze.sha256ByPath[path] !== foundationFreeze.sha256ByPath[path]);
const fixedBatch1ArtifactPaths = fixedBatch1CompanyIds.map(companyId => `${companyId}/index.html`).sort();
assert.deepEqual(foundationToBatch1ChangedPaths, fixedBatch1ArtifactPaths, 'foundation-to-Batch-1 artifact changes remain exactly the fixed 50 companies');
assert.equal(batch1Freeze.sha256ByPath['index.html'], foundationFreeze.sha256ByPath['index.html'], 'Batch 1 Evidence shell SHA remains at the foundation value');
const batch2Freeze = freezes.find(freeze => freeze.version === 'japanese-first-copy-batch2-v01');
assert.ok(batch2Freeze, 'PR #175 Batch 2 artifact freeze remains in history');
const batch1ToBatch2ChangedPaths = expectedArtifactPaths.filter(path => batch2Freeze.sha256ByPath[path] !== batch1Freeze.sha256ByPath[path]);
const fixedBatch2ChangedArtifactPaths = fixedBatch2CompanyIds
  .filter(companyId => companyId !== 'ajinomoto-fine-techno')
  .map(companyId => `${companyId}/index.html`)
  .sort();
assert.deepEqual(batch1ToBatch2ChangedPaths, fixedBatch2ChangedArtifactPaths, 'Batch 1-to-Batch 2 artifact changes are exactly the 49 candidate-bearing companies');
assert.equal(batch2Freeze.sha256ByPath['index.html'], batch1Freeze.sha256ByPath['index.html'], 'Batch 2 Evidence shell SHA remains at the Batch 1 value');
for (const companyId of fixedBatch1CompanyIds) {
  const path = `${companyId}/index.html`;
  assert.equal(batch2Freeze.sha256ByPath[path], batch1Freeze.sha256ByPath[path], `${companyId}: Batch 1 asset SHA is unchanged`);
}
assert.equal(
  batch2Freeze.sha256ByPath['ajinomoto-fine-techno/index.html'],
  batch1Freeze.sha256ByPath['ajinomoto-fine-techno/index.html'],
  'Ajinomoto Fine-Techno asset SHA is unchanged',
);
assert.equal(batch1ToBatch2ChangedPaths.length, 49, 'all and only candidate-bearing Batch 2 company assets receive new SHA values');
const mobileTrackingFreeze = freezes.find(freeze => freeze.version === 'company-compare-mobile-tracking-p1-v01');
assert.ok(mobileTrackingFreeze, 'Mobile Compare P1 artifact freeze remains in history');
assert.equal(mobileTrackingFreeze.metadata.baseMain, '178ea4f5f0b8d59b1dcf6e8a24dc363c80774ec8', 'mobile tracking freeze retains its approved base main');
const batch2ToMobileTrackingChangedPaths = expectedArtifactPaths.filter(path => mobileTrackingFreeze.sha256ByPath[path] !== batch2Freeze.sha256ByPath[path]);
assert.deepEqual(batch2ToMobileTrackingChangedPaths, ['index.html'], 'the CSS-only P1 freeze changes the Evidence shell and no Company asset');
for (const path of expectedArtifactPaths.filter(path => path !== 'index.html')) {
  assert.equal(mobileTrackingFreeze.sha256ByPath[path], batch2Freeze.sha256ByPath[path], `${path}: mobile tracking leaves Company asset SHA unchanged`);
}

const drawerPresentationFreeze = freezes.find(freeze => freeze.version === 'drawer-presentation-consistency-v01');
assert.ok(drawerPresentationFreeze, 'drawer presentation consistency freeze remains in history');
assert.equal(drawerPresentationFreeze.metadata.baseMain, 'f13605c375f030e88b6374ed439f7721c4921e69', 'drawer presentation freeze records its approved base main');
assert.equal(drawerPresentationFreeze.metadata.previousVersion, mobileTrackingFreeze.version, 'drawer presentation freeze records its predecessor explicitly');
const mobileTrackingToDrawerChangedPaths = expectedArtifactPaths.filter(path => drawerPresentationFreeze.sha256ByPath[path] !== mobileTrackingFreeze.sha256ByPath[path]);
const expectedDrawerPresentationChangedPaths = expectedArtifactPaths.filter(path => path !== 'index.html' && path !== 'ajinomoto-fine-techno/index.html');
assert.deepEqual(mobileTrackingToDrawerChangedPaths, expectedDrawerPresentationChangedPaths, 'drawer presentation changes all and only assets with registered Claim presentation overlays');
assert.equal(drawerPresentationFreeze.sha256ByPath['index.html'], mobileTrackingFreeze.sha256ByPath['index.html'], 'drawer presentation leaves the Evidence shell SHA unchanged');
assert.equal(drawerPresentationFreeze.sha256ByPath['ajinomoto-fine-techno/index.html'], mobileTrackingFreeze.sha256ByPath['ajinomoto-fine-techno/index.html'], 'Ajinomoto Fine-Techno canonical fallback asset SHA remains unchanged');
assert.equal(mobileTrackingToDrawerChangedPaths.length, 99, 'drawer presentation changes exactly the 99 companies with Claim overlays');

const p2Freeze = freezes.find(freeze => freeze.version === 'japanese-first-copy-p2-v01');
assert.ok(p2Freeze, 'P2 copy freeze remains in history');
assert.equal(p2Freeze.previousVersion, drawerPresentationFreeze.version, 'P2 freeze records the drawer freeze predecessor explicitly');
assert.equal(p2Freeze.metadata.baseMain, '46f3aceca5c793cd269197cada3788c97a84b04b', 'P2 freeze records the audited main');
const drawerToP2ChangedPaths = expectedArtifactPaths.filter(path => p2Freeze.sha256ByPath[path] !== drawerPresentationFreeze.sha256ByPath[path]);
assert.deepEqual(drawerToP2ChangedPaths, p2Audit.changedArtifactPaths, 'P2 freeze changes exactly the independently recorded projected asset paths');
assert.equal(drawerToP2ChangedPaths.length, 32, 'P2 copy fixes change exactly 32 serialized Company Compare assets');
assert.equal(p2Freeze.sha256ByPath['index.html'], drawerPresentationFreeze.sha256ByPath['index.html'], 'P2 copy changes leave the Evidence shell SHA unchanged');
assert.equal(p2Audit.unchangedTargetAssetProjectionProof.length, 10, 'ten P2 target companies have no affected fields serialized into their Company Compare asset');
for (const proof of p2Audit.unchangedTargetAssetProjectionProof) {
  assert.ok(p2Audit.targetCompanyIds.includes(proof.companyId), `${proof.companyId}: non-projected asset proof belongs to a P2 target`);
  assert.ok(proof.stableKeys.length > 0, `${proof.companyId}: non-projected asset proof identifies stable keys`);
  assert.equal(p2Freeze.sha256ByPath[`${proof.companyId}/index.html`], drawerPresentationFreeze.sha256ByPath[`${proof.companyId}/index.html`], `${proof.companyId}: non-projected Company Compare asset remains byte-identical`);
}

const corningAppliedFreeze = freezes.find(freeze => freeze.version === corningAppliedPresentation.version);
assert.ok(corningAppliedFreeze, 'the Corning and Applied Materials presentation freeze remains in history');
assert.equal(corningAppliedFreeze.previousVersion, p2Freeze.version, 'the Corning and Applied Materials freeze records its P2 predecessor explicitly');
assert.equal(corningAppliedFreeze.metadata.baseMain, corningAppliedPresentation.baseMain, 'the Corning and Applied Materials freeze records its audited main');
const p2ToCorningAppliedChangedPaths = expectedArtifactPaths.filter(path => corningAppliedFreeze.sha256ByPath[path] !== p2Freeze.sha256ByPath[path]);
assert.deepEqual(p2ToCorningAppliedChangedPaths, corningAppliedPresentation.expectedChangedArtifactPaths, 'the new freeze changes exactly Corning and Applied Materials assets');
assert.equal(p2ToCorningAppliedChangedPaths.length, 2, 'only the two approved company assets receive new SHA values');
assert.equal(corningAppliedFreeze.sha256ByPath['index.html'], p2Freeze.sha256ByPath['index.html'], 'the Corning and Applied Materials refinement leaves the Evidence shell SHA unchanged');
for (const path of expectedArtifactPaths.filter(path => !corningAppliedPresentation.expectedChangedArtifactPaths.includes(path))) {
  assert.equal(corningAppliedFreeze.sha256ByPath[path], p2Freeze.sha256ByPath[path], `${path}: non-target artifact SHA remains byte-identical`);
}
assert.equal(corningAppliedFreeze.metadata.expectedChangedCompanyAssetCount, 2, 'the Corning and Applied Materials freeze records exactly two changed company assets');
assert.equal(corningAppliedFreeze.metadata.shellMustMatchPrevious, true, 'the Corning and Applied Materials freeze requires the shell to match P2');
assert.equal(corningAppliedFreeze.metadata.shaMismatchFallbackAllowed, false, 'the Corning and Applied Materials freeze forbids SHA mismatch fallback');

const githubPagesBaseDeterminism = fixture.githubPagesBaseDeterminism;
assert.ok(githubPagesBaseDeterminism && typeof githubPagesBaseDeterminism === 'object', 'GitHub Pages base determinism audit contract is present');
const financialHistorySixPeriodCoverage = fixture.financialHistorySixPeriodCoverage;
assert.ok(financialHistorySixPeriodCoverage && typeof financialHistorySixPeriodCoverage === 'object', 'financial-history six-period coverage freeze contract is present');
const financialHistorySixPeriodCoverageV02 = fixture.financialHistorySixPeriodCoverageV02;
assert.ok(financialHistorySixPeriodCoverageV02 && typeof financialHistorySixPeriodCoverageV02 === 'object', 'financial-history v02 freeze contract is present');
const financialHistorySixPeriodCoverageV03 = fixture.financialHistorySixPeriodCoverageV03;
assert.ok(financialHistorySixPeriodCoverageV03 && typeof financialHistorySixPeriodCoverageV03 === 'object', 'financial-history v03 freeze contract is present');
const financialHistorySixPeriodCoverageV04 = fixture.financialHistorySixPeriodCoverageV04;
assert.ok(financialHistorySixPeriodCoverageV04 && typeof financialHistorySixPeriodCoverageV04 === 'object', 'financial-history v04 freeze contract is present');
const financialHistorySixPeriodCoverageV05 = fixture.financialHistorySixPeriodCoverageV05;
assert.ok(financialHistorySixPeriodCoverageV05 && typeof financialHistorySixPeriodCoverageV05 === 'object', 'financial-history v05 freeze contract is present');
const financialHistorySixPeriodCoverageV06 = fixture.financialHistorySixPeriodCoverageV06;
assert.ok(financialHistorySixPeriodCoverageV06 && typeof financialHistorySixPeriodCoverageV06 === 'object', 'financial-history v06 freeze contract is present');
assert.equal(freezes.length, 14, 'fixture contains the thirteen preserved freezes plus the financial-history v06 successor');
assert.equal(githubPagesBaseDeterminism.version, 'github-pages-base-determinism-v01', 'GitHub Pages base determinism audit records its explicit version');
assert.equal(githubPagesBaseDeterminism.predecessorVersion, corningAppliedFreeze.version, 'GitHub Pages base determinism audit records its immediate predecessor');
const githubPagesBaseFreeze = freezes.find(freeze => freeze.version === githubPagesBaseDeterminism.version);
assert.ok(githubPagesBaseFreeze, 'GitHub Pages base determinism freeze remains in history');
assert.equal(githubPagesBaseFreeze.previousVersion, corningAppliedFreeze.version, 'GitHub Pages base determinism freeze records its predecessor explicitly');
assert.equal(githubPagesBaseFreeze.metadata.baseMain, githubPagesBaseDeterminism.baseMain, 'GitHub Pages base determinism freeze records the audited main');
assert.equal(githubPagesBaseFreeze.metadata.base, '/ai-infrastructure-atlas', 'GitHub Pages base determinism freeze fixes the repository base');
assert.equal(githubPagesBaseFreeze.metadata.site, 'https://Kei-Titanda-22.github.io', 'GitHub Pages base determinism freeze preserves the origin');
assert.equal(githubPagesBaseFreeze.metadata.shaMismatchFallbackAllowed, false, 'GitHub Pages base determinism freeze forbids SHA mismatch fallback');
const corningAppliedToBaseDeterminismChangedPaths = expectedArtifactPaths.filter(path => githubPagesBaseFreeze.sha256ByPath[path] !== corningAppliedFreeze.sha256ByPath[path]);
assert.deepEqual(corningAppliedToBaseDeterminismChangedPaths, expectedArtifactPaths, 'the GitHub Pages base correction changes every serialized artifact URL deterministically');
assert.equal(corningAppliedToBaseDeterminismChangedPaths.length, 101, 'the successor changes all and only the 101 frozen artifacts');
const shaMapDigest = freeze => createHash('sha256').update(JSON.stringify(Object.fromEntries(expectedArtifactPaths.map(path => [path, freeze.sha256ByPath[path]])))).digest('hex');
assert.equal(shaMapDigest(githubPagesBaseFreeze), githubPagesBaseDeterminism.linuxRawShaMapDigest, 'the GitHub Pages base map exactly matches the independently recorded Ubuntu raw SHA map');
assert.equal(shaMapDigest(corningAppliedFreeze), githubPagesBaseDeterminism.repositoryBaseNormalizedShaMapDigest, 'the predecessor map is preserved as the repository-base-normalized map');
assert.equal(githubPagesBaseDeterminism.expectedChangedArtifactCount, 101, 'the audit records the exact successor change count');
assert.equal(githubPagesBaseDeterminism.base, '/ai-infrastructure-atlas', 'the audit records the deterministic GitHub Pages base');
assert.equal(githubPagesBaseDeterminism.site, 'https://Kei-Titanda-22.github.io', 'the audit records the deterministic GitHub Pages site origin');
assert.match(githubPagesBaseDeterminism.semanticFingerprintMapDigest, /^[a-f0-9]{64}$/, 'the audit records the URL-independent semantic fingerprint digest');

const financialHistoryFreeze = freezes.find(freeze => freeze.version === financialHistorySixPeriodCoverage.version);
assert.ok(financialHistoryFreeze, 'financial-history six-period coverage freeze is present');
assert.equal(financialHistoryFreeze.version, financialHistorySixPeriodCoverage.version, 'the financial-history v01 freeze remains in history');
assert.equal(financialHistoryFreeze.previousVersion, githubPagesBaseFreeze.version, 'financial-history freeze records the GitHub Pages base freeze predecessor explicitly');
assert.equal(financialHistoryFreeze.metadata.baseMain, financialHistorySixPeriodCoverage.baseMain, 'financial-history freeze records its audited main');
assert.equal(financialHistoryFreeze.metadata.shaMismatchFallbackAllowed, false, 'financial-history freeze forbids SHA mismatch fallback');
assert.equal(financialHistoryFreeze.metadata.shellMustMatchPrevious, true, 'financial-history freeze preserves the Evidence shell byte-for-byte');
assert.equal(financialHistoryFreeze.metadata.expectedChangedCompanyAssetCount, financialHistorySixPeriodCoverage.expectedChangedArtifactCount, 'financial-history freeze records its intended changed Company assets');
assert.equal(financialHistoryFreeze.metadata.expectedUnchangedArtifactCount, financialHistorySixPeriodCoverage.expectedUnchangedArtifactCount, 'financial-history freeze records its unchanged artifacts');
const financialHistoryChangedPaths = expectedArtifactPaths.filter(path => financialHistoryFreeze.sha256ByPath[path] !== githubPagesBaseFreeze.sha256ByPath[path]);
assert.deepEqual(financialHistoryChangedPaths, financialHistorySixPeriodCoverage.expectedChangedArtifactPaths, 'financial-history successor changes all and only the twelve intended Company assets');
assert.equal(financialHistoryChangedPaths.length, 12, 'financial-history successor changes exactly twelve Company assets');
assert.equal(financialHistoryFreeze.sha256ByPath['index.html'], githubPagesBaseFreeze.sha256ByPath['index.html'], 'financial-history successor leaves the Evidence shell byte-identical');
for (const path of expectedArtifactPaths.filter(path => !financialHistorySixPeriodCoverage.expectedChangedArtifactPaths.includes(path))) {
  assert.equal(financialHistoryFreeze.sha256ByPath[path], githubPagesBaseFreeze.sha256ByPath[path], `${path}: non-financial artifact remains byte-identical`);
}
assert.equal(shaMapDigest(financialHistoryFreeze), financialHistoryFreeze.metadata.shaMapDigest, 'financial-history successor records the reproducible 101-path SHA map digest');
assert.deepEqual(
  financialHistorySixPeriodCoverage.allowedSemanticChangeFields,
  ['financial-period-rows', 'financial-metric-values', 'financial-period-labels', 'financial-verification-status', 'financial-primary-source-references', 'financial-unit-and-accounting-basis'],
  'financial-history successor allowlists only financial presentation fields',
);
const financialHistoryFreezeV02 = freezes.find(freeze => freeze.version === financialHistorySixPeriodCoverageV02.version);
assert.ok(financialHistoryFreezeV02, 'financial-history v02 successor freeze is present');
assert.equal(financialHistoryFreezeV02.previousVersion, financialHistoryFreeze.version, 'v02 records the v01 predecessor');
assert.equal(financialHistoryFreezeV02.metadata.baseMain, financialHistorySixPeriodCoverageV02.baseMain, 'v02 records its audited main');
assert.equal(financialHistoryFreezeV02.metadata.shaMismatchFallbackAllowed, false, 'v02 rejects SHA fallback');
assert.equal(financialHistoryFreezeV02.metadata.shellMustMatchPrevious, true, 'v02 preserves the Evidence shell');
assert.equal(financialHistoryFreezeV02.metadata.expectedChangedCompanyAssetCount, financialHistorySixPeriodCoverageV02.expectedChangedArtifactCount, 'v02 fixes the changed company count');
assert.equal(financialHistoryFreezeV02.metadata.expectedUnchangedArtifactCount, financialHistorySixPeriodCoverageV02.expectedUnchangedArtifactCount, 'v02 fixes the unchanged artifact count');
const financialHistoryV02ChangedPaths = expectedArtifactPaths.filter(path => financialHistoryFreezeV02.sha256ByPath[path] !== financialHistoryFreeze.sha256ByPath[path]);
assert.deepEqual(financialHistoryV02ChangedPaths, financialHistorySixPeriodCoverageV02.expectedChangedArtifactPaths, 'v02 changes only the six new financial company assets');
assert.equal(financialHistoryV02ChangedPaths.length, 6, 'v02 changes exactly six assets');
assert.equal(financialHistoryFreezeV02.sha256ByPath['index.html'], financialHistoryFreeze.sha256ByPath['index.html'], 'v02 preserves the Evidence shell byte-for-byte');
for (const path of expectedArtifactPaths.filter(path => !financialHistoryV02ChangedPaths.includes(path))) {
  assert.equal(financialHistoryFreezeV02.sha256ByPath[path], financialHistoryFreeze.sha256ByPath[path], `${path}: v02 leaves non-target artifact byte-identical`);
}
assert.equal(shaMapDigest(financialHistoryFreezeV02), financialHistoryFreezeV02.metadata.shaMapDigest, 'v02 records the reproducible SHA map digest');
const financialHistoryFreezeV03 = freezes.find(freeze => freeze.version === financialHistorySixPeriodCoverageV03.version);
assert.ok(financialHistoryFreezeV03, 'financial-history v03 successor freeze is present');
assert.equal(financialHistoryFreezeV03.previousVersion, financialHistoryFreezeV02.version, 'v03 records the v02 predecessor');
assert.equal(financialHistoryFreezeV03.metadata.baseMain, financialHistorySixPeriodCoverageV03.baseMain, 'v03 records its audited main');
assert.equal(financialHistoryFreezeV03.metadata.shaMismatchFallbackAllowed, false, 'v03 rejects SHA fallback');
assert.equal(financialHistoryFreezeV03.metadata.shellMustMatchPrevious, true, 'v03 preserves the Evidence shell');
assert.equal(financialHistoryFreezeV03.metadata.expectedChangedCompanyAssetCount, financialHistorySixPeriodCoverageV03.expectedChangedArtifactCount, 'v03 fixes the changed company count');
assert.equal(financialHistoryFreezeV03.metadata.expectedUnchangedArtifactCount, financialHistorySixPeriodCoverageV03.expectedUnchangedArtifactCount, 'v03 fixes the unchanged artifact count');
const financialHistoryV03ChangedPaths = expectedArtifactPaths.filter(path => financialHistoryFreezeV03.sha256ByPath[path] !== financialHistoryFreezeV02.sha256ByPath[path]);
assert.deepEqual(financialHistoryV03ChangedPaths, financialHistorySixPeriodCoverageV03.expectedChangedArtifactPaths, 'v03 changes only the five new financial company assets');
assert.equal(financialHistoryV03ChangedPaths.length, 5, 'v03 changes exactly five assets');
assert.equal(financialHistoryFreezeV03.sha256ByPath['index.html'], financialHistoryFreezeV02.sha256ByPath['index.html'], 'v03 preserves the Evidence shell byte-for-byte');
for (const path of expectedArtifactPaths.filter(path => !financialHistoryV03ChangedPaths.includes(path))) {
  assert.equal(financialHistoryFreezeV03.sha256ByPath[path], financialHistoryFreezeV02.sha256ByPath[path], `${path}: v03 leaves non-target artifact byte-identical`);
}
assert.equal(shaMapDigest(financialHistoryFreezeV03), financialHistoryFreezeV03.metadata.shaMapDigest, 'v03 records the reproducible SHA map digest');
const financialHistoryFreezeV04 = freezes.find(freeze => freeze.version === financialHistorySixPeriodCoverageV04.version);
assert.ok(financialHistoryFreezeV04, 'financial-history v04 successor freeze is present');
assert.ok(freezes.some(freeze => freeze.version === financialHistoryFreezeV04.version), 'the v04 freeze remains immutable in history');
assert.equal(financialHistoryFreezeV04.previousVersion, financialHistoryFreezeV03.version, 'v04 records the v03 predecessor');
assert.equal(financialHistoryFreezeV04.metadata.baseMain, financialHistorySixPeriodCoverageV04.baseMain, 'v04 records its audited main');
assert.equal(financialHistoryFreezeV04.metadata.shaMismatchFallbackAllowed, false, 'v04 rejects SHA fallback');
assert.equal(financialHistoryFreezeV04.metadata.shellMustMatchPrevious, true, 'v04 preserves the Evidence shell');
assert.equal(financialHistoryFreezeV04.metadata.expectedChangedCompanyAssetCount, financialHistorySixPeriodCoverageV04.expectedChangedArtifactCount, 'v04 fixes the changed company count');
assert.equal(financialHistoryFreezeV04.metadata.expectedUnchangedArtifactCount, financialHistorySixPeriodCoverageV04.expectedUnchangedArtifactCount, 'v04 fixes the unchanged artifact count');
const financialHistoryV04ChangedPaths = expectedArtifactPaths.filter(path => financialHistoryFreezeV04.sha256ByPath[path] !== financialHistoryFreezeV03.sha256ByPath[path]);
assert.deepEqual(financialHistoryV04ChangedPaths, financialHistorySixPeriodCoverageV04.expectedChangedArtifactPaths, 'v04 changes only the five new financial company assets');
assert.equal(financialHistoryV04ChangedPaths.length, 5, 'v04 changes exactly five assets');
assert.equal(financialHistoryFreezeV04.sha256ByPath['index.html'], financialHistoryFreezeV03.sha256ByPath['index.html'], 'v04 preserves the Evidence shell byte-for-byte');
for (const path of expectedArtifactPaths.filter(path => !financialHistoryV04ChangedPaths.includes(path))) {
  assert.equal(financialHistoryFreezeV04.sha256ByPath[path], financialHistoryFreezeV03.sha256ByPath[path], `${path}: v04 leaves non-target artifact byte-identical`);
}
assert.equal(shaMapDigest(financialHistoryFreezeV04), financialHistoryFreezeV04.metadata.shaMapDigest, 'v04 records the reproducible SHA map digest');
const financialHistoryFreezeV05 = freezes.find(freeze => freeze.version === financialHistorySixPeriodCoverageV05.version);
assert.ok(financialHistoryFreezeV05, 'financial-history v05 successor freeze is present');
assert.ok(freezes.some(freeze => freeze.version === financialHistoryFreezeV05.version), 'v05 remains immutable in the freeze history');
assert.equal(financialHistoryFreezeV05.previousVersion, financialHistoryFreezeV04.version, 'v05 records the v04 predecessor');
assert.equal(financialHistoryFreezeV05.metadata.baseMain, financialHistorySixPeriodCoverageV05.baseMain, 'v05 records its audited main');
assert.equal(financialHistoryFreezeV05.metadata.shaMismatchFallbackAllowed, false, 'v05 rejects SHA fallback');
assert.equal(financialHistoryFreezeV05.metadata.shellMustMatchPrevious, true, 'v05 preserves the Evidence shell');
assert.equal(financialHistoryFreezeV05.metadata.expectedChangedCompanyAssetCount, financialHistorySixPeriodCoverageV05.expectedChangedArtifactCount, 'v05 fixes the changed company count');
assert.equal(financialHistoryFreezeV05.metadata.expectedUnchangedArtifactCount, financialHistorySixPeriodCoverageV05.expectedUnchangedArtifactCount, 'v05 fixes the unchanged artifact count');
const financialHistoryV05ChangedPaths = expectedArtifactPaths.filter(path => financialHistoryFreezeV05.sha256ByPath[path] !== financialHistoryFreezeV04.sha256ByPath[path]);
assert.deepEqual(financialHistoryV05ChangedPaths, financialHistorySixPeriodCoverageV05.expectedChangedArtifactPaths, 'v05 changes only the five new financial company assets');
assert.equal(financialHistoryV05ChangedPaths.length, 5, 'v05 changes exactly five assets');
assert.equal(financialHistoryFreezeV05.sha256ByPath['index.html'], financialHistoryFreezeV04.sha256ByPath['index.html'], 'v05 preserves the Evidence shell byte-for-byte');
for (const path of expectedArtifactPaths.filter(path => !financialHistoryV05ChangedPaths.includes(path))) {
  assert.equal(financialHistoryFreezeV05.sha256ByPath[path], financialHistoryFreezeV04.sha256ByPath[path], `${path}: v05 leaves non-target artifact byte-identical`);
}
assert.equal(shaMapDigest(financialHistoryFreezeV05), financialHistoryFreezeV05.metadata.shaMapDigest, 'v05 records the reproducible SHA map digest');
const financialHistoryFreezeV06 = freezes.find(freeze => freeze.version === financialHistorySixPeriodCoverageV06.version);
assert.ok(financialHistoryFreezeV06, 'financial-history v06 successor freeze is present');
assert.equal(activeFreeze.version, financialHistoryFreezeV06.version, 'the explicit active ID selects the financial-history v06 freeze');
assert.equal(financialHistoryFreezeV06.previousVersion, financialHistoryFreezeV05.version, 'v06 records the v05 predecessor');
assert.equal(financialHistoryFreezeV06.metadata.baseMain, financialHistorySixPeriodCoverageV06.baseMain, 'v06 records its audited main');
assert.equal(financialHistoryFreezeV06.metadata.shaMismatchFallbackAllowed, false, 'v06 rejects SHA fallback');
assert.equal(financialHistoryFreezeV06.metadata.shellMustMatchPrevious, true, 'v06 preserves the Evidence shell');
assert.equal(financialHistoryFreezeV06.metadata.expectedChangedCompanyAssetCount, financialHistorySixPeriodCoverageV06.expectedChangedArtifactCount, 'v06 fixes the changed company count');
assert.equal(financialHistoryFreezeV06.metadata.expectedUnchangedArtifactCount, financialHistorySixPeriodCoverageV06.expectedUnchangedArtifactCount, 'v06 fixes the unchanged artifact count');
const financialHistoryV06ChangedPaths = expectedArtifactPaths.filter(path => financialHistoryFreezeV06.sha256ByPath[path] !== financialHistoryFreezeV05.sha256ByPath[path]);
assert.deepEqual(financialHistoryV06ChangedPaths, financialHistorySixPeriodCoverageV06.expectedChangedArtifactPaths, 'v06 changes only the two new financial company assets');
assert.equal(financialHistoryV06ChangedPaths.length, 2, 'v06 changes exactly two assets');
assert.equal(financialHistoryFreezeV06.sha256ByPath['index.html'], financialHistoryFreezeV05.sha256ByPath['index.html'], 'v06 preserves the Evidence shell byte-for-byte');
for (const path of expectedArtifactPaths.filter(path => !financialHistoryV06ChangedPaths.includes(path))) {
  assert.equal(financialHistoryFreezeV06.sha256ByPath[path], financialHistoryFreezeV05.sha256ByPath[path], `${path}: v06 leaves non-target artifact byte-identical`);
}
assert.equal(shaMapDigest(financialHistoryFreezeV06), financialHistoryFreezeV06.metadata.shaMapDigest, 'v06 records the reproducible SHA map digest');
const astroConfigSource = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
assert.match(astroConfigSource, /normalizeBasePath\(process\.env\.BASE_PATH \|\| \(isUserSite \? '\/' : `\/\$\{repo\}`\)\)/, 'Astro config selects the repository base without a CI-specific branch');
assert.doesNotMatch(astroConfigSource, /GITHUB_ACTIONS/, 'Astro config has no GITHUB_ACTIONS base-path branch');
assert.match(astroConfigSource, /const site = process\.env\.SITE_URL \|\| `https:\/\/\$\{owner\}\.github\.io`;/, 'Astro config has a deterministic GitHub Pages origin');

const historicalArtifactFreezeDigests = {
  'japanese-first-presentation-foundation-v01': '926308c93a170814b821d823ad2a636957a463e77659cdead8841928c38f15e6',
  'japanese-first-copy-batch1-v01': '3e3930cc9035db024f4cf9c166e417789d2a082fc9a0ae6b340bbdd729608110',
  'japanese-first-copy-batch2-v01': '656223a64ee8916c9371b302719d101c1a46c599b34a31ba5cb7d7ac04759a41',
  'company-compare-mobile-tracking-p1-v01': 'f752009976fb966fb053b10bfc67412d502936a6433dc12b67c3acd22d82ddeb',
  'drawer-presentation-consistency-v01': '5474e44982c7c690cf2cc11251ec78d9463f6533841a387edbc6ae9f14c99099',
  'japanese-first-copy-p2-v01': 'eac22c9305ba01cffb7b2b963f57adcd55b64c7d13690a8e87d1833d9451db19',
  'corning-applied-materials-presentation-v01': '77dd0b26993c293847701a86e855b1861fbaec28236437aefb119cda5e94ffb2',
  'github-pages-base-determinism-v01': 'f643f29012ce91a33028a03a2e6b66fd13d6ce55e49cf52c9848f461aa12f071',
  'financial-history-six-period-coverage-v01': '9db7fbfe250a417c46926a7db04a29ad8e32d4bf12ff2a65a75f96de37c29848',
  'financial-history-six-period-coverage-v02': '8030bf7cfbfda3d01ef3c8b919708d2d16cdf15002e1265906446f3a9603192c',
};
for (const [version, expectedDigest] of Object.entries(historicalArtifactFreezeDigests)) {
  const freeze = freezes.find(candidate => candidate.version === version);
  assert.ok(freeze, `${version}: historical artifact freeze remains present`);
  assert.equal(
    createHash('sha256').update(JSON.stringify(Object.fromEntries(expectedArtifactPaths.map(path => [path, freeze.sha256ByPath[path]])))).digest('hex'),
    expectedDigest,
    `${version}: historical 101-path SHA map remains byte-equivalent`,
  );
}

const shaBlocks = [...fixtureSource.matchAll(/"sha256ByPath"\s*:\s*\{([\s\S]*?)\n\s{4}\}/g)];
assert.equal(shaBlocks.length, 14, 'fixture source contains thirteen preserved history maps plus the financial-history v06 SHA map');
for (const [index, block] of shaBlocks.entries()) {
  const rawPaths = [...block[1].matchAll(/^\s*"([^"]+)"\s*:/gm)].map(match => match[1]);
  assert.equal(rawPaths.length, 101, `freeze ${index}: raw JSON contains 101 paths`);
  assert.equal(new Set(rawPaths).size, rawPaths.length, `freeze ${index}: raw JSON has no duplicate path key`);
}
assert.throws(() => validateShaEntries([...Object.entries(activeFreeze.sha256ByPath), Object.entries(activeFreeze.sha256ByPath)[0]]), /duplicated/, 'duplicate artifact paths reject');

for (const mutate of [
  value => { delete value.activeArtifactFreezeVersion; },
  value => { value.activeArtifactFreezeVersion = ''; },
  value => { value.activeArtifactFreezeVersion = 7; },
  value => { value.activeArtifactFreezeVersion = 'unknown-version'; },
  value => { value.artifactFreezes.push(structuredClone(value.artifactFreezes[0])); },
  value => { value.artifactFreezes.find(freeze => freeze.version === value.activeArtifactFreezeVersion).sha256ByPath['index.html'] = 'not-a-sha'; },
  value => { delete value.artifactFreezes.find(freeze => freeze.version === value.activeArtifactFreezeVersion).sha256ByPath['index.html']; },
  value => { value.artifactFreezes.find(freeze => freeze.version === value.activeArtifactFreezeVersion).sha256ByPath['unexpected/index.html'] = '0'.repeat(64); },
  value => {
    const active = value.artifactFreezes.find(freeze => freeze.version === value.activeArtifactFreezeVersion);
    active.sha256ByPath = Object.fromEntries(Object.entries(active.sha256ByPath).reverse());
  },
]) {
  const invalid = structuredClone(fixture);
  mutate(invalid);
  assert.throws(() => validateFreezeFixture(invalid), 'invalid active-version or SHA fixture fails closed');
}

const evidenceTestSource = readFileSync(new URL('./test-company-compare-evidence-ui.mjs', import.meta.url), 'utf8');
const freezeSelectionSource = evidenceTestSource.slice(
  evidenceTestSource.indexOf('const selectActiveArtifactFreeze'),
  evidenceTestSource.indexOf('const resolveArtifactSizeBaseline'),
);
const distFreezeSource = evidenceTestSource.slice(
  evidenceTestSource.indexOf("const artifactRoot = 'evidence-fragments/company-compare-evidence-v01'"),
  evidenceTestSource.indexOf('const compareBytes = Buffer.byteLength(compareHtml)'),
);
assert.match(freezeSelectionSource, /activeArtifactFreezeVersion/, 'Evidence test selects the explicit active version ID');
assert.match(freezeSelectionSource, /matches\.length, 1/, 'Evidence test requires the active ID to resolve exactly once');
assert.doesNotMatch(`${freezeSelectionSource}\n${distFreezeSource}`, /process\.env|\.at\(-1\)|\[.*\.length\s*-\s*1\]|catch\s*\(|japanese-first-copy-batch1-v01/, 'Evidence freeze selection has no environment, ordering, fallback, or Batch 1 branch');
assert.match(distFreezeSource, /actualArtifactPaths, expectedArtifactPaths/, 'Evidence test compares the actual and expected path sets exactly');
assert.match(distFreezeSource, /createHash\('sha256'\)[\s\S]*?expectedArtifactSha256ByPath\[artifactPath\]/, 'Evidence test unconditionally compares every artifact SHA');
assert.doesNotMatch(distFreezeSource, /if\s*\([^)]*(?:sha|hash)[^)]*\)[\s\S]*?(?:marker|terminology|最終確認日)/i, 'SHA mismatch has no HTML-content fallback');
const legacyShaBlock = evidenceTestSource.match(/const frozenPilotAssetSha256 = \{([\s\S]*?)\n\s{2}\};/);
assert.ok(legacyShaBlock, 'historical pre-Japanese-first 20-company SHA map remains present');
assert.equal((legacyShaBlock[1].match(/[a-f0-9]{64}/g) ?? []).length, 20, 'historical 20-company SHA values remain intact');

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

console.log(JSON.stringify({
  status: 'PASS',
  companies: fixedBatch1CompanyIds.length + fixedBatch2CompanyIds.length,
  auditedCandidates: auditedCandidates + batch2AuditedCandidates,
  overlayEntries: batch1.entries.length + batch2.entries.length,
  batch1OverlayEntries: batch1.entries.length,
  batch2OverlayEntries: batch2.entries.length,
  unresolved: manifest.unresolvedCount,
  staleCanonicalDigests: manifest.staleCanonicalDigestCount,
  batch2ChangedArtifacts: batch1ToBatch2ChangedPaths.length,
  artifactPathsPerFreeze: expectedArtifactPaths.length,
  batch1GeneralTermReductionPercent: Number((generalTermReduction * 100).toFixed(2)),
  batch2GeneralTermReductionPercent: Number((batch2GeneralTermReduction * 100).toFixed(2)),
}, null, 2));
