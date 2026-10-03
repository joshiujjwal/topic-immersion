import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

export function startStaticServer({ root, port, mountPath = '' }) {
  const staticRoot = resolve(root);
  const mount = mountPath.replace(/\/+$/u, '');

  const server = createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
    } catch (error) {
      console.error('Invalid request path:', error);
      response.writeHead(400).end('Bad request');
      return;
    }

    if (mount && pathname !== mount && !pathname.startsWith(`${mount}/`)) {
      response.writeHead(404).end('Not found');
      return;
    }

    const relativePath = mount ? pathname.slice(mount.length) : pathname;
    const requestedPath = relativePath === '/' ? '/index.html' : relativePath;
    const filePath = resolve(staticRoot, `.${requestedPath}`);
    if (
      filePath !== staticRoot &&
      !filePath.startsWith(`${staticRoot}${sep}`)
    ) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    try {
      if (!(await stat(filePath)).isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type':
          mimeTypes.get(extname(filePath)) ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        response.writeHead(404).end('Not found');
        return;
      }
      console.error(`Unable to serve ${pathname}:`, error);
      response.writeHead(500).end('Unable to load this page.');
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolveServer(server);
    });
  });
}
