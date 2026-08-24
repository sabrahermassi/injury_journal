import { CortiAuth, CortiClient } from '@corti/sdk';

const auth = new CortiAuth({
  environment: process.env.CORTI_ENVIRONMENT,
  tenantName: process.env.CORTI_TENANT_NAME,
});

// Full-access server-side client (REST — documents, facts, etc.). Never
// exposed to the browser, unlike the scoped token below.
export const corti = new CortiClient({
  environment: process.env.CORTI_ENVIRONMENT,
  tenantName: process.env.CORTI_TENANT_NAME,
  auth: {
    clientId: process.env.CORTI_CLIENT_ID,
    clientSecret: process.env.CORTI_CLIENT_SECRET,
  },
});

// Scoped token — minted from a dedicated, minimally-scoped Corti API client
// (not the full-access backend client above) so the browser can only open
// the /transcribe WebSocket, never call REST endpoints or read/write other
// tenant data even if this token is intercepted.
export const getTranscribeToken = async () => {
  try {
    return await auth.getToken({
      clientId: process.env.CORTI_TRANSCRIBE_CLIENT_ID,
      clientSecret: process.env.CORTI_TRANSCRIBE_CLIENT_SECRET,
      scopes: ['transcribe'],
    });
  } catch (error) {
    const wrapped = new Error(`Corti authentication failed: ${error.message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};
