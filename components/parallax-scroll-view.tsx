import type { PropsWithChildren, ReactElement } from 'react';
import { Dimensions, Platform, RefreshControl, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 250;
const SCROLL_THRESHOLD = 100; // Threshold for scroll effects

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  contentBackgroundColor?: { dark: string; light: string };
  headerOverlayColor?: { dark: string; light: string };
  externalScrollY?: SharedValue<number>;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  contentBackgroundColor,
  headerOverlayColor,
  externalScrollY,
  refreshing = false,
  onRefresh,
}: Props) {
  // Allow transparent background if contentBackgroundColor is not provided or explicitly set to transparent
  // We prefer transparent default to let the gradient show through
  const backgroundColor = contentBackgroundColor ? useThemeColor(contentBackgroundColor, 'background') : 'transparent';
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const scrollY = useSharedValue(0);

  // Enhanced scroll handler for more responsive animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // Sync with external scrollY if provided
      if (externalScrollY) {
        externalScrollY.value = event.contentOffset.y;
      }
    },
  });

  // Enhanced header animation with improved parallax effect
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT / 2],
      [2, 1, 0.85],
      Extrapolation.CLAMP
    );

    // Add subtle rotation for more dynamic effect (using radians instead of degrees)
    const rotateZ = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [-0.035, 0, 0.017], // Converted from degrees to radians (-2deg, 0deg, 1deg)
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY: translateY },
        { scale: scale },
        { rotateZ: `${rotateZ}rad` }, // Properly formatted rotation with unit
      ],
    };
  });

  // Overlay opacity animation for depth effect
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2],
      [0, 0.3],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      backgroundColor: headerOverlayColor
        ? headerOverlayColor[colorScheme]
        : (colorScheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'),
    };
  });

  // Content container animation for smooth transition
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [25, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [0, -10],
      Extrapolation.CLAMP
    );

    return {
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      transform: [{ translateY: translateY }],
    };
  });

  // On web, use a simpler scroll view without complex animations that may not work correctly
  if (Platform.OS === 'web') {
    return (
      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fbbf24"
              colors={['#fbbf24', '#38bdf8']}
            />
          ) : undefined
        }
      >
        {/* Simplified and smaller header for web */}
        <Animated.View
          style={[
            styles.webHeader,
            { backgroundColor: headerBackgroundColor[colorScheme] },
          ]}>
          {headerImage}
        </Animated.View>

        {/* Content without complex animations for web */}
        <ThemedView
          style={[
            styles.content,
            styles.webContent,
            { backgroundColor: contentBackgroundColor ? contentBackgroundColor[colorScheme] : 'transparent' }
          ]}
        >
          {children}
        </ThemedView>
      </Animated.ScrollView>
    );
  }


  // Native platforms - use full parallax animations
  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ flex: 1 }} // Removed backgroundColor here to allow transparency
      scrollEventThrottle={8} // More frequent updates for smoother animation
      onScroll={scrollHandler}
      bounces={true} // Enable bouncing for pull effect
      showsVerticalScrollIndicator={false} // Hide scrollbar for cleaner UI
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fbbf24"
            colors={['#fbbf24', '#38bdf8']}
            progressBackgroundColor="rgba(30, 30, 50, 0.9)"
          />
        ) : undefined
      }
    >
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}>
        {headerImage}
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
      </Animated.View>

      <Animated.View style={[contentAnimatedStyle]}>
        <ThemedView
          style={[
            styles.content,
            // Explicitly handle transparent background
            { backgroundColor: contentBackgroundColor ? contentBackgroundColor[colorScheme] : 'transparent' }
          ]}
        >
          {children}
        </ThemedView>
      </Animated.View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  webHeader: {
    // Smaller header for web to prevent content from being pushed too far down
    height: 120,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  webContent: {
    // Override for web to ensure content is visible
    overflow: 'visible',
    minHeight: 'auto',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16, // Reduced padding for web
  },
});
