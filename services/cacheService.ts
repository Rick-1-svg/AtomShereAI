import { ForecastData, WeatherData } from '@/types/weather';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache key prefixes
const CACHE_PREFIX = 'weather_cache_';
const FORECAST_PREFIX = 'forecast_cache_';
const AQI_PREFIX = 'aqi_cache_';

// Configurable cache durations
const CACHE_FRESH_MS = 15 * 60 * 1000;  // 15 minutes - data is considered fresh
const CACHE_STALE_MS = 30 * 60 * 1000;  // 30 minutes - data is stale but usable
const CACHE_MAX_MS = 24 * 60 * 60 * 1000; // 24 hours - maximum cache age

// Legacy constant for backwards compatibility
const CACHE_EXPIRY_MS = CACHE_STALE_MS;

// Cache status type for stale-while-revalidate pattern
export type CacheStatus = 'fresh' | 'stale' | 'expired';

interface CachedData<T> {
    data: T;
    timestamp: number;
}

/**
 * Cache weather data for a city
 */
export const cacheWeatherData = async (
    cityId: string,
    data: WeatherData
): Promise<void> => {
    try {
        const cacheEntry: CachedData<WeatherData> = {
            data,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(
            `${CACHE_PREFIX}${cityId}`,
            JSON.stringify(cacheEntry)
        );
    } catch (error) {
        console.error('Error caching weather data:', error);
    }
};

/**
 * Cache forecast data for a city
 */
export const cacheForecastData = async (
    cityId: string,
    data: ForecastData
): Promise<void> => {
    try {
        const cacheEntry: CachedData<ForecastData> = {
            data,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(
            `${FORECAST_PREFIX}${cityId}`,
            JSON.stringify(cacheEntry)
        );
    } catch (error) {
        console.error('Error caching forecast data:', error);
    }
};

/**
 * Get cached weather data if not expired
 */
export const getCachedWeather = async (
    cityId: string
): Promise<{ data: WeatherData; timestamp: number } | null> => {
    try {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${cityId}`);
        if (!cached) return null;

        const parsed: CachedData<WeatherData> = JSON.parse(cached);
        const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRY_MS;

        if (isExpired) {
            // Return expired data but flag it - useful for offline mode
            return { data: parsed.data, timestamp: parsed.timestamp };
        }

        return { data: parsed.data, timestamp: parsed.timestamp };
    } catch (error) {
        console.error('Error getting cached weather:', error);
        return null;
    }
};

/**
 * Get cached forecast data if not expired
 */
export const getCachedForecast = async (
    cityId: string
): Promise<{ data: ForecastData; timestamp: number } | null> => {
    try {
        const cached = await AsyncStorage.getItem(`${FORECAST_PREFIX}${cityId}`);
        if (!cached) return null;

        const parsed: CachedData<ForecastData> = JSON.parse(cached);
        return { data: parsed.data, timestamp: parsed.timestamp };
    } catch (error) {
        console.error('Error getting cached forecast:', error);
        return null;
    }
};

/**
 * Check if cache is still valid (not expired)
 */
export const isCacheValid = async (cityId: string): Promise<boolean> => {
    try {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${cityId}`);
        if (!cached) return false;

        const parsed: CachedData<WeatherData> = JSON.parse(cached);
        return Date.now() - parsed.timestamp <= CACHE_EXPIRY_MS;
    } catch (error) {
        return false;
    }
};

/**
 * Get cache age in minutes
 */
export const getCacheAge = async (cityId: string): Promise<number | null> => {
    try {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${cityId}`);
        if (!cached) return null;

        const parsed: CachedData<WeatherData> = JSON.parse(cached);
        const ageMs = Date.now() - parsed.timestamp;
        return Math.floor(ageMs / 60000); // Return age in minutes
    } catch (error) {
        return null;
    }
};

/**
 * Clear all cached weather data
 */
export const clearAllCache = async (): Promise<void> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(
            (key) => key.startsWith(CACHE_PREFIX) || key.startsWith(FORECAST_PREFIX)
        );
        await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Get last update timestamp for a city
 */
export const getLastUpdateTime = async (cityId: string): Promise<Date | null> => {
    try {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${cityId}`);
        if (!cached) return null;

        const parsed: CachedData<WeatherData> = JSON.parse(cached);
        return new Date(parsed.timestamp);
    } catch (error) {
        return null;
    }
};

/**
 * Cache AQI data for a city
 */
export const cacheAqiData = async (
    cityId: string,
    aqi: number
): Promise<void> => {
    try {
        const cacheEntry: CachedData<number> = {
            data: aqi,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(
            `${AQI_PREFIX}${cityId}`,
            JSON.stringify(cacheEntry)
        );
    } catch (error) {
        console.error('Error caching AQI data:', error);
    }
};

/**
 * Get cached AQI data
 */
export const getCachedAqi = async (
    cityId: string
): Promise<{ data: number; timestamp: number } | null> => {
    try {
        const cached = await AsyncStorage.getItem(`${AQI_PREFIX}${cityId}`);
        if (!cached) return null;

        const parsed: CachedData<number> = JSON.parse(cached);
        return { data: parsed.data, timestamp: parsed.timestamp };
    } catch (error) {
        console.error('Error getting cached AQI:', error);
        return null;
    }
};

/**
 * Get cache status for a city (fresh, stale, or expired)
 */
export const getCacheStatus = async (cityId: string): Promise<CacheStatus> => {
    try {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${cityId}`);
        if (!cached) return 'expired';

        const parsed: CachedData<WeatherData> = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;

        if (age <= CACHE_FRESH_MS) {
            return 'fresh';
        } else if (age <= CACHE_STALE_MS) {
            return 'stale';
        } else {
            return 'expired';
        }
    } catch (error) {
        return 'expired';
    }
};

/**
 * Get all cached data for a city with cache status
 * Used for stale-while-revalidate pattern
 */
export const getAllCachedData = async (cityId: string): Promise<{
    weather: WeatherData | null;
    forecast: ForecastData | null;
    aqi: number | null;
    status: CacheStatus;
    timestamp: number | null;
}> => {
    try {
        const [weatherCache, forecastCache, aqiCache, status] = await Promise.all([
            getCachedWeather(cityId),
            getCachedForecast(cityId),
            getCachedAqi(cityId),
            getCacheStatus(cityId),
        ]);

        console.log(`📦 Cache: status=${status} for cityId=${cityId}`);

        return {
            weather: weatherCache?.data ?? null,
            forecast: forecastCache?.data ?? null,
            aqi: aqiCache?.data ?? null,
            status,
            timestamp: weatherCache?.timestamp ?? null,
        };
    } catch (error) {
        console.error('Error getting all cached data:', error);
        return {
            weather: null,
            forecast: null,
            aqi: null,
            status: 'expired',
            timestamp: null,
        };
    }
};

/**
 * Cache all weather data at once (weather, forecast, AQI)
 */
export const cacheAllWeatherData = async (
    cityId: string,
    weather: WeatherData | null,
    forecast: ForecastData | null,
    aqi: number | null
): Promise<void> => {
    const promises: Promise<void>[] = [];

    if (weather) promises.push(cacheWeatherData(cityId, weather));
    if (forecast) promises.push(cacheForecastData(cityId, forecast));
    if (aqi !== null) promises.push(cacheAqiData(cityId, aqi));

    await Promise.all(promises);
    console.log(`💾 Cache: Saved all data for cityId=${cityId}`);
};
