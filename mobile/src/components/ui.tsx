import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { FontSize, Radius } from '@/constants/injury-theme';
import { useInjuryTheme } from '@/hooks/use-injury-theme';

/**
 * The handful of primitives every screen needs, carrying the UI_GUIDE rules so
 * individual screens don't have to remember them: cards are a hairline ring
 * rather than a shadow, `border` and `input` are deliberately different values,
 * and a list always renders one of three real states instead of collapsing
 * empty and loading into the same blank box.
 */

export function Card({ style, ...props }: ViewProps) {
  const { colors } = useInjuryTheme();

  return (
    <View
      {...props}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    />
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  const { colors } = useInjuryTheme();

  return (
    <Text style={[styles.heading, { color: colors.foreground }]}>
      {children}
    </Text>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  const { colors } = useInjuryTheme();

  return (
    <Text style={[styles.body, { color: colors.foreground }]}>{children}</Text>
  );
}

export function Secondary({ children }: { children: React.ReactNode }) {
  const { colors } = useInjuryTheme();

  return (
    <Text style={[styles.secondary, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const { colors } = useInjuryTheme();

  return (
    <Text
      style={[styles.eyebrow, { color: colors.mutedForegroundSubtle }]}>
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'quiet';
}) {
  const { colors } = useInjuryTheme();
  const inactive = disabled || loading;
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? colors.primary : 'transparent',
          borderColor: primary ? colors.primary : colors.border,
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? colors.card : colors.foreground} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            { color: primary ? colors.card : colors.foreground },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const { colors } = useInjuryTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.mutedForegroundSubtle}
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.input,
            color: colors.foreground,
          },
          props.style,
        ]}
      />
    </View>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  const { colors } = useInjuryTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.notice,
        { backgroundColor: colors.accent, borderColor: colors.destructive },
      ]}>
      <Text style={[styles.body, { color: colors.destructive }]}>
        {message}
      </Text>
    </View>
  );
}

/**
 * Loading, failed, and empty are three different things and a person needs to
 * be told which one they are looking at. Returns `null` once there is data, so
 * a caller can render it unconditionally above the list.
 */
export function ListState({
  loading,
  error,
  empty,
  emptyMessage,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  emptyMessage: string;
}) {
  const { colors } = useInjuryTheme();

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.state}>
        <ErrorNotice
          message={
            error instanceof Error ? error.message : 'Something went wrong.'
          }
        />
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.state}>
        <Secondary>{emptyMessage}</Secondary>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  heading: {
    fontSize: FontSize.heading,
    fontWeight: '600',
  },
  body: {
    fontSize: FontSize.body,
  },
  secondary: {
    fontSize: FontSize.secondary,
  },
  eyebrow: {
    fontSize: FontSize.eyebrow,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  button: {
    alignItems: 'center',
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    // 48 is the comfortable thumb target; below ~44 taps start missing.
    minHeight: 48,
    paddingHorizontal: 20,
  },
  buttonLabel: {
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: FontSize.secondary,
    fontWeight: '500',
  },
  input: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: FontSize.body,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  notice: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  state: {
    paddingVertical: 32,
  },
});
