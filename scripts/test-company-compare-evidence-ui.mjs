import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  allSelectedMissing,
  evidenceComparePilotCompanyIds,
  evidenceCompareStableSections,
  financialPresentationForSelection,
  matchEvidencePilotSet,
  parseEvidenceCompareSearch,
  serializeEvidenceCompareSearch,
} from '../src/lib/company-compare-evidence-ui.ts';

const readJson = async relative => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
const projection = await readJson('../src/data/company-compare-evidence-pilot-v01.json');
const relations = await readJson('../src/data/relationships.json');
const relationBindings = await readJson('../src/data/relation-evidence-bindings-v01.json');
const evidenceManifest = await readJson('../src/data/company-evidence-manifest.json');
const sourceManifest = await readJson('../src/data/source-registry-manifest.json');
const fixture = await readJson('./fixtures/company-compare-evidence-ui-snapshot-v01.json');
const comparePage = await readFile(new URL('../src/pages/compare.astro', import.meta.url), 'utf8');
const component = await readFile(new URL('../src/components/CompanyCompareEvidence.astro', import.meta.url), 'utf8');
const claimComponent = await readFile(new URL('../src/components/CompanyEvidenceClaim.astro', import.meta.url), 'utf8');
const controller = await readFile(new URL('../src/scripts/company-compare-evidence-ui.ts', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles/company-compare-evidence-v01.css', import.meta.url), 'utf8');

const evidenceShards = await Promise.all(evidenceManifest.shards.map(file => readJson(`../src/data/${file}`)));
const sourceShards = await Promise.all(sourceManifest.shards.map(file => readJson(`../src/data/${file}`)));
const claims = evidenceShards.flatMap(shard => shard.claims);
const claimBindings = evidenceShards.flatMap(shard => shard.evidence);
const sources = sourceShards.flat();
const claimById = new Map(claims.map(claim => [claim.id, claim]));
const claimBindingById = new Map(claimBindings.map(binding => [binding.id, binding]));
const relationById = new Map(relations.map(relation => [relation.relationId, relation]));
const relationBindingsByRelation = new Map();
for (const binding of relationBindings) {
  const group = relationBindingsByRelation.get(binding.relationId) ?? [];
  group.push(binding);
  relationBindingsByRelation.set(binding.relationId, group);
}
const sourceIds = new Set(sources.map(source => source.id));
const companyIds = new Set(['nvidia', 'broadcom', 'applied-materials', 'lam-research', 'tokyo-electron', 'asml']);

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
        assert.ok(relationById.has(relationId), `${relationId}: visible Relation resolves`);
        const bindings = relationBindingsByRelation.get(relationId) ?? [];
        if (!bindings.length || bindings.some(binding => !sourceIds.has(binding.sourceId))) unresolvedEvidenceCount += 1;
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

assert.match(comparePage, /!evidenceMode/, 'legacy script must be gated only for the opt-in route');
assert.match(comparePage, /<CompanyCompareEvidence identities=/, 'Set A and B use one generic component');
assert.match(component, /CompanyEvidenceClaim/, 'existing Evidence drawer component is reused');
assert.match(component, /scope="col"/);
assert.match(component, /scope="row"/);
assert.match(component, /data-evidence-section-link/);
assert.match(component, /data-claim-priority/);
assert.match(component, />補足</);
assert.match(component, />事実</);
assert.match(component, />会社見解</);
assert.match(component, />Atlasによる分析</);
assert.match(component, /Relation：収録なし/);
assert.match(component, /entry\.objectLabel/);
assert.match(component, /Primary comparisonには表示しません/);
assert.match(component, /FX換算、順位、差分率は算出しません/);
assert.match(claimComponent, /aria-haspopup="dialog"/);
assert.match(claimComponent, /data-evidence-open/);
assert.match(controller, /event\.key === 'Escape'/);
assert.match(controller, /returnFocus/);
assert.match(controller, /window\.addEventListener\('popstate'/);
assert.match(controller, /unresolvedFinancial/);
assert.match(controller, /\.evidence-expanded-financial, \.evidence-trace-list/);
assert.match(styles, /min-height: 44px/);
assert.match(styles, /#legacy-compare-templates\[hidden\]/);
assert.match(styles, /scroll-margin-top: 5rem/);
assert.match(styles, /@media \(max-width: 600px\)/);
assert.match(styles, /overflow: visible/);

console.log(`Company Compare Evidence UI tests OK: Set A/B / routing / URL state / ${claimMarkerCount + relationMarkerCount} markers / Financial 0/2/2 / semantic snapshot`);
