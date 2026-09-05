import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getInjuries, type Injury } from '@/api/client';
import { Card, Heading, ListState, Secondary } from '@/components/ui';
import { FontSize, Radius } from '@/constants/injury-theme';
import { useInjuryTheme } from '@/hooks/use-injury-theme';

function StatusPill({ status }: { status: string | null }) {
  const { colors } = useInjuryTheme();
  const resolved = (status ?? '').toLowerCase() === 'resolved';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors.accent,
          borderColor: colors.border,
        },
      ]}>
      <Text
        style={[
          styles.pillLabel,
          { color: resolved ? colors.mutedForeground : colors.accentForeground },
        ]}>
        {status ?? 'Unknown'}
      </Text>
    </View>
  );
}

export default function InjuriesScreen() {
  const router = useRouter();
  const { colors } = useInjuryTheme();

  const injuries = useQuery({
    queryKey: ['injuries'],
    queryFn: getInjuries,
  });

  const renderItem = ({ item }: { item: Injury }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/injury/${item.id}`)}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Heading>{item.name}</Heading>
            <Secondary>
              {item.bodyArea}
              {item.side ? ` · ${item.side}` : ''}
            </Secondary>
          </View>
          <StatusPill status={item.status} />
        </View>
        <Secondary>
          Since {new Date(item.startDate).toLocaleDateString()}
        </Secondary>
      </Card>
    </Pressable>
  );

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={injuries.data ?? []}
      keyExtractor={(injury) => String(injury.id)}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={injuries.isRefetching}
          onRefresh={injuries.refetch}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <ListState
          loading={injuries.isPending}
          error={injuries.error}
          empty
          emptyMessage="No injuries recorded yet."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    padding: 16,
  },
  card: {
    gap: 8,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    gap: 2,
  },
  pill: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillLabel: {
    fontSize: FontSize.secondary,
    fontWeight: '600',
  },
});
