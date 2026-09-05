/**
 * Structured AI Weather Insight Types
 * Used for activity recommendations, clothing suggestions, and natural language alerts
 */

export interface AIWeatherInsight {
    summary: string;                              // Main weather overview
    activityRecommendations: ActivityRecommendation[];
    clothingSuggestions: ClothingSuggestion[];
    alerts: WeatherAlert[];
    safetyTips?: string[];                        // Optional safety advice
}

export interface ActivityRecommendation {
    activity: string;                             // e.g., "Running", "Beach day"
    suitability: 'excellent' | 'good' | 'fair' | 'poor';
    reason: string;                               // e.g., "Clear skies and mild temperature"
    emoji: string;                                // e.g., "🏃"
}

export interface ClothingSuggestion {
    item: string;                                 // e.g., "Light jacket"
    priority: 'essential' | 'recommended' | 'optional';
    reason: string;
    emoji: string;
}

export interface WeatherAlert {
    type: 'rain' | 'storm' | 'heat' | 'cold' | 'wind' | 'uv' | 'general';
    message: string;                              // Natural language alert
    timing?: string;                              // e.g., "at 5PM", "this evening"
    severity: 'info' | 'warning' | 'urgent';
    emoji: string;
}

// Default empty insight for error cases
export const EMPTY_INSIGHT: AIWeatherInsight = {
    summary: '',
    activityRecommendations: [],
    clothingSuggestions: [],
    alerts: [],
    safetyTips: [],
};
