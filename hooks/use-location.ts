import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  location: Location.LocationObject | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
  hasPermission: boolean;
}

export interface LocationActions {
  requestLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export const useLocation = (): LocationState & LocationActions => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const hasPermission = permissionStatus === Location.PermissionStatus.GRANTED;

  // Check current permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      console.log('🔐 useLocation: Checking initial permission status...');
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        console.log('🔐 useLocation: Current permission status:', status);
        setPermissionStatus(status);
      } catch (err) {
        console.error('❌ useLocation: Error checking location permission:', err);
        setError('Failed to check location permission');
      }
    };
    
    checkPermission();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log('🔐 useLocation: Requesting location permission...');
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('🔐 useLocation: Permission request result:', status);
      setPermissionStatus(status);
      
      if (status !== Location.PermissionStatus.GRANTED) {
        const errorMsg = 'Location permission was denied. Please enable location access in your device settings.';
        console.warn('⚠️ useLocation: Permission denied:', errorMsg);
        setError(errorMsg);
        return false;
      }
      
      console.log('✅ useLocation: Permission granted successfully');
      return true;
    } catch (err) {
      console.error('❌ useLocation: Error requesting location permission:', err);
      setError('Failed to request location permission');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Location.LocationObject | null> => {
    console.log('📍 useLocation: Getting current location...');
    try {
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // 5 seconds timeout
      });
      console.log('📍 useLocation: Location obtained:', {
        lat: locationResult.coords.latitude,
        lon: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy
      });
      return locationResult;
    } catch (err) {
      console.error('❌ useLocation: Error getting current location:', err);
      throw new Error('Failed to get current location. Please check your GPS settings.');
    }
  }, []);

  const requestLocation = useCallback(async () => {
    console.log('🎯 useLocation: requestLocation called, hasPermission:', hasPermission);
    
    if (!hasPermission) {
      console.log('🔐 useLocation: No permission, requesting...');
      const granted = await requestPermission();
      if (!granted) {
        console.log('❌ useLocation: Permission not granted, aborting');
        return;
      }
    }

    console.log('📍 useLocation: Starting location fetch...');
    setLoading(true);
    setError(null);

    try {
      const locationResult = await getCurrentLocation();
      console.log('✅ useLocation: Location set successfully');
      setLocation(locationResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      console.error('❌ useLocation: Location fetch failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('🏁 useLocation: Location request completed');
    }
  }, [hasPermission, requestPermission, getCurrentLocation]);

  const refreshLocation = useCallback(async () => {
    if (!hasPermission) {
      setError('Location permission not granted');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const locationResult = await getCurrentLocation();
      setLocation(locationResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh location';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [hasPermission, getCurrentLocation]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    hasPermission,
    requestLocation,
    refreshLocation,
    requestPermission,
  };
};