import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="screen2" options={{ headerShown: false }} />
      <Stack.Screen name="screen3" options={{ headerShown: false }} />
      <Stack.Screen name="screen4" options={{ headerShown: false }} />
      <Stack.Screen name="screen5" options={{ headerShown: false }} />
    </Stack>
  );
}