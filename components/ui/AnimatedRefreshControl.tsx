import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

interface AnimatedRefreshControlProps {
    refreshing: boolean;
    onRefresh: () => void;
    colors?: string[];
    tintColor?: string;
}

/**
 * Custom animated refresh control with weather-themed animation.
 * Shows a spinning sun that transitions when refreshing.
 */
export const AnimatedRefreshControl: React.FC<AnimatedRefreshControlProps> = ({
    refreshing,
    onRefresh,
    colors = ['#fbbf24'],
    tintColor = '#fbbf24',
}) => {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (refreshing) {
            // Start rotation animation
            rotation.value = withRepeat(
                withTiming(360, {
                    duration: 1500,
                    easing: Easing.linear,
                }),
                -1, // Infinite repeat
                false
            );
            // Pulse scale
            scale.value = withRepeat(
                withTiming(1.1, {
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                }),
                -1,
                true // Reverse
            );
        } else {
            // Stop animations
            cancelAnimation(rotation);
            cancelAnimation(scale);
            rotation.value = withTiming(0, { duration: 300 });
            scale.value = withTiming(1, { duration: 300 });
        }

        return () => {
            cancelAnimation(rotation);
            cancelAnimation(scale);
        };
    }, [refreshing, rotation, scale]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${rotation.value}deg` },
                { scale: scale.value },
            ],
        };
    });

    const renderCustomIndicator = () => (
        <View style={styles.indicatorContainer}>
            <Animated.View style={[styles.iconWrapper, animatedStyle]}>
                <MaterialCommunityIcons
                    name={refreshing ? 'loading' : 'weather-sunny'}
                    size={28}
                    color={tintColor}
                />
            </Animated.View>
        </View>
    );

    return (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={colors}
            tintColor={tintColor}
            progressBackgroundColor="rgba(30, 30, 50, 0.9)"
            style={styles.refreshControl}
        />
    );
};

const styles = StyleSheet.create({
    refreshControl: {
        backgroundColor: 'transparent',
    },
    indicatorContainer: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        padding: 8,
    },
});

export default AnimatedRefreshControl;
