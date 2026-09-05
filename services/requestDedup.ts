/**
 * Request deduplication utility to prevent duplicate concurrent API calls
 */

// Map to store pending requests by key
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate concurrent requests to the same resource
 * If a request with the same key is already in flight, return that promise
 * @param key Unique identifier for the request (e.g., "weather-40.7128--74.006")
 * @param fetchFn The async function to execute
 * @returns Promise with the result
 */
export async function deduplicateRequest<T>(
    key: string,
    fetchFn: () => Promise<T>
): Promise<T> {
    // Check if there's already a pending request for this key
    const existing = pendingRequests.get(key);
    if (existing) {
        console.log(`🔗 Dedup: Reusing existing request for key: ${key}`);
        return existing as Promise<T>;
    }

    console.log(`🌐 Dedup: New request for key: ${key}`);

    // Create new request and store it
    const request = fetchFn()
        .finally(() => {
            // Remove from pending requests when complete (success or error)
            pendingRequests.delete(key);
        });

    pendingRequests.set(key, request);

    return request;
}

/**
 * Generate a cache key for weather requests
 */
export function getWeatherKey(lat: number, lon: number, type: string): string {
    // Round to 4 decimal places for reasonable precision (~11m accuracy)
    const latRounded = lat.toFixed(4);
    const lonRounded = lon.toFixed(4);
    return `${type}-${latRounded}-${lonRounded}`;
}

/**
 * Clear all pending requests (useful for testing or cleanup)
 */
export function clearPendingRequests(): void {
    pendingRequests.clear();
}

/**
 * Get the number of pending requests (useful for debugging)
 */
export function getPendingRequestCount(): number {
    return pendingRequests.size;
}
