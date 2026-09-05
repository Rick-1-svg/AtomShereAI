import { SHIMMER_COLORS, TIMING } from '@/constants/animations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { AccessibilityInfo, DimensionValue, View, ViewStyle } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
  accessibilityLabel = 'Loading content'
}) => {
  const colorScheme = useColorScheme();
  const shimmerProgress = useSharedValue(0);
  const isReducedMotion = useSharedValue(false);

  useEffect(() => {
    // Check for reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      isReducedMotion.value = enabled;
      if (!enabled) {
        shimmerProgress.value = withRepeat(
          withTiming(1, { duration: TIMING.shimmer }),
          -1,
          false
        );
      }
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    if (isReducedMotion.value) {
      return {
        opacity: 0.6,
      };
    }

    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const colors = SHIMMER_COLORS[colorScheme ?? 'light'];
  const gradientColors = [colors.start, colors.middle, colors.end] as const;

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.start,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="none"
    >
      {children || (
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              width: '200%',
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default SkeletonLoader;
