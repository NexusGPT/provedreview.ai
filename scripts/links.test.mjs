// The link checker is red on a broken link and a missing anchor, green on a sound tree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const links = path.join(import.meta.dirname, 'links.mjs');
const tree = (files) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'links-'));
  for (const [f, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), body); }
  return d;
};
const check = (d) => spawnSync('node', [links, d], { encoding: 'utf8' });

test('green on a sound tree', () => {
  const d = tree({ 'index.html': '<a href="/a/">a</a><a href="/a/#x">x</a><img src="/i.png" alt=""><a href="https://example.com/">e</a>', 'a/index.html': '<h2 id="x">x</h2><a href="../">up</a>', 'i.png': '' });
  const r = check(d); assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('red on a page that does not exist', () => {
  const d = tree({ 'index.html': '<a href="/missing/">m</a>' });
  const r = check(d); assert.equal(r.status, 1); assert.match(r.stdout + r.stderr, /\/missing\//);
});

test('red on an anchor that does not exist', () => {
  const d = tree({ 'index.html': '<a href="#nowhere">n</a>' });
  const r = check(d); assert.equal(r.status, 1); assert.match(r.stdout + r.stderr, /#nowhere/);
});
