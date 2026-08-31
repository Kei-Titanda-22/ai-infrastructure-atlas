import manifest from '../data/source-registry-manifest.json';

export interface SourceRecord {
  id: string;
  companyId?: string;
  publisher: string;
  title: string;
  url: string;
  sourceType: string;
  publishedAt: string | null;
  retrievedAt: string;
  language?: string;
}

const shardModules = import.meta.glob('../data/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export const sourceRegistryShards = Object.freeze([...manifest.shards]);

const sourceRecords: SourceRecord[] = sourceRegistryShards.flatMap(shard => {
  const records = shardModules[`../data/${shard}`];
  if (!Array.isArray(records)) throw new Error(`Source Registry shard is missing or invalid: ${shard}`);
  return (records as Array<Omit<SourceRecord, 'publishedAt'> & { publishedAt?: string | null }>).map(source => ({
    ...source,
    publishedAt: source.publishedAt ?? null,
  }));
});

const resolvedRegistry = new Map<string, SourceRecord>();
for (const source of sourceRecords) {
  const previous = resolvedRegistry.get(source.id);
  if (previous && (previous.url !== source.url || previous.companyId !== source.companyId)) {
    throw new Error(`Conflicting Source Registry ID: ${source.id}`);
  }
  // Later manifest shards are the canonical metadata for compatible duplicate IDs.
  resolvedRegistry.set(source.id, source);
}

export const allSources = [...resolvedRegistry.values()];

export const sourceById = resolvedRegistry;

export const resolveSource = (sourceId: string) => sourceById.get(sourceId);

export const resolveSources = (sourceIds: Iterable<string>) =>
  [...new Set(sourceIds)].map(resolveSource).filter((source): source is SourceRecord => Boolean(source));
