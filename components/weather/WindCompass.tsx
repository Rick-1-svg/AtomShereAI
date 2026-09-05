import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import Svg, {
    Circle,
    Defs,
    G,
    Line,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText,
} from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

interface WindCompassProps {
    direction: number; // Wind direction in degrees (0-360, 0 = North)
    speed: number; // Wind speed
    size?: number;
    unit?: string;
}

const CARDINAL_DIRECTIONS = [
    { label: 'N', angle: 0 },
    { label: 'NE', angle: 45 },
    { label: 'E', angle: 90 },
    { label: 'SE', angle: 135 },
    { label: 'S', angle: 180 },
    { label: 'SW', angle: 225 },
    { label: 'W', angle: 270 },
    { label: 'NW', angle: 315 },
];

/**
 * Get wind direction label from degrees
 */
const getDirectionLabel = (degrees: number): string => {
    const normalized = ((degrees % 360) + 360) % 360;
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(normalized / 22.5) % 16;
    return directions[index];
};

export const WindCompass: React.FC<WindCompassProps> = ({
    direction,
    speed,
    size = 140,
    unit = 'mph',
}) => {
    const rotation = useSharedValue(0);
    const center = size / 2;
    const outerRadius = (size / 2) - 10;
    const innerRadius = outerRadius - 25;
    const needleLength = innerRadius - 10;

    // Animate to wind direction on mount and when direction changes
    useEffect(() => {
        rotation.value = withSpring(direction, {
            damping: 15,
            stiffness: 100,
            mass: 1,
        });
    }, [direction]);

    const animatedNeedleStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    // Generate tick marks
    const tickMarks = [];
    for (let i = 0; i < 36; i++) {
        const angle = (i * 10 * Math.PI) / 180;
        const isCardinal = i % 9 === 0;
        const isMajor = i % 3 === 0;
        const tickLength = isCardinal ? 12 : isMajor ? 8 : 4;
        const startRadius = outerRadius - tickLength;

        tickMarks.push({
            x1: center + startRadius * Math.sin(angle),
            y1: center - startRadius * Math.cos(angle),
            x2: center + outerRadius * Math.sin(angle),
            y2: center - outerRadius * Math.cos(angle),
            isCardinal,
            isMajor,
        });
    }

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                <Defs>
                    <LinearGradient id="needleGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#f97316" />
                        <Stop offset="100%" stopColor="#ea580c" />
                    </LinearGradient>
                    <LinearGradient id="compassBg" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                        <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                    </LinearGradient>
                </Defs>

                {/* Background circle */}
                <Circle
                    cx={center}
                    cy={center}
                    r={outerRadius}
                    fill="url(#compassBg)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={1}
                />

                {/* Inner circle */}
                <Circle
                    cx={center}
                    cy={center}
                    r={innerRadius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                />

                {/* Tick marks */}
                {tickMarks.map((tick, index) => (
                    <Line
                        key={index}
                        x1={tick.x1}
                        y1={tick.y1}
                        x2={tick.x2}
                        y2={tick.y2}
                        stroke={tick.isCardinal ? 'rgba(255,255,255,0.8)' : tick.isMajor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}
                        strokeWidth={tick.isCardinal ? 2 : 1}
                    />
                ))}

                {/* Cardinal direction labels */}
                {CARDINAL_DIRECTIONS.filter((_, i) => i % 2 === 0).map((dir) => {
                    const angle = (dir.angle * Math.PI) / 180;
                    const labelRadius = outerRadius - 22;
                    const x = center + labelRadius * Math.sin(angle);
                    const y = center - labelRadius * Math.cos(angle);

                    return (
                        <SvgText
                            key={dir.label}
                            x={x}
                            y={y + 4}
                            fill={dir.label === 'N' ? '#f97316' : 'rgba(0, 0, 0, 1)'}
                            fontSize={dir.label === 'N' ? 14 : 11}
                            fontWeight={dir.label === 'N' ? 'bold' : 'normal'}
                            textAnchor="middle"
                        >
                            {dir.label}
                        </SvgText>
                    );
                })}

                {/* Center circle */}
                <Circle
                    cx={center}
                    cy={center}
                    r={8}
                    fill="#0f172a"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={2}
                />
            </Svg>

            {/* Animated needle overlay */}
            <Animated.View style={[styles.needleContainer, { width: size, height: size }, animatedNeedleStyle]}>
                <Svg width={size} height={size}>
                    {/* Needle - pointing up by default, rotates to wind direction */}
                    <G transform={`translate(${center}, ${center})`}>
                        {/* Needle body (triangle pointing up) */}
                        <Path
                            d={`M 0 ${-needleLength} L -6 10 L 0 4 L 6 10 Z`}
                            fill="url(#needleGradient)"
                        />
                        {/* Tail (smaller triangle) */}
                        <Path
                            d={`M 0 ${needleLength * 0.3} L -4 -5 L 4 -5 Z`}
                            fill="rgba(255,255,255,0.3)"
                        />
                    </G>
                </Svg>
            </Animated.View>

            {/* Center text overlay */}
            <View style={[styles.centerText, { width: size, height: size }]}>
                <ThemedText style={styles.speedText}>{Math.round(speed)}</ThemedText>
                <ThemedText style={styles.unitText}>{unit}</ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    needleContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    centerText: {
        position: 'absolute',
        top: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    speedText: {
        fontSize: 18,
        fontFamily: Fonts.rounded,
        fontWeight: '700',
        color: '#000000ff',
        marginTop: 40,
    },
    unitText: {
        fontSize: 10,
        fontFamily: Fonts.sans,
        color: 'rgba(0, 0, 0, 1)',
        marginTop: -2,
    },
});

export default WindCompass;
