import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
    /** Current value (0-100 for percentage, or custom range) */
    value: number;
    /** Maximum value for the progress (default: 100) */
    maxValue?: number;
    /** Size of the circular progress in pixels */
    size?: number;
    /** Width of the progress stroke */
    strokeWidth?: number;
    /** Color of the progress stroke (can be a single color or 'gradient') */
    progressColor?: string;
    /** Gradient colors for progress (used when progressColor is 'gradient') */
    gradientColors?: [string, string];
    /** Background track color */
    trackColor?: string;
    /** Animation duration in milliseconds */
    duration?: number;
    /** Children to render in the center */
    children?: React.ReactNode;
}

/**
 * A reusable circular progress indicator with animation support.
 * Uses react-native-svg for rendering and react-native-reanimated for animations.
 */
const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    maxValue = 100,
    size = 80,
    strokeWidth = 8,
    progressColor = '#38bdf8',
    gradientColors,
    trackColor = 'rgba(255, 255, 255, 0.1)',
    duration = 800,
    children,
}) => {
    // Validate and clamp value
    const safeValue = Math.max(0, Math.min(value, maxValue));
    const percentage = (safeValue / maxValue) * 100;

    // Calculate circle dimensions
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Animated progress value
    const animatedProgress = useDerivedValue(() => {
        return withTiming(percentage, {
            duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [percentage]);

    // Animated stroke dash offset
    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset =
            circumference - (circumference * animatedProgress.value) / 100;
        return {
            strokeDashoffset,
        };
    });

    const useGradient = gradientColors && gradientColors.length === 2;
    const gradientId = `progress-gradient-${size}`;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {useGradient && (
                    <Defs>
                        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={gradientColors[0]} />
                            <Stop offset="100%" stopColor={gradientColors[1]} />
                        </LinearGradient>
                    </Defs>
                )}

                {/* Background track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress arc */}
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={useGradient ? `url(#${gradientId})` : progressColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>

            {/* Center content */}
            <View style={styles.centerContent}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CircularProgress;
