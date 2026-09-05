/**
 * Test file for services/api.ts
 * This file can be used as a template for TestSprite to generate comprehensive tests
 */

import { getAirQuality, getCurrentWeather, getForecast, searchCities } from '../../services/api';

describe('API Service Tests', () => {
  describe('searchCities', () => {
    it('should return empty array for query less than 2 characters', async () => {
      const result = await searchCities('a');
      expect(result.cities).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should return cities for valid query', async () => {
      const result = await searchCities('London');
      expect(result.cities.length).toBeGreaterThan(0);
      expect(result.cities[0]).toHaveProperty('name');
      expect(result.cities[0]).toHaveProperty('lat');
      expect(result.cities[0]).toHaveProperty('lon');
    });

    it('should handle API errors gracefully', async () => {
      // Test with invalid API key scenario
      // This test should verify error handling
    });
  });

  describe('getCurrentWeather', () => {
    it('should fetch weather data for valid coordinates', async () => {
      const weather = await getCurrentWeather(51.5074, -0.1278); // London
      expect(weather).not.toBeNull();
      expect(weather?.location).toBeDefined();
      expect(weather?.current).toBeDefined();
      expect(weather?.current.temp).toBeDefined();
    });

    it('should handle invalid coordinates', async () => {
      // Test error handling for invalid coordinates
    });

    it('should handle network errors', async () => {
      // Test network failure scenarios
    });
  });

  describe('getForecast', () => {
    it('should fetch forecast data for valid coordinates', async () => {
      const forecast = await getForecast(51.5074, -0.1278); // London
      expect(forecast).not.toBeNull();
      expect(forecast?.forecast).toBeDefined();
      expect(Array.isArray(forecast?.forecast)).toBe(true);
    });
  });

  describe('getAirQuality', () => {
    it('should fetch AQI for valid coordinates', async () => {
      const aqi = await getAirQuality(51.5074, -0.1278); // London
      expect(aqi).toBeGreaterThanOrEqual(1);
      expect(aqi).toBeLessThanOrEqual(5);
    });
  });
});
