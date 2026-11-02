// Copies the pinned source files into content/, byte for byte, from a local clone of each repository.
// node scripts/vendor.mjs [name]   (LEAN_GIT=<path to a lean clone>, default /root/lean)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pins = JSON.parse(fs.readFileSync(path.join(root, 'content/PINS.json'), 'utf8'));
const clones = { lean: process.env.LEAN_GIT || '/root/lean' };
const only = process.argv[2];

for (const [name, pin] of Object.entries(pins)) {
  if (only && name !== only) continue;
  for (const file of pin.files) {
    const body = execFileSync('git', ['-C', clones[name], 'show', `${pin.commit}:${file}`]);
    const out = path.join(root, 'content', name, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body);
    console.log(`${name}@${pin.commit.slice(0, 8)} ${file} -> ${path.relative(root, out)} (${body.length} bytes)`);
  }
}
