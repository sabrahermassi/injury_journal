import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getInjury,
  getMedicalVisits,
  getSymptoms,
  getTimelineEvents,
  getTreatments,
} from '@/api/client';
import { Card, Eyebrow, Heading, ListState, Secondary, Body } from '@/components/ui';
import { FontSize, Radius } from '@/constants/injury-theme';
import { useInjuryTheme } from '@/hooks/use-injury-theme';

// The web page stacks four cards down one column. On a phone that is four
// screenfuls of scrolling to reach the visits, so the sections become a
// segmented control and only the visible one is fetched.
const SECTIONS = ['Symptoms', 'Treatments', 'Visits', 'Timeline'] as const;

type Section = (typeof SECTIONS)[number];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

export default function InjuryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const injuryId = Number(id);
  const { colors, painColor } = useInjuryTheme();
  const [section, setSection] = useState<Section>('Symptoms');

  const injury = useQuery({
    queryKey: ['injury', injuryId],
    queryFn: () => getInjury(injuryId),
    enabled: Number.isFinite(injuryId),
  });

  const symptoms = useQuery({
    queryKey: ['symptoms', injuryId],
    queryFn: () => getSymptoms(injuryId),
    enabled: Number.isFinite(injuryId) && section === 'Symptoms',
  });

  const treatments = useQuery({
    queryKey: ['treatments', injuryId],
    queryFn: () => getTreatments(injuryId),
    enabled: Number.isFinite(injuryId) && section === 'Treatments',
  });

  const visits = useQuery({
    queryKey: ['visits', injuryId],
    queryFn: () => getMedicalVisits(injuryId),
    enabled: Number.isFinite(injuryId) && section === 'Visits',
  });

  const timeline = useQuery({
    queryKey: ['timeline', injuryId],
    queryFn: () => getTimelineEvents(injuryId),
    enabled: Number.isFinite(injuryId) && section === 'Timeline',
  });

  const activeQuery = {
    Symptoms: symptoms,
    Treatments: treatments,
    Visits: visits,
    Timeline: timeline,
  }[section];

  return (
    <>
      <Stack.Screen options={{ title: injury.data?.name ?? 'Injury' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching}
            onRefresh={activeQuery.refetch}
            tintColor={colors.primary}
          />
        }>
        {injury.data ? (
          <Card style={styles.summary}>
            <Secondary>
              {injury.data.bodyArea}
              {injury.data.side ? ` · ${injury.data.side}` : ''} · since{' '}
              {formatDate(injury.data.startDate)}
            </Secondary>
            {injury.data.description ? (
              <Body>{injury.data.description}</Body>
            ) : null}
          </Card>
        ) : (
          <ListState
            loading={injury.isPending}
            error={injury.error}
            empty={false}
            emptyMessage=""
          />
        )}

        <View
          style={[
            styles.segmented,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}>
          {SECTIONS.map((name) => {
            const selected = name === section;

            return (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setSection(name)}
                style={[
                  styles.segment,
                  selected && { backgroundColor: colors.card },
                ]}>
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color: selected
                        ? colors.foreground
                        : colors.mutedForeground,
                    },
                  ]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ListState
          loading={activeQuery.isPending}
          error={activeQuery.error}
          empty={(activeQuery.data ?? []).length === 0}
          emptyMessage={`No ${section.toLowerCase()} recorded yet.`}
        />

        {section === 'Symptoms' &&
          symptoms.data?.map((symptom) => (
            <Card key={symptom.id} style={styles.row}>
              <View style={styles.rowText}>
                <Heading>{symptom.location ?? 'Symptom'}</Heading>
                <Secondary>{formatDate(symptom.date)}</Secondary>
                {symptom.notes ? <Body>{symptom.notes}</Body> : null}
              </View>
              <View style={styles.painBlock}>
                {/* The numeral is always rendered: colour alone must never be
                    what tells someone how bad a day was. */}
                <Text
                  style={[
                    styles.painValue,
                    { color: painColor(symptom.painLevel) },
                  ]}>
                  {symptom.painLevel}
                </Text>
                <Eyebrow>pain</Eyebrow>
              </View>
            </Card>
          ))}

        {section === 'Treatments' &&
          treatments.data?.map((treatment) => (
            <Card key={treatment.id} style={styles.stack}>
              <Heading>{treatment.name}</Heading>
              <Secondary>
                {treatment.provider ? `${treatment.provider} · ` : ''}
                {formatDate(treatment.date)}
              </Secondary>
              {treatment.outcome ? <Body>{treatment.outcome}</Body> : null}
            </Card>
          ))}

        {section === 'Visits' &&
          visits.data?.map((visit) => (
            <Card key={visit.id} style={styles.stack}>
              <Heading>{visit.doctor ?? 'Medical visit'}</Heading>
              <Secondary>
                {visit.clinic ? `${visit.clinic} · ` : ''}
                {formatDate(visit.date)}
              </Secondary>
              {visit.notes ? <Body>{visit.notes}</Body> : null}
            </Card>
          ))}

        {section === 'Timeline' &&
          timeline.data?.map((event) => (
            <Card key={event.id} style={styles.stack}>
              <Eyebrow>{event.type}</Eyebrow>
              <Body>{event.description}</Body>
              <Secondary>{formatDate(event.date)}</Secondary>
            </Card>
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    padding: 16,
  },
  summary: {
    gap: 6,
  },
  segmented: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    alignItems: 'center',
    borderRadius: Radius - 3,
    flex: 1,
    paddingVertical: 8,
  },
  segmentLabel: {
    fontSize: FontSize.secondary,
    fontWeight: '600',
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  stack: {
    gap: 4,
  },
  painBlock: {
    alignItems: 'center',
  },
  painValue: {
    fontSize: 32,
    fontWeight: '700',
  },
});
