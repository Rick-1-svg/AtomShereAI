import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProgressiveImage } from '@/components/ui/ProgressiveImage';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  View
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface RadarViewProps {
  loading?: boolean;
  radarImage?: string; // URL for the radar image
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const RadarView: React.FC<RadarViewProps> = ({
  loading = false,
  radarImage,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Loading radar data...</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>Weather Radar</ThemedText>
          <ThemedText style={styles.subtitleText}>
            Live precipitation tracking
          </ThemedText>
        </View>

        {/* Radar Display */}
        <View style={styles.radarContainer}>
          {radarImage ? (
            <ProgressiveImage
              source={radarImage}
              style={styles.radarImage}
              contentFit="cover"
              placeholder={{ blurhash: 'L5H2EC=PM+yV0g-mq.wG9c0100tR' }} // Optional blurhash
            />
          ) : (
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ['rgba(45, 45, 45, 0.8)', 'rgba(25, 25, 25, 0.9)']
                  : ['rgba(240, 240, 240, 0.8)', 'rgba(220, 220, 220, 0.9)']
              }
              style={styles.radarGradient}
            >
              {/* Radar circles */}
              <View style={styles.radarCircles}>
                {[1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.radarCircle,
                      {
                        width: index * 60,
                        height: index * 60,
                        borderColor: colorScheme === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.2)',
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Radar lines */}
              <View style={styles.radarLines}>
                <View
                  style={[
                    styles.radarLine,
                    styles.horizontalLine,
                    {
                      backgroundColor: colorScheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'rgba(0, 0, 0, 0.15)',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.radarLine,
                    styles.verticalLine,
                    {
                      backgroundColor: colorScheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'rgba(0, 0, 0, 0.15)',
                    },
                  ]}
                />
              </View>

              {/* Center dot */}
              <View
                style={[
                  styles.centerDot,
                  {
                    backgroundColor: colorScheme === 'dark'
                      ? '#4CAF50'
                      : '#2E7D32',
                  },
                ]}
              />

              {/* Placeholder text */}
              <View style={styles.placeholderTextContainer}>
                <ThemedText style={styles.placeholderTitle}>
                  🌧️ Radar View Coming Soon
                </ThemedText>
                <ThemedText style={styles.placeholderDescription}>
                  Interactive weather radar with live precipitation data will be available in a future update
                </ThemedText>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <ThemedText style={styles.featuresTitle}>Planned Features:</ThemedText>
          <View style={styles.featuresList}>
            {[
              '🌦️ Live precipitation tracking',
              '⚡ Storm movement visualization',
              '📍 Location-based radar overlay',
              '⏱️ Animated timeline controls',
              '🎯 Zoom and pan functionality',
            ].map((feature, index) => (
              <ThemedText key={index} style={styles.featureItem}>
                {feature}
              </ThemedText>
            ))}
          </View>
        </View>
      </Animated.View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts?.sans,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    opacity: 0.7,
    fontFamily: Fonts?.sans,
  },
  radarContainer: {
    margin: 16,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  radarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarCircles: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 1000,
  },
  radarLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarLine: {
    position: 'absolute',
  },
  horizontalLine: {
    width: '100%',
    height: 1,
  },
  verticalLine: {
    height: '100%',
    width: 1,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  placeholderTextContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 80,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Fonts?.sans,
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts?.sans,
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    paddingLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  radarImage: {
    width: '100%',
    height: '100%',
  },
});

export default RadarView;