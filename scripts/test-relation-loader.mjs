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

assert.equal(relations.length, 17);
assert.equal(relationEvidenceBindings.length, 17);
assert.equal(resolvedRelations.length, 17);
assert.equal(Object.isFrozen(relations), true);
assert.equal(Object.isFrozen(relationEvidenceBindings), true);
assert.equal(Object.isFrozen(resolvedRelations), true);

const { relations: validRelations, bindings: validBindings } = fixture.populated;
const referenceDate = new Date('2026-09-02T00:00:00Z');
assert.deepEqual(buildResolvedRelations([], [], referenceDate), []);
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

const reverseObjectKeys = value => {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).reverse().map(([key, nestedValue]) => [key, reverseObjectKeys(nestedValue)]),
    );
  }
  return value;
};

const relationA = {
  ...validRelations[0],
  scope: {
    ...validRelations[0].scope,
    productIds: ['product-category-networking', 'product-category-gpu'],
    technologyIds: ['technology-zeta', 'technology-alpha'],
    valueChainNodeIds: ['manufacturing', 'compute'],
    marketIds: ['market-networking', 'market-data-center'],
    geographies: ['united-states', 'japan'],
  },
  statement: '日本語の意味を保持するRelation。',
};
const relationB = {
  ...validRelations[0],
  relationId: 'rel-company-b-produces-gpu',
  subjectId: 'company-b',
  statement: 'Company B produces the generic GPU product category.',
};
const deterministicBindings = [
  {
    ...validBindings[0],
    id: 'rel-evidence-company-a-produces-gpu-z',
    sourceId: 'source-z',
  },
  {
    ...validBindings[0],
    id: 'rel-evidence-company-a-produces-gpu-a',
    sourceId: 'source-a',
  },
  {
    ...validBindings[0],
    id: 'rel-evidence-company-b-produces-gpu',
    relationId: relationB.relationId,
    sourceId: 'source-b',
  },
];
const canonicalInput = buildResolvedRelations(
  [relationA, relationB],
  deterministicBindings,
  referenceDate,
);
const reorderedRelationA = reverseObjectKeys({
  ...relationA,
  scope: Object.fromEntries(
    Object.entries(relationA.scope).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value].reverse() : value,
    ]),
  ),
});
const reorderedInput = buildResolvedRelations(
  [reverseObjectKeys(relationB), reorderedRelationA],
  deterministicBindings.map(reverseObjectKeys).reverse(),
  referenceDate,
);
const canonicalBefore = JSON.stringify(canonicalInput);
const reorderedBefore = JSON.stringify(reorderedInput);
const canonicalSerialization = serializeResolvedRelations(canonicalInput);
assert.equal(canonicalSerialization, serializeResolvedRelations(reorderedInput));
const derivedArraysReordered = [...canonicalInput].reverse().map(relation => ({
  ...relation,
  scope: {
    ...relation.scope,
    productIds: [...relation.scope.productIds].reverse(),
    technologyIds: [...relation.scope.technologyIds].reverse(),
    valueChainNodeIds: [...relation.scope.valueChainNodeIds].reverse(),
    marketIds: [...relation.scope.marketIds].reverse(),
    geographies: [...relation.scope.geographies].reverse(),
  },
  evidenceIds: [...relation.evidenceIds].reverse(),
  sourceIds: [...relation.sourceIds].reverse(),
}));
assert.equal(canonicalSerialization, serializeResolvedRelations(derivedArraysReordered));
assert.equal(JSON.stringify(canonicalInput), canonicalBefore);
assert.equal(JSON.stringify(reorderedInput), reorderedBefore);
assert.match(canonicalSerialization, /日本語の意味を保持するRelation。/u);
assert.notEqual(
  canonicalSerialization,
  serializeResolvedRelations([{ ...canonicalInput[0], statement: 'Meaningful change.' }, canonicalInput[1]]),
);

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
  'Relation loader tests OK: production 17/17 / explicit empty state / canonical key and ID-array serialization / '
  + 'Unicode preservation / non-mutation / meaningful-change detection / three-state freshness / guards',
);
