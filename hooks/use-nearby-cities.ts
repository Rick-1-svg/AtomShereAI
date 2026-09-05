import { getNearbyCities, NearbyCity } from '@/services/nearbyService';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from './use-location';

interface UseNearbyCitiesResult {
    // Location state
    hasLocationPermission: boolean;
    isRequestingLocation: boolean;
    locationError: string | null;

    // Nearby cities state
    nearbyCities: NearbyCity[];
    isLoadingCities: boolean;
    citiesError: string | null;

    // Actions
    requestLocationPermission: () => Promise<boolean>;
    refreshNearbyCities: () => Promise<void>;
    startNearbySearch: () => Promise<void>;

    // Combined loading state
    isLoading: boolean;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Maximum number of cities to cache (memory limit)
const MAX_CACHED_CITIES = 10;

interface CachedData {
    cities: NearbyCity[];
    timestamp: number;
    lat: number;
    lon: number;
}

/**
 * Hook for managing nearby cities with location integration
 * Combines useLocation with nearby cities API calls
 */
export const useNearbyCities = (): UseNearbyCitiesResult => {
    const {
        location,
        loading: isRequestingLocation,
        error: locationError,
        hasPermission: hasLocationPermission,
        requestLocation,
        requestPermission,
    } = useLocation();

    const [nearbyCities, setNearbyCities] = useState<NearbyCity[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [citiesError, setCitiesError] = useState<string | null>(null);
    const [hasStartedSearch, setHasStartedSearch] = useState(false);

    // Cache reference
    const cacheRef = useRef<CachedData | null>(null);

    // Track if we've already fetched for current location
    const lastFetchedLocationRef = useRef<string | null>(null);

    // Check if cache is valid
    const isCacheValid = useCallback((lat: number, lon: number): boolean => {
        if (!cacheRef.current) return false;

        const now = Date.now();
        const cacheAge = now - cacheRef.current.timestamp;

        // Check if cache is expired
        if (cacheAge > CACHE_DURATION) return false;

        // Check if location has changed significantly (> 1km)
        const latDiff = Math.abs(lat - cacheRef.current.lat);
        const lonDiff = Math.abs(lon - cacheRef.current.lon);
        const significantChange = latDiff > 0.01 || lonDiff > 0.01;

        return !significantChange;
    }, []);

    // Fetch nearby cities
    const fetchNearbyCities = useCallback(async (lat: number, lon: number, forceRefresh: boolean = false) => {
        const locationKey = `${lat.toFixed(4)}-${lon.toFixed(4)}`;

        // Check cache first
        if (!forceRefresh && isCacheValid(lat, lon)) {
            console.log('🏙️ useNearbyCities: Using cached cities');
            setNearbyCities(cacheRef.current!.cities);
            return;
        }

        // Avoid duplicate fetches for same location
        if (!forceRefresh && lastFetchedLocationRef.current === locationKey && nearbyCities.length > 0) {
            console.log('🏙️ useNearbyCities: Already fetched for this location');
            return;
        }

        console.log('🏙️ useNearbyCities: Fetching nearby cities for', { lat, lon });
        setIsLoadingCities(true);
        setCitiesError(null);

        try {
            const result = await getNearbyCities(lat, lon, 8);
            lastFetchedLocationRef.current = locationKey;

            if (result.error) {
                console.error('🏙️ useNearbyCities: API returned error:', result.error);
                setCitiesError(result.error);
                setNearbyCities([]);
            } else {
                console.log('🏙️ useNearbyCities: Setting cities:', result.cities.length);
                const limitedCities = result.cities.slice(0, MAX_CACHED_CITIES);
                setNearbyCities(limitedCities);
                // Update cache with limited cities
                cacheRef.current = {
                    cities: limitedCities,
                    timestamp: Date.now(),
                    lat,
                    lon,
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load nearby cities';
            console.error('❌ useNearbyCities: Error:', errorMessage);
            setCitiesError(errorMessage);
            setNearbyCities([]);
        } finally {
            setIsLoadingCities(false);
        }
    }, [isCacheValid, nearbyCities.length]);

    // Auto-fetch when location becomes available AND search has started
    useEffect(() => {
        if (hasStartedSearch && location?.coords) {
            console.log('🏙️ useNearbyCities: Location available, fetching cities');
            fetchNearbyCities(location.coords.latitude, location.coords.longitude);
        }
    }, [location, fetchNearbyCities, hasStartedSearch]);

    // Start the nearby search process (called when user switches to Nearby tab)
    const startNearbySearch = useCallback(async () => {
        console.log('🏙️ useNearbyCities: startNearbySearch called');
        setHasStartedSearch(true);
        setCitiesError(null);

        // If we already have location, fetch cities
        if (location?.coords) {
            console.log('🏙️ useNearbyCities: Already have location, fetching cities');
            await fetchNearbyCities(location.coords.latitude, location.coords.longitude);
            return;
        }

        // If we have permission but no location, request it
        if (hasLocationPermission) {
            console.log('🏙️ useNearbyCities: Have permission, requesting location');
            await requestLocation();
            // The useEffect will trigger fetchNearbyCities when location becomes available
        }
        // If no permission, the UI will show the "Grant Permission" button
    }, [location, hasLocationPermission, requestLocation, fetchNearbyCities]);

    // Request location permission and start fetching
    const requestLocationPermission = useCallback(async (): Promise<boolean> => {
        console.log('🏙️ useNearbyCities: Requesting permission');
        setHasStartedSearch(true);

        const granted = await requestPermission();
        if (granted) {
            console.log('🏙️ useNearbyCities: Permission granted, requesting location');
            // Trigger location fetch after permission granted
            await requestLocation();
        }
        return granted;
    }, [requestPermission, requestLocation]);

    // Refresh nearby cities (force fetch)
    const refreshNearbyCities = useCallback(async () => {
        console.log('🏙️ useNearbyCities: Refresh requested');

        if (!hasLocationPermission) {
            setCitiesError('Location permission required');
            return;
        }

        setIsLoadingCities(true);
        setCitiesError(null);

        // Clear cache to force refresh
        cacheRef.current = null;
        lastFetchedLocationRef.current = null;

        // First refresh the location
        await requestLocation();

        // Fetch cities with new location
        if (location?.coords) {
            await fetchNearbyCities(
                location.coords.latitude,
                location.coords.longitude,
                true // Force refresh
            );
        }
    }, [hasLocationPermission, requestLocation, location, fetchNearbyCities]);

    return {
        hasLocationPermission,
        isRequestingLocation,
        locationError,
        nearbyCities,
        isLoadingCities,
        citiesError,
        requestLocationPermission,
        refreshNearbyCities,
        startNearbySearch,
        isLoading: isRequestingLocation || isLoadingCities,
    };
};
