import { ThemedText } from '@/components/themed-text';
import CircularProgress from '@/components/ui/CircularProgress';
import { MetricDetailModal } from '@/components/weather/MetricDetailModal';
import { Fonts } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

// ============================================================================
// SEVERITY COLOR UTILITIES
// ============================================================================

const getUVColor = (uvIndex: number): string => {
    if (uvIndex < 0 || !Number.isFinite(uvIndex)) return '#94a3b8';
    if (uvIndex <= 2) return '#22c55e';
    if (uvIndex <= 5) return '#eab308';
    if (uvIndex <= 7) return '#f97316';
    if (uvIndex <= 10) return '#ef4444';
    return '#a855f7';
};

const getUVDescription = (uvIndex: number): string => {
    if (uvIndex < 0 || !Number.isFinite(uvIndex)) return 'UV data unavailable';
    if (uvIndex <= 2) return 'Low risk from the sun\'s UV rays. Safe for most outdoor activities. No special protection needed.';
    if (uvIndex <= 5) return 'Moderate risk. Seek shade during midday hours when the sun is strongest. Wear sunscreen on exposed skin.';
    if (uvIndex <= 7) return 'High risk of harm from unprotected sun exposure. Reduce time in sun between 10am-4pm. Use sun protection: sunscreen SPF 30+, hat, sunglasses.';
    if (uvIndex <= 10) return 'Very high risk. Minimize sun exposure during midday hours. Shirt, sunscreen, and hat are essential. Seek shade whenever possible.';
    return 'Extreme risk of harm. Take all precautions. Avoid sun exposure from 10am-4pm. Seek shade, wear protective clothing, SPF 50+ sunscreen.';
};

const getAQIColor = (aqi: number): string => {
    if (aqi < 1 || aqi > 5 || !Number.isFinite(aqi)) return '#94a3b8';
    switch (aqi) {
        case 1: return '#22c55e';
        case 2: return '#eab308';
        case 3: return '#f97316';
        case 4: return '#ef4444';
        case 5: return '#a855f7';
        default: return '#94a3b8';
    }
};

const getAQIDescription = (aqi: number): string => {
    if (aqi < 1 || aqi > 5 || !Number.isFinite(aqi)) return 'Air quality data is currently unavailable for this location.';
    switch (aqi) {
        case 1: return 'Air quality is satisfactory. Air pollution poses little or no risk. Perfect conditions for outdoor activities.';
        case 2: return 'Air quality is acceptable for most people. However, unusually sensitive people may experience minor symptoms from prolonged exposure.';
        case 3: return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected. Sensitive groups should limit prolonged outdoor exertion.';
        case 4: return 'Some members of the general public may experience health effects. Sensitive groups may experience more serious effects. Reduce prolonged or heavy outdoor activities.';
        case 5: return 'Health alert. The entire population is more likely to be affected. Everyone should avoid prolonged outdoor activities. Stay indoors if possible.';
        default: return 'Air quality data is currently unavailable for this location.';
    }
};

const getHumidityGradient = (humidity: number): [string, string] => {
    if (humidity < 30) return ['#60a5fa', '#38bdf8'];
    if (humidity < 60) return ['#38bdf8', '#0ea5e9'];
    return ['#0ea5e9', '#0284c7'];
};

const getHumidityDescription = (humidity: number): string => {
    if (humidity < 0 || humidity > 100 || !Number.isFinite(humidity)) {
        return 'Humidity data is currently unavailable.';
    }
    if (humidity < 30) return 'Low humidity makes the air feel dry. This can cause dry skin, chapped lips, and static electricity. Consider using a humidifier indoors.';
    if (humidity < 60) return 'Comfortable humidity level. This is the ideal range for most people and activities. The air should feel pleasant.';
    if (humidity < 80) return 'High humidity makes the air feel sticky and can make temperatures feel warmer than they are. Sweating may not evaporate as quickly.';
    return 'Very high humidity. The air feels very sticky and oppressive. Temperatures may feel significantly hotter. Heat index warnings may be in effect.';
};

// ============================================================================
// METRIC EXPLANATIONS
// ============================================================================

const getFeelsLikeDescription = (temp: number): string => {
    if (!Number.isFinite(temp)) return 'Feels like temperature is currently unavailable.';
    if (temp < 0) return 'Feels extremely cold due to wind chill. Frostbite and hypothermia are possible with prolonged exposure. Dress in multiple warm layers.';
    if (temp < 10) return 'Feels cold. Wind and humidity make it feel colder than the actual temperature. Wear warm clothing and protect exposed skin.';
    if (temp < 20) return 'Feels cool. A light jacket or sweater is recommended for comfort, especially in shade or wind.';
    if (temp < 30) return 'Feels comfortable for most people. Light clothing is appropriate. Perfect weather for outdoor activities.';
    return 'Feels hot. The combination of temperature, humidity, and sun makes it feel warmer. Stay hydrated, seek shade, and limit strenuous outdoor activity.';
};

const getPressureDescription = (hPa: number): string => {
    if (!Number.isFinite(hPa)) return 'Pressure data is currently unavailable.';
    if (hPa < 1000) return 'Low atmospheric pressure often indicates stormy or unsettled weather approaching. Expect clouds, wind, or precipitation.';
    if (hPa < 1013) return 'Below average pressure. Weather conditions may be changing. Monitor forecasts for possible rain or wind.';
    if (hPa < 1020) return 'Normal atmospheric pressure. This typically indicates stable weather conditions with no major changes expected.';
    return 'High atmospheric pressure usually brings clear skies, light winds, and settled weather. Good conditions for outdoor activities.';
};

const getVisibilityDescription = (meters: number): string => {
    if (!Number.isFinite(meters) || meters < 0) return 'Visibility data is currently unavailable.';
    const km = meters / 1000;
    if (km < 1) return 'Very poor visibility due to fog, heavy rain, or smoke. Driving conditions are hazardous. Use low beams and reduce speed significantly.';
    if (km < 4) return 'Reduced visibility caused by haze, light fog, or precipitation. Drive carefully with headlights on and allow extra following distance.';
    if (km < 10) return 'Moderate visibility. Conditions are generally fair but some haze may be present. Normal precautions apply.';
    return 'Excellent visibility with clear atmospheric conditions. Perfect for outdoor activities, photography, and scenic views.';
};

const getSunTimesDescription = (sunrise: number, sunset: number): string => {
    if (!Number.isFinite(sunrise) || !Number.isFinite(sunset) || sunrise <= 0 || sunset <= 0) {
        return 'Sunrise and sunset data is currently unavailable.';
    }

    const now = Date.now() / 1000;
    const sunriseDate = new Date(sunrise * 1000);
    const sunsetDate = new Date(sunset * 1000);

    const daylightSeconds = sunset - sunrise;
    const hours = Math.floor(daylightSeconds / 3600);
    const minutes = Math.floor((daylightSeconds % 3600) / 60);

    let description = `Today you'll have ${hours} hours and ${minutes} minutes of daylight. `;

    if (now < sunrise) {
        description += 'The sun hasn\'t risen yet. Sunrise is coming soon.';
    } else if (now > sunset) {
        description += 'The sun has already set. Darkness until tomorrow\'s sunrise.';
    } else {
        const timeUntilSunset = sunset - now;
        const hoursUntilSunset = Math.floor(timeUntilSunset / 3600);
        if (hoursUntilSunset < 2) {
            description += 'Golden hour! Perfect time for photography and outdoor activities.';
        } else {
            description += 'Daylight hours remaining until sunset.';
        }
    }

    return description;
};

// ============================================================================
// INTERFACES
// ============================================================================

interface MetricCardProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
    iconColor?: string;
    description: string;
}

interface CircularMetricCardProps {
    label: string;
    value: number;
    maxValue: number;
    displayValue: string;
    progressColor: string;
    gradientColors?: [string, string];
    description: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface MetricsGridProps {
    feelsLike: number;
    humidity: number;
    pressure: number;
    visibility: number;
    sunrise: number;
    sunset: number;
    uvIndex?: number;
    aqi?: number;
}

interface ModalState {
    visible: boolean;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor: string;
    label: string;
    value: string;
    description: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

const MetricCard: React.FC<MetricCardProps & { onPress: () => void }> = ({
    icon,
    label,
    value,
    iconColor = '#a5b4fc',
    onPress,
}) => (
    <Pressable
        style={({ pressed }) => [
            styles.metricCard,
            pressed && styles.metricCardPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}. Tap for details.`}
    >
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        <ThemedText style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</ThemedText>
        <ThemedText style={styles.metricValue} numberOfLines={1}>{value}</ThemedText>
    </Pressable>
);

const CircularMetricCard: React.FC<CircularMetricCardProps & { onPress: () => void }> = ({
    label,
    value,
    maxValue,
    displayValue,
    progressColor,
    gradientColors,
    onPress,
    icon,
}) => (
    <Pressable
        style={({ pressed }) => [
            styles.metricCard,
            pressed && styles.metricCardPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue}. Tap for details.`}
    >
        <CircularProgress
            value={value}
            maxValue={maxValue}
            size={68}
            strokeWidth={6}
            progressColor={gradientColors ? 'gradient' : progressColor}
            gradientColors={gradientColors}
            trackColor="rgba(255, 255, 255, 0.08)"
        >
            <ThemedText style={styles.circularValue} numberOfLines={1}>{displayValue}</ThemedText>
        </CircularProgress>
        <ThemedText style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</ThemedText>
    </Pressable>
);

/**
 * Main MetricsGrid component - Fixed 2x3 grid layout
 */
const MetricsGrid: React.FC<MetricsGridProps> = ({
    feelsLike,
    humidity,
    pressure,
    visibility,
    sunrise,
    sunset,
    aqi,
}) => {
    const [modalState, setModalState] = useState<ModalState>({
        visible: false,
        icon: 'information',
        iconColor: '#94a3b8',
        label: '',
        value: '',
        description: '',
    });

    const showModal = useCallback((state: Omit<ModalState, 'visible'>) => {
        setModalState({ ...state, visible: true });
    }, []);

    const closeModal = useCallback(() => {
        setModalState((prev) => ({ ...prev, visible: false }));
    }, []);

    // Format time helper
    const formatTime = (timestamp: number): string => {
        if (!Number.isFinite(timestamp) || timestamp <= 0) return 'N/A';
        try {
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return 'N/A';
        }
    };

    // Validate values
    const safeFeelsLike = Number.isFinite(feelsLike) ? feelsLike : null;
    const safeHumidity = Number.isFinite(humidity) && humidity >= 0 && humidity <= 100 ? humidity : null;
    const safePressure = Number.isFinite(pressure) && pressure > 0 ? pressure : null;
    const safeVisibility = Number.isFinite(visibility) && visibility >= 0 ? visibility : null;
    const safeAQI = aqi !== undefined && Number.isFinite(aqi) && aqi >= 1 && aqi <= 5 ? aqi : null;

    return (
        <>
            <View style={styles.container}>
                {/* Row 1 */}
                <View style={styles.row}>
                    <CircularMetricCard
                        label="HUMIDITY"
                        value={safeHumidity ?? 0}
                        maxValue={100}
                        displayValue={safeHumidity !== null ? `${safeHumidity}%` : 'N/A'}
                        progressColor="#38bdf8"
                        gradientColors={safeHumidity !== null ? getHumidityGradient(safeHumidity) : undefined}
                        description={getHumidityDescription(safeHumidity ?? -1)}
                        icon="water-percent"
                        onPress={() => showModal({
                            icon: 'water-percent',
                            iconColor: '#38bdf8',
                            label: 'Humidity',
                            value: safeHumidity !== null ? `${safeHumidity}%` : 'N/A',
                            description: getHumidityDescription(safeHumidity ?? -1),
                        })}
                    />
                    <MetricCard
                        icon="thermometer"
                        label="FEELS LIKE"
                        value={safeFeelsLike !== null ? `${Math.round(safeFeelsLike)}°C` : 'N/A'}
                        iconColor="#f87171"
                        description={getFeelsLikeDescription(safeFeelsLike ?? NaN)}
                        onPress={() => showModal({
                            icon: 'thermometer',
                            iconColor: '#f87171',
                            label: 'Feels Like',
                            value: safeFeelsLike !== null ? `${Math.round(safeFeelsLike)}°C` : 'N/A',
                            description: getFeelsLikeDescription(safeFeelsLike ?? NaN),
                        })}
                    />
                </View>

                {/* Row 2 */}
                <View style={styles.row}>
                    {safeAQI !== null ? (
                        <CircularMetricCard
                            label="AIR QUALITY"
                            value={safeAQI}
                            maxValue={5}
                            displayValue={`${safeAQI}`}
                            progressColor={getAQIColor(safeAQI)}
                            description={getAQIDescription(safeAQI)}
                            icon="air-filter"
                            onPress={() => showModal({
                                icon: 'air-filter',
                                iconColor: getAQIColor(safeAQI),
                                label: 'Air Quality Index',
                                value: `AQI ${safeAQI}`,
                                description: getAQIDescription(safeAQI),
                            })}
                        />
                    ) : (
                        <MetricCard
                            icon="gauge"
                            label="PRESSURE"
                            value={safePressure !== null ? `${safePressure} hPa` : 'N/A'}
                            iconColor="#a78bfa"
                            description={getPressureDescription(safePressure ?? NaN)}
                            onPress={() => showModal({
                                icon: 'gauge',
                                iconColor: '#a78bfa',
                                label: 'Pressure',
                                value: safePressure !== null ? `${safePressure} hPa` : 'N/A',
                                description: getPressureDescription(safePressure ?? NaN),
                            })}
                        />
                    )}
                    <MetricCard
                        icon="eye"
                        label="VISIBILITY"
                        value={safeVisibility !== null ? `${(safeVisibility / 1000).toFixed(1)} km` : 'N/A'}
                        iconColor="#4ade80"
                        description={getVisibilityDescription(safeVisibility ?? NaN)}
                        onPress={() => showModal({
                            icon: 'eye',
                            iconColor: '#4ade80',
                            label: 'Visibility',
                            value: safeVisibility !== null ? `${(safeVisibility / 1000).toFixed(1)} km` : 'N/A',
                            description: getVisibilityDescription(safeVisibility ?? NaN),
                        })}
                    />
                </View>

                {/* Row 3 */}
                <View style={styles.row}>
                    {safeAQI !== null && (
                        <MetricCard
                            icon="gauge"
                            label="PRESSURE"
                            value={safePressure !== null ? `${safePressure} hPa` : 'N/A'}
                            iconColor="#a78bfa"
                            description={getPressureDescription(safePressure ?? NaN)}
                            onPress={() => showModal({
                                icon: 'gauge',
                                iconColor: '#a78bfa',
                                label: 'Pressure',
                                value: safePressure !== null ? `${safePressure} hPa` : 'N/A',
                                description: getPressureDescription(safePressure ?? NaN),
                            })}
                        />
                    )}
                    <Pressable
                        style={({ pressed }) => [
                            styles.sunTimesCard,
                            pressed && styles.metricCardPressed,
                        ]}
                        onPress={() => showModal({
                            icon: 'weather-sunny',
                            iconColor: '#fbbf24',
                            label: 'Sun Times',
                            value: `${formatTime(sunrise)} - ${formatTime(sunset)}`,
                            description: getSunTimesDescription(sunrise, sunset),
                        })}
                        accessibilityRole="button"
                        accessibilityLabel="Sun times. Tap for details."
                    >
                        <View style={styles.sunTimesRow}>
                            <View style={styles.sunTimeItem}>
                                <MaterialCommunityIcons name="weather-sunset-up" size={20} color="#fbbf24" />
                                <ThemedText style={styles.sunTimeLabel}>SUNRISE</ThemedText>
                                <ThemedText style={styles.sunTimeValue}>{formatTime(sunrise)}</ThemedText>
                            </View>
                            <View style={styles.sunTimeDivider} />
                            <View style={styles.sunTimeItem}>
                                <MaterialCommunityIcons name="weather-sunset-down" size={20} color="#fb923c" />
                                <ThemedText style={styles.sunTimeLabel}>SUNSET</ThemedText>
                                <ThemedText style={styles.sunTimeValue}>{formatTime(sunset)}</ThemedText>
                            </View>
                        </View>
                    </Pressable>
                </View>
            </View>

            <MetricDetailModal
                visible={modalState.visible}
                onClose={closeModal}
                icon={modalState.icon}
                iconColor={modalState.iconColor}
                label={modalState.label}
                value={modalState.value}
                description={modalState.description}
            />
        </>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    metricCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 8,
        height: 120,
        ...Platform.select({
            ios: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                elevation: 2,
            },
            web: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
            },
        }),
    },
    metricCardPressed: {
        opacity: 0.7,
    },
    sunTimesCard: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        height: 120,
        ...Platform.select({
            ios: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                elevation: 2,
            },
            web: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
            },
        }),
    },
    sunTimesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
    },
    sunTimeItem: {
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    sunTimeDivider: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    sunTimeLabel: {
        fontSize: 10,
        fontFamily: Fonts.sans,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sunTimeValue: {
        fontSize: 16,
        fontFamily: Fonts.rounded,
        fontWeight: '600',
        color: '#ffffff',
    },
    circularValue: {
        fontSize: 16,
        fontFamily: Fonts.rounded,
        fontWeight: '700',
        color: '#ffffff',
    },
    metricLabel: {
        fontSize: 12,
        fontFamily: Fonts.sans,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
        width: '100%',
    },
    metricValue: {
        fontSize: 20,
        fontFamily: Fonts.rounded,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
    },
});

export default MetricsGrid;
