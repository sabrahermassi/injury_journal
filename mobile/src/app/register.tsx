import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Button, ErrorNotice, Field, Secondary } from '@/components/ui';
import { useInjuryTheme } from '@/hooks/use-injury-theme';

// Mirrors registerSchema in backend/src/validators.js, so a too-short password
// is caught before the round trip rather than coming back as a 400.
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useInjuryTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  const submit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      await signUp(email, password);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not create account.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Secondary>
            Creating an account signs you in straight away.
          </Secondary>

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
            autoComplete="new-password"
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
          />

          {tooShort ? (
            <Secondary>
              Passwords need at least {MIN_PASSWORD_LENGTH} characters.
            </Secondary>
          ) : null}

          <Button
            label="Create account"
            loading={submitting}
            disabled={!email || password.length < MIN_PASSWORD_LENGTH}
            onPress={submit}
          />
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
    gap: 20,
    padding: 24,
  },
});
