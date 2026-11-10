import {readGameHtml} from './game-source.cjs';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webm': 'video/webm' };
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    let route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Preserve the links previously shared while always serving the revised project.
    route = route.replace(/^\/project-repo(?=\/|$)/, '');
    if (route === '/__build') {
      const source = readGameHtml(root);
      const body = JSON.stringify({ project: 'Kick & Goal', root, sha256: createHash('sha256').update(source).digest('hex'), level8: source.toString().match(/n:'8 · ([^']+)'/)?.[1] });
      res.writeHead(200, { 'Content-Type': types['.json'] }); res.end(req.method === 'HEAD' ? undefined : body); return;
    }
    if (!route || route === '/') route = '/index.html';
    if (route.split('/').some(part => part.startsWith('.'))) { res.writeHead(403); res.end(); return; }
    const file = await fs.realpath(path.resolve(root, '.' + route));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : error.code === 'ENOENT' ? 404 : 500); res.end();
  }
});
server.on('error', error => { console.error(`Local server failed: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  console.log(`Kick & Goal: http://localhost:${port}/index.html`);
  console.log(`Also available: http://localhost:${port}/project-repo/index.html`);
  console.log(`Serving ${root}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
