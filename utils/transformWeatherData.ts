import { DailyForecast, ExtendedForecastData, ForecastData, ForecastItem, HourlyForecast, WeatherData } from '@/types/weather';

/**
 * Format unix timestamp to time string
 */
const formatTime = (timestamp: number, hour12: boolean = true): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12,
    });
};

/**
 * Format ISO timestamp to display time
 */
const formatHourFromISO = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
    });
};

/**
 * Get day name from date
 */
const getDayName = (dateString: string, index: number): string => {
    if (index === 0) return 'Today';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Group forecast items by day and calculate daily aggregates
 */
const groupForecastByDay = (
    forecast: ForecastItem[],
    currentWeather: WeatherData
): DailyForecast[] => {
    const dayMap = new Map<string, ForecastItem[]>();

    // Group items by date
    forecast.forEach((item) => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        if (!dayMap.has(date)) {
            dayMap.set(date, []);
        }
        dayMap.get(date)!.push(item);
    });

    const dailyForecasts: DailyForecast[] = [];
    let index = 0;

    dayMap.forEach((items, date) => {
        // Calculate aggregates
        const temps = items.map((i) => i.temp);
        const tempMax = Math.max(...temps);
        const tempMin = Math.min(...temps);
        const avgHumidity = Math.round(
            items.reduce((sum, i) => sum + i.humidity, 0) / items.length
        );
        const avgWindSpeed = Math.round(
            items.reduce((sum, i) => sum + i.wind_speed, 0) / items.length
        );
        const avgWindDeg = Math.round(
            items.reduce((sum, i) => sum + i.wind_deg, 0) / items.length
        );
        const maxPop = Math.max(...items.map((i) => (i.pop ?? 0) * 100));
        const avgPressure = Math.round(
            items.reduce((sum, i) => sum + i.pressure, 0) / items.length
        );

        // Use noon item for description/icon or first available
        const noonItem =
            items.find((i) => {
                const hour = new Date(i.timestamp).getHours();
                return hour >= 11 && hour <= 14;
            }) || items[0];

        // For first day (today), use current weather's sunrise/sunset
        let sunrise = '6:00 AM';
        let sunset = '6:00 PM';
        let uvIndex = 5;

        if (index === 0 && currentWeather.current.sunrise && currentWeather.current.sunset) {
            sunrise = formatTime(currentWeather.current.sunrise);
            sunset = formatTime(currentWeather.current.sunset);
            uvIndex = currentWeather.current.uvi ?? 5;
        } else {
            // Estimate sunrise/sunset for future days (roughly same as today)
            if (currentWeather.current.sunrise && currentWeather.current.sunset) {
                sunrise = formatTime(currentWeather.current.sunrise);
                sunset = formatTime(currentWeather.current.sunset);
            }
        }

        dailyForecasts.push({
            date,
            day_name: getDayName(date, index),
            temp_max: tempMax,
            temp_min: tempMin,
            description: noonItem.description,
            icon: noonItem.icon,
            pop: Math.round(maxPop),
            humidity: index === 0 ? currentWeather.current.humidity : avgHumidity,
            wind_speed: index === 0 ? currentWeather.current.wind_speed : avgWindSpeed,
            wind_deg: index === 0 ? currentWeather.current.wind_deg : avgWindDeg,
            uv_index: uvIndex,
            aqi: undefined, // AQI not available in forecast API
            sunrise,
            sunset,
            pressure: index === 0 ? currentWeather.current.pressure : avgPressure,
        });

        index++;
    });

    // Limit to 7 days
    return dailyForecasts.slice(0, 7);
};

/**
 * Transform hourly forecast items to HourlyForecast format
 */
const transformHourlyForecast = (
    forecast: ForecastItem[],
    currentWeather: WeatherData
): HourlyForecast[] => {
    // Add current hour as first item
    const hourly: HourlyForecast[] = [
        {
            time: 'Now',
            temp: currentWeather.current.temp,
            description: currentWeather.current.description,
            icon: currentWeather.current.icon,
            pop: 0,
            humidity: currentWeather.current.humidity,
            wind_speed: currentWeather.current.wind_speed,
            feels_like: currentWeather.current.feels_like,
        },
    ];

    // Add forecast items (up to 48 hours)
    forecast.slice(0, 47).forEach((item) => {
        hourly.push({
            time: formatHourFromISO(item.timestamp),
            temp: item.temp,
            description: item.description,
            icon: item.icon,
            pop: Math.round((item.pop ?? 0) * 100),
            humidity: item.humidity,
            wind_speed: item.wind_speed,
            feels_like: item.feels_like,
        });
    });

    return hourly;
};

/**
 * Transform API weather data to ExtendedForecastData format
 * This ensures consistency between the main cards and the forecast views
 */
export const transformToExtendedForecast = (
    weatherData: WeatherData,
    forecastData: ForecastData
): ExtendedForecastData => {
    return {
        location: weatherData.location,
        current: weatherData.current,
        hourly: transformHourlyForecast(forecastData.forecast, weatherData),
        daily: groupForecastByDay(forecastData.forecast, weatherData),
    };
};

export default transformToExtendedForecast;
