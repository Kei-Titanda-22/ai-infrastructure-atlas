export type EvidenceFragmentResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type EvidenceFragmentFetcher = (
  url: string,
  init: { headers: { Accept: string } },
) => Promise<EvidenceFragmentResponse>;

export const evidenceCompareViewRequested = (search: string) =>
  new URLSearchParams(search).get('view') === 'evidence';

export async function fetchEvidenceCompareFragment(
  url: string,
  fetcher: EvidenceFragmentFetcher = fetch,
) {
  const response = await fetcher(url, { headers: { Accept: 'text/html' } });
  if (!response.ok) throw new Error(`Evidence fragment request failed: ${response.status}`);
  return response.text();
}
