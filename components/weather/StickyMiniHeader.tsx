import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useWeatherStore } from '@/hooks/stores/use-weather-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Import BlurView
import React from 'react';
import { Platform, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

interface StickyMiniHeaderProps {
  scrollY: SharedValue<number>;
  city?: string;
  country?: string;
  temperature?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onCityPress?: () => void;
  onFavoritePress?: () => void;
  heroHeight?: number;
}

const HEADER_HEIGHT = 90; // Increased to account for status bar and spacing
const HERO_HEIGHT_DEFAULT = 200;

export const StickyMiniHeader: React.FC<StickyMiniHeaderProps> = ({
  scrollY,
  city,
  country,
  temperature,
  isRefreshing = false,
  onRefresh,
  onCityPress,
  onFavoritePress,
  heroHeight = HERO_HEIGHT_DEFAULT,
}) => {
  const colorScheme = useColorScheme();
  const { isFavorite } = useWeatherStore();
  const scaleValue = useSharedValue(1);
  const favoriteScaleValue = useSharedValue(1);

  // Calculate current city ID for favorite status
  const currentCityId = city && country ? `${city}-${country}` : '';
  const isCurrentlyFavorite = currentCityId ? isFavorite(currentCityId) : false;

  // Animated style for header visibility based on scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const shouldShow = scrollY.value > heroHeight - HEADER_HEIGHT;
    const opacity = interpolate(
      scrollY.value,
      [heroHeight - HEADER_HEIGHT - 20, heroHeight - HEADER_HEIGHT + 20],
      [0, 1],
      'clamp'
    );
    const translateY = interpolate(
      scrollY.value,
      [heroHeight - HEADER_HEIGHT - 20, heroHeight - HEADER_HEIGHT + 20],
      [-20, 0], // Slight slide down effect
      'clamp'
    );

    return {
      opacity: shouldShow ? opacity : 0,
      transform: [{ translateY: shouldShow ? translateY : -20 }],
      // Hide completely if not shown to avoid touch events interception when invisible
      zIndex: shouldShow ? 100 : -1
    };
  });

  // Refresh button animated style
  const refreshAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleValue.value },
      { rotate: isRefreshing ? '360deg' : '0deg' }
    ],
  }));

  // Favorite button animated style
  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScaleValue.value }],
  }));

  const handleRefreshPress = () => {
    scaleValue.value = withSpring(0.9, { duration: 150 }, () => {
      scaleValue.value = withSpring(1, { duration: 150 });
    });
    onRefresh?.();
  };

  const handleFavoritePress = () => {
    favoriteScaleValue.value = withSpring(0.8, { duration: 150 }, () => {
      favoriteScaleValue.value = withSpring(1, { duration: 150 });
    });
    onFavoritePress?.();
  };

  const handleCityPress = () => {
    onCityPress?.();
  };

  const HeaderContent = () => (
    <ThemedView style={[styles.content]}>
      {/* City info - tappable to open city switcher */}
      <Pressable
        onPress={handleCityPress}
        style={({ pressed }) => [
          styles.cityContainer,
          pressed && { opacity: 0.7 }
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open city switcher"
        accessibilityHint="Tap to change city or search for a new location"
      >
        <ThemedView style={styles.cityInfo}>
          <ThemedText style={styles.cityName} numberOfLines={1}>
            {city || 'Select City'}
          </ThemedText>
          <ThemedText style={styles.temperature}>
            {temperature !== undefined ? `${Math.round(temperature)}°` : '--°'}
          </ThemedText>
        </ThemedView>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color="white"
          style={styles.chevron}
        />
      </Pressable>

      {/* Action buttons */}
      <ThemedView style={styles.actions}>
        {/* Favorite toggle button */}
        <TouchableOpacity
          onPress={handleFavoritePress}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Animated.View style={favoriteAnimatedStyle}>
            <MaterialCommunityIcons
              name={isCurrentlyFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isCurrentlyFavorite ? '#f87171' : 'white'}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Refresh button */}
        <TouchableOpacity
          onPress={handleRefreshPress}
          style={styles.actionButton}
          disabled={isRefreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh weather data"
        >
          <Animated.View style={refreshAnimatedStyle}>
            <MaterialCommunityIcons
              name="refresh"
              size={24}
              color="white"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* City switcher button */}
        <TouchableOpacity
          onPress={handleCityPress}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Open city switcher"
        >
          <MaterialCommunityIcons
            name="map-search"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  // Detect blur capability safely for header
  const canUseBlur = Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 31);

  return (
    <Animated.View
      style={[
        styles.container,
        headerAnimatedStyle
      ]}
      accessibilityRole="header"
    >
      {canUseBlur ? (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <HeaderContent />
        </BlurView>
      ) : (
        <ThemedView style={[StyleSheet.absoluteFill, { backgroundColor: '#0f172a', opacity: 0.9 }]}>
          <HeaderContent />
        </ThemedView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 100,
    overflow: 'hidden',
    // Removed shadows/elevation here as they are handled differently on glass
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20, // Account for status bar
    backgroundColor: 'transparent', // Important for blur to work
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 8,
    minHeight: 44, // Minimum touch target
  },
  cityInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cityName: {
    fontSize: 16,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    lineHeight: 20,
    color: 'white',
  },
  temperature: {
    fontSize: 20,
    fontFamily: Fonts.rounded,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 2,
    color: '#e2e8f0',
  },
  chevron: {
    marginLeft: 4,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassy button bg
  },
});