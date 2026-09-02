import assert from 'node:assert/strict';

import fixture from './fixtures/relation-foundation-valid-v01.json' with { type: 'json' };
import {
  buildResolvedRelations,
  deriveRelationFreshness,
  relationEvidenceBindings,
  relations,
  resolvedRelations,
  serializeResolvedRelations,
} from '../src/lib/relations.ts';

assert.equal(relations.length, 0);
assert.equal(relationEvidenceBindings.length, 0);
assert.equal(resolvedRelations.length, 0);
assert.equal(Object.isFrozen(relations), true);
assert.equal(Object.isFrozen(relationEvidenceBindings), true);
assert.equal(Object.isFrozen(resolvedRelations), true);

const { relations: validRelations, bindings: validBindings } = fixture.populated;
const referenceDate = new Date('2026-09-02T00:00:00Z');
const resolved = buildResolvedRelations(validRelations, validBindings, referenceDate);
assert.equal(resolved.length, 1);
assert.deepEqual(resolved[0].evidenceIds, ['rel-evidence-company-a-produces-gpu']);
assert.deepEqual(resolved[0].sourceIds, ['source-fixture-primary']);
assert.equal(resolved[0].freshnessStatus, 'current');
assert.equal(Object.isFrozen(resolved[0]), true);
assert.equal(Object.isFrozen(resolved[0].scope), true);
assert.equal(Object.isFrozen(resolved[0].evidenceIds), true);
assert.equal(Object.isFrozen(resolved[0].sourceIds), true);

const extraBinding = {
  ...validBindings[0],
  id: 'rel-evidence-company-a-produces-gpu-context',
  support: 'context',
};
const reordered = buildResolvedRelations(
  [...validRelations].reverse(),
  [validBindings[0], extraBinding].reverse(),
  referenceDate,
);
assert.deepEqual(reordered[0].evidenceIds, [
  'rel-evidence-company-a-produces-gpu',
  'rel-evidence-company-a-produces-gpu-context',
]);
assert.deepEqual(reordered[0].sourceIds, ['source-fixture-primary']);
assert.equal(serializeResolvedRelations(reordered), serializeResolvedRelations([...reordered].reverse()));

assert.equal(deriveRelationFreshness('2026-09-02', referenceDate), 'current');
assert.equal(deriveRelationFreshness('2026-08-01', referenceDate), 'review-due');
assert.equal(deriveRelationFreshness('2026-01-01', referenceDate), 'stale');
assert.equal(deriveRelationFreshness(null, referenceDate), 'stale');
assert.notEqual(deriveRelationFreshness(null, referenceDate), 'not-applicable');

assert.throws(
  () => buildResolvedRelations(validRelations, [{ ...validBindings[0], relationId: 'rel-unknown' }], referenceDate),
  /unknown Relation/,
);
assert.throws(
  () => buildResolvedRelations(validRelations, [validBindings[0], validBindings[0]], referenceDate),
  /Duplicate Relation Evidence Binding ID/,
);

console.log(
  'Relation loader tests OK: production empty state / deterministic resolved IDs / '
  + 'three-state freshness / immutable output / orphan and duplicate guards',
);
