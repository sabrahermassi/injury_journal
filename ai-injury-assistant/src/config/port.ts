// 3000 and 3001 are taken by the journal app in this monorepo (frontend/ and
// backend/ respectively), so this service defaults to 3002 and its own
// frontend to 3003. Override with PORT as usual.
const rawPort = process.env.PORT ?? '3002';

if (rawPort.trim() === '') {
  throw new Error(`Invalid PORT: ${rawPort}`);
}

const PORT = Number(rawPort);

if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
  throw new Error(`Invalid PORT: ${rawPort}`);
}

export { PORT };
