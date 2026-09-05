import { ThemedView } from '@/components/themed-view';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export const AISummarySkeleton: React.FC = () => {
  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(300)}
      style={[styles.cardElevated, { padding: 16, marginTop: 6 }]}
    >
      <ThemedView style={styles.container}>
        {/* Header with AI icon and title */}
        <ThemedView style={styles.header}>
          <SkeletonLoader width={20} height={20} borderRadius={10} />
          <SkeletonLoader width={120} height={18} borderRadius={6} />
        </ThemedView>

        {/* Content lines with varying lengths */}
        <ThemedView style={styles.content}>
          <SkeletonLoader width="95%" height={16} borderRadius={6} style={styles.line} />
          <SkeletonLoader width="88%" height={16} borderRadius={6} style={styles.line} />
          <SkeletonLoader width="92%" height={16} borderRadius={6} style={styles.line} />
          <SkeletonLoader width="75%" height={16} borderRadius={6} style={styles.line} />
          <SkeletonLoader width="85%" height={16} borderRadius={6} style={styles.line} />
          <SkeletonLoader width="60%" height={16} borderRadius={6} style={styles.line} />
        </ThemedView>
      </ThemedView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
  container: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  content: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  line: {
    marginVertical: 2,
  },
});
