import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../../scripts/static-server.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const temporaryRoot = await mkdtemp(
  resolve(tmpdir(), 'topic-immersion-pages-'),
);
const publishedSite = resolve(temporaryRoot, 'topic-immersion');

await cp(resolve(projectRoot, 'src'), publishedSite, { recursive: true });

const server = await startStaticServer({
  root: publishedSite,
  mountPath: '/topic-immersion',
  port: Number(process.env.PORT ?? 4173),
});
console.log(
  'Prefix-aware Pages fixture is available at http://127.0.0.1:4173/topic-immersion/',
);

const cleanup = async () => {
  await new Promise((resolveClose, rejectClose) =>
    server.close((error) => (error ? rejectClose(error) : resolveClose())),
  );
  await rm(temporaryRoot, { recursive: true, force: true });
};

process.once('SIGINT', () => void cleanup());
process.once('SIGTERM', () => void cleanup());
