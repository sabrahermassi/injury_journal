import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button, Card, Eyebrow, Body, ErrorNotice, Secondary } from '@/components/ui';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [revocationFailed, setRevocationFailed] = useState(false);

  const handleSignOut = async () => {
    const { revoked } = await signOut();

    // The screen is about to be torn down by the route guard either way --
    // this only matters if it renders again before that happens.
    setRevocationFailed(!revoked);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Eyebrow>Signed in as</Eyebrow>
        <Body>{user?.email ?? 'Unknown'}</Body>
      </Card>

      <View style={styles.card}>
        <Button label="Sign out" variant="quiet" onPress={handleSignOut} />
        <Secondary>
          Signing out revokes this device&apos;s session on the server, not just
          on the phone.
        </Secondary>
        {revocationFailed ? (
          <ErrorNotice message="Signed out on this device, but the server couldn't be reached to end the session there too." />
        ) : null}
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
