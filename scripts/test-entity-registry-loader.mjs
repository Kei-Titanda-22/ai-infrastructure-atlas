import assert from 'node:assert/strict';

import {
  allCanonicalEntities,
  buildEntityAliasIndex,
  markets,
  normalizeEntityLookup,
  products,
  resolveEntities,
  resolveEntity,
  resolveEntityAlias,
  resolveMarket,
  resolveProduct,
  resolveTechnology,
  technologies,
} from '../src/lib/entity-registry.ts';

assert.equal(products.length, 11);
assert.equal(technologies.length, 8);
assert.equal(markets.length, 0);
assert.equal(allCanonicalEntities.length, 19);

assert.deepEqual(
  allCanonicalEntities.map(entity => entity.id),
  [...allCanonicalEntities.map(entity => entity.id)].sort(),
);

assert.equal(resolveProduct('product-category-gpu')?.canonicalName, 'Graphics processing unit');
assert.equal(resolveTechnology('technology-ethernet-networking')?.technologyKind, 'protocol');
assert.equal(resolveMarket('market-data-center'), undefined);
assert.equal(resolveProduct('technology-ethernet-networking'), undefined);
assert.equal(resolveEntity('unknown-entity'), undefined);

assert.equal(resolveEntityAlias('ＧＰＵ')?.id, 'product-category-gpu');
assert.equal(resolveEntityAlias('gpu')?.id, 'product-category-gpu');
assert.equal(resolveEntityAlias('  GPU  ')?.id, 'product-category-gpu');
assert.equal(resolveEntityAlias('  ethernet  ')?.id, 'technology-ethernet-networking');
assert.equal(resolveEntityAlias('METROLOGY')?.id, 'technology-semiconductor-metrology');
assert.equal(resolveEntityAlias('半導体前工程製造装置')?.id, 'product-category-wafer-fabrication-equipment');
assert.equal(resolveEntityAlias('ASIC'), undefined);
// The authoring validator rejects labels where Python lower() and casefold() diverge.
assert.equal(resolveEntityAlias('Straße'), undefined);
assert.equal(normalizeEntityLookup(' ＧＰＵ '), 'gpu');
assert.equal(normalizeEntityLookup('日本語label'), '日本語label');

const gpu = resolveProduct('product-category-gpu');
const technology = resolveTechnology('technology-accelerated-computing-architecture');
assert.ok(gpu);
assert.ok(technology);
assert.throws(
  () => buildEntityAliasIndex([
    gpu,
    { ...technology, aliases: ['ＧＰＵ'] },
  ]),
  /alias collision/,
);

assert.deepEqual(
  resolveEntities([
    'technology-ethernet-networking',
    'unknown-entity',
    'product-category-gpu',
    'technology-ethernet-networking',
  ]).map(entity => entity.id),
  ['technology-ethernet-networking', 'product-category-gpu'],
);

assert.equal(Object.isFrozen(products), true);
assert.equal(Object.isFrozen(products[0]), true);
assert.equal(Object.isFrozen(products[0].aliases), true);

console.log('Entity Registry loader tests OK: Unicode lowercase normalization / collision protection / deterministic immutable records');
