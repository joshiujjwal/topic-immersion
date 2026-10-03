import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { startStaticServer } from './static-server.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const server = await startStaticServer({
  root: resolve(projectRoot, 'src'),
  port: Number(process.env.PORT ?? 4173),
});

console.log(
  `Topic Immersion is available at http://127.0.0.1:${server.address().port}/`,
);

const close = () => server.close();
process.once('SIGINT', close);
process.once('SIGTERM', close);
