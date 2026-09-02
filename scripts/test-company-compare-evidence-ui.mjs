import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
  compareClaimDisplayCopy,
  compareCompanyPresentationTokens,
  compareGenericTermTranslations,
  comparePreservedProperNouns,
  companyCompareDisplayName,
  companyPresentationTokenForOrder,
  dedupeCompareCanonicalItems,
} from '../src/lib/company-compare-display.ts';

const readJson = async relative => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
const projection = await readJson('../src/data/company-compare-evidence-pilot-v01.json');
const relations = await readJson('../src/data/relationships.json');
const relationBindings = await readJson('../src/data/relation-evidence-bindings-v01.json');
const evidenceManifest = await readJson('../src/data/company-evidence-manifest.json');
const sourceManifest = await readJson('../src/data/source-registry-manifest.json');
const fixture = await readJson('./fixtures/company-compare-evidence-ui-snapshot-v01.json');
const displayFixture = await readJson('./fixtures/company-compare-japanese-display-v01.json');
const comparePage = await readFile(new URL('../src/pages/compare.astro', import.meta.url), 'utf8');
const fragmentPage = await readFile(new URL('../src/pages/evidence-fragments/company-compare-evidence-v01.astro', import.meta.url), 'utf8');
const component = await readFile(new URL('../src/components/CompanyCompareEvidence.astro', import.meta.url), 'utf8');
const claimComponent = await readFile(new URL('../src/components/CompanyCompareEvidenceClaim.astro', import.meta.url), 'utf8');
const controller = await readFile(new URL('../src/scripts/company-compare-evidence-ui.ts', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles/company-compare-evidence-v01.css', import.meta.url), 'utf8');
const readModelSource = await readFile(new URL('../src/lib/company-compare-evidence-read-model.ts', import.meta.url), 'utf8');
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

assert.deepEqual(
  Object.keys(compareClaimDisplayCopy).sort(),
  displayFixture.claimDisplayIds,
  'all and only 34 projected Claims have fixed Compare display copy',
);
assert.deepEqual(compareGenericTermTranslations, displayFixture.genericTermTranslations, 'Japanese generic-term policy is fixture-locked');
assert.deepEqual(comparePreservedProperNouns, displayFixture.preservedProperNouns, 'allowed proper nouns are fixture-locked');
assert.deepEqual(compareCompanyPresentationTokens, displayFixture.presentationTokens, 'four presentation-order tokens are fixed');
const projectedClaimIds = [...new Set(projection.sets.flatMap(setRecord => setRecord.companies.flatMap(company =>
  company.dimensions.flatMap(dimension => dimension.initialClaimIds),
)))].sort();
assert.deepEqual(projectedClaimIds, displayFixture.claimDisplayIds, 'display copy coverage equals the projection Claim corpus');
for (const claimId of projectedClaimIds) {
  const display = compareClaimDisplayCopy[claimId];
  assert.deepEqual(display.groundingIds, [claimId], `${claimId}: display sentence is deterministically grounded`);
  assert.ok(display.title.trim() && display.statement.trim(), `${claimId}: display title and statement are non-empty`);
}
for (const [companyId, expectedName] of Object.entries(displayFixture.companyDisplayNames)) {
  assert.equal(companyCompareDisplayName(pilotCompanyRecords[companyId]), expectedName, `${companyId}: one canonical Japanese display name`);
}
assert.equal(
  companyCompareDisplayName(pilotCompanyRecords['applied-materials']),
  'Applied Materials（アプライド・マテリアルズ）',
  'Applied Materials never mixes English-only and Japanese-only display names',
);
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
for (const properNoun of ['NVIDIA AI Enterprise', 'DGX Cloud', 'GPU', 'CPU', 'DPU', 'ASIC']) {
  assert.ok(displayCopyText.includes(properNoun), `${properNoun}: preserved in display copy`);
}
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
assert.match(component, /CompanyCompareEvidenceClaim/, 'Compare-only Evidence presentation keeps the existing drawer contract isolated');
assert.match(component, /data-pagefind-ignore="all"/, 'only the opt-in Evidence subtree is excluded from Pagefind');
assert.doesNotMatch(component, /initCompanyCompareEvidenceUi/, 'fragment does not initialize its controller before mount');
assert.doesNotMatch(component, /verificationStatus:\s*['"]verified['"]/, 'Relation adapter must not invent Company Claim verification state');
assert.match(component, /verificationPresentation=\{entry\.verification\}/, 'Relation verification presentation is Binding-derived');
assert.match(component, /drawerTitle="関係の根拠"/, 'Relation drawer has an accessible Japanese title');
assert.match(component, /根拠の対応/);
assert.match(component, /根拠箇所の確認日/);
assert.match(component, /scope="col"/);
assert.match(component, /scope="row"/);
assert.match(component, /data-evidence-section-link/);
assert.match(component, /data-claim-priority/);
assert.match(component, />補足</);
assert.match(component, />事実</);
assert.match(component, />会社見解</);
assert.match(component, />Atlasによる分析</);
assert.match(component, /関係データ：収録なし/);
assert.match(component, /data-canonical-id=\{entry\.relation\.objectId\}/, 'rendered Product entries retain canonical Registry IDs');
assert.match(component, /relationsForDisplay/, 'Product display is de-duplicated before rendering');
assert.match(component, /主要比較には表示しません/);
assert.match(component, /為替換算、順位、差分率は算出しません/);
assert.doesNotMatch(component, /id=\{`evidence-section-\$\{['"]value-chain-position/, 'Value Chain is not a repeated standalone major section');
assert.match(component, /sourceDimensionIds/, 'AI role groups its supply-chain position without changing projection data');
assert.match(component, /data-display-grounding-ids/, 'every Compare display entry exposes deterministic grounding IDs');
assert.match(component, /data-company-order-label/, 'every company information block repeats number and name');
assert.match(component, /displayTitle=\{entry\.display\.title\}/, 'visible Claim copy comes from the display-only read model');
assert.match(claimComponent, /<h4>\{claim\.title\}<\/h4>/, 'Evidence drawer retains the canonical Claim title');
assert.match(claimComponent, /class="drawer-statement">\{claim\.statement\}/, 'Evidence drawer retains the canonical Claim statement');
assert.match(claimComponent, /aria-haspopup="dialog"/);
assert.match(claimComponent, /data-evidence-open/);
assert.match(claimComponent, /verified: \{ short: '確認済み', full: '根拠箇所まで確認済み' \}/, 'Company Claim verified presentation remains unchanged');
assert.match(claimComponent, /'source-linked': \{ short: '一次資料あり', full: '一次資料紐付け済み・確認未了' \}/, 'Company Claim source-linked presentation remains unchanged');
assert.match(claimComponent, /'needs-review': \{ short: '要確認', full: '要再検証' \}/, 'Company Claim needs-review presentation remains unchanged');
assert.match(controller, /if \(!state\.enabled\) throw new Error/, 'Evidence controller reports an invalid non-Evidence initialization');
assert.match(controller, /evidenceControllerInitialized/, 'Evidence controller initializes at most once after mount');
assert.match(controller, /evidenceControllerInitialized === 'true'\) return true/, 'a completed controller can be initialized idempotently');
assert.match(controller, /export function initCompanyCompareEvidenceUi\(\): boolean/, 'controller exposes an explicit success contract');
assert.match(controller, /requiredElement/, 'controller throws when required DOM is missing');
assert.match(controller, /event\.key === 'Escape'/);
assert.match(controller, /event\.key !== 'Enter' && event\.key !== ' '/, 'Evidence markers have an explicit keyboard activation contract');
assert.match(controller, /returnFocus/);
assert.match(controller, /window\.addEventListener\('popstate'/);
assert.match(controller, /unresolvedFinancial/);
assert.match(controller, /\.evidence-expanded-financial, \.evidence-trace-list/);
assert.match(controller, /companyCompareDisplayName/, 'selected rows and suggestions share one company-name helper');
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
assert.match(styles, /\.evidence-company-context/, 'desktop repeats the company name within every major section');
assert.match(styles, /\.evidence-company-context > strong/, 'identity is not color-only');
assert.match(styles, /font-size: 16px/, 'mobile primary text has a 16px floor');
assert.match(styles, /font-size: 14px/, 'mobile metadata has a 14px floor');
assert.match(styles, /--company-ident-bg/, 'mobile identity uses a light background');
assert.match(styles, /--company-ident-border/, 'mobile identity uses a thin border');
for (let index = 1; index <= 4; index += 1) {
  assert.match(styles, new RegExp(`data-company-token="company-${index}"`), `company-${index}: stable visual token exists`);
}
for (const sectionLabel of displayFixture.majorSections) {
  assert.ok(`${component}\n${readModelSource}`.includes(sectionLabel), `${sectionLabel}: major section label is present`);
}

if (process.argv.includes('--dist')) {
  const compareHtml = await readFile(new URL('../dist/compare/index.html', import.meta.url), 'utf8');
  const fragmentHtml = await readFile(new URL('../dist/evidence-fragments/company-compare-evidence-v01/index.html', import.meta.url), 'utf8');
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

  const claimMarkers = (fragmentHtml.match(/data-claim-id=/g) ?? []).length;
  const relationMarkers = (fragmentHtml.match(/data-relation-id=/g) ?? []).length;
  const drawers = [...fragmentHtml.matchAll(/<dialog class="evidence-drawer" id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(claimMarkers, 34, 'fragment includes all canonical Claim entries');
  assert.equal(relationMarkers, 19, 'fragment includes all canonical Relation entries');
  assert.equal(drawers.length, 53, 'fragment includes one Evidence drawer per marker');
  assert.equal(new Set(drawers).size, drawers.length, 'fragment has no duplicate drawer IDs');
  assert.match(fragmentHtml, /data-pagefind-ignore="all"/, 'built fragment is outside the Pagefind corpus');
  assert.ok(Buffer.byteLength(fragmentHtml) <= 314_669, `Evidence fragment ${Buffer.byteLength(fragmentHtml)} B must stay within 5% of 299685 B`);
  assert.equal((fragmentHtml.match(/data-company-order-label/g) ?? []).length, 35, 'seven matrix sections retain five repeated company identity labels');
  assert.match(fragmentHtml, /Applied Materials（アプライド・マテリアルズ）/, 'built Set B has the exact Japanese Applied Materials name');
  console.log(`Company Compare lazy artifact OK: ${compareBytes} B legacy HTML / ${Buffer.byteLength(fragmentHtml)} B fragment / ${claimMarkers + relationMarkers} markers`);
}

console.log(`Company Compare Evidence UI tests OK: Set A/B / routing / URL state / ${claimMarkerCount + relationMarkerCount} markers / Financial 0/2/2 / semantic snapshot`);
