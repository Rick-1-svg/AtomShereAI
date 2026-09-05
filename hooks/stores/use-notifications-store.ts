import {
    NotificationHistoryItem,
    NotificationRule,
    NotificationRuleType,
} from '@/types/notifications';
import { platformStorage } from '@/utils/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Notifications Store Interface
 * 
 * Manages notification rules and history with persistence.
 * All data is stored in AsyncStorage for cross-session availability.
 */
interface NotificationsState {
    // Notification rules
    rules: NotificationRule[];

    // Notification history (last 50 notifications)
    history: NotificationHistoryItem[];

    // Last check timestamp
    lastCheckTimestamp: string | null;

    // Hydration state
    _hasHydrated: boolean;

    // Rule CRUD actions
    addRule: (rule: NotificationRule) => void;
    updateRule: (id: string, updates: Partial<NotificationRule>) => void;
    removeRule: (id: string) => void;
    toggleRule: (id: string) => void;

    // Get rules by type or city
    getRulesByType: (type: NotificationRuleType) => NotificationRule[];
    getRulesByCity: (cityId: string) => NotificationRule[];
    getEnabledRules: () => NotificationRule[];

    // History actions
    addHistoryItem: (item: NotificationHistoryItem) => void;
    clearHistory: () => void;

    // Update last triggered timestamp for a rule
    updateRuleLastTriggered: (ruleId: string) => void;

    // Last check timestamp
    setLastCheckTimestamp: (timestamp: string) => void;

    // Hydration
    setHasHydrated: (hydrated: boolean) => void;
}

// Maximum history items to keep
const MAX_HISTORY_ITEMS = 50;

/**
 * Notifications store with persistent state
 */
export const useNotificationsStore = create<NotificationsState>()(
    persist(
        (set, get) => ({
            // Initial state
            rules: [],
            history: [],
            lastCheckTimestamp: null,
            _hasHydrated: false,

            // Add a new notification rule
            addRule: (rule: NotificationRule) =>
                set((state) => ({
                    rules: [...state.rules, rule],
                })),

            // Update an existing rule
            updateRule: (id: string, updates: Partial<NotificationRule>) =>
                set((state) => ({
                    rules: state.rules.map((rule) =>
                        rule.id === id ? ({ ...rule, ...updates } as NotificationRule) : rule
                    ),
                })),

            // Remove a rule
            removeRule: (id: string) =>
                set((state) => ({
                    rules: state.rules.filter((rule) => rule.id !== id),
                })),

            // Toggle a rule's enabled state
            toggleRule: (id: string) =>
                set((state) => ({
                    rules: state.rules.map((rule) =>
                        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
                    ),
                })),

            // Get rules by type
            getRulesByType: (type: NotificationRuleType) => {
                const state = get();
                return state.rules.filter((rule) => rule.type === type);
            },

            // Get rules by city
            getRulesByCity: (cityId: string) => {
                const state = get();
                return state.rules.filter((rule) => rule.cityId === cityId);
            },

            // Get only enabled rules
            getEnabledRules: () => {
                const state = get();
                return state.rules.filter((rule) => rule.enabled);
            },

            // Add a history item (keeps last MAX_HISTORY_ITEMS)
            addHistoryItem: (item: NotificationHistoryItem) =>
                set((state) => {
                    const newHistory = [item, ...state.history].slice(0, MAX_HISTORY_ITEMS);
                    return { history: newHistory };
                }),

            // Clear all history
            clearHistory: () => set({ history: [] }),

            // Update last triggered timestamp for a rule
            updateRuleLastTriggered: (ruleId: string) =>
                set((state) => ({
                    rules: state.rules.map((rule) =>
                        rule.id === ruleId
                            ? { ...rule, lastTriggered: new Date().toISOString() }
                            : rule
                    ),
                })),

            // Set last check timestamp
            setLastCheckTimestamp: (timestamp: string) =>
                set({ lastCheckTimestamp: timestamp }),

            // Hydration
            setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),
        }),
        {
            name: 'notifications-storage',
            storage: createJSONStorage(() => platformStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            // Version for future migrations
            version: 1,
        }
    )
);

// Helper to check if a rule was recently triggered (within cooldown period)
export const wasRecentlyTriggered = (
    rule: NotificationRule,
    cooldownMinutes: number = 60
): boolean => {
    if (!rule.lastTriggered) return false;

    const lastTriggered = new Date(rule.lastTriggered).getTime();
    const now = Date.now();
    const cooldownMs = cooldownMinutes * 60 * 1000;

    return now - lastTriggered < cooldownMs;
};

// Helper to get rule count by category
export const getRuleCountByCategory = (): Record<string, number> => {
    const state = useNotificationsStore.getState();
    const counts: Record<string, number> = {
        weather: 0,
        schedule: 0,
        safety: 0,
        comfort: 0,
    };

    state.rules.forEach((rule) => {
        switch (rule.type) {
            case 'temperature_threshold':
            case 'rain_alert':
            case 'snow_alert':
                counts.weather++;
                break;
            case 'morning_summary':
            case 'evening_summary':
            case 'golden_hour':
                counts.schedule++;
                break;
            case 'frost_freeze':
            case 'heat_wave':
            case 'storm_approaching':
            case 'visibility_alert':
                counts.safety++;
                break;
            case 'humidity_alert':
            case 'air_quality_alert':
            case 'close_windows':
            case 'heating_cooling':
                counts.comfort++;
                break;
        }
    });

    return counts;
};
