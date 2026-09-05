import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { useWeatherStore } from '@/hooks/stores/use-weather-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebounceSearch } from '@/hooks/use-debounced-search';
import { useNearbyCities } from '@/hooks/use-nearby-cities';
import { getCurrentWeather } from '@/services/api';
import { NearbyCity } from '@/services/nearbyService';
import { City, WeatherData } from '@/types/weather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface CityBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (city: City) => void;
  initialTab?: TabType;
}

type TabType = 'favorites' | 'nearby' | 'search';

const SNAP_POINTS = {
  peek: SCREEN_HEIGHT * 0.25,
  work: SCREEN_HEIGHT * 0.65,
  full: SCREEN_HEIGHT * 0.9,
};

// Helper to map API icon codes to MaterialCommunityIcons
const getWeatherIconName = (code: string): any => {
  const map: Record<string, string> = {
    '01d': 'weather-sunny',
    '01n': 'weather-night',
    '02d': 'weather-partly-cloudy',
    '02n': 'weather-night-partly-cloudy',
    '03d': 'weather-cloudy',
    '03n': 'weather-cloudy',
    '04d': 'weather-cloudy',
    '04n': 'weather-cloudy',
    '09d': 'weather-pouring',
    '09n': 'weather-pouring',
    '10d': 'weather-rainy',
    '10n': 'weather-rainy',
    '11d': 'weather-lightning',
    '11n': 'weather-lightning',
    '13d': 'weather-snowy',
    '13n': 'weather-snowy',
    '50d': 'weather-fog',
    '50n': 'weather-fog',
  };
  return map[code] || 'weather-cloudy';
};

// Mini Weather Preview Component
const WeatherPreview: React.FC<{ lat: number; lon: number; colorScheme: 'light' | 'dark' }> = React.memo(({ lat, lon, colorScheme }) => {
  const [weather, setWeather] = useState<WeatherData['current'] | null>(null);
  const [loading, setLoading] = useState(true);
  const colors = Colors[colorScheme];

  useEffect(() => {
    let mounted = true;
    const fetchWeather = async () => {
      try {
        const data = await getCurrentWeather(lat, lon);
        if (mounted && data) {
          setWeather(data.current);
        }
      } catch (e) {
        // Silent fail for preview
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchWeather();
    return () => { mounted = false; };
  }, [lat, lon]);

  if (loading) {
    return (
      <View style={{ width: 40, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.textMuted} />
      </View>
    );
  }

  if (!weather) return null;

  return (
    <Animated.View entering={FadeIn} style={styles.weatherPreview}>
      <MaterialCommunityIcons
        name={getWeatherIconName(weather.icon)}
        size={24}
        color={colors.tint}
      />
      <ThemedText style={[styles.previewTemp, { color: colors.text }]}>
        {Math.round(weather.temp)}°
      </ThemedText>
    </Animated.View>
  );
});

// Skeleton loading component for city items
const CityItemSkeleton: React.FC<{ colorScheme: 'light' | 'dark' }> = ({ colorScheme }) => {
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    shimmerOpacity.value = withTiming(0.7, { duration: 800 }, () => {
      shimmerOpacity.value = withTiming(0.3, { duration: 800 });
    });
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const bgColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonTitle, shimmerStyle, { backgroundColor: bgColor }]} />
        <Animated.View style={[styles.skeletonSubtitle, shimmerStyle, { backgroundColor: bgColor }]} />
      </View>
      <Animated.View style={[styles.skeletonHeart, shimmerStyle, { backgroundColor: bgColor }]} />
    </View>
  );
};

export const CityBottomSheet: React.FC<CityBottomSheetProps> = ({
  visible,
  onClose,
  onSelectCity,
  initialTab = 'favorites',
}) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const bottomSheetColors = colors.bottomSheet;

  const {
    favoriteCities,
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useWeatherStore();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [showFilters, setShowFilters] = useState(false);

  // Search hook
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    setSearchQuery,
    clearSearch,
  } = useDebounceSearch(300);

  // Nearby cities hook
  const {
    hasLocationPermission,
    isRequestingLocation,
    locationError,
    nearbyCities,
    isLoadingCities,
    citiesError,
    requestLocationPermission,
    refreshNearbyCities,
    startNearbySearch,
    isLoading: isNearbyLoading,
  } = useNearbyCities();

  // Group search results by country
  const groupedResults = useMemo(() => {
    if (searchResults.length === 0) return [];

    const groups = searchResults.reduce((acc, city) => {
      const country = city.country || 'Other';
      if (!acc[country]) acc[country] = [];
      acc[country].push(city);
      return acc;
    }, {} as Record<string, City[]>);

    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([title, data]) => ({ title, data }));
  }, [searchResults]);

  // Track previous visibility to detect open transitions
  const wasVisibleRef = useRef(false);

  // Reset to initialTab ONLY when switching from hidden -> visible
  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setActiveTab(initialTab);
      // Trigger nearby search if opening to nearby tab
      if (initialTab === 'nearby') {
        startNearbySearch();
      }
    }
    wasVisibleRef.current = visible;
  }, [visible, initialTab, startNearbySearch]);

  // Handle tab change with nearby search trigger
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'nearby') {
      // Trigger location/nearby search when switching to Nearby tab
      startNearbySearch();
    }
  }, [startNearbySearch]);

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Handle modal visibility with improved animations
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(SCREEN_HEIGHT - SNAP_POINTS.work, {
        damping: 25,
        stiffness: 120,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(0.6, { duration: 350 });
      contentOpacity.value = withTiming(1, { duration: 400 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
      backdropOpacity.value = withTiming(0, { duration: 280 });
      contentOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Gesture handler - snap to a specific point
  const snapToPoint = (targetPoint: number) => {
    'worklet';
    translateY.value = withSpring(targetPoint, {
      damping: 25,
      stiffness: 120,
      mass: 0.8,
    });
  };

  // Close sheet handler (runs on JS thread)
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      const newY = SCREEN_HEIGHT - SNAP_POINTS.work + event.translationY;
      // Limit drag range
      translateY.value = Math.max(
        SCREEN_HEIGHT - SNAP_POINTS.full - 50, // Allow slight overdrag up
        Math.min(SCREEN_HEIGHT, newY)
      );
    })
    .onEnd((event) => {
      'worklet';
      // Logic for snapping based on velocity and position
      if (event.velocityY < -500 || translateY.value < SCREEN_HEIGHT - SNAP_POINTS.work - 100) {
        // Swipe up fast or drag up past threshold -> expand to full
        snapToPoint(SCREEN_HEIGHT - SNAP_POINTS.full);
      } else if (event.velocityY > 500 || translateY.value > SCREEN_HEIGHT - SNAP_POINTS.work + 100) {
        // Swipe down fast or drag down past threshold -> close
        runOnJS(handleClose)();
      } else {
        // Return to default "work" state
        snapToPoint(SCREEN_HEIGHT - SNAP_POINTS.work);
      }
    });

  const handleCitySelect = useCallback((city: City) => {
    onSelectCity(city);
    onClose();
  }, [onSelectCity, onClose]);

  const handleFavoriteToggle = useCallback((city: City) => {
    if (isFavorite(city.id)) {
      removeFavorite(city.id);
    } else {
      addFavorite(city);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  // Render city item with improved design
  const renderCityItem = useCallback(({ item: city, index }: { item: City | NearbyCity; index: number }) => {
    const isNearby = 'distance' in city;

    return (
      <Animated.View
        entering={FadeIn.delay(Math.min(index * 50, 300)).duration(300)}
        layout={LinearTransition.springify()}
      >
        <TouchableOpacity
          onPress={() => handleCitySelect(city)}
          style={[
            styles.cityItem,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
              borderColor: bottomSheetColors.border,
            }
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Select ${city.name}, ${city.country}`}
          activeOpacity={0.7}
        >
          <View style={styles.cityInfo}>
            <View style={styles.cityTextContainer}>
              <ThemedText
                style={[
                  styles.cityName,
                  { color: colors.text }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {city.name}
              </ThemedText>
              <View style={styles.citySubtitleRow}>
                <ThemedText
                  style={[
                    styles.cityCountry,
                    { color: colors.textMuted }
                  ]}
                  numberOfLines={1}
                >
                  {city.state ? `${city.state}, ${city.country}` : city.country}
                </ThemedText>
                {isNearby && (
                  <View style={[styles.distanceBadge, { backgroundColor: colors.tint + '20' }]}>
                    <MaterialCommunityIcons
                      name="map-marker-distance"
                      size={12}
                      color={colors.tint}
                    />
                    <ThemedText style={[styles.distanceText, { color: colors.tint }]}>
                      {(city as NearbyCity).distanceText}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.cityRightAction}>
            {/* Weather Preview */}
            <WeatherPreview lat={city.lat} lon={city.lon} colorScheme={colorScheme} />

            <TouchableOpacity
              onPress={() => handleFavoriteToggle(city)}
              style={styles.favoriteButton}
              accessibilityRole="button"
              accessibilityLabel={isFavorite(city.id) ? "Remove from favorites" : "Add to favorites"}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={isFavorite(city.id) ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite(city.id) ? colors.error : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleCitySelect, handleFavoriteToggle, isFavorite, colorScheme, colors, bottomSheetColors]);

  // Render skeleton loading
  const renderSkeletonLoading = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <CityItemSkeleton key={i} colorScheme={colorScheme} />
      ))}
    </View>
  );

  // Empty state component with improved visibility
  const EmptyState: React.FC<{
    icon: string;
    title: string;
    subtitle: string;
    actionButton?: React.ReactNode;
  }> = ({ icon, title, subtitle, actionButton }) => (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.emptyState}
    >
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '15' }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={48}
          color={colors.tint}
        />
      </View>
      <ThemedText style={[styles.emptyText, { color: colors.text }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: colors.textMuted }]}>
        {subtitle}
      </ThemedText>
      {actionButton}
    </Animated.View>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'favorites':
        if (favoriteCities.length === 0) {
          return (
            <EmptyState
              icon="heart-outline"
              title="No favorite cities yet"
              subtitle="Add cities to favorites by tapping the heart icon when viewing weather"
            />
          );
        }

        return (
          <FlatList
            data={favoriteCities}
            renderItem={renderCityItem}
            keyExtractor={(city) => city.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={true}
            overScrollMode="always"
          />
        );

      case 'nearby':
        // Loading state
        if (isNearbyLoading) {
          return (
            <View style={styles.loadingContainer}>
              {renderSkeletonLoading()}
              <View style={styles.loadingTextContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
                <ThemedText style={[styles.loadingText, { color: colors.textMuted }]}>
                  {isRequestingLocation ? 'Getting your location...' : 'Finding nearby cities...'}
                </ThemedText>
              </View>
            </View>
          );
        }

        // Permission not granted
        if (!hasLocationPermission) {
          return (
            <EmptyState
              icon="map-marker-radius"
              title="Location access needed"
              subtitle="Allow location access to discover cities near you"
              actionButton={
                <TouchableOpacity
                  onPress={requestLocationPermission}
                  style={[styles.actionButton, { backgroundColor: colors.tint }]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>
                    Grant Permission
                  </ThemedText>
                </TouchableOpacity>
              }
            />
          );
        }

        // Error state
        if (locationError || citiesError) {
          return (
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load nearby cities"
              subtitle={locationError || citiesError || 'Please try again'}
              actionButton={
                <TouchableOpacity
                  onPress={refreshNearbyCities}
                  style={[styles.actionButton, { backgroundColor: colors.tint }]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>
                    Try Again
                  </ThemedText>
                </TouchableOpacity>
              }
            />
          );
        }

        // No nearby cities found
        if (nearbyCities.length === 0) {
          return (
            <EmptyState
              icon="map-marker-question"
              title="No nearby cities found"
              subtitle="Try refreshing or check your location settings"
              actionButton={
                <TouchableOpacity
                  onPress={refreshNearbyCities}
                  style={[styles.actionButton, { backgroundColor: colors.tint }]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>
                    Refresh
                  </ThemedText>
                </TouchableOpacity>
              }
            />
          );
        }

        // Show nearby cities
        return (
          <View style={styles.nearbyContainer}>
            <View style={styles.nearbyHeader}>
              <ThemedText style={[styles.nearbyTitle, { color: colors.textMuted }]}>
                Cities near you
              </ThemedText>
              <TouchableOpacity
                onPress={refreshNearbyCities}
                disabled={isNearbyLoading}
                style={[styles.refreshButton, isNearbyLoading && { opacity: 0.5 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isNearbyLoading ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <MaterialCommunityIcons
                    name="refresh"
                    size={20}
                    color={colors.tint}
                  />
                )}
              </TouchableOpacity>
            </View>
            <FlatList
              data={nearbyCities}
              renderItem={renderCityItem}
              keyExtractor={(city) => city.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              overScrollMode="always"
            />
          </View>
        );

      case 'search':
        return (
          <View style={styles.searchContent}>
            {searchError && (
              <Animated.View
                entering={FadeIn}
                style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}
              >
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {searchError}
                </ThemedText>
              </Animated.View>
            )}

            {isSearching && (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
                <ThemedText style={[styles.loadingText, { color: colors.textMuted }]}>
                  Searching...
                </ThemedText>
              </View>
            )}

            {groupedResults.length > 0 ? (
              <SectionList
                sections={groupedResults}
                renderItem={renderCityItem}
                renderSectionHeader={({ section: { title } }) => (
                  <View style={[styles.sectionHeader, { backgroundColor: bottomSheetColors.background }]}>
                    <ThemedText style={[styles.sectionHeaderText, { color: colors.tint }]}>
                      {title}
                    </ThemedText>
                  </View>
                )}
                keyExtractor={(city) => city.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={true}
                overScrollMode="always"
                stickySectionHeadersEnabled={true}
              />
            ) : !isSearching && searchQuery.length > 0 ? (
              <EmptyState
                icon="magnify-close"
                title="No cities found"
                subtitle={`No results for "${searchQuery}". Try a different search term.`}
              />
            ) : (
              <EmptyState
                icon="magnify"
                title="Search for cities"
                subtitle="Enter a city name above to find weather information"
              />
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 20}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
          <Animated.View
            style={[
              styles.sheetContent,
              contentAnimatedStyle,
              { backgroundColor: bottomSheetColors.background }
            ]}
          >
            {/* Handle with Gesture Detector */}
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: bottomSheetColors.handle }]} />
              </View>
            </GestureDetector>

            {/* Header with search */}
            <View style={styles.header}>
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Cities
              </ThemedText>

              <View style={[
                styles.searchContainer,
                {
                  backgroundColor: bottomSheetColors.surface,
                  borderColor: bottomSheetColors.border
                }
              ]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={22}
                  color={colors.textMuted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: colors.text }
                  ]}
                  placeholder="Search cities..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setActiveTab('search')}
                  accessibilityLabel="Search for cities"
                  accessibilityHint="Enter city name to search"
                  autoCorrect={false}
                  autoCapitalize="words"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={clearSearch}
                    style={styles.clearButton}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              {(['favorites', 'nearby', 'search'] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => handleTabChange(tab)}
                    style={[
                      styles.tab,
                      isActive && { backgroundColor: colors.tint + '20' }
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.tabText,
                        { color: isActive ? colors.tint : colors.textMuted },
                        isActive && styles.tabTextActive
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Content */}
            <View style={styles.content}>
              {renderTabContent()}
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: bottomSheetColors.border }]}>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={[styles.filtersButton, { backgroundColor: bottomSheetColors.surface }]}
                accessibilityRole="button"
                accessibilityLabel="Toggle filters"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="tune"
                  size={20}
                  color={colors.textMuted}
                />
                <ThemedText style={[styles.filtersText, { color: colors.text }]}>
                  Filters
                </ThemedText>
                <MaterialCommunityIcons
                  name={showFilters ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
  },
  sheetContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    //minHeight: 600,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0px -6px 20px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.rounded,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: Fonts.sans,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '600',
  },
  weatherPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 40,
  },
  previewTemp: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 4,
    gap: 8,
    flexGrow: 1,
  },
  cityItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityInfo: {
    flex: 1,
    marginRight: 10,
  },
  cityTextContainer: {
    flex: 1,
  },
  cityName: {
    fontSize: 17,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    marginBottom: 4,
  },
  citySubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cityCountry: {
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  cityRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
    gap: 12,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 22,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  searchContent: {
    flex: 1,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: Fonts.sans,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    flex: 1,
  },
  nearbyContainer: {
    flex: 1,
    minHeight: 200,
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  nearbyTitle: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  filtersText: {
    fontSize: 16,
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  // Skeleton styles
  skeletonContainer: {
    paddingTop: 8,
    gap: 8,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    height: 18,
    width: '60%',
    borderRadius: 9,
  },
  skeletonSubtitle: {
    height: 14,
    width: '40%',
    borderRadius: 7,
  },
  skeletonHeart: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});