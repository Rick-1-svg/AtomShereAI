import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'search_queue';
const MAX_QUEUE_SIZE = 10;

interface QueuedSearch {
    query: string;
    timestamp: number;
}

/**
 * Add a search query to the queue (for offline mode)
 */
export const queueSearch = async (query: string): Promise<void> => {
    try {
        const existing = await getQueue();

        // Don't add duplicates
        if (existing.some((item) => item.query === query)) {
            return;
        }

        const newQueue: QueuedSearch[] = [
            ...existing,
            { query, timestamp: Date.now() },
        ].slice(-MAX_QUEUE_SIZE); // Keep only last 10

        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    } catch (error) {
        console.error('Error queuing search:', error);
    }
};

/**
 * Get all queued searches
 */
export const getQueue = async (): Promise<QueuedSearch[]> => {
    try {
        const queue = await AsyncStorage.getItem(QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error('Error getting search queue:', error);
        return [];
    }
};

/**
 * Clear the search queue
 */
export const clearQueue = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
        console.error('Error clearing search queue:', error);
    }
};

/**
 * Get and clear the queue (atomic operation for processing)
 */
export const popQueue = async (): Promise<QueuedSearch[]> => {
    const queue = await getQueue();
    await clearQueue();
    return queue;
};

/**
 * Check if there are pending searches
 */
export const hasQueuedSearches = async (): Promise<boolean> => {
    const queue = await getQueue();
    return queue.length > 0;
};
