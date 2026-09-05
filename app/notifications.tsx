import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AccessibilityInfo,
    Alert,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CreateNotificationModal } from '@/components/notifications/CreateNotificationModal';
import { NotificationRuleCard } from '@/components/notifications/NotificationRuleCard';
import { ThemedText } from '@/components/themed-text';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useNotificationsStore } from '@/hooks/stores/use-notifications-store';
import { useLocation } from '@/hooks/use-location';
import { fetchAllWeatherData } from '@/services/api';
import {
    evaluateAllRules,
    initializeNotificationService,
    requestNotificationPermissions,
    updateScheduledSummaries,
} from '@/services/notificationService';
import {
    NOTIFICATION_TYPES,
    NotificationRule,
    getNotificationTypeInfo,
} from '@/types/notifications';

// Error boundary types
interface ErrorState {
    hasError: boolean;
    message: string | null;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { location } = useLocation();
    const {
        rules,
        history,
        addRule,
        updateRule,
        removeRule,
        toggleRule,
        _hasHydrated,
    } = useNotificationsStore();

    // State management
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [testingNotifications, setTestingNotifications] = useState(false);
    const [savingRule, setSavingRule] = useState(false);
    const [error, setError] = useState<ErrorState>({ hasError: false, message: null });

    // Animation values for Add button
    const addButtonScale = useSharedValue(1);

    // Memoized animated style for Add button
    const addButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: addButtonScale.value }],
    }));

    // Initialize notification service on mount
    useEffect(() => {
        const init = async () => {
            try {
                const granted = await initializeNotificationService();
                setPermissionGranted(granted);
                setError({ hasError: false, message: null });
            } catch (err) {
                console.error('Failed to initialize notifications:', err);
                setError({
                    hasError: true,
                    message: 'Failed to initialize notification service. Some features may not work.',
                });
            }
        };
        init();
    }, []);

    // Announce screen changes for accessibility
    useEffect(() => {
        if (_hasHydrated) {
            AccessibilityInfo.announceForAccessibility(
                `Notifications screen loaded. ${rules.length} notification rules configured.`
            );
        }
    }, [_hasHydrated, rules.length]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        setError({ hasError: false, message: null });

        try {
            // Re-check permissions
            const granted = await requestNotificationPermissions();
            setPermissionGranted(granted);

            // If we have location, update scheduled summaries
            if (location && granted) {
                const { weather, forecast } = await fetchAllWeatherData(
                    location.coords.latitude,
                    location.coords.longitude
                );
                if (weather && forecast) {
                    await updateScheduledSummaries(weather, forecast);
                }
            }
        } catch (err) {
            console.error('Error refreshing notifications:', err);
            setError({
                hasError: true,
                message: 'Failed to refresh. Please try again.',
            });
        } finally {
            setRefreshing(false);
        }
    }, [location]);

    const handleTestNotifications = useCallback(async () => {
        if (!location) {
            Alert.alert(
                'Location Required',
                'Please enable location access to test notifications.',
                [{ text: 'OK' }],
                { cancelable: true }
            );
            return;
        }

        // Haptic feedback
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        setTestingNotifications(true);
        setError({ hasError: false, message: null });

        try {
            const { weather, forecast, aqi } = await fetchAllWeatherData(
                location.coords.latitude,
                location.coords.longitude
            );

            if (weather && forecast) {
                const triggeredCount = await evaluateAllRules({ weather, forecast, aqi });

                if (triggeredCount > 0) {
                    Alert.alert(
                        'Notifications Triggered',
                        `${triggeredCount} notification(s) were triggered based on current conditions.`,
                        [{ text: 'OK' }]
                    );
                    AccessibilityInfo.announceForAccessibility(
                        `${triggeredCount} notifications triggered`
                    );
                } else {
                    Alert.alert(
                        'No Notifications',
                        'No notification conditions were met based on current weather data.',
                        [{ text: 'OK' }]
                    );
                    AccessibilityInfo.announceForAccessibility('No notifications triggered');
                }
            }
        } catch (err) {
            console.error('Error testing notifications:', err);
            Alert.alert('Error', 'Failed to test notifications. Please try again.');
            setError({
                hasError: true,
                message: 'Failed to test notifications.',
            });
        } finally {
            setTestingNotifications(false);
        }
    }, [location]);

    // Enhanced Add Notification handler with haptics and animation
    const handleOpenModal = useCallback(() => {
        // Haptic feedback
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Button press animation
        addButtonScale.value = withSpring(0.95, { damping: 15 }, () => {
            addButtonScale.value = withSpring(1);
        });

        // Clear any previous errors
        setError({ hasError: false, message: null });
        setEditingRule(null);
        setModalVisible(true);

        // Accessibility announcement
        AccessibilityInfo.announceForAccessibility('Opening notification creation form');
    }, [addButtonScale]);

    const handleEditRule = useCallback((rule: NotificationRule) => {
        // Haptic feedback
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        setEditingRule(rule);
        setModalVisible(true);

        AccessibilityInfo.announceForAccessibility(`Editing ${getNotificationTypeInfo(rule.type)?.title || 'notification'} rule`);
    }, []);

    const handleDeleteRule = useCallback((id: string) => {
        // Haptic feedback
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        const ruleToDelete = rules.find(r => r.id === id);
        const ruleName = ruleToDelete ? getNotificationTypeInfo(ruleToDelete.type)?.title : 'notification';

        Alert.alert(
            'Delete Notification',
            `Are you sure you want to delete this ${ruleName} rule?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        try {
                            removeRule(id);
                            if (Platform.OS !== 'web') {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                            AccessibilityInfo.announceForAccessibility('Notification rule deleted');
                        } catch (err) {
                            console.error('Error deleting rule:', err);
                            setError({
                                hasError: true,
                                message: 'Failed to delete notification rule.',
                            });
                        }
                    },
                },
            ]
        );
    }, [removeRule, rules]);

    // Enhanced save handler with validation and error handling
    const handleSaveRule = useCallback(async (rule: NotificationRule) => {
        setSavingRule(true);
        setError({ hasError: false, message: null });

        try {
            // Validate rule before saving
            if (!rule.id || !rule.type) {
                throw new Error('Invalid notification rule: missing required fields');
            }

            // Save rule
            if (editingRule) {
                updateRule(rule.id, rule);
                AccessibilityInfo.announceForAccessibility('Notification rule updated successfully');
            } else {
                addRule(rule);
                AccessibilityInfo.announceForAccessibility('Notification rule created successfully');
            }

            // Success haptic feedback
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            setModalVisible(false);
            setEditingRule(null);
        } catch (err) {
            console.error('Error saving rule:', err);
            setError({
                hasError: true,
                message: err instanceof Error ? err.message : 'Failed to save notification rule.',
            });
            Alert.alert('Error', 'Failed to save notification rule. Please try again.');

            // Error haptic feedback
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } finally {
            setSavingRule(false);
        }
    }, [editingRule, addRule, updateRule]);

    const handleToggleRule = useCallback((id: string) => {
        // Haptic feedback
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        try {
            toggleRule(id);
            const rule = rules.find(r => r.id === id);
            const newState = rule ? !rule.enabled : false;
            AccessibilityInfo.announceForAccessibility(
                `Notification ${newState ? 'enabled' : 'disabled'}`
            );
        } catch (err) {
            console.error('Error toggling rule:', err);
            setError({
                hasError: true,
                message: 'Failed to toggle notification rule.',
            });
        }
    }, [toggleRule, rules]);

    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
        setEditingRule(null);
        AccessibilityInfo.announceForAccessibility('Notification form closed');
    }, []);

    // Memoized grouped rules for performance
    const groupedRules = useMemo(() => {
        const groups: Record<string, NotificationRule[]> = {
            weather: [],
            schedule: [],
            safety: [],
            comfort: [],
        };

        rules.forEach((rule) => {
            const typeInfo = getNotificationTypeInfo(rule.type);
            if (typeInfo) {
                groups[typeInfo.category].push(rule);
            }
        });

        return groups;
    }, [rules]);

    // Memoized stats for performance
    const stats = useMemo(() => ({
        total: rules.length,
        enabled: rules.filter((r) => r.enabled).length,
        triggered: history.length,
    }), [rules, history.length]);

    if (!_hasHydrated) {
        return (
            <ScreenLayout useSafeArea>
                <View
                    style={styles.loadingContainer}
                    accessibilityRole="progressbar"
                    accessibilityLabel="Loading notifications"
                >
                    <ThemedText>Loading...</ThemedText>
                </View>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout useSafeArea={false}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#a5b4fc"
                        colors={['#a5b4fc']}
                        accessibilityLabel="Pull to refresh notifications"
                    />
                }
                accessibilityRole="scrollbar"
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        accessibilityHint="Returns to the previous screen"
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#a5b4fc" />
                    </Pressable>
                    <ThemedText type="title" style={styles.title}>Notifications</ThemedText>
                    <View style={styles.placeholder} />
                </Animated.View>

                {/* Error Banner */}
                {error.hasError && (
                    <Animated.View entering={FadeIn} style={styles.errorBanner}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                        <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                        <Pressable
                            onPress={() => setError({ hasError: false, message: null })}
                            accessibilityRole="button"
                            accessibilityLabel="Dismiss error"
                        >
                            <MaterialCommunityIcons name="close" size={18} color="#94a3b8" />
                        </Pressable>
                    </Animated.View>
                )}

                {/* Permission warning */}
                {permissionGranted === false && (
                    <Animated.View
                        entering={FadeIn}
                        style={styles.permissionWarning}
                        accessibilityRole="alert"
                    >
                        <MaterialCommunityIcons name="bell-off" size={24} color="#fbbf24" />
                        <View style={styles.permissionWarningText}>
                            <ThemedText style={styles.permissionTitle}>
                                Notifications Disabled
                            </ThemedText>
                            <ThemedText style={styles.permissionDesc}>
                                Enable notifications in your device settings to receive weather alerts.
                            </ThemedText>
                        </View>
                    </Animated.View>
                )}

                {/* Summary stats */}
                <Animated.View
                    entering={FadeInDown.delay(100).springify()}
                    style={styles.statsContainer}
                    accessibilityRole="summary"
                    accessibilityLabel={`${stats.total} rules, ${stats.enabled} enabled, ${stats.triggered} triggered`}
                >
                    <View style={styles.statCard}>
                        <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
                        <ThemedText style={styles.statLabel}>Active Rules</ThemedText>
                    </View>
                    <View style={styles.statCard}>
                        <ThemedText style={styles.statValue}>{stats.enabled}</ThemedText>
                        <ThemedText style={styles.statLabel}>Enabled</ThemedText>
                    </View>
                    <View style={styles.statCard}>
                        <ThemedText style={styles.statValue}>{stats.triggered}</ThemedText>
                        <ThemedText style={styles.statLabel}>Triggered</ThemedText>
                    </View>
                </Animated.View>

                {/* Add notification button */}
                <Animated.View
                    entering={FadeInUp.delay(200).springify()}
                    style={styles.addButtonContainer}
                >
                    <Animated.View style={[{ flex: 1 }, addButtonAnimatedStyle]}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.addButton,
                                pressed && styles.addButtonPressed,
                                savingRule && styles.addButtonDisabled,
                            ]}
                            onPress={handleOpenModal}
                            disabled={savingRule}
                            accessibilityRole="button"
                            accessibilityLabel="Add Notification"
                            accessibilityHint="Opens a form to create a new notification rule"
                            accessibilityState={{ disabled: savingRule }}
                        >
                            <MaterialCommunityIcons
                                name={savingRule ? 'loading' : 'plus'}
                                size={24}
                                color="#0f172a"
                            />
                            <ThemedText style={styles.addButtonText}>
                                {savingRule ? 'Saving...' : 'Add Notification'}
                            </ThemedText>
                        </Pressable>
                    </Animated.View>

                    {rules.length > 0 && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.testButton,
                                pressed && styles.testButtonPressed,
                                testingNotifications && styles.testButtonDisabled,
                            ]}
                            onPress={handleTestNotifications}
                            disabled={testingNotifications}
                            accessibilityRole="button"
                            accessibilityLabel="Test Notifications"
                            accessibilityHint="Tests all notification rules with current weather data"
                            accessibilityState={{ disabled: testingNotifications }}
                        >
                            <MaterialCommunityIcons
                                name={testingNotifications ? 'loading' : 'bell-ring'}
                                size={20}
                                color="#a5b4fc"
                            />
                            <ThemedText style={styles.testButtonText}>
                                {testingNotifications ? 'Testing...' : 'Test Now'}
                            </ThemedText>
                        </Pressable>
                    )}
                </Animated.View>

                {/* Empty state */}
                {rules.length === 0 && (
                    <Animated.View
                        entering={FadeIn.delay(300)}
                        style={styles.emptyState}
                        accessibilityRole="text"
                    >
                        <View style={styles.emptyIconContainer}>
                            <MaterialCommunityIcons name="bell-plus-outline" size={64} color="#4f46e5" />
                        </View>
                        <ThemedText style={styles.emptyTitle}>No notifications yet</ThemedText>
                        <ThemedText style={styles.emptyDesc}>
                            Create custom notifications to stay updated on weather conditions that matter to you.
                        </ThemedText>

                        {/* Quick start suggestions */}
                        <View style={styles.suggestionContainer}>
                            <ThemedText style={styles.suggestionTitle}>Popular notifications</ThemedText>
                            <View style={styles.suggestionList}>
                                {NOTIFICATION_TYPES.slice(0, 4).map((type) => (
                                    <View
                                        key={type.type}
                                        style={styles.suggestionItem}
                                        accessibilityRole="text"
                                        accessibilityLabel={`${type.title}: ${type.description}`}
                                    >
                                        <View style={[styles.suggestionIcon, { backgroundColor: `${type.iconColor}20` }]}>
                                            <MaterialCommunityIcons
                                                name={type.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                                size={20}
                                                color={type.iconColor}
                                            />
                                        </View>
                                        <View style={styles.suggestionText}>
                                            <ThemedText style={styles.suggestionItemTitle}>{type.title}</ThemedText>
                                            <ThemedText style={styles.suggestionItemDesc} numberOfLines={1}>
                                                {type.description}
                                            </ThemedText>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Rules list */}
                {rules.length > 0 && (
                    <Animated.View
                        entering={FadeInUp.delay(300)}
                        style={styles.rulesContainer}
                        accessibilityRole="list"
                        accessibilityLabel="Notification rules"
                    >
                        {Object.entries(groupedRules).map(([category, categoryRules]) => {
                            if (categoryRules.length === 0) return null;

                            return (
                                <View
                                    key={category}
                                    style={styles.categorySection}
                                    accessible={true}
                                    accessibilityLabel={`${category} notifications`}
                                >
                                    <ThemedText style={styles.categoryTitle}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </ThemedText>
                                    {categoryRules.map((rule, index) => (
                                        <NotificationRuleCard
                                            key={rule.id}
                                            rule={rule}
                                            onToggle={handleToggleRule}
                                            onEdit={handleEditRule}
                                            onDelete={handleDeleteRule}
                                            index={index}
                                        />
                                    ))}
                                </View>
                            );
                        })}
                    </Animated.View>
                )}

                {/* Recent history */}
                {history.length > 0 && (
                    <Animated.View
                        entering={FadeInUp.delay(400)}
                        style={styles.historyContainer}
                        accessibilityRole="list"
                        accessibilityLabel="Recent notification history"
                    >
                        <View style={styles.historyHeader}>
                            <ThemedText style={styles.historyTitle}>Recent Notifications</ThemedText>
                            <Pressable
                                onPress={() => {
                                    if (Platform.OS !== 'web') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    useNotificationsStore.getState().clearHistory();
                                    AccessibilityInfo.announceForAccessibility('Notification history cleared');
                                }}
                                style={styles.clearHistoryButton}
                                accessibilityRole="button"
                                accessibilityLabel="Clear history"
                                accessibilityHint="Clears all notification history"
                            >
                                <ThemedText style={styles.clearHistoryText}>Clear</ThemedText>
                            </Pressable>
                        </View>
                        {history.slice(0, 5).map((item) => {
                            const typeInfo = getNotificationTypeInfo(item.ruleType);
                            return (
                                <View
                                    key={item.id}
                                    style={styles.historyItem}
                                    accessible={true}
                                    accessibilityLabel={`${item.title}: ${item.body}`}
                                >
                                    <View style={[styles.historyIcon, { backgroundColor: `${typeInfo?.iconColor || '#a5b4fc'}20` }]}>
                                        <MaterialCommunityIcons
                                            name={(typeInfo?.icon as keyof typeof MaterialCommunityIcons.glyphMap) || 'bell'}
                                            size={16}
                                            color={typeInfo?.iconColor || '#a5b4fc'}
                                        />
                                    </View>
                                    <View style={styles.historyContent}>
                                        <ThemedText style={styles.historyItemTitle}>{item.title}</ThemedText>
                                        <ThemedText style={styles.historyItemBody} numberOfLines={2}>
                                            {item.body}
                                        </ThemedText>
                                        <ThemedText style={styles.historyItemTime}>
                                            {new Date(item.triggeredAt).toLocaleString()}
                                        </ThemedText>
                                    </View>
                                </View>
                            );
                        })}
                    </Animated.View>
                )}

                {/* Bottom padding */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Create/Edit Modal */}
            <CreateNotificationModal
                visible={modalVisible}
                onClose={handleCloseModal}
                onSave={handleSaveRule}
                editingRule={editingRule}
            />
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    title: {
        fontSize: 24,
        color: '#ffffff',
    },
    placeholder: {
        width: 40,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 20,
        padding: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginBottom: 16,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#ef4444',
    },
    permissionWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 20,
        padding: 16,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
        marginBottom: 16,
    },
    permissionWarningText: {
        flex: 1,
    },
    permissionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fbbf24',
    },
    permissionDesc: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#a5b4fc',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    addButtonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    addButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        backgroundColor: '#a5b4fc',
        borderRadius: 12,
    },
    addButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    addButtonDisabled: {
        opacity: 0.6,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(165, 180, 252, 0.3)',
    },
    testButtonPressed: {
        opacity: 0.8,
    },
    testButtonDisabled: {
        opacity: 0.6,
    },
    testButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#a5b4fc',
    },
    emptyState: {
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 32,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    suggestionContainer: {
        width: '100%',
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    suggestionList: {
        gap: 10,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    suggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suggestionText: {
        flex: 1,
    },
    suggestionItemTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
    },
    suggestionItemDesc: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    rulesContainer: {
        paddingHorizontal: 20,
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
    historyContainer: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    clearHistoryButton: {
        padding: 8,
    },
    clearHistoryText: {
        fontSize: 14,
        color: '#ef4444',
    },
    historyItem: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    historyIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyContent: {
        flex: 1,
    },
    historyItemTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff',
    },
    historyItemBody: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    historyItemTime: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
    },
});
