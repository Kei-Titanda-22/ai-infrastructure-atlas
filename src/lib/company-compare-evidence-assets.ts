export const companyCompareAssetSchemaVersion = '0.1';

export interface CompanyCompareAssetManifestRecord {
  companyId: string;
  assetPath: string;
  schemaVersion: string;
}

export interface CompanyCompareAssetManifest {
  schemaVersion: string;
  companies: CompanyCompareAssetManifestRecord[];
}

export interface CompanyCompareAssetResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type CompanyCompareAssetFetcher = (
  url: string,
  init: { headers: { Accept: string }; signal: AbortSignal },
) => Promise<CompanyCompareAssetResponse>;

export interface CompanyCompareAssetLoader<Asset> {
  load(companyId: string): Promise<Asset>;
  has(companyId: string): boolean;
  requestCount(companyId: string): number;
  cachedCompanyIds(): string[];
}

const companyIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requireRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

export function validateCompanyCompareAssetManifest(value: unknown): CompanyCompareAssetManifest {
  const manifest = requireRecord(value, 'Company Compare asset manifest');
  if (manifest.schemaVersion !== companyCompareAssetSchemaVersion) {
    throw new Error('Company Compare asset manifest schema mismatch');
  }
  if (!Array.isArray(manifest.companies) || !manifest.companies.length) {
    throw new Error('Company Compare asset manifest companies must be a non-empty array');
  }

  const seenIds = new Set<string>();
  const seenPaths = new Set<string>();
  const companies = manifest.companies.map((value, index) => {
    const record = requireRecord(value, `Company Compare asset manifest companies[${index}]`);
    const companyId = typeof record.companyId === 'string' ? record.companyId : '';
    const assetPath = typeof record.assetPath === 'string' ? record.assetPath : '';
    if (!companyIdPattern.test(companyId)) throw new Error(`Invalid Company Compare asset company ID: ${companyId}`);
    if (record.schemaVersion !== companyCompareAssetSchemaVersion) {
      throw new Error(`Company Compare asset schema mismatch: ${companyId}`);
    }
    if (!assetPath.trim() || /^https?:\/\//i.test(assetPath)) {
      throw new Error(`Invalid Company Compare asset path: ${companyId}`);
    }
    const expectedSuffix = `/evidence-fragments/company-compare-evidence-v01/${companyId}/`;
    if (!assetPath.replace(/\\/g, '/').endsWith(expectedSuffix)) {
      throw new Error(`Company Compare asset path does not match Company ID: ${companyId}`);
    }
    if (seenIds.has(companyId)) throw new Error(`Duplicate Company Compare asset company ID: ${companyId}`);
    if (seenPaths.has(assetPath)) throw new Error(`Duplicate Company Compare asset path: ${assetPath}`);
    seenIds.add(companyId);
    seenPaths.add(assetPath);
    return { companyId, assetPath, schemaVersion: companyCompareAssetSchemaVersion };
  });

  return { schemaVersion: companyCompareAssetSchemaVersion, companies };
}

export function resolveCompanyCompareAssetUrl(assetPath: string, currentUrl: string) {
  const pageUrl = new URL(currentUrl);
  const assetUrl = new URL(assetPath, pageUrl);
  if (assetUrl.origin !== pageUrl.origin) throw new Error('Company Compare asset must use the current origin');
  return assetUrl.href;
}

export function createCompanyCompareAssetLoader<Asset>(options: {
  manifest: CompanyCompareAssetManifest;
  currentUrl: string;
  parseAsset(text: string, record: CompanyCompareAssetManifestRecord): Asset;
  fetcher?: CompanyCompareAssetFetcher;
  timeoutMs?: number;
}): CompanyCompareAssetLoader<Asset> {
  const manifest = validateCompanyCompareAssetManifest(options.manifest);
  const recordById = new Map(manifest.companies.map(record => [record.companyId, record]));
  const cache = new Map<string, Asset>();
  const inFlight = new Map<string, Promise<Asset>>();
  const requestCounts = new Map<string, number>();
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Company Compare asset timeout must be a positive integer');
  }

  const load = (companyId: string): Promise<Asset> => {
    const cached = cache.get(companyId);
    if (cached !== undefined) return Promise.resolve(cached);
    const pending = inFlight.get(companyId);
    if (pending) return pending;
    const record = recordById.get(companyId);
    if (!record) return Promise.reject(new Error(`Unknown Company Compare asset: ${companyId}`));

    const request = (async () => {
      requestCounts.set(companyId, (requestCounts.get(companyId) ?? 0) + 1);
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), timeoutMs);
      try {
        const url = resolveCompanyCompareAssetUrl(record.assetPath, options.currentUrl);
        const response = await fetcher(url, {
          headers: { Accept: 'text/html' },
          signal: abortController.signal,
        });
        if (!response.ok) throw new Error(`Company Compare asset request failed: ${companyId}:${response.status}`);
        const text = await response.text();
        const parsed = options.parseAsset(text, record);
        cache.set(companyId, parsed);
        return parsed;
      } catch (error) {
        if (abortController.signal.aborted) {
          throw new Error(`Company Compare asset request timed out: ${companyId}`, { cause: error });
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    })();

    inFlight.set(companyId, request);
    void request.finally(() => inFlight.delete(companyId)).catch(() => undefined);
    return request;
  };

  return {
    load,
    has: companyId => cache.has(companyId),
    requestCount: companyId => requestCounts.get(companyId) ?? 0,
    cachedCompanyIds: () => [...cache.keys()].sort(),
  };
}
