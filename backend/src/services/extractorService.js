// Thin proxy to the AI extractor Lambda (ai-injury-extractor/), mirroring
// assistantService.js: the browser cannot call it directly because this
// app's JWT lives in an httpOnly cookie scoped to this origin, so client-side
// JS has no token to attach. Forwarding the caller's own verified token from
// here keeps it out of JS while giving the Lambda the identity it needs to
// scope DynamoDB reads/writes. Both services must share the same JWT_SECRET.
//
// Read per-call, not at module load -- unlike the assistant, this Lambda has
// no runnable localhost default, so leaving it unset must fail cleanly
// rather than resolve to some placeholder that only breaks at fetch time.
const EXTRACTOR_TIMEOUT_MS = 10_000;

async function callExtractor(token, path, options = {}) {
  const extractorUrl = process.env.EXTRACTOR_API_URL;

  if (!extractorUrl) {
    const notConfigured = new Error('Extractor service not configured');
    notConfigured.statusCode = 503;
    throw notConfigured;
  }

  let response;

  try {
    response = await fetch(`${extractorUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(EXTRACTOR_TIMEOUT_MS),
    });
  } catch (error) {
    // The extractor is a separate, independently deployed service -- it
    // being down is an upstream failure, not a bug in this request.
    const unreachable = new Error('Extractor service unreachable');
    unreachable.statusCode = 503;
    unreachable.cause = error;
    throw unreachable;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    const badResponse = new Error('Extractor service returned an invalid response');
    badResponse.statusCode = 502;
    throw badResponse;
  }

  // Pass the extractor's own status and error body through rather than
  // flattening everything to 500.
  return { status: response.status, data };
}

export const extractInjury = (token, { text }) =>
  callExtractor(token, '/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

export const getInjuryHistory = (token) => callExtractor(token, '/injuries');
