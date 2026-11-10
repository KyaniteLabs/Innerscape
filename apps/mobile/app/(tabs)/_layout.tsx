import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, MODULE } from '../../lib/theme';
import { useDesignTokens } from '../../hooks/useDesignTokens';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// React Navigation's tint color may be null on RN 0.88+; Ionicons only accepts string | undefined.
function tabIcon(name: IoniconName) {
  function TabIcon({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={name} size={size} color={typeof color === 'string' ? color : undefined} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  const tokens = useDesignTokens();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: tokens.colors.background,
          borderBottomColor: tokens.colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: tokens.colors.text.primary,
        headerTitleStyle: { fontWeight: FONT.weight.black, letterSpacing: -0.3 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: tokens.colors.card,
          borderTopColor: tokens.colors.borderStrong,
          borderTopWidth: 1,
          minHeight: tokens.accessibility.density === 'compact' ? 64 : 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarItemStyle: { borderRadius: tokens.radius.lg, marginHorizontal: 3 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: FONT.weight.bold },
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.text.dim,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('leaf') }} />
      <Tabs.Screen name="mind" options={{ title: 'Mind', tabBarActiveTintColor: MODULE.mind.color, tabBarIcon: tabIcon('sparkles') }} />
      <Tabs.Screen name="flow" options={{ title: 'Flow', tabBarActiveTintColor: MODULE.flow.color, tabBarIcon: tabIcon('navigate') }} />
      <Tabs.Screen name="body" options={{ title: 'Body', tabBarActiveTintColor: MODULE.soma.color, tabBarIcon: tabIcon('pulse') }} />
      <Tabs.Screen name="hub" options={{ title: 'Hub', tabBarActiveTintColor: MODULE.hub.color, tabBarIcon: tabIcon('cube') }} />
    </Tabs>
  );
}
