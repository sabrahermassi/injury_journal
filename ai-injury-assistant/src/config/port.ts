// 3000 and 3001 are taken by the journal app in this monorepo (frontend/ and
// backend/ respectively), so this service defaults to 3002. PORT comes first
// so hosts that inject it keep working; ASSISTANT_PORT is the namespaced value
// in the repo-root .env, which backend/ shares and reads as BACKEND_PORT.
const rawPort = process.env.PORT ?? process.env.ASSISTANT_PORT ?? '3002';

if (rawPort.trim() === '') {
  throw new Error(`Invalid PORT: ${rawPort}`);
}

const PORT = Number(rawPort);

if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
  throw new Error(`Invalid PORT: ${rawPort}`);
}

export { PORT };
