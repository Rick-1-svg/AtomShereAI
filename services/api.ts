import { AIWeatherInsight } from '../types/aiSummary';
import { City, ForecastData, SearchResult, WeatherData } from '../types/weather';
import { getGeminiWeatherSummary, getStructuredWeatherInsights } from './gemini';
import { deduplicateRequest, getWeatherKey } from './requestDedup';
import { fetchWithRetry } from './retryUtils';

const API_KEY = process.env.OPENWEATHER_API_KEY || '54feda8961a67020c70fb7a54f9f4bf3'; // IMPORTANT: Replace 'YOUR_OPENWEATHER_API_KEY_HERE' with your actual OpenWeatherMap API key, or set the OPENWEATHER_API_KEY environment variable. A 404 error often indicates an invalid API key.
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';
const AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

/**
 * Search for cities by name with autocomplete
 * @param query Search query string
 * @returns Promise with search results
 */
export const searchCities = async (query: string): Promise<SearchResult> => {
  try {
    if (!query || query.length < 2) {
      return { cities: [], error: null };
    }

    const response = await fetch(
      `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const cities: City[] = data.map((item: any) => ({
      id: `${item.lat}-${item.lon}`,
      name: item.name || '',
      country: item.country || '',
      state: item.state || '',
      lat: item.lat,
      lon: item.lon
    }));

    return { cities, error: null };
  } catch (error) {
    console.error('Error searching cities:', error);
    return {
      cities: [],
      error: error instanceof Error ? error.message : 'Failed to search cities'
    };
  }
};

/**
 * Get current weather for a location
 * @param lat Latitude
 * @param lon Longitude
 * @returns Promise with weather data
 */
export const getCurrentWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
  const requestKey = getWeatherKey(lat, lon, 'weather');

  return deduplicateRequest(requestKey, async () => {
    return fetchWithRetry(async () => {
      const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      console.log('🌐 API: Fetching weather from:', url.replace(API_KEY, '[API_KEY]'));

      const response = await fetch(url);

      console.log('🌐 API: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API: Error response body:', errorText);
        const error = new Error(`API error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log('🌐 API: Weather data structure:', {
        name: data.name,
        country: data.sys?.country,
        hasWeather: !!data.weather?.[0],
        hasMain: !!data.main
      });

      return {
        location: {
          name: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        current: {
          temp: data.main.temp,
          feels_like: data.main.feels_like,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          visibility: data.visibility,
          wind_speed: data.wind.speed,
          wind_deg: data.wind.deg,
          description: Array.isArray(data.weather) && data.weather[0]?.description ? data.weather[0].description : '',
          icon: Array.isArray(data.weather) && data.weather[0]?.icon ? data.weather[0].icon : '',
          uvi: data.uvi,
          sunrise: data.sys.sunrise,
          sunset: data.sys.sunset,
          timestamp: new Date(data.dt * 1000).toISOString()
        }
      };
    });
  }).catch(error => {
    console.error('Error fetching current weather:', error);
    return null;
  });
};

/**
 * Get weather forecast for a location
 * @param lat Latitude
 * @param lon Longitude
 * @returns Promise with forecast data
 */
export const getForecast = async (lat: number, lon: number): Promise<ForecastData | null> => {
  const requestKey = getWeatherKey(lat, lon, 'forecast');

  return deduplicateRequest(requestKey, async () => {
    return fetchWithRetry(async () => {
      const response = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );

      if (!response.ok) {
        const error = new Error(`API error: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();

      return {
        location: {
          name: data.city.name,
          country: data.city.country,
          lat: data.city.coord.lat,
          lon: data.city.coord.lon
        },
        forecast: data.list.map((item: any) => ({
          timestamp: new Date(item.dt * 1000).toISOString(),
          temp: item.main.temp,
          feels_like: item.main.feels_like,
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          visibility: item.visibility,
          wind_speed: item.wind.speed,
          wind_deg: item.wind.deg,
          description: Array.isArray(item.weather) && item.weather[0]?.description ? item.weather[0].description : '',
          icon: Array.isArray(item.weather) && item.weather[0]?.icon ? item.weather[0].icon : '',
          pop: typeof item.pop === 'number' ? item.pop : 0,
        }))
      };
    });
  }).catch(error => {
    console.error('Error fetching forecast:', error);
    return null;
  });
};

/**
 * Get AI-powered weather summary from Gemini API
 * @param lat Latitude
 * @param lon Longitude
 * @param context Additional context for the AI summary
 * @returns Promise with AI summary string
 */
export const getAIWeatherSummary = async (
  lat: number,
  lon: number,
  context: string = ''
): Promise<string | null> => {
  try {
    const weatherData = await getCurrentWeather(lat, lon);
    if (!weatherData) {
      throw new Error('Failed to fetch current weather data. Please check your connection or OpenWeatherMap API key/limit.');
    }

    const forecastData = await getForecast(lat, lon);
    if (!forecastData) {
      throw new Error('Failed to fetch forecast data. Please check your connection or OpenWeatherMap API key/limit.');
    }

    const summary = await getGeminiWeatherSummary(weatherData, forecastData, context);
    return summary;
  } catch (error) {
    console.error('Error in getAIWeatherSummary:', error);
    throw error;
  }
};

/**
 * Fetch Air Quality Index (AQI) for a location (1-5 scale per OpenWeather)
 */
export const getAirQuality = async (lat: number, lon: number): Promise<number | null> => {
  const requestKey = getWeatherKey(lat, lon, 'aqi');

  return deduplicateRequest(requestKey, async () => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${AIR_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
      if (!response.ok) {
        const error = new Error(`API error: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }
      const data = await response.json();
      const aqi = data?.list?.[0]?.main?.aqi;
      return typeof aqi === 'number' ? aqi : null;
    });
  }).catch(error => {
    console.error('Error fetching AQI:', error);
    return null;
  });
};

/**
 * Batch API calls into a single request for better performance
 * Fetches current weather, forecast, and air quality data in parallel
 * @param lat Latitude
 * @param lon Longitude
 * @returns Promise with all weather data
 */
export const fetchAllWeatherData = async (lat: number, lon: number): Promise<{
  weather: WeatherData | null;
  forecast: ForecastData | null;
  aqi: number | null;
}> => {
  console.log('🌐 API: Fetching all weather data in parallel for:', { lat, lon });

  const [weather, forecast, aqi] = await Promise.all([
    getCurrentWeather(lat, lon),
    getForecast(lat, lon),
    getAirQuality(lat, lon)
  ]);

  console.log('🌐 API: All weather data fetched:', {
    hasWeather: !!weather,
    hasForecast: !!forecast,
    hasAqi: aqi !== null
  });

  return { weather, forecast, aqi };
};

/**
 * Get structured AI weather insights with activity recommendations, clothing suggestions, and alerts
 * @param lat Latitude
 * @param lon Longitude
 * @param context Additional context for the AI (e.g., "I want to test hot weather")
 * @returns Promise with structured AI insights
 */
export const getStructuredAIInsights = async (
  lat: number,
  lon: number,
  context: string = ''
): Promise<AIWeatherInsight> => {
  try {
    const weatherData = await getCurrentWeather(lat, lon);
    if (!weatherData) {
      throw new Error('Failed to fetch current weather data.');
    }

    const forecastData = await getForecast(lat, lon);
    if (!forecastData) {
      throw new Error('Failed to fetch forecast data.');
    }

    return await getStructuredWeatherInsights(weatherData, forecastData, context);
  } catch (error) {
    console.error('Error in getStructuredAIInsights:', error);
    throw error;
  }
};