import { City } from '@/types/weather';
import { platformStorage } from '@/utils/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WeatherFilters {
  country?: string;
  tempRange?: [number, number];
  precipitationChance?: number; // 0-100
  aqiMax?: number; // 1-5 scale
}

interface WeatherState {
  // Favorite cities
  favoriteCities: City[];
  selectedCity: City | null;
  filters: WeatherFilters;
  _hasHydrated: boolean;

  // Actions
  addFavorite: (city: City) => void;
  removeFavorite: (cityId: string) => void;
  isFavorite: (cityId: string) => boolean;
  setSelectedCity: (city: City | null) => void;
  updateFilters: (filters: Partial<WeatherFilters>) => void;
  resetFilters: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

const defaultFilters: WeatherFilters = {
  country: undefined,
  tempRange: [-20, 45],
  precipitationChance: 100,
  aqiMax: 5,
};

/**
 * Weather store for managing favorites, selected city, and filters
 * All data persists to storage for cross-session availability
 */
export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      // Initial state
      favoriteCities: [],
      selectedCity: null,
      filters: defaultFilters,
      _hasHydrated: false,

      // Favorite cities actions
      addFavorite: (city: City) =>
        set((state) => {
          const exists = state.favoriteCities.find(fav => fav.id === city.id);
          if (!exists) {
            return {
              favoriteCities: [...state.favoriteCities, city]
            };
          }
          return state;
        }),

      removeFavorite: (cityId: string) =>
        set((state) => ({
          favoriteCities: state.favoriteCities.filter(city => city.id !== cityId)
        })),

      isFavorite: (cityId: string) => {
        const state = get();
        return state.favoriteCities.some(city => city.id === cityId);
      },

      // Selected city actions
      setSelectedCity: (city: City | null) =>
        set({ selectedCity: city }),

      // Filter actions
      updateFilters: (newFilters: Partial<WeatherFilters>) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),

      resetFilters: () =>
        set({ filters: defaultFilters }),

      // Hydration
      setHasHydrated: (hydrated: boolean) =>
        set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'weather-store',
      storage: createJSONStorage(() => platformStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Version the storage for future migrations
      version: 1,
    }
  )
);

// Helper functions for working with favorite cities
export const getFavoriteCityById = (cityId: string): City | undefined => {
  const state = useWeatherStore.getState();
  return state.favoriteCities.find(city => city.id === cityId);
};

export const getFavoritesByCountry = (country?: string): City[] => {
  const state = useWeatherStore.getState();
  if (!country) return state.favoriteCities;
  return state.favoriteCities.filter(city => city.country === country);
};

// Helper function to apply filters to city list
export const applyCityFilters = (cities: City[], filters: WeatherFilters): City[] => {
  return cities.filter(city => {
    // Country filter
    if (filters.country && city.country !== filters.country) {
      return false;
    }

    // Note: Temperature, precipitation, and AQI filtering would require 
    // fetching weather data for each city, which is expensive
    // In a real app, this would be done server-side or with cached data
    return true;
  });
};