import productRegistry from '../data/product-registry-v01.json' with { type: 'json' };
import technologyRegistry from '../data/technology-registry-v01.json' with { type: 'json' };
import marketRegistry from '../data/market-registry-v01.json' with { type: 'json' };

export type RegistryStatus = 'active' | 'deprecated';
export type EntityType = 'product' | 'technology' | 'market';
export type ProductKind = 'generic-category';
export type TechnologyKind =
  | 'architecture'
  | 'manufacturing-process'
  | 'protocol'
  | 'material-technology'
  | 'process-technology';
export type MarketKind = 'end-market' | 'demand-domain';

interface CanonicalEntityBase {
  id: string;
  entityType: EntityType;
  canonicalName: string;
  displayNames: Readonly<Record<string, string>>;
  aliases: readonly string[];
  status: RegistryStatus;
  replacedBy: string | null;
}

export interface ProductEntity extends CanonicalEntityBase {
  entityType: 'product';
  productKind: ProductKind;
}

export interface TechnologyEntity extends CanonicalEntityBase {
  entityType: 'technology';
  technologyKind: TechnologyKind;
}

export interface MarketEntity extends CanonicalEntityBase {
  entityType: 'market';
  marketKind: MarketKind;
}

export type CanonicalEntity = ProductEntity | TechnologyEntity | MarketEntity;

export const entityRegistrySchemaVersion = '0.1' as const;

const assertRegistryEnvelope = (
  registry: { schemaVersion: string; entityType: string; records: unknown },
  expectedType: EntityType,
) => {
  if (
    registry.schemaVersion !== entityRegistrySchemaVersion
    || registry.entityType !== expectedType
    || !Array.isArray(registry.records)
  ) {
    throw new Error(`Invalid ${expectedType} registry envelope`);
  }
};

const compareIds = (left: CanonicalEntity, right: CanonicalEntity) =>
  left.id < right.id ? -1 : left.id > right.id ? 1 : 0;

const freezeRecord = <T extends CanonicalEntity>(record: T): T =>
  Object.freeze({
    ...record,
    displayNames: Object.freeze({ ...record.displayNames }),
    aliases: Object.freeze([...record.aliases]),
  }) as T;

const assertStableOrder = (records: readonly CanonicalEntity[], label: string) => {
  const actual = records.map(record => record.id);
  const expected = [...actual].sort();
  if (actual.some((id, index) => id !== expected[index])) {
    throw new Error(`${label} registry is not in stable ID order`);
  }
};

assertRegistryEnvelope(productRegistry, 'product');
assertRegistryEnvelope(technologyRegistry, 'technology');
assertRegistryEnvelope(marketRegistry, 'market');

const productRecords = (productRegistry.records as ProductEntity[]).map(record => {
  if (record.productKind !== 'generic-category') {
    throw new Error(`Product Registry contains a non-generic record: ${record.id}`);
  }
  return freezeRecord(record);
});
const technologyRecords = (technologyRegistry.records as TechnologyEntity[]).map(freezeRecord);
const marketRecords = (marketRegistry.records as MarketEntity[]).map(freezeRecord);

assertStableOrder(productRecords, 'Product');
assertStableOrder(technologyRecords, 'Technology');
assertStableOrder(marketRecords, 'Market');

export const products = Object.freeze(productRecords);
export const technologies = Object.freeze(technologyRecords);
export const markets = Object.freeze(marketRecords);
export const allCanonicalEntities = Object.freeze(
  [...products, ...technologies, ...markets].sort(compareIds),
);

const mutableById = new Map<string, CanonicalEntity>();
for (const entity of allCanonicalEntities) {
  if (mutableById.has(entity.id)) throw new Error(`Duplicate canonical entity ID: ${entity.id}`);
  mutableById.set(entity.id, entity);
}

export const entityById: ReadonlyMap<string, CanonicalEntity> = mutableById;

export const normalizeEntityLookup = (value: string) =>
  value.normalize('NFKC').trim().toLocaleLowerCase('en-US');

const mutableAliasIndex = new Map<string, CanonicalEntity>();
for (const entity of allCanonicalEntities) {
  const labels = [entity.canonicalName, ...Object.values(entity.displayNames), ...entity.aliases];
  for (const label of labels) {
    const key = normalizeEntityLookup(label);
    const previous = mutableAliasIndex.get(key);
    if (previous && previous.id !== entity.id) {
      throw new Error(`Canonical entity alias collision: ${label} (${previous.id}, ${entity.id})`);
    }
    mutableAliasIndex.set(key, entity);
  }
}

export const entityByAlias: ReadonlyMap<string, CanonicalEntity> = mutableAliasIndex;

export const resolveEntity = (id: string) => entityById.get(id);

export const resolveProduct = (id: string) => {
  const entity = resolveEntity(id);
  return entity?.entityType === 'product' ? entity : undefined;
};

export const resolveTechnology = (id: string) => {
  const entity = resolveEntity(id);
  return entity?.entityType === 'technology' ? entity : undefined;
};

export const resolveMarket = (id: string) => {
  const entity = resolveEntity(id);
  return entity?.entityType === 'market' ? entity : undefined;
};

export const resolveEntityAlias = (label: string) => entityByAlias.get(normalizeEntityLookup(label));

export const resolveEntities = (ids: Iterable<string>) => {
  const resolved: CanonicalEntity[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const entity = resolveEntity(id);
    if (entity) resolved.push(entity);
  }
  return resolved;
};
