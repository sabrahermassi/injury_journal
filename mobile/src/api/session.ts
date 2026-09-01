import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Where the native client keeps its tokens.
 *
 * The web app deliberately does the opposite -- its access token lives in an
 * httpOnly cookie precisely so no JavaScript can read it (issue #8), and
 * `frontend/services/api.ts` must never regress to storing one. That decision
 * was about XSS: a script injected into a page can read anything the page can.
 * A native bundle has no DOM and no third-party script tags, and SecureStore is
 * backed by the iOS Keychain and Android Keystore rather than by a string in a
 * browser. Two clients, two different correct answers -- not an exception to
 * the web rule.
 */

const ACCESS_TOKEN_KEY = 'injuryJournal.accessToken';
const REFRESH_TOKEN_KEY = 'injuryJournal.refreshToken';

export type Session = {
  accessToken: string;
  refreshToken: string;
};

// SecureStore has no web implementation -- there is no Keychain in a browser,
// and it throws rather than silently downgrading. `expo start --web` is only a
// convenience for glancing at layout, so there the session lives in memory for
// the tab's lifetime. Falling back to localStorage is exactly the thing issue
// #8 forbids, so it is not on the table.
const canPersist = Platform.OS !== 'web';

// `undefined` means "not read from the store yet", which is distinct from
// `null`, "read, and there is no session". Without that distinction every
// request would hit the Keychain again on a signed-out app.
let cached: Session | null | undefined;

async function readStore(): Promise<Session | null> {
  if (!canPersist) {
    return null;
  }

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  // A half-written session is no session: without the refresh token the access
  // token is unrecoverable an hour from now.
  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function getSession(): Promise<Session | null> {
  if (cached === undefined) {
    cached = await readStore();
  }

  return cached;
}

export async function setSession(session: Session | null): Promise<void> {
  cached = session;

  if (!canPersist) {
    return;
  }

  if (!session) {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);

    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
  ]);
}
