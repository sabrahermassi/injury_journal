import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button, Card, Eyebrow, Body, Secondary } from '@/components/ui';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Eyebrow>Signed in as</Eyebrow>
        <Body>{user?.email ?? 'Unknown'}</Body>
      </Card>

      <View style={styles.card}>
        <Button label="Sign out" variant="quiet" onPress={signOut} />
        <Secondary>
          Signing out revokes this device&apos;s session on the server, not just
          on the phone.
        </Secondary>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 16,
  },
  card: {
    gap: 8,
  },
});
