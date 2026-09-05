// Read per call, not once at module load — same reason as assistantService: at
// module scope this resolves before a test can point it somewhere else.
const extractorUrl = () => process.env.EXTRACTOR_API_URL;
const sharedSecret = () => process.env.EXTRACTOR_SHARED_SECRET;

// Thin proxy to the AI extractor Lambda (ai-injury-extractor/).
//
// The browser used to call the Lambda's API Gateway URL directly, with no
// credentials of any kind, and the Lambda filed every extraction under one
// hardcoded "test-user-001" partition — so any caller could read back everyone
// else's raw injury text and burn the project's Groq quota (issue #32). Routing
// through here means the Lambda is no longer internet-facing: it trusts exactly
// one caller, this backend, proven by a shared secret, and takes the user id
// from a JWT this app has already verified.
//
// Unlike the assistant, the Lambda does not verify JWTs itself, so the token is
// never forwarded — only the id it resolved to. That keeps JWT_SECRET out of AWS.
const callExtractor = async (path, { method, body }) => {
  const baseUrl = extractorUrl();
  const secret = sharedSecret();

  // Misconfiguration, not a bad request: fail loudly here rather than sending an
  // unauthenticated call that the Lambda would (correctly) reject as a 403.
  if (!baseUrl || !secret) {
    const misconfigured = new Error('Extractor service unreachable');
    misconfigured.statusCode = 503;
    throw misconfigured;
  }

  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Extractor-Secret': secret,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    // The extractor is a separate, independently deployed service — it being
    // down is an upstream failure, not a bug in this request.
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

  // Pass the Lambda's own status and error body through rather than flattening
  // everything to 500 — its 400/502 responses are meaningful to the caller. The
  // one exception is 403, which can only mean our own secret is wrong; that is
  // our misconfiguration to own, not something to blame on the user.
  if (response.status === 403) {
    const rejected = new Error('Extractor service rejected this service');
    rejected.statusCode = 502;
    throw rejected;
  }

  return { status: response.status, data };
};

export const extractInjury = async (userId, { text }) =>
  callExtractor('/extract', {
    method: 'POST',
    body: { userId: String(userId), text },
  });

export const getExtractionHistory = async (userId) =>
  // The id goes in the query string because API Gateway maps GET bodies away.
  callExtractor(`/injuries?userId=${encodeURIComponent(String(userId))}`, {
    method: 'GET',
  });
