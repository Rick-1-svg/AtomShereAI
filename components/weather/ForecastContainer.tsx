import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SegmentedControl, SegmentedControlOption } from '@/components/ui/SegmentedControl';
import { HourlyForecastView } from '@/components/weather/forecast/HourlyForecastView';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExtendedForecastData, ForecastViewType } from '@/types/weather';
import { mockExtendedForecastData } from '@/utils/mock-weather-data';
import React, { lazy, Suspense, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View
} from 'react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from 'react-native-reanimated';

// Lazy load components that aren't shown on initial render
const DailyForecastView = lazy(() => import('@/components/weather/forecast/DailyForecastView'));
const RadarView = lazy(() => import('@/components/weather/forecast/RadarView'));

interface ForecastContainerProps {
  data?: ExtendedForecastData;
  loading?: boolean;
}

const segmentedOptions: SegmentedControlOption[] = [
  { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' },
  { key: 'radar', label: 'Radar' },
];

export const ForecastContainer: React.FC<ForecastContainerProps> = ({
  data = mockExtendedForecastData,
  loading = false,
}) => {
  const [selectedView, setSelectedView] = useState<ForecastViewType>('hourly');
  const [previousView, setPreviousView] = useState<ForecastViewType>('hourly');
  const colorScheme = useColorScheme();

  const handleViewChange = useCallback((viewKey: string) => {
    const newView = viewKey as ForecastViewType;
    setPreviousView(selectedView);
    setSelectedView(newView);
  }, [selectedView]);

  const getAnimationDirection = (view: ForecastViewType) => {
    const currentIndex = segmentedOptions.findIndex(opt => opt.key === selectedView);
    const newIndex = segmentedOptions.findIndex(opt => opt.key === view);

    if (newIndex > currentIndex) {
      return { entering: FadeInRight, exiting: FadeOutLeft };
    } else {
      return { entering: FadeInLeft, exiting: FadeOutRight };
    }
  };

  // Loading fallback for lazy-loaded components
  const LazyLoadFallback = () => (
    <View style={styles.lazyLoadingContainer}>
      <ActivityIndicator size="large" color="#38bdf8" />
      <ThemedText style={styles.lazyLoadingText}>Loading...</ThemedText>
    </View>
  );

  const renderCurrentView = () => {
    const animations = getAnimationDirection(selectedView);

    const AnimatedContainer = Animated.createAnimatedComponent(ThemedView);

    switch (selectedView) {
      case 'hourly':
        return (
          <AnimatedContainer
            key="hourly"
            entering={animations.entering.duration(300)}
            exiting={animations.exiting.duration(250)}
            style={styles.viewContainer}
          >
            <HourlyForecastView
              data={data.hourly}
              loading={loading}
            />
          </AnimatedContainer>
        );

      case 'daily':
        return (
          <AnimatedContainer
            key="daily"
            entering={animations.entering.duration(300)}
            exiting={animations.exiting.duration(250)}
            style={styles.viewContainer}
          >
            <Suspense fallback={<LazyLoadFallback />}>
              <DailyForecastView
                data={data.daily}
                loading={loading}
              />
            </Suspense>
          </AnimatedContainer>
        );

      case 'radar':
        return (
          <AnimatedContainer
            key="radar"
            entering={animations.entering.duration(300)}
            exiting={animations.exiting.duration(250)}
            style={styles.viewContainer}
          >
            <Suspense fallback={<LazyLoadFallback />}>
              <RadarView loading={loading} />
            </Suspense>
          </AnimatedContainer>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Segmented Control Header */}
      <View style={styles.headerContainer}>
        <SegmentedControl
          options={segmentedOptions}
          selectedKey={selectedView}
          onSelectionChange={handleViewChange}
          style={styles.segmentedControl}
          disabled={loading}
        />
      </View>

      {/* Content Views */}
      <View style={styles.contentContainer}>
        {renderCurrentView()}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentedControl: {
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  viewContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  lazyLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lazyLoadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
    color: '#cbd5e1',
  },
});

export default ForecastContainer;