import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const hashFile = (name) => createHash('sha256').update(readFileSync(join(root, name))).digest('hex');
const npmCli = process.env.npm_execpath;
if (!npmCli || !existsSync(npmCli)) {
  throw new Error('Run this reporter through npm so the actual npm executable can be identified.');
}
const npmVersion = execFileSync(process.execPath, [npmCli, '--version'], { encoding: 'utf8' }).trim();
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const names = ['astro', 'vite', 'esbuild', 'rollup', 'rolldown', 'pagefind'];
const installed = Object.fromEntries(names.map((name) => [name, []]));
const nativeInstalled = [];

for (const key of Object.keys(lock.packages ?? {})) {
  if (!key) continue;
  const native = /(?:^|\/)node_modules\/(?:@esbuild\/[^/]+|@rollup\/rollup-[^/]+|@rolldown\/binding-[^/]+)$/.test(key);
  const name = names.find((item) => key.endsWith(`/node_modules/${item}`) || key === `node_modules/${item}`);
  if (!native && !name) continue;
  const packagePath = join(root, key, 'package.json');
  if (!existsSync(packagePath)) continue;
  const actual = JSON.parse(readFileSync(packagePath, 'utf8'));
  const entry = {
    package: actual.name,
    version: actual.version,
    installedAt: relative(root, dirname(packagePath)).replaceAll('\\', '/'),
    lockVersion: lock.packages[key]?.version ?? null,
  };
  if (name) installed[name].push(entry);
  if (native) nativeInstalled.push(entry);
}
for (const name of names) {
  if (name !== 'rollup' && !installed[name].length) throw new Error(`Installed ${name} package was not found at lockfile paths.`);
  installed[name].sort((a, b) => a.installedAt.localeCompare(b.installedAt));
}
nativeInstalled.sort((a, b) => a.installedAt.localeCompare(b.installedAt));
const report = {
  schemaVersion: 'build-environment-v01',
  recordedAt: new Date().toISOString(),
  runtime: { node: process.version, npm: npmVersion, os: process.platform, architecture: process.arch },
  inputSha256: { 'package.json': hashFile('package.json'), 'package-lock.json': hashFile('package-lock.json') },
  installed,
  nativeInstalled,
};
const outputIndex = process.argv.indexOf('--output');
if (outputIndex !== -1) {
  const target = process.argv[outputIndex + 1];
  if (!target) throw new Error('--output requires a file path.');
  const outputPath = resolve(process.cwd(), target);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify(report));
