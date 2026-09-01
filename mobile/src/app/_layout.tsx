import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ApiError } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { useInjuryTheme } from '@/hooks/use-injury-theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
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

// Auth decides which half of the app exists, so the redirect lives here rather
// than in each screen. `status` starts as 'loading' while the stored session is
// checked; redirecting during that would flash the login screen at someone who
// is already signed in.
function RouteGuard() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useInjuryTheme();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    SplashScreen.hideAsync();

    const onAuthScreen = segments[0] === 'login' || segments[0] === 'register';

    if (status === 'unauthenticated' && !onAuthScreen) {
      router.replace('/login');
    } else if (status === 'authenticated' && onAuthScreen) {
      router.replace('/');
    }
  }, [status, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create account' }} />
      <Stack.Screen name="injury/[id]" options={{ title: 'Injury' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const { scheme } = useInjuryTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <RouteGuard />
      </AuthProvider>
    </QueryClientProvider>
  );
}
