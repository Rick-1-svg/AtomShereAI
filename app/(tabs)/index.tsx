import { HelloWave } from '@/components/hello-wave';
import LocationWeatherSkeleton from '@/components/home/skeletons/LocationWeatherSkeleton';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import Button from '@/components/ui/Button';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import CitySearchInput from '@/components/weather/CitySearchInput';
import LocationWeather from '@/components/weather/LocationWeather';
import { useOnboardingStore } from '@/hooks/stores/use-onboarding-store';
import { useLocation } from '@/hooks/use-location';
import { City, WeatherData } from '@/types/weather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Link, useRouter } from 'expo-router';
import { Alert, Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';

// Helper: Only use entering animations on native platforms
// On web, react-native-reanimated animations can cause visibility issues
const isWeb = Platform.OS === 'web';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { clearOnboardingData } = useOnboardingStore();
  const { loading: locationLoading } = useLocation();

  // Development only: Check if this is development mode
  const isDevelopment = __DEV__;

  // No manual animations needed - using declarative FadeIn/FadeOut animations

  const handleCitySelect = (city: City) => {
    // Navigate to the explore tab with city data
    router.push({
      pathname: '/(tabs)/explore',
      params: {
        lat: city.lat,
        lon: city.lon,
        cityName: city.name,
        country: city.country
      }
    });
  };

  const handleLocationWeatherPress = (weatherData: WeatherData) => {
    // Navigate to the explore tab with location weather data
    router.push({
      pathname: '/(tabs)/explore',
      params: {
        lat: weatherData.location.lat.toString(),
        lon: weatherData.location.lon.toString(),
        cityName: weatherData.location.name,
        country: weatherData.location.country
      }
    });
  };

  // Development only: Reset onboarding function
  const handleResetOnboardingDev = async () => {
    if (!isDevelopment) return;

    Alert.alert(
      'DEV: Clear Onboarding',
      'This will clear the onboarding state and show onboarding screens again. This is for development only.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear & Restart',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear from AsyncStorage
              await AsyncStorage.removeItem('onboarding-storage');
              // Clear from Zustand store  
              clearOnboardingData();
              // Navigate to onboarding using absolute path from root
              router.replace('/onboarding');
            } catch (error) {
              console.error('Error clearing onboarding:', error);
            }
          },
        },
      ]
    );
  };


  return (
    <ScreenLayout useSafeArea={false}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: 'transparent', dark: 'transparent' }}
        contentBackgroundColor={{ light: 'transparent', dark: 'transparent' }}
        headerImage={
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={280}
              color="rgba(255,255,255,0.15)"
            />
          </View>
        }
      >
        {/* Header Title */}
        <Animated.View entering={isWeb ? undefined : FadeInDown.delay(200).springify()}>
          <View style={[styles.titleContainer]}>
            <ThemedText accessibilityRole="header" type="title" style={{ color: 'white' }}>AtomSphere AI</ThemedText>
            <HelloWave />
          </View>
        </Animated.View>

        {/* Search Section */}
        <Animated.View entering={isWeb ? undefined : FadeInDown.delay(350).springify()}>
          <View style={[styles.searchContainer]}>
            <ThemedText accessibilityRole="header" type="subtitle" style={{ color: '#e2e8f0' }}>Weather & AI Insights</ThemedText>
            <ThemedText accessibilityLabel="Search instructions" style={{ color: '#cbd5e1' }}>
              Search for a city to get weather information and AI-powered insights.
            </ThemedText>
            <CitySearchInput onCitySelect={handleCitySelect} />
          </View>
        </Animated.View>


        {/* Location Weather Section */}
        {locationLoading ? (
          <Animated.View entering={isWeb ? undefined : FadeInUp.delay(450).springify()}>
            <LocationWeatherSkeleton />
          </Animated.View>
        ) : (
          <Animated.View entering={isWeb ? undefined : FadeInUp.delay(500).springify()}>
            {/* Use BlurView for Glassmorphism card effect on iOS/Android */}
            <BlurView
              intensity={40}
              tint="dark"
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                marginHorizontal: 16,
                marginVertical: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
                padding: 4,
              }}
            >
              <LocationWeather
                onLocationPress={handleLocationWeatherPress}
                showUseLocationButton={true}
              />
            </BlurView>
          </Animated.View>
        )}

        {/* Weather Tips Section */}
        <Animated.View entering={isWeb ? undefined : FadeInUp.delay(600).springify()}>
          <View style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#fbbf24" />
              <ThemedText type="subtitle" style={styles.tipsTitle}>Weather Tips</ThemedText>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="magnify" size={16} color="#a5b4fc" />
                <ThemedText style={styles.tipText}>Search any city to get detailed forecasts</ThemedText>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="robot-outline" size={16} color="#a5b4fc" />
                <ThemedText style={styles.tipText}>AI insights help you plan your day</ThemedText>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="gesture-tap" size={16} color="#a5b4fc" />
                <ThemedText style={styles.tipText}>Tap the weather card for more details</ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Development only: Onboarding reset button */}
        {isDevelopment && (
          <View style={styles.devContainer}>
            <Button
              title="🔧 DEV: Clear Onboarding"
              variant="secondary"
              onPress={handleResetOnboardingDev}
              accessibilityLabel="Developer: Clear onboarding state"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            />
          </View>
        )}

        {/* About Section */}
        <View style={styles.aboutContainer}>
          <Link href="/notifications" asChild>
            <Pressable style={styles.aboutLink}>
              <MaterialCommunityIcons name="bell-outline" size={18} color="#fbbf24" />
              <ThemedText style={styles.aboutText}>Custom Notifications</ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
            </Pressable>
          </Link>
          <Link href="/modal" asChild>
            <Pressable style={styles.aboutLink}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#a5b4fc" />
              <ThemedText style={styles.aboutText}>About AtomSphere AI</ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
            </Pressable>
          </Link>
        </View>
      </ParallaxScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 0,
    paddingHorizontal: 10,
    paddingTop: 16,
  },
  searchContainer: {
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepContainer: {
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  headerIconContainer: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    opacity: 1,
  },
  tipsContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 14,
    flex: 1,
  },
  devContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  aboutContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  aboutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aboutText: {
    color: '#a5b4fc',
    fontSize: 15,
    flex: 1,
  },
});
