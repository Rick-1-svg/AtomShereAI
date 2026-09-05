/**
 * Notification Types for AtomShereAI Custom Notifications
 */

// All supported notification rule types
export type NotificationRuleType =
    | 'temperature_threshold'
    | 'rain_alert'
    | 'morning_summary'
    | 'evening_summary'
    | 'golden_hour'
    | 'humidity_alert'
    | 'air_quality_alert'
    | 'visibility_alert'
    | 'close_windows'
    | 'heating_cooling'
    | 'frost_freeze'
    | 'heat_wave'
    | 'storm_approaching'
    | 'snow_alert';

// Temperature condition type
export type TemperatureCondition = 'below' | 'above';

// Humidity condition type
export type HumidityCondition = 'below' | 'above';

// Temperature unit
export type TemperatureUnit = 'celsius' | 'fahrenheit';

// Base notification rule interface
export interface BaseNotificationRule {
    id: string;
    type: NotificationRuleType;
    enabled: boolean;
    createdAt: string;
    lastTriggered?: string;
    cityId?: string; // Optional - for location-specific alerts
    cityName?: string;
    cityCountry?: string;
}

// Temperature threshold notification
export interface TemperatureThresholdRule extends BaseNotificationRule {
    type: 'temperature_threshold';
    threshold: number;
    condition: TemperatureCondition;
    unit: TemperatureUnit;
}

// Rain alert notification
export interface RainAlertRule extends BaseNotificationRule {
    type: 'rain_alert';
    probabilityThreshold: number; // 0-100
    hoursAhead: number; // How many hours in advance to check
}

// Morning summary notification
export interface MorningSummaryRule extends BaseNotificationRule {
    type: 'morning_summary';
    hour: number; // 0-23
    minute: number; // 0-59
}

// Evening summary notification
export interface EveningSummaryRule extends BaseNotificationRule {
    type: 'evening_summary';
    hour: number; // 0-23
    minute: number; // 0-59
}

// Golden hour notification for photographers
export interface GoldenHourRule extends BaseNotificationRule {
    type: 'golden_hour';
    advanceNotice: number; // Minutes before golden hour to notify (15, 30, 60)
    notifyMorning: boolean; // Notify for morning golden hour
    notifyEvening: boolean; // Notify for evening golden hour
}

// Humidity alert notification
export interface HumidityAlertRule extends BaseNotificationRule {
    type: 'humidity_alert';
    threshold: number; // 0-100
    condition: HumidityCondition;
}

// Air quality alert notification
export interface AirQualityAlertRule extends BaseNotificationRule {
    type: 'air_quality_alert';
    aqiThreshold: number; // 1-5 (OpenWeather AQI scale)
}

// Visibility alert notification
export interface VisibilityAlertRule extends BaseNotificationRule {
    type: 'visibility_alert';
    thresholdKm: number; // Visibility threshold in kilometers
}

// Close windows reminder (rain expected)
export interface CloseWindowsRule extends BaseNotificationRule {
    type: 'close_windows';
    rainProbabilityThreshold: number; // 0-100
    hoursAhead: number; // How many hours in advance
}

// Heating/cooling suggestion
export interface HeatingCoolingRule extends BaseNotificationRule {
    type: 'heating_cooling';
    coldThreshold: number; // Suggest heating below this temp
    hotThreshold: number; // Suggest cooling above this temp
    unit: TemperatureUnit;
}

// Frost/freeze warning
export interface FrostFreezeRule extends BaseNotificationRule {
    type: 'frost_freeze';
    hoursAhead: number; // How many hours to look ahead
}

// Heat wave alert
export interface HeatWaveRule extends BaseNotificationRule {
    type: 'heat_wave';
    threshold: number; // Temperature threshold (default 35°C)
    unit: TemperatureUnit;
}

// Storm approaching alert
export interface StormApproachingRule extends BaseNotificationRule {
    type: 'storm_approaching';
    hoursAhead: number; // How many hours in advance to check
}

// Snow alert
export interface SnowAlertRule extends BaseNotificationRule {
    type: 'snow_alert';
    hoursAhead: number; // How many hours in advance to check (max 24)
}

// Union type for all notification rules
export type NotificationRule =
    | TemperatureThresholdRule
    | RainAlertRule
    | MorningSummaryRule
    | EveningSummaryRule
    | GoldenHourRule
    | HumidityAlertRule
    | AirQualityAlertRule
    | VisibilityAlertRule
    | CloseWindowsRule
    | HeatingCoolingRule
    | FrostFreezeRule
    | HeatWaveRule
    | StormApproachingRule
    | SnowAlertRule;

// Notification history item for tracking triggered notifications
export interface NotificationHistoryItem {
    id: string;
    ruleId: string;
    ruleType: NotificationRuleType;
    title: string;
    body: string;
    triggeredAt: string;
    cityName?: string;
}

// Notification type metadata for UI
export interface NotificationTypeInfo {
    type: NotificationRuleType;
    title: string;
    description: string;
    icon: string; // MaterialCommunityIcons name
    iconColor: string;
    category: 'weather' | 'schedule' | 'safety' | 'comfort';
}

// All notification type metadata
export const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
    // Core types
    {
        type: 'temperature_threshold',
        title: 'Temperature Alert',
        description: 'Notify when temperature drops below or exceeds a threshold',
        icon: 'thermometer',
        iconColor: '#ef4444',
        category: 'weather',
    },
    {
        type: 'rain_alert',
        title: 'Rain Alert',
        description: 'Get notified before rain is expected',
        icon: 'weather-rainy',
        iconColor: '#3b82f6',
        category: 'weather',
    },
    {
        type: 'morning_summary',
        title: 'Morning Summary',
        description: 'Daily weather briefing every morning',
        icon: 'weather-sunset-up',
        iconColor: '#f59e0b',
        category: 'schedule',
    },
    {
        type: 'evening_summary',
        title: 'Evening Summary',
        description: 'Tomorrow\'s weather forecast every evening',
        icon: 'weather-sunset-down',
        iconColor: '#8b5cf6',
        category: 'schedule',
    },
    {
        type: 'golden_hour',
        title: 'Golden Hour',
        description: 'Perfect lighting conditions for photography',
        icon: 'camera',
        iconColor: '#eab308',
        category: 'schedule',
    },
    // Comfort alerts
    {
        type: 'humidity_alert',
        title: 'Humidity Alert',
        description: 'Notify when humidity is too high or low',
        icon: 'water-percent',
        iconColor: '#06b6d4',
        category: 'comfort',
    },
    {
        type: 'air_quality_alert',
        title: 'Air Quality Alert',
        description: 'Alert when air quality index exceeds threshold',
        icon: 'air-filter',
        iconColor: '#22c55e',
        category: 'comfort',
    },
    {
        type: 'visibility_alert',
        title: 'Visibility Alert',
        description: 'Notify when visibility drops below threshold',
        icon: 'eye-off',
        iconColor: '#64748b',
        category: 'safety',
    },
    // Smart home suggestions
    {
        type: 'close_windows',
        title: 'Close Windows',
        description: 'Reminder when rain is expected',
        icon: 'window-closed',
        iconColor: '#14b8a6',
        category: 'comfort',
    },
    {
        type: 'heating_cooling',
        title: 'Heating/Cooling',
        description: 'Suggestions based on temperature changes',
        icon: 'thermostat',
        iconColor: '#f97316',
        category: 'comfort',
    },
    // Safety alerts
    {
        type: 'frost_freeze',
        title: 'Frost/Freeze Warning',
        description: 'Alert when temperature drops below 0°C',
        icon: 'snowflake-alert',
        iconColor: '#0ea5e9',
        category: 'safety',
    },
    {
        type: 'heat_wave',
        title: 'Heat Wave Alert',
        description: 'Extreme heat warning (>35°C)',
        icon: 'fire',
        iconColor: '#dc2626',
        category: 'safety',
    },
    {
        type: 'storm_approaching',
        title: 'Storm Alert',
        description: 'Thunderstorm expected soon',
        icon: 'weather-lightning',
        iconColor: '#fbbf24',
        category: 'safety',
    },
    {
        type: 'snow_alert',
        title: 'Snow Alert',
        description: 'Snowfall expected in the next 24 hours',
        icon: 'weather-snowy-heavy',
        iconColor: '#a5b4fc',
        category: 'weather',
    },
];

// Helper to get notification type info
export const getNotificationTypeInfo = (type: NotificationRuleType): NotificationTypeInfo | undefined => {
    return NOTIFICATION_TYPES.find((t) => t.type === type);
};

// Helper to generate unique notification rule ID
export const generateRuleId = (): string => {
    return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Default values for creating new rules
export const getDefaultRuleValues = (type: NotificationRuleType): Record<string, unknown> => {
    const baseValues: Record<string, unknown> = {
        id: generateRuleId(),
        type,
        enabled: true,
        createdAt: new Date().toISOString(),
    };

    switch (type) {
        case 'temperature_threshold':
            return { ...baseValues, threshold: 10, condition: 'below', unit: 'celsius' };
        case 'rain_alert':
            return { ...baseValues, probabilityThreshold: 50, hoursAhead: 6 };
        case 'morning_summary':
            return { ...baseValues, hour: 7, minute: 0 };
        case 'evening_summary':
            return { ...baseValues, hour: 20, minute: 0 };
        case 'golden_hour':
            return { ...baseValues, advanceNotice: 30, notifyMorning: true, notifyEvening: true };
        case 'humidity_alert':
            return { ...baseValues, threshold: 70, condition: 'above' };
        case 'air_quality_alert':
            return { ...baseValues, aqiThreshold: 3 };
        case 'visibility_alert':
            return { ...baseValues, thresholdKm: 5 };
        case 'close_windows':
            return { ...baseValues, rainProbabilityThreshold: 60, hoursAhead: 3 };
        case 'heating_cooling':
            return { ...baseValues, coldThreshold: 18, hotThreshold: 26, unit: 'celsius' };
        case 'frost_freeze':
            return { ...baseValues, hoursAhead: 12 };
        case 'heat_wave':
            return { ...baseValues, threshold: 35, unit: 'celsius' };
        case 'storm_approaching':
            return { ...baseValues, hoursAhead: 6 };
        case 'snow_alert':
            return { ...baseValues, hoursAhead: 24 };
        default:
            return baseValues;
    }
};

