import { normalizeSearchText } from './search-normalization.ts';

export type PagefindItem = {
  url?: string;
  meta?: Record<string, string | undefined>;
  excerpt?: string;
};

export type PagefindResultRef = { data: () => Promise<PagefindItem> };
export type PagefindSearch = (query: string) => Promise<{ results: readonly PagefindResultRef[] }>;

export type CompanyAliasCandidate = {
  href: string;
  values: readonly (string | null | undefined)[];
};

export type PagefindSearchRun = {
  revision: number;
  query: string;
  results: readonly PagefindItem[];
  empty: boolean;
  deduped: boolean;
  error: boolean;
};

const normalizePrimaryQuery = (value: unknown): string => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .trim()
  .replace(/\s+/gu, ' ');

const toHiragana = (value: string): string => value.replace(/[\u30a1-\u30f6]/gu, character => String.fromCodePoint(character.codePointAt(0)! - 0x60));
const toKatakana = (value: string): string => value.replace(/[\u3041-\u3096]/gu, character => String.fromCodePoint(character.codePointAt(0)! + 0x60));
const canonicalUrl = (value: string): string => new URL(value, 'https://atlas.local').pathname.replace(/\/+$/u, '') || '/';

export const createPagefindQueryPlan = (value: unknown): { primary: string; supplemental: string | null } => {
  const primary = normalizePrimaryQuery(value);
  const hasHiragana = /[\u3041-\u3096]/u.test(primary);
  const hasKatakana = /[\u30a1-\u30f6]/u.test(primary);
  const supplemental = hasKatakana ? toHiragana(primary) : hasHiragana ? toKatakana(primary) : null;
  return { primary, supplemental: supplemental && supplemental !== primary ? supplemental : null };
};

export const buildPagefindCompanyAliasMap = (candidates: readonly CompanyAliasCandidate[]): Record<string, string> => {
  const aliases: Record<string, string> = {};
  for (const candidate of candidates) {
    for (const value of candidate.values) {
      const alias = normalizeSearchText(value);
      if (!alias) continue;
      const existing = aliases[alias];
      if (existing && canonicalUrl(existing) !== canonicalUrl(candidate.href)) {
        throw new Error(`Company search alias collision for ${alias}`);
      }
      aliases[alias] = candidate.href;
    }
  }
  return aliases;
};

const loadItems = async (response: { results: readonly PagefindResultRef[] }): Promise<PagefindItem[]> => Promise.all(response.results.map(result => result.data()));

const mergeResults = (primary: readonly PagefindItem[], supplemental: readonly PagefindItem[]): PagefindItem[] => {
  const urls = new Set<string>();
  return [...primary, ...supplemental].filter(item => {
    const url = canonicalUrl(item.url || '');
    if (urls.has(url)) return false;
    urls.add(url);
    return true;
  });
};

const applyExactAliasPin = (results: readonly PagefindItem[], query: string, aliases: Readonly<Record<string, string>>): PagefindItem[] => {
  const href = aliases[normalizeSearchText(query)];
  if (!href) return [...results];
  const index = results.findIndex(item => canonicalUrl(item.url || '') === canonicalUrl(href));
  if (index < 0) return [...results];
  return [results[index], ...results.slice(0, index), ...results.slice(index + 1)];
};

export const createPagefindSearchAdapter = ({ search, aliases }: { search: PagefindSearch; aliases: Readonly<Record<string, string>> }) => {
  let revision = 0;
  let lastQuery = '';

  const run = async (value: unknown): Promise<PagefindSearchRun> => {
    const { primary, supplemental } = createPagefindQueryPlan(value);
    if (!primary) {
      lastQuery = '';
      return { revision: ++revision, query: primary, results: [], empty: true, deduped: false, error: false };
    }
    if (primary === lastQuery) {
      return { revision, query: primary, results: [], empty: false, deduped: true, error: false };
    }
    lastQuery = primary;
    const currentRevision = ++revision;
    try {
      const primaryResults = await loadItems(await search(primary));
      if (currentRevision !== revision) return { revision: currentRevision, query: primary, results: [], empty: false, deduped: false, error: false };
      let supplementalResults: PagefindItem[] = [];
      if (supplemental) {
        try {
          supplementalResults = await loadItems(await search(supplemental));
        } catch {
          // A supplemental kana variant is optional; retain the primary result set.
        }
      }
      return {
        revision: currentRevision,
        query: primary,
        results: applyExactAliasPin(mergeResults(primaryResults, supplementalResults), primary, aliases),
        empty: false,
        deduped: false,
        error: false,
      };
    } catch {
      if (currentRevision === revision) lastQuery = '';
      return { revision: currentRevision, query: primary, results: [], empty: false, deduped: false, error: true };
    }
  };

  return { run, isCurrent: (candidateRevision: number) => candidateRevision === revision };
};
