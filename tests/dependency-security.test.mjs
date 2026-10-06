import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
// Sólo fixtures locales. Timeout de proceso: nunca intentar un DoS contra staging.
function isolated(code) {
  execFileSync(process.execPath, ['-e', code], { cwd: root, timeout: 3000, maxBuffer: 8192 })
}

test('AUD-031: PostCSS resuelve la dependencia parcheada exacta del lock', () => {
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
  const installed = require('source-map-js/package.json')
  const [major, minor, patch] = installed.version.split('.').map(Number)
  assert.ok(major > 1 || (major === 1 && (minor > 2 || (minor === 2 && patch >= 2))))
  assert.equal(installed.version, lock.packages['node_modules/source-map-js'].version)
  assert.match(lock.packages['node_modules/source-map-js'].resolved, /^https:\/\/registry\.npmjs\.org\//)
  const postcssRequire = createRequire(require.resolve('postcss/package.json'))
  assert.equal(postcssRequire.resolve('source-map-js'), require.resolve('source-map-js'))
})

test('AUD-031: offsets inválidos/excesivos y suma anidada son rechazados en proceso acotado', () => {
  isolated(`
    const assert = require('node:assert/strict');
    const { SourceMapConsumer } = require('source-map-js');
    const flat = { version: 3, sources: ['synthetic.js'], sourcesContent: ['let x = 1;'], names: [], mappings: 'AAAA' };
    const indexed = (line, column = 0, map = flat) => ({ version: 3, sections: [{ offset: { line, column }, map }] });
    for (const line of [1e12, Number.MAX_SAFE_INTEGER, Infinity, NaN, -1, 0.5, '0']) {
      assert.throws(() => new SourceMapConsumer(indexed(line)), /Section offset/);
    }
    for (const column of [-1, 0.5, Infinity, '0']) {
      assert.throws(() => new SourceMapConsumer(indexed(0, column)), /Section offset/);
    }
    assert.throws(() => new SourceMapConsumer(indexed(6e6, 0, indexed(6e6))), /including offsets of nested sections/);
  `)
})

test('AUD-031: mapas válidos/PostCSS funcionan y mapping lejos del código no bloquea', () => {
  isolated(`
    const assert = require('node:assert/strict');
    const { SourceMapConsumer, SourceNode } = require('source-map-js');
    const flat = { version: 3, sources: ['synthetic.js'], sourcesContent: ['let x = 1;'], names: [], mappings: 'AAAA' };
    const indexed = line => ({ version: 3, sections: [{ offset: { line, column: 0 }, map: flat }] });
    const mappings = [];
    new SourceMapConsumer(indexed(0)).eachMapping(mapping => mappings.push(mapping));
    assert.equal(mappings[0].generatedLine, 1);
    const code = 'let x = 1;';
    assert.equal(SourceNode.fromStringWithSourceMap(code, new SourceMapConsumer(indexed(1e7))).toString(), code);
    const result = require('postcss').parse('.x { color: red; }', { from: 'synthetic.css' })
      .toResult({ to: 'out.css', map: { inline: false } });
    assert.match(result.css, /color: red/);
    const consumer = new SourceMapConsumer(result.map.toJSON());
    assert.equal(consumer.originalPositionFor({ line: 1, column: 0 }).source, 'synthetic.css');
  `)
})
