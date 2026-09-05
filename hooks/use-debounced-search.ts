import { useState, useEffect, useCallback } from 'react';
import { searchCities } from '@/services/api';
import { City } from '@/types/weather';

interface UseDebounceSearchResult {
  searchQuery: string;
  searchResults: City[];
  isSearching: boolean;
  searchError: string | null;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

/**
 * Hook for debounced city search with automatic API calls
 * @param debounceMs Debounce delay in milliseconds
 * @returns Search state and controls
 */
export const useDebounceSearch = (debounceMs: number = 250): UseDebounceSearchResult => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const result = await searchCities(searchQuery.trim());
        if (result.error) {
          setSearchError(result.error);
          setSearchResults([]);
        } else {
          setSearchResults(result.cities);
          setSearchError(null);
        }
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : 'Search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    setSearchQuery,
    clearSearch,
  };
};