import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { HourlyForecast } from '@/types/weather';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming,
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

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface PrecipitationChartProps {
    data: HourlyForecast[];
    height?: number;
    showLabels?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 16;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2 - 32;
const DEFAULT_HEIGHT = 120;

/**
 * Creates SVG path data for a smooth curve through points
 */
const createSmoothPath = (
    points: { x: number; y: number }[],
    width: number,
    height: number
): string => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const controlX = (current.x + next.x) / 2;

        path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
};

/**
 * Creates SVG path data for the filled area under the curve
 */
const createAreaPath = (
    points: { x: number; y: number }[],
    width: number,
    height: number
): string => {
    if (points.length < 2) return '';

    const linePath = createSmoothPath(points, width, height);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];

    return `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;
};

export const PrecipitationChart: React.FC<PrecipitationChartProps> = ({
    data,
    height = DEFAULT_HEIGHT,
    showLabels = true,
}) => {
    const animationProgress = useSharedValue(0);

    // Take first 24 hours of data
    const chartData = data.slice(0, 24);
    const maxPop = Math.max(...chartData.map((d) => d.pop), 10); // Min 10% for scale

    // Calculate points
    const points = chartData.map((item, index) => ({
        x: (index / (chartData.length - 1)) * CHART_WIDTH,
        y: height - 50 - ((item.pop / maxPop) * (height - 60)),
    }));

    const linePath = createSmoothPath(points, CHART_WIDTH, height - 50);
    const areaPath = createAreaPath(points, CHART_WIDTH, height - 40);

    // Animate on mount
    useEffect(() => {
        animationProgress.value = withTiming(1, {
            duration: 1000,
            easing: Easing.out(Easing.cubic),
        });
    }, []);

    const animatedLineProps = useAnimatedProps(() => ({
        strokeDashoffset: (1 - animationProgress.value) * 1000,
    }));

    const animatedAreaProps = useAnimatedProps(() => ({
        opacity: animationProgress.value,
    }));

    // Generate hour labels (every 6 hours)
    const hourLabels = [0, 6, 12, 18, 23].map((index) => ({
        x: (index / (chartData.length - 1)) * CHART_WIDTH,
        label: chartData[index]?.time || '',
    }));

    // Y-axis labels
    const yLabels = [0, 50, 100];

    if (!chartData.length) {
        return (
            <View style={[styles.container, { height }]}>
                <ThemedText style={styles.noDataText}>No precipitation data</ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }]}>
            <ThemedText style={styles.title}>Precipitation Probability</ThemedText>

            <Svg
                width={CHART_WIDTH + 40}
                height={height - 20}
                style={styles.svg}
            >
                <Defs>
                    <LinearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
                    </LinearGradient>
                </Defs>

                {/* Y-axis grid lines */}
                <G>
                    {yLabels.map((value) => {
                        const y = height - 50 - ((value / 100) * (height - 50));
                        return (
                            <React.Fragment key={value}>
                                <Line
                                    x1={30}
                                    y1={y}
                                    x2={CHART_WIDTH + 30}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth={1}
                                    strokeDasharray="4,4"
                                />
                                <SvgText
                                    x={25}
                                    y={y + 4}
                                    fill="rgba(255,255,255,0.5)"
                                    fontSize={10}
                                    textAnchor="end"
                                >
                                    {value}%
                                </SvgText>
                            </React.Fragment>
                        );
                    })}
                </G>

                {/* Translated group for chart area */}
                <G transform="translate(30, 0)">
                    {/* Filled area */}
                    <AnimatedPath
                        d={areaPath}
                        fill="url(#precipGradient)"
                        animatedProps={animatedAreaProps}
                    />

                    {/* Line */}
                    <AnimatedPath
                        d={linePath}
                        stroke="#0ea5e9"
                        strokeWidth={2.5}
                        fill="none"
                        strokeDasharray={1000}
                        animatedProps={animatedLineProps}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.filter((_, i) => i % 4 === 0).map((point, index) => (
                        <Circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r={4}
                            fill="#0ea5e9"
                            stroke="#0f172a"
                            strokeWidth={2}
                        />
                    ))}

                    {/* X-axis labels */}
                    {showLabels && hourLabels.map((label, index) => (
                        <SvgText
                            key={index}
                            x={label.x}
                            y={height - 25}
                            fill="rgba(255,255,255,0.6)"
                            fontSize={10}
                            textAnchor="middle"
                        >
                            {label.label}
                        </SvgText>
                    ))}
                </G>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: CHART_PADDING,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    title: {
        fontSize: 15,
        fontFamily: Fonts.sans,
        color: '#64c2f8ff',
        marginBottom: 8,
        fontWeight: '500',
    },
    svg: {
        alignSelf: 'center',
    },
    noDataText: {
        textAlign: 'center',
        color: '#64c2f8ff',
        marginTop: 20,
    },
});

export default PrecipitationChart;
