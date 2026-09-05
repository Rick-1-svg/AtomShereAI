import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { TIMING } from '@/constants/animations';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export const ForecastSkeleton: React.FC = () => {
  const colorScheme = useColorScheme();

  const renderForecastItem = (index: number) => (
    <Animated.View
      key={index}
      entering={FadeInUp.duration(250).delay(150 + index * TIMING.stagger)}
      style={[
        styles.forecastItem,
        { borderBottomColor: Colors[colorScheme ?? 'light'].text },
        index === 4 && { borderBottomWidth: 0 },
      ]}
    >
      {/* Day name skeleton */}
      <SkeletonLoader width="30%" height={16} borderRadius={6} />

      {/* Right side with icon and temperature */}
      <ThemedView style={styles.forecastItemDetails}>
        <SkeletonLoader width={22} height={22} borderRadius={11} />
        <SkeletonLoader width={50} height={18} borderRadius={6} />
        <SkeletonLoader width={30} height={14} borderRadius={4} />
      </ThemedView>
    </Animated.View>
  );

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(200)}
      style={[styles.forecastContainer, styles.cardElevated]}
    >
      <ThemedText
        type="subtitle"
        style={{
          fontFamily: Fonts.sans,
          fontSize: 20,
          fontWeight: '600',
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
        5-Day Forecast
      </ThemedText>

      {Array.from({ length: 5 }, (_, index) => renderForecastItem(index))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  forecastContainer: {
    marginTop: 14,
    marginBottom: 10,
    padding: 24,
    borderRadius: 20,
    gap: 0,
  },
  cardElevated: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        elevation: 4,
      },
      web: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
      }
    }),
  },
  forecastItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
});
