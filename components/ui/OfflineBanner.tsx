import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OfflineBannerProps {
    isOffline: boolean;
    lastUpdated?: Date | null;
}

/**
 * Format time ago string
 */
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
    isOffline,
    lastUpdated,
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isOffline) {
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            translateY.value = withSpring(-100, { damping: 15, stiffness: 150 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [isOffline]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    if (!isOffline) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { paddingTop: insets.top + 8 },
                animatedStyle,
            ]}
        >
            <View style={styles.content}>
                <MaterialCommunityIcons
                    name="wifi-off"
                    size={18}
                    color="#fbbf24"
                />
                <ThemedText style={styles.text}>
                    Offline
                    {lastUpdated && (
                        <ThemedText style={styles.subtext}>
                            {' · Last updated: '}
                            {formatTimeAgo(lastUpdated)}
                        </ThemedText>
                    )}
                </ThemedText>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(251, 191, 36, 0.3)',
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
    },
    text: {
        fontSize: 14,
        fontFamily: Fonts.sans,
        fontWeight: '600',
        color: '#fbbf24',
    },
    subtext: {
        fontWeight: '400',
        color: 'rgba(251, 191, 36, 0.8)',
    },
});

export default OfflineBanner;
