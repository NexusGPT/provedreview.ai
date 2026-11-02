// Serves dist/ as GitHub Pages does: a directory serves its index.html, a missing path serves 404.html with status 404.
// node scripts/preview.mjs [port] [dist]   (default 8769 on 127.0.0.1; run `npm run build` first)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = Number(process.argv[2] || process.env.PORT || 8769);
const dist = path.resolve(process.argv[3] || 'dist');
const BASE = process.env.SITE_BASE || '/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.avif': 'image/avif', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.otf': 'font/otf', '.wasm': 'application/wasm', '.pf_meta': 'application/octet-stream', '.pf_fragment': 'application/octet-stream', '.pf_index': 'application/octet-stream', '.pdf': 'application/pdf', '.txt': 'text/plain' };
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error(`no ${dist}/index.html: run npm run build`); process.exit(1); }

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(BASE)) p = '/__none__'; else p = '/' + p.slice(BASE.length);
  let f = path.join(dist, path.normalize(p));
  if (!f.startsWith(dist)) f = path.join(dist, '__none__');
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { location: BASE + p.slice(1) + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  const ok = fs.existsSync(f) && fs.statSync(f).isFile();
  const file = ok ? f : path.join(dist, '404.html');
  res.writeHead(ok ? 200 : 404, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`preview: http://127.0.0.1:${port}${BASE} serving ${path.relative(process.cwd(), dist) || '.'}`));
