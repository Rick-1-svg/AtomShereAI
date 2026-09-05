import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';
// Removed useColorScheme since we force dark theme aesthetics

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff', // White for active
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', // Muted white for inactive
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute', // Transparent background needs absolute position
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 85,
            paddingBottom: 25,
          },
          default: {
            backgroundColor: '#0f172a', // Fallback for Android/Web (deep blue/black)
            borderTopWidth: 0,
            height: 65,
            paddingBottom: 10,
          }
        }),
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={{ flex: 1 }} />
          ) : undefined
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
