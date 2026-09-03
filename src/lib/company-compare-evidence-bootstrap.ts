export type EvidenceFragmentResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type EvidenceFragmentFetcher = (
  url: string,
  init: { headers: { Accept: string } },
) => Promise<EvidenceFragmentResponse>;

export type EvidenceCompareMountOutcome = 'legacy' | 'already-requested' | 'loaded' | 'error';

export type EvidenceCompareMountDependencies<Fragment, ControllerModule> = {
  enabled: boolean;
  alreadyRequested(): boolean;
  begin(): void;
  fetchFragment(): Promise<Fragment>;
  mountFragment(fragment: Fragment): void;
  validateMounted(): void;
  loadController(): Promise<ControllerModule>;
  initializeController(module: ControllerModule): boolean | Promise<boolean>;
  validateInitialized(): void;
  finish(): void;
  fail(error: unknown): void;
};

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

export async function mountEvidenceCompareFragment<Fragment, ControllerModule>(
  dependencies: EvidenceCompareMountDependencies<Fragment, ControllerModule>,
): Promise<EvidenceCompareMountOutcome> {
  if (!dependencies.enabled) return 'legacy';
  if (dependencies.alreadyRequested()) return 'already-requested';

  try {
    dependencies.begin();
    const fragment = await dependencies.fetchFragment();
    dependencies.mountFragment(fragment);
    dependencies.validateMounted();
    const controller = await dependencies.loadController();
    if (await dependencies.initializeController(controller) !== true) {
      throw new Error('Evidence controller did not report successful initialization');
    }
    dependencies.validateInitialized();
    dependencies.finish();
    return 'loaded';
  } catch (error) {
    dependencies.fail(error);
    return 'error';
  }
}
