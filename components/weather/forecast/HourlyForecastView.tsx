import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrecipitationChart } from '@/components/weather/charts/PrecipitationChart';
import { ForecastDetailModal } from '@/components/weather/ForecastDetailModal';
import WeatherIcon from '@/components/weather/WeatherIcon';
import { Fonts } from '@/constants/theme';
import { HourlyForecast } from '@/types/weather';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import Animated, { FadeInRight, FadeInUp } from 'react-native-reanimated';

interface HourlyForecastViewProps {
  data: HourlyForecast[];
  loading?: boolean;
}

const ITEM_WIDTH = 70;
const ITEM_HEIGHT = 160;

interface HourlyItemProps {
  item: HourlyForecast;
  index: number;
  onLongPress?: (item: HourlyForecast) => void;
}

const HourlyItem: React.FC<HourlyItemProps> = ({
  item,
  index,
  onLongPress,
}) => {
  // Precipitation bar height (max 40px)
  const precipHeight = Math.max(4, (item.pop / 100) * 40);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress(item);
    }
  }, [item, onLongPress]);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(400)}
      style={styles.hourlyItem}
    >
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.hourlyContent,
          pressed && styles.hourlyContentPressed,
        ]}
        accessibilityLabel={`Time ${item.time}, ${item.description}, Temperature ${Math.round(item.temp)} degrees, Precipitation chance ${item.pop}%. Long press for details.`}
        accessibilityHint="Long press to see detailed forecast"
      >
        {/* Time */}
        <ThemedText style={styles.timeText}>{item.time}</ThemedText>

        {/* Weather Icon */}
        <View style={styles.iconContainer}>
          <WeatherIcon
            description={item.description}
            iconCode={item.icon}
            size={28}
          />
        </View>

        {/* Temperature Text */}
        <ThemedText style={styles.tempText}>
          {Math.round(item.temp)}°
        </ThemedText>

        {/* Precipitation Bar */}
        <View style={styles.precipContainer}>
          <ThemedText style={styles.precipText}>
            {item.pop}%
          </ThemedText>
          <View
            style={[
              styles.precipBar,
              {
                height: precipHeight,
                backgroundColor: '#38bdf8', // sky-400
              }
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const HourlyForecastView: React.FC<HourlyForecastViewProps> = ({
  data,
  loading = false,
}) => {
  const [selectedItem, setSelectedItem] = useState<HourlyForecast | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleLongPress = useCallback((item: HourlyForecast) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);

  if (!data || data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText style={{ color: 'white' }}>No hourly forecast data available</ThemedText>
      </View>
    );
  }

  const renderHourlyItem: ListRenderItem<HourlyForecast> = ({ item, index }) => {
    return (
      <HourlyItem
        item={item}
        index={index}
        onLongPress={handleLongPress}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText style={{ color: 'white' }}>Loading hourly forecast...</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(56, 189, 248, 0.1)', 'transparent']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>24-Hour Forecast</ThemedText>
        <ThemedText style={styles.subtitleText}>
          Temperature & Precipitation
        </ThemedText>
      </View>

       {/* Precipitation Chart */}
      <Animated.View entering={FadeInUp.duration(600).delay(100)}>
        <PrecipitationChart data={data} height={130} />
      </Animated.View> 

      {/* Hourly list */}
      <FlatList
        data={data}
        renderItem={renderHourlyItem}
        keyExtractor={(item, index) => `${item.time}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToInterval={ITEM_WIDTH + 8}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + 8,
          offset: (ITEM_WIDTH + 8) * index,
          index,
        })}
      />

      {/* Detail Modal */}
      <ForecastDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        type="hourly"
        hourlyData={selectedItem ?? undefined}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.sans,
    marginBottom: 4,
    color: '#ffffff',
  },
  subtitleText: {
    fontSize: 14,
    opacity: 0.7,
    fontFamily: Fonts.sans,
    color: '#cbd5e1',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  hourlyItem: {
    width: ITEM_WIDTH,
    marginRight: 8,
  },
  hourlyContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderRadius: 24,
    height: ITEM_HEIGHT,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hourlyContentPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ scale: 0.98 }],
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
  },
  iconContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 18,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    color: '#ffffff',
  },
  precipContainer: {
    height: 50,
    marginBottom: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  precipBar: {
    width: 6,
    borderRadius: 3,
    marginBottom: -4,
    minHeight: 4,
  },
  precipText: {
    fontSize: 12,
    fontFamily: Fonts.rounded,
    marginBottom: -7,
    color: '#7dd3fc',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default HourlyForecastView;