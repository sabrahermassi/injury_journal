import { AppError } from '../utils.js';

// Read per call, not once at module load. At module scope this resolved before
// any test could point it somewhere else, so `assistant.test.js` — which sets
// AI_ASSISTANT_URL to a closed port precisely so its "unreachable" case cannot
// reach a real service — quietly kept talking to localhost:3002 and got a 401
// from it instead of the 503 it was asserting. Same fix as extractorService.
const assistantUrl = () => process.env.AI_ASSISTANT_URL || 'http://localhost:3002';

// Thin proxy to the AI assistant service (ai-injury-assistant/).
//
// The browser cannot call that service directly: this app's JWT lives in an
// httpOnly cookie scoped to this origin, so client-side JS has no token to put
// in an Authorization header — and deliberately so (issue #8). Forwarding the
// caller's own verified token from here keeps it out of JS while still giving
// the assistant the identity it needs to scope retrieval. Both services must
// share the same JWT_SECRET for this to verify on the other side.
export const askAssistant = async (token, { question, injuryId }) => {
  const body = { question };

  if (injuryId !== undefined && injuryId !== null) {
    body.injuryId = injuryId;
  }

  let response;

  try {
    response = await fetch(`${assistantUrl()}/ai-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // The assistant is a separate, independently deployed service — it being
    // down is an upstream failure, not a bug in this request.
    const unreachable = new AppError('Assistant service unreachable', 503);
    unreachable.cause = error;
    throw unreachable;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new AppError('Assistant service returned an invalid response', 502);
  }

  // Pass the assistant's own status and error body through rather than
  // flattening everything to 500 — its 401/429/safety responses are
  // meaningful to the caller.
  return { status: response.status, data };
};
