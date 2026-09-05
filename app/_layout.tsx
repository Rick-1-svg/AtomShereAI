import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useOnboardingStore } from '@/hooks/stores/use-onboarding-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Initial route configuration for Expo Router
// Let the app decide the initial route based on onboarding status
export const unstable_settings = {
  // Remove initialRouteName to allow dynamic routing
};

SplashScreen.preventAutoHideAsync();

/**
 * Root Layout Navigation Component
 * 
 * Handles the one-time onboarding flow:
 * 1. Waits for onboarding state to hydrate from AsyncStorage
 * 2. On first launch: hasCompletedOnboarding = false → shows onboarding
 * 3. After onboarding completion: hasCompletedOnboarding = true → shows main app
 * 4. On subsequent launches: hasCompletedOnboarding = true → skips onboarding
 */
function RootLayoutNav() {
  const { hasCompletedOnboarding, _hasHydrated, setHasHydrated } = useOnboardingStore();
  const router = useRouter();
  const segments = useSegments();

  // Fallback hydration for web platform - force hydration if it doesn't complete in time
  useEffect(() => {
    if (_hasHydrated) return;

    // On web, hydration from localStorage should be near-instant
    // Use a short timeout to detect if hydration failed
    const hydrationTimeout = setTimeout(() => {
      console.log('[RootLayout] Forcing hydration fallback');
      setHasHydrated(true);
    }, 500); // Reduced from 2000ms for faster web loading

    return () => clearTimeout(hydrationTimeout);
  }, [_hasHydrated, setHasHydrated]);

  useEffect(() => {
    // Wait for the onboarding state to load from AsyncStorage
    if (!_hasHydrated) {
      return;
    }

    // Navigation logic based on onboarding status
    const handleNavigation = () => {
      const inTabsGroup = segments[0] === '(tabs)';
      const inOnboardingGroup = segments[0] === 'onboarding';
      const inModal = segments[0] === 'modal';
      const inNotifications = segments[0] === 'notifications';

      // Development helper: Uncomment the next line to reset onboarding for testing
      // if (__DEV__) setHasCompletedOnboarding(false);

      // Don't navigate if in modal or notifications screen
      if (inModal || inNotifications) {
        SplashScreen.hideAsync();
        return;
      }

      // Navigate based on onboarding completion status
      if (hasCompletedOnboarding && !inTabsGroup) {
        router.replace('/(tabs)');
      } else if (!hasCompletedOnboarding && !inOnboardingGroup) {
        router.replace('/onboarding');
      }

      // Hide splash screen
      SplashScreen.hideAsync();
    };

    // Delay to ensure Stack is mounted
    const navigationTimeout = setTimeout(handleNavigation, 300);
    return () => clearTimeout(navigationTimeout);
  }, [_hasHydrated, hasCompletedOnboarding, segments, router]);

  // On web, render a simple loading state instead of null to allow React to mount and run effects
  // This is crucial because returning null prevents effects from running
  if (!_hasHydrated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade'
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
            headerShown: true
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
      </Stack>
    );
  }

  // Always render the full Stack navigator
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back during onboarding
          animation: 'fade'
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          title: 'Modal',
          headerShown: true
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: 'card',
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
