import { City } from '../types/weather';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const GEO_URL = `${API_BASE_URL}/geo`;

export interface NearbyCity extends City {
    distance: number; // Distance in km
    distanceText: string; // Formatted distance (e.g., "3.2km away")
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Format distance for display
 */
const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m away`;
    }
    if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)}km away`;
    }
    return `${Math.round(distanceKm)}km away`;
};

/**
 * Get the current location's city using reverse geocoding
 */
const getCurrentLocationCity = async (lat: number, lon: number): Promise<NearbyCity | null> => {
    try {
        const response = await fetch(
            `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1`
        );

        if (!response.ok) {
            console.error('📍 Reverse geocoding failed:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('📍 Reverse geocoding result:', data);

        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }

        const item = data[0];
        return {
            id: `${item.lat}-${item.lon}`,
            name: item.name || 'Current Location',
            country: item.country || '',
            state: item.state || '',
            lat: item.lat,
            lon: item.lon,
            distance: 0,
            distanceText: 'Your location',
        };
    } catch (error) {
        console.error('📍 Error getting current location city:', error);
        return null;
    }
};

/**
 * Search for cities by name and filter by distance
 */
const searchCitiesNear = async (
    query: string,
    userLat: number,
    userLon: number,
    maxDistanceKm: number = 100
): Promise<NearbyCity[]> => {
    try {
        const response = await fetch(
            `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5`
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return [];
        }

        const cities: NearbyCity[] = [];
        for (const item of data) {
            const distance = calculateDistance(userLat, userLon, item.lat, item.lon);

            if (distance <= maxDistanceKm) {
                cities.push({
                    id: `${item.lat}-${item.lon}`,
                    name: item.name || '',
                    country: item.country || '',
                    state: item.state || '',
                    lat: item.lat,
                    lon: item.lon,
                    distance,
                    distanceText: formatDistance(distance),
                });
            }
        }

        return cities;
    } catch (error) {
        console.error('🔍 Error searching cities:', error);
        return [];
    }
};

/**
 * Get nearby cities using a combination of approaches
 * 1. Get the current location's city via reverse geocoding
 * 2. Search for major/common city names in the region
 * 3. Use coordinate offsets to find cities in different directions
 */
export const getNearbyCities = async (
    lat: number,
    lon: number,
    limit: number = 8
): Promise<{ cities: NearbyCity[]; error: string | null }> => {
    console.log('🏙️ getNearbyCities called with:', { lat, lon, limit });

    try {
        const allCities: NearbyCity[] = [];
        const seenCities = new Set<string>();

        // Step 1: Get current location's city
        const currentCity = await getCurrentLocationCity(lat, lon);
        if (currentCity) {
            const cityKey = `${currentCity.name}-${currentCity.country}`.toLowerCase();
            seenCities.add(cityKey);
            allCities.push(currentCity);
            console.log('🏙️ Current location city:', currentCity.name);
        }

        // Step 2: Search for cities using reverse geocoding at offset positions
        // This finds cities in a ~30-50km radius around the user
        const offsets = [
            { lat: 0.3, lon: 0 },     // ~33km North
            { lat: -0.3, lon: 0 },    // ~33km South
            { lat: 0, lon: 0.3 },     // ~33km East (varies by latitude)
            { lat: 0, lon: -0.3 },    // ~33km West
            { lat: 0.2, lon: 0.2 },   // ~31km NE
            { lat: -0.2, lon: 0.2 },  // ~31km SE
            { lat: 0.2, lon: -0.2 },  // ~31km NW
            { lat: -0.2, lon: -0.2 }, // ~31km SW
            { lat: 0.5, lon: 0 },     // ~55km North
            { lat: -0.5, lon: 0 },    // ~55km South
            { lat: 0, lon: 0.5 },     // ~55km East
            { lat: 0, lon: -0.5 },    // ~55km West
        ];

        // Make parallel requests for better performance
        const offsetPromises = offsets.map(async (offset) => {
            const searchLat = lat + offset.lat;
            const searchLon = lon + offset.lon;

            try {
                const response = await fetch(
                    `${GEO_URL}/reverse?lat=${searchLat}&lon=${searchLon}&limit=3`
                );

                if (!response.ok) return [];

                const data = await response.json();
                if (!Array.isArray(data)) return [];

                return data.map((item: any) => ({
                    ...item,
                    userLat: lat,
                    userLon: lon,
                }));
            } catch {
                return [];
            }
        });

        const offsetResults = await Promise.all(offsetPromises);

        // Process all results
        for (const results of offsetResults) {
            for (const item of results) {
                if (!item.name) continue;

                const cityKey = `${item.name}-${item.country}`.toLowerCase();

                if (seenCities.has(cityKey)) continue;
                seenCities.add(cityKey);

                const distance = calculateDistance(lat, lon, item.lat, item.lon);

                // Only include cities within 100km
                if (distance <= 100) {
                    allCities.push({
                        id: `${item.lat}-${item.lon}`,
                        name: item.name,
                        country: item.country || '',
                        state: item.state || '',
                        lat: item.lat,
                        lon: item.lon,
                        distance,
                        distanceText: formatDistance(distance),
                    });
                }
            }
        }

        // Sort by distance
        allCities.sort((a, b) => a.distance - b.distance);

        console.log('🏙️ Found', allCities.length, 'nearby cities');

        // If we still don't have enough cities, try some common search terms
        if (allCities.length < 3) {
            console.log('🏙️ Not enough cities, trying common searches...');

            // Try searching for common city-related terms
            const commonSearches = ['city', 'town', 'village'];
            for (const term of commonSearches) {
                if (allCities.length >= limit) break;

                const searchResults = await searchCitiesNear(term, lat, lon, 150);
                for (const city of searchResults) {
                    const cityKey = `${city.name}-${city.country}`.toLowerCase();
                    if (!seenCities.has(cityKey)) {
                        seenCities.add(cityKey);
                        allCities.push(city);
                    }
                }
            }
        }

        // Final sort and limit
        allCities.sort((a, b) => a.distance - b.distance);
        const finalCities = allCities.slice(0, limit);

        console.log('🏙️ Returning', finalCities.length, 'cities:', finalCities.map(c => c.name));

        return {
            cities: finalCities,
            error: null,
        };
    } catch (error) {
        console.error('❌ Error in getNearbyCities:', error);
        return {
            cities: [],
            error: error instanceof Error ? error.message : 'Failed to fetch nearby cities',
        };
    }
};

/**
 * Get nearby cities with extended search (larger radius, more API calls)
 * Use this for a more comprehensive search when basic getNearbyCities returns few results
 */
export const getNearbyCitiesExtended = async (
    lat: number,
    lon: number,
    limit: number = 10
): Promise<{ cities: NearbyCity[]; error: string | null }> => {
    // First try the basic search
    const basicResult = await getNearbyCities(lat, lon, limit);

    if (basicResult.cities.length >= limit / 2) {
        return basicResult;
    }

    console.log('🏙️ Extended search: basic result had', basicResult.cities.length, 'cities');

    // Extended offsets for larger search area
    const extendedOffsets = [
        { lat: 0.8, lon: 0 },
        { lat: -0.8, lon: 0 },
        { lat: 0, lon: 0.8 },
        { lat: 0, lon: -0.8 },
        { lat: 0.6, lon: 0.6 },
        { lat: -0.6, lon: 0.6 },
        { lat: 0.6, lon: -0.6 },
        { lat: -0.6, lon: -0.6 },
    ];

    const seenCities = new Set<string>();
    const allCities = [...basicResult.cities];

    for (const city of allCities) {
        seenCities.add(`${city.name}-${city.country}`.toLowerCase());
    }

    for (const offset of extendedOffsets) {
        if (allCities.length >= limit) break;

        const searchLat = lat + offset.lat;
        const searchLon = lon + offset.lon;

        try {
            const response = await fetch(
                `${GEO_URL}/reverse?lat=${searchLat}&lon=${searchLon}&limit=2`
            );

            if (!response.ok) continue;

            const data = await response.json();
            if (!Array.isArray(data)) continue;

            for (const item of data) {
                if (!item.name) continue;

                const cityKey = `${item.name}-${item.country}`.toLowerCase();
                if (seenCities.has(cityKey)) continue;
                seenCities.add(cityKey);

                const distance = calculateDistance(lat, lon, item.lat, item.lon);

                if (distance <= 150) {
                    allCities.push({
                        id: `${item.lat}-${item.lon}`,
                        name: item.name,
                        country: item.country || '',
                        state: item.state || '',
                        lat: item.lat,
                        lon: item.lon,
                        distance,
                        distanceText: formatDistance(distance),
                    });
                }
            }
        } catch {
            continue;
        }
    }

    allCities.sort((a, b) => a.distance - b.distance);

    return {
        cities: allCities.slice(0, limit),
        error: null,
    };
};
