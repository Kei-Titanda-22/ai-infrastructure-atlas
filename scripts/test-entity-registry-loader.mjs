import assert from 'node:assert/strict';

import {
  allCanonicalEntities,
  markets,
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
assert.equal(technologies.length, 9);
assert.equal(markets.length, 0);
assert.equal(allCanonicalEntities.length, 20);

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
assert.equal(resolveEntityAlias('  ethernet  ')?.id, 'technology-ethernet-networking');
assert.equal(resolveEntityAlias('METROLOGY')?.id, 'technology-semiconductor-metrology');

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

console.log('Entity Registry loader tests OK: deterministic order / ID and alias resolution / immutable records');
