import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function respond(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method !== 'GET' && req.method !== 'HEAD') return respond(res, 405, 'Method not allowed.');
  let requested;
  try { requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); }
  catch { return respond(res, 400, 'Invalid path.'); }
  const file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root + path.sep)) return respond(res, 403, 'Forbidden.');
  try {
    const info = await stat(file);
    if (!info.isFile()) return respond(res, 404, 'Not found.');
    const data = await readFile(file);
    return respond(res, 200, data, mime[path.extname(file)] || 'application/octet-stream');
  } catch {
    return respond(res, 404, 'Not found.');
  }
});

server.listen(port, () => console.log(`L’Académie du Français is running at http://localhost:${port}`));
