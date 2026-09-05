import { ThemedView } from '@/components/themed-view';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export const LocationWeatherSkeleton: React.FC = () => {
  return (
    <ThemedView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeIn.duration(200)}>
        {/* Header - matching other skeleton headers */}
        <ThemedView style={styles.header}>
          <SkeletonLoader width={24} height={24} borderRadius={12} />
          <SkeletonLoader width={180} height={20} borderRadius={6} />
        </ThemedView>

        {/* Card - styled to match Explore screen skeletons */}
        <ThemedView style={styles.card}>
          {/* Top row: icon + location text + refresh */}
          <ThemedView style={styles.topRow}>
            <SkeletonLoader width={28} height={28} borderRadius={14} />
            <ThemedView style={{ flex: 1, gap: 6, backgroundColor: 'transparent' }}>
              <SkeletonLoader width={'60%'} height={18} borderRadius={6} />
              <SkeletonLoader width={'40%'} height={14} borderRadius={6} />
            </ThemedView>
            <SkeletonLoader width={32} height={32} borderRadius={8} />
          </ThemedView>

          {/* Temperature and condition */}
          <ThemedView style={styles.tempSection}>
            <SkeletonLoader width={80} height={36} borderRadius={8} />
            <SkeletonLoader width={'50%'} height={16} borderRadius={6} />
            <SkeletonLoader width={'70%'} height={14} borderRadius={6} />
          </ThemedView>

          {/* Timestamp */}
          <ThemedView style={styles.timestamp}>
            <SkeletonLoader width={120} height={12} borderRadius={6} />
          </ThemedView>
        </ThemedView>
      </Animated.View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  card: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 8,
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
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  tempSection: {
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  timestamp: {
    marginTop: 12,
    backgroundColor: 'transparent',
  },
});

export default LocationWeatherSkeleton;


