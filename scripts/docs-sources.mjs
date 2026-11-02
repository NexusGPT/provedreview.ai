// Every docs page is sourced: its front matter is complete, its sources are vendored files, and every line of every
// fenced code block is verbatim in one of the page's sources (a command is copied, never written).
// node scripts/docs-sources.mjs [content/docs]   exit 1 on any finding, each one named
import fs from 'node:fs';
import path from 'node:path';
import { loadDocs } from './docs.mjs';

const root = path.resolve(import.meta.dirname, '..');
const { pages, problems } = loadDocs(path.resolve(process.argv[2] || path.join(root, 'content/docs')));
for (const p of problems) console.log('BAD ' + p);
console.log(`docs-sources: ${pages.length} pages, ${pages.reduce((n, p) => n + p.blocks.length, 0)} code blocks, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
