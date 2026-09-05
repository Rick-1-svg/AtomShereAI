import { ThemedView } from '@/components/themed-view';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export const HeroSkeleton: React.FC = () => {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ width: '100%' }}>
      {/* Hero Card Panel */}
      <ThemedView style={styles.heroPanel}>
        <ThemedView style={styles.container}>
          {/* Compact hero row: icon + temp/condition */}
          <ThemedView style={styles.heroRow}>
            <SkeletonLoader width={48} height={48} borderRadius={24} />
            <ThemedView style={styles.heroTextCol}>
              <SkeletonLoader width={80} height={48} borderRadius={8} />
              <SkeletonLoader width={100} height={16} borderRadius={4} />
            </ThemedView>
          </ThemedView>

          {/* Chips row skeleton */}
          <ThemedView style={styles.chipsRow}>
            <ThemedView style={styles.chip}>
              <SkeletonLoader width={16} height={16} borderRadius={8} />
              <SkeletonLoader width={40} height={12} borderRadius={4} />
            </ThemedView>
            <ThemedView style={styles.chip}>
              <SkeletonLoader width={16} height={16} borderRadius={8} />
              <SkeletonLoader width={70} height={12} borderRadius={4} />
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Metrics 2x3 Grid Skeleton */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <SkeletonLoader width={22} height={22} borderRadius={11} />
            <SkeletonLoader width={50} height={10} borderRadius={3} />
            <SkeletonLoader width={60} height={18} borderRadius={4} />
          </View>
          <View style={styles.metricCard}>
            <SkeletonLoader width={22} height={22} borderRadius={11} />
            <SkeletonLoader width={50} height={10} borderRadius={3} />
            <SkeletonLoader width={40} height={18} borderRadius={4} />
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <SkeletonLoader width={22} height={22} borderRadius={11} />
            <SkeletonLoader width={50} height={10} borderRadius={3} />
            <SkeletonLoader width={70} height={18} borderRadius={4} />
          </View>
          <View style={styles.metricCard}>
            <SkeletonLoader width={22} height={22} borderRadius={11} />
            <SkeletonLoader width={55} height={10} borderRadius={3} />
            <SkeletonLoader width={50} height={18} borderRadius={4} />
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <SkeletonLoader width={22} height={22} borderRadius={11} />
            <SkeletonLoader width={45} height={10} borderRadius={3} />
            <SkeletonLoader width={55} height={18} borderRadius={4} />
          </View>
          <View style={styles.metricCard}>
            <SkeletonLoader width={22} height={22} borderRadius={11} />
            <SkeletonLoader width={40} height={10} borderRadius={3} />
            <SkeletonLoader width={55} height={18} borderRadius={4} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  heroTextCol: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'transparent',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    ...Platform.select({
      ios: { backgroundColor: 'rgba(255,255,255,0.18)' },
      android: { backgroundColor: 'rgba(255,255,255,0.12)' },
      web: { backgroundColor: 'rgba(255,255,255,0.18)' },
    }),
  },
  metricsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
      web: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    }),
  },
});
