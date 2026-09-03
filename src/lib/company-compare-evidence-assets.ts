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

export const companyCompareProductPortfolioCompanyIds = [
  'nvidia',
  'broadcom',
  'applied-materials',
  'lam-research',
  'tokyo-electron',
] as const;

export type CompanyCompareProductPortfolioCompanyId = typeof companyCompareProductPortfolioCompanyIds[number];

export interface CompanyCompareProductPortfolioSummary {
  title: string;
  body: string;
  groundingId: string;
  summaryVisible: false;
  expandedVisible: true;
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

const prohibitedProductPortfolioCopy = new Set([
  '製品構成',
  '下記の製品カテゴリを提供する。',
  '主な製品',
  '以下の製品を提供する。',
]);

export function validateCompanyCompareProductPortfolioSummaries(
  value: unknown,
  knownGroundingIds?: ReadonlySet<string>,
): Readonly<Record<CompanyCompareProductPortfolioCompanyId, CompanyCompareProductPortfolioSummary>> {
  const summaries = requireRecord(value, 'Company Compare Product portfolio summaries');
  const expectedIds = [...companyCompareProductPortfolioCompanyIds].sort();
  const actualIds = Object.keys(summaries).sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error('Company Compare Product portfolio summaries must cover the exact Pilot 5 companies');
  }

  const resolved = Object.fromEntries(companyCompareProductPortfolioCompanyIds.map(companyId => {
    const record = requireRecord(summaries[companyId], `Company Compare Product portfolio summary: ${companyId}`);
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const body = typeof record.body === 'string' ? record.body.trim() : '';
    const groundingId = typeof record.groundingId === 'string' ? record.groundingId.trim() : '';
    if (!title || !body || !groundingId) {
      throw new Error(`Company Compare Product portfolio summary fields must be non-empty: ${companyId}`);
    }
    if (prohibitedProductPortfolioCopy.has(title) || prohibitedProductPortfolioCopy.has(body)) {
      throw new Error(`Company Compare Product portfolio summary uses prohibited generic copy: ${companyId}`);
    }
    if (record.summaryVisible !== false || record.expandedVisible !== true) {
      throw new Error(`Company Compare Product portfolio visibility contract mismatch: ${companyId}`);
    }
    if (knownGroundingIds && !knownGroundingIds.has(groundingId)) {
      throw new Error(`Company Compare Product portfolio grounding does not resolve: ${companyId}:${groundingId}`);
    }
    return [companyId, Object.freeze({ title, body, groundingId, summaryVisible: false as const, expandedVisible: true as const })];
  }));

  return Object.freeze(resolved) as Readonly<Record<CompanyCompareProductPortfolioCompanyId, CompanyCompareProductPortfolioSummary>>;
}

export function getCompanyCompareProductPortfolioSummaries() {
  return validateCompanyCompareProductPortfolioSummaries({
    nvidia: {
      title: '演算とネットワークを横断',
      body: 'Blackwell GPU、Grace CPU、BlueField DPU、Spectrum-Xネットワークを展開する。',
      groundingId: 'nvidia-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    broadcom: {
      title: '接続・演算を担う半導体群',
      body: '接続用半導体、カスタムアクセラレータASIC、Ethernetスイッチ用半導体を展開する。',
      groundingId: 'broadcom-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    'applied-materials': {
      title: '材料工程を広くカバー',
      body: '材料の堆積、除去、改質、分析、デバイス接続に関わる装置・技術を展開する。',
      groundingId: 'applied-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    'lam-research': {
      title: '成膜・エッチング・洗浄を横断',
      body: '成膜、エッチング、ウェーハ洗浄を中心に、複数の前工程装置を展開する。',
      groundingId: 'lam-research-products',
      summaryVisible: false,
      expandedVisible: true,
    },
    'tokyo-electron': {
      title: '前工程の主要工程を幅広くカバー',
      body: '塗布・現像、エッチング、成膜、洗浄の各工程に対応する装置を展開する。',
      groundingId: 'tokyo-electron-products',
      summaryVisible: false,
      expandedVisible: true,
    },
  });
}

export function resolveCompanyCompareProductPortfolioSummary(
  companyId: string,
  knownGroundingIds?: ReadonlySet<string>,
): CompanyCompareProductPortfolioSummary {
  const companyCompareProductPortfolioSummaries = getCompanyCompareProductPortfolioSummaries();
  const summary = companyCompareProductPortfolioSummaries[companyId as CompanyCompareProductPortfolioCompanyId];
  if (!summary) throw new Error(`Company Compare Product portfolio summary is missing: ${companyId}`);
  if (knownGroundingIds && !knownGroundingIds.has(summary.groundingId)) {
    throw new Error(`Company Compare Product portfolio grounding does not resolve: ${companyId}:${summary.groundingId}`);
  }
  return summary;
}

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
