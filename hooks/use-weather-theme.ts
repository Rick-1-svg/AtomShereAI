/**
 * useWeatherTheme Hook
 * 
 * Computes dynamic theme based on current weather conditions,
 * time of day, and temperature.
 */

import {
    DEFAULT_THEME,
    getWeatherTheme,
    WeatherThemeConfig
} from '@/constants/weatherTheme';
import { WeatherData } from '@/types/weather';
import { useMemo } from 'react';

interface UseWeatherThemeResult {
    /** The computed theme configuration */
    theme: WeatherThemeConfig;
    /** The gradient colors for the background */
    gradientColors: readonly [string, string, string];
    /** Theme identifier for debugging */
    themeId: string;
    /** Whether we're using the fallback theme */
    isFallback: boolean;
    /** Error message if theme computation failed */
    error: string | null;
}

interface UseWeatherThemeOptions {
    /** Weather data containing current conditions */
    weatherData: WeatherData | null;
    /** Override sunrise timestamp (Unix seconds) */
    sunriseOverride?: number;
    /** Override sunset timestamp (Unix seconds) */
    sunsetOverride?: number;
    /** Force a specific theme (for testing/preview) */
    forceThemeId?: string;
}

/**
 * Hook to compute dynamic weather-based theme
 * 
 * @example
 * ```tsx
 * const { gradientColors, themeId } = useWeatherTheme({
 *   weatherData,
 * });
 * 
 * return (
 *   <ScreenLayout gradientColors={gradientColors}>
 *     {children}
 *   </ScreenLayout>
 * );
 * ```
 */
export function useWeatherTheme(options: UseWeatherThemeOptions): UseWeatherThemeResult {
    const { weatherData, sunriseOverride, sunsetOverride } = options;

    const result = useMemo<UseWeatherThemeResult>(() => {
        // Return fallback if no weather data
        if (!weatherData?.current) {
            return {
                theme: DEFAULT_THEME,
                gradientColors: DEFAULT_THEME.gradientColors,
                themeId: 'default-no-data',
                isFallback: true,
                error: null,
            };
        }

        try {
            const { current } = weatherData;

            // Get description and temperature
            const description = current.description || '';
            const temperature = current.temp ?? 20; // Default to mild temperature

            // Get sunrise/sunset times
            const sunrise = sunriseOverride ?? current.sunrise ?? 0;
            const sunset = sunsetOverride ?? current.sunset ?? 0;

            // Validate inputs
            if (typeof description !== 'string') {
                console.warn('[useWeatherTheme] Invalid description type:', typeof description);
                return {
                    theme: DEFAULT_THEME,
                    gradientColors: DEFAULT_THEME.gradientColors,
                    themeId: 'default-invalid-description',
                    isFallback: true,
                    error: 'Invalid weather description',
                };
            }

            if (typeof temperature !== 'number' || isNaN(temperature)) {
                console.warn('[useWeatherTheme] Invalid temperature:', temperature);
                return {
                    theme: DEFAULT_THEME,
                    gradientColors: DEFAULT_THEME.gradientColors,
                    themeId: 'default-invalid-temp',
                    isFallback: true,
                    error: 'Invalid temperature value',
                };
            }

            // Compute theme
            const theme = getWeatherTheme(description, temperature, sunrise, sunset);

            return {
                theme,
                gradientColors: theme.gradientColors,
                themeId: theme.id,
                isFallback: false,
                error: null,
            };
        } catch (error) {
            console.error('[useWeatherTheme] Error computing theme:', error);

            return {
                theme: DEFAULT_THEME,
                gradientColors: DEFAULT_THEME.gradientColors,
                themeId: 'default-error',
                isFallback: true,
                error: error instanceof Error ? error.message : 'Unknown error computing theme',
            };
        }
    }, [
        weatherData?.current?.description,
        weatherData?.current?.temp,
        weatherData?.current?.sunrise,
        weatherData?.current?.sunset,
        sunriseOverride,
        sunsetOverride,
    ]);

    return result;
}

/**
 * Get default gradient colors for initial/loading states
 */
export function getDefaultGradientColors(): readonly [string, string, string] {
    return DEFAULT_THEME.gradientColors;
}

export default useWeatherTheme;
