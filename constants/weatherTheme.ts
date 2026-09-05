/**
 * Dynamic Weather Theme Configuration
 * 
 * Provides gradient colors and theme settings based on:
 * - Weather conditions (sunny, rainy, cloudy, snow, etc.)
 * - Time of day (day, sunset, night, sunrise)
 * - Temperature ranges (hot, mild, cold)
 */

// Type definitions for weather themes
export interface WeatherThemeConfig {
    id: string;
    gradientColors: readonly [string, string, string];
    statusBarStyle: 'light' | 'dark';
    textColor: string;
    accentColor: string;
}

// Weather condition types
export type WeatherCondition =
    | 'clear'
    | 'sunny'
    | 'cloudy'
    | 'overcast'
    | 'rain'
    | 'drizzle'
    | 'thunderstorm'
    | 'snow'
    | 'mist'
    | 'fog'
    | 'haze';

// Time of day types
export type TimeOfDay = 'night' | 'sunrise' | 'day' | 'sunset';

// Temperature range types
export type TemperatureRange = 'freezing' | 'cold' | 'mild' | 'warm' | 'hot';

/**
 * Gradient color sets for different weather/time/temperature combinations
 */
export const WEATHER_GRADIENTS: Record<string, readonly [string, string, string]> = {
    // Weather conditions
    sunny: ['#FF8C00', '#ceaf03ff', '#FFA500'],
    clear_day: ['#4DA0FF', '#87CEEB', '#00BFFF'],
    cloudy: ['#4a5568', '#718096', '#a0aec0'],
    overcast: ['#374151', '#4b5563', '#6b7280'],
    rain: ['#1e3a5f', '#2c5282', '#4a7c96'],
    drizzle: ['#3d5a80', '#4a7c96', '#6b9dc4'],
    thunderstorm: ['#1a1a2e', '#16213e', '#0f3460'],
    snow: ['#e2e8f0', '#cbd5e1', '#94a3b8'],
    mist: ['#6b7280', '#9ca3af', '#d1d5db'],
    fog: ['#4b5563', '#6b7280', '#9ca3af'],
    haze: ['#78716c', '#a8a29e', '#d6d3d1'],

    // Time of day
    night: ['#0f172a', '#1e1b4b', '#312e81'],
    sunrise: ['#fbbf24', '#f97316', '#db2777'],
    sunset: ['#ea580c', '#dc2626', '#7c3aed'],
    day: ['#0ea5e9', '#38bdf8', '#7dd3fc'],

    // Temperature modifiers
    hot: ['#dc2626', '#ea580c', '#f59e0b'],
    warm: ['#f97316', '#fb923c', '#fbbf24'],
    mild: ['#10b981', '#34d399', '#6ee7b7'],
    cold: ['#0ea5e9', '#3b82f6', '#6366f1'],
    freezing: ['#94a3b8', '#cbd5e1', '#e2e8f0'],

    // Default fallback
    default: ['#0f172a', '#1e1b4b', '#312e81'],
} as const;

/**
 * Default theme configuration for fallback
 */
export const DEFAULT_THEME: WeatherThemeConfig = {
    id: 'default',
    gradientColors: WEATHER_GRADIENTS.default,
    statusBarStyle: 'light',
    textColor: '#ffffff',
    accentColor: '#a5b4fc',
};

/**
 * Get temperature range from temperature value (in Celsius)
 */
export function getTemperatureRange(temp: number): TemperatureRange {
    if (temp <= 0) return 'freezing';
    if (temp <= 10) return 'cold';
    if (temp <= 20) return 'mild';
    if (temp <= 30) return 'warm';
    return 'hot';
}

/**
 * Get time of day based on current time and sunrise/sunset timestamps
 */
export function getTimeOfDay(
    currentTime: number,
    sunrise: number,
    sunset: number
): TimeOfDay {
    // Handle edge cases
    if (!currentTime || !sunrise || !sunset) {
        return 'day';
    }

    const sunriseMs = sunrise * 1000;
    const sunsetMs = sunset * 1000;

    // Define transition windows (30 minutes before/after)
    const transitionWindow = 30 * 60 * 1000; // 30 minutes in ms

    const sunriseStart = sunriseMs - transitionWindow;
    const sunriseEnd = sunriseMs + transitionWindow;
    const sunsetStart = sunsetMs - transitionWindow;
    const sunsetEnd = sunsetMs + transitionWindow;

    if (currentTime >= sunriseStart && currentTime <= sunriseEnd) {
        return 'sunrise';
    }

    if (currentTime >= sunsetStart && currentTime <= sunsetEnd) {
        return 'sunset';
    }

    if (currentTime > sunriseEnd && currentTime < sunsetStart) {
        return 'day';
    }

    return 'night';
}

/**
 * Parse weather description to get condition type
 */
export function parseWeatherCondition(description: string): WeatherCondition {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('thunderstorm') || lowerDesc.includes('thunder')) {
        return 'thunderstorm';
    }
    if (lowerDesc.includes('snow') || lowerDesc.includes('sleet')) {
        return 'snow';
    }
    if (lowerDesc.includes('rain') || lowerDesc.includes('shower')) {
        return 'rain';
    }
    if (lowerDesc.includes('drizzle')) {
        return 'drizzle';
    }
    if (lowerDesc.includes('fog')) {
        return 'fog';
    }
    if (lowerDesc.includes('mist')) {
        return 'mist';
    }
    if (lowerDesc.includes('haze') || lowerDesc.includes('smoke') || lowerDesc.includes('dust')) {
        return 'haze';
    }
    if (lowerDesc.includes('overcast')) {
        return 'overcast';
    }
    if (lowerDesc.includes('cloud') || lowerDesc.includes('partly')) {
        return 'cloudy';
    }
    if (lowerDesc.includes('clear')) {
        return 'clear';
    }
    if (lowerDesc.includes('sun') || lowerDesc.includes('sunny')) {
        return 'sunny';
    }

    return 'clear'; // Default to clear
}

/**
 * Blend two gradient arrays for smoother transitions
 */
function blendGradients(
    primary: readonly [string, string, string],
    secondary: readonly [string, string, string],
    blendFactor: number // 0 = all primary, 1 = all secondary
): readonly [string, string, string] {
    // For simplicity, we'll use a weighted selection based on blend factor
    // A full implementation would blend individual RGB values
    if (blendFactor < 0.3) return primary;
    if (blendFactor > 0.7) return secondary;

    // Return a mix by selecting middle colors
    return [primary[0], secondary[1], primary[2]];
}

/**
 * Main function to determine the appropriate weather theme
 * 
 * Priority order:
 * 1. Night time (overrides most conditions)
 * 2. Sunrise/Sunset (time-based transitions)
 * 3. Severe weather (thunderstorm, snow)
 * 4. Weather condition (rain, cloudy, clear, etc.)
 * 5. Temperature modifier (applied as an influence)
 */
export function getWeatherTheme(
    description: string,
    temperature: number,
    sunrise?: number,
    sunset?: number
): WeatherThemeConfig {
    try {
        const currentTime = Date.now();
        const timeOfDay = getTimeOfDay(currentTime, sunrise || 0, sunset || 0);
        const condition = parseWeatherCondition(description);
        const tempRange = getTemperatureRange(temperature);

        let gradientColors: readonly [string, string, string];
        let themeId: string;

        // Priority 1: Night time
        if (timeOfDay === 'night') {
            // At night, use night gradient but consider severe weather
            if (condition === 'thunderstorm') {
                gradientColors = WEATHER_GRADIENTS.thunderstorm;
                themeId = 'night-thunderstorm';
            } else if (condition === 'snow') {
                gradientColors = blendGradients(WEATHER_GRADIENTS.night, WEATHER_GRADIENTS.snow, 0.5);
                themeId = 'night-snow';
            } else if (condition === 'rain' || condition === 'drizzle') {
                gradientColors = blendGradients(WEATHER_GRADIENTS.night, WEATHER_GRADIENTS.rain, 0.4);
                themeId = 'night-rain';
            } else {
                gradientColors = WEATHER_GRADIENTS.night;
                themeId = 'night';
            }
        }
        // Priority 2: Sunrise
        else if (timeOfDay === 'sunrise') {
            if (condition === 'cloudy' || condition === 'overcast') {
                gradientColors = blendGradients(WEATHER_GRADIENTS.sunrise, WEATHER_GRADIENTS.cloudy, 0.4);
                themeId = 'sunrise-cloudy';
            } else {
                gradientColors = WEATHER_GRADIENTS.sunrise;
                themeId = 'sunrise';
            }
        }
        // Priority 3: Sunset
        else if (timeOfDay === 'sunset') {
            if (condition === 'cloudy' || condition === 'overcast') {
                gradientColors = blendGradients(WEATHER_GRADIENTS.sunset, WEATHER_GRADIENTS.cloudy, 0.4);
                themeId = 'sunset-cloudy';
            } else {
                gradientColors = WEATHER_GRADIENTS.sunset;
                themeId = 'sunset';
            }
        }
        // Priority 4 & 5: Daytime - Weather condition + temperature influence
        else {
            // Handle severe weather first
            if (condition === 'thunderstorm') {
                gradientColors = WEATHER_GRADIENTS.thunderstorm;
                themeId = 'thunderstorm';
            } else if (condition === 'snow') {
                gradientColors = WEATHER_GRADIENTS.snow;
                themeId = 'snow';
            } else if (condition === 'rain') {
                gradientColors = WEATHER_GRADIENTS.rain;
                themeId = 'rain';
            } else if (condition === 'drizzle') {
                gradientColors = WEATHER_GRADIENTS.drizzle;
                themeId = 'drizzle';
            } else if (condition === 'fog' || condition === 'mist') {
                gradientColors = WEATHER_GRADIENTS.mist;
                themeId = condition;
            } else if (condition === 'haze') {
                gradientColors = WEATHER_GRADIENTS.haze;
                themeId = 'haze';
            } else if (condition === 'overcast') {
                gradientColors = WEATHER_GRADIENTS.overcast;
                themeId = 'overcast';
            } else if (condition === 'cloudy') {
                // Cloudy but apply temperature influence
                if (tempRange === 'hot' || tempRange === 'warm') {
                    gradientColors = blendGradients(WEATHER_GRADIENTS.cloudy, WEATHER_GRADIENTS.warm, 0.3);
                    themeId = 'cloudy-warm';
                } else if (tempRange === 'cold' || tempRange === 'freezing') {
                    gradientColors = blendGradients(WEATHER_GRADIENTS.cloudy, WEATHER_GRADIENTS.cold, 0.3);
                    themeId = 'cloudy-cold';
                } else {
                    gradientColors = WEATHER_GRADIENTS.cloudy;
                    themeId = 'cloudy';
                }
            }
            // Clear/Sunny with temperature influence
            else {
                if (tempRange === 'hot') {
                    gradientColors = WEATHER_GRADIENTS.hot;
                    themeId = 'hot-sunny';
                } else if (tempRange === 'warm') {
                    gradientColors = WEATHER_GRADIENTS.sunny;
                    themeId = 'warm-sunny';
                } else if (tempRange === 'mild') {
                    gradientColors = WEATHER_GRADIENTS.clear_day;
                    themeId = 'mild-clear';
                } else if (tempRange === 'cold') {
                    gradientColors = WEATHER_GRADIENTS.cold;
                    themeId = 'cold-clear';
                } else {
                    gradientColors = WEATHER_GRADIENTS.freezing;
                    themeId = 'freezing-clear';
                }
            }
        }

        // Determine status bar style based on gradient brightness
        const statusBarStyle = themeId.includes('snow') || themeId.includes('freezing')
            ? 'dark'
            : 'light';

        return {
            id: themeId,
            gradientColors,
            statusBarStyle,
            textColor: statusBarStyle === 'dark' ? '#1f2937' : '#ffffff',
            accentColor: condition === 'rain' || condition === 'drizzle'
                ? '#38bdf8'
                : condition === 'snow'
                    ? '#6366f1'
                    : '#fbbf24',
        };
    } catch (error) {
        console.warn('[WeatherTheme] Error calculating theme, using default:', error);
        return DEFAULT_THEME;
    }
}
