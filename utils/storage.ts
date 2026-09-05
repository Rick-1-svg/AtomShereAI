import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Check if localStorage is available (not available in SSR/Node environments)
 */
const isLocalStorageAvailable = (): boolean => {
    if (Platform.OS !== 'web') return false;
    try {
        const testKey = '__storage_test__';
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

/**
 * Platform-specific storage adapter for Zustand persist middleware.
 * 
 * Uses localStorage on web (which works synchronously and reliably in browsers)
 * and AsyncStorage on native platforms (iOS/Android).
 * Falls back safely when localStorage is unavailable (SSR/Node contexts).
 * 
 * This resolves hydration issues on web where AsyncStorage may not work correctly.
 */
export const platformStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            if (isLocalStorageAvailable()) {
                try {
                    return localStorage.getItem(name);
                } catch {
                    console.warn('[platformStorage] localStorage.getItem failed:', name);
                    return null;
                }
            }
            // In SSR/Node context, return null to allow hydration to proceed with defaults
            return null;
        }
        return AsyncStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (isLocalStorageAvailable()) {
                try {
                    localStorage.setItem(name, value);
                } catch {
                    console.warn('[platformStorage] localStorage.setItem failed:', name);
                }
            }
            // In SSR/Node context, do nothing
            return;
        }
        return AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (isLocalStorageAvailable()) {
                try {
                    localStorage.removeItem(name);
                } catch {
                    console.warn('[platformStorage] localStorage.removeItem failed:', name);
                }
            }
            // In SSR/Node context, do nothing
            return;
        }
        return AsyncStorage.removeItem(name);
    },
};
