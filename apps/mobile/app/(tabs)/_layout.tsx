import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, MODULE } from '../../lib/theme';
import { useDesignTokens } from '../../hooks/useDesignTokens';

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
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={color} /> }} />
      <Tabs.Screen name="mind" options={{ title: 'Mind', tabBarActiveTintColor: MODULE.mind.color, tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} /> }} />
      <Tabs.Screen name="flow" options={{ title: 'Flow', tabBarActiveTintColor: MODULE.flow.color, tabBarIcon: ({ color, size }) => <Ionicons name="navigate" size={size} color={color} /> }} />
      <Tabs.Screen name="body" options={{ title: 'Body', tabBarActiveTintColor: MODULE.soma.color, tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} /> }} />
      <Tabs.Screen name="hub" options={{ title: 'Hub', tabBarActiveTintColor: MODULE.hub.color, tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} /> }} />
    </Tabs>
  );
}
