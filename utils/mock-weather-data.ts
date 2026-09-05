import { ExtendedForecastData, HourlyForecast, DailyForecast, AQIData } from '@/types/weather';

/**
 * Utility functions for mock data generation
 */
const getRandomTemp = (base: number, variance: number = 5) => {
  return Math.round(base + (Math.random() - 0.5) * variance * 2);
};

const getRandomPrecipitation = () => Math.round(Math.random() * 100);

const weatherIcons = ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d', '50d'];
const weatherDescriptions = [
  'Clear sky', 'Few clouds', 'Scattered clouds', 'Broken clouds',
  'Shower rain', 'Rain', 'Thunderstorm', 'Snow', 'Mist'
];

/**
 * Generate hourly forecast data for the next 48 hours
 */
const generateHourlyForecast = (baseTemp: number): HourlyForecast[] => {
  const hours: HourlyForecast[] = [];
  const now = new Date();

  for (let i = 0; i < 48; i++) {
    const hourDate = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hour = hourDate.getHours();
    
    // Temperature varies by time of day
    const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 8; // Peak at 2 PM
    const temp = baseTemp + tempVariation + getRandomTemp(0, 3);

    hours.push({
      time: hourDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      }),
      temp: Math.round(temp),
      description: weatherDescriptions[Math.floor(Math.random() * weatherDescriptions.length)],
      icon: weatherIcons[Math.floor(Math.random() * weatherIcons.length)],
      pop: getRandomPrecipitation(),
      humidity: Math.round(45 + Math.random() * 40), // 45-85%
      wind_speed: Math.round(Math.random() * 15), // 0-15 mph
      feels_like: Math.round(temp + (Math.random() - 0.5) * 4)
    });
  }

  return hours;
};

/**
 * Generate daily forecast data for the next 7 days
 */
const generateDailyForecast = (baseTemp: number): DailyForecast[] => {
  const days: DailyForecast[] = [];
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const tempMax = baseTemp + getRandomTemp(0, 6);
    const tempMin = tempMax - Math.round(8 + Math.random() * 12); // 8-20 degree range

    // Generate sunrise/sunset times
    const sunrise = new Date(dayDate);
    sunrise.setHours(6 + Math.round(Math.random() * 2), Math.round(Math.random() * 60));
    
    const sunset = new Date(dayDate);
    sunset.setHours(18 + Math.round(Math.random() * 2), Math.round(Math.random() * 60));

    days.push({
      date: dayDate.toISOString().split('T')[0],
      day_name: i === 0 ? 'Today' : dayNames[dayDate.getDay()],
      temp_max: tempMax,
      temp_min: tempMin,
      description: weatherDescriptions[Math.floor(Math.random() * weatherDescriptions.length)],
      icon: weatherIcons[Math.floor(Math.random() * weatherIcons.length)],
      pop: getRandomPrecipitation(),
      humidity: Math.round(40 + Math.random() * 50), // 40-90%
      wind_speed: Math.round(Math.random() * 20), // 0-20 mph
      wind_deg: Math.round(Math.random() * 360), // 0-360 degrees
      uv_index: Math.round(1 + Math.random() * 10), // 1-11
      aqi: Math.round(20 + Math.random() * 200), // 20-220 AQI
      sunrise: sunrise.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      sunset: sunset.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      pressure: Math.round(980 + Math.random() * 60) // 980-1040 hPa
    });
  }

  return days;
};

/**
 * Get AQI data with color coding
 */
export const getAQIData = (value: number): AQIData => {
  if (value <= 50) {
    return { value, level: 'Good', color: '#00e400' };
  } else if (value <= 100) {
    return { value, level: 'Moderate', color: '#ffff00' };
  } else if (value <= 150) {
    return { value, level: 'Unhealthy for Sensitive Groups', color: '#ff7e00' };
  } else if (value <= 200) {
    return { value, level: 'Unhealthy', color: '#ff0000' };
  } else if (value <= 300) {
    return { value, level: 'Very Unhealthy', color: '#8f3f97' };
  } else {
    return { value, level: 'Hazardous', color: '#7e0023' };
  }
};

/**
 * Mock extended forecast data
 */
export const mockExtendedForecastData: ExtendedForecastData = {
  location: {
    name: 'New York',
    country: 'US',
    lat: 40.7128,
    lon: -74.0060
  },
  current: {
    temp: 72,
    feels_like: 75,
    humidity: 65,
    pressure: 1013,
    visibility: 10000,
    wind_speed: 8,
    wind_deg: 180,
    description: 'Partly cloudy',
    icon: '02d',
    uvi: 6,
    sunrise: 1640694000, // Unix timestamp
    sunset: 1640729400,  // Unix timestamp
    timestamp: new Date().toISOString()
  },
  hourly: generateHourlyForecast(72),
  daily: generateDailyForecast(72)
};

/**
 * Alternative mock data for different weather conditions
 */
export const mockRainyForecastData: ExtendedForecastData = {
  ...mockExtendedForecastData,
  location: {
    name: 'Seattle',
    country: 'US',
    lat: 47.6062,
    lon: -122.3321
  },
  current: {
    ...mockExtendedForecastData.current,
    temp: 58,
    description: 'Light rain',
    icon: '10d'
  },
  hourly: generateHourlyForecast(58),
  daily: generateDailyForecast(58)
};

export const mockSunnyForecastData: ExtendedForecastData = {
  ...mockExtendedForecastData,
  location: {
    name: 'Los Angeles',
    country: 'US',
    lat: 34.0522,
    lon: -118.2437
  },
  current: {
    ...mockExtendedForecastData.current,
    temp: 78,
    description: 'Clear sky',
    icon: '01d'
  },
  hourly: generateHourlyForecast(78),
  daily: generateDailyForecast(78)
};