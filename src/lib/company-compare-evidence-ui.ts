import { pilotCompareEvidenceProjection } from './company-compare-evidence-pilot.ts';

export type EvidenceCompareDetail = 'summary' | 'expanded';
export type EvidenceCompareIssueCode = 'unknown' | 'unsupported' | 'duplicate' | 'limit';

export interface EvidenceCompareIssue {
  code: EvidenceCompareIssueCode;
  id: string;
}

export interface EvidenceCompareState {
  enabled: boolean;
  selectedIds: string[];
  detail: EvidenceCompareDetail;
  section: string | null;
  issues: EvidenceCompareIssue[];
}

export const evidenceCompareMaxCompanies = 4;
export const evidenceCompareStableSections = Object.freeze([
  ...pilotCompareEvidenceProjection.policy.dimensionOrder.filter(dimensionId => dimensionId !== 'evidence-trace'),
  'evidence-trace',
]);
export const evidenceComparePilotCompanyIds = Object.freeze(
  [...new Set(pilotCompareEvidenceProjection.sets.flatMap(setRecord => setRecord.orderedCompanyIds))],
);

export function parseEvidenceCompareSearch(
  search: string,
  knownCompanyIds: Iterable<string>,
  supportedCompanyIds: Iterable<string> = evidenceComparePilotCompanyIds,
): EvidenceCompareState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const enabled = params.get('view') === 'evidence';
  const known = new Set(knownCompanyIds);
  const supported = new Set(supportedCompanyIds);
  const selectedIds: string[] = [];
  const issues: EvidenceCompareIssue[] = [];
  const seen = new Set<string>();
  const requested = (params.get('ids') ?? '').split(',').map(id => id.trim()).filter(Boolean);
  for (const id of requested) {
    if (seen.has(id)) {
      issues.push({ code: 'duplicate', id });
      continue;
    }
    seen.add(id);
    if (!known.has(id)) {
      issues.push({ code: 'unknown', id });
      continue;
    }
    if (!supported.has(id)) {
      issues.push({ code: 'unsupported', id });
      continue;
    }
    if (selectedIds.length >= evidenceCompareMaxCompanies) {
      issues.push({ code: 'limit', id });
      continue;
    }
    selectedIds.push(id);
  }
  const requestedDetail = params.get('detail');
  const detail: EvidenceCompareDetail = requestedDetail === 'expanded' ? 'expanded' : 'summary';
  const requestedSection = params.get('section');
  const section = requestedSection && evidenceCompareStableSections.includes(requestedSection) ? requestedSection : null;
  return { enabled, selectedIds, detail, section, issues };
}

export function serializeEvidenceCompareSearch(
  currentSearch: string,
  state: Pick<EvidenceCompareState, 'selectedIds' | 'detail' | 'section'>,
) {
  const params = new URLSearchParams(currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch);
  params.set('ids', state.selectedIds.join(','));
  params.set('view', 'evidence');
  params.set('detail', state.detail);
  if (state.section) params.set('section', state.section);
  else params.delete('section');
  return `?${params.toString()}`;
}

export function matchEvidencePilotSet(selectedIds: string[]) {
  return pilotCompareEvidenceProjection.sets.find(setRecord =>
    setRecord.orderedCompanyIds.length === selectedIds.length
    && setRecord.orderedCompanyIds.every(companyId => selectedIds.includes(companyId)),
  ) ?? null;
}

export function financialPresentationForSelection(selectedIds: string[]) {
  const setRecord = matchEvidencePilotSet(selectedIds);
  if (!setRecord) return { setId: null, primary: [], dataQuality: [], resolverError: true } as const;
  return {
    setId: setRecord.setId,
    primary: setRecord.financial.metricStates.filter(state => state.compatibility.code !== 'blocked'),
    dataQuality: setRecord.financial.metricStates.filter(state => state.compatibility.code === 'blocked'),
    resolverError: false,
  } as const;
}

export function allSelectedMissing<T>(selectedIds: string[], values: ReadonlyMap<string, T | null | undefined>) {
  return selectedIds.length > 0 && selectedIds.every(companyId => values.get(companyId) == null);
}
