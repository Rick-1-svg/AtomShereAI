import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ProgressiveImage } from '@/components/ui/ProgressiveImage';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { AISummary } from '@/components/weather/AISummary';
import { CityBottomSheet } from '@/components/weather/CityBottomSheet';
import { ForecastContainer } from '@/components/weather/ForecastContainer';
import MetricsGrid from '@/components/weather/MetricsGrid';
import { AISummarySkeleton } from '@/components/weather/skeletons/AISummarySkeleton';
import { ForecastSkeleton } from '@/components/weather/skeletons/ForecastSkeleton';
import { HeroSkeleton } from '@/components/weather/skeletons/HeroSkeleton';
import { StickyMiniHeader } from '@/components/weather/StickyMiniHeader';
import WeatherIcon from '@/components/weather/WeatherIcon';
import { Colors, Fonts } from '@/constants/theme';
import { useWeatherStore } from '@/hooks/stores/use-weather-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useWeatherTheme } from '@/hooks/use-weather-theme';
import { cacheAllWeatherData, getAllCachedData } from '@/services/cacheService';
import { transformToExtendedForecast } from '@/utils/transformWeatherData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { fetchAllWeatherData, getStructuredAIInsights } from '../../services/api';
import { evaluateAllRules, updateScheduledSummaries } from '../../services/notificationService';
import { AIWeatherInsight } from '../../types/aiSummary';
import { City, ForecastData, ForecastItem, WeatherData } from '../../types/weather';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to map weather conditions to icon names
const getWeatherIconName = (description: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const lowerCaseDescription = description.toLowerCase();
  if (lowerCaseDescription.includes('clear')) return 'weather-sunny';
  if (lowerCaseDescription.includes('cloud')) return 'weather-cloudy';
  if (lowerCaseDescription.includes('rain')) return 'weather-rainy';
  if (lowerCaseDescription.includes('drizzle')) return 'weather-hail';
  if (lowerCaseDescription.includes('thunderstorm')) return 'weather-lightning';
  if (lowerCaseDescription.includes('snow')) return 'weather-snowy';
  if (lowerCaseDescription.includes('mist') || lowerCaseDescription.includes('fog')) return 'weather-fog';
  return 'weather-partly-cloudy'; // Default icon
};

// Map weather conditions to Meteocons for the hero area
const getHeroIcon = (description: string): string => {
  const lowerCaseDescription = description.toLowerCase();
  if (lowerCaseDescription.includes('clear') || lowerCaseDescription.includes('sun')) return 'meteocons:clear-day-fill';
  if (lowerCaseDescription.includes('partly')) return 'meteocons:partly-cloudy-day-fill';
  if (lowerCaseDescription.includes('cloud')) return 'meteocons:cloudy-fill';
  if (lowerCaseDescription.includes('rain')) return 'meteocons:rain-fill';
  if (lowerCaseDescription.includes('drizzle')) return 'meteocons:drizzle-fill';
  if (lowerCaseDescription.includes('thunder')) return 'meteocons:thunderstorms-fill';
  if (lowerCaseDescription.includes('snow')) return 'meteocons:snow-fill';
  if (lowerCaseDescription.includes('mist') || lowerCaseDescription.includes('fog')) return 'meteocons:mist-fill';
  return 'meteocons:partly-cloudy-day-fill';
};

export default function TabTwoScreen() {
  const { lat, lon, cityName, country } = useLocalSearchParams();
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Detect blur capability
  const canUseBlur = Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 31);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIWeatherInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aqi, setAqi] = useState<number | null>(null);
  const [precip12h, setPrecip12h] = useState<number | null>(null);
  const [aqiModalVisible, setAqiModalVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetInitialTab, setBottomSheetInitialTab] = useState<'favorites' | 'nearby' | 'search'>('favorites');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [aiSectionVisible, setAiSectionVisible] = useState(false);
  const colorScheme = useColorScheme();

  // Network status for offline mode
  const { isOffline, wasOffline, clearWasOffline } = useNetworkStatus();

  // Weather store for favorites
  const { addFavorite, removeFavorite, isFavorite, setSelectedCity } = useWeatherStore();

  // Scroll tracking for sticky header
  const scrollY = useSharedValue(0);

  const fetchWeatherData = useCallback(async (forceRefresh = false) => {
    if (lat && lon) {
      const cityId = `${lat}-${lon}`;
      setError(null);

      // STEP 1: Check cache first for instant UI (stale-while-revalidate)
      const cached = await getAllCachedData(cityId);

      // Show cached data immediately if available
      if (cached.weather) {
        setWeatherData(cached.weather);
        setLastUpdated(cached.timestamp ? new Date(cached.timestamp) : null);
      }
      if (cached.forecast) {
        setForecastData(cached.forecast);
        // Derive precip chance from cached forecast
        derivePrecip12h(cached.forecast);
      }
      if (cached.aqi !== null) {
        setAqi(cached.aqi);
      }

      // If cache is fresh and not forcing refresh, we're done
      if (cached.status === 'fresh' && !forceRefresh) {
        console.log('📦 Cache: Using fresh cached data, skipping network request');
        setLoading(false);
        return;
      }

      // If offline and we have cached data, use it
      if (isOffline && cached.weather) {
        console.log('📦 Cache: Offline mode, using cached data');
        setLoading(false);
        return;
      }

      // STEP 2: Fetch fresh data (in background if we showed cached data)
      const shouldShowLoading = !cached.weather;
      if (shouldShowLoading) {
        setLoading(true);
      } else {
        console.log('🔄 Cache: Background refresh triggered (stale-while-revalidate)');
      }

      try {
        // Batch API calls for better performance
        const { weather: current, forecast, aqi: aqiValue } = await fetchAllWeatherData(Number(lat), Number(lon));

        // Update UI with fresh data
        setWeatherData(current);
        setForecastData(forecast);
        setAqi(aqiValue);
        setLastUpdated(new Date());

        // Cache all the fetched data
        await cacheAllWeatherData(cityId, current, forecast, aqiValue);

        // Derive precip chance for next 12h
        if (forecast) {
          derivePrecip12h(forecast);
        }

        // Evaluate notification rules against fresh weather data
        if (current && forecast) {
          try {
            await evaluateAllRules({ weather: current, forecast, aqi: aqiValue });
            await updateScheduledSummaries(current, forecast);
          } catch (notifError) {
            console.log('🔔 Notification evaluation error:', notifError);
          }
        }

      } catch (err) {
        // If network fails but we already showed cached data, just log the error
        if (cached.weather) {
          console.log('📦 Cache: Network failed, continuing with cached data');
        } else {
          // Try to load cached data on error (fallback)
          const fallback = await getAllCachedData(cityId);
          if (fallback.weather) {
            setWeatherData(fallback.weather);
            setLastUpdated(fallback.timestamp ? new Date(fallback.timestamp) : null);
          }
          if (fallback.forecast) {
            setForecastData(fallback.forecast);
          }
          if (!fallback.weather) {
            setError('Failed to fetch weather data.');
          }
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }, [lat, lon, isOffline]);

  // Helper function to derive precipitation chance for next 12 hours
  const derivePrecip12h = useCallback((forecast: ForecastData) => {
    try {
      if (forecast?.forecast?.length) {
        const nowMs = Date.now();
        const twelveHoursMs = 12 * 60 * 60 * 1000;
        const windowEnd = nowMs + twelveHoursMs;
        const pops: number[] = forecast.forecast
          .filter((f: ForecastItem) => {
            const t = new Date(f.timestamp).getTime();
            return t >= nowMs && t <= windowEnd;
          })
          .map((f: ForecastItem) => (typeof f.pop === 'number' ? f.pop : 0));
        if (pops.length) {
          const maxPop = Math.max(...pops);
          setPrecip12h(Math.round(maxPop * 100));
        } else {
          setPrecip12h(null);
        }
      } else {
        setPrecip12h(null);
      }
    } catch {
      setPrecip12h(null);
    }
  }, []);

  // Deferred AI summary fetching - only fetch when section becomes visible
  const fetchAISummary = useCallback(async () => {
    if (!lat || !lon || aiInsights || aiLoading) return;

    console.log('🤖 AI: Section visible, fetching structured insights...');
    setAiLoading(true);
    setAiError(null);

    try {
      const insights = await getStructuredAIInsights(
        Number(lat),
        Number(lon),
        'Provide insights suitable for a mobile weather app user.'
      );
      setAiInsights(insights);
    } catch (aiErr: any) {
      setAiError(aiErr.message || 'An unknown error occurred while generating AI insights.');
      console.error(aiErr);
    } finally {
      setAiLoading(false);
    }
  }, [lat, lon, aiInsights, aiLoading]);

  // Trigger AI summary fetch when section becomes visible
  useEffect(() => {
    if (aiSectionVisible && weatherData && !aiInsights && !aiLoading) {
      fetchAISummary();
    }
  }, [aiSectionVisible, weatherData, aiInsights, aiLoading, fetchAISummary]);

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // Refresh every 5 minutes (300000 ms)
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchWeatherData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchWeatherData]);

  // Update selected city in store when params change
  useEffect(() => {
    if (cityName && country && lat && lon) {
      const currentCity: City = {
        id: `${lat}-${lon}`,
        name: cityName as string,
        country: country as string,
        lat: Number(lat),
        lon: Number(lon),
      };
      setSelectedCity(currentCity);
    }
  }, [cityName, country, lat, lon, setSelectedCity]);

  // Handler for city selection from bottom sheet
  const handleCitySelect = useCallback((city: City) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: {
        lat: city.lat.toString(),
        lon: city.lon.toString(),
        cityName: city.name,
        country: city.country,
      },
    });
    setBottomSheetVisible(false);
  }, [router]);

  // Handler for favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    if (cityName && country && lat && lon) {
      const currentCity: City = {
        id: `${lat}-${lon}`,
        name: cityName as string,
        country: country as string,
        lat: Number(lat),
        lon: Number(lon),
      };

      if (isFavorite(currentCity.id)) {
        removeFavorite(currentCity.id);
      } else {
        addFavorite(currentCity);
      }
    }
  }, [cityName, country, lat, lon, isFavorite, addFavorite, removeFavorite]);

  // Handler for opening favorites section
  const openFavorites = useCallback(() => {
    setBottomSheetInitialTab('favorites');
    setBottomSheetVisible(true);
  }, []);

  // Handler for opening city search
  const openCitySearch = useCallback(() => {
    setBottomSheetInitialTab('favorites');
    setBottomSheetVisible(true);
  }, []);

  // Animation values
  const headerOpacity = useSharedValue(0);

  // Start animations when component mounts
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  // Dynamic weather-based theming
  const { gradientColors, themeId } = useWeatherTheme({
    weatherData,
  });

  // Memoize expensive transformation to avoid recomputation on every render
  const extendedForecast = useMemo(() => {
    if (!weatherData || !forecastData) return undefined;
    return transformToExtendedForecast(weatherData, forecastData);
  }, [weatherData, forecastData]);

  // Log theme changes for debugging (can be removed in production)
  useEffect(() => {
    if (themeId && themeId !== 'default-no-data') {
      console.log('[Explore] Weather theme applied:', themeId);
    }
  }, [themeId]);

  // Auto-refresh when coming back online
  useEffect(() => {
    if (wasOffline) {
      fetchWeatherData(true);
      clearWasOffline();
    }
  }, [wasOffline, fetchWeatherData, clearWasOffline]);

  return (
    <ScreenLayout useSafeArea={false} gradientColors={gradientColors}>
      {/* Offline Banner */}
      <OfflineBanner isOffline={isOffline} lastUpdated={lastUpdated} />
      {/* Sticky Mini Header */}
      <StickyMiniHeader
        scrollY={scrollY}
        city={cityName as string}
        country={country as string}
        temperature={weatherData?.current?.temp}
        isRefreshing={loading}
        onRefresh={fetchWeatherData}
        onCityPress={openCitySearch}
        onFavoritePress={openFavorites}
        heroHeight={200}
      />

      <ParallaxScrollView
        externalScrollY={scrollY}
        headerBackgroundColor={{
          light: 'transparent',
          dark: 'transparent'
        }}
        contentBackgroundColor={{ light: 'transparent', dark: 'transparent' }}
        headerOverlayColor={{ light: 'rgba(135,206,250,0.1)', dark: 'rgba(25,25,112,0.1)' }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        headerImage={
          <Animated.View style={[headerAnimatedStyle, styles.headerImageContainer]}>
            <ProgressiveImage
              source={require('@/assets/images/react-logo.png')}
              style={styles.headerImage}
              contentFit="contain"
              transition={1000}
            />
          </Animated.View>
        }>
        <Animated.View entering={FadeInDown.duration(600)}>
          <ThemedView style={styles.titleContainer} accessibilityRole="header">
            <ThemedText
              type="title"
              style={{
                fontFamily: Fonts.rounded,
                fontSize: 28,
                letterSpacing: -0.5,
                color: 'white',
              }}>
              {cityName ? `${cityName}, ${country}` : 'Explore'}
            </ThemedText>
            <ThemedView style={styles.headerActions}>
              <TouchableOpacity
                onPress={openCitySearch}
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
              <TouchableOpacity
                onPress={() => fetchWeatherData()}
                disabled={loading}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel="Refresh weather data"
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].text}
                />
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </Animated.View>

        {loading && (
          <>
            <HeroSkeleton />
            <ForecastSkeleton />
            {aiLoading && <AISummarySkeleton />}
          </>
        )}

        {error && (
          <Animated.View entering={FadeIn.duration(300)}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </Animated.View>
        )}

        {weatherData && cityName && country && (
          <Animated.View entering={FadeInUp.duration(800).delay(150)}>
            {/* Hero panel with big temperature */}
            {canUseBlur ? (
              <BlurView intensity={40} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={[styles.heroPanel, styles.heroBlur]}>
                <View style={styles.heroContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <WeatherIcon description={weatherData.current.description} size={48} />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <ThemedText style={styles.heroTemp}>{Math.round(weatherData.current.temp)}°</ThemedText>
                      <ThemedText type="default" style={styles.heroCondition}>{weatherData.current.description}</ThemedText>
                    </View>
                  </View>
                  {/* Compact chips row */}
                  <View style={styles.chipsRow}>
                    {typeof weatherData.current.uvi === 'number' && (
                      <View style={styles.chip}>
                        <WeatherIcon uvIndex={weatherData.current.uvi} size={16} />
                        <ThemedText style={styles.chipText}>UV {Math.round(weatherData.current.uvi)}</ThemedText>
                      </View>
                    )}
                    {typeof aqi === 'number' && (
                      (() => {
                        const category = aqi <= 1 ? 'Good' : aqi === 2 ? 'Fair' : aqi === 3 ? 'Moderate' : aqi === 4 ? 'Poor' : 'Very Poor';
                        const color = aqi <= 1 ? '#2ecc71' : aqi === 2 ? '#f1c40f' : aqi === 3 ? '#e67e22' : aqi === 4 ? '#e74c3c' : '#8e44ad';
                        return (
                          <Pressable onPress={() => setAqiModalVisible(true)}>
                            <View style={[styles.chip, { borderColor: color, borderWidth: 1 }]}>
                              <WeatherIcon aqi={aqi} size={16} color={color} />
                              <ThemedText style={[styles.chipText, { color }]}>{`AQI ${aqi} · ${category}`}</ThemedText>
                            </View>
                          </Pressable>
                        );
                      })()
                    )}
                    {typeof precip12h === 'number' && (
                      <View style={styles.chip}>
                        <MaterialCommunityIcons name="weather-pouring" size={16} color="#38bdf8" />
                        <ThemedText style={styles.chipText}>{precip12h}%</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </BlurView>
            ) : (
              <Animated.View style={[styles.heroPanel]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <WeatherIcon description={weatherData.current.description} size={48} />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ThemedText style={styles.heroTemp}>{Math.round(weatherData.current.temp)}°</ThemedText>
                    <ThemedText type="default" style={styles.heroCondition}>{weatherData.current.description}</ThemedText>
                  </View>
                </View>
                {/* Compact chips row */}
                <View style={styles.chipsRow}>
                  {typeof weatherData.current.uvi === 'number' && (
                    <View style={styles.chip}>
                      <WeatherIcon uvIndex={weatherData.current.uvi} size={16} />
                      <ThemedText style={styles.chipText}>UV {Math.round(weatherData.current.uvi)}</ThemedText>
                    </View>
                  )}
                  {typeof aqi === 'number' && (
                    (() => {
                      const category = aqi <= 1 ? 'Good' : aqi === 2 ? 'Fair' : aqi === 3 ? 'Moderate' : aqi === 4 ? 'Poor' : 'Very Poor';
                      const color = aqi <= 1 ? '#2ecc71' : aqi === 2 ? '#f1c40f' : aqi === 3 ? '#e67e22' : aqi === 4 ? '#e74c3c' : '#8e44ad';
                      return (
                        <Pressable onPress={() => setAqiModalVisible(true)}>
                          <View style={[styles.chip, { borderColor: color, borderWidth: 1 }]}>
                            <WeatherIcon aqi={aqi} size={16} color={color} />
                            <ThemedText style={[styles.chipText, { color }]}>{`AQI ${aqi} · ${category}`}</ThemedText>
                          </View>
                        </Pressable>
                      );
                    })()
                  )}
                  {typeof precip12h === 'number' && (
                    <View style={styles.chip}>
                      <MaterialCommunityIcons name="weather-pouring" size={16} color="#38bdf8" />
                      <ThemedText style={styles.chipText}>{precip12h}%</ThemedText>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}
            {/* Metrics Grid */}
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              <MetricsGrid
                feelsLike={weatherData.current.feels_like}
                humidity={weatherData.current.humidity}
                pressure={weatherData.current.pressure}
                visibility={weatherData.current.visibility ?? 0}
                sunrise={weatherData.current.sunrise ?? 0}
                sunset={weatherData.current.sunset ?? 0}
                uvIndex={weatherData.current.uvi}
                aqi={aqi ?? undefined}
              />
            </Animated.View>
          </Animated.View>
        )}

        {/* Enhanced Forecast Container */}
        {weatherData && (
          <Animated.View
            entering={FadeInUp.duration(800).delay(400)}
            style={[styles.forecastContainerWrapper, styles.cardElevated]}
          >
            <ForecastContainer
              data={extendedForecast}
              loading={loading}
            />
          </Animated.View>
        )}

        {weatherData && (
          <Animated.View
            entering={FadeInUp.duration(800).delay(800)}
            onLayout={() => {
              if (!aiSectionVisible) {
                console.log('🤖 AI: Section entered layout, marking as visible');
                setAiSectionVisible(true);
              }
            }}
          >
            {aiLoading && !aiInsights ? (
              <AISummarySkeleton />
            ) : (
              <Animated.View style={[styles.cardElevated, { padding: 16, marginTop: 6 }]}
                entering={FadeInUp.duration(600)}
              >
                <AISummary
                  insights={aiInsights}
                  isLoading={aiLoading}
                  error={aiError}
                  onRefresh={() => {
                    setAiInsights(null);
                    setAiLoading(false);
                    setAiSectionVisible(true);
                    fetchAISummary();
                  }}
                />
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* AQI Legend Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={aqiModalVisible}
          onRequestClose={() => setAqiModalVisible(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setAqiModalVisible(false)}>
            <BlurView intensity={60} tint="dark" style={styles.modalCard}>
              <ThemedText type="title" style={{ marginBottom: 8, color: '#fff' }}>Air Quality Index</ThemedText>
              <ThemedText style={{ marginBottom: 12, color: '#cbd5e1' }}>Categories and health guidance</ThemedText>
              <ThemedView style={styles.legendRow}>
                <ThemedView style={[styles.legendDot, { backgroundColor: '#2ecc71' }]} />
                <ThemedText style={styles.legendText}>Good (1): Air quality is satisfactory.</ThemedText>
              </ThemedView>
              <ThemedView style={styles.legendRow}>
                <ThemedView style={[styles.legendDot, { backgroundColor: '#f1c40f' }]} />
                <ThemedText style={styles.legendText}>Fair (2): Acceptable for most.</ThemedText>
              </ThemedView>
              <ThemedView style={styles.legendRow}>
                <ThemedView style={[styles.legendDot, { backgroundColor: '#e67e22' }]} />
                <ThemedText style={styles.legendText}>Moderate (3): Sensitive should limit exertion.</ThemedText>
              </ThemedView>
              <ThemedView style={styles.legendRow}>
                <ThemedView style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
                <ThemedText style={styles.legendText}>Poor (4): Reduce prolonged exertion.</ThemedText>
              </ThemedView>
              <ThemedView style={styles.legendRow}>
                <ThemedView style={[styles.legendDot, { backgroundColor: '#8e44ad' }]} />
                <ThemedText style={styles.legendText}>Very Poor (5): Avoid strenuous activities.</ThemedText>
              </ThemedView>
              <Pressable onPress={() => setAqiModalVisible(false)} style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.9 }]}>
                <ThemedText style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Close</ThemedText>
              </Pressable>
            </BlurView>
          </Pressable>
        </Modal>

        {!weatherData && !loading && !error && (
          <>
            <ThemedText>This app includes example code to help you get started.</ThemedText>
            <Collapsible title="File-based routing">
              <ThemedText>
                This app has two screens:{' '}
                <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
                <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
              </ThemedText>
              <ThemedText>
                The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
                sets up the tab navigator.
              </ThemedText>
              <ExternalLink href="https://docs.expo.dev/router/introduction">
                <ThemedText type="link">Learn more</ThemedText>
              </ExternalLink>
            </Collapsible>
            <Collapsible title="Android, iOS, and web support">
              <ThemedText>
                You can open this project on Android, iOS, and the web. To open the web version, press{' '}
                <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
              </ThemedText>
            </Collapsible>
            <Collapsible title="Images">
              <ThemedText>
                For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
                <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
                different screen densities
              </ThemedText>
              <Image
                source={require('@/assets/images/react-logo.png')}
                style={{ width: 100, height: 100, alignSelf: 'center' }}
              />
              <ExternalLink href="https://reactnative.dev/docs/images">
                <ThemedText type="link">Learn more</ThemedText>
              </ExternalLink>
            </Collapsible>
            <Collapsible title="Light and dark mode components">
              <ThemedText>
                This template has light and dark mode support. The{' '}
                <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
                what the user's current color scheme is, and so you can adjust UI colors accordingly.
              </ThemedText>
              <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
                <ThemedText type="link">Learn more</ThemedText>
              </ExternalLink>
            </Collapsible>
            <Collapsible title="Animations">
              <ThemedText>
                This template includes an example of an animated component. The{' '}
                <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
                the powerful{' '}
                <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
                  react-native-reanimated
                </ThemedText>{' '}
                library to create a waving hand animation.
              </ThemedText>
              {Platform.select({
                ios: (
                  <ThemedText>
                    The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
                    component provides a parallax effect for the header image.
                  </ThemedText>
                ),
              })}
            </Collapsible>
          </>
        )}
      </ParallaxScrollView>

      {/* City Bottom Sheet */}
      <CityBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onSelectCity={handleCitySelect}
        initialTab={bottomSheetInitialTab}
      />



    </ScreenLayout >
  );
}

const styles = StyleSheet.create({
  headerImageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 15,
    padding: 10,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    maxWidth: 400,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
      }
    }),
  },
  // Legacy support - keeping for backwards compatibility
  refreshButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
      }
    }),
  },
  errorText: {
    color: Colors.light.error,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: Fonts.sans,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: Fonts.sans,
    opacity: 0.7,
  },
  webIconFix: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    overflow: 'visible',
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
  heroBlur: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  heroContent: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  heroCity: {
    fontFamily: Fonts.rounded,
    fontSize: 36,
    marginTop: 10,
    letterSpacing: -0.5,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  heroSubcity: {
    marginTop: 10,
    opacity: 0.85,
    fontSize: 18,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  heroTemp: {
    fontFamily: Fonts.rounded,
    fontSize: 53.5,
    marginLeft: -20,
    padding: 10,
    //textAlign: 'left',
    letterSpacing: -1,
    color: '#ffffff',
  },
  heroCondition: {
    opacity: 0.9,
    fontSize: 14,
    color: '#e2e8f0',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 80,
    ...Platform.select({
      ios: { backgroundColor: 'rgba(255,255,255,0.18)' },
      android: { backgroundColor: 'rgba(255,255,255,0.12)' },
      web: { backgroundColor: 'rgba(255,255,255,0.18)' },
    })
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  closeButton: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherContainer: {
    marginTop: 0,
    padding: 24,
    borderRadius: 20,
    gap: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.5)',
      }
    }),
  },
  forecastContainer: {
    marginTop: 14,
    marginBottom: 10,
    padding: 24,
    borderRadius: 20,
    gap: 0,
  },
  forecastContainerWrapper: {
    marginTop: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
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
    gap: 1,
  },
});
