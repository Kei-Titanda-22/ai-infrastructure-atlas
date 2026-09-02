import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  assessFinancialCompatibility,
  relationProjectionForCompany,
  retainAllMissingMetric,
  selectSupplementalP2,
} from '../src/lib/company-compare-evidence-pilot.ts';

const fixture = JSON.parse(await readFile(new URL('./fixtures/phase8-pilot-relation-projection-cases.json', import.meta.url), 'utf8'));

const originalClaims = structuredClone(fixture.p2TieBreak.claims);
const selected = selectSupplementalP2(fixture.p2TieBreak.claims, fixture.p2TieBreak.categoryPriority);
assert.equal(selected.length, 1);
assert.equal(selected[0].id, fixture.p2TieBreak.expectedClaimId);
assert.deepEqual(fixture.p2TieBreak.claims, originalClaims, 'tie-break must not mutate input Claims');

const samePriority = selectSupplementalP2([
  { id: 'older', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2025-01-01' },
  { id: 'z-newer', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2026-01-01' },
  { id: 'a-newer', companyId: 'fixture', category: 'risks', priority: 'P2', asOf: '2026-01-01' },
], { risks: 10 });
assert.equal(samePriority[0].id, 'a-newer', 'asOf desc and claimId asc must break equal display priority');

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

const caution = assessFinancialCompatibility('operatingMargin', [
  { id: 'a', metrics: { operatingMargin: { value: 20, definitionId: 'operatingMargin', period: 'FY2026 Q1', basis: 'U.S. GAAP' } } },
  { id: 'b', metrics: { operatingMargin: { value: 25, definitionId: 'operatingMargin', period: 'FY2027 Q1', basis: 'Japanese GAAP' } } },
]);
assert.equal(caution.code, 'caution');
assert.deepEqual(caution.reasons, ['対象期間が異なる']);

const blocked = assessFinancialCompatibility('revenueGrowth', [
  { id: 'a', metrics: { revenueGrowth: { value: 10, definitionId: 'reported-yoy', period: 'FY2026 Q1', basis: 'U.S. GAAP' } } },
  { id: 'b', metrics: { revenueGrowth: { value: 12, definitionId: 'organic-yoy', period: 'FY2026 Q1', basis: 'U.S. GAAP' } } },
]);
assert.equal(blocked.code, 'blocked');
assert.deepEqual(blocked.reasons, ['指標定義が異なります']);

console.log('Company Compare Evidence Pilot tests OK: tie-break / metadata exclusion / missing / Relation 0 / guarded 0 / Financial');
