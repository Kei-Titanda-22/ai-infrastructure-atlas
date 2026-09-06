export interface SearchComboboxOption {
  id: string;
}

export interface SearchComboboxControllerOptions<T extends SearchComboboxOption> {
  input: HTMLInputElement;
  listbox: HTMLElement;
  status: HTMLElement;
  optionIdPrefix: string;
  getMatches: (query: string) => readonly T[];
  renderOption: (option: T) => HTMLElement;
  select: (option: T) => void;
}

export interface SearchComboboxController {
  refresh: (force?: boolean) => void;
  close: () => void;
}

export const createSearchComboboxController = <T extends SearchComboboxOption>(
  options: SearchComboboxControllerOptions<T>,
): SearchComboboxController => {
  const { input, listbox, status, optionIdPrefix, getMatches, renderOption, select } = options;
  let matches: readonly T[] = [];
  let activeIndex = -1;
  let composing = false;
  let lastValue: string | null = null;

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listbox.id);
  input.setAttribute('aria-expanded', 'false');

  const close = () => {
    matches = [];
    activeIndex = -1;
    listbox.replaceChildren();
    listbox.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    status.textContent = '';
  };

  const render = () => {
    listbox.replaceChildren();
    if (!matches.length) {
      listbox.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      status.textContent = input.value ? '候補はありません。' : '';
      return;
    }
    if (activeIndex < 0 || activeIndex >= matches.length) activeIndex = 0;
    matches.forEach((option, index) => {
      const element = renderOption(option);
      const optionId = `${optionIdPrefix}-${option.id}`;
      element.id = optionId;
      element.setAttribute('role', 'option');
      element.setAttribute('aria-selected', String(index === activeIndex));
      listbox.append(element);
    });
    listbox.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-activedescendant', `${optionIdPrefix}-${matches[activeIndex].id}`);
    status.textContent = `${matches.length}件の候補があります。`;
  };

  const refresh = (force = false) => {
    const value = input.value;
    if (!force && value === lastValue) return;
    lastValue = value;
    matches = value ? getMatches(value) : [];
    activeIndex = matches.length ? 0 : -1;
    render();
  };

  const selectActive = () => {
    const active = matches[activeIndex];
    if (!active) return;
    close();
    select(active);
  };

  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => {
    composing = false;
    refresh();
  });
  input.addEventListener('input', () => refresh());
  input.addEventListener('keydown', event => {
    const imeActive = composing || event.isComposing || event.keyCode === 229;
    if (imeActive) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!matches.length) return;
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      activeIndex = (activeIndex + direction + matches.length) % matches.length;
      render();
      return;
    }
    if (event.key === 'Enter') {
      if (!matches.length) return;
      event.preventDefault();
      selectActive();
      return;
    }
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'Tab') close();
  });
  listbox.addEventListener('click', event => {
    const element = (event.target as Element).closest<HTMLElement>('[data-search-option-id]');
    const id = element?.dataset.searchOptionId;
    const option = id ? matches.find(candidate => candidate.id === id) : undefined;
    if (!option) return;
    close();
    select(option);
  });

  return { refresh, close };
};
