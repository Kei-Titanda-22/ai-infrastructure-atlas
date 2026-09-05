import {
  evidenceCompareMaxCompanies,
  parseEvidenceCompareSearch,
  serializeEvidenceCompareSearch,
  type EvidenceCompareIssue,
  type EvidenceCompareState,
} from '../lib/company-compare-evidence-ui.ts';
import {
  companyCompareDisplayNameParts,
  companyPresentationTokenForOrder,
  localizeCompareLocation,
} from '../lib/company-compare-display.ts';
import {
  companyCompareAssetSchemaVersion,
  createCompanyCompareAssetLoader,
  validateCompanyCompareAssetManifest,
  type CompanyCompareAssetManifestRecord,
} from '../lib/company-compare-evidence-assets.ts';

const issueLabels: Record<EvidenceCompareIssue['code'], string> = {
  unknown: '不明な企業ID',
  unsupported: '試験対象外',
  duplicate: '重複を除外',
  limit: '4社上限を超過',
};
const assetSlots = Object.freeze([
  'header',
  'company-identity',
  'ai-role',
  'key-products',
  'technology-moat',
  'capacity-roadmap',
  'key-risks',
  'financial',
  'expanded-financial',
  'evidence-trace',
]);

export function formatCompanyCompareEvidencePageLead(availableCompanyCount: number) {
  if (!Number.isSafeInteger(availableCompanyCount) || availableCompanyCount < 1) {
    throw new Error('Company Compare available Company count must be a positive integer');
  }
  return `対応${availableCompanyCount}社から2～${evidenceCompareMaxCompanies}社を選び、各社の役割、製品・技術、企業間関係、財務の比較条件を根拠付きで確認します。`;
}

type AssetSlot = { html: string; companyLabel?: string; hasContent?: string };
type ParsedCompanyAsset = { companyId: string; slots: Map<string, AssetSlot> };

const element = <T extends Element>(root: ParentNode, selector: string) => root.querySelector<T>(selector);
const requiredElement = <T extends Element>(root: ParentNode, selector: string) => {
  const found = element<T>(root, selector);
  if (!found) throw new Error(`Company Evidence Compare requires ${selector}`);
  return found;
};
const parseCompanyAsset = (html: string, record: CompanyCompareAssetManifestRecord): ParsedCompanyAsset => {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  const assetRoot = documentNode.querySelector<HTMLElement>('[data-company-compare-asset]');
  if (!assetRoot) throw new Error(`Company Compare asset root is missing: ${record.companyId}`);
  if (assetRoot.dataset.companyId !== record.companyId) {
    throw new Error(`Company Compare asset Company ID mismatch: ${record.companyId}`);
  }
  if (assetRoot.dataset.schemaVersion !== companyCompareAssetSchemaVersion) {
    throw new Error(`Company Compare asset schema mismatch: ${record.companyId}`);
  }
  const companyIds = new Set([...assetRoot.querySelectorAll<HTMLElement>('[data-company-id]')]
    .map(node => node.dataset.companyId).filter(Boolean));
  if ([...companyIds].some(companyId => companyId !== record.companyId)) {
    throw new Error(`Company Compare asset contains another company: ${record.companyId}`);
  }
  const slots = new Map<string, AssetSlot>();
  assetRoot.querySelectorAll<HTMLTemplateElement>('template[data-company-slot]').forEach(template => {
    const slotId = template.dataset.companySlot || '';
    if (!assetSlots.includes(slotId)) throw new Error(`Company Compare asset slot is unknown: ${slotId}`);
    if (slots.has(slotId)) throw new Error(`Company Compare asset slot is duplicated: ${slotId}`);
    slots.set(slotId, {
      html: template.innerHTML,
      companyLabel: template.dataset.companyLabel,
      hasContent: template.dataset.hasContent,
    });
  });
  for (const slotId of assetSlots) {
    if (!slots.has(slotId)) throw new Error(`Company Compare asset slot is missing: ${record.companyId}:${slotId}`);
  }
  if (slots.size !== assetSlots.length) throw new Error(`Company Compare asset slot count is invalid: ${record.companyId}`);
  return { companyId: record.companyId, slots };
};
const appendSlot = (target: Element, slot: AssetSlot) => {
  const template = document.createElement('template');
  template.innerHTML = slot.html;
  target.append(template.content.cloneNode(true));
};

let initialization: Promise<boolean> | null = null;

export function initCompanyCompareEvidenceUi(): Promise<boolean> {
  const existingRoot = element<HTMLElement>(document, '#company-compare-evidence');
  if (existingRoot?.dataset.evidenceControllerInitialized === 'true') return Promise.resolve(true);
  if (initialization) return initialization;
  initialization = initializeCompanyCompareEvidenceUi().finally(() => {
    if (element<HTMLElement>(document, '#company-compare-evidence')?.dataset.evidenceControllerInitialized !== 'true') {
      initialization = null;
    }
  });
  return initialization;
}

async function initializeCompanyCompareEvidenceUi(): Promise<boolean> {
  const app = requiredElement<HTMLElement>(document, '#compare-app');
  const root = requiredElement<HTMLElement>(document, '#company-compare-evidence');
  const legacy = requiredElement<HTMLElement>(document, '#legacy-compare-view');
  const compareDataNode = requiredElement<HTMLScriptElement>(document, '#compare-data');
  const evidenceDataNode = requiredElement<HTMLScriptElement>(document, '#compare-evidence-ui-data');

  const pageData = JSON.parse(compareDataNode.textContent || '{}');
  const uiData = JSON.parse(evidenceDataNode.textContent || '{}');
  if (!Array.isArray(pageData.companies)) throw new Error('Company Evidence Compare page data is invalid');
  if (!Array.isArray(uiData.supportedCompanyIds)) throw new Error('Company Evidence Compare payload is invalid');
  const manifest = validateCompanyCompareAssetManifest(uiData.companyManifest);
  const companies = pageData.companies;
  const byId = new Map<string, any>(companies.map((company: any) => [company.id, company]));
  const supportedIds = new Set<string>(uiData.supportedCompanyIds);
  if (manifest.companies.some(record => !supportedIds.has(record.companyId))
    || manifest.companies.length !== supportedIds.size) {
    throw new Error('Company Compare asset manifest and supported companies do not match');
  }
  let state = parseEvidenceCompareSearch(location.search, byId.keys(), supportedIds);
  if (!state.enabled) throw new Error('Company Evidence Compare controller requires view=evidence');

  legacy.hidden = true;
  element<HTMLElement>(app, '#legacy-compare-templates')?.setAttribute('hidden', '');
  element<HTMLElement>(app, '#evidence-compare-templates')?.removeAttribute('hidden');
  const evidenceTemplateLabel = element<HTMLElement>(app, '#evidence-compare-templates .compare-template-label');
  if (evidenceTemplateLabel) evidenceTemplateLabel.textContent = '比較セット';
  const pageLead = document.querySelector<HTMLElement>('#compare-page-lead');
  const builderMeta = element<HTMLElement>(app, '#compare-builder-meta');
  if (pageLead) pageLead.textContent = formatCompanyCompareEvidencePageLead(manifest.companies.length);
  if (builderMeta) builderMeta.textContent = '2～4社を選択できます。重複、対象外の企業、4社を超える指定は理由を表示して除外します。';

  const searchInput = requiredElement<HTMLInputElement>(app, '#compare-company-search');
  const suggestions = requiredElement<HTMLElement>(app, '#compare-suggestions');
  const selectedRoot = requiredElement<HTMLElement>(app, '#compare-selected');
  const selectionStatus = requiredElement<HTMLElement>(app, '#compare-selection-status');
  const routeStatus = requiredElement<HTMLElement>(root, '#evidence-route-status');
  const loadStatus = requiredElement<HTMLElement>(root, '#evidence-company-load-status');
  const detailDescription = requiredElement<HTMLElement>(root, '[data-evidence-detail-description]');
  const empty = requiredElement<HTMLElement>(root, '#evidence-compare-empty');
  const matrixScroll = requiredElement<HTMLElement>(root, '#evidence-matrix-scroll');
  const matrix = requiredElement<HTMLTableElement>(root, '#evidence-compare-matrix');
  const runtimeQuality = requiredElement<HTMLElement>(root, '#evidence-runtime-quality');
  const expandedFinancial = requiredElement<HTMLElement>(root, '#evidence-expanded-financial-companies');
  const evidenceTrace = requiredElement<HTMLElement>(root, '#evidence-trace-companies');
  const clearButton = requiredElement<HTMLButtonElement>(app, '#clear-compare');
  const copyButton = requiredElement<HTMLButtonElement>(app, '#copy-compare-url');
  const loadedIds = new Set<string>();
  const loadingIds = new Set<string>();
  const failures = new Map<string, Error>();
  let currentSuggestions: any[] = [];
  let selectionRevision = 0;

  const loader = createCompanyCompareAssetLoader({
    manifest,
    currentUrl: location.href,
    parseAsset: parseCompanyAsset,
  });
  const normalize = (value: unknown) => String(value || '').trim().toLowerCase().normalize('NFKC');
  const text = (tag: string, value: string, className = '') => {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
  };
  const appendCompanyName = (parent: HTMLElement, company: any) => {
    const names = companyCompareDisplayNameParts(company);
    parent.setAttribute('aria-label', names.accessibleName);
    const wrapper = text('span', '', 'compare-company-name');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.append(text('span', names.primaryName, 'compare-company-name-primary'));
    if (names.secondaryName) wrapper.append(text('span', names.secondaryName, 'compare-company-name-secondary'));
    parent.append(wrapper);
  };
  const createCompanyNameLink = (company: any, extraClasses: string[] = []) => {
    const link = document.createElement('a');
    link.href = company.href;
    link.className = ['company-name-link', ...extraClasses].join(' ');
    link.dataset.companyIdentityLink = company.id;
    appendCompanyName(link, company);
    return link;
  };
  const upgradeCompanyIdentityLinks = (scope: ParentNode = root) => {
    scope.querySelectorAll<HTMLElement>('.evidence-matrix thead th[data-company-id] > a, .evidence-company-context > strong')
      .forEach(host => {
        const companyId = host.closest<HTMLElement>('[data-company-id]')?.dataset.companyId;
        const company = companyId ? byId.get(companyId) : null;
        if (!company) throw new Error(`Company Evidence Compare identity is unresolved: ${companyId || 'unknown'}`);
        host.replaceWith(createCompanyNameLink(company));
      });
    scope.querySelectorAll<HTMLElement>('.evidence-financial-company[data-company-id] > h4, .evidence-trace-list > [data-company-id] > strong')
      .forEach(host => {
        const companyId = host.closest<HTMLElement>('[data-company-id]')?.dataset.companyId;
        const company = companyId ? byId.get(companyId) : null;
        if (!company) throw new Error(`Company Evidence Compare identity is unresolved: ${companyId || 'unknown'}`);
        host.replaceChildren(createCompanyNameLink(company));
      });
  };
  const pickedCompanies = () => state.selectedIds.map(id => byId.get(id)).filter(Boolean);
  const financialSetForSelection = (selectedIds: string[]) => uiData.sets.find((setRecord: any) => (
    setRecord.orderedCompanyIds.length === selectedIds.length
    && setRecord.orderedCompanyIds.every((companyId: string) => selectedIds.includes(companyId))
  )) ?? null;
  const issueText = (issues: EvidenceCompareIssue[]) => issues
    .map(issue => `${issueLabels[issue.code]}：${issue.id}`).join(' / ');
  const updateUrl = (mode: 'replace' | 'push') => {
    const query = serializeEvidenceCompareSearch(location.search, state);
    history[mode === 'push' ? 'pushState' : 'replaceState']({ evidenceCompare: true }, '', `${location.pathname}${query}`);
  };

  const renderSelected = () => {
    selectedRoot.replaceChildren();
    const picked = pickedCompanies();
    selectedRoot.style.setProperty('--compare-selected-count', String(Math.max(1, picked.length)));
    if (!picked.length) selectedRoot.append(text('p', '比較企業が未選択です。', 'meta'));
    picked.forEach((company, index) => {
      const row = document.createElement('div');
      row.className = 'compare-selected-row';
      const presentation = companyPresentationTokenForOrder(index);
      row.dataset.companyToken = presentation.token;
      row.dataset.companyOrder = String(presentation.index);
      row.append(text('span', presentation.label, 'compare-selected-index mono'));
      const info = document.createElement('div');
      info.className = 'compare-selected-info';
      info.append(createCompanyNameLink(company, ['company-link', 'compare-selected-name']));
      info.append(text('span', `${company.ticker} · ${company.primaryLayer}`, 'compare-selected-meta'));
      row.append(info);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'text-button compare-remove';
      remove.textContent = '外す';
      remove.dataset.removeId = company.id;
      row.append(remove);
      selectedRoot.append(row);
    });
    selectionStatus.textContent = `${picked.length}/${evidenceCompareMaxCompanies}社を選択中${picked.length < 2 ? ' — 2社以上を選択してください' : ''}`;
    clearButton.hidden = picked.length < 2;
    clearButton.disabled = picked.length < 2;
    routeStatus.textContent = issueText(state.issues);
  };

  const mountAsset = (asset: ParsedCompanyAsset) => {
    if (loadedIds.has(asset.companyId)) return;
    const companyId = asset.companyId;
    const headerRow = requiredElement<HTMLTableRowElement>(matrix, 'thead [data-evidence-company-row]');
    const header = document.createElement('th');
    header.scope = 'col';
    header.dataset.companyId = companyId;
    header.id = `evidence-company-${companyId}`;
    appendSlot(header, asset.slots.get('header')!);
    headerRow.append(header);
    for (const slotId of ['company-identity', ...uiData.dimensionOrder, 'financial']) {
      const row = requiredElement<HTMLTableRowElement>(matrix, `[data-dimension-id="${slotId}"]`);
      const slot = asset.slots.get(slotId)!;
      const cell = document.createElement('td');
      cell.dataset.companyId = companyId;
      cell.dataset.companyLabel = slot.companyLabel || companyId;
      cell.dataset.hasContent = slot.hasContent || 'false';
      cell.setAttribute('headers', `evidence-dimension-${slotId} evidence-company-${companyId}`);
      appendSlot(cell, slot);
      row.append(cell);
    }
    appendSlot(expandedFinancial, asset.slots.get('expanded-financial')!);
    appendSlot(evidenceTrace, asset.slots.get('evidence-trace')!);
    loadedIds.add(companyId);
    upgradeCompanyIdentityLinks(root);
    root.querySelectorAll<HTMLDialogElement>('.evidence-drawer').forEach(wireDialog);
  };

  const directCompanyCells = (container: Element) => [...container.children]
    .filter((child): child is HTMLElement => child instanceof HTMLElement && Boolean(child.dataset.companyId));
  const orderAndFilterCompanyCells = (container: Element) => {
    const cells = directCompanyCells(container);
    const byCompany = new Map(cells.map(cell => [cell.dataset.companyId!, cell]));
    state.selectedIds.forEach((companyId, index) => {
      const cell = byCompany.get(companyId);
      if (!cell) return;
      const presentation = companyPresentationTokenForOrder(index);
      cell.hidden = false;
      cell.dataset.companyOrder = String(presentation.index);
      cell.dataset.companyToken = presentation.token;
      cell.querySelectorAll<HTMLElement>('[data-company-order-label]').forEach(label => { label.textContent = presentation.label; });
      container.append(cell);
    });
    cells.filter(cell => !state.selectedIds.includes(cell.dataset.companyId!)).forEach(cell => {
      cell.hidden = true;
      delete cell.dataset.companyOrder;
      delete cell.dataset.companyToken;
      container.append(cell);
    });
  };
  const renderLoadStatus = () => {
    loadStatus.replaceChildren();
    const selectedLoading = state.selectedIds.filter(id => loadingIds.has(id));
    loadStatus.setAttribute('aria-busy', String(selectedLoading.length > 0));
    if (selectedLoading.length) {
      loadStatus.append(text('p', `${selectedLoading.map(id => byId.get(id)?.name || id).join('、')}の比較データを読み込んでいます。`));
    }
    state.selectedIds.filter(id => failures.has(id)).forEach(companyId => {
      const row = document.createElement('div');
      row.className = 'evidence-company-load-error';
      row.dataset.companyLoadError = companyId;
      row.append(text('p', `${byId.get(companyId)?.name || companyId}の比較データを読み込めませんでした。`));
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'text-button evidence-company-retry';
      retry.dataset.retryCompanyId = companyId;
      retry.textContent = '再試行';
      row.append(retry);
      loadStatus.append(row);
    });
  };
  const renderMatrix = () => {
    const selectionReady = state.selectedIds.length >= 2;
    const selectedLoaded = state.selectedIds.filter(id => loadedIds.has(id));
    const setRecord = financialSetForSelection(state.selectedIds);
    empty.hidden = selectionReady;
    matrixScroll.hidden = !selectionReady || selectedLoaded.length === 0;
    matrix.style.setProperty('--evidence-company-count', String(Math.max(2, selectedLoaded.length)));
    root.querySelectorAll('[data-evidence-company-row]').forEach(orderAndFilterCompanyCells);
    const allMissingDimensions: string[] = [];
    root.querySelectorAll<HTMLElement>('[data-dimension-id]').forEach(row => {
      const selectedCells = directCompanyCells(row).filter(cell => state.selectedIds.includes(cell.dataset.companyId!));
      const allSelectedLoaded = selectedLoaded.length === state.selectedIds.length;
      const allMissing = selectionReady && allSelectedLoaded && selectedCells.length > 0
        && selectedCells.every(cell => cell.dataset.hasContent !== 'true');
      const unresolvedFinancial = row.dataset.dimensionId === 'financial' && !setRecord;
      row.hidden = allMissing || unresolvedFinancial;
      if (allMissing) allMissingDimensions.push(row.dataset.dimensionId || 'unknown');
    });
    [expandedFinancial, evidenceTrace].forEach(orderAndFilterCompanyCells);
    root.querySelectorAll<HTMLElement>('[data-financial-set-id]').forEach(panel => { panel.hidden = panel.dataset.financialSetId !== setRecord?.setId; });
    root.querySelectorAll<HTMLElement>('[data-quality-set-id]').forEach(panel => { panel.hidden = panel.dataset.qualitySetId !== setRecord?.setId; });
    const runtimeMessages: string[] = [];
    if (selectionReady && !setRecord) runtimeMessages.push('この選択には比較用の財務データがないため、財務比較はできません。');
    if (allMissingDimensions.length) runtimeMessages.push(`全社未収録・比較対象外：${allMissingDimensions.map(id => uiData.dimensionLabels?.[id] || id).join('、')}`);
    runtimeQuality.replaceChildren();
    runtimeMessages.forEach(message => runtimeQuality.append(text('p', message)));
    renderLoadStatus();
  };
  const renderDetail = () => {
    root.dataset.detail = state.detail;
    detailDescription.textContent = state.detail === 'expanded' ? '詳細 — 全根拠・財務履歴まで表示' : '要点 — 代表情報だけを表示';
    root.querySelectorAll<HTMLButtonElement>('[data-evidence-detail]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.evidenceDetail === state.detail));
    });
  };
  const renderSectionLinks = () => {
    root.querySelectorAll<HTMLAnchorElement>('[data-evidence-section-link]').forEach(link => {
      const section = link.dataset.evidenceSectionLink || null;
      link.href = `${location.pathname}${serializeEvidenceCompareSearch(location.search, { ...state, section })}`;
      link.setAttribute('aria-current', String(section === state.section));
    });
  };
  const render = (historyMode: 'replace' | 'push' | false = 'replace') => {
    renderSelected();
    renderMatrix();
    renderDetail();
    renderSectionLinks();
    if (historyMode) updateUrl(historyMode);
  };
  const loadCompany = async (companyId: string) => {
    if (loadedIds.has(companyId) || loadingIds.has(companyId)) return;
    loadingIds.add(companyId);
    failures.delete(companyId);
    renderLoadStatus();
    try {
      mountAsset(await loader.load(companyId));
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      failures.set(companyId, normalized);
      console.error(`Company Compare asset load failed: ${companyId}`, normalized);
    } finally {
      loadingIds.delete(companyId);
    }
  };
  const refreshSelection = async (historyMode: 'replace' | 'push' | false = 'replace') => {
    const revision = ++selectionRevision;
    renderSelected();
    renderDetail();
    renderSectionLinks();
    renderLoadStatus();
    if (historyMode) updateUrl(historyMode);
    await Promise.all(state.selectedIds.map(loadCompany));
    if (revision !== selectionRevision) return;
    renderMatrix();
  };

  const candidateMatches = (query: string) => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return companies.filter((company: any) => supportedIds.has(company.id)
      && !state.selectedIds.includes(company.id)
      && tokens.every((token: string) => company.searchText.includes(token))).slice(0, 10);
  };
  const renderSuggestions = () => {
    currentSuggestions = candidateMatches(searchInput.value);
    suggestions.replaceChildren();
    if (!currentSuggestions.length) {
      suggestions.hidden = true;
      searchInput.setAttribute('aria-expanded', 'false');
      return;
    }
    currentSuggestions.forEach(company => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'compare-suggestion';
      button.dataset.addId = company.id;
      button.setAttribute('role', 'option');
      const name = text('span', '', 'compare-suggestion-name');
      appendCompanyName(name, company);
      button.append(name);
      button.append(text('span', `${company.ticker} · ${localizeCompareLocation(company.country)} · ${company.primaryLayer}`, 'compare-suggestion-meta'));
      suggestions.append(button);
    });
    suggestions.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  };
  const addCompany = (id: string) => {
    state.issues = [];
    if (!byId.has(id)) state.issues.push({ code: 'unknown', id });
    else if (!supportedIds.has(id)) state.issues.push({ code: 'unsupported', id });
    else if (state.selectedIds.includes(id)) state.issues.push({ code: 'duplicate', id });
    else if (state.selectedIds.length >= evidenceCompareMaxCompanies) state.issues.push({ code: 'limit', id });
    else state.selectedIds.push(id);
    searchInput.value = '';
    suggestions.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
    void refreshSelection();
    searchInput.focus();
  };
  const applySet = (ids: string[]) => {
    state.selectedIds = ids.filter(id => supportedIds.has(id)).slice(0, evidenceCompareMaxCompanies);
    state.issues = [];
    state.section = null;
    void refreshSelection();
  };

  const returnFocus = new WeakMap<HTMLDialogElement, HTMLElement>();
  function wireDialog(dialog: HTMLDialogElement) {
    if (dialog.dataset.compareDialogWired === 'true') return;
    dialog.dataset.compareDialogWired = 'true';
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      const trigger = returnFocus.get(dialog);
      trigger?.setAttribute('aria-expanded', 'false');
      trigger?.focus();
    });
  }

  searchInput.addEventListener('input', renderSuggestions);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && currentSuggestions[0]) { event.preventDefault(); addCompany(currentSuggestions[0].id); }
    if (event.key === 'Escape') { suggestions.hidden = true; searchInput.setAttribute('aria-expanded', 'false'); }
  });
  suggestions.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-add-id]');
    if (button?.dataset.addId) addCompany(button.dataset.addId);
  });
  selectedRoot.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-remove-id]');
    if (!button?.dataset.removeId) return;
    state.selectedIds = state.selectedIds.filter(id => id !== button.dataset.removeId);
    state.issues = [];
    void refreshSelection();
  });
  clearButton.addEventListener('click', () => {
    state.selectedIds = [];
    state.issues = [];
    state.section = null;
    void refreshSelection();
    searchInput.focus();
  });
  app.querySelectorAll<HTMLElement>('[data-evidence-set-ids]').forEach(button => {
    button.addEventListener('click', () => applySet((button.dataset.evidenceSetIds || '').split(',').filter(Boolean)));
  });
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyButton.textContent = 'コピーしました';
      setTimeout(() => { copyButton.textContent = '比較URLをコピー'; }, 1600);
    } catch {
      copyButton.textContent = 'URL欄からコピーしてください';
      setTimeout(() => { copyButton.textContent = '比較URLをコピー'; }, 2200);
    }
  });
  loadStatus.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-retry-company-id]');
    if (!button?.dataset.retryCompanyId) return;
    void loadCompany(button.dataset.retryCompanyId).then(renderMatrix);
  });
  root.addEventListener('click', event => {
    const detailButton = (event.target as Element).closest<HTMLButtonElement>('[data-evidence-detail]');
    if (detailButton?.dataset.evidenceDetail) {
      state.detail = detailButton.dataset.evidenceDetail === 'expanded' ? 'expanded' : 'summary';
      render('push');
      return;
    }
    const sectionLink = (event.target as Element).closest<HTMLAnchorElement>('[data-evidence-section-link]');
    if (sectionLink?.dataset.evidenceSectionLink) {
      event.preventDefault();
      state.section = sectionLink.dataset.evidenceSectionLink;
      render();
      const sectionId = state.section === 'value-chain-position' ? 'ai-role' : state.section;
      document.querySelector(`#evidence-section-${CSS.escape(sectionId)}`)?.scrollIntoView({ block: 'start' });
      return;
    }
    const trigger = (event.target as Element).closest<HTMLElement>('[data-evidence-open]');
    if (trigger) {
      const dialog = document.getElementById(trigger.dataset.evidenceOpen || '');
      if (!(dialog instanceof HTMLDialogElement)) return;
      returnFocus.set(dialog, trigger);
      trigger.setAttribute('aria-expanded', 'true');
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-evidence-close]')?.focus();
      return;
    }
    const close = (event.target as Element).closest<HTMLElement>('[data-evidence-close]');
    if (close) (close.closest('dialog') as HTMLDialogElement | null)?.close();
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const trigger = (event.target as Element).closest<HTMLElement>('[data-evidence-open]');
    if (!trigger) return;
    event.preventDefault();
    trigger.click();
  });
  document.addEventListener('click', event => {
    if (event.target === searchInput || suggestions.contains(event.target as Node)) return;
    suggestions.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
  });
  window.addEventListener('popstate', () => {
    const restored = parseEvidenceCompareSearch(location.search, byId.keys(), supportedIds);
    if (!restored.enabled) { location.reload(); return; }
    state = restored;
    void refreshSelection(false);
  });

  await refreshSelection();
  if (state.section) {
    const sectionId = state.section === 'value-chain-position' ? 'ai-role' : state.section;
    requestAnimationFrame(() => document.querySelector(`#evidence-section-${CSS.escape(sectionId!)}`)?.scrollIntoView({ block: 'start' }));
  }
  document.documentElement.dataset.companyCompareMode = 'evidence';
  app.dataset.compareMode = 'evidence';
  root.hidden = false;
  root.dataset.evidenceControllerInitialized = 'true';
  return true;
}
