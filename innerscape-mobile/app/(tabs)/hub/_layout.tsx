import { Stack } from 'expo-router';

export default function HubLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="goals" 
        options={{ 
          headerShown: true, 
          title: 'Goals',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }} 
      />
      <Stack.Screen 
        name="analytics" 
        options={{ 
          headerShown: true, 
          title: 'Insights',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }} 
      />
    </Stack>
  );
}
