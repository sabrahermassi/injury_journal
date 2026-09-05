import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import {
  Body,
  Button,
  ErrorNotice,
  Eyebrow,
  Field,
  Secondary,
} from '@/components/ui';
import { FontSize } from '@/constants/injury-theme';
import { useInjuryTheme } from '@/hooks/use-injury-theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useInjuryTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      // No navigation here: the route guard in _layout.tsx moves us once the
      // auth status flips, which keeps one rule in one place.
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not sign in.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Eyebrow>Injury Journal</Eyebrow>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Secondary>
              Your symptoms, treatments, and visits in one place.
            </Secondary>
          </View>

          {error ? <ErrorNotice message={error} /> : null}

          <Field
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            inputMode="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />

          <Field
            label="Password"
            autoCapitalize="none"
            autoComplete="current-password"
            onChangeText={setPassword}
            onSubmitEditing={submit}
            placeholder="••••••••"
            returnKeyType="go"
            secureTextEntry
            value={password}
          />

          <Button
            label="Sign in"
            loading={submitting}
            disabled={!email || !password}
            onPress={submit}
          />

          <View style={styles.footer}>
            <Secondary>No account yet?</Secondary>
            <Link href="/register" style={{ color: colors.primary }}>
              <Body>Create one</Body>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 20,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
});
