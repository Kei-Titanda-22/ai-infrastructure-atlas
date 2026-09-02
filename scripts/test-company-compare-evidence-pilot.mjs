import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  initialRelationIdsForDimension,
  relationProjectionForCompany,
  retainAllMissingMetric,
  selectSupplementalP2,
} from '../src/lib/company-compare-evidence-pilot.ts';
import { assessNormalizedFinancialCompatibility } from '../src/lib/financial-comparison-contract.ts';

const fixture = JSON.parse(await readFile(new URL('./fixtures/phase8-pilot-relation-projection-cases.json', import.meta.url), 'utf8'));
const financialFixture = JSON.parse(await readFile(new URL('./fixtures/financial-compatibility-parity-v01.json', import.meta.url), 'utf8'));
const projectionUrl = new URL('../src/data/company-compare-evidence-pilot-v01.json', import.meta.url);
const relations = JSON.parse(await readFile(new URL('../src/data/relationships.json', import.meta.url), 'utf8'));
const projection = JSON.parse(await readFile(projectionUrl, 'utf8'));

const originalClaims = structuredClone(fixture.p2TieBreak.claims);
const selected = selectSupplementalP2(fixture.p2TieBreak.claims, fixture.p2TieBreak.categoryProjectionPriority);
assert.equal(selected.length, 1);
assert.equal(selected[0].id, fixture.p2TieBreak.expectedClaimId, 'categoryProjectionPriority must win across categories');
assert.deepEqual(fixture.p2TieBreak.claims, originalClaims, 'tie-break must not mutate input Claims');

const sameCategoryAsOf = selectSupplementalP2([
  { id: 'older', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2025-01-01' },
  { id: 'newer', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2026-01-01' },
], { risks: 10 });
assert.equal(sameCategoryAsOf[0].id, 'newer', 'same-category asOf descending');

const sameCategoryClaimId = selectSupplementalP2([
  { id: 'z-newer', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2026-01-01' },
  { id: 'a-newer', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2026-01-01' },
], { risks: 10 });
assert.equal(sameCategoryClaimId[0].id, 'a-newer', 'same-category claimId ascending');

const missingAsOf = selectSupplementalP2([
  { id: 'missing', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: null },
  { id: 'valid', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2026-01-01' },
], { risks: 10 });
assert.deepEqual(missingAsOf.map(claim => claim.id), ['valid'], 'missing asOf must be excluded');

const crossCategory = selectSupplementalP2([
  { id: 'strategy-newer', companyId: 'fixture', category: 'strategy', priority: 'P2', asOf: '2026-09-01' },
  { id: 'capacity-older', companyId: 'fixture', category: 'capacity-expansion', priority: 'P2', asOf: '2025-01-01' },
], { 'capacity-expansion': 10, strategy: 20 });
assert.equal(crossCategory[0].id, 'capacity-older', 'categoryProjectionPriority precedes asOf');

const missing = retainAllMissingMetric(fixture.allMissingMetric.metricId, fixture.allMissingMetric.companies);
assert.equal(missing.primaryVisible, fixture.allMissingMetric.expectedPrimaryVisible);
assert.equal(missing.retainedInDataQuality, fixture.allMissingMetric.expectedRetainedInDataQuality);

assert.equal(
  relationProjectionForCompany(
    fixture.relationZero.setId,
    fixture.relationZero.companyId,
    fixture.relationZero.resolvedRelations,
  ).length,
  fixture.relationZero.expectedCount,
  'zero-Relation input must be a valid read-model state',
);
assert.equal(
  fixture.guardedZero.relations.filter(relation => fixture.guardedZero.guardedTypes.includes(relation.relationType)).length,
  fixture.guardedZero.expectedCount,
  'guarded zero-record input must be valid',
);

const competitionRelations = relations.filter(relation => relation.relationType === 'COMPETES_WITH');
assert.equal(competitionRelations.length, 2, 'only two canonical symmetric competition records are authored');
const expectedCompetitionByCompany = {
  'applied-materials': ['rel-applied-materials-competes-with-lam-research'],
  'lam-research': ['rel-applied-materials-competes-with-lam-research', 'rel-lam-research-competes-with-tokyo-electron'],
  'tokyo-electron': ['rel-lam-research-competes-with-tokyo-electron'],
  nvidia: [],
  broadcom: [],
};
for (const [companyId, expected] of Object.entries(expectedCompetitionByCompany)) {
  const actual = initialRelationIdsForDimension(companyId, 'technology-moat', competitionRelations);
  assert.deepEqual(actual, expected, `${companyId}: canonical symmetric Relation projection`);
  assert.deepEqual(
    initialRelationIdsForDimension(companyId, 'technology-moat', [...competitionRelations].reverse()),
    expected,
    `${companyId}: Relation input order must not affect projection`,
  );
}
assert.deepEqual(initialRelationIdsForDimension('unrelated-company', 'technology-moat', competitionRelations), []);
for (const relation of competitionRelations) {
  assert.equal(
    competitionRelations.some(candidate => candidate.subjectId === relation.objectId && candidate.objectId === relation.subjectId),
    false,
    `${relation.relationId}: reverse Relation record must not exist`,
  );
}
for (const setRecord of projection.sets) {
  for (const company of setRecord.companies) {
    const technology = company.dimensions.find(dimension => dimension.dimensionId === 'technology-moat');
    assert.deepEqual(technology.initialRelationIds, expectedCompetitionByCompany[company.companyId]);
    assert.equal(new Set(technology.initialRelationIds).size, technology.initialRelationIds.length);
    const otherRelationIds = company.dimensions
      .filter(dimension => dimension.dimensionId !== 'technology-moat')
      .flatMap(dimension => dimension.initialRelationIds);
    assert.equal(technology.initialRelationIds.some(relationId => otherRelationIds.includes(relationId)), false);
  }
}

for (const testCase of financialFixture.bridgeParityCases) {
  const result = assessNormalizedFinancialCompatibility(
    'operatingMargin',
    testCase.companyIds,
    testCase.history,
    financialFixture.metricDefinitions,
  );
  assert.deepEqual(result.compatibility, testCase.expected, `${testCase.caseId}: existing Compare parity`);
  const reversed = assessNormalizedFinancialCompatibility(
    'operatingMargin',
    testCase.companyIds,
    [...testCase.history].reverse(),
    financialFixture.metricDefinitions,
  );
  assert.deepEqual(reversed, result, `${testCase.caseId}: history order stability`);
}
for (const testCase of financialFixture.projectionCases) {
  const result = assessNormalizedFinancialCompatibility(
    testCase.metricId,
    testCase.companyIds,
    testCase.history,
    financialFixture.metricDefinitions,
  );
  assert.deepEqual(result.compatibility, testCase.expected, `${testCase.caseId}: projection contract`);
}

const projectionBefore = await readFile(projectionUrl, 'utf8');
const python = process.env.PYTHON || 'python';
for (let iteration = 0; iteration < 2; iteration += 1) {
  const check = spawnSync(python, ['scripts/build-phase8-pilot-relation-data.py', '--check'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });
  assert.equal(check.status, 0, check.stdout + check.stderr);
}
assert.equal(await readFile(projectionUrl, 'utf8'), projectionBefore, 'repeat build checks must preserve byte-identical output');

console.log('Company Compare Evidence Pilot tests OK: P2 categoryProjectionPriority / COMPETES_WITH symmetry / Financial parity / stable repeat build');
