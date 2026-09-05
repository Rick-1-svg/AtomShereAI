import { ThemedText } from '@/components/themed-text';
import WeatherIcon from '@/components/weather/WeatherIcon';
import { Fonts } from '@/constants/theme';
import { DailyForecast, HourlyForecast } from '@/types/weather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ForecastDetailModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'hourly' | 'daily';
    hourlyData?: HourlyForecast;
    dailyData?: DailyForecast;
}

interface DetailRowProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
    iconColor?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value, iconColor = '#94a3b8' }) => (
    <View style={styles.detailRow}>
        <View style={styles.detailLeft}>
            <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
            <ThemedText style={styles.detailLabel}>{label}</ThemedText>
        </View>
        <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
);

/**
 * Modal showing detailed breakdown of a forecast item.
 * Supports both hourly and daily forecast data.
 */
export const ForecastDetailModal: React.FC<ForecastDetailModalProps> = ({
    visible,
    onClose,
    type,
    hourlyData,
    dailyData,
}) => {
    // Validate data
    if (type === 'hourly' && !hourlyData) return null;
    if (type === 'daily' && !dailyData) return null;

    const renderHourlyDetails = () => {
        if (!hourlyData) return null;

        return (
            <>
                <View style={styles.header}>
                    <View style={styles.mainInfo}>
                        <WeatherIcon
                            description={hourlyData.description}
                            iconCode={hourlyData.icon}
                            size={48}
                        />
                        <View style={styles.mainText}>
                            <ThemedText style={styles.time}>{hourlyData.time}</ThemedText>
                            <ThemedText style={styles.description}>
                                {hourlyData.description}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.temperature}>
                        {Math.round(hourlyData.temp)}°F
                    </ThemedText>
                </View>

                <View style={styles.divider} />

                <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                    <DetailRow
                        icon="thermometer"
                        label="Feels Like"
                        value={`${Math.round(hourlyData.feels_like ?? hourlyData.temp)}°F`}
                        iconColor="#f87171"
                    />
                    <DetailRow
                        icon="water-percent"
                        label="Humidity"
                        value={`${hourlyData.humidity ?? 'N/A'}%`}
                        iconColor="#38bdf8"
                    />
                    <DetailRow
                        icon="weather-windy"
                        label="Wind Speed"
                        value={`${hourlyData.wind_speed ?? 'N/A'} m/s`}
                        iconColor="#a78bfa"
                    />
                    <DetailRow
                        icon="weather-rainy"
                        label="Precipitation"
                        value={`${hourlyData.pop}%`}
                        iconColor="#60a5fa"
                    />
                    <DetailRow
                        icon="weather-rainy"
                        label="Precipitation"
                        value={`${hourlyData.pop}%`}
                        iconColor="#60a5fa"
                    />
                </ScrollView>
            </>
        );
    };

    const renderDailyDetails = () => {
        if (!dailyData) return null;

        return (
            <>
                <View style={styles.header}>
                    <View style={styles.mainInfo}>
                        <WeatherIcon
                            description={dailyData.description}
                            iconCode={dailyData.icon}
                            size={48}
                        />
                        <View style={styles.mainText}>
                            <ThemedText style={styles.time}>{dailyData.day_name}</ThemedText>
                            <ThemedText style={styles.description}>
                                {dailyData.description}
                            </ThemedText>
                        </View>
                    </View>
                    <View style={styles.tempRange}>
                        <ThemedText style={styles.tempHigh}>{Math.round(dailyData.temp_max)}°</ThemedText>
                        <ThemedText style={styles.tempLow}>{Math.round(dailyData.temp_min)}°</ThemedText>
                    </View>
                </View>

                <View style={styles.divider} />

                <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                    <DetailRow
                        icon="thermometer-chevron-up"
                        label="High Temperature"
                        value={`${Math.round(dailyData.temp_max)}°`}
                        iconColor="#f87171"
                    />
                    <DetailRow
                        icon="thermometer-chevron-down"
                        label="Low Temperature"
                        value={`${Math.round(dailyData.temp_min)}°`}
                        iconColor="#60a5fa"
                    />
                    <DetailRow
                        icon="weather-rainy"
                        label="Precipitation"
                        value={`${dailyData.pop}%`}
                        iconColor="#38bdf8"
                    />
                    <DetailRow
                        icon="water-percent"
                        label="Humidity"
                        value={`${dailyData.humidity ?? 'N/A'}%`}
                        iconColor="#0ea5e9"
                    />
                    <DetailRow
                        icon="weather-windy"
                        label="Wind Speed"
                        value={`${dailyData.wind_speed ?? 'N/A'} m/s`}
                        iconColor="#a78bfa"
                    />
                    <DetailRow
                        icon="white-balance-sunny"
                        label="UV Index"
                        value={`${dailyData.uv_index ?? 'N/A'}`}
                        iconColor="#fbbf24"
                    />
                    {dailyData.sunrise && (
                        <DetailRow
                            icon="weather-sunset-up"
                            label="Sunrise"
                            value={dailyData.sunrise}
                            iconColor="#fb923c"
                        />
                    )}
                    {dailyData.sunset && (
                        <DetailRow
                            icon="weather-sunset-down"
                            label="Sunset"
                            value={dailyData.sunset}
                            iconColor="#f97316"
                        />
                    )}
                </ScrollView>
            </>
        );
    };

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={styles.modalContainer}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <BlurView
                            intensity={80}
                            tint="dark"
                            style={styles.modalContent}
                        >
                            <Pressable
                                onPress={onClose}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color="#94a3b8"
                                />
                            </Pressable>

                            {type === 'hourly' ? renderHourlyDetails() : renderDailyDetails()}
                        </BlurView>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 360,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        maxHeight: 500,
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(30, 30, 50, 0.95)',
            },
            web: {
                backgroundColor: 'rgba(30, 30, 50, 0.95)',
            },
        }),
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingRight: 32,
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    mainText: {
        flex: 1,
    },
    time: {
        fontSize: 18,
        fontFamily: Fonts.rounded,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        fontFamily: Fonts.sans,
        color: '#94a3b8',
        textTransform: 'capitalize',
    },
    temperature: {
        fontSize: 29,
        fontFamily: Fonts.rounded,
        fontWeight: '700',
        color: '#ffffff',
    },
    tempRange: {
        alignItems: 'flex-end',
    },
    tempHigh: {
        fontSize: 28,
        fontFamily: Fonts.rounded,
        fontWeight: '700',
        color: '#ffffff',
    },
    tempLow: {
        fontSize: 18,
        fontFamily: Fonts.rounded,
        fontWeight: '500',
        color: '#94a3b8',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16,
    },
    detailsContainer: {
        maxHeight: 300,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: Fonts.sans,
        color: '#94a3b8',
    },
    detailValue: {
        fontSize: 16,
        fontFamily: Fonts.rounded,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default ForecastDetailModal;
