/*
 * static-server.mjs — Minimal zero-dependency static file server for previewing
 * the shared/ UI in a normal browser (used for visual QA; not shipped).
 * Serves ./shared on the given port (default 5177).
 */
import { createServer } from 'http';
import { readFile } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'shared');
const port = process.env.PORT || 5177;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json',
};

createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = normalize(join(rootDir, urlPath));
  if (!filePath.startsWith(rootDir)) { res.writeHead(403).end('forbidden'); return; }
  readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log(`static preview on http://localhost:${port}`));
