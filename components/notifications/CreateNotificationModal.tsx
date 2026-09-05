import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useWeatherStore } from '@/hooks/stores/use-weather-store';
import {
    AirQualityAlertRule,
    CloseWindowsRule,
    EveningSummaryRule,
    FrostFreezeRule,
    getDefaultRuleValues,
    getNotificationTypeInfo,
    GoldenHourRule,
    HeatingCoolingRule,
    HeatWaveRule,
    HumidityAlertRule,
    MorningSummaryRule,
    NOTIFICATION_TYPES,
    NotificationRule,
    NotificationRuleType,
    RainAlertRule,
    SnowAlertRule,
    StormApproachingRule,
    TemperatureThresholdRule,
    VisibilityAlertRule,
} from '@/types/notifications';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateNotificationModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (rule: NotificationRule) => void;
    editingRule?: NotificationRule | null;
}

type Step = 'select_type' | 'configure' | 'select_location';

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
    visible,
    onClose,
    onSave,
    editingRule,
}) => {
    const [step, setStep] = useState<Step>(editingRule ? 'configure' : 'select_type');
    const [selectedType, setSelectedType] = useState<NotificationRuleType | null>(
        editingRule?.type || null
    );
    const [ruleConfig, setRuleConfig] = useState<Partial<NotificationRule>>(
        editingRule || {}
    );

    const { favoriteCities } = useWeatherStore();

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (visible) {
            if (editingRule) {
                setStep('configure');
                setSelectedType(editingRule.type);
                setRuleConfig(editingRule);
            } else {
                setStep('select_type');
                setSelectedType(null);
                setRuleConfig({});
            }
        }
    }, [visible, editingRule]);

    const handleSelectType = useCallback((type: NotificationRuleType) => {
        setSelectedType(type);
        setRuleConfig(getDefaultRuleValues(type));
        setStep('configure');
    }, []);

    const handleBack = useCallback(() => {
        if (step === 'configure') {
            setStep('select_type');
        } else if (step === 'select_location') {
            setStep('configure');
        }
    }, [step]);

    const handleSelectLocation = useCallback((cityId: string, cityName: string, cityCountry: string) => {
        setRuleConfig((prev) => ({
            ...prev,
            cityId,
            cityName,
            cityCountry,
        }));
        setStep('configure');
    }, []);

    const handleClearLocation = useCallback(() => {
        setRuleConfig((prev) => ({
            ...prev,
            cityId: undefined,
            cityName: undefined,
            cityCountry: undefined,
        }));
    }, []);

    const handleSave = useCallback(() => {
        if (selectedType && ruleConfig.id) {
            onSave(ruleConfig as NotificationRule);
            onClose();
        }
    }, [selectedType, ruleConfig, onSave, onClose]);

    const updateConfig = useCallback((key: string, value: unknown) => {
        setRuleConfig((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Group notification types by category
    const groupedTypes = useMemo(() => {
        const groups: Record<string, typeof NOTIFICATION_TYPES> = {
            weather: [],
            schedule: [],
            safety: [],
            comfort: [],
        };

        NOTIFICATION_TYPES.forEach((type) => {
            groups[type.category].push(type);
        });

        return groups;
    }, []);

    const renderTypeSelector = () => (
        <ScrollView
            style={styles.typeScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.typeScrollContent}
        >
            {Object.entries(groupedTypes).map(([category, types]) => (
                <View key={category} style={styles.categorySection}>
                    <ThemedText style={styles.categoryTitle}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </ThemedText>
                    <View style={styles.typeGrid}>
                        {types.map((type) => (
                            <Pressable
                                key={type.type}
                                style={({ pressed }) => [
                                    styles.typeCard,
                                    pressed && styles.typeCardPressed,
                                ]}
                                onPress={() => handleSelectType(type.type)}
                            >
                                <View style={[styles.typeIcon, { backgroundColor: `${type.iconColor}20` }]}>
                                    <MaterialCommunityIcons
                                        name={type.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                        size={28}
                                        color={type.iconColor}
                                    />
                                </View>
                                <ThemedText style={styles.typeTitle}>{type.title}</ThemedText>
                                <ThemedText style={styles.typeDesc} numberOfLines={2}>
                                    {type.description}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );

    const renderConfigForm = () => {
        if (!selectedType) return null;
        const typeInfo = getNotificationTypeInfo(selectedType);

        return (
            <ScrollView
                style={styles.configScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.configContent}
            >
                {/* Type header */}
                <View style={styles.configHeader}>
                    <View style={[styles.configHeaderIcon, { backgroundColor: `${typeInfo?.iconColor}20` }]}>
                        <MaterialCommunityIcons
                            name={(typeInfo?.icon as keyof typeof MaterialCommunityIcons.glyphMap) || 'bell'}
                            size={32}
                            color={typeInfo?.iconColor}
                        />
                    </View>
                    <ThemedText style={styles.configHeaderTitle}>{typeInfo?.title}</ThemedText>
                    <ThemedText style={styles.configHeaderDesc}>{typeInfo?.description}</ThemedText>
                </View>

                {/* Location selector */}
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Location (Optional)</ThemedText>
                    {ruleConfig.cityName ? (
                        <View style={styles.locationSelected}>
                            <View style={styles.locationInfo}>
                                <MaterialCommunityIcons name="map-marker" size={18} color="#a5b4fc" />
                                <ThemedText style={styles.locationName}>
                                    {ruleConfig.cityName}{ruleConfig.cityCountry ? `, ${ruleConfig.cityCountry}` : ''}
                                </ThemedText>
                            </View>
                            <Pressable onPress={handleClearLocation} style={styles.clearLocationBtn}>
                                <MaterialCommunityIcons name="close" size={18} color="#ef4444" />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable
                            style={({ pressed }) => [styles.locationButton, pressed && styles.locationButtonPressed]}
                            onPress={() => setStep('select_location')}
                        >
                            <MaterialCommunityIcons name="map-marker-plus" size={20} color="#a5b4fc" />
                            <ThemedText style={styles.locationButtonText}>
                                {favoriteCities.length > 0 ? 'Select from favorites' : 'Uses current location'}
                            </ThemedText>
                        </Pressable>
                    )}
                </View>

                {/* Type-specific configuration */}
                {renderTypeSpecificConfig()}
            </ScrollView>
        );
    };

    const renderTypeSpecificConfig = () => {
        switch (selectedType) {
            case 'temperature_threshold':
                return renderTemperatureConfig();
            case 'rain_alert':
                return renderRainAlertConfig();
            case 'morning_summary':
            case 'evening_summary':
                return renderSummaryConfig();
            case 'golden_hour':
                return renderGoldenHourConfig();
            case 'humidity_alert':
                return renderHumidityConfig();
            case 'air_quality_alert':
                return renderAirQualityConfig();
            case 'visibility_alert':
                return renderVisibilityConfig();
            case 'close_windows':
                return renderCloseWindowsConfig();
            case 'heating_cooling':
                return renderHeatingCoolingConfig();
            case 'frost_freeze':
                return renderFrostFreezeConfig();
            case 'heat_wave':
                return renderHeatWaveConfig();
            case 'storm_approaching':
                return renderStormConfig();
            case 'snow_alert':
                return renderSnowAlertConfig();
            default:
                return null;
        }
    };

    // ============ TYPE-SPECIFIC CONFIG RENDERERS ============

    const renderTemperatureConfig = () => {
        const config = ruleConfig as Partial<TemperatureThresholdRule>;
        return (
            <>
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Condition</ThemedText>
                    <View style={styles.optionRow}>
                        <Pressable
                            style={[styles.optionButton, config.condition === 'below' && styles.optionButtonActive]}
                            onPress={() => updateConfig('condition', 'below')}
                        >
                            <MaterialCommunityIcons
                                name="thermometer-minus"
                                size={20}
                                color={config.condition === 'below' ? '#fff' : '#94a3b8'}
                            />
                            <ThemedText style={[styles.optionText, config.condition === 'below' && styles.optionTextActive]}>
                                Below
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.optionButton, config.condition === 'above' && styles.optionButtonActive]}
                            onPress={() => updateConfig('condition', 'above')}
                        >
                            <MaterialCommunityIcons
                                name="thermometer-plus"
                                size={20}
                                color={config.condition === 'above' ? '#fff' : '#94a3b8'}
                            />
                            <ThemedText style={[styles.optionText, config.condition === 'above' && styles.optionTextActive]}>
                                Above
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Temperature Threshold</ThemedText>
                    <View style={styles.sliderContainer}>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('threshold', Math.max(-40, (config.threshold ?? 10) - 5))}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#a5b4fc" />
                        </Pressable>
                        <View style={styles.valueDisplay}>
                            <ThemedText style={styles.valueText}>
                                {config.threshold ?? 10}°{config.unit === 'fahrenheit' ? 'F' : 'C'}
                            </ThemedText>
                        </View>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('threshold', Math.min(50, (config.threshold ?? 10) + 5))}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#a5b4fc" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Unit</ThemedText>
                    <View style={styles.optionRow}>
                        <Pressable
                            style={[styles.optionButton, config.unit === 'celsius' && styles.optionButtonActive]}
                            onPress={() => updateConfig('unit', 'celsius')}
                        >
                            <ThemedText style={[styles.optionText, config.unit === 'celsius' && styles.optionTextActive]}>
                                Celsius (°C)
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.optionButton, config.unit === 'fahrenheit' && styles.optionButtonActive]}
                            onPress={() => updateConfig('unit', 'fahrenheit')}
                        >
                            <ThemedText style={[styles.optionText, config.unit === 'fahrenheit' && styles.optionTextActive]}>
                                Fahrenheit (°F)
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </>
        );
    };

    const renderRainAlertConfig = () => {
        const config = ruleConfig as Partial<RainAlertRule>;
        return (
            <>
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Rain Probability Threshold</ThemedText>
                    <View style={styles.sliderContainer}>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('probabilityThreshold', Math.max(10, (config.probabilityThreshold ?? 50) - 10))}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#a5b4fc" />
                        </Pressable>
                        <View style={styles.valueDisplay}>
                            <ThemedText style={styles.valueText}>{config.probabilityThreshold ?? 50}%</ThemedText>
                        </View>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('probabilityThreshold', Math.min(100, (config.probabilityThreshold ?? 50) + 10))}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#a5b4fc" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Hours in Advance</ThemedText>
                    <View style={styles.optionRow}>
                        {[3, 6, 12, 24].map((hours) => (
                            <Pressable
                                key={hours}
                                style={[styles.optionButton, styles.optionButtonSmall, config.hoursAhead === hours && styles.optionButtonActive]}
                                onPress={() => updateConfig('hoursAhead', hours)}
                            >
                                <ThemedText style={[styles.optionText, config.hoursAhead === hours && styles.optionTextActive]}>
                                    {hours}h
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </>
        );
    };

    const renderSummaryConfig = () => {
        const config = ruleConfig as Partial<MorningSummaryRule | EveningSummaryRule>;
        const isMorning = selectedType === 'morning_summary';
        const defaultHour = isMorning ? 7 : 20;

        return (
            <View style={styles.formSection}>
                <ThemedText style={styles.formLabel}>Notification Time</ThemedText>
                <View style={styles.timePickerRow}>
                    <View style={styles.timePicker}>
                        <ThemedText style={styles.timeLabel}>Hour</ThemedText>
                        <View style={styles.sliderContainer}>
                            <Pressable
                                style={styles.incrementButton}
                                onPress={() => updateConfig('hour', Math.max(0, (config.hour ?? defaultHour) - 1))}
                            >
                                <MaterialCommunityIcons name="chevron-down" size={24} color="#a5b4fc" />
                            </Pressable>
                            <View style={styles.valueDisplay}>
                                <ThemedText style={styles.valueText}>
                                    {(config.hour ?? defaultHour).toString().padStart(2, '0')}
                                </ThemedText>
                            </View>
                            <Pressable
                                style={styles.incrementButton}
                                onPress={() => updateConfig('hour', Math.min(23, (config.hour ?? defaultHour) + 1))}
                            >
                                <MaterialCommunityIcons name="chevron-up" size={24} color="#a5b4fc" />
                            </Pressable>
                        </View>
                    </View>
                    <ThemedText style={styles.timeSeparator}>:</ThemedText>
                    <View style={styles.timePicker}>
                        <ThemedText style={styles.timeLabel}>Minute</ThemedText>
                        <View style={styles.sliderContainer}>
                            <Pressable
                                style={styles.incrementButton}
                                onPress={() => updateConfig('minute', Math.max(0, (config.minute ?? 0) - 15))}
                            >
                                <MaterialCommunityIcons name="chevron-down" size={24} color="#a5b4fc" />
                            </Pressable>
                            <View style={styles.valueDisplay}>
                                <ThemedText style={styles.valueText}>
                                    {(config.minute ?? 0).toString().padStart(2, '0')}
                                </ThemedText>
                            </View>
                            <Pressable
                                style={styles.incrementButton}
                                onPress={() => updateConfig('minute', Math.min(45, (config.minute ?? 0) + 15))}
                            >
                                <MaterialCommunityIcons name="chevron-up" size={24} color="#a5b4fc" />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderGoldenHourConfig = () => {
        const config = ruleConfig as Partial<GoldenHourRule>;
        return (
            <>
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Advance Notice</ThemedText>
                    <View style={styles.optionRow}>
                        {[15, 30, 60].map((mins) => (
                            <Pressable
                                key={mins}
                                style={[styles.optionButton, config.advanceNotice === mins && styles.optionButtonActive]}
                                onPress={() => updateConfig('advanceNotice', mins)}
                            >
                                <ThemedText style={[styles.optionText, config.advanceNotice === mins && styles.optionTextActive]}>
                                    {mins} min
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>When to Notify</ThemedText>
                    <Pressable
                        style={[styles.checkboxRow, config.notifyMorning && styles.checkboxRowActive]}
                        onPress={() => updateConfig('notifyMorning', !config.notifyMorning)}
                    >
                        <MaterialCommunityIcons
                            name={config.notifyMorning ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={config.notifyMorning ? '#a5b4fc' : '#64748b'}
                        />
                        <View style={styles.checkboxText}>
                            <ThemedText style={styles.checkboxTitle}>Morning Golden Hour</ThemedText>
                            <ThemedText style={styles.checkboxDesc}>Around sunrise</ThemedText>
                        </View>
                    </Pressable>
                    <Pressable
                        style={[styles.checkboxRow, config.notifyEvening && styles.checkboxRowActive]}
                        onPress={() => updateConfig('notifyEvening', !config.notifyEvening)}
                    >
                        <MaterialCommunityIcons
                            name={config.notifyEvening ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={config.notifyEvening ? '#a5b4fc' : '#64748b'}
                        />
                        <View style={styles.checkboxText}>
                            <ThemedText style={styles.checkboxTitle}>Evening Golden Hour</ThemedText>
                            <ThemedText style={styles.checkboxDesc}>Around sunset</ThemedText>
                        </View>
                    </Pressable>
                </View>
            </>
        );
    };

    const renderHumidityConfig = () => {
        const config = ruleConfig as Partial<HumidityAlertRule>;
        return (
            <>
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Condition</ThemedText>
                    <View style={styles.optionRow}>
                        <Pressable
                            style={[styles.optionButton, config.condition === 'below' && styles.optionButtonActive]}
                            onPress={() => updateConfig('condition', 'below')}
                        >
                            <ThemedText style={[styles.optionText, config.condition === 'below' && styles.optionTextActive]}>
                                Below
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.optionButton, config.condition === 'above' && styles.optionButtonActive]}
                            onPress={() => updateConfig('condition', 'above')}
                        >
                            <ThemedText style={[styles.optionText, config.condition === 'above' && styles.optionTextActive]}>
                                Above
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Humidity Threshold</ThemedText>
                    <View style={styles.sliderContainer}>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('threshold', Math.max(0, (config.threshold ?? 70) - 10))}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#a5b4fc" />
                        </Pressable>
                        <View style={styles.valueDisplay}>
                            <ThemedText style={styles.valueText}>{config.threshold ?? 70}%</ThemedText>
                        </View>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('threshold', Math.min(100, (config.threshold ?? 70) + 10))}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#a5b4fc" />
                        </Pressable>
                    </View>
                </View>
            </>
        );
    };

    const renderAirQualityConfig = () => {
        const config = ruleConfig as Partial<AirQualityAlertRule>;
        const levels = [
            { value: 2, label: 'Fair', color: '#f1c40f' },
            { value: 3, label: 'Moderate', color: '#e67e22' },
            { value: 4, label: 'Poor', color: '#e74c3c' },
            { value: 5, label: 'Very Poor', color: '#8e44ad' },
        ];

        return (
            <View style={styles.formSection}>
                <ThemedText style={styles.formLabel}>Alert when AQI reaches</ThemedText>
                <View style={styles.aqiOptions}>
                    {levels.map((level) => (
                        <Pressable
                            key={level.value}
                            style={[styles.aqiOption, config.aqiThreshold === level.value && { borderColor: level.color, backgroundColor: `${level.color}20` }]}
                            onPress={() => updateConfig('aqiThreshold', level.value)}
                        >
                            <View style={[styles.aqiDot, { backgroundColor: level.color }]} />
                            <ThemedText style={styles.aqiLabel}>{level.label}</ThemedText>
                            <ThemedText style={styles.aqiValue}>AQI {level.value}</ThemedText>
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    };

    const renderVisibilityConfig = () => {
        const config = ruleConfig as Partial<VisibilityAlertRule>;
        return (
            <View style={styles.formSection}>
                <ThemedText style={styles.formLabel}>Visibility Threshold</ThemedText>
                <View style={styles.optionRow}>
                    {[1, 3, 5, 10].map((km) => (
                        <Pressable
                            key={km}
                            style={[styles.optionButton, styles.optionButtonSmall, config.thresholdKm === km && styles.optionButtonActive]}
                            onPress={() => updateConfig('thresholdKm', km)}
                        >
                            <ThemedText style={[styles.optionText, config.thresholdKm === km && styles.optionTextActive]}>
                                {km} km
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>
                <ThemedText style={styles.formHint}>
                    Alert when visibility drops below this threshold
                </ThemedText>
            </View>
        );
    };

    const renderCloseWindowsConfig = () => {
        const config = ruleConfig as Partial<CloseWindowsRule>;
        return (
            <>
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Rain Probability</ThemedText>
                    <View style={styles.sliderContainer}>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('rainProbabilityThreshold', Math.max(10, (config.rainProbabilityThreshold ?? 60) - 10))}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#a5b4fc" />
                        </Pressable>
                        <View style={styles.valueDisplay}>
                            <ThemedText style={styles.valueText}>{config.rainProbabilityThreshold ?? 60}%</ThemedText>
                        </View>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('rainProbabilityThreshold', Math.min(100, (config.rainProbabilityThreshold ?? 60) + 10))}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#a5b4fc" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Hours Before Rain</ThemedText>
                    <View style={styles.optionRow}>
                        {[1, 2, 3, 6].map((hours) => (
                            <Pressable
                                key={hours}
                                style={[styles.optionButton, styles.optionButtonSmall, config.hoursAhead === hours && styles.optionButtonActive]}
                                onPress={() => updateConfig('hoursAhead', hours)}
                            >
                                <ThemedText style={[styles.optionText, config.hoursAhead === hours && styles.optionTextActive]}>
                                    {hours}h
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </>
        );
    };

    const renderHeatingCoolingConfig = () => {
        const config = ruleConfig as Partial<HeatingCoolingRule>;
        const unit = config.unit === 'fahrenheit' ? '°F' : '°C';

        return (
            <>
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Unit</ThemedText>
                    <View style={styles.optionRow}>
                        <Pressable
                            style={[styles.optionButton, config.unit === 'celsius' && styles.optionButtonActive]}
                            onPress={() => updateConfig('unit', 'celsius')}
                        >
                            <ThemedText style={[styles.optionText, config.unit === 'celsius' && styles.optionTextActive]}>
                                Celsius
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.optionButton, config.unit === 'fahrenheit' && styles.optionButtonActive]}
                            onPress={() => updateConfig('unit', 'fahrenheit')}
                        >
                            <ThemedText style={[styles.optionText, config.unit === 'fahrenheit' && styles.optionTextActive]}>
                                Fahrenheit
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>
                        Suggest heating below
                    </ThemedText>
                    <View style={styles.sliderContainer}>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('coldThreshold', Math.max(5, (config.coldThreshold ?? 18) - 1))}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#3b82f6" />
                        </Pressable>
                        <View style={styles.valueDisplay}>
                            <ThemedText style={[styles.valueText, { color: '#3b82f6' }]}>{config.coldThreshold ?? 18}{unit}</ThemedText>
                        </View>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('coldThreshold', Math.min(25, (config.coldThreshold ?? 18) + 1))}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#3b82f6" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>
                        Suggest cooling above
                    </ThemedText>
                    <View style={styles.sliderContainer}>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('hotThreshold', Math.max(20, (config.hotThreshold ?? 26) - 1))}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#ef4444" />
                        </Pressable>
                        <View style={styles.valueDisplay}>
                            <ThemedText style={[styles.valueText, { color: '#ef4444' }]}>{config.hotThreshold ?? 26}{unit}</ThemedText>
                        </View>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('hotThreshold', Math.min(40, (config.hotThreshold ?? 26) + 1))}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#ef4444" />
                        </Pressable>
                    </View>
                </View>
            </>
        );
    };

    const renderFrostFreezeConfig = () => {
        const config = ruleConfig as Partial<FrostFreezeRule>;
        return (
            <View style={styles.formSection}>
                <ThemedText style={styles.formLabel}>Hours in Advance</ThemedText>
                <View style={styles.optionRow}>
                    {[6, 12, 24].map((hours) => (
                        <Pressable
                            key={hours}
                            style={[styles.optionButton, config.hoursAhead === hours && styles.optionButtonActive]}
                            onPress={() => updateConfig('hoursAhead', hours)}
                        >
                            <ThemedText style={[styles.optionText, config.hoursAhead === hours && styles.optionTextActive]}>
                                {hours}h
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>
                <ThemedText style={styles.formHint}>
                    Alert when temperature is expected to drop below 0°C
                </ThemedText>
            </View>
        );
    };

    const renderHeatWaveConfig = () => {
        const config = ruleConfig as Partial<HeatWaveRule>;
        const unit = config.unit === 'fahrenheit' ? '°F' : '°C';

        return (
            <>
                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Temperature Threshold</ThemedText>
                    <View style={styles.sliderContainer}>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('threshold', Math.max(30, (config.threshold ?? 35) - 1))}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#ef4444" />
                        </Pressable>
                        <View style={styles.valueDisplay}>
                            <ThemedText style={[styles.valueText, { color: '#ef4444' }]}>{config.threshold ?? 35}{unit}</ThemedText>
                        </View>
                        <Pressable
                            style={styles.incrementButton}
                            onPress={() => updateConfig('threshold', Math.min(50, (config.threshold ?? 35) + 1))}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#ef4444" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <ThemedText style={styles.formLabel}>Unit</ThemedText>
                    <View style={styles.optionRow}>
                        <Pressable
                            style={[styles.optionButton, config.unit === 'celsius' && styles.optionButtonActive]}
                            onPress={() => updateConfig('unit', 'celsius')}
                        >
                            <ThemedText style={[styles.optionText, config.unit === 'celsius' && styles.optionTextActive]}>
                                Celsius
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.optionButton, config.unit === 'fahrenheit' && styles.optionButtonActive]}
                            onPress={() => updateConfig('unit', 'fahrenheit')}
                        >
                            <ThemedText style={[styles.optionText, config.unit === 'fahrenheit' && styles.optionTextActive]}>
                                Fahrenheit
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </>
        );
    };

    const renderStormConfig = () => {
        const config = ruleConfig as Partial<StormApproachingRule>;
        return (
            <View style={styles.formSection}>
                <ThemedText style={styles.formLabel}>Hours in Advance</ThemedText>
                <View style={styles.optionRow}>
                    {[3, 6, 12, 24].map((hours) => (
                        <Pressable
                            key={hours}
                            style={[styles.optionButton, styles.optionButtonSmall, config.hoursAhead === hours && styles.optionButtonActive]}
                            onPress={() => updateConfig('hoursAhead', hours)}
                        >
                            <ThemedText style={[styles.optionText, config.hoursAhead === hours && styles.optionTextActive]}>
                                {hours}h
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    };

    const renderSnowAlertConfig = () => {
        const config = ruleConfig as Partial<SnowAlertRule>;
        return (
            <View style={styles.formSection}>
                <ThemedText style={styles.formLabel}>Hours in Advance</ThemedText>
                <View style={styles.optionRow}>
                    {[6, 12, 24].map((hours) => (
                        <Pressable
                            key={hours}
                            style={[styles.optionButton, config.hoursAhead === hours && styles.optionButtonActive]}
                            onPress={() => updateConfig('hoursAhead', hours)}
                        >
                            <ThemedText style={[styles.optionText, config.hoursAhead === hours && styles.optionTextActive]}>
                                {hours}h
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    };

    const renderLocationSelector = () => (
        <ScrollView
            style={styles.locationScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.locationContent}
        >
            {favoriteCities.length === 0 ? (
                <View style={styles.emptyLocations}>
                    <MaterialCommunityIcons name="map-marker-off" size={48} color="#64748b" />
                    <ThemedText style={styles.emptyLocationsText}>
                        No favorite cities yet
                    </ThemedText>
                    <ThemedText style={styles.emptyLocationsHint}>
                        Add cities to your favorites from the explore screen to use location-specific alerts
                    </ThemedText>
                </View>
            ) : (
                <>
                    <ThemedText style={styles.locationSectionTitle}>Select a location</ThemedText>
                    {favoriteCities.map((city) => (
                        <Pressable
                            key={city.id}
                            style={({ pressed }) => [styles.locationItem, pressed && styles.locationItemPressed]}
                            onPress={() => handleSelectLocation(city.id, city.name, city.country)}
                        >
                            <MaterialCommunityIcons name="map-marker" size={20} color="#a5b4fc" />
                            <ThemedText style={styles.locationItemText}>
                                {city.name}, {city.country}
                            </ThemedText>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
                        </Pressable>
                    ))}
                </>
            )}
        </ScrollView>
    );

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent
            onRequestClose={onClose}
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.modalBackdrop}
            >
                <Pressable style={styles.backdropPressable} onPress={onClose} />
                <Animated.View
                    entering={SlideInDown.springify().damping(20)}
                    exiting={SlideOutDown}
                    style={styles.modalContainer}
                >
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                            {renderModalContent()}
                        </BlurView>
                    ) : (
                        <View style={[styles.modalContent, styles.modalContentAndroid]}>
                            {renderModalContent()}
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );

    function renderModalContent() {
        return (
            <>
                {/* Header */}
                <View style={styles.modalHeader}>
                    {step !== 'select_type' && (
                        <Pressable onPress={handleBack} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#a5b4fc" />
                        </Pressable>
                    )}
                    <ThemedText style={styles.modalTitle}>
                        {step === 'select_type' && (editingRule ? 'Edit Notification' : 'New Notification')}
                        {step === 'configure' && 'Configure'}
                        {step === 'select_location' && 'Select Location'}
                    </ThemedText>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
                    </Pressable>
                </View>

                {/* Content */}
                <View style={styles.modalBody}>
                    {step === 'select_type' && renderTypeSelector()}
                    {step === 'configure' && renderConfigForm()}
                    {step === 'select_location' && renderLocationSelector()}
                </View>

                {/* Footer (only in configure step) */}
                {step === 'configure' && (
                    <View style={styles.modalFooter}>
                        <Pressable
                            style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
                            onPress={onClose}
                        >
                            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
                            onPress={handleSave}
                        >
                            <MaterialCommunityIcons name="check" size={20} color="#0f172a" />
                            <ThemedText style={styles.saveButtonText}>
                                {editingRule ? 'Update' : 'Create'}
                            </ThemedText>
                        </Pressable>
                    </View>
                )}
            </>
        );
    }
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    backdropPressable: {
        flex: 1,
    },
    modalContainer: {
        maxHeight: SCREEN_HEIGHT * 0.85,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    modalContentAndroid: {
        backgroundColor: '#1e1e2e',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        padding: 8,
        marginRight: -8,
    },
    modalBody: {
        flex: 1,
        minHeight: 300,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#94a3b8',
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: '#a5b4fc',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    buttonPressed: {
        opacity: 0.8,
    },

    // Type selector styles
    typeScrollView: {
        flex: 1,
    },
    typeScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeCard: {
        width: (SCREEN_WIDTH - 72) / 2,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        gap: 8,
    },
    typeCardPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    typeIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    typeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
    },
    typeDesc: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 16,
    },

    // Config form styles
    configScrollView: {
        flex: 1,
    },
    configContent: {
        padding: 20,
        paddingBottom: 40,
    },
    configHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    configHeaderIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    configHeaderTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    configHeaderDesc: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    formSection: {
        marginBottom: 24,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#cbd5e1',
        marginBottom: 12,
    },
    formHint: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 8,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    optionButtonSmall: {
        flex: 0,
        paddingHorizontal: 20,
    },
    optionButtonActive: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#94a3b8',
    },
    optionTextActive: {
        color: '#ffffff',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    incrementButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueDisplay: {
        minWidth: 80,
        alignItems: 'center',
    },
    valueText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    checkboxRowActive: {
        borderColor: 'rgba(165, 180, 252, 0.3)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
    },
    checkboxText: {
        flex: 1,
    },
    checkboxTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
    },
    checkboxDesc: {
        fontSize: 13,
        color: '#94a3b8',
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    timePicker: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
    },
    timeSeparator: {
        fontSize: 32,
        fontWeight: '700',
        color: '#94a3b8',
        marginTop: 24,
    },
    aqiOptions: {
        gap: 10,
    },
    aqiOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    aqiDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    aqiLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
    },
    aqiValue: {
        fontSize: 14,
        color: '#64748b',
    },

    // Location styles
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderStyle: 'dashed',
    },
    locationButtonPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    locationButtonText: {
        fontSize: 14,
        color: '#a5b4fc',
    },
    locationSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(165, 180, 252, 0.3)',
    },
    locationInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff',
    },
    clearLocationBtn: {
        padding: 4,
    },
    locationScrollView: {
        flex: 1,
    },
    locationContent: {
        padding: 20,
        paddingBottom: 40,
    },
    locationSectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#94a3b8',
        marginBottom: 16,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        marginBottom: 10,
    },
    locationItemPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    locationItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
    },
    emptyLocations: {
        alignItems: 'center',
        padding: 32,
    },
    emptyLocationsText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#94a3b8',
        marginTop: 16,
    },
    emptyLocationsHint: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});

export default CreateNotificationModal;
