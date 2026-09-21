import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('./fixtures/atlas-mobile-map-v01.json', import.meta.url), 'utf8'));
const valueChain = JSON.parse(await readFile(new URL('../src/data/value-chain.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../src/pages/atlas.astro', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles/global-visual-v01.css', import.meta.url), 'utf8');

assert.equal(valueChain.length, fixture.order.length, 'the Atlas keeps AI demand plus its eight engineering stages');
assert.deepEqual(valueChain.map(stage => stage.id), fixture.order, 'Atlas stage order remains AI demand through physical AI');
assert.equal(valueChain.filter(stage => stage.id !== 'demand').length, fixture.stageCount, 'Atlas keeps exactly eight numbered stages');
assert.equal(new Set(valueChain.map(stage => stage.id)).size, valueChain.length, 'Atlas has no duplicated stage IDs');

for (const expected of fixture.stages) {
  const stage = valueChain.find(candidate => candidate.id === expected.id);
  assert.ok(stage, `${expected.id} remains in the Atlas`);
  assert.equal(stage.number, expected.number, `${expected.id} keeps its stage number`);
  assert.equal(stage.name, expected.name, `${expected.id} keeps its name`);
  const filter = stage.id === 'demand' ? { key: 'q', value: 'AI' } : { key: 'stage', value: stage.id };
  assert.deepEqual(filter, expected.filter, `${expected.id} keeps its Company directory filter`);
}

assert.match(source, new RegExp(fixture.preservedNote), 'the non-linear process note remains on the Atlas');
assert.equal((source.match(/valueChain\.map\(/g) ?? []).length, 1, 'desktop and mobile use one Atlas stage rendering path');
assert.equal((source.match(/class="value-chain-map"/g) ?? []).length, 1, 'the Atlas has one map DOM');
assert.match(source, /stage\.links\.slice\(0, 3\)/, 'mobile keeps the first three technology links immediately available');
assert.match(source, /<details class="atlas-more-technologies" data-atlas-more-technologies open>/, 'remaining technologies use one native details disclosure');
assert.match(source, /<summary>詳細技術を表示<\/summary>/, 'the disclosure has its explicit native summary');
assert.match(source, /details\.open = viewport === 'desktop'/, 'the same disclosure stays open on desktop and collapses by default on mobile');
assert.match(source, /aria-hidden="true">↓/, 'flow arrows remain decorative for assistive technologies');
assert.match(source, /atlas-context-label">導入文脈/, 'AI demand remains distinguished as context rather than an engineering stage');

assert.match(styles, /grid-template-columns: 190px minmax\(240px, \.9fr\) minmax\(260px, 1\.1fr\);/, 'desktop retains its three-column overview');
assert.match(styles, /@media \(max-width: 640px\) \{[\s\S]*?\.global-visual-atlas \.value-chain-map \{[\s\S]*?display: block;/, 'mobile switches the shared map DOM to one column');
assert.match(styles, /\.global-visual-atlas \.value-chain-stage-head \{[\s\S]*?min-height: 44px;/, 'the stage filter entry has a 44px mobile target');
assert.match(styles, /\.global-visual-atlas \.value-chain-links a \{[\s\S]*?min-height: 44px;[\s\S]*?min-width: 44px;/, 'technology filters have 44px mobile targets');
assert.match(styles, /\.global-visual-atlas \.atlas-more-technologies summary \{[\s\S]*?min-height: 44px;/, 'the native summary has a 44px mobile target');
assert.match(styles, /\.global-visual-atlas \.value-chain-arrow \{[\s\S]*?left: calc\(50% - 11px\);/, 'mobile arrows show a vertical flow between cards');

console.log(`Atlas mobile map contract passed: ${fixture.stageCount} stages, one shared DOM, ${fixture.breakpoints.desktopColumns}-column desktop and ${fixture.breakpoints.mobileColumns}-column mobile.`);
