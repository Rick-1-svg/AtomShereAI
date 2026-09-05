/**
 * City search result interface
 */
export interface City {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface SearchResult {
  cities: City[];
  error: string | null;
}

/**
 * Weather data interfaces
 */
export interface Location {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility?: number; // Visibility in meters
  wind_speed: number;
  wind_deg: number; // Wind direction in degrees
  description: string;
  icon: string;
  uvi?: number; // UV Index
  sunrise?: number; // Unix timestamp
  sunset?: number; // Unix timestamp
  timestamp: string;
}

export interface WeatherData {
  location: Location;
  current: CurrentWeather;
}

export interface ForecastItem extends CurrentWeather {
  timestamp: string;
  visibility?: number; // Visibility in meters
  pop?: number; // Probability of precipitation (0-1)
}

export interface ForecastData {
  location: Location;
  forecast: ForecastItem[];
}

/**
 * Extended forecast interfaces for new features
 */
export interface HourlyForecast {
  time: string; // ISO string or formatted time
  temp: number;
  description: string;
  icon: string;
  pop: number; // Probability of precipitation (0-100)
  humidity: number;
  wind_speed: number;
  feels_like: number;
}

export interface DailyForecast {
  date: string;
  day_name: string;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
  pop: number; // Probability of precipitation (0-100)
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  uv_index: number;
  aqi?: number; // Air Quality Index
  sunrise: string;
  sunset: string;
  pressure: number;
}

export interface ExtendedForecastData {
  location: Location;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

/**
 * UI-specific types
 */
export type ForecastViewType = 'hourly' | 'daily' | 'radar';

export interface AQIData {
  value: number;
  level: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  color: string;
}
