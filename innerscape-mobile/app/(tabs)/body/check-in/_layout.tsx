import { Stack } from 'expo-router';

export default function CheckInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="body-scan" />
      <Stack.Screen name="wheel" />
      <Stack.Screen name="sensations" />
      <Stack.Screen name="reflection" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
