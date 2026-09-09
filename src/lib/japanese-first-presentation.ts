
export type JapaneseFirstEntityType = 'claim' | 'product' | 'portfolio' | 'facility';
export type JapaneseFirstDecision = 'translate' | 'preserve';

export interface JapaneseFirstPresentationEntry {
  entityType: JapaneseFirstEntityType;
  stableKey: string;
  decision: JapaneseFirstDecision;
  title?: string;
  statement?: string;
  canonicalDigest: string;
  reason?: string;
}

export interface JapaneseFirstDisplayCopy {
  title: string;
  statement: string;
}

export interface CompanyDisplayIdentityLike {
  name: string;
  japaneseName?: string | null;
}

export interface CompanyDisplayNameParts {
  accessibleName: string;
  primaryName: string;
  secondaryName: string | null;
  visualName: string;
}

export const japaneseFirstFixedUiLabels = Object.freeze({
  'Evidence CTA': '根拠を見る',
  Evidence: '根拠',
  'Company Evidence': '企業情報の根拠',
  'Locator確認': '出典箇所を確認',
  'Value Chain': 'バリューチェーン上の位置',
  'Set A': '比較セットA',
  'Set B': '比較セットB',
  'freshness status': '更新状況',
  'freshness date': '最終確認日',
});

const entityTypes = new Set<JapaneseFirstEntityType>(['claim', 'product', 'portfolio', 'facility']);

const stableSerialize = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
  }
  throw new Error(`Japanese-first presentation digest cannot serialize: ${typeof value}`);
};

const sha256Constants = Object.freeze([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotateRight = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));

const sha256 = (value: string) => {
  const input = new TextEncoder().encode(value);
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(input);
  bytes[input.length] = 0x80;
  const view = new DataView(bytes.buffer);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000), false);
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const words = new Uint32Array(64);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choose + sha256Constants[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + temp1) >>> 0, c, b, a, (temp1 + temp2) >>> 0];
    }
    for (let index = 0; index < hash.length; index += 1) hash[index] = (hash[index] + [a, b, c, d, e, f, g, h][index]) >>> 0;
  }
  return hash.map(part => part.toString(16).padStart(8, '0')).join('');
};

export const japaneseFirstCanonicalDigest = (canonical: unknown) => sha256(stableSerialize(canonical));

const entryKey = (entry: Pick<JapaneseFirstPresentationEntry, 'entityType' | 'stableKey'>) => `${entry.entityType}:${entry.stableKey}`;

export function compileJapaneseFirstPresentationEntries(entries: readonly JapaneseFirstPresentationEntry[]) {
  const compiled = new Map<string, JapaneseFirstPresentationEntry>();
  for (const entry of entries) {
    if (!entityTypes.has(entry.entityType)) throw new Error(`Japanese-first presentation entity type is unsupported: ${entry.entityType}`);
    if (!entry.stableKey.trim()) throw new Error('Japanese-first presentation stable key is required');
    if (!entry.canonicalDigest.match(/^[a-f0-9]{64}$/)) throw new Error(`Japanese-first presentation digest is invalid: ${entryKey(entry)}`);
    if (entry.decision === 'translate' && (!entry.title?.trim() || !entry.statement?.trim())) {
      throw new Error(`Japanese-first translation requires title and statement: ${entryKey(entry)}`);
    }
    if (entry.decision === 'preserve' && !entry.reason?.trim()) {
      throw new Error(`Japanese-first preserve decision requires reason: ${entryKey(entry)}`);
    }
    const key = entryKey(entry);
    if (compiled.has(key)) throw new Error(`Japanese-first presentation duplicate key: ${key}`);
    compiled.set(key, Object.freeze({ ...entry }));
  }
  return compiled;
}

const registeredModules = import.meta.glob ? import.meta.glob('../data/japanese-first-copy-*.json', { eager: true, import: 'default' }) : {};
const registeredEntryMap = compileJapaneseFirstPresentationEntries(
  Object.entries(registeredModules)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([path, payload]) => {
      if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { entries?: unknown }).entries)) {
        throw new Error(`Japanese-first presentation data envelope is invalid: ${path}`);
      }
      return (payload as { entries: JapaneseFirstPresentationEntry[] }).entries;
    }),
);

export function resolveJapaneseFirstPresentation(
  entityType: JapaneseFirstEntityType,
  stableKey: string,
  canonical: unknown,
  fallback: JapaneseFirstDisplayCopy,
  entries: ReadonlyMap<string, JapaneseFirstPresentationEntry> = registeredEntryMap,
) {
  const entry = entries.get(`${entityType}:${stableKey}`);
  if (!entry) return { ...fallback, decision: 'canonical' as const };
  if (entry.canonicalDigest !== japaneseFirstCanonicalDigest(canonical)) {
    throw new Error(`Japanese-first presentation digest is stale: ${entityType}:${stableKey}`);
  }
  if (entry.decision === 'preserve') return { ...fallback, decision: 'preserve' as const, reason: entry.reason! };
  return { title: entry.title!, statement: entry.statement!, decision: 'translate' as const };
}

export const resolveJapaneseFirstClaimPresentation = (
  claim: { id: string; title: string; statement: string },
  fallback: JapaneseFirstDisplayCopy = { title: claim.title, statement: claim.statement },
  entries: ReadonlyMap<string, JapaneseFirstPresentationEntry> = registeredEntryMap,
) => resolveJapaneseFirstPresentation('claim', claim.id, { id: claim.id, title: claim.title, statement: claim.statement }, fallback, entries);

export function companyDisplayNameParts(identity: CompanyDisplayIdentityLike): CompanyDisplayNameParts {
  const name = identity.name.trim();
  const japaneseName = identity.japaneseName?.trim();
  if (!japaneseName || japaneseName === name) {
    return { accessibleName: name, primaryName: name, secondaryName: null, visualName: name };
  }
  const bilingual = japaneseName.match(/^(.*?)(（[^（）]+）)$/);
  if (bilingual) {
    const primaryName = bilingual[1].trim() || name;
    const secondaryName = bilingual[2];
    return { accessibleName: japaneseName, primaryName, secondaryName, visualName: `${primaryName}${secondaryName}` };
  }
  const japanesePrimary = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(japaneseName);
  const primaryName = japanesePrimary ? japaneseName : name;
  return {
    accessibleName: `${name}（${japaneseName}）`,
    primaryName,
    secondaryName: null,
    visualName: primaryName,
  };
}
