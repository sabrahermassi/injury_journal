import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './client';

// Shared with auth-context.tsx: every cached query here is scoped to
// whichever account is currently signed in, so a sign-out (voluntary or
// forced) must clear it before a different account can sign in -- otherwise
// the next account renders the previous one's cached injuries/symptoms/etc.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a 401 or a 404 just delays the error the user needs to see.
      // Everything else is worth one or two attempts on a phone network.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});
