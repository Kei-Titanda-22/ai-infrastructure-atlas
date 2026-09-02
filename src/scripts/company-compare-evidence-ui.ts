import {
  evidenceCompareMaxCompanies,
  matchEvidencePilotSet,
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

const issueLabels: Record<EvidenceCompareIssue['code'], string> = {
  unknown: '不明な企業ID',
  unsupported: '試験対象外',
  duplicate: '重複を除外',
  limit: '4社上限を超過',
};

const element = <T extends Element>(root: ParentNode, selector: string) => root.querySelector<T>(selector);

const requiredElement = <T extends Element>(root: ParentNode, selector: string) => {
  const found = element<T>(root, selector);
  if (!found) throw new Error(`Company Evidence Compare requires ${selector}`);
  return found;
};

export function initCompanyCompareEvidenceUi(): boolean {
  const app = requiredElement<HTMLElement>(document, '#compare-app');
  const root = requiredElement<HTMLElement>(document, '#company-compare-evidence');
  const legacy = requiredElement<HTMLElement>(document, '#legacy-compare-view');
  const compareDataNode = requiredElement<HTMLScriptElement>(document, '#compare-data');
  const evidenceDataNode = requiredElement<HTMLScriptElement>(document, '#compare-evidence-ui-data');
  if (root.dataset.evidenceControllerInitialized === 'true') return true;

  const pageData = JSON.parse(compareDataNode.textContent || '{}');
  const uiData = JSON.parse(evidenceDataNode.textContent || '{}');
  if (!Array.isArray(pageData.companies)) throw new Error('Company Evidence Compare page data is invalid');
  if (!Array.isArray(uiData.pilotCompanyIds)) throw new Error('Company Evidence Compare payload is invalid');
  const companies = pageData.companies;
  const byId = new Map<string, any>(companies.map((company: any) => [company.id, company]));
  const supportedIds = new Set<string>(uiData.pilotCompanyIds);
  let state = parseEvidenceCompareSearch(location.search, byId.keys(), supportedIds);
  if (!state.enabled) throw new Error('Company Evidence Compare controller requires view=evidence');

  legacy.hidden = true;
  element<HTMLElement>(app, '#legacy-compare-templates')?.setAttribute('hidden', '');
  element<HTMLElement>(app, '#evidence-compare-templates')?.removeAttribute('hidden');
  const evidenceTemplateLabel = element<HTMLElement>(app, '#evidence-compare-templates .compare-template-label');
  if (evidenceTemplateLabel) evidenceTemplateLabel.textContent = '比較セット';
  const pageLead = document.querySelector<HTMLElement>('#compare-page-lead');
  const builderMeta = element<HTMLElement>(app, '#compare-builder-meta');
  if (pageLead) pageLead.textContent = '試験対象5社から2～4社を選び、各社の役割、製品・技術、企業間関係、財務の比較条件を根拠付きで確認します。';
  if (builderMeta) builderMeta.textContent = '2～4社を選択できます。重複、対象外の企業、4社を超える指定は理由を表示して除外します。';

  const searchInput = requiredElement<HTMLInputElement>(app, '#compare-company-search');
  const suggestions = requiredElement<HTMLElement>(app, '#compare-suggestions');
  const selectedRoot = requiredElement<HTMLElement>(app, '#compare-selected');
  const selectionStatus = requiredElement<HTMLElement>(app, '#compare-selection-status');
  const routeStatus = requiredElement<HTMLElement>(root, '#evidence-route-status');
  const detailDescription = requiredElement<HTMLElement>(root, '[data-evidence-detail-description]');
  const empty = requiredElement<HTMLElement>(root, '#evidence-compare-empty');
  const matrixScroll = requiredElement<HTMLElement>(root, '#evidence-matrix-scroll');
  const matrix = requiredElement<HTMLTableElement>(root, '#evidence-compare-matrix');
  const runtimeQuality = requiredElement<HTMLElement>(root, '#evidence-runtime-quality');
  const clearButton = requiredElement<HTMLButtonElement>(app, '#clear-compare');
  const copyButton = requiredElement<HTMLButtonElement>(app, '#copy-compare-url');
  let currentSuggestions: any[] = [];

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
  const pickedCompanies = () => state.selectedIds.map(id => byId.get(id)).filter(Boolean);

  const issueText = (issues: EvidenceCompareIssue[]) => issues
    .map(issue => `${issueLabels[issue.code]}：${issue.id}`)
    .join(' / ');

  const updateUrl = (mode: 'replace' | 'push') => {
    const query = serializeEvidenceCompareSearch(location.search, state);
    history[mode === 'push' ? 'pushState' : 'replaceState'](
      { evidenceCompare: true },
      '',
      `${location.pathname}${query}`,
    );
  };

  const renderSelected = () => {
    selectedRoot.replaceChildren();
    const picked = pickedCompanies();
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
      const link = document.createElement('a');
      link.href = company.href;
      link.className = 'company-link compare-selected-name';
      appendCompanyName(link, company);
      info.append(link);
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
      cell.querySelectorAll<HTMLElement>('[data-company-order-label]').forEach(label => {
        label.textContent = presentation.label;
      });
      container.append(cell);
    });
    cells.filter(cell => !state.selectedIds.includes(cell.dataset.companyId!)).forEach(cell => {
      cell.hidden = true;
      delete cell.dataset.companyOrder;
      delete cell.dataset.companyToken;
      container.append(cell);
    });
  };

  const renderMatrix = () => {
    const ready = state.selectedIds.length >= 2;
    const setRecord = matchEvidencePilotSet(state.selectedIds);
    empty.hidden = ready;
    matrixScroll.hidden = !ready;
    matrix.style.setProperty('--evidence-company-count', String(Math.max(2, state.selectedIds.length)));
    root.querySelectorAll('[data-evidence-company-row]').forEach(orderAndFilterCompanyCells);

    const allMissingDimensions: string[] = [];
    root.querySelectorAll<HTMLElement>('[data-dimension-id]').forEach(row => {
      const selectedCells = directCompanyCells(row).filter(cell => state.selectedIds.includes(cell.dataset.companyId!));
      const allMissing = ready && selectedCells.length > 0 && selectedCells.every(cell => cell.dataset.hasContent !== 'true');
      const unresolvedFinancial = row.dataset.dimensionId === 'financial' && !setRecord;
      row.hidden = allMissing || unresolvedFinancial;
      if (allMissing) allMissingDimensions.push(row.dataset.dimensionId || 'unknown');
    });

    root.querySelectorAll<HTMLElement>('.evidence-expanded-financial, .evidence-trace-list')
      .forEach(orderAndFilterCompanyCells);

    root.querySelectorAll<HTMLElement>('[data-financial-set-id]').forEach(panel => {
      panel.hidden = panel.dataset.financialSetId !== setRecord?.setId;
    });
    root.querySelectorAll<HTMLElement>('[data-quality-set-id]').forEach(panel => {
      panel.hidden = panel.dataset.qualitySetId !== setRecord?.setId;
    });

    const runtimeMessages: string[] = [];
    if (ready && !setRecord) runtimeMessages.push('この選択には比較用の財務データがないため、財務比較はできません。');
    if (allMissingDimensions.length) {
      runtimeMessages.push(`全社未収録・比較対象外：${allMissingDimensions.map(id => uiData.dimensionLabels?.[id] || id).join('、')}`);
    }
    runtimeQuality.replaceChildren();
    runtimeMessages.forEach(message => runtimeQuality.append(text('p', message)));
  };

  const renderDetail = () => {
    root.dataset.detail = state.detail;
    detailDescription.textContent = state.detail === 'expanded'
      ? '詳細 — 補足・全根拠・財務履歴まで表示'
      : '要点 — 代表情報だけを表示';
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

  const candidateMatches = (query: string) => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return companies.filter((company: any) =>
      supportedIds.has(company.id)
      && !state.selectedIds.includes(company.id)
      && tokens.every((token: string) => company.searchText.includes(token)),
    ).slice(0, 10);
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
    render();
    searchInput.focus();
  };

  const applySet = (ids: string[]) => {
    state.selectedIds = ids.filter(id => supportedIds.has(id)).slice(0, evidenceCompareMaxCompanies);
    state.issues = [];
    state.section = null;
    render();
  };

  searchInput.addEventListener('input', renderSuggestions);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && currentSuggestions[0]) {
      event.preventDefault();
      addCompany(currentSuggestions[0].id);
    }
    if (event.key === 'Escape') {
      suggestions.hidden = true;
      searchInput.setAttribute('aria-expanded', 'false');
    }
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
    render();
  });
  clearButton.addEventListener('click', () => {
    state.selectedIds = [];
    state.issues = [];
    state.section = null;
    render();
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
    }
  });
  document.addEventListener('click', event => {
    if (event.target === searchInput || suggestions.contains(event.target as Node)) return;
    suggestions.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
  });

  root.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const trigger = (event.target as Element).closest<HTMLElement>('[data-evidence-open]');
    if (!trigger) return;
    event.preventDefault();
    trigger.click();
  });

  const returnFocus = new WeakMap<HTMLDialogElement, HTMLElement>();
  root.addEventListener('click', event => {
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
  root.querySelectorAll<HTMLDialogElement>('.evidence-drawer').forEach(dialog => {
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
  });

  window.addEventListener('popstate', () => {
    const restored = parseEvidenceCompareSearch(location.search, byId.keys(), supportedIds);
    if (!restored.enabled) {
      location.reload();
      return;
    }
    state = restored;
    render(false);
  });

  render();
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
