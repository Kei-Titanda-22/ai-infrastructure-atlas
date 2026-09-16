import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const diagnosticsRoot = path.join(root, 'diagnostics', 'company-compare-artifact-determinism-v01');
const runARoot = path.join(diagnosticsRoot, 'linux-run-a');
const runBRoot = path.join(diagnosticsRoot, 'linux-run-b');
const artifactRoot = 'evidence-fragments/company-compare-evidence-v01';
const reportPath = path.join(diagnosticsRoot, 'report.json');
const reportMarkdownPath = path.join(diagnosticsRoot, 'report.md');
const mapAPath = path.join(diagnosticsRoot, 'linux-run-a-sha256.json');
const mapBPath = path.join(diagnosticsRoot, 'linux-run-b-sha256.json');
const knownWindowsDist = path.resolve('C:/Users/mkato/Documents/Codex/2026-08-31/github-plugin-github-openai-curated-remote/work/ai-infrastructure-atlas-corning-applied-materials-presentation-v01/dist');

const sha256 = value => createHash('sha256').update(value).digest('hex');
const stableJson = value => JSON.stringify(value, null, 2) + '\n';
const normalizePath = value => value.split(path.sep).join('/');

function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
}

function commandOutput(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isWithinRoot(candidate) {
  const relative = path.relative(root, candidate);
  return relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function isWithinDirectory(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function parseExistingAnalysisArguments(args) {
  if (args.length === 0) return null;
  assert(args.length === 4 && args[0] === '--analyze-existing' && args[2] === '--output', 'usage: --analyze-existing <fixed PR #179 dist> --output <new external directory>');
  const input = path.resolve(args[1]);
  const output = path.resolve(args[3]);
  assert(input === knownWindowsDist, 'analyze-existing accepts only the fixed PR #179 Windows dist');
  assert(existsSync(input), 'fixed PR #179 Windows dist is unavailable');
  assert(!existsSync(output), 'analyze-existing output directory must not already exist');
  assert(isWithinDirectory(path.resolve(os.tmpdir()), output), 'analyze-existing output must be a new directory beneath the system temp directory');
  assert(!isWithinDirectory(input, output) && !isWithinDirectory(output, input), 'analyze-existing input and output must not overlap');
  assert(!isWithinRoot(output), 'analyze-existing output must stay outside the repository');
  return { input, output };
}

async function clearDiagnosticsRoot() {
  assert(isWithinRoot(diagnosticsRoot), 'refusing to clear a diagnostics directory outside this repository');
  await rm(diagnosticsRoot, { recursive: true, force: true });
  await mkdir(diagnosticsRoot, { recursive: true });
}

function extractHtmlFingerprint(html) {
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const text = withoutScripts.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const collect = (pattern, transform = match => match[1]) => [...html.matchAll(pattern)].map(transform).sort();
  const headings = collect(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi, match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const links = collect(/\bhref=(?:"([^"]*)"|'([^']*)')/gi, match => match[1] ?? match[2]);
  const ids = collect(/\bid=(?:"([^"]*)"|'([^']*)')/gi, match => match[1] ?? match[2]);
  const anchors = collect(/<a\b[^>]*\b(?:id|name)=(?:"([^"]*)"|'([^']*)')/gi, match => match[1] ?? match[2]);
  const dataAttributes = collect(/\b(data-[\w-]+)=(?:"([^"]*)"|'([^']*)')/gi, match => `${match[1]}=${match[2] ?? match[3]}`);
  const jsonPayloads = collect(/<script\b[^>]*type=(?:"application\/json"|'application\/json')[^>]*>([\s\S]*?)<\/script>/gi, match => match[1].trim());
  const evidencePresentation = collect(/<(?:h[1-6]|p|strong)\b[^>]*(?:claim|evidence|presentation)[^>]*>([\s\S]*?)<\/(?:h[1-6]|p|strong)>/gi, match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const sourceTitle = collect(/<[^>]*class=(?:"[^"]*source[^"]*"|'[^']*source[^']*')[^>]*>([\s\S]*?)<\/[^>]+>/gi, match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const quote = collect(/<(?:blockquote|q)\b[^>]*>([\s\S]*?)<\/(?:blockquote|q)>/gi, match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const locator = collect(/<[^>]*class=(?:"[^"]*locator[^"]*"|'[^']*locator[^']*')[^>]*>([\s\S]*?)<\/[^>]+>/gi, match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  return Object.fromEntries(Object.entries({
    text,
    headings,
    links,
    ids,
    anchors,
    dataAttributes,
    jsonPayloads,
    evidencePresentation,
    sourceTitle,
    quote,
    locator,
    url: links,
  }).map(([key, value]) => [key, sha256(typeof value === 'string' ? value : stableJson(value))]));
}

function isUrlValue(value) {
  return /^(?:https?:\/\/|\/|\.\.?\/)/i.test(value);
}

function isSensitiveUrl(value) {
  return /(?:[?&](?:access_?token|api_?key|auth|credential|key|signature|sig|token)=|X-Amz-(?:Credential|Signature|Security-Token))/i.test(value);
}

function normalizeOrigin(value) {
  return value.replace(/^https?:\/\/[^/]+/i, '__ORIGIN__');
}

function normalizeRepositoryBase(value) {
  const absoluteBase = value.match(/^https?:\/\/[^/]+(\/ai-infrastructure-atlas(?:\/|$))/i);
  if (absoluteBase) return value.slice(absoluteBase[0].length - absoluteBase[1].length).replace(/^\/ai-infrastructure-atlas(?=\/|$)/i, '');
  return value.replace(/^\/ai-infrastructure-atlas(?=\/|$)/i, '');
}

function applySubstitutions(html, substitutions, transform) {
  let output = html;
  for (const substitution of [...substitutions].sort((a, b) => b.start - a.start)) {
    output = output.slice(0, substitution.start) + transform(substitution) + output.slice(substitution.end);
  }
  return output;
}

function collectUrlValues(html) {
  const records = [];
  const add = (kind, name, value, start, end) => {
    if (!isUrlValue(value)) return;
    assert(!isSensitiveUrl(value), `sensitive URL value detected in ${kind}:${name}`);
    records.push({ kind, name, value, start, end });
  };

  for (const match of html.matchAll(/\b(href|src|srcset|action|poster|data-url|data-href)(\s*=\s*)(["'])([\s\S]*?)\3/gi)) {
    const [whole, name, equals, quote, value] = match;
    add('attribute', name.toLowerCase(), value, match.index + name.length + equals.length + quote.length, match.index + whole.length - quote.length);
  }
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const name = tag[0].match(/\b(?:property|name)\s*=\s*(["'])(?:og:url|twitter:url)\1/i);
    const content = tag[0].match(/\bcontent(\s*=\s*)(["'])([\s\S]*?)\2/i);
    if (!name || !content) continue;
    const contentStart = tag.index + content.index + 'content'.length + content[1].length + content[2].length;
    add('meta', 'content', content[3], contentStart, contentStart + content[3].length);
  }
  for (const script of html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/json\1[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = script[2];
    const bodyStart = script.index + script[0].indexOf(body);
    for (const value of body.matchAll(/"((?:\\.|[^"\\])*)"/g)) {
      let decoded;
      try { decoded = JSON.parse(value[0]); } catch { continue; }
      if (typeof decoded !== 'string' || !isUrlValue(decoded)) continue;
      assert(!isSensitiveUrl(decoded), 'sensitive URL value detected in application/json');
      records.push({ kind: 'json', name: 'string', value: decoded, start: bodyStart + value.index, end: bodyStart + value.index + value[0].length, replacement: JSON.stringify('__URL_VALUE__') });
    }
  }
  records.sort((a, b) => a.start - b.start || a.end - b.end);
  for (let index = 1; index < records.length; index += 1) assert(records[index - 1].end <= records[index].start, 'overlapping URL substitutions are not allowed');
  return records;
}

function urlDiagnostics(html) {
  const records = collectUrlValues(html);
  const replaceValues = transform => applySubstitutions(html, records, record => record.replacement ?? transform(record.value));
  const classify = predicate => records.filter(record => predicate(record.value)).length;
  const values = records.map(record => record.value);
  return {
    rawSha256: sha256(html),
    lineEndingNormalizedSha256: sha256(html.replace(/\r\n/g, '\n')),
    originNormalizedSha256: sha256(replaceValues(normalizeOrigin)),
    repoBaseNormalizedSha256: sha256(replaceValues(normalizeRepositoryBase)),
    urlValueMaskedSha256: sha256(replaceValues(() => '__URL_VALUE__')),
    urls: {
      count: records.length,
      relativeCount: classify(value => /^(?:\.\.?\/)/.test(value)),
      rootRelativeCount: classify(value => /^\//.test(value)),
      absoluteCount: classify(value => /^https?:\/\//i.test(value)),
      repositoryBaseCount: classify(value => /^(?:https?:\/\/[^/]+)?\/ai-infrastructure-atlas(?:\/|$)/i.test(value)),
      repositoryBaseAbsentCount: classify(value => !/^(?:https?:\/\/[^/]+)?\/ai-infrastructure-atlas(?:\/|$)/i.test(value)),
      orderedValuesDigest: sha256(stableJson(values)),
      originNormalizedOrderedValuesDigest: sha256(stableJson(values.map(normalizeOrigin))),
      repoBaseNormalizedOrderedValuesDigest: sha256(stableJson(values.map(normalizeRepositoryBase))),
      attributeNameAndPositionDigest: sha256(stableJson(records.map(record => ({ kind: record.kind, name: record.name, start: record.start, end: record.end })))),
      representativeValues: values,
    },
  };
}

function lineEndingKind(buffer) {
  const text = buffer.toString('utf8');
  const crlf = (text.match(/\r\n/g) ?? []).length;
  const lf = (text.match(/(?<!\r)\n/g) ?? []).length;
  return crlf && lf ? 'mixed' : crlf ? 'crlf' : lf ? 'lf' : 'none';
}

function hasUtf8Bom(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

function firstDifferingByte(expectedBuffer, actualBuffer) {
  const upperBound = Math.min(expectedBuffer.length, actualBuffer.length);
  for (let index = 0; index < upperBound; index += 1) if (expectedBuffer[index] !== actualBuffer[index]) return index;
  return expectedBuffer.length === actualBuffer.length ? null : upperBound;
}

function firstUtf8Difference(expectedBuffer, actualBuffer) {
  const index = firstDifferingByte(expectedBuffer, actualBuffer);
  return index === null ? null : { offset: index, expectedHex: expectedBuffer.subarray(index, index + 32).toString('hex'), actualHex: actualBuffer.subarray(index, index + 32).toString('hex') };
}

async function artifactMap(buildRoot, expectedPaths) {
  const base = path.join(buildRoot, artifactRoot);
  const result = {};
  for (const relativePath of expectedPaths) {
    const filePath = path.join(base, relativePath);
    const content = await readFile(filePath);
    const html = content.toString('utf8');
    const url = urlDiagnostics(html);
    result[relativePath] = {
      sha256: sha256(content),
      rawSha256: url.rawSha256,
      bytes: content.length,
      lineEndings: lineEndingKind(content),
      bom: hasUtf8Bom(content),
      trailingNewline: content.length > 0 && content[content.length - 1] === 10,
      lineEndingNormalizedSha256: url.lineEndingNormalizedSha256,
      originNormalizedSha256: url.originNormalizedSha256,
      repoBaseNormalizedSha256: url.repoBaseNormalizedSha256,
      urlValueMaskedSha256: url.urlValueMaskedSha256,
      urls: url.urls,
      semantic: extractHtmlFingerprint(html),
    };
  }
  return result;
}

async function listArtifactPaths(buildRoot) {
  const base = path.join(buildRoot, artifactRoot);
  const entries = [];
  async function visit(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = path.posix.join(prefix, entry.name);
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), relative);
      else if (entry.isFile() && entry.name === 'index.html') entries.push(relative);
    }
  }
  await visit(base);
  return entries.sort();
}

function compareMaps(expected, actual) {
  const expectedPaths = Object.keys(expected).sort();
  const actualPaths = Object.keys(actual).sort();
  const missing = expectedPaths.filter(key => !Object.hasOwn(actual, key));
  const extra = actualPaths.filter(key => !Object.hasOwn(expected, key));
  const mismatches = [];
  for (const relativePath of expectedPaths.filter(key => Object.hasOwn(actual, key))) {
    const expectedRecord = typeof expected[relativePath] === 'string' ? { sha256: expected[relativePath] } : expected[relativePath];
    const actualRecord = actual[relativePath];
    if (expectedRecord.sha256 !== actualRecord.sha256) mismatches.push({ relativePath, expected: expectedRecord.sha256, actual: actualRecord.sha256, expectedBytes: expectedRecord.bytes ?? null, actualBytes: actualRecord.bytes });
  }
  return { expectedCount: expectedPaths.length, actualCount: actualPaths.length, missing, extra, mismatches, matchCount: expectedPaths.length - missing.length - mismatches.length };
}

async function compareBuildFiles(runA, runB, expectedPaths) {
  const differences = [];
  for (const relativePath of expectedPaths) {
    const a = await readFile(path.join(runA, artifactRoot, relativePath));
    const b = await readFile(path.join(runB, artifactRoot, relativePath));
    if (!a.equals(b)) differences.push({ relativePath, ...firstUtf8Difference(a, b) });
  }
  return differences;
}

async function pagefindUrlDigest(buildRoot) {
  const manifestPath = path.join(buildRoot, '_pagefind', 'pagefind-entry.json');
  if (!existsSync(manifestPath)) return { digest: null, urls: [] };
  const entry = await readJson(manifestPath);
  const urls = Array.isArray(entry.pages) ? entry.pages.map(page => page.url).sort() : [];
  return { digest: sha256(stableJson(urls)), urls };
}

async function maxColdLoad(map) {
  const shellBytes = map['index.html'].bytes;
  const companies = Object.entries(map).filter(([relativePath]) => relativePath !== 'index.html').map(([relativePath, record]) => ({ id: relativePath.split('/')[0], bytes: record.bytes })).sort((a, b) => b.bytes - a.bytes);
  const selected = companies.slice(0, 4);
  return { ids: selected.map(record => record.id).sort(), bytes: shellBytes + selected.reduce((sum, record) => sum + record.bytes, 0) };
}

async function scanGeneratedArtifacts(directory) {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    /gh[pousr]_[A-Za-z0-9_]{30,}/,
    /AKIA[0-9A-Z]{16}/,
    /(?:api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/i,
  ];
  const hits = [];
  async function visit(directoryPath) {
    for (const entry of await readdir(directoryPath, { withFileTypes: true })) {
      const item = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) await visit(item);
      else if (entry.isFile()) {
        const content = await readFile(item, 'utf8').catch(() => null);
        if (content && patterns.some(pattern => pattern.test(content))) hits.push(normalizePath(path.relative(directory, item)));
      }
    }
  }
  await visit(directory);
  return hits.sort();
}

async function build(outputDirectory) {
  run(process.platform === 'win32' ? 'node_modules/.bin/astro.cmd' : 'node_modules/.bin/astro', ['build', '--outDir', outputDirectory]);
  run(process.platform === 'win32' ? 'node_modules/.bin/pagefind.cmd' : 'node_modules/.bin/pagefind', ['--site', outputDirectory]);
}

const fixture = await readJson(path.join(root, 'scripts', 'fixtures', 'japanese-first-copy-v01.json'));
assert(typeof fixture.activeArtifactFreezeVersion === 'string' && fixture.activeArtifactFreezeVersion.length > 0, 'fixture must name one active artifact freeze');
assert(Array.isArray(fixture.artifactFreezes), 'fixture must contain artifact freeze history');
const freezes = fixture.artifactFreezes.filter(freeze => freeze.version === fixture.activeArtifactFreezeVersion);
assert(freezes.length === 1, 'active artifact freeze ID must resolve uniquely');
const activeFreeze = freezes[0];
assert(activeFreeze.sha256ByPath && typeof activeFreeze.sha256ByPath === 'object' && !Array.isArray(activeFreeze.sha256ByPath), 'active freeze must have a SHA map');
const expectedPaths = Object.keys(activeFreeze.sha256ByPath);
assert(expectedPaths.length === 101 && JSON.stringify(expectedPaths) === JSON.stringify([...expectedPaths].sort()), 'active freeze must contain exactly 101 stable paths');
assert(expectedPaths.every(relativePath => typeof activeFreeze.sha256ByPath[relativePath] === 'string' && /^[a-f0-9]{64}$/.test(activeFreeze.sha256ByPath[relativePath])), 'active freeze SHA values must be valid SHA-256');

const fingerprintColumns = ['text', 'headings', 'links', 'ids', 'anchors', 'dataAttributes', 'jsonPayloads', 'evidencePresentation', 'sourceTitle', 'quote', 'locator', 'url'];
const markdownCell = value => String(value ?? 'n/a').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const fingerprintRow = record => fingerprintColumns.map(column => markdownCell(record.semantic?.[column])).join(' | ');
const artifactRow = (relativePath, record) => `| ${markdownCell(relativePath)} | ${record.rawSha256} | ${record.lineEndingNormalizedSha256} | ${record.originNormalizedSha256} | ${record.repoBaseNormalizedSha256} | ${record.urlValueMaskedSha256} | ${record.urls.count} | ${record.urls.orderedValuesDigest} | ${sha256(stableJson(record.semantic))} |`;
const representativePaths = ['index.html', 'abb/index.html', 'corning/index.html', 'applied-materials/index.html'];
const representativeUrlMarkdown = map => representativePaths.flatMap(relativePath => {
  const record = map[relativePath];
  assert(record, `representative URL path missing: ${relativePath}`);
  return [`### ${relativePath}`, '', ...record.urls.representativeValues.map(value => `- \`${value}\``), ''];
});

const existingAnalysis = parseExistingAnalysisArguments(process.argv.slice(2));
if (existingAnalysis) {
  const existingPaths = await listArtifactPaths(existingAnalysis.input);
  assert(JSON.stringify(existingPaths) === JSON.stringify(expectedPaths), 'existing dist must contain exactly the 101 active freeze artifact paths');
  const existingMap = await artifactMap(existingAnalysis.input, expectedPaths);
  const freezeToExisting = compareMaps(activeFreeze.sha256ByPath, existingMap);
  const secretHits = await scanGeneratedArtifacts(existingAnalysis.input);
  assert(secretHits.length === 0, `existing artifacts contain possible secrets: ${secretHits.join(', ')}`);
  const pagefind = await pagefindUrlDigest(existingAnalysis.input);
  const semanticFingerprintDigest = sha256(stableJson(Object.fromEntries(Object.entries(existingMap).map(([key, record]) => [key, record.semantic]))));
  const report = {
    schemaVersion: 2,
    mode: 'analyze-existing',
    source: { dist: existingAnalysis.input, writeAccess: false },
    environment: { os: `${os.type()} ${os.release()} ${os.arch()}`, node: process.version, locale: process.env.LANG ?? process.env.LC_ALL ?? null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    activeFreeze: { id: fixture.activeArtifactFreezeVersion, expectedPathCount: expectedPaths.length, expectedMapDigest: sha256(stableJson(activeFreeze.sha256ByPath)) },
    existing: { mapDigest: sha256(stableJson(existingMap)), pathCount: existingPaths.length, shellBytes: existingMap['index.html'].bytes, maximumColdLoad: await maxColdLoad(existingMap), pagefind, semanticFingerprintDigest },
    freezeToExisting,
    generatedArtifactSecretScan: { hits: secretHits, status: 'pass' },
    limitations: { pagefindUrlSet: 'The 101 artifact contract contains only the shell and company HTML files; no _pagefind manifest is present in this materialized dist.' },
  };
  const markdown = [
    '# Company Compare artifact determinism report', '',
    `- Mode: \`${report.mode}\``,
    `- Active freeze: \`${report.activeFreeze.id}\``,
    `- Expected / actual paths: ${report.activeFreeze.expectedPathCount} / ${report.existing.pathCount}`,
    `- SHA map digest: \`${report.existing.mapDigest}\``,
    `- Semantic fingerprint map digest: \`${report.existing.semanticFingerprintDigest}\``,
    `- Pagefind URL-set digest: \`${report.existing.pagefind.digest ?? 'unavailable'}\``,
    `- Shell bytes: ${report.existing.shellBytes}`,
    `- Maximum cold-load bytes: ${report.existing.maximumColdLoad.bytes} (${report.existing.maximumColdLoad.ids.join(', ')})`,
    `- Active freeze SHA matches / mismatches: ${report.freezeToExisting.matchCount} / ${report.freezeToExisting.mismatches.length}`,
    '', '## Per-path raw and URL-normalized fingerprints', '',
    '| Path | Raw SHA-256 | LF-normalized SHA-256 | Origin-normalized SHA-256 | Repo-base-normalized SHA-256 | URL-masked SHA-256 | URL count | Ordered URL digest | Semantic digest |',
    '| --- | --- | --- | --- | --- | --- | ---: | --- | --- |',
    ...expectedPaths.map(relativePath => artifactRow(relativePath, existingMap[relativePath])),
    '', '## Existing semantic fingerprints', '',
    '| Path | Visible text digest | Heading digest | Link / href digest | Element ID digest | Anchor digest | data-* digest | JSON digest | Evidence presentation digest | Source title digest | Quote digest | Locator digest | URL digest |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...expectedPaths.map(relativePath => `| ${markdownCell(relativePath)} | ${fingerprintRow(existingMap[relativePath])} |`),
    '', '## Representative URL values', '', ...representativeUrlMarkdown(existingMap),
    '## Limits and safety', '',
    `- Generated artifact secret scan: ${report.generatedArtifactSecretScan.status}`,
    '- Job Summary safety limit: 900000 B; the script rejects a larger report before write.',
    '',
  ].join('\n');
  assert(Buffer.byteLength(markdown, 'utf8') <= 900000, 'diagnostic report exceeds the Job Summary safety limit');
  await mkdir(existingAnalysis.output, { recursive: false });
  await writeFile(path.join(existingAnalysis.output, 'windows-report.json'), stableJson(report));
  await writeFile(path.join(existingAnalysis.output, 'windows-report.md'), markdown);
  await writeFile(path.join(existingAnalysis.output, 'windows-sha256.json'), stableJson(existingMap));
  console.log(`Existing artifact report written: ${existingAnalysis.output}`);
  process.exit(0);
}

await clearDiagnosticsRoot();
await build(runARoot);
const runAPaths = await listArtifactPaths(runARoot);
assert(JSON.stringify(runAPaths) === JSON.stringify(expectedPaths), 'run A must contain exactly the 101 active freeze artifact paths');
const runAMap = await artifactMap(runARoot, expectedPaths);
await writeFile(mapAPath, stableJson(runAMap));

await build(runBRoot);
const runBPaths = await listArtifactPaths(runBRoot);
assert(JSON.stringify(runBPaths) === JSON.stringify(expectedPaths), 'run B must contain exactly the 101 active freeze artifact paths');
const runBMap = await artifactMap(runBRoot, expectedPaths);
await writeFile(mapBPath, stableJson(runBMap));

const runAB = compareMaps(runAMap, runBMap);
const runABByteDifferences = await compareBuildFiles(runARoot, runBRoot, expectedPaths);
const freezeRunA = compareMaps(activeFreeze.sha256ByPath, runAMap);
const freezeDetails = [];
for (const mismatch of freezeRunA.mismatches) {
  const expectedPath = path.join(root, 'diagnostics', 'expected-unavailable');
  const actualBuffer = await readFile(path.join(runARoot, artifactRoot, mismatch.relativePath));
  freezeDetails.push({ ...mismatch, actualLineEndings: lineEndingKind(actualBuffer), actualTrailingNewline: actualBuffer[actualBuffer.length - 1] === 10, firstDifferingByte: null, expectedComparison: 'freeze stores SHA only; byte-offset and semantic comparison require a materialized expected artifact' });
  void expectedPath;
}
const runAFingerprintsDigest = sha256(stableJson(Object.fromEntries(Object.entries(runAMap).map(([key, record]) => [key, record.semantic]))));
const secretHits = await scanGeneratedArtifacts(diagnosticsRoot);
assert(secretHits.length === 0, `generated diagnostics contain possible secrets: ${secretHits.join(', ')}`);
const lockfile = await readFile(path.join(root, 'package-lock.json'));
const packageJson = await readFile(path.join(root, 'package.json'));
const runAPagefind = await pagefindUrlDigest(runARoot);
const runBPagefind = await pagefindUrlDigest(runBRoot);
const report = {
  schemaVersion: 2,
  environment: {
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    node: process.version,
    npm: commandOutput('npm', ['--version']),
    locale: process.env.LANG ?? process.env.LC_ALL ?? null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dependencyTreeDigest: sha256(commandOutput('npm', ['ls', '--all', '--json'])),
    lockfileDigest: sha256(lockfile),
    packageJsonDigest: sha256(packageJson),
  },
  activeFreeze: { id: fixture.activeArtifactFreezeVersion, expectedPathCount: expectedPaths.length, expectedMapDigest: sha256(stableJson(activeFreeze.sha256ByPath)) },
  runA: { mapDigest: sha256(stableJson(runAMap)), pathCount: runAPaths.length, shellBytes: runAMap['index.html'].bytes, maximumColdLoad: await maxColdLoad(runAMap), pagefind: runAPagefind },
  runB: { mapDigest: sha256(stableJson(runBMap)), pathCount: runBPaths.length, shellBytes: runBMap['index.html'].bytes, maximumColdLoad: await maxColdLoad(runBMap), pagefind: runBPagefind },
  runAtoB: { ...runAB, byteDifferences: runABByteDifferences, pagefindUrlSetEqual: runAPagefind.digest === runBPagefind.digest },
  freezeToRunA: { ...freezeRunA, details: freezeDetails, semanticFingerprintDigest: runAFingerprintsDigest },
  generatedArtifactSecretScan: { hits: secretHits, status: 'pass' },
  limitations: { freezeSemanticComparison: 'The active freeze stores only SHA-256 values. Per-path semantic comparison against the freeze requires a materialized expected build and is intentionally not inferred.' },
};
await writeFile(reportPath, stableJson(report));
const mismatchRows = report.freezeToRunA.mismatches.length
  ? report.freezeToRunA.mismatches.map(record => {
    const actual = runAMap[record.relativePath];
    return `| ${markdownCell(record.relativePath)} | ${record.expected} | ${artifactRow(record.relativePath, actual).split('|').slice(2).join('|')}`;
  })
  : ['| None | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |'];
const runABRows = report.runAtoB.mismatches.length
  ? report.runAtoB.mismatches.map(record => `| ${markdownCell(record.relativePath)} | ${record.expected} | ${record.actual} | ${record.expectedBytes ?? 'n/a'} | ${record.actualBytes} |`)
  : ['| None | n/a | n/a | n/a | n/a |'];
const markdown = [
  '# Company Compare artifact determinism report',
  '',
  '## Environment',
  '',
  `- OS: \`${report.environment.os}\``,
  `- Node / npm: \`${report.environment.node}\` / \`${report.environment.npm}\``,
  `- Locale / timezone: \`${report.environment.locale ?? 'unset'}\` / \`${report.environment.timezone}\``,
  `- Lockfile digest: \`${report.environment.lockfileDigest}\``,
  `- Dependency tree digest: \`${report.environment.dependencyTreeDigest}\``,
  `- Active freeze: \`${report.activeFreeze.id}\``,
  `- Expected / run A / run B paths: ${report.activeFreeze.expectedPathCount} / ${report.runA.pathCount} / ${report.runB.pathCount}`,
  `- Run A / B map digests: \`${report.runA.mapDigest}\` / \`${report.runB.mapDigest}\``,
  `- Run A / B SHA mismatches: ${report.runAtoB.mismatches.length}`,
  `- Active freeze / run A SHA mismatches: ${report.freezeToRunA.mismatches.length}`,
  `- Run A Pagefind URL-set digest: \`${report.runA.pagefind.digest ?? 'unavailable'}\``,
  `- Run B Pagefind URL-set digest: \`${report.runB.pagefind.digest ?? 'unavailable'}\``,
  `- Shell bytes: ${report.runA.shellBytes}`,
  `- Maximum cold-load bytes: ${report.runA.maximumColdLoad.bytes} (${report.runA.maximumColdLoad.ids.join(', ')})`,
  `- Run A semantic fingerprint map digest: \`${report.freezeToRunA.semanticFingerprintDigest}\``,
  '',
  '## Linux run A / B SHA comparison',
  '',
  '| Path | Run A SHA-256 | Run B SHA-256 | Run A bytes | Run B bytes |',
  '| --- | --- | --- | ---: | ---: |',
  ...runABRows,
  '',
  '## Active freeze / Linux run A raw and URL-normalized fingerprint comparison',
  '',
  '| Path | Expected SHA-256 | Raw SHA-256 | LF-normalized SHA-256 | Origin-normalized SHA-256 | Repo-base-normalized SHA-256 | URL-masked SHA-256 | URL count | Ordered URL digest | Semantic digest |',
  '| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |',
  ...mismatchRows,
  '',
  '## Linux run A semantic fingerprints',
  '',
  '| Path | Visible text digest | Heading digest | Link / href digest | Element ID digest | Anchor digest | data-* digest | JSON digest | Evidence presentation digest | Source title digest | Quote digest | Locator digest | URL digest |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...expectedPaths.map(relativePath => `| ${markdownCell(relativePath)} | ${fingerprintRow(runAMap[relativePath])} |`),
  '',
  '## Representative URL values',
  '',
  ...representativeUrlMarkdown(runAMap),
  '',
  '## Limits and safety',
  '',
  `- Generated artifact secret scan: ${report.generatedArtifactSecretScan.status}`,
  '- Job Summary safety limit: 900000 B; the script rejects a larger report before upload.',
  `- Freeze semantic comparison: ${report.limitations.freezeSemanticComparison}`,
  '',
].join('\n');
assert(Buffer.byteLength(markdown, 'utf8') <= 900000, 'diagnostic report exceeds the Job Summary safety limit');
await writeFile(reportMarkdownPath, markdown);
console.log(`Diagnostic report written: ${normalizePath(path.relative(root, reportPath))}`);
