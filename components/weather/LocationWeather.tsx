import LocationWeatherSkeleton from '@/components/home/skeletons/LocationWeatherSkeleton';
import { ThemedText } from '@/components/themed-text';
import Button from '@/components/ui/Button';
import WeatherIcon from '@/components/weather/WeatherIcon';
import { Fonts } from '@/constants/theme';
import { useOnboardingStore } from '@/hooks/stores/use-onboarding-store';
import { useLocation } from '@/hooks/use-location';
import { getCurrentWeather } from '@/services/api';
import { WeatherData } from '@/types/weather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export interface LocationWeatherProps {
  onLocationPress?: (weatherData: WeatherData) => void;
  showUseLocationButton?: boolean;
}

const LocationWeather: React.FC<LocationWeatherProps> = ({ onLocationPress, showUseLocationButton = false }) => {
  console.log('🎆 LocationWeather: Component mounted/rendered');

  const {
    location,
    loading: locationLoading,
    error: locationError,
    hasPermission,
    requestLocation,
    refreshLocation
  } = useLocation();

  console.log('🔍 LocationWeather: Current state:', {
    hasPermission,
    locationLoading,
    locationError,
    hasLocation: !!location?.coords,
  });

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Test API connectivity on component mount
  useEffect(() => {
    // Removed testAPIConnectivity call
  }, []);

  const fetchWeatherForLocation = useCallback(async (lat: number, lon: number) => {
    console.log('🌦️ LocationWeather: Starting weather fetch for coordinates:', lat, lon);
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      console.log('🌦️ LocationWeather: Calling getCurrentWeather API...');
      const data = await getCurrentWeather(lat, lon);
      console.log('🌦️ LocationWeather: Weather data received:', data);

      if (data) {
        setWeatherData(data);
        setLastUpdated(new Date());
        console.log('✅ LocationWeather: Weather data set successfully');
      } else {
        console.warn('⚠️ LocationWeather: No weather data received');
        setWeatherError('No weather data available');
      }
    } catch (error) {
      console.error('❌ LocationWeather: Error fetching weather:', error);
      setWeatherError(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setWeatherLoading(false);
      console.log('🏁 LocationWeather: Weather fetch completed');
    }
  }, []);

  // Fetch weather when location is available
  useEffect(() => {
    console.log('📍 LocationWeather: Location changed:', location);
    if (location?.coords) {
      console.log('📍 LocationWeather: Valid coordinates found, fetching weather...', {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      });
      fetchWeatherForLocation(location.coords.latitude, location.coords.longitude);
    } else {
      console.log('📍 LocationWeather: No valid coordinates available');
    }
  }, [location, fetchWeatherForLocation]);

  const handleRequestLocation = useCallback(async () => {
    console.log('🎯 LocationWeather: User requested location access');
    try {
      await requestLocation();
      console.log('✅ LocationWeather: Location request completed');

      // If this was shown during first launch, mark onboarding as completed
      if (showUseLocationButton) {
        const { setHasCompletedOnboarding } = useOnboardingStore.getState();
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      console.error('❌ LocationWeather: Location request failed:', error);
      setWeatherError(`Location access failed: ${error instanceof Error ? error.message : 'Please check your settings'}`);
    }
  }, [requestLocation, showUseLocationButton]);

  const handleRefresh = useCallback(async () => {
    if (location?.coords) {
      // Refresh both location and weather
      await refreshLocation();
      await fetchWeatherForLocation(location.coords.latitude, location.coords.longitude);
    } else {
      // If no location, request it again
      await handleRequestLocation();
    }
  }, [location, refreshLocation, fetchWeatherForLocation, handleRequestLocation]);

  const handleLocationPress = useCallback(() => {
    if (weatherData && onLocationPress) {
      onLocationPress(weatherData);
    }
  }, [weatherData, onLocationPress]);

  const getTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 10) return 'Updated few sec. ago';
    if (diffInSeconds < 60) return `Updated ${diffInSeconds} sec. ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Updated ${diffInMinutes} min. ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    return `Updated ${diffInHours} hr. ago`;
  }, []);

  const isLoading = locationLoading || weatherLoading;
  const hasError = locationError || weatherError;
  const showWeather = weatherData && location && !hasError;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color="#a5b4fc"
          />
          <ThemedText type="subtitle" style={styles.title}>
            Your Location Weather
          </ThemedText>
        </View>

        {showUseLocationButton && !locationError && !weatherData && (
          <View style={styles.permissionContainer}>
            <Button
              title="Use Location"
              onPress={isLoading ? () => { } : handleRequestLocation}
              variant="blue"
              style={{
                ...styles.useLocationButton,
                ...(isLoading ? styles.disabledButton : {}),
              }}
            />
          </View>
        )}

        {!showUseLocationButton && !hasPermission && !locationError && (
          <View style={styles.permissionContainer}>
            <ThemedText style={styles.description}>
              Allow location access to see weather for your current location
            </ThemedText>
            <Button
              title={isLoading ? "Loading..." : "Enable Location"}
              onPress={isLoading ? () => { } : handleRequestLocation}
              variant="primary"
              style={{
                ...styles.enableButton,
                ...(isLoading ? styles.disabledButton : {}),
              }}
            />
          </View>
        )}

        {hasError && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color="#f87171"
            />
            <ThemedText style={styles.errorText}>
              {locationError || weatherError}
            </ThemedText>
            <Button
              title={isLoading ? "Loading..." : "Try Again"}
              onPress={isLoading ? () => { } : handleRefresh}
              variant="secondary"
              style={{
                ...styles.retryButton,
                ...(isLoading ? styles.disabledButton : {}),
              }}
            />
          </View>
        )}

        {isLoading && (
          <LocationWeatherSkeleton />
        )}

        {/* Debug buttons removed as per requirements */}

        {showWeather && (
          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <Pressable
              style={({ pressed }) => [
                styles.weatherCard,
                pressed && styles.weatherCardPressed
              ]}
              onPress={handleLocationPress}
              accessibilityRole="button"
              accessibilityLabel={`Weather for your location: ${weatherData.current.description}, ${Math.round(weatherData.current.temp)} degrees`}
            >
              {/* Location Header */}
              <View style={styles.weatherHeader}>
                <View style={styles.locationInfo}>
                  <View style={styles.locationText}>
                    <ThemedText style={styles.locationName}>
                      {weatherData.location.name}
                    </ThemedText>
                    <ThemedText style={styles.locationCountry}>
                      {weatherData.location.country}
                    </ThemedText>
                  </View>
                </View>

                <Pressable
                  style={[styles.refreshButton, isLoading && styles.disabledButton]}
                  onPress={isLoading ? () => { } : handleRefresh}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh weather data"
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={20}
                    color="#ffffff"
                  />
                </Pressable>
              </View>

              {/* Main Temperature Display */}
              <View style={styles.mainTempContainer}>
                <WeatherIcon description={weatherData.current.description} size={56} />
                <View style={styles.tempInfo}>
                  <ThemedText style={styles.temperature}>
                    {Math.round(weatherData.current.temp)}°
                  </ThemedText>
                  <ThemedText style={styles.condition}>
                    {weatherData.current.description}
                  </ThemedText>
                </View>
              </View>

              {/* Quick Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="thermometer" size={18} color="#a5b4fc" />
                  <ThemedText style={styles.metricLabel}>Feels</ThemedText>
                  <ThemedText style={styles.metricValue}>{Math.round(weatherData.current.feels_like)}°</ThemedText>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="water-percent" size={18} color="#38bdf8" />
                  <ThemedText style={styles.metricLabel}>Humidity</ThemedText>
                  <ThemedText style={styles.metricValue}>{weatherData.current.humidity}%</ThemedText>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="weather-windy" size={18} color="#4ade80" />
                  <ThemedText style={styles.metricLabel}>Wind</ThemedText>
                  <ThemedText style={styles.metricValue}>{Math.round(weatherData.current.wind_speed || 0)} m/s</ThemedText>
                </View>
              </View>

              {lastUpdated && (
                <ThemedText style={styles.timestamp}>
                  {getTimeAgo(lastUpdated)}
                </ThemedText>
              )}
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginVertical: 12,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 20,
    letterSpacing: -0.3,
    color: '#ffffff',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 16,
    color: '#e2e8f0',
  },
  permissionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
  },
  enableButton: {
    minWidth: 150,
  },
  useLocationButton: {
    minWidth: 150,
    backgroundColor: '#6366f1', // Indigo-500
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#f87171',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.8,
    color: '#e2e8f0',
  },
  weatherCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
    })
  },
  weatherCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  locationText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  locationName: {
    fontFamily: Fonts.rounded,
    fontSize: 20,
    letterSpacing: -0.3,
    textAlign: 'left',
    color: '#ffffff',
    fontWeight: '600',
  },
  locationCountry: {
    marginTop: 2,
    textAlign: 'left',
    fontSize: 14,
    color: '#94a3b8',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainTempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  tempInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  weatherContent: {
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
    backgroundColor: 'transparent',
  },
  temperature: {
    fontFamily: Fonts.rounded,
    fontSize: 56,
    letterSpacing: -2,
    lineHeight: 60,
    textAlign: 'left',
    color: '#ffffff',
    fontWeight: '300',
  },
  condition: {
    fontSize: 16,
    textTransform: 'capitalize',
    textAlign: 'left',
    color: '#cbd5e1',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  details: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    color: '#cbd5e1',
  },
  timestamp: {
    marginTop: 8,
    fontSize: 11,
    textAlign: 'center',
    color: '#64748b',
    width: '100%',
  },
  disabledButton: {
    opacity: 0.5,
  },
  debugContainer: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  debugButton: {
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default LocationWeather;