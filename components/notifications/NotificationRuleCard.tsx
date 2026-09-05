import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import {
    getNotificationTypeInfo,
    NotificationRule,
} from '@/types/notifications';

interface NotificationRuleCardProps {
    rule: NotificationRule;
    onToggle: (id: string) => void;
    onEdit: (rule: NotificationRule) => void;
    onDelete: (id: string) => void;
    index?: number;
}

/**
 * Get a human-readable description of the rule configuration
 */
const getRuleDescription = (rule: NotificationRule): string => {
    switch (rule.type) {
        case 'temperature_threshold': {
            const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
            return `Alert when temp ${rule.condition === 'below' ? 'drops below' : 'exceeds'} ${rule.threshold}${unit}`;
        }
        case 'rain_alert':
            return `Alert ${rule.hoursAhead}h before rain (>${rule.probabilityThreshold}% chance)`;
        case 'morning_summary':
            return `Daily at ${rule.hour.toString().padStart(2, '0')}:${rule.minute.toString().padStart(2, '0')}`;
        case 'evening_summary':
            return `Daily at ${rule.hour.toString().padStart(2, '0')}:${rule.minute.toString().padStart(2, '0')}`;
        case 'golden_hour': {
            const times = [];
            if (rule.notifyMorning) times.push('morning');
            if (rule.notifyEvening) times.push('evening');
            return `${rule.advanceNotice}min before ${times.join(' & ')} golden hour`;
        }
        case 'humidity_alert':
            return `Alert when humidity ${rule.condition === 'below' ? 'drops below' : 'exceeds'} ${rule.threshold}%`;
        case 'air_quality_alert': {
            const levels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
            return `Alert when AQI ≥ ${rule.aqiThreshold} (${levels[rule.aqiThreshold] || ''})`;
        }
        case 'visibility_alert':
            return `Alert when visibility < ${rule.thresholdKm}km`;
        case 'close_windows':
            return `Remind ${rule.hoursAhead}h before rain (>${rule.rainProbabilityThreshold}%)`;
        case 'heating_cooling': {
            const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
            return `Heat <${rule.coldThreshold}${unit}, Cool >${rule.hotThreshold}${unit}`;
        }
        case 'frost_freeze':
            return `Alert ${rule.hoursAhead}h before temp drops below 0°C`;
        case 'heat_wave': {
            const unit = rule.unit === 'fahrenheit' ? '°F' : '°C';
            return `Alert when temp ≥ ${rule.threshold}${unit}`;
        }
        case 'storm_approaching':
            return `Alert ${rule.hoursAhead}h before thunderstorms`;
        case 'snow_alert':
            return `Alert ${rule.hoursAhead}h before snowfall`;
        default:
            return 'Custom notification';
    }
};

export const NotificationRuleCard: React.FC<NotificationRuleCardProps> = ({
    rule,
    onToggle,
    onEdit,
    onDelete,
    index = 0,
}) => {
    const typeInfo = getNotificationTypeInfo(rule.type);
    const description = getRuleDescription(rule);

    return (
        <Animated.View
            entering={FadeInRight.delay(index * 50).springify()}
            exiting={FadeOutLeft}
            style={[styles.container, !rule.enabled && styles.containerDisabled]}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: `${typeInfo?.iconColor}20` }]}>
                    <MaterialCommunityIcons
                        name={(typeInfo?.icon as keyof typeof MaterialCommunityIcons.glyphMap) || 'bell'}
                        size={24}
                        color={typeInfo?.iconColor || '#a5b4fc'}
                    />
                </View>

                <View style={styles.textContainer}>
                    <ThemedText style={styles.title}>{typeInfo?.title || 'Notification'}</ThemedText>
                    <ThemedText style={styles.description}>{description}</ThemedText>
                    {rule.cityName && (
                        <View style={styles.locationBadge}>
                            <MaterialCommunityIcons name="map-marker" size={12} color="#94a3b8" />
                            <ThemedText style={styles.locationText}>
                                {rule.cityName}{rule.cityCountry ? `, ${rule.cityCountry}` : ''}
                            </ThemedText>
                        </View>
                    )}
                </View>

                <View style={styles.actions}>
                    <Switch
                        value={rule.enabled}
                        onValueChange={() => onToggle(rule.id)}
                        trackColor={{ false: '#3f3f46', true: '#4f46e5' }}
                        thumbColor={rule.enabled ? '#a5b4fc' : '#71717a'}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Pressable
                    style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}
                    onPress={() => onEdit(rule)}
                >
                    <MaterialCommunityIcons name="pencil" size={16} color="#a5b4fc" />
                    <ThemedText style={styles.footerButtonText}>Edit</ThemedText>
                </Pressable>

                <View style={styles.footerDivider} />

                <Pressable
                    style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}
                    onPress={() => onDelete(rule.id)}
                >
                    <MaterialCommunityIcons name="delete" size={16} color="#ef4444" />
                    <ThemedText style={[styles.footerButtonText, { color: '#ef4444' }]}>Delete</ThemedText>
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 12,
        overflow: 'hidden',
    },
    containerDisabled: {
        opacity: 0.6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    description: {
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 18,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    actions: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    footerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    footerButtonPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    footerButtonText: {
        fontSize: 14,
        color: '#a5b4fc',
        fontWeight: '500',
    },
    footerDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});

export default NotificationRuleCard;
