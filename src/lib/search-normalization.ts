export const normalizeSearchText = (value: unknown): string => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .trim()
  .replace(/\s+/gu, ' ')
  .replace(/[\u30a1-\u30f6]/gu, character => String.fromCodePoint(character.codePointAt(0)! - 0x60));

export const searchTokens = (value: unknown): string[] => normalizeSearchText(value)
  .split(' ')
  .filter(Boolean);

export const buildSearchText = (values: readonly unknown[]): string => values
  .map(normalizeSearchText)
  .filter(Boolean)
  .join(' ');

export const matchesSearchTokens = (haystack: string, query: unknown): boolean => {
  const tokens = searchTokens(query);
  return tokens.length > 0 && tokens.every(token => haystack.includes(token));
};
