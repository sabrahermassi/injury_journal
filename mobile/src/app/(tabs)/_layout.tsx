import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useInjuryTheme } from '@/hooks/use-injury-theme';

/**
 * Bottom tabs replace the web sidebar. Only the read-only half exists so far;
 * the centre "Log" action and the Timeline / More tabs arrive with Phase 2,
 * which is where logging an entry in three taps becomes the point.
 */
export default function TabsLayout() {
  const { colors } = useInjuryTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForegroundSubtle,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Feather name="sun" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="injuries"
        options={{
          title: 'Injuries',
          tabBarIcon: ({ color, size }) => (
            <Feather name="activity" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
