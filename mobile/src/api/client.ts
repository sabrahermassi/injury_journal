import { getSession, setSession, type Session } from './session';

/**
 * The native client for the same Express API the web app talks to.
 *
 * ── Kept in step with `frontend/services/api.ts` by hand ──────────────────
 * Both files describe the same endpoints. A change to `backend/src/routes.js`
 * or `backend/src/validators.js` has to be reflected in BOTH, because nothing
 * checks it for you -- there is no shared package, deliberately (see the
 * mobile plan: npm workspaces would need a root package.json, which root
 * CLAUDE.md §3 forbids, and would break all four CI workflows' cache paths).
 *
 * Where the two files legitimately differ:
 *   - auth: Bearer header from SecureStore here, httpOnly cookie there
 *   - CSRF: not applicable here. `verifyCsrf` short-circuits when no auth
 *     cookie is present, so a Bearer-only client is exempt, and a native app
 *     has no cross-site request forgery surface to begin with
 *   - refresh: only this client gets a refresh token, gated on `X-Client`
 * Everything else -- paths, request shapes, response shapes -- must match.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Copy mobile/.env.example to ' +
      'mobile/.env.local and point it at this machine\'s LAN address -- a ' +
      'phone cannot reach "localhost", which on the phone means the phone.'
  );
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// The API answers with `{ error }` from errorHandler.js but `{ errors: [...] }`
// from the Zod `validate` middleware. Rather than normalize that server-side
// and risk the web app's error handling, read both shapes here.
async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();

    if (typeof body?.error === 'string') {
      return body.error;
    }

    if (Array.isArray(body?.errors) && body.errors.length > 0) {
      return body.errors.join('\n');
    }
  } catch {
    // Not JSON -- a proxy error page, or the server is simply not there.
  }

  return `Request failed (${response.status})`;
}

// Set by the auth provider so a refresh failure can bounce the user to the
// login screen from deep inside a query, where there is no navigation context.
let onSignedOut: (() => void) | null = null;

export function setSignedOutHandler(handler: (() => void) | null): void {
  onSignedOut = handler;
}

// A cold start fans out to several requests at once. If the access token has
// expired they would each independently try to refresh, and because refresh
// tokens rotate and are single-use, the second one to arrive would look like a
// replay -- which the backend treats as theft and answers by revoking the whole
// family. So: one refresh at a time, everyone waits for it.
let refreshInFlight: Promise<Session | null> | null = null;

async function performRefresh(): Promise<Session | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'native',
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
  } catch {
    // The network is down, not the session. Keep the tokens: signing the user
    // out because their train went into a tunnel would be wrong.
    return null;
  }

  if (!response.ok) {
    await setSession(null);
    onSignedOut?.();

    return null;
  }

  const body = await response.json();
  const next: Session = {
    accessToken: body.token,
    refreshToken: body.refreshToken,
  };

  await setSession(next);

  return next;
}

function refreshSession(): Promise<Session | null> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Off for the auth endpoints: a wrong password is a 401 worth showing. */
  retryOnUnauthorized?: boolean;
};

async function request<T>(
  path: string,
  { method = 'GET', body, retryOnUnauthorized = true }: RequestOptions = {}
): Promise<T> {
  const session = await getSession();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Opts this client in to a refresh token. Without it the server returns
      // the web-shaped response, which has none -- see isNativeClient in
      // backend/src/controllers.js for why that gate exists.
      'X-Client': 'native',
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (response.status === 401 && retryOnUnauthorized && session) {
    const refreshed = await refreshSession();

    if (refreshed) {
      return request<T>(path, { method, body, retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────
// Mirrors the interfaces in frontend/services/api.ts.

export interface User {
  id: number;
  email: string;
  createdAt?: string;
}

export interface Injury {
  id: number;
  name: string;
  bodyArea: string;
  side: string | null;
  startDate: string;
  cause: string | null;
  description: string | null;
  status: string | null;
  createdAt: string;
}

export interface Symptom {
  id: number;
  date: string;
  painLevel: number;
  location: string | null;
  trigger: string | null;
  duration: string | null;
  notes: string | null;
}

export interface Treatment {
  id: number;
  name: string;
  provider: string | null;
  date: string;
  cost: number | null;
  outcome: string | null;
  followUpDueAt: string | null;
}

export interface MedicalVisit {
  id: number;
  doctor: string | null;
  clinic: string | null;
  date: string;
  notes: string | null;
}

export interface TimelineEvent {
  id: number;
  type: string;
  date: string;
  description: string;
  result: string | null;
}

// ── Auth ─────────────────────────────────────────────────────────────────

type AuthResponse = {
  token: string;
  refreshToken: string;
  user: User;
};

export async function login(email: string, password: string): Promise<User> {
  const body = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    retryOnUnauthorized: false,
  });

  await setSession({
    accessToken: body.token,
    refreshToken: body.refreshToken,
  });

  return body.user;
}

export async function register(email: string, password: string): Promise<User> {
  // Register returns `{ id, email, token, ... }` flat, not nested under `user`
  // -- `{ id, email }` was the entire response body before it started signing
  // the user in, and existing callers still read those two off the top level.
  const body = await request<User & { token: string; refreshToken: string }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: { email, password },
      retryOnUnauthorized: false,
    }
  );

  await setSession({
    accessToken: body.token,
    refreshToken: body.refreshToken,
  });

  return { id: body.id, email: body.email };
}

export async function logout(): Promise<void> {
  const session = await getSession();

  if (session) {
    try {
      await request<void>('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
        retryOnUnauthorized: false,
      });
    } catch {
      // The local session is cleared below regardless. A user who taps "log
      // out" must end up logged out even if the server is unreachable.
    }
  }

  await setSession(null);
}

export function getCurrentUser(): Promise<User> {
  return request<User>('/api/auth/me');
}

// ── Resources (read) ──────────────────────────────────────────────────────

export function getInjuries(): Promise<Injury[]> {
  return request<Injury[]>('/api/injuries');
}

export function getInjury(id: number): Promise<Injury> {
  return request<Injury>(`/api/injuries/${id}`);
}

export function getSymptoms(injuryId: number): Promise<Symptom[]> {
  return request<Symptom[]>(`/api/injuries/${injuryId}/symptoms`);
}

export function getTreatments(injuryId: number): Promise<Treatment[]> {
  return request<Treatment[]>(`/api/injuries/${injuryId}/treatments`);
}

export function getMedicalVisits(injuryId: number): Promise<MedicalVisit[]> {
  return request<MedicalVisit[]>(`/api/injuries/${injuryId}/visits`);
}

export function getTimelineEvents(injuryId: number): Promise<TimelineEvent[]> {
  return request<TimelineEvent[]>(`/api/injuries/${injuryId}/events`);
}
