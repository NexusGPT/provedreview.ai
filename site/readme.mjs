// Reads the pinned lean README (content/lean/README.md): a section by its heading, its code blocks, a command without its trailing comment.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
export const PIN = JSON.parse(fs.readFileSync(path.join(root, 'content/PINS.json'), 'utf8')).lean;
export const README = fs.readFileSync(path.join(root, 'content/lean/README.md'), 'utf8');

export function section(heading, md = README) {
  const level = heading.match(/^#+/)[0].length;
  const start = md.indexOf('\n' + heading + '\n');
  if (start < 0) throw new Error(`lean README has no "${heading}"`);
  const rest = md.slice(start + heading.length + 2);
  const end = rest.search(new RegExp(`\\n#{1,${level}} `));
  return end < 0 ? rest : rest.slice(0, end);
}

export const blocks = (text) => [...text.matchAll(/```[a-z]*\n([\s\S]*?)\n```/g)].map((m) => m[1]);

// "cmd     # note" -> ["cmd", "note"]; the README pads a trailing comment with two or more spaces
export function split(line) {
  const m = line.match(/^(.*?)\s{2,}#\s(.*)$/);
  return m ? [m[1], m[2]] : [line, ''];
}

// a "$ cmd\noutput" block -> { commands, output }
export function run(block) {
  const lines = block.split('\n');
  const commands = lines.filter((l) => l.startsWith('$ ')).map((l) => split(l.slice(2)));
  const output = lines.filter((l) => !l.startsWith('$ ')).map(split);
  return { commands, output };
}
