// The validity check is red on invalid HTML and green on a sound page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const validate = path.join(import.meta.dirname, 'validate.mjs');
const one = (html) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-')); fs.writeFileSync(path.join(d, 'index.html'), html); return spawnSync('node', [validate, d], { encoding: 'utf8' }); };
const doc = (body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title></head><body>${body}</body></html>`;

test('green on a sound page', () => { const r = one(doc('<main><p id="a">a</p></main>')); assert.equal(r.status, 0, r.stdout); });
test('red on a duplicate id', () => { const r = one(doc('<p id="a">a</p><p id="a">b</p>')); assert.equal(r.status, 1); assert.match(r.stdout, /no-dup-id/); });
test('red on an unclosed element', () => { const r = one(doc('<main><div><p>a</main>')); assert.equal(r.status, 1); });
