import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getInjuries, type Injury } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Card, Eyebrow, Heading, ListState, Secondary } from '@/components/ui';
import { FontSize } from '@/constants/injury-theme';
import { useInjuryTheme } from '@/hooks/use-injury-theme';

const isActive = (injury: Injury) =>
  (injury.status ?? '').toLowerCase() !== 'resolved';

function daysSince(iso: string): number {
  const start = new Date(iso).getTime();

  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useInjuryTheme();

  const injuries = useQuery({
    queryKey: ['injuries'],
    queryFn: getInjuries,
  });

  const active = (injuries.data ?? []).filter(isActive);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={injuries.isRefetching}
          onRefresh={injuries.refetch}
          tintColor={colors.primary}
        />
      }>
      <View style={styles.header}>
        <Eyebrow>Today</Eyebrow>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        {user ? <Secondary>Signed in as {user.email}</Secondary> : null}
      </View>

      <ListState
        loading={injuries.isPending}
        error={injuries.error}
        empty={active.length === 0}
        emptyMessage={
          injuries.data?.length
            ? 'Nothing active right now. Every injury is marked resolved.'
            : 'No injuries yet. Add one from the Injuries tab.'
        }
      />

      {active.map((injury) => (
        <Pressable
          key={injury.id}
          accessibilityRole="button"
          onPress={() => router.push(`/injury/${injury.id}`)}>
          <Card style={styles.row}>
            <View style={styles.rowText}>
              <Heading>{injury.name}</Heading>
              <Secondary>
                {injury.bodyArea}
                {injury.side ? ` · ${injury.side}` : ''}
              </Secondary>
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.dayCount, { color: colors.primary }]}>
                {daysSince(injury.startDate)}
              </Text>
              <Secondary>days</Secondary>
            </View>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    padding: 16,
  },
  header: {
    gap: 4,
    paddingBottom: 4,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    alignItems: 'center',
  },
  dayCount: {
    fontSize: 28,
    fontWeight: '700',
  },
});
