import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolate,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { AIWeatherInsight, ActivityRecommendation, ClothingSuggestion, WeatherAlert } from '../../types/aiSummary';
import { ThemedText } from '../themed-text';

interface AISummaryProps {
  summary?: string | null;
  insights?: AIWeatherInsight | null;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

// Enhanced color palettes with gradients
const SUITABILITY_GRADIENTS = {
  excellent: ['#10b981', '#059669'] as const,
  good: ['#84cc16', '#65a30d'] as const,
  fair: ['#f59e0b', '#d97706'] as const,
  poor: ['#ef4444', '#dc2626'] as const,
};

const PRIORITY_GRADIENTS = {
  essential: ['#ef4444', '#dc2626'] as const,
  recommended: ['#3b82f6', '#2563eb'] as const,
  optional: ['#64748b', '#475569'] as const,
};

const SEVERITY_GRADIENTS = {
  info: ['#3b82f6', '#2563eb'] as const,
  warning: ['#f59e0b', '#d97706'] as const,
  urgent: ['#ef4444', '#dc2626'] as const,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Quick action button component
const ActionButton: React.FC<{
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ label, onPress, variant = 'secondary' }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, styles.actionButton]}
    >
      <ThemedText style={[
        styles.actionButtonText,
        variant === 'primary' && styles.actionButtonTextPrimary
      ]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
};

// Activity card with gradient and actions
const ActivityCard: React.FC<{ item: ActivityRecommendation; index: number }> = ({ item, index }) => {
  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await Share.share({
        message: `${item.emoji} ${item.activity}\n${item.reason}\n\nSuitability: ${item.suitability}`,
        title: 'Activity Recommendation',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(index * 100).springify()}
      style={styles.card}
    >
      <LinearGradient
        colors={SUITABILITY_GRADIENTS[item.suitability]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradientBorder}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleRow}>
              {/*ThemedText style={styles.emoji}>{item.emoji}</ThemedText>*/}
              <ThemedText style={styles.cardTitle} numberOfLines={2}>{item.activity}</ThemedText>
            </View>
            <LinearGradient
              colors={SUITABILITY_GRADIENTS[item.suitability]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <ThemedText style={styles.badgeText}>{item.suitability}</ThemedText>
            </LinearGradient>
          </View>
          <ThemedText style={styles.cardReason}>{item.reason}</ThemedText>
          <View style={styles.cardActions}>
            <ActionButton label="📤 Share" onPress={handleShare} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Clothing card with copy action
const ClothingCard: React.FC<{ item: ClothingSuggestion; index: number }> = ({ item, index }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`${item.emoji} ${item.item}\n${item.reason}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(index * 100).springify()}
      style={styles.card}
    >
      <LinearGradient
        colors={PRIORITY_GRADIENTS[item.priority]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradientBorder}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
              <ThemedText style={styles.cardTitle} numberOfLines={2}>{item.item}</ThemedText>
            </View>
            <LinearGradient
              colors={PRIORITY_GRADIENTS[item.priority]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <ThemedText style={styles.badgeText}>{item.priority}</ThemedText>
            </LinearGradient>
          </View>
          <ThemedText style={styles.cardReason}>{item.reason}</ThemedText>
          <View style={styles.cardActions}>
            <ActionButton
              label={copied ? "✅ Copied!" : "📋 Copy"}
              onPress={handleCopy}
              variant={copied ? 'primary' : 'secondary'}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Alert card with pulsing effect for urgent alerts
const AlertCard: React.FC<{ item: WeatherAlert; index: number }> = ({ item, index }) => {
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (item.severity === 'urgent') {
      pulseOpacity.value = withTiming(0.6, { duration: 1000 }, () => {
        pulseOpacity.value = withTiming(1, { duration: 1000 });
      });
    }
  }, [item.severity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: item.severity === 'urgent' ? pulseOpacity.value : 1,
  }));

  return (
    <View>
      <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={SEVERITY_GRADIENTS[item.severity]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.alertGradientBorder}
          >
            <View style={styles.alertCardInner}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
                <ThemedText style={styles.alertMessage} numberOfLines={3}>{item.message}</ThemedText>
              </View>
              {item.timing && (
                <ThemedText style={styles.alertTiming}>⏰ {item.timing}</ThemedText>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// Collapsible section with smooth animations
const CollapsibleSection: React.FC<{
  title: string;
  emoji: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ title, emoji, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 90 : 0);
  const height = useSharedValue(defaultExpanded ? 1 : 0);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setExpanded(!expanded);
    rotation.value = withSpring(expanded ? 0 : 90);
    height.value = withTiming(expanded ? 0 : 1);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    maxHeight: interpolate(height.value, [0, 1], [0, 2000], Extrapolate.CLAMP),
  }));

  return (
    <View style={styles.section}>
      <Pressable onPress={handleToggle} style={styles.sectionHeader}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionHeaderGradient}
        >
          <ThemedText style={styles.sectionEmoji}>{emoji}</ThemedText>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          <Animated.Text style={[styles.chevron, chevronStyle]}>▶</Animated.Text>
        </LinearGradient>
      </Pressable>
      <Animated.View style={[styles.sectionContent, contentStyle]}>
        {expanded && children}
      </Animated.View>
    </View>
  );
};

// Enhanced shimmer loading effect
const ShimmerLoading: React.FC = () => {
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withTiming(1, { duration: 1500 }, () => {
      shimmer.value = 0;
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
      <View style={styles.shimmerBar} />
      <View style={[styles.shimmerBar, { width: '80%', marginTop: 8 }]} />
      <View style={[styles.shimmerBar, { width: '60%', marginTop: 8 }]} />
    </Animated.View>
  );
};

// Main component
export const AISummary: React.FC<AISummaryProps> = ({
  summary,
  insights,
  isLoading,
  error,
  onRefresh
}) => {
  const hasStructuredData = insights && (
    insights.activityRecommendations?.length > 0 ||
    insights.clothingSuggestions?.length > 0 ||
    insights.alerts?.length > 0
  );

  const handleRetry = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRefresh?.();
  };

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <ThemedText type="subtitle" style={styles.title}>✨ AI Weather Insights</ThemedText>
        {!isLoading && !error && onRefresh && (
          <Pressable onPress={handleRetry} style={styles.refreshButton}>
            <ThemedText style={styles.refreshIcon}>🔄</ThemedText>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ShimmerLoading />
      ) : error ? (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.errorContainer}>
          <ThemedText style={styles.errorEmoji}>😔</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          {onRefresh && (
            <Pressable onPress={handleRetry} style={styles.retryButton}>
              <ThemedText style={styles.retryButtonText}>Tap to Retry</ThemedText>
            </Pressable>
          )}
        </Animated.View>
      ) : hasStructuredData ? (
        <Animated.View entering={FadeInUp.duration(600)} style={styles.insightsContainer}>
          {/* Summary Section with gradient text effect */}
          {insights?.summary && (
            <Animated.View entering={FadeInUp.duration(500)}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
                style={styles.summaryGradient}
              >
                <ThemedText style={styles.summaryText}>{insights.summary}</ThemedText>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Alerts Section - Show first if urgent */}
          {insights?.alerts && insights.alerts.length > 0 && (
            <CollapsibleSection title="Weather Alerts" emoji="⚠️">
              {insights.alerts.map((alert, index) => (
                <AlertCard key={index} item={alert} index={index} />
              ))}
            </CollapsibleSection>
          )}

          {/* Activities Section */}
          {insights?.activityRecommendations && insights.activityRecommendations.length > 0 && (
            <CollapsibleSection title="Activity Ideas" emoji="🏃">
              {insights.activityRecommendations.map((activity, index) => (
                <ActivityCard key={index} item={activity} index={index} />
              ))}
            </CollapsibleSection>
          )}

          {/* Clothing Section */}
          {insights?.clothingSuggestions && insights.clothingSuggestions.length > 0 && (
            <CollapsibleSection title="What to Wear" emoji="👕">
              {insights.clothingSuggestions.map((clothing, index) => (
                <ClothingCard key={index} item={clothing} index={index} />
              ))}
            </CollapsibleSection>
          )}

          {/* Safety Tips */}
          {insights?.safetyTips && insights.safetyTips.length > 0 && (
            <CollapsibleSection title="Safety Tips" emoji="🛡️" defaultExpanded={false}>
              {insights.safetyTips.map((tip, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInUp.duration(300).delay(index * 50)}
                >
                  <ThemedText style={styles.safetyTip}>• {tip}</ThemedText>
                </Animated.View>
              ))}
            </CollapsibleSection>
          )}
        </Animated.View>
      ) : summary ? (
        <ThemedText style={styles.summaryText}>{summary}</ThemedText>
      ) : (
        <ThemedText style={styles.noSummaryText}>No AI summary available.</ThemedText>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshIcon: {
    fontSize: 18,
  },
  shimmerContainer: {
    paddingVertical: 20,
  },
  shimmerBar: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    width: '100%',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  retryButtonText: {
    color: '#60a5fa',
    fontSize: 15,
    fontWeight: '600',
  },
  summaryGradient: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#f1f5f9',
  },
  noSummaryText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#cbd5e1',
    paddingVertical: 20,
  },
  insightsContainer: {
    gap: 14,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sectionHeader: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  sectionHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    letterSpacing: 0.3,
  },
  chevron: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  sectionContent: {
    overflow: 'hidden',
  },
  card: {
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 12,
  },
  cardGradientBorder: {
    borderRadius: 12,
    padding: 2,
  },
  cardInner: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 10,
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  emoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    flexWrap: 'wrap',
  },
  cardReason: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: '#60a5fa',
  },
  alertGradientBorder: {
    borderRadius: 12,
    padding: 2,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  alertCardInner: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 10,
    padding: 14,
  },
  alertMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    lineHeight: 21,
  },
  alertTiming: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    marginLeft: 34,
    fontStyle: 'italic',
  },
  safetyTip: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});