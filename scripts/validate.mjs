// Every built page is valid HTML: html-validate's recommended and document presets, with the few style rules this site
// writes differently turned off, each with its reason.   node scripts/validate.mjs [dist]   exit 1 on any error
import fs from 'node:fs';
import path from 'node:path';
import { HtmlValidate, StaticConfigLoader } from 'html-validate';

const dist = path.resolve(process.argv[2] || 'dist');
const config = {
  extends: ['html-validate:recommended', 'html-validate:document'],
  rules: {
    'no-inline-style': 'off', // the home's bar widths and one button row are inline custom properties (--w, --c)
    'attribute-boolean-style': 'off',
    'no-trailing-whitespace': 'off',
    'long-title': 'off', // the paper's title is the page title
    'no-implicit-button-type': 'error',
    'require-sri': 'off', // every script and stylesheet is same-origin
    'no-redundant-role': 'error',
    'tel-non-breaking': 'off',
    'doctype-style': 'off', // <!doctype html> in lower case is valid HTML
  },
};
const hv = new HtmlValidate(new StaticConfigLoader(config));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(dist).filter((f) => f.endsWith('.html') && !f.includes(`${path.sep}pagefind${path.sep}`));

let errors = 0;
for (const f of pages) {
  const report = await hv.validateString(fs.readFileSync(f, 'utf8'), path.relative(dist, f));
  for (const r of report.results) for (const m of r.messages) {
    if (m.severity !== 2) continue;
    errors++;
    console.log(`${r.filePath}:${m.line}:${m.column} ${m.ruleId} ${m.message}`);
  }
}
console.log(`validate: ${pages.length} pages, ${errors} errors`);
process.exit(errors ? 1 : 0);
