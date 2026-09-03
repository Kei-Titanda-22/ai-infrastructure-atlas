import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import {
  allSelectedMissing,
  deriveRelationVerificationPresentation,
  evidenceComparePilotCompanyIds,
  evidenceCompareStableSections,
  financialPresentationForSelection,
  matchEvidencePilotSet,
  parseEvidenceCompareSearch,
  serializeEvidenceCompareSearch,
} from '../src/lib/company-compare-evidence-ui.ts';
import {
  evidenceCompareViewRequested,
  fetchEvidenceCompareFragment,
  mountEvidenceCompareFragment,
} from '../src/lib/company-compare-evidence-bootstrap.ts';
import {
  companyCompareAssetSchemaVersion,
  companyCompareProductPortfolioCompanyIds,
  createCompanyCompareAssetLoader,
  getCompanyCompareProductPortfolioSummaries,
  resolveCompanyCompareProductPortfolioSummary,
  resolveCompanyCompareAssetUrl,
  validateCompanyCompareAssetManifest,
  validateCompanyCompareProductPortfolioSummaries,
} from '../src/lib/company-compare-evidence-assets.ts';
import { gzipSync } from 'node:zlib';
import {
  compareClaimDisplayCopy,
  compareCompanyPresentationTokens,
  compareFinancialAccountingBasisLabels,
  compareFinancialAmountUnitLabels,
  compareGenericTermTranslations,
  compareLocationDisplayNames,
  comparePreservedProperNouns,
  compareProductDisplayDescriptions,
  compareProductIdsByClaimId,
  companyCompareDisplayName,
  companyCompareDisplayNameParts,
  companyPresentationTokenForOrder,
  dedupeCompareCanonicalItems,
  formatCompareFinancialPeriodLabel,
  localizeCompareLocation,
  resolveCompareFinancialTablePresentation,
  resolveCompareProductDisplayDescription,
  selectCompareSummaryClaimIds,
  selectCompareSummaryRelationIds,
} from '../src/lib/company-compare-display.ts';

const readJson = async relative => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
const projection = await readJson('../src/data/company-compare-evidence-pilot-v01.json');
const productRegistry = await readJson('../src/data/product-registry-v01.json');
const relations = await readJson('../src/data/relationships.json');
const relationBindings = await readJson('../src/data/relation-evidence-bindings-v01.json');
const evidenceManifest = await readJson('../src/data/company-evidence-manifest.json');
const sourceManifest = await readJson('../src/data/source-registry-manifest.json');
const fixture = await readJson('./fixtures/company-compare-evidence-ui-snapshot-v01.json');
const displayFixture = await readJson('./fixtures/company-compare-japanese-display-v01.json');
const artifactSizeBaselineFixture = await readJson('./fixtures/company-compare-artifact-size-baseline-v01.json');
const onDemandSizeFixture = await readJson('./fixtures/company-compare-on-demand-size-v01.json');

const resolveArtifactSizeBaseline = baseline => {
  assert.ok(baseline && typeof baseline === 'object' && !Array.isArray(baseline), 'artifact size baseline must be an object');
  assert.ok(Number.isSafeInteger(baseline.acceptedRawBytes) && baseline.acceptedRawBytes > 0, 'acceptedRawBytes must be a positive integer');
  assert.match(baseline.acceptedAtMainSha, /^[0-9a-f]{40}$/, 'acceptedAtMainSha must be a full lowercase commit SHA');
  assert.ok(typeof baseline.acceptedReason === 'string' && baseline.acceptedReason.trim().length > 0, 'acceptedReason must be non-empty');
  assert.equal(baseline.growthLimitRatio, 1.05, 'growthLimitRatio must remain the accepted +5% contract');
  return {
    ...baseline,
    maximumRawBytes: Math.floor(baseline.acceptedRawBytes * baseline.growthLimitRatio),
  };
};

const assertArtifactSizeWithinLimit = (rawBytes, baseline) => {
  const resolved = resolveArtifactSizeBaseline(baseline);
  assert.ok(Number.isSafeInteger(rawBytes) && rawBytes >= 0, 'artifact raw byte count must be a non-negative integer');
  assert.ok(
    rawBytes <= resolved.maximumRawBytes,
    `Evidence fragment ${rawBytes} B must stay within +5% of accepted ${resolved.acceptedRawBytes} B (${resolved.maximumRawBytes} B maximum)`,
  );
  return resolved;
};

const artifactSizeBaseline = resolveArtifactSizeBaseline(artifactSizeBaselineFixture);
const resolveOnDemandSizeContract = contract => {
  assert.ok(contract && typeof contract === 'object' && !Array.isArray(contract), 'on-demand size contract must be an object');
  assert.equal(contract.schemaVersion, '0.1', 'on-demand size contract schema is fixed');
  assert.match(contract.baselineMain, /^[0-9a-f]{40}$/, 'on-demand baselineMain must be a full SHA');
  for (const field of [
    'legacyMonolithRawBytes',
    'maximumColdLoadRawBytes',
    'maximumSetRawBytes',
    'maximumShellRawBytes',
    'maximumCompanyAssetRawBytes',
    'maximumCompanyAssetGzipBytes',
  ]) assert.ok(Number.isSafeInteger(contract[field]) && contract[field] > 0, `${field} must be a positive integer`);
  assert.equal(contract.legacyGrowthLimitRatio, 1.05, 'legacy growth ratio remains 1.05');
  assert.deepEqual(contract.companyIds, ['nvidia', 'broadcom', 'applied-materials', 'lam-research', 'tokyo-electron'], 'size contract covers exactly the Pilot five');
  assert.equal(
    Math.floor(contract.legacyMonolithRawBytes * contract.legacyGrowthLimitRatio),
    contract.maximumColdLoadRawBytes,
    'cold-load maximum is derived from the accepted legacy monolith',
  );
  return contract;
};
const assertWithinBoundary = (bytes, maximum, label) => {
  assert.ok(Number.isSafeInteger(bytes) && bytes >= 0, `${label} bytes must be a non-negative integer`);
  assert.ok(bytes <= maximum, `${label} ${bytes} B exceeds ${maximum} B`);
};
const onDemandSize = resolveOnDemandSizeContract(onDemandSizeFixture);
for (const [field, maximum] of [
  ['shell', onDemandSize.maximumShellRawBytes],
  ['company asset raw', onDemandSize.maximumCompanyAssetRawBytes],
  ['company asset gzip', onDemandSize.maximumCompanyAssetGzipBytes],
  ['cold load', onDemandSize.maximumColdLoadRawBytes],
]) {
  assert.doesNotThrow(() => assertWithinBoundary(maximum, maximum, field), `${field}: exact boundary passes`);
  assert.throws(() => assertWithinBoundary(maximum + 1, maximum, field), /exceeds/, `${field}: boundary plus one fails`);
}
for (const invalid of [null, {}, { ...onDemandSizeFixture, maximumColdLoadRawBytes: 0 }, { ...onDemandSizeFixture, maximumShellRawBytes: -1 }, { ...onDemandSizeFixture, legacyGrowthLimitRatio: 1.06 }, { ...onDemandSizeFixture, companyIds: [...onDemandSizeFixture.companyIds, 'unknown'] }]) {
  assert.throws(() => resolveOnDemandSizeContract(invalid), 'invalid on-demand size contract fails closed');
}
assert.equal(artifactSizeBaseline.acceptedRawBytes, 314_771, 'PR #158 Linux CI artifact is the accepted raw-byte baseline');
assert.equal(artifactSizeBaseline.acceptedAtMainSha, '08cdd9dde22a0ec8d2908a58750cb718ec455810', 'accepted baseline is pinned to the PR #158 merge SHA');
assert.equal(artifactSizeBaseline.acceptedReason, 'Company Compare Pilot UI v0.1 Freeze', 'accepted baseline records the Freeze decision');
assert.equal(artifactSizeBaseline.maximumRawBytes, 330_509, 'accepted baseline keeps the existing floor-based +5% limit');
assert.notEqual(artifactSizeBaseline.acceptedRawBytes, 299_685, 'pre-Freeze baseline is not active');
assert.doesNotThrow(() => assertArtifactSizeWithinLimit(artifactSizeBaseline.maximumRawBytes, artifactSizeBaselineFixture), 'artifact at the maximum passes');
assert.throws(() => assertArtifactSizeWithinLimit(artifactSizeBaseline.maximumRawBytes + 1, artifactSizeBaselineFixture), /330509 B maximum/, 'artifact one byte above the maximum fails');
assert.throws(() => resolveArtifactSizeBaseline({ ...artifactSizeBaselineFixture, acceptedRawBytes: undefined }), /acceptedRawBytes/, 'missing baseline bytes fail');
assert.throws(() => resolveArtifactSizeBaseline({ ...artifactSizeBaselineFixture, acceptedAtMainSha: undefined }), /acceptedAtMainSha/, 'missing baseline SHA fails');
for (const acceptedRawBytes of [-1, 0]) {
  assert.throws(() => resolveArtifactSizeBaseline({ ...artifactSizeBaselineFixture, acceptedRawBytes }), /acceptedRawBytes/, `baseline ${acceptedRawBytes} is rejected`);
}
for (const growthLimitRatio of [-1, 0, 1, 1.01, 1.06, Number.NaN, '1.05']) {
  assert.throws(() => resolveArtifactSizeBaseline({ ...artifactSizeBaselineFixture, growthLimitRatio }), /growthLimitRatio/, `ratio ${String(growthLimitRatio)} is rejected`);
}
const compareCashFlowOverrides = await readJson('../src/data/financial-history-v04-cashflow-overrides.json');
const compareCashFlowOverrideById = new Map(compareCashFlowOverrides.map(record => [record.id, record]));
const compareFinancialHistory = [
  ...await readJson('../src/data/financial-history.json'),
  ...await readJson('../src/data/financial-history-v04-batch2.json'),
  ...await readJson('../src/data/financial-history-v04-batch6.json'),
].map(record => {
  const override = compareCashFlowOverrideById.get(record.id);
  return override ? { ...record, ...override, metrics: { ...record.metrics, ...override.metrics } } : record;
});
const comparePage = await readFile(new URL('../src/pages/compare.astro', import.meta.url), 'utf8');
const fragmentPage = await readFile(new URL('../src/pages/evidence-fragments/company-compare-evidence-v01.astro', import.meta.url), 'utf8');
const component = await readFile(new URL('../src/components/CompanyCompareEvidence.astro', import.meta.url), 'utf8');
const companyAssetComponent = await readFile(new URL('../src/components/CompanyCompareEvidenceCompanyAsset.astro', import.meta.url), 'utf8');
const companyAssetPage = await readFile(new URL('../src/pages/evidence-fragments/company-compare-evidence-v01/[companyId].astro', import.meta.url), 'utf8');
const companyAssetLoaderSource = await readFile(new URL('../src/lib/company-compare-evidence-assets.ts', import.meta.url), 'utf8');
const presentationSource = `${component}\n${companyAssetComponent}`;
const claimComponent = await readFile(new URL('../src/components/CompanyCompareEvidenceClaim.astro', import.meta.url), 'utf8');
const controller = await readFile(new URL('../src/scripts/company-compare-evidence-ui.ts', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles/company-compare-evidence-v01.css', import.meta.url), 'utf8');
const readModelSource = await readFile(new URL('../src/lib/company-compare-evidence-read-model.ts', import.meta.url), 'utf8');
const parsedClaimTypeLabels = Object.fromEntries(
  [...claimComponent.matchAll(/^\s*(?:'([^']+)'|([a-z]+)):\s*'([^']+)',$/gm)]
    .map(match => [match[1] ?? match[2], match[3]])
    .filter(([key]) => key in displayFixture.claimTypeDisplayLabels),
);
assert.deepEqual(parsedClaimTypeLabels, displayFixture.claimTypeDisplayLabels, 'Claim type display labels are fixture-locked');
const pilotCompanyRecords = Object.fromEntries(await Promise.all(
  ['nvidia', 'broadcom', 'applied-materials', 'lam-research', 'tokyo-electron'].map(async companyId => [
    companyId,
    await readJson(`../src/data/companies/${companyId}.json`),
  ]),
));

const evidenceShards = await Promise.all(evidenceManifest.shards.map(file => readJson(`../src/data/${file}`)));
const sourceShards = await Promise.all(sourceManifest.shards.map(file => readJson(`../src/data/${file}`)));
const claims = evidenceShards.flatMap(shard => shard.claims);
const claimBindings = evidenceShards.flatMap(shard => shard.evidence);
const sources = sourceShards.flat();
const claimById = new Map(claims.map(claim => [claim.id, claim]));
const claimBindingById = new Map(claimBindings.map(binding => [binding.id, binding]));
const relationById = new Map(relations.map(relation => [relation.relationId, relation]));
const relationBindingById = new Map(relationBindings.map(binding => [binding.id, binding]));
const relationBindingsByRelation = new Map();
for (const binding of relationBindings) {
  const group = relationBindingsByRelation.get(binding.relationId) ?? [];
  group.push(binding);
  relationBindingsByRelation.set(binding.relationId, group);
}
const sourceIds = new Set(sources.map(source => source.id));
const sourceById = new Map(sources.map(source => [source.id, source]));
const companyIds = new Set(['nvidia', 'broadcom', 'applied-materials', 'lam-research', 'tokyo-electron', 'asml']);

const expectedProductPortfolioSummaries = {
  nvidia: {
    title: '演算とネットワークを横断',
    body: 'Blackwell GPU、Grace CPU、BlueField DPU、Spectrum-Xネットワークを展開する。',
    groundingId: 'nvidia-products',
    summaryVisible: false,
    expandedVisible: true,
  },
  broadcom: {
    title: '接続・演算を担う半導体群',
    body: '接続用半導体、カスタムアクセラレータASIC、Ethernetスイッチ用半導体を展開する。',
    groundingId: 'broadcom-products',
    summaryVisible: false,
    expandedVisible: true,
  },
  'applied-materials': {
    title: '材料工程を広くカバー',
    body: '材料の堆積、除去、改質、分析、デバイス接続に関わる装置・技術を展開する。',
    groundingId: 'applied-products',
    summaryVisible: false,
    expandedVisible: true,
  },
  'lam-research': {
    title: '成膜・エッチング・洗浄を横断',
    body: '成膜、エッチング、ウェーハ洗浄を中心に、複数の前工程装置を展開する。',
    groundingId: 'lam-research-products',
    summaryVisible: false,
    expandedVisible: true,
  },
  'tokyo-electron': {
    title: '前工程の主要工程を幅広くカバー',
    body: '塗布・現像、エッチング、成膜、洗浄の各工程に対応する装置を展開する。',
    groundingId: 'tokyo-electron-products',
    summaryVisible: false,
    expandedVisible: true,
  },
};
const companyCompareProductPortfolioSummaries = getCompanyCompareProductPortfolioSummaries();
assert.deepEqual([...companyCompareProductPortfolioCompanyIds], Object.keys(expectedProductPortfolioSummaries), 'Product portfolio copy contract covers the exact Pilot 5 companies');
assert.deepEqual(companyCompareProductPortfolioSummaries, expectedProductPortfolioSummaries, 'all five Product portfolio summaries are fixture-locked');
const portfolioGroundingIds = new Set(claimById.keys());
assert.doesNotThrow(
  () => validateCompanyCompareProductPortfolioSummaries(expectedProductPortfolioSummaries, portfolioGroundingIds),
  'all five Product portfolio summaries resolve to an existing Company Claim',
);
for (const companyId of companyCompareProductPortfolioCompanyIds) {
  assert.deepEqual(
    resolveCompanyCompareProductPortfolioSummary(companyId, portfolioGroundingIds),
    expectedProductPortfolioSummaries[companyId],
    `${companyId}: Product portfolio copy and visibility are deterministic`,
  );
}
const clonePortfolioSummaries = () => Object.fromEntries(Object.entries(expectedProductPortfolioSummaries).map(([id, record]) => [id, { ...record }]));
const missingPortfolio = clonePortfolioSummaries();
delete missingPortfolio.nvidia;
assert.throws(() => validateCompanyCompareProductPortfolioSummaries(missingPortfolio), /exact Pilot 5/, 'missing Pilot Company copy is rejected');
assert.throws(() => validateCompanyCompareProductPortfolioSummaries({ ...clonePortfolioSummaries(), extra: expectedProductPortfolioSummaries.nvidia }), /exact Pilot 5/, 'extra Company copy is rejected');
for (const [field, value] of [['title', ''], ['body', ''], ['groundingId', '']]) {
  const invalid = clonePortfolioSummaries();
  invalid.nvidia[field] = value;
  assert.throws(() => validateCompanyCompareProductPortfolioSummaries(invalid), /non-empty/, `empty Product portfolio ${field} is rejected`);
}
for (const genericCopy of ['製品構成', '下記の製品カテゴリを提供する。', '主な製品', '以下の製品を提供する。']) {
  const invalid = clonePortfolioSummaries();
  invalid.nvidia.title = genericCopy;
  assert.throws(() => validateCompanyCompareProductPortfolioSummaries(invalid), /prohibited generic copy/, `generic Product fallback is rejected: ${genericCopy}`);
}
for (const visibility of [{ summaryVisible: true }, { expandedVisible: false }]) {
  const invalid = clonePortfolioSummaries();
  Object.assign(invalid.nvidia, visibility);
  assert.throws(() => validateCompanyCompareProductPortfolioSummaries(invalid), /visibility contract/, 'invalid Product portfolio visibility is rejected');
}
const unknownPortfolioGrounding = clonePortfolioSummaries();
unknownPortfolioGrounding.nvidia.groundingId = 'unknown-products';
assert.throws(
  () => validateCompanyCompareProductPortfolioSummaries(unknownPortfolioGrounding, portfolioGroundingIds),
  /grounding does not resolve/,
  'unknown Product portfolio grounding is rejected',
);

assert.deepEqual(
  Object.keys(compareClaimDisplayCopy).sort(),
  displayFixture.claimDisplayIds,
  'all and only 34 projected Claims have fixed Compare display copy',
);
assert.deepEqual(compareGenericTermTranslations, displayFixture.genericTermTranslations, 'Japanese generic-term policy is fixture-locked');
assert.deepEqual(compareLocationDisplayNames, displayFixture.locationDisplayNames, 'Compare geography localization is fixture-locked');
assert.deepEqual(compareProductDisplayDescriptions, displayFixture.productDescriptions, 'Product descriptions are fixture-locked');
assert.deepEqual(compareProductIdsByClaimId, displayFixture.productIdsByClaimId, 'Claim-to-Product display mapping is fixture-locked');
assert.deepEqual(comparePreservedProperNouns, displayFixture.preservedProperNouns, 'allowed proper nouns are fixture-locked');
assert.deepEqual(compareCompanyPresentationTokens, displayFixture.presentationTokens, 'four presentation-order tokens are fixed');
const projectedClaimIds = [...new Set(projection.sets.flatMap(setRecord => setRecord.companies.flatMap(company =>
  company.dimensions.flatMap(dimension => dimension.initialClaimIds),
)))].sort();
assert.deepEqual(projectedClaimIds, displayFixture.claimDisplayIds, 'display copy coverage equals the projection Claim corpus');
const projectedClaimTypeCounts = Object.fromEntries([...projectedClaimIds.reduce((counts, claimId) => {
  const claimType = claimById.get(claimId)?.claimType;
  counts.set(claimType, (counts.get(claimType) ?? 0) + 1);
  return counts;
}, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right)));
assert.deepEqual(projectedClaimTypeCounts, displayFixture.projectedClaimTypeCounts, 'all 34 internal Claim types remain unchanged');
const productIds = productRegistry.records.map(record => record.id).sort();
assert.deepEqual(Object.keys(compareProductDisplayDescriptions).sort(), productIds, 'all and only Pilot canonical Products have descriptions');
const descriptionGroundingIds = new Set([...claimById.keys(), ...relationById.keys()]);
for (const productId of productIds) {
  const product = resolveCompareProductDisplayDescription(productId);
  const sentenceCount = (product.description.match(/[。！？]/g) ?? []).length;
  assert.ok(product.description.length <= 80, `${productId}: description is at most 80 characters`);
  assert.ok(sentenceCount >= 1 && sentenceCount <= 2, `${productId}: description is one or two sentences`);
  assert.ok(product.groundingIds.length > 0, `${productId}: description has direct grounding IDs`);
  assert.ok(product.groundingIds.every(id => descriptionGroundingIds.has(id)), `${productId}: every description grounding ID resolves`);
  assert.doesNotMatch(product.description, /優位|優れる|勝者|推奨|投資判断/, `${productId}: description contains no evaluation`);
}
const pilotDisplayedProductIds = new Set([
  ...relations.filter(relation => relation.relationType === 'PRODUCES').map(relation => relation.objectId),
  ...projectedClaimIds.flatMap(claimId => compareProductIdsByClaimId[claimId] ?? []),
]);
assert.deepEqual([...pilotDisplayedProductIds].sort(), productIds, 'Set A and Set B collectively cover every canonical Product description');
for (const claimId of projectedClaimIds) {
  const display = compareClaimDisplayCopy[claimId];
  assert.deepEqual(display.groundingIds, [claimId], `${claimId}: display sentence is deterministically grounded`);
  assert.ok(display.title.trim() && display.statement.trim(), `${claimId}: display title and statement are non-empty`);
}
for (const [claimId, expectedCopy] of Object.entries(displayFixture.riskDisplayCopy)) {
  assert.deepEqual(
    { title: compareClaimDisplayCopy[claimId].title, statement: compareClaimDisplayCopy[claimId].statement },
    expectedCopy,
    `${claimId}: risk display copy is fixture-locked`,
  );
  assert.equal(claimById.get(claimId).claimType, 'atlas-analysis', `${claimId}: internal Atlas Analysis type is unchanged`);
}
const preservedFactRisk = displayFixture.preservedFactRiskCopy;
assert.deepEqual(
  {
    claimId: preservedFactRisk.claimId,
    title: compareClaimDisplayCopy[preservedFactRisk.claimId].title,
    statement: compareClaimDisplayCopy[preservedFactRisk.claimId].statement,
  },
  preservedFactRisk,
  'NVIDIA Fact risk display copy remains unchanged',
);
assert.equal(claimById.get(preservedFactRisk.claimId).claimType, 'fact', 'NVIDIA risk remains an internal Fact');
for (const [companyId, expectedName] of Object.entries(displayFixture.companyDisplayNames)) {
  assert.equal(companyCompareDisplayName(pilotCompanyRecords[companyId]), expectedName, `${companyId}: one canonical Japanese display name`);
}
assert.equal(
  companyCompareDisplayName(pilotCompanyRecords['applied-materials']),
  'Applied Materials（アプライド・マテリアルズ）',
  'Applied Materials never mixes English-only and Japanese-only display names',
);
assert.deepEqual(
  companyCompareDisplayNameParts(pilotCompanyRecords['applied-materials']),
  {
    accessibleName: 'Applied Materials（アプライド・マテリアルズ）',
    primaryName: 'Applied Materials',
    secondaryName: '（アプライド・マテリアルズ）',
  },
  'bilingual Company names use two deterministic lines and preserve one accessible full name',
);
assert.deepEqual(
  companyCompareDisplayNameParts(pilotCompanyRecords['tokyo-electron']),
  { accessibleName: 'Tokyo Electron（東京エレクトロン）', primaryName: '東京エレクトロン', secondaryName: null },
  'Japanese-only visual Company names remain one line while the accessible name retains English and Japanese',
);
for (const companyId of displayFixture.companyIdentityLink.bilingualCompanyIds) {
  const names = companyCompareDisplayNameParts(pilotCompanyRecords[companyId]);
  assert.ok(names.secondaryName, `${companyId}: bilingual identity retains its second line`);
  assert.ok(names.accessibleName.includes(names.primaryName) && names.accessibleName.includes(names.secondaryName), `${companyId}: accessible name contains both visible lines`);
}
for (const companyId of displayFixture.companyIdentityLink.singleLineCompanyIds) {
  assert.equal(companyCompareDisplayNameParts(pilotCompanyRecords[companyId]).secondaryName, null, `${companyId}: Japanese-only primary identity stays one line`);
}
for (const [canonicalLabel, displayLabel] of Object.entries(displayFixture.financialDetailTable.periodLabels)) {
  assert.equal(formatCompareFinancialPeriodLabel(canonicalLabel), displayLabel, `${canonicalLabel}: financial period label is fixture-locked`);
}
assert.throws(() => formatCompareFinancialPeriodLabel('Calendar 2026'), /unsupported/, 'ambiguous period labels are never inferred');
for (const [companyId, expectedUnitLabel] of Object.entries(displayFixture.financialDetailTable.amountUnitByCompany)) {
  const records = compareFinancialHistory
    .filter(record => record.companyId === companyId)
    .sort((left, right) => left.endDate.localeCompare(right.endDate) || left.id.localeCompare(right.id));
  assert.equal(records.length, displayFixture.financialDetailTable.recordCountByCompany[companyId], `${companyId}: financial row count is fixture-locked`);
  const canonicalBefore = JSON.stringify(records);
  const presentation = resolveCompareFinancialTablePresentation(records);
  assert.equal(presentation.amountUnitLabel, expectedUnitLabel, `${companyId}: amount unit label`);
  assert.equal(presentation.accountingBasisLabel, displayFixture.financialDetailTable.accountingBasisByCompany[companyId], `${companyId}: accounting basis label`);
  assert.deepEqual(presentation.periodLabels, records.map(record => displayFixture.financialDetailTable.periodLabels[record.periodLabel]), `${companyId}: display period order follows canonical order`);
  assert.equal(JSON.stringify(records), canonicalBefore, `${companyId}: formatting does not mutate values, periods, sources, rows, or order`);
}
const financialGuardRecord = { periodLabel: 'FY2026', currency: 'USD', unit: 'million', accountingBasis: 'US GAAP' };
assert.throws(() => resolveCompareFinancialTablePresentation([financialGuardRecord, { ...financialGuardRecord, currency: 'JPY' }]), /mixed currency or unit/);
assert.throws(() => resolveCompareFinancialTablePresentation([financialGuardRecord, { ...financialGuardRecord, unit: 'billion' }]), /mixed currency or unit/);
assert.throws(() => resolveCompareFinancialTablePresentation([financialGuardRecord, { ...financialGuardRecord, accountingBasis: 'Japanese GAAP' }]), /mixed accounting basis/);
assert.equal(compareFinancialAmountUnitLabels['USD:million'], '百万ドル');
assert.equal(compareFinancialAmountUnitLabels['JPY:million'], '百万円');
assert.equal(compareFinancialAccountingBasisLabels['US GAAP'], '米国会計基準');
assert.equal(compareFinancialAccountingBasisLabels['Japanese GAAP'], '日本会計基準');
assert.equal(localizeCompareLocation('United States'), '米国');
assert.equal(localizeCompareLocation('Oregon, United States'), '米国オレゴン州');
assert.throws(() => localizeCompareLocation('unreviewed-place'), /mapping is missing/, 'unreviewed geography never falls through to mixed-language UI');
const dedupeFixture = dedupeCompareCanonicalItems([
  { canonicalId: 'product-category-gpu', label: 'GPU', groundingIds: ['rel-a'] },
  { canonicalId: 'product-category-gpu', label: 'Graphics processing unit', groundingIds: ['rel-b'] },
  { canonicalId: 'product-category-cpu', label: 'CPU', groundingIds: ['rel-c'] },
]);
assert.deepEqual(dedupeFixture.map(item => item.canonicalId), ['product-category-gpu', 'product-category-cpu'], 'dedupe uses canonical Registry ID, not visible strings');
const technologyDedupeFixture = dedupeCompareCanonicalItems([
  { canonicalId: 'technology-semiconductor-deposition', label: '半導体成膜プロセス', groundingIds: ['claim-a'] },
  { canonicalId: 'technology-semiconductor-deposition', label: 'Deposition', groundingIds: ['claim-b'] },
  { canonicalId: 'technology-semiconductor-etching', label: '半導体エッチングプロセス', groundingIds: ['claim-c'] },
]);
assert.deepEqual(
  technologyDedupeFixture.map(item => item.canonicalId),
  ['technology-semiconductor-deposition', 'technology-semiconductor-etching'],
  'Technology display also deduplicates by canonical Registry ID',
);
const displayCopyText = Object.values(compareClaimDisplayCopy).flatMap(copy => [copy.title, copy.statement]).join('\n');
for (const phrase of displayFixture.prohibitedPrimaryPhrases) {
  assert.ok(!displayCopyText.includes(phrase), `primary Claim display copy omits editorial phrase: ${phrase}`);
}
assert.deepEqual(
  [...new Set(displayCopyText.match(/[A-Za-z][A-Za-z0-9-]*/g) ?? [])].sort(),
  displayFixture.approvedPrimaryEnglishTokens,
  'Pilot primary display contains no unreviewed generic English token',
);
for (const properNoun of ['NVIDIA AI Enterprise', 'DGX Cloud', 'GPU', 'CPU', 'DPU', 'ASIC']) {
  assert.ok(displayCopyText.includes(properNoun), `${properNoun}: preserved in display copy`);
}
assert.match(claimById.get('applied-technology').statement, /Integrated Materials Solution/, 'canonical Claim keeps the raw formal English name');
assert.match(claimById.get('lam-research-capacity-expansion-triage-remediation-v02').statement, /Tualatin/, 'canonical Claim keeps the raw source geography');
assert.equal(compareClaimDisplayCopy['applied-technology'].title, '統合材料ソリューション');
assert.match(compareClaimDisplayCopy['applied-technology'].statement, /^統合材料ソリューション（Integrated Materials Solution）/);
assert.match(compareClaimDisplayCopy['lam-research-capacity-expansion-triage-remediation-v02'].statement, /^米国オレゴン州チュアラティン/);
assert.deepEqual(
  [0, 1, 2, 3].map(index => companyPresentationTokenForOrder(index).label),
  displayFixture.presentationTokens,
  'selection order deterministically assigns the four company identity tokens',
);
assert.throws(() => companyPresentationTokenForOrder(4), /outside 1-4/, 'a fifth presentation token is rejected');

assert.equal(evidenceCompareViewRequested('?ids=nvidia,broadcom'), false, 'legacy route does not request the Evidence payload');
assert.equal(evidenceCompareViewRequested('?ids=nvidia,broadcom&view=evidence'), true, 'opt-in route requests the Evidence payload');
let fragmentFetchCount = 0;
const validFragment = await fetchEvidenceCompareFragment('/evidence-fragment/', async (url, init) => {
  fragmentFetchCount += 1;
  assert.equal(url, '/evidence-fragment/');
  assert.equal(init.headers.Accept, 'text/html');
  return { ok: true, status: 200, text: async () => '<section>Evidence</section>' };
});
assert.equal(validFragment, '<section>Evidence</section>');
assert.equal(fragmentFetchCount, 1, 'opt-in payload is fetched exactly once');
let failedFragmentFetchCount = 0;
await assert.rejects(
  () => fetchEvidenceCompareFragment('/evidence-fragment/', async () => {
    failedFragmentFetchCount += 1;
    return { ok: false, status: 503, text: async () => '' };
  }),
  /Evidence fragment request failed: 503/,
  'payload failure remains explicit for the inline recovery state',
);
assert.equal(failedFragmentFetchCount, 1, 'failed payload request is not retried or duplicated silently');

const createMountFixture = ({ enabled = true, failure = null } = {}) => {
  const state = {
    requested: false,
    loading: false,
    mountConnected: true,
    rootPresent: false,
    payloadPresent: false,
    payloadValid: false,
    initialized: false,
    visible: false,
    errorVisible: false,
    legacyVisible: true,
    fetchCount: 0,
    importCount: 0,
    initCount: 0,
    finishCount: 0,
    failureCount: 0,
    diagnosticErrorCount: 0,
    lastError: '',
  };
  const dependencies = {
    enabled,
    alreadyRequested: () => state.requested,
    begin: () => {
      state.requested = true;
      state.loading = true;
      state.legacyVisible = false;
    },
    fetchFragment: async () => {
      state.fetchCount += 1;
      if (failure === 'http') throw new Error('Evidence fragment request failed: 503');
      return '<fragment />';
    },
    mountFragment: () => {
      state.rootPresent = failure !== 'missing-root';
      state.payloadPresent = failure !== 'missing-payload';
      state.payloadValid = failure !== 'invalid-payload';
    },
    validateMounted: () => {
      if (!state.rootPresent) throw new Error('Evidence fragment root is missing');
      if (!state.payloadPresent) throw new Error('Evidence fragment payload is missing');
      if (!state.payloadValid) throw new Error('Evidence fragment payload is invalid');
    },
    loadController: async () => {
      state.importCount += 1;
      if (failure === 'import') throw new Error('dynamic import rejected');
      return { init: true };
    },
    initializeController: () => {
      state.initCount += 1;
      if (failure === 'controller') throw new Error('controller initialization failed');
      state.initialized = true;
      state.visible = true;
      return true;
    },
    validateInitialized: () => {
      if (!state.initialized || !state.visible) throw new Error('controller completion state is invalid');
    },
    finish: () => {
      state.loading = false;
      state.finishCount += 1;
    },
    fail: error => {
      state.loading = false;
      state.errorVisible = state.mountConnected;
      state.failureCount += 1;
      state.diagnosticErrorCount += 1;
      state.lastError = error instanceof Error ? error.message : String(error);
    },
  };
  return { state, dependencies };
};

const legacyMount = createMountFixture({ enabled: false });
assert.equal(await mountEvidenceCompareFragment(legacyMount.dependencies), 'legacy');
assert.equal(legacyMount.state.fetchCount, 0, 'legacy mode requests no fragment');
assert.equal(legacyMount.state.importCount, 0, 'legacy mode imports no Evidence controller');

const successfulMount = createMountFixture();
assert.equal(await mountEvidenceCompareFragment(successfulMount.dependencies), 'loaded');
assert.equal(successfulMount.state.fetchCount, 1, 'normal mode fetches one fragment');
assert.equal(successfulMount.state.importCount, 1, 'normal mode imports one controller');
assert.equal(successfulMount.state.initCount, 1, 'normal mode initializes one controller');
assert.equal(successfulMount.state.mountConnected, true, 'normal mode preserves the connected mount');
assert.equal(successfulMount.state.finishCount, 1, 'normal mode clears its loading state once');
assert.equal(successfulMount.state.loading, false, 'normal mode clears loading');

const failureFixtures = [
  ['http', /503/],
  ['missing-root', /root is missing/],
  ['missing-payload', /payload is missing/],
  ['import', /dynamic import rejected/],
  ['controller', /controller initialization failed/],
];
for (const [failure, expectedMessage] of failureFixtures) {
  const fixtureState = createMountFixture({ failure });
  assert.equal(await mountEvidenceCompareFragment(fixtureState.dependencies), 'error', `${failure}: explicit failure outcome`);
  assert.equal(fixtureState.state.errorVisible, true, `${failure}: failure UI remains in the live mount`);
  assert.equal(fixtureState.state.failureCount, 1, `${failure}: failure UI renders once`);
  assert.equal(fixtureState.state.diagnosticErrorCount, 1, `${failure}: exactly one diagnostic error is recorded`);
  assert.equal(fixtureState.state.legacyVisible, false, `${failure}: no silent Legacy fallback`);
  assert.equal(fixtureState.state.loading, false, `${failure}: busy state is cleared`);
  assert.match(fixtureState.state.lastError, expectedMessage, `${failure}: diagnostic identifies the failed stage`);
}
assert.equal(failureFixtures.length, 5, 'five required post-mount failure classes are covered');

const invalidPayloadMount = createMountFixture({ failure: 'invalid-payload' });
assert.equal(await mountEvidenceCompareFragment(invalidPayloadMount.dependencies), 'error');
assert.equal(invalidPayloadMount.state.errorVisible, true, 'invalid JSON shares the live failure UI');
assert.equal(invalidPayloadMount.state.diagnosticErrorCount, 1, 'invalid JSON records one diagnostic error');

assert.equal(await mountEvidenceCompareFragment(successfulMount.dependencies), 'already-requested');
assert.equal(successfulMount.state.fetchCount, 1, 'double initialization does not refetch the fragment');
assert.equal(successfulMount.state.importCount, 1, 'double initialization does not reimport the controller');
assert.equal(successfulMount.state.initCount, 1, 'double initialization does not duplicate controller listeners');

const assetManifest = {
  schemaVersion: companyCompareAssetSchemaVersion,
  companies: ['nvidia', 'broadcom'].map(companyId => ({
    companyId,
    assetPath: `/evidence-fragments/company-compare-evidence-v01/${companyId}/`,
    schemaVersion: companyCompareAssetSchemaVersion,
  })),
};
assert.deepEqual(validateCompanyCompareAssetManifest(assetManifest), assetManifest, 'lightweight asset manifest validates');
assert.equal(
  resolveCompanyCompareAssetUrl('/ai-infrastructure-atlas/evidence-fragments/company-compare-evidence-v01/nvidia/', 'https://example.test/ai-infrastructure-atlas/compare/'),
  'https://example.test/ai-infrastructure-atlas/evidence-fragments/company-compare-evidence-v01/nvidia/',
  'GitHub Pages base path resolves without leaving the current origin',
);
assert.throws(() => resolveCompanyCompareAssetUrl('https://other.test/nvidia/', 'https://example.test/compare/'), /current origin/, 'cross-origin assets are rejected');
assert.throws(
  () => validateCompanyCompareAssetManifest({ ...assetManifest, schemaVersion: '9.9' }),
  /schema mismatch/,
  'manifest schema mismatch fails closed',
);
assert.throws(
  () => validateCompanyCompareAssetManifest({ ...assetManifest, companies: [...assetManifest.companies, assetManifest.companies[0]] }),
  /Duplicate.*company ID/,
  'duplicate manifest Company IDs fail closed',
);
assert.throws(
  () => validateCompanyCompareAssetManifest({ ...assetManifest, companies: [{ ...assetManifest.companies[0], assetPath: '/wrong/' }] }),
  /does not match Company ID/,
  'Company asset path and ID must match',
);
const assetRequests = [];
const assetLoader = createCompanyCompareAssetLoader({
  manifest: assetManifest,
  currentUrl: 'https://example.test/compare/?view=evidence',
  fetcher: async url => {
    assetRequests.push(url);
    const companyId = url.includes('/nvidia/') ? 'nvidia' : 'broadcom';
    return { ok: true, status: 200, text: async () => JSON.stringify({ companyId }) };
  },
  parseAsset: (body, record) => {
    const parsed = JSON.parse(body);
    if (parsed.companyId !== record.companyId) throw new Error('asset Company ID mismatch');
    return parsed;
  },
});
assert.equal(assetLoader.requestCount('broadcom'), 0, 'unselected Company asset starts at zero requests');
const [firstNvidia, duplicateNvidia] = await Promise.all([assetLoader.load('nvidia'), assetLoader.load('nvidia')]);
assert.deepEqual(firstNvidia, { companyId: 'nvidia' });
assert.strictEqual(firstNvidia, duplicateNvidia, 'concurrent duplicate requests share one in-flight result');
assert.equal(assetLoader.requestCount('nvidia'), 1, 'selected Company asset is fetched once');
assert.equal(assetLoader.requestCount('broadcom'), 0, 'unselected Company asset is not prefetched');
assert.strictEqual(await assetLoader.load('nvidia'), firstNvidia, 'loaded Company asset is reused from cache');
assert.equal(assetLoader.requestCount('nvidia'), 1, 'detail changes and reselection require no refetch');
await assetLoader.load('broadcom');
assert.equal(assetLoader.requestCount('broadcom'), 1, 'newly selected Company is fetched once');
assert.deepEqual(assetLoader.cachedCompanyIds(), ['broadcom', 'nvidia'], 'cache inventory is deterministic');
assert.equal(assetRequests.length, 2, 'only selected Company assets reached the network');
await assert.rejects(() => assetLoader.load('unknown'), /Unknown Company Compare asset/, 'unknown asset is rejected before fetch');

for (const status of [404, 500]) {
  const failedLoader = createCompanyCompareAssetLoader({
    manifest: assetManifest,
    currentUrl: 'https://example.test/compare/',
    fetcher: async () => ({ ok: false, status, text: async () => '' }),
    parseAsset: JSON.parse,
  });
  await assert.rejects(() => failedLoader.load('nvidia'), new RegExp(`nvidia:${status}`), `${status}: per-Company failure is explicit`);
  assert.equal(failedLoader.requestCount('nvidia'), 1, `${status}: no automatic retry loop`);
}
const invalidAssetLoader = createCompanyCompareAssetLoader({
  manifest: assetManifest,
  currentUrl: 'https://example.test/compare/',
  fetcher: async () => ({ ok: true, status: 200, text: async () => '{invalid' }),
  parseAsset: JSON.parse,
});
await assert.rejects(() => invalidAssetLoader.load('nvidia'), /JSON/, 'invalid Company asset fails explicitly');
const schemaMismatchAssetLoader = createCompanyCompareAssetLoader({
  manifest: assetManifest,
  currentUrl: 'https://example.test/compare/',
  fetcher: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ schemaVersion: '9.9' }) }),
  parseAsset: body => {
    const parsed = JSON.parse(body);
    if (parsed.schemaVersion !== companyCompareAssetSchemaVersion) throw new Error('Company asset schema mismatch');
    return parsed;
  },
});
await assert.rejects(() => schemaMismatchAssetLoader.load('nvidia'), /schema mismatch/, 'Company asset schema mismatch fails explicitly');
const timeoutAssetLoader = createCompanyCompareAssetLoader({
  manifest: assetManifest,
  currentUrl: 'https://example.test/compare/',
  timeoutMs: 5,
  fetcher: async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }),
  parseAsset: JSON.parse,
});
await assert.rejects(() => timeoutAssetLoader.load('nvidia'), /timed out/, 'Company asset timeout is bounded and explicit');
let retryAttempt = 0;
const retryAssetLoader = createCompanyCompareAssetLoader({
  manifest: assetManifest,
  currentUrl: 'https://example.test/compare/',
  fetcher: async url => {
    const companyId = url.includes('/nvidia/') ? 'nvidia' : 'broadcom';
    if (companyId === 'nvidia' && retryAttempt++ === 0) return { ok: false, status: 500, text: async () => '' };
    return { ok: true, status: 200, text: async () => JSON.stringify({ companyId }) };
  },
  parseAsset: JSON.parse,
});
const loadedPeer = await retryAssetLoader.load('broadcom');
await assert.rejects(() => retryAssetLoader.load('nvidia'), /500/, 'one Company may fail while its peer stays loaded');
assert.strictEqual(await retryAssetLoader.load('broadcom'), loadedPeer, 'successful peer remains cached during partial failure');
assert.deepEqual(await retryAssetLoader.load('nvidia'), { companyId: 'nvidia' }, 'retry recovers only the failed Company');
assert.equal(retryAssetLoader.requestCount('broadcom'), 1, 'retry never refetches the successful peer');
assert.equal(retryAssetLoader.requestCount('nvidia'), 2, 'failed Company is fetched exactly once more on explicit retry');

const setA = parseEvidenceCompareSearch('?ids=nvidia,broadcom&view=evidence&detail=summary', companyIds);
assert.equal(setA.enabled, true, 'view=evidence routing');
assert.deepEqual(setA.selectedIds, ['nvidia', 'broadcom'], 'Set A ordered selection');
assert.equal(setA.detail, 'summary');
assert.equal(setA.issues.length, 0);
assert.equal(matchEvidencePilotSet(setA.selectedIds)?.setId, 'set-a');

const setB = parseEvidenceCompareSearch('?ids=tokyo-electron,lam-research,applied-materials&view=evidence&detail=expanded&section=key-risks', companyIds);
assert.deepEqual(setB.selectedIds, ['tokyo-electron', 'lam-research', 'applied-materials'], 'URL order must be retained');
assert.equal(setB.detail, 'expanded');
assert.equal(setB.section, 'key-risks');
assert.equal(matchEvidencePilotSet(setB.selectedIds)?.setId, 'set-b', 'Set matching must not reorder the visible selection');

const legacy = parseEvidenceCompareSearch('?ids=nvidia,broadcom', companyIds);
assert.equal(legacy.enabled, false, 'legacy Compare remains the default without view=evidence');

const guarded = parseEvidenceCompareSearch(
  '?ids=nvidia,nvidia,unknown,asml,broadcom,applied-materials,lam-research,tokyo-electron&view=evidence',
  companyIds,
);
assert.deepEqual(guarded.selectedIds, ['nvidia', 'broadcom', 'applied-materials', 'lam-research']);
assert.deepEqual(guarded.issues.map(issue => issue.code), ['duplicate', 'unknown', 'unsupported', 'limit']);
assert.deepEqual(guarded.issues.map(issue => issue.id), ['nvidia', 'unknown', 'asml', 'tokyo-electron']);

const serialized = serializeEvidenceCompareSearch('?foo=keep', {
  selectedIds: ['broadcom', 'nvidia'],
  detail: 'expanded',
  section: 'technology-moat',
});
const serializedParams = new URLSearchParams(serialized);
assert.equal(serializedParams.get('foo'), 'keep');
assert.equal(serializedParams.get('ids'), 'broadcom,nvidia');
assert.equal(serializedParams.get('view'), 'evidence');
assert.equal(serializedParams.get('detail'), 'expanded');
assert.equal(serializedParams.get('section'), 'technology-moat');

assert.deepEqual([...evidenceComparePilotCompanyIds], ['nvidia', 'broadcom', 'applied-materials', 'lam-research', 'tokyo-electron']);
assert.deepEqual(evidenceCompareStableSections, [...fixture.dimensionOrder, 'evidence-trace']);
assert.equal(financialPresentationForSelection(['nvidia', 'broadcom']).primary[0].compatibility.code, 'caution');
assert.equal(financialPresentationForSelection(['nvidia', 'broadcom']).dataQuality[0].compatibility.code, 'blocked');
assert.equal(financialPresentationForSelection(['nvidia', 'lam-research']).resolverError, true);
assert.equal(allSelectedMissing(['a', 'b'], new Map([['a', null], ['b', undefined]])), true);
assert.equal(allSelectedMissing(['a', 'b'], new Map([['a', null], ['b', 'present']])), false);

const dimensionOrder = projection.policy.dimensionOrder.filter(id => id !== 'evidence-trace');
const summaryDimensionIds = ['ai-role', 'key-products', 'technology-moat', 'capacity-roadmap', 'key-risks'];
const summaryMarkerCountBySet = Object.fromEntries(projection.sets.map(setRecord => {
  let count = 0;
  for (const company of setRecord.companies) {
    for (const dimensionId of summaryDimensionIds) {
      const sourceIds = dimensionId === 'ai-role' ? ['ai-role', 'value-chain-position'] : [dimensionId];
      sourceIds.forEach((sourceId, sectionIndex) => {
        const dimension = company.dimensions.find(item => item.dimensionId === sourceId);
        const sectionClaims = (dimension?.initialClaimIds ?? []).map(id => claimById.get(id));
        const seenProducts = new Set();
        const sectionRelations = (dimension?.initialRelationIds ?? [])
          .map(id => relationById.get(id))
          .filter(relation => {
            if (relation.relationType !== 'PRODUCES') return true;
            if (seenProducts.has(relation.objectId)) return false;
            seenProducts.add(relation.objectId);
            return true;
          });
        count += selectCompareSummaryClaimIds(dimensionId, sectionIndex, sectionClaims, sectionRelations).length;
        count += selectCompareSummaryRelationIds(dimensionId, sectionIndex, sectionRelations).length;
      });
    }
  }
  return [setRecord.setId, count];
}));
assert.deepEqual(summaryMarkerCountBySet, displayFixture.summaryMarkerCounts, 'summary marker selection is deterministic for both Pilot sets');
const priorityCounts = { P1: 0, P2: 0, P3: 0 };
const relationPlacementCounts = Object.fromEntries(dimensionOrder.map(id => [id, 0]));
let claimMarkerCount = 0;
let relationMarkerCount = 0;
let relationVerificationCount = 0;
let unresolvedEvidenceCount = 0;
for (const setRecord of projection.sets) {
  for (const company of setRecord.companies) {
    for (const dimension of company.dimensions.filter(item => item.dimensionId !== 'evidence-trace')) {
      for (const claimId of dimension.initialClaimIds) {
        claimMarkerCount += 1;
        const claim = claimById.get(claimId);
        assert.ok(claim, `${claimId}: visible Claim resolves`);
        assert.equal(claim.companyId, company.companyId, `${claimId}: visible Claim company`);
        priorityCounts[claim.priority] += 1;
        const bindings = claim.evidenceIds.map(id => claimBindingById.get(id)).filter(Boolean);
        if (!bindings.length || bindings.some(binding => !sourceIds.has(binding.sourceId))) unresolvedEvidenceCount += 1;
      }
      relationPlacementCounts[dimension.dimensionId] += dimension.initialRelationIds.length;
      for (const relationId of dimension.initialRelationIds) {
        relationMarkerCount += 1;
        const relation = relationById.get(relationId);
        assert.ok(relation, `${relationId}: visible Relation resolves`);
        const bindings = relationBindingsByRelation.get(relationId) ?? [];
        if (!bindings.length || bindings.some(binding => !sourceIds.has(binding.sourceId))) unresolvedEvidenceCount += 1;
        const resolvedRelation = { ...relation, evidenceIds: bindings.map(binding => binding.id) };
        const verification = deriveRelationVerificationPresentation(
          resolvedRelation,
          relationBindingById,
          sourceId => sourceById.get(sourceId),
        );
        assert.deepEqual(
          { full: verification.full, support: verification.supportLabel },
          { full: 'Relation根拠確認済み', support: 'direct support' },
          `${relationId}: Relation presentation derives from Binding`,
        );
        relationVerificationCount += 1;
      }
    }
  }
}

const financialStates = projection.sets.flatMap(setRecord => setRecord.financial.metricStates);
const snapshot = {
  schemaVersion: '0.1',
  dimensionOrder,
  setCompanyIds: Object.fromEntries(projection.sets.map(setRecord => [setRecord.setId, setRecord.orderedCompanyIds])),
  priorityCounts,
  claimMarkerCount,
  relationMarkerCount,
  markerCount: claimMarkerCount + relationMarkerCount,
  unresolvedEvidenceCount,
  relationPlacementCounts,
  financialCounts: {
    ok: financialStates.filter(state => state.compatibility.code === 'ok').length,
    caution: financialStates.filter(state => state.compatibility.code === 'caution').length,
    blocked: financialStates.filter(state => state.compatibility.code === 'blocked').length,
  },
};
assert.deepEqual(snapshot, fixture, 'semantic snapshot must remain fixed');

for (const setRecord of projection.sets) {
  for (const company of setRecord.companies) {
    const supplemental = company.dimensions.filter(dimension => dimension.supplementalP2);
    assert.ok(supplemental.every(dimension => ['technology-moat', 'capacity-roadmap', 'key-risks'].includes(dimension.dimensionId)));
    assert.ok(supplemental.every(dimension => dimension.initialClaimIds.length <= 1 || dimension.dimensionId === 'technology-moat'));
  }
}
assert.equal(priorityCounts.P3, 0, 'P3 initial projection remains zero');
assert.equal(new Set(relations.filter(relation => relation.relationType === 'COMPETES_WITH').map(relation => relation.relationId)).size, 2);
assert.equal(relationPlacementCounts['technology-moat'], 4, 'two canonical COMPETES_WITH records project symmetrically without reverse records');
assert.equal(relationVerificationCount, 19, '17 Relations produce 19 verified projected marker instances from Binding state');

const sampleAuthoringRelation = relations[0];
const sampleRelation = {
  ...sampleAuthoringRelation,
  evidenceIds: (relationBindingsByRelation.get(sampleAuthoringRelation.relationId) ?? []).map(binding => binding.id),
};
const sampleBinding = relationBindingById.get(sampleRelation.evidenceIds[0]);
assert.ok(sampleBinding, 'invalid Relation presentation fixtures require one valid Binding');
const oneBinding = binding => new Map([[binding.id, binding]]);
const resolveFixtureSource = sourceId => sourceById.get(sourceId);
assert.throws(
  () => deriveRelationVerificationPresentation(sampleRelation, new Map(), resolveFixtureSource),
  /cannot resolve Relation Binding/,
  'missing Binding must fail',
);
assert.throws(
  () => deriveRelationVerificationPresentation(sampleRelation, oneBinding({ ...sampleBinding, support: 'context' }), resolveFixtureSource),
  /not direct support/,
  'support other than supports must fail',
);
assert.throws(
  () => deriveRelationVerificationPresentation(sampleRelation, oneBinding({ ...sampleBinding, locator: {} }), resolveFixtureSource),
  /no structured Locator/,
  'missing structured Locator must fail',
);
assert.throws(
  () => deriveRelationVerificationPresentation(sampleRelation, oneBinding({ ...sampleBinding, lastChecked: '' }), resolveFixtureSource),
  /no lastChecked/,
  'missing lastChecked must fail',
);
assert.throws(
  () => deriveRelationVerificationPresentation(sampleRelation, oneBinding(sampleBinding), () => undefined),
  /cannot resolve Source/,
  'unresolved Shared Source must fail',
);

assert.match(comparePage, /!evidenceMode/, 'legacy script must be gated only for the opt-in route');
assert.match(comparePage, /<BaseLayout title="企業比較">/, 'Compare retains the pre-Pilot non-indexable contract');
assert.doesNotMatch(comparePage, /<BaseLayout title="企業比較" indexable>/, 'Compare must not become a Pagefind result');
assert.match(comparePage, /id="company-compare-evidence-mount"/, 'legacy HTML retains only the Evidence mount point');
assert.match(comparePage, /evidence-fragments\/company-compare-evidence-v01\//, 'Evidence fragment has one internal build-time URL');
assert.match(comparePage, /evidenceCompareViewRequested\(location\.search\)/, 'legacy route exits before requesting Evidence assets');
assert.match(comparePage, /fetchEvidenceCompareFragment\(mount\.dataset\.evidenceFragmentUrl/, 'Evidence fragment uses the tested single-request loader');
assert.match(comparePage, /loadController: \(\) => import\('\.\.\/scripts\/company-compare-evidence-ui'\)/, 'Evidence controller is a lazy module');
assert.match(comparePage, /mount\.replaceChildren\(template\.content\)/, 'Evidence content keeps the live mount stable');
assert.doesNotMatch(comparePage, /mount\.replaceWith\(/, 'Evidence content never detaches its mount');
assert.match(comparePage, /#company-compare-evidence/, 'mounted fragment root is explicitly validated');
assert.match(comparePage, /#compare-evidence-ui-data/, 'mounted fragment payload is explicitly validated');
assert.match(comparePage, /JSON\.parse\(payload\.textContent \|\| ''\)/, 'mounted fragment payload JSON is explicitly validated');
assert.match(comparePage, /controller\.initCompanyCompareEvidenceUi\(\)/, 'controller initialization result is returned to the orchestrator');
assert.match(comparePage, /evidenceControllerInitialized !== 'true'/, 'controller completion marker is verified');
assert.match(comparePage, /if \(root\.hidden\)/, 'controller must expose the mounted root before success');
assert.match(comparePage, /根拠付き比較を読み込めませんでした/, 'fetch failure has an explicit inline error');
assert.match(comparePage, /retry\.addEventListener\('click', \(\) => location\.reload\(\)\)/, 'fetch failure offers a recovery action');
assert.match(comparePage, /console\.error\('Company Evidence Compare load failed'/, 'all failure paths log one diagnostic error');
assert.match(comparePage, /mount\.setAttribute\('role', 'status'\)/, 'failure UI remains a live status');
assert.doesNotMatch(comparePage, /<CompanyCompareEvidence identities=/, 'Evidence body is not rendered into legacy Compare HTML');
assert.match(fragmentPage, /<CompanyCompareEvidence identities=\{identities\}/, 'Set A and B use one canonical build-time component');
assert.match(fragmentPage, /getCollection\('companies'\)/, 'fragment identities derive from canonical Company content');
assert.match(companyAssetPage, /evidenceComparePilotCompanyIds/, 'only the accepted five Pilot Company routes are generated');
assert.match(companyAssetPage, /CompanyCompareEvidenceCompanyAsset/, 'each Company route renders one deterministic asset');
assert.doesNotMatch(component, /CompanyCompareEvidenceClaim|expandedFinancial\.map|data-claim-id|data-relation-id/, 'shell contains no Company Claim, Relation, or Financial-history bodies');
assert.match(component, /companyManifest/, 'shell exposes a lightweight Company asset manifest');
assert.match(companyAssetLoaderSource, /const cache = new Map/, 'Company assets use an in-memory cache');
assert.match(companyAssetLoaderSource, /const inFlight = new Map/, 'concurrent requests are de-duplicated');
assert.match(companyAssetLoaderSource, /AbortController/, 'Company asset fetches have a bounded timeout');
assert.match(controller, /await Promise\.all\(state\.selectedIds\.map\(loadCompany\)\)/, 'only selected Company IDs are loaded');
assert.match(controller, /selectionRevision/, 'selection races cannot apply stale rendering state');
assert.match(controller, /data-retry-company-id/, 'a failed Company has an isolated retry action');
assert.match(controller, /failures\.set\(companyId/, 'one Company failure does not discard loaded peers');
assert.match(presentationSource, /CompanyCompareEvidenceClaim/, 'Compare-only Evidence presentation keeps the existing drawer contract isolated');
assert.match(component, /data-pagefind-ignore="all"/, 'only the opt-in Evidence subtree is excluded from Pagefind');
assert.doesNotMatch(presentationSource, /initCompanyCompareEvidenceUi/, 'fragment does not initialize its controller before mount');
assert.doesNotMatch(presentationSource, /verificationStatus:\s*['"]verified['"]/, 'Relation adapter must not invent Company Claim verification state');
assert.match(presentationSource, /verificationPresentation=\{entry\.verification\}/, 'Relation verification presentation is Binding-derived');
assert.match(presentationSource, /drawerTitle="関係の根拠"/, 'Relation drawer has an accessible Japanese title');
assert.match(presentationSource, /根拠の対応/);
assert.match(presentationSource, /根拠箇所の確認日/);
assert.match(presentationSource, /scope="col"/);
assert.match(presentationSource, /scope="row"/);
assert.match(presentationSource, /data-evidence-section-link/);
assert.match(presentationSource, /data-claim-priority/);
assert.doesNotMatch(presentationSource, />補足</, 'P2 does not receive a redundant visible supplement label');
assert.match(presentationSource, />事実</);
assert.match(presentationSource, />会社見解</);
assert.match(presentationSource, />Atlasの見方</);
assert.doesNotMatch(presentationSource, />Atlasによる分析</);
assert.doesNotMatch(presentationSource, /関係データ：収録なし/, 'primary matrix omits internal Relation collection state');
assert.doesNotMatch(presentationSource, /正規化した位置|正規化した製品カテゴリ|正規化された位置/, 'primary UI contains no normalization terminology');
assert.doesNotMatch(presentationSource, /coverageContext\.map/, 'primary matrix omits internal Coverage collection state');
assert.match(presentationSource, /data-product-description/, 'expanded Product descriptions retain canonical Product IDs');
assert.match(presentationSource, /productDescription=\{entry\.productDescription/, 'Relation-backed Products use the shared description contract');
assert.match(presentationSource, /claimOnlyProducts/, 'Claim-backed Products use the same description contract');
assert.match(presentationSource, /class="evidence-product-description" data-expanded-only data-product-description=\{item\.canonicalId\}/, 'Claim-backed Products share the description typography contract');
assert.match(presentationSource, /usesClaimBackedPositionProjection/, 'a Relation-free supply-chain Claim uses the shared list renderer');
assert.match(presentationSource, /displayTitle=\{usesClaimBackedPositionProjection[\s\S]*\? '半導体製造'/, 'Claim-backed position projects the canonical Value Chain label');
assert.doesNotMatch(companyAssetComponent, /company\.identity\.id === 'tokyo-electron'/, 'Compare rendering contains no Tokyo Electron-specific branch');
assert.match(presentationSource, /resolveCompanyCompareProductPortfolioSummary/, 'all five Product portfolio summaries use one validated display-copy contract');
assert.match(presentationSource, /evidence-product-portfolio-summary/, 'Product portfolio summaries use one shared presentation class');
assert.match(presentationSource, /evidence-position-entry/, 'Claim-backed and Relation-backed positions use one shared presentation class');
assert.match(presentationSource, /<ul class="evidence-product-description-list evidence-claim-backed-product-list" aria-label="製品の役割">/, 'Claim-backed Product names remain visible in summary');
assert.match(presentationSource, /data-canonical-id=\{entry\.relation\.objectId\}/, 'rendered Product entries retain canonical Registry IDs');
assert.match(presentationSource, /relationsForDisplay/, 'Product display is de-duplicated before rendering');
assert.match(presentationSource, /主要比較には表示しません/);
assert.match(presentationSource, /各社が開示した通貨・単位で表示しています。為替換算、順位付け、差分率の計算は行っていません。/);
assert.doesNotMatch(presentationSource, /id=\{`evidence-section-\$\{['"]value-chain-position/, 'Value Chain is not a repeated standalone major section');
assert.match(presentationSource, /sourceDimensionIds/, 'AI role groups its supply-chain position without changing projection data');
assert.match(presentationSource, /data-display-grounding-ids/, 'every Compare display entry exposes deterministic grounding IDs');
assert.match(presentationSource, /data-company-order-label/, 'every company information block repeats number and name');
assert.match(presentationSource, /data-summary=/, 'summary visibility is a presentation-only deterministic attribute');
assert.match(presentationSource, /要点 — 代表情報だけを表示/);
assert.match(presentationSource, /詳細 — 全根拠・財務履歴まで表示/);
assert.match(claimComponent, /'atlas-analysis': 'Atlasの見方'/, 'Atlas Analysis has the reviewed display label');
assert.match(claimComponent, /fact: '事実'/, 'Fact keeps the reviewed display label');
assert.match(claimComponent, /aria-label=\{`\$\{typeLabel\}: \$\{displayTitle\}`\}/, 'accessible Claim identity distinguishes Fact and Atlas Analysis');
assert.match(controller, /詳細 — 全根拠・財務履歴まで表示/, 'runtime detail description omits the redundant supplement label');
assert.match(presentationSource, /id="evidence-section-evidence-trace"[\s\S]*data-expanded-only/, 'Evidence trace is expanded-only');
assert.match(presentationSource, /displayTitle=\{entry\.display\.title\}/, 'visible Claim copy comes from the display-only read model');
assert.match(claimComponent, /<h4>\{claim\.title\}<\/h4>/, 'Evidence drawer retains the canonical Claim title');
assert.match(claimComponent, /class="drawer-statement">\{claim\.statement\}/, 'Evidence drawer retains the canonical Claim statement');
assert.match(claimComponent, /aria-haspopup="dialog"/);
assert.match(claimComponent, /data-evidence-open/);
assert.match(claimComponent, /verified: \{ short: '確認済み', full: '根拠箇所まで確認済み' \}/, 'Company Claim verified presentation remains unchanged');
assert.match(claimComponent, /'source-linked': \{ short: '一次資料あり', full: '一次資料紐付け済み・確認未了' \}/, 'Company Claim source-linked presentation remains unchanged');
assert.match(claimComponent, /'needs-review': \{ short: '要確認', full: '要再検証' \}/, 'Company Claim needs-review presentation remains unchanged');
assert.match(controller, /if \(!state\.enabled\) throw new Error/, 'Evidence controller reports an invalid non-Evidence initialization');
assert.match(controller, /evidenceControllerInitialized/, 'Evidence controller initializes at most once after mount');
assert.match(controller, /evidenceControllerInitialized === 'true'\) return Promise\.resolve\(true\)/, 'a completed controller can be initialized idempotently');
assert.match(controller, /export function initCompanyCompareEvidenceUi\(\): Promise<boolean>/, 'controller exposes an explicit async success contract');
assert.match(controller, /requiredElement/, 'controller throws when required DOM is missing');
assert.match(controller, /event\.key === 'Escape'/);
assert.match(controller, /event\.key !== 'Enter' && event\.key !== ' '/, 'Evidence markers have an explicit keyboard activation contract');
assert.match(controller, /returnFocus/);
assert.match(controller, /window\.addEventListener\('popstate'/);
assert.match(controller, /pushState/, 'detail mode creates navigable browser history');
assert.match(controller, /unresolvedFinancial/);
assert.match(controller, /\[expandedFinancial, evidenceTrace\]\.forEach\(orderAndFilterCompanyCells\)/);
assert.match(controller, /appendCompanyName/, 'selected rows and suggestions share one company-name renderer');
assert.match(controller, /createCompanyNameLink/, 'all linked Company identities use one anchor factory');
assert.match(controller, /link\.dataset\.companyIdentityLink = company\.id/, 'each Company identity link retains its canonical Company ID');
assert.match(controller, /upgradeCompanyIdentityLinks/, 'static Compare identities are upgraded before the Evidence root becomes visible');
assert.match(controller, /\.evidence-matrix thead th\[data-company-id\] > a, \.evidence-company-context > strong/, 'column and mobile identities share the one-link rule');
assert.match(controller, /\.evidence-financial-company\[data-company-id\] > h4, \.evidence-trace-list > \[data-company-id\] > strong/, 'Financial and Evidence trace identities share the one-link rule');
assert.equal((controller.match(/document\.createElement\('a'\)/g) ?? []).length, 1, 'Company identity anchors have one construction path and cannot be nested');
assert.match(controller, /companyCompareDisplayNameParts/, 'all dynamic Company names use canonical bilingual parts');
assert.match(controller, /localizeCompareLocation/, 'dynamic geography uses exact Compare localization');
assert.match(controller, /companyPresentationTokenForOrder/, 'company identity follows deterministic selection order');
assert.match(controller, /dataset\.companyToken/, 'company identity tokens are assigned to all ordered cells');
assert.match(controller, /value-chain-position['"] \? ['"]ai-role/, 'old Value Chain section links resolve to the grouped AI-role section');
assert.match(styles, /min-height: 44px/);
assert.match(styles, /#legacy-compare-templates\[hidden\]/);
assert.match(styles, /#evidence-compare-templates\[hidden\]/, 'Pilot templates remain hidden on legacy Compare');
assert.match(styles, /scroll-margin-top: 5rem/);
assert.match(styles, /@media \(max-width: 600px\)/);
assert.match(styles, /overflow: visible/);
assert.match(styles, /\.evidence-major-section > th,[\s\S]*border-top: 2px solid var\(--border-strong\)/, 'major section bands use a 2px neutral rule');
assert.match(styles, /\.evidence-company-context \{[\s\S]*display: none/, 'desktop and tablet cells rely on the sticky Company header');
assert.match(styles, /@media \(max-width: 600px\)[\s\S]*\.evidence-company-context \{[\s\S]*display: flex/, 'mobile cells retain the explicit Company identity strip');
assert.match(styles, /\.evidence-company-context > strong/, 'identity is not color-only');
assert.match(styles, /\.compare-company-name-primary,[\s\S]*white-space: nowrap/, 'Company name lines do not break mid-name');
assert.match(styles, /\.company-name-link \.compare-company-name-secondary,[\s\S]*color: inherit/, 'the Japanese second line inherits every anchor color state');
assert.equal(displayFixture.companyIdentityLink.className, 'company-name-link');
assert.equal(displayFixture.companyIdentityLink.anchorsPerIdentity, 1);
assert.equal(displayFixture.companyIdentityLink.finalLocationsPerCompany, 11);
assert.match(styles, /data-summary="hide"/, 'summary hides non-representative presentation entries only');
assert.match(styles, /font-size: 16px/, 'mobile primary text has a 16px floor');
assert.match(styles, /font-size: 14px/, 'mobile metadata has a 14px floor');
assert.match(styles, /thead th:first-child \{[\s\S]*font-size: 18px;[\s\S]*font-weight: 700/, 'comparison label is at least 18px and bold on desktop');
assert.match(styles, /thead th > a \{[\s\S]*font-size: 18px;[\s\S]*font-weight: 700/, 'desktop Company heading is at least 18px and bold');
assert.match(styles, /thead th > span \{[\s\S]*font-size: 14px/, 'desktop ticker and country are at least 14px');
assert.match(styles, /tbody > tr > th \{[\s\S]*font-size: 16px;[\s\S]*font-weight: 700/, 'desktop row headings are at least 16px and bold');
assert.match(styles, /\.evidence-identity > span \{[\s\S]*font-size: 16px/, 'Company information values are at least 16px');
assert.match(styles, /\.evidence-product-description \{[\s\S]*font-size: 15px;[\s\S]*line-height: 1\.65/, 'desktop Product descriptions meet the typography contract');
assert.match(styles, /\.evidence-claim-backed-product-list strong::before \{[\s\S]*content: "·"/, 'Claim-backed Product entries use the same bullet as Relation-backed entries');
assert.match(styles, /data-detail="summary"\] \.evidence-position-entry \{[\s\S]*border-top: 1px solid var\(--border\)/, 'summary position entries use one shared separator rule');
assert.match(styles, /\.evidence-compare \.evidence-marker \{[\s\S]*border: 0;[\s\S]*appearance: none;[\s\S]*background: transparent/, 'Evidence markers reset native button chrome in the shell stylesheet');
assert.match(styles, /\.evidence-compare \.evidence-marker::before \{[\s\S]*width: 44px;[\s\S]*height: 44px/, 'Evidence markers retain a transparent 44px hit area without expanding line height');
assert.match(styles, /\.evidence-compare \.evidence-marker:hover \{[\s\S]*background: transparent;[\s\S]*text-decoration: underline/, 'Evidence marker hover remains a quiet text interaction');
assert.match(styles, /\.evidence-compare \.evidence-marker:focus-visible \{[\s\S]*outline: 2px solid/, 'Evidence marker keyboard focus remains explicit');
assert.match(presentationSource, /<thead><tr>[\s\S]*<th scope="col">出典<\/th>/, 'all eight detailed Financial headers use one centered heading contract');
assert.match(presentationSource, /<th class="num" scope="col">売上高<br \/>（\{company\.expandedFinancialPresentation\.amountUnitLabel\}）<\/th>/, 'amount header exposes one continuous accessible name on two visual lines');
assert.match(presentationSource, /class="financial-basis">会計基準：\{company\.expandedFinancialPresentation\.accountingBasisLabel\}/, 'accounting basis appears once at Company-table level');
assert.match(presentationSource, /scope="row">\{record\.displayPeriodLabel\}<\/th>/, 'period rows contain the localized period only');
assert.doesNotMatch(presentationSource, /record\.currency[\s\S]*record\.unit[\s\S]*record\.accountingBasis/, 'period rows never repeat currency, unit, or accounting basis');
assert.match(presentationSource, /各社が開示した通貨・単位で表示しています。為替換算、順位付け、差分率の計算は行っていません。/, 'detailed Financial explanation uses the reviewed Japanese copy');
assert.match(presentationSource, /metric\?\.displayValue[\s\S]*class="num"[\s\S]*class="missing"/, 'available and missing values have distinct semantic classes');
assert.doesNotMatch(presentationSource, /class="num"[^>]*>未収録</, 'missing status never receives the numeric class');
assert.match(styles, /\.evidence-financial-scroll th,[\s\S]*vertical-align: middle/, 'detailed Financial cells are vertically centered');
assert.match(styles, /\.evidence-financial-scroll thead th \{[\s\S]*text-align: center;[\s\S]*vertical-align: middle/, 'all detailed Financial column headings are centered on both axes');
assert.match(styles, /thead th\.period \{[\s\S]*text-align: center/, 'the period column heading is not overridden by the left-aligned body-period contract');
assert.match(styles, /\.evidence-financial-scroll \.num \{[\s\S]*font-size: 14px;[\s\S]*font-weight: 500;[\s\S]*font-variant-numeric: tabular-nums;[\s\S]*text-align: right/, 'financial values are readable, tabular, and right aligned');
assert.match(styles, /thead \.num \{[\s\S]*font-weight: 600/, 'numeric headers retain readable emphasis');
assert.match(styles, /\.evidence-financial-scroll \.period \{[\s\S]*text-align: left/, 'period stays left aligned');
assert.match(styles, /\.evidence-financial-scroll \.missing \{[\s\S]*font-size: 13px;[\s\S]*text-align: center/, 'missing state remains readable and distinct from numbers');
assert.match(styles, /\.evidence-financial-scroll td:last-child a \{[\s\S]*font-size: 13px;[\s\S]*white-space: nowrap/, 'source links remain readable and discoverable');
assert.equal(displayFixture.financialDetailTable.numericAlignment, 'right');
assert.equal(displayFixture.financialDetailTable.verticalAlignment, 'middle');
assert.equal(displayFixture.financialDetailTable.periodAlignment, 'left');
assert.equal(displayFixture.financialDetailTable.columnHeadingAlignment, 'center');
assert.equal(displayFixture.financialDetailTable.columnHeadingVerticalAlignment, 'middle');
assert.equal(displayFixture.financialDetailTable.sourceMinimumTargetPx, 44);
assert.deepEqual(displayFixture.financialDetailTable.metricIds, ['revenue', 'operatingProfit', 'operatingMargin', 'freeCashFlow', 'capex', 'roic']);
assert.match(styles, /\.evidence-financial-value > a,[\s\S]*\.evidence-financial-company a \{[\s\S]*min-height: 44px/, 'detailed Financial source links have a 44px target');
assert.match(styles, /--company-ident-bg/, 'mobile identity uses a light background');
assert.match(styles, /--company-ident-border/, 'mobile identity uses a thin border');
for (let index = 1; index <= 4; index += 1) {
  assert.match(styles, new RegExp(`data-company-token="company-${index}"`), `company-${index}: stable visual token exists`);
}
for (const sectionLabel of displayFixture.majorSections) {
  assert.ok(`${presentationSource}\n${readModelSource}`.includes(sectionLabel), `${sectionLabel}: major section label is present`);
}

if (process.argv.includes('--dist')) {
  const compareHtml = await readFile(new URL('../dist/compare/index.html', import.meta.url), 'utf8');
  const shellHtml = await readFile(new URL('../dist/evidence-fragments/company-compare-evidence-v01/index.html', import.meta.url), 'utf8');
  const builtAssetNames = await readdir(new URL('../dist/_astro/', import.meta.url));
  const controllerAssetName = builtAssetNames.find(name => /^company-compare-evidence-ui\..+\.js$/.test(name));
  assert.ok(controllerAssetName, 'built Company Compare controller asset is present');
  const controllerAsset = await readFile(new URL(`../dist/_astro/${controllerAssetName}`, import.meta.url), 'utf8');
  const pilotIds = [...fixture.setCompanyIds['set-a'], ...fixture.setCompanyIds['set-b']];
  const assetHtmlById = Object.fromEntries(await Promise.all(pilotIds.map(async companyId => [
    companyId,
    await readFile(new URL(`../dist/evidence-fragments/company-compare-evidence-v01/${companyId}/index.html`, import.meta.url), 'utf8'),
  ])));
  const fragmentHtml = pilotIds.map(companyId => assetHtmlById[companyId]).join('\n');
  const compareBytes = Buffer.byteLength(compareHtml);
  const baselineBytes = 585_468;
  const maximumBytes = 644_015;
  assert.ok(compareBytes <= maximumBytes, `legacy Compare HTML ${compareBytes} B must remain within 10% of ${baselineBytes} B`);
  assert.match(compareHtml, /id="company-compare-evidence-mount"/, 'built legacy HTML has the empty Evidence mount');
  assert.doesNotMatch(compareHtml, /data-claim-id=/, 'built legacy HTML excludes Company Claim bodies');
  assert.doesNotMatch(compareHtml, /data-relation-id=/, 'built legacy HTML excludes Relation bodies');
  assert.doesNotMatch(compareHtml, /class="evidence-drawer"/, 'built legacy HTML excludes Evidence drawers');
  assert.doesNotMatch(compareHtml, /class="evidence-expanded-financial"/, 'built legacy HTML excludes expanded financial history');
  assert.doesNotMatch(compareHtml, /AIファクトリーの計算・接続層を統合/, 'built legacy HTML excludes a Pilot Claim-specific title');
  assert.ok(relations.every(relation => !compareHtml.includes(relation.statement)), 'built legacy HTML excludes all Relation statements');

  assertWithinBoundary(Buffer.byteLength(shellHtml), onDemandSize.maximumShellRawBytes, 'Evidence shell');
  assert.doesNotMatch(shellHtml, /data-claim-id=|data-relation-id=|class="evidence-drawer"|class="evidence-financial-company"/, 'Evidence shell contains no Company projection bodies');
  assert.match(shellHtml, /"companyManifest"/, 'Evidence shell contains the lightweight manifest');
  for (const copy of [
    expectedProductPortfolioSummaries.nvidia.title,
    expectedProductPortfolioSummaries.broadcom.title,
    expectedProductPortfolioSummaries['lam-research'].title,
    expectedProductPortfolioSummaries['tokyo-electron'].title,
  ]) {
    assert.ok(!controllerAsset.includes(copy), 'new Product portfolio copy remains inside Company assets, not the shared controller');
  }
  for (const companyId of pilotIds) {
    const assetHtml = assetHtmlById[companyId];
    assert.equal((assetHtml.match(/data-company-compare-asset/g) ?? []).length, 1, `${companyId}: one asset envelope`);
    assert.match(assetHtml, new RegExp(`data-company-id="${companyId}"`), `${companyId}: asset identity matches route`);
    const embeddedCompanyIds = [...assetHtml.matchAll(/data-company-id="([^"]+)"/g)].map(match => match[1]);
    assert.ok(embeddedCompanyIds.every(id => id === companyId), `${companyId}: asset contains no other Company projection`);
    assertWithinBoundary(Buffer.byteLength(assetHtml), onDemandSize.maximumCompanyAssetRawBytes, `${companyId}: individual raw asset`);
    assertWithinBoundary(gzipSync(assetHtml).byteLength, onDemandSize.maximumCompanyAssetGzipBytes, `${companyId}: individual gzip asset`);
  }
  const combinations = (values, maximum) => {
    const result = [];
    const visit = (start, picked) => {
      if (picked.length) result.push([...picked]);
      if (picked.length === maximum) return;
      for (let index = start; index < values.length; index += 1) visit(index + 1, [...picked, values[index]]);
    };
    visit(0, []);
    return result;
  };
  for (const selectedIds of combinations(pilotIds, 4)) {
    const rawBytes = Buffer.byteLength(shellHtml) + selectedIds.reduce((sum, id) => sum + Buffer.byteLength(assetHtmlById[id]), 0);
    assertWithinBoundary(rawBytes, onDemandSize.maximumColdLoadRawBytes, `${selectedIds.join('+')}: 1-4 Company initial raw payload`);
  }
  for (const setId of ['set-a', 'set-b']) {
    const setIds = fixture.setCompanyIds[setId];
    const setHtml = setIds.map(id => assetHtmlById[id]).join('\n');
    const setRawBytes = Buffer.byteLength(shellHtml) + Buffer.byteLength(setHtml);
    assertWithinBoundary(setRawBytes, onDemandSize.maximumSetRawBytes, `${setId}: initial shell plus selected assets`);
    const summaryMarkers = (setHtml.match(/class="evidence-(?:claim|relation)-entry(?: [^"]*)?"[^>]*data-summary="show"/g) ?? []).length;
    const expandedMarkers = (setHtml.match(/class="evidence-(?:claim|relation)-entry(?: [^"]*)?"/g) ?? []).length;
    assert.equal(summaryMarkers, displayFixture.summaryMarkerCounts[setId], `${setId}: summary marker count is unchanged`);
    assert.equal(expandedMarkers, setId === 'set-a' ? 21 : 32, `${setId}: expanded marker count is unchanged`);
    assert.equal((setHtml.match(/data-product-description=/g) ?? []).length, setId === 'set-a' ? 6 : 9, `${setId}: expanded Product-description count is unchanged`);
  }

  const claimMarkers = (fragmentHtml.match(/data-claim-id=/g) ?? []).length;
  const claimMarkerIds = [...fragmentHtml.matchAll(/data-claim-id="([^"]+)"/g)].map(match => match[1]);
  const relationMarkers = (fragmentHtml.match(/data-relation-id=/g) ?? []).length;
  const drawers = [...fragmentHtml.matchAll(/<dialog class="evidence-drawer" id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(claimMarkers, 34, 'fragment includes all canonical Claim entries');
  assert.equal(new Set(claimMarkerIds).size, claimMarkerIds.length, 'detail content has no duplicate Claim entries');
  assert.deepEqual([...claimMarkerIds].sort(), projectedClaimIds, 'detail content has no missing Claim entry');
  assert.equal(relationMarkers, 19, 'fragment includes all canonical Relation entries');
  assert.equal(drawers.length, 53, 'fragment includes one Evidence drawer per marker');
  assert.equal(new Set(drawers).size, drawers.length, 'fragment has no duplicate drawer IDs');
  assert.match(fragmentHtml, /data-pagefind-ignore="all"/, 'built Company assets are outside the Pagefind corpus');
  assert.equal((fragmentHtml.match(/data-company-order-label/g) ?? []).length, 35, 'seven matrix sections retain five repeated company identity labels');
  assert.match(fragmentHtml, /Applied Materials（アプライド・マテリアルズ）/, 'built Set B has the exact Japanese Applied Materials name');
  assert.match(fragmentHtml, /統合材料ソリューション（Integrated Materials Solution）/, 'general Japanese term precedes the formal English name');
  assert.match(fragmentHtml, /米国オレゴン州チュアラティン/, 'mixed-language geography is localized');
  assert.doesNotMatch(fragmentHtml, /オレゴン州Tualatin/, 'mixed-language geography is absent');
  assert.doesNotMatch(fragmentHtml, /正規化した位置|正規化した製品カテゴリ|正規化された位置/, 'built primary UI contains no normalization terminology');
  assert.doesNotMatch(fragmentHtml, /products[：:]/, 'built primary UI contains no raw products field label');
  assert.doesNotMatch(fragmentHtml, /関係データ：収録なし/, 'built primary UI contains no Relation collection-state message');
  const primaryFragmentHtml = fragmentHtml.replace(/<dialog class="evidence-drawer"[\s\S]*?<\/dialog>/g, '');
  for (const phrase of displayFixture.prohibitedPrimaryPhrases) {
    assert.ok(!primaryFragmentHtml.includes(phrase), `built primary UI omits editorial phrase: ${phrase}`);
  }
  assert.match(primaryFragmentHtml, />事実</, 'built primary UI retains the Fact label');
  assert.match(primaryFragmentHtml, />Atlasの見方</, 'built primary UI identifies Atlas Analysis with the reviewed label');
  assert.match(fragmentHtml, /供給網上の位置/, 'built matrix retains the user-facing supply-chain label');
  assert.match(fragmentHtml, /<strong[^>]*>半導体製造<\/strong>/, 'supply-chain position is presented as the value without an internal subheading');
  const productDescriptionInstances = [...fragmentHtml.matchAll(/data-product-description="([^"]+)"/g)].map(match => match[1]);
  assert.equal(productDescriptionInstances.length, 15, 'expanded mode contains 11 Relation-backed and four Claim-backed Product descriptions');
  assert.deepEqual([...new Set(productDescriptionInstances)].sort(), productIds, 'built descriptions cover all 11 canonical Product IDs');
  assert.ok(productDescriptionInstances.every(productId => fragmentHtml.includes(compareProductDisplayDescriptions[productId].description)), 'built Product descriptions use only fixture-locked copy');
  assert.match(fragmentHtml, /class="evidence-product-description" data-expanded-only data-product-description=/, 'Product descriptions are expanded-only');
  for (const companyId of companyCompareProductPortfolioCompanyIds) {
    const productTemplate = assetHtmlById[companyId].match(/<template data-company-slot="key-products"[\s\S]*?<\/template>/)?.[0] ?? '';
    const expected = expectedProductPortfolioSummaries[companyId];
    assert.match(productTemplate, /class="evidence-claim-entry evidence-product-portfolio-summary"/, `${companyId}: Product summary uses the shared portfolio class`);
    assert.match(productTemplate, /data-product-portfolio-summary="true" data-summary-visible="false" data-expanded-visible="true"/, `${companyId}: Product title and body are expanded-only`);
    assert.ok(productTemplate.includes(`>${expected.title}</h3>`), `${companyId}: reviewed Product portfolio title is rendered`);
    assert.ok(productTemplate.includes(`${expected.body}<button class="evidence-marker"`), `${companyId}: reviewed Product portfolio body owns its Evidence marker`);
    assert.equal((productTemplate.match(new RegExp(`data-evidence-open="evidence-${expected.groundingId}"`, 'g')) ?? []).length, 1, `${companyId}: Product portfolio grounding marker is rendered once`);
    assert.doesNotMatch(productTemplate, /<h3>製品構成<\/h3>|下記の製品カテゴリを提供する。|<h3>主な製品<\/h3>|以下の製品を提供する。/, `${companyId}: no generic Product fallback is rendered`);
  }
  const tokyoAssetHtml = assetHtmlById['tokyo-electron'];
  const tokyoRoleTemplate = tokyoAssetHtml.match(/<template data-company-slot="ai-role"[\s\S]*?<\/template>/)?.[0] ?? '';
  const tokyoProductsTemplate = tokyoAssetHtml.match(/<template data-company-slot="key-products"[\s\S]*?<\/template>/)?.[0] ?? '';
  assert.match(tokyoRoleTemplate, /<h3 class="evidence-subsection-title">供給網上の位置<\/h3>/, 'Tokyo Electron retains the supply-chain subsection');
  assert.match(tokyoRoleTemplate, /data-expanded-only><h3>半導体前工程製造装置の供給層<\/h3><p class="claim-statement">先端ロジックとメモリ向けに、幅広い半導体前工程製造装置を供給する。<\/p>/, 'Tokyo Electron expanded role retains the reviewed title and description without a duplicate marker');
  assert.match(tokyoRoleTemplate, /class="pilot-claim pilot-claim-list[^"]*"[^>]*><p class="claim-statement claim-statement-list"[^>]*><strong[^>]*>半導体製造<\/strong><button class="evidence-marker"/, 'Tokyo Electron supply-chain position uses the common list entry renderer');
  assert.equal((tokyoRoleTemplate.match(/data-evidence-open="evidence-tokyo-electron-value-chain"/g) ?? []).length, 1, 'Tokyo Electron position has exactly one Evidence marker in summary and expanded DOM');
  assert.match(tokyoRoleTemplate, /<dt>対象範囲<\/dt><dd>企業全体<\/dd>/, 'Tokyo Electron position exposes only existing scope metadata');
  assert.match(tokyoRoleTemplate, /<dt>更新状況<\/dt><dd>確認期限内<\/dd>/, 'Tokyo Electron position exposes derived existing freshness metadata');
  assert.doesNotMatch(tokyoProductsTemplate, /<h3>主な製品<\/h3>/, 'Tokyo Electron has no repeated Product heading');
  assert.match(tokyoProductsTemplate, /<h3[^>]*>前工程の主要工程を幅広くカバー<\/h3><p class="claim-statement"[^>]*>塗布・現像、エッチング、成膜、洗浄の各工程に対応する装置を展開する。<button class="evidence-marker"/, 'Tokyo Electron uses the reviewed Product portfolio summary in expanded mode');
  assert.equal((tokyoProductsTemplate.match(/data-evidence-open="evidence-tokyo-electron-products"/g) ?? []).length, 1, 'Tokyo Electron Product group has exactly one Evidence marker');
  const tokyoProductIds = [...tokyoProductsTemplate.matchAll(/<li data-canonical-id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(tokyoProductIds, compareProductIdsByClaimId['tokyo-electron-products'], 'Tokyo Electron keeps all four Product entries in canonical reviewed order');
  assert.deepEqual(
    [...tokyoProductsTemplate.matchAll(/<li data-canonical-id="[^"]+"[^>]*><strong>([^<]+)<\/strong>/g)].map(match => match[1]),
    ['塗布・現像装置', '半導体エッチング装置', '半導体成膜装置', 'ウェーハ洗浄装置'],
    'Tokyo Electron keeps the reviewed four visible Product names in order',
  );
  assert.equal((tokyoProductsTemplate.match(/class="evidence-product-description" data-expanded-only/g) ?? []).length, 4, 'Tokyo Electron uses four common expanded Product entries');
  const expandedFinancialHtml = pilotIds.map(companyId => {
    const match = assetHtmlById[companyId].match(/<template data-company-slot="expanded-financial">([\s\S]*?)<\/template>/);
    assert.ok(match, `${companyId}: detailed Financial template is present`);
    return match[1];
  }).join('\n');
  assert.equal((expandedFinancialHtml.match(/scope="col"/g) ?? []).length, 40, 'five tables retain all eight semantic column headings');
  assert.equal((expandedFinancialHtml.match(/class="financial-basis"/g) ?? []).length, 5, 'accounting basis appears once per Company table');
  assert.equal((expandedFinancialHtml.match(/会計基準：米国会計基準/g) ?? []).length, 4, 'four USD tables show the Japanese US accounting-basis label once');
  assert.equal((expandedFinancialHtml.match(/会計基準：日本会計基準/g) ?? []).length, 1, 'Tokyo Electron shows the Japanese accounting-basis label once');
  for (const token of displayFixture.financialDetailTable.forbiddenDetailedEnglishLabels) {
    assert.ok(!expandedFinancialHtml.includes(token), `detailed Financial primary UI omits internal label: ${token}`);
  }
  const amountHeaderNames = ['売上高', '営業利益', 'フリーキャッシュフロー', '設備投資'];
  for (const label of amountHeaderNames) {
    assert.equal((expandedFinancialHtml.match(new RegExp(`${label}<br>（百万ドル）`, 'g')) ?? []).length, 4, `${label}: four USD tables expose the continuous accessible unit label`);
    assert.equal((expandedFinancialHtml.match(new RegExp(`${label}<br>（百万円）`, 'g')) ?? []).length, 1, `${label}: Tokyo Electron exposes the continuous accessible unit label`);
  }
  const orderedPilotCompanyIds = [...fixture.setCompanyIds['set-a'], ...fixture.setCompanyIds['set-b']];
  const orderedFinancialRecords = orderedPilotCompanyIds.flatMap(companyId => compareFinancialHistory
    .filter(record => record.companyId === companyId)
    .sort((left, right) => left.endDate.localeCompare(right.endDate) || left.id.localeCompare(right.id)));
  const displayedPeriods = [...expandedFinancialHtml.matchAll(/<th class="period" scope="row">([^<]+)<\/th>/g)].map(match => match[1]);
  assert.deepEqual(displayedPeriods, orderedFinancialRecords.map(record => formatCompareFinancialPeriodLabel(record.periodLabel)), 'display period labels preserve canonical Company, date, and ID order');
  const financialMetricIds = displayFixture.financialDetailTable.metricIds;
  const formatExpectedFinancialValue = (metricId, value) => value == null
    ? '未収録'
    : metricId === 'operatingMargin' || metricId === 'roic'
      ? `${Number(value).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}%`
      : Number(value).toLocaleString('ja-JP', { maximumFractionDigits: 3 });
  const expectedFinancialCells = orderedFinancialRecords.flatMap(record => financialMetricIds.map(metricId => formatExpectedFinancialValue(metricId, record.metrics[metricId]?.value)));
  const displayedFinancialCells = [...expandedFinancialHtml.matchAll(/<td class="(?:num|missing)">([^<]+)<\/td>/g)].map(match => match[1]);
  assert.deepEqual(displayedFinancialCells, expectedFinancialCells, 'display values, missing states, row counts, and order remain canonical');
  assert.equal((expandedFinancialHtml.match(/class="evidence-source-link"/g) ?? []).length, orderedFinancialRecords.length, 'each canonical Financial row retains one Source link in order');
  for (const [companyId, displayValue] of Object.entries(displayFixture.financialDetailTable.maxDigitFixtures)) {
    assert.ok(fragmentHtml.includes(displayValue), `${companyId}: realistic maximum-digit Financial value remains present`);
  }
  assert.equal((fragmentHtml.match(/class="evidence-financial-scroll"/g) ?? []).length, 5, 'NVIDIA, Broadcom, and Set B use the same detailed Financial table');
  assert.match(fragmentHtml, /class="num">2,431,568<\/td>/, 'maximum Set B value is rendered as an unwrapped numeric cell');
  assert.match(fragmentHtml, /class="missing">未収録<\/td>/, 'missing status is rendered outside the numeric class');
  console.log(`Company Compare on-demand artifacts OK: ${compareBytes} B legacy HTML / ${Buffer.byteLength(shellHtml)} B shell / ${claimMarkers + relationMarkers} markers across five Company assets`);
}

console.log(`Company Compare Evidence UI tests OK: Set A/B / routing / URL state / ${claimMarkerCount + relationMarkerCount} markers / Financial 0/2/2 / semantic snapshot`);
