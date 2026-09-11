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
assert.equal(batch2.entries.length, 159, 'Batch 2 contains the reviewed stable presentation entries');
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
  presentationEntrySha256([...batch1.entries, ...batch2.entries].find(entry => `${entry.entityType}:${entry.stableKey}` === p2Audit.reviewEntries[0].key)),
  p2Audit.reviewEntries[0].sha256,
  'Corning REVIEW presentation remains byte-equivalent',
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
assert.equal(batch1.entries.length + batch2.entries.length, 694, 'P2 copy changes preserve all 694 overlay entries');
assert.equal(manifest.auditCandidateCount, 2_487, 'P2 copy changes preserve all 2,487 audited decisions');
assert.deepEqual(manifest.stableKeys, [...batch1EntryKeys, ...batch2EntryKeys].sort(), 'P2 copy changes preserve the complete stable-key set');
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
assert.equal(overlayClaimEntries.length, 538, 'all 538 registered Claim overlays are covered by the drawer presentation contract');
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

assert.equal(activeFreeze.version, 'japanese-first-copy-p2-v01', 'the explicit active ID selects the P2 copy freeze');
assert.equal(activeFreeze.previousVersion, drawerPresentationFreeze.version, 'P2 freeze records the drawer freeze predecessor explicitly');
assert.equal(activeFreeze.metadata.baseMain, '46f3aceca5c793cd269197cada3788c97a84b04b', 'P2 freeze records the audited main');
const drawerToP2ChangedPaths = expectedArtifactPaths.filter(path => activeFreeze.sha256ByPath[path] !== drawerPresentationFreeze.sha256ByPath[path]);
assert.deepEqual(drawerToP2ChangedPaths, p2Audit.changedArtifactPaths, 'P2 freeze changes exactly the independently recorded projected asset paths');
assert.equal(drawerToP2ChangedPaths.length, 32, 'P2 copy fixes change exactly 32 serialized Company Compare assets');
assert.equal(activeFreeze.sha256ByPath['index.html'], drawerPresentationFreeze.sha256ByPath['index.html'], 'P2 copy changes leave the Evidence shell SHA unchanged');
assert.equal(p2Audit.unchangedTargetAssetProjectionProof.length, 10, 'ten P2 target companies have no affected fields serialized into their Company Compare asset');
for (const proof of p2Audit.unchangedTargetAssetProjectionProof) {
  assert.ok(p2Audit.targetCompanyIds.includes(proof.companyId), `${proof.companyId}: non-projected asset proof belongs to a P2 target`);
  assert.ok(proof.stableKeys.length > 0, `${proof.companyId}: non-projected asset proof identifies stable keys`);
  assert.equal(activeFreeze.sha256ByPath[`${proof.companyId}/index.html`], drawerPresentationFreeze.sha256ByPath[`${proof.companyId}/index.html`], `${proof.companyId}: non-projected Company Compare asset remains byte-identical`);
}

const shaBlocks = [...fixtureSource.matchAll(/"sha256ByPath"\s*:\s*\{([\s\S]*?)\n\s{4}\}/g)];
assert.equal(shaBlocks.length, 6, 'fixture source contains the foundation, Batch 1, Batch 2, mobile tracking P1, drawer presentation, and P2 SHA maps');
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
