import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

interface NetworkStatus {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string;
}

/**
 * Hook to monitor network connectivity status
 * Returns current connection state and provides reconnection callbacks
 */
export const useNetworkStatus = () => {
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
    });
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        // Get initial state
        NetInfo.fetch().then((state: NetInfoState) => {
            setNetworkStatus({
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            });
        });

        // Subscribe to network state changes
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const isNowConnected = state.isConnected ?? false;

            // Track if we were offline and now online (for triggering refresh)
            if (!networkStatus.isConnected && isNowConnected) {
                setWasOffline(true);
            }

            setNetworkStatus({
                isConnected: isNowConnected,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            });
        });

        return () => unsubscribe();
    }, []);

    // Reset the wasOffline flag after it's been consumed
    const clearWasOffline = useCallback(() => {
        setWasOffline(false);
    }, []);

    return {
        isConnected: networkStatus.isConnected,
        isInternetReachable: networkStatus.isInternetReachable,
        connectionType: networkStatus.type,
        isOffline: !networkStatus.isConnected,
        wasOffline, // True when just came back online
        clearWasOffline,
    };
};

export default useNetworkStatus;
