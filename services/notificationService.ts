import { useNotificationsStore, wasRecentlyTriggered } from '@/hooks/stores/use-notifications-store';
import {
    AirQualityAlertRule,
    CloseWindowsRule,
    EveningSummaryRule,
    FrostFreezeRule,
    GoldenHourRule,
    HeatWaveRule,
    HeatingCoolingRule,
    HumidityAlertRule,
    MorningSummaryRule,
    NotificationRule,
    RainAlertRule,
    SnowAlertRule,
    StormApproachingRule,
    TemperatureThresholdRule,
    VisibilityAlertRule,
    getNotificationTypeInfo
} from '@/types/notifications';
import { ForecastData, WeatherData } from '@/types/weather';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions with timeout
 * @returns Whether permissions were granted
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    console.log('🔔 Notification: Requesting permissions...');
    // Running inside Expo Go (appOwnership === 'expo') does not support
    // receiving remote push notifications. Remote push token APIs were
    // removed from Expo Go in SDK 53 — use a development build or a
    // standalone build to test remote push notifications.
    if (Constants.appOwnership === 'expo') {
        console.warn(
            '🔔 Notification: Detected Expo Go. Remote push notifications are not supported in Expo Go. Use a development build (expo-dev-client) or EAS build.'
        );
        // Continue to request local notification permissions for better UX,
        // but upstream code should avoid attempting to register for remote
        // push tokens when running in Expo Go.
    }
    // Wrap in timeout to prevent hanging in Expo Go
    const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
            console.log('🔔 Notification: Permission request timed out');
            resolve(true); // Assume granted on timeout for better UX in Expo Go
        }, 3000);
    });

    const permissionPromise = (async (): Promise<boolean> => {
        try {
            console.log('🔔 Notification: Getting existing permissions...');
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            console.log('🔔 Notification: Existing status:', existingStatus);
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                console.log('🔔 Notification: Requesting new permissions...');
                const { status } = await Notifications.requestPermissionsAsync();
                console.log('🔔 Notification: New status:', status);
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('🔔 Notification: Permissions not granted');
                return false;
            }

            // Configure notification channel for Android
            if (Platform.OS === 'android') {
                console.log('🔔 Notification: Setting up Android channel...');
                try {
                    await Notifications.setNotificationChannelAsync('weather-alerts', {
                        name: 'Weather Alerts',
                        importance: Notifications.AndroidImportance.HIGH,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#a5b4fc',
                        sound: 'default',
                    });
                    console.log('🔔 Notification: Android channel created');
                } catch (channelError) {
                    console.log('🔔 Notification: Channel creation failed (Expo Go):', channelError);
                    // Continue anyway - this fails in Expo Go but that's OK
                }
            }

            console.log('🔔 Notification: Permissions granted successfully');
            return true;
        } catch (error) {
            console.error('🔔 Notification: Error requesting permissions:', error);
            // Return true anyway for better UX in Expo Go
            return true;
        }
    })();

    // Race between timeout and actual permission request
    return Promise.race([permissionPromise, timeoutPromise]);
};

/**
 * Present a notification immediately
 */
export const presentNotification = async (
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<string | null> => {
    try {
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: null, // null means present immediately
        });
        return identifier;
    } catch (error) {
        console.error('Error presenting notification:', error);
        return null;
    }
};

/**
 * Schedule a notification for a specific time
 */
export const scheduleNotification = async (
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, unknown>
): Promise<string | null> => {
    try {
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });
        return identifier;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};

/**
 * Schedule a daily notification at a specific time
 */
export const scheduleDailyNotification = async (
    title: string,
    body: string,
    hour: number,
    minute: number,
    identifier: string,
    data?: Record<string, unknown>
): Promise<string | null> => {
    try {
        // Cancel existing notification with the same identifier
        await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => { });

        const id = await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
        return id;
    } catch (error) {
        console.error('Error scheduling daily notification:', error);
        return null;
    }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (identifier: string): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
        console.error('Error canceling notification:', error);
    }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
        console.error('Error canceling all notifications:', error);
    }
};

// ============== RULE EVALUATION FUNCTIONS ==============

/**
 * Evaluate temperature threshold rule
 */
const evaluateTemperatureThreshold = (
    rule: TemperatureThresholdRule,
    weather: WeatherData
): { shouldNotify: boolean; message: string } => {
    const currentTemp = weather.current.temp;
    const threshold = rule.unit === 'fahrenheit'
        ? (rule.threshold - 32) * 5 / 9
        : rule.threshold;

    const conditionMet = rule.condition === 'below'
        ? currentTemp < threshold
        : currentTemp > threshold;

    if (conditionMet) {
        const displayTemp = rule.unit === 'fahrenheit'
            ? Math.round(currentTemp * 9 / 5 + 32)
            : Math.round(currentTemp);
        const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
        const condition = rule.condition === 'below' ? 'dropped below' : 'exceeded';

        return {
            shouldNotify: true,
            message: `Temperature has ${condition} ${rule.threshold}${unit}. Current: ${displayTemp}${unit}`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate rain alert rule
 */
const evaluateRainAlert = (
    rule: RainAlertRule,
    forecast: ForecastData
): { shouldNotify: boolean; message: string } => {
    if (!forecast?.forecast?.length) {
        return { shouldNotify: false, message: '' };
    }

    const now = Date.now();
    const lookAheadMs = rule.hoursAhead * 60 * 60 * 1000;
    const windowEnd = now + lookAheadMs;

    const rainForecast = forecast.forecast.find((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        const pop = (item.pop ?? 0) * 100;
        const isRain = item.description?.toLowerCase().includes('rain');

        return (
            itemTime >= now &&
            itemTime <= windowEnd &&
            (pop >= rule.probabilityThreshold || isRain)
        );
    });

    if (rainForecast) {
        const pop = Math.round((rainForecast.pop ?? 0) * 100);
        const time = new Date(rainForecast.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });

        return {
            shouldNotify: true,
            message: `Rain expected around ${time} (${pop}% chance)`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate golden hour rule
 */
const evaluateGoldenHour = (
    rule: GoldenHourRule,
    weather: WeatherData
): { shouldNotify: boolean; message: string } => {
    const now = Date.now();
    const advanceMs = rule.advanceNotice * 60 * 1000;

    // Calculate golden hour times (roughly 1 hour after sunrise and 1 hour before sunset)
    const sunrise = weather.current.sunrise ? weather.current.sunrise * 1000 : null;
    const sunset = weather.current.sunset ? weather.current.sunset * 1000 : null;

    if (!sunrise || !sunset) {
        return { shouldNotify: false, message: '' };
    }

    // Morning golden hour: starts at sunrise, lasts about 1 hour
    const morningGoldenStart = sunrise;
    const morningGoldenNotifyTime = morningGoldenStart - advanceMs;

    // Evening golden hour: starts about 1 hour before sunset
    const eveningGoldenStart = sunset - 60 * 60 * 1000;
    const eveningGoldenNotifyTime = eveningGoldenStart - advanceMs;

    // Check if we should notify for morning golden hour
    if (rule.notifyMorning && now >= morningGoldenNotifyTime && now < morningGoldenStart) {
        const time = new Date(morningGoldenStart).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        return {
            shouldNotify: true,
            message: `🌅 Morning golden hour starts at ${time}. Perfect lighting for photography!`,
        };
    }

    // Check if we should notify for evening golden hour
    if (rule.notifyEvening && now >= eveningGoldenNotifyTime && now < eveningGoldenStart) {
        const time = new Date(eveningGoldenStart).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        return {
            shouldNotify: true,
            message: `🌄 Evening golden hour starts at ${time}. Perfect lighting for photography!`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate humidity alert rule
 */
const evaluateHumidityAlert = (
    rule: HumidityAlertRule,
    weather: WeatherData
): { shouldNotify: boolean; message: string } => {
    const humidity = weather.current.humidity;

    const conditionMet = rule.condition === 'below'
        ? humidity < rule.threshold
        : humidity > rule.threshold;

    if (conditionMet) {
        const condition = rule.condition === 'below' ? 'dropped below' : 'exceeded';
        return {
            shouldNotify: true,
            message: `Humidity has ${condition} ${rule.threshold}%. Current: ${humidity}%`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate air quality alert rule
 */
const evaluateAirQualityAlert = (
    rule: AirQualityAlertRule,
    aqi: number | null
): { shouldNotify: boolean; message: string } => {
    if (aqi === null) {
        return { shouldNotify: false, message: '' };
    }

    if (aqi >= rule.aqiThreshold) {
        const levels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
        const level = levels[aqi] || 'Unknown';
        return {
            shouldNotify: true,
            message: `Air quality is ${level} (AQI: ${aqi}). Consider limiting outdoor activities.`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate visibility alert rule
 */
const evaluateVisibilityAlert = (
    rule: VisibilityAlertRule,
    weather: WeatherData
): { shouldNotify: boolean; message: string } => {
    const visibility = weather.current.visibility;

    if (visibility === undefined || visibility === null) {
        return { shouldNotify: false, message: '' };
    }

    // Convert meters to km
    const visibilityKm = visibility / 1000;

    if (visibilityKm < rule.thresholdKm) {
        return {
            shouldNotify: true,
            message: `Low visibility: ${visibilityKm.toFixed(1)} km. Drive carefully!`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate close windows rule
 */
const evaluateCloseWindows = (
    rule: CloseWindowsRule,
    forecast: ForecastData
): { shouldNotify: boolean; message: string } => {
    if (!forecast?.forecast?.length) {
        return { shouldNotify: false, message: '' };
    }

    const now = Date.now();
    const lookAheadMs = rule.hoursAhead * 60 * 60 * 1000;
    const windowEnd = now + lookAheadMs;

    const rainForecast = forecast.forecast.find((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        const pop = (item.pop ?? 0) * 100;

        return (
            itemTime >= now &&
            itemTime <= windowEnd &&
            pop >= rule.rainProbabilityThreshold
        );
    });

    if (rainForecast) {
        const time = new Date(rainForecast.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        return {
            shouldNotify: true,
            message: `🪟 Rain expected around ${time}. Consider closing your windows!`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate heating/cooling rule
 */
const evaluateHeatingCooling = (
    rule: HeatingCoolingRule,
    weather: WeatherData,
    forecast: ForecastData
): { shouldNotify: boolean; message: string } => {
    const currentTemp = weather.current.temp;

    // Convert thresholds to Celsius if needed
    const coldThreshold = rule.unit === 'fahrenheit'
        ? (rule.coldThreshold - 32) * 5 / 9
        : rule.coldThreshold;
    const hotThreshold = rule.unit === 'fahrenheit'
        ? (rule.hotThreshold - 32) * 5 / 9
        : rule.hotThreshold;

    // Check if temperature is approaching thresholds from forecast
    const upcomingTemp = forecast?.forecast?.[0]?.temp ?? currentTemp;

    if (currentTemp < coldThreshold || upcomingTemp < coldThreshold) {
        const displayThreshold = rule.unit === 'fahrenheit'
            ? Math.round(rule.coldThreshold)
            : Math.round(coldThreshold);
        const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
        return {
            shouldNotify: true,
            message: `🌡️ Temperature is below ${displayThreshold}${unit}. Consider turning on heating.`,
        };
    }

    if (currentTemp > hotThreshold || upcomingTemp > hotThreshold) {
        const displayThreshold = rule.unit === 'fahrenheit'
            ? Math.round(rule.hotThreshold)
            : Math.round(hotThreshold);
        const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
        return {
            shouldNotify: true,
            message: `🌡️ Temperature is above ${displayThreshold}${unit}. Consider turning on cooling.`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate frost/freeze rule
 */
const evaluateFrostFreeze = (
    rule: FrostFreezeRule,
    forecast: ForecastData
): { shouldNotify: boolean; message: string } => {
    if (!forecast?.forecast?.length) {
        return { shouldNotify: false, message: '' };
    }

    const now = Date.now();
    const lookAheadMs = rule.hoursAhead * 60 * 60 * 1000;
    const windowEnd = now + lookAheadMs;

    const frostForecast = forecast.forecast.find((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        return itemTime >= now && itemTime <= windowEnd && item.temp <= 0;
    });

    if (frostForecast) {
        const time = new Date(frostForecast.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        const temp = Math.round(frostForecast.temp);
        return {
            shouldNotify: true,
            message: `❄️ Frost/freeze warning! Temperature expected to drop to ${temp}°C around ${time}.`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate heat wave rule
 */
const evaluateHeatWave = (
    rule: HeatWaveRule,
    weather: WeatherData,
    forecast: ForecastData
): { shouldNotify: boolean; message: string } => {
    const threshold = rule.unit === 'fahrenheit'
        ? (rule.threshold - 32) * 5 / 9
        : rule.threshold;

    // Check current temperature
    if (weather.current.temp >= threshold) {
        const displayTemp = rule.unit === 'fahrenheit'
            ? Math.round(weather.current.temp * 9 / 5 + 32)
            : Math.round(weather.current.temp);
        const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
        return {
            shouldNotify: true,
            message: `🔥 Extreme heat alert! Current temperature: ${displayTemp}${unit}. Stay hydrated and avoid prolonged outdoor exposure.`,
        };
    }

    // Check upcoming forecast
    const heatForecast = forecast?.forecast?.find((item) => item.temp >= threshold);
    if (heatForecast) {
        const time = new Date(heatForecast.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        const displayTemp = rule.unit === 'fahrenheit'
            ? Math.round(heatForecast.temp * 9 / 5 + 32)
            : Math.round(heatForecast.temp);
        const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
        return {
            shouldNotify: true,
            message: `🔥 Heat wave expected around ${time}. Temperature will reach ${displayTemp}${unit}.`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate storm approaching rule
 */
const evaluateStormApproaching = (
    rule: StormApproachingRule,
    forecast: ForecastData
): { shouldNotify: boolean; message: string } => {
    if (!forecast?.forecast?.length) {
        return { shouldNotify: false, message: '' };
    }

    const now = Date.now();
    const lookAheadMs = rule.hoursAhead * 60 * 60 * 1000;
    const windowEnd = now + lookAheadMs;

    const stormForecast = forecast.forecast.find((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        const desc = item.description?.toLowerCase() || '';
        const isStorm = desc.includes('thunder') || desc.includes('storm') || desc.includes('lightning');

        return itemTime >= now && itemTime <= windowEnd && isStorm;
    });

    if (stormForecast) {
        const time = new Date(stormForecast.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        return {
            shouldNotify: true,
            message: `⛈️ Storm approaching! Thunderstorm expected around ${time}. Stay safe indoors.`,
        };
    }

    return { shouldNotify: false, message: '' };
};

/**
 * Evaluate snow alert rule
 */
const evaluateSnowAlert = (
    rule: SnowAlertRule,
    forecast: ForecastData
): { shouldNotify: boolean; message: string } => {
    if (!forecast?.forecast?.length) {
        return { shouldNotify: false, message: '' };
    }

    const now = Date.now();
    const lookAheadMs = rule.hoursAhead * 60 * 60 * 1000;
    const windowEnd = now + lookAheadMs;

    const snowForecast = forecast.forecast.find((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        const desc = item.description?.toLowerCase() || '';
        const isSnow = desc.includes('snow');

        return itemTime >= now && itemTime <= windowEnd && isSnow;
    });

    if (snowForecast) {
        const time = new Date(snowForecast.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        return {
            shouldNotify: true,
            message: `🌨️ Snowfall expected around ${time}. Prepare for winter conditions!`,
        };
    }

    return { shouldNotify: false, message: '' };
};

// ============== MAIN EVALUATION FUNCTION ==============

interface EvaluationContext {
    weather: WeatherData;
    forecast: ForecastData;
    aqi: number | null;
}

/**
 * Evaluate a single rule and trigger notification if conditions are met
 */
export const evaluateRule = async (
    rule: NotificationRule,
    context: EvaluationContext
): Promise<boolean> => {
    // Skip disabled rules
    if (!rule.enabled) {
        return false;
    }

    // Check cooldown (don't trigger same notification within 1 hour)
    if (wasRecentlyTriggered(rule, 60)) {
        return false;
    }

    let evaluation: { shouldNotify: boolean; message: string } = {
        shouldNotify: false,
        message: '',
    };

    try {
        switch (rule.type) {
            case 'temperature_threshold':
                evaluation = evaluateTemperatureThreshold(rule as TemperatureThresholdRule, context.weather);
                break;
            case 'rain_alert':
                evaluation = evaluateRainAlert(rule as RainAlertRule, context.forecast);
                break;
            case 'golden_hour':
                evaluation = evaluateGoldenHour(rule as GoldenHourRule, context.weather);
                break;
            case 'humidity_alert':
                evaluation = evaluateHumidityAlert(rule as HumidityAlertRule, context.weather);
                break;
            case 'air_quality_alert':
                evaluation = evaluateAirQualityAlert(rule as AirQualityAlertRule, context.aqi);
                break;
            case 'visibility_alert':
                evaluation = evaluateVisibilityAlert(rule as VisibilityAlertRule, context.weather);
                break;
            case 'close_windows':
                evaluation = evaluateCloseWindows(rule as CloseWindowsRule, context.forecast);
                break;
            case 'heating_cooling':
                evaluation = evaluateHeatingCooling(
                    rule as HeatingCoolingRule,
                    context.weather,
                    context.forecast
                );
                break;
            case 'frost_freeze':
                evaluation = evaluateFrostFreeze(rule as FrostFreezeRule, context.forecast);
                break;
            case 'heat_wave':
                evaluation = evaluateHeatWave(
                    rule as HeatWaveRule,
                    context.weather,
                    context.forecast
                );
                break;
            case 'storm_approaching':
                evaluation = evaluateStormApproaching(rule as StormApproachingRule, context.forecast);
                break;
            case 'snow_alert':
                evaluation = evaluateSnowAlert(rule as SnowAlertRule, context.forecast);
                break;
            // Morning and evening summaries are handled separately via scheduled notifications
            case 'morning_summary':
            case 'evening_summary':
                return false;
            default:
                return false;
        }

        if (evaluation.shouldNotify) {
            const typeInfo = getNotificationTypeInfo(rule.type);
            const title = typeInfo?.title || 'Weather Alert';
            const location = rule.cityName || context.weather.location.name;

            // Present the notification
            await presentNotification(
                `${title} - ${location}`,
                evaluation.message,
                { ruleId: rule.id, ruleType: rule.type }
            );

            // Update store
            const store = useNotificationsStore.getState();
            store.updateRuleLastTriggered(rule.id);
            store.addHistoryItem({
                id: `history_${Date.now()}`,
                ruleId: rule.id,
                ruleType: rule.type,
                title,
                body: evaluation.message,
                triggeredAt: new Date().toISOString(),
                cityName: location,
            });

            return true;
        }
    } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
    }

    return false;
};

/**
 * Evaluate all enabled rules against current weather data
 */
export const evaluateAllRules = async (
    context: EvaluationContext
): Promise<number> => {
    const store = useNotificationsStore.getState();
    const enabledRules = store.getEnabledRules();

    let triggeredCount = 0;

    for (const rule of enabledRules) {
        const triggered = await evaluateRule(rule, context);
        if (triggered) {
            triggeredCount++;
        }
    }

    // Update last check timestamp
    store.setLastCheckTimestamp(new Date().toISOString());

    return triggeredCount;
};

/**
 * Schedule morning summary notification
 */
export const scheduleMorningSummary = async (
    rule: MorningSummaryRule,
    weather: WeatherData
): Promise<void> => {
    const identifier = `morning_summary_${rule.id}`;
    const { temp, description } = weather.current;
    const location = rule.cityName || weather.location.name;

    await scheduleDailyNotification(
        `☀️ Good Morning! - ${location}`,
        `Today: ${Math.round(temp)}°C, ${description}. Have a great day!`,
        rule.hour,
        rule.minute,
        identifier,
        { ruleId: rule.id, ruleType: 'morning_summary' }
    );
};

/**
 * Schedule evening summary notification
 */
export const scheduleEveningSummary = async (
    rule: EveningSummaryRule,
    weather: WeatherData,
    forecast: ForecastData
): Promise<void> => {
    const identifier = `evening_summary_${rule.id}`;
    const location = rule.cityName || weather.location.name;

    // Get tomorrow's forecast (first item from tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    const tomorrowForecast = forecast?.forecast?.find((item) => {
        const itemDate = new Date(item.timestamp);
        return itemDate.getDate() === tomorrow.getDate();
    });

    const temp = tomorrowForecast?.temp ?? weather.current.temp;
    const desc = tomorrowForecast?.description ?? weather.current.description;

    await scheduleDailyNotification(
        `🌙 Evening Forecast - ${location}`,
        `Tomorrow: ${Math.round(temp)}°C, ${desc}. Sleep well!`,
        rule.hour,
        rule.minute,
        identifier,
        { ruleId: rule.id, ruleType: 'evening_summary' }
    );
};

/**
 * Update all scheduled summary notifications
 */
export const updateScheduledSummaries = async (
    weather: WeatherData,
    forecast: ForecastData
): Promise<void> => {
    const store = useNotificationsStore.getState();
    const rules = store.rules;

    for (const rule of rules) {
        if (!rule.enabled) continue;

        if (rule.type === 'morning_summary') {
            await scheduleMorningSummary(rule as MorningSummaryRule, weather);
        } else if (rule.type === 'evening_summary') {
            await scheduleEveningSummary(rule as EveningSummaryRule, weather, forecast);
        }
    }
};

/**
 * Initialize notification service
 */
export const initializeNotificationService = async (): Promise<boolean> => {
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
        console.log('Notification permissions not granted');
        return false;
    }

    console.log('Notification service initialized');
    return true;
};
