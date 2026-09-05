import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import WeatherIcon from '@/components/weather/WeatherIcon';
import WindCompass from '@/components/weather/WindCompass';
import { TIMING } from '@/constants/animations';
import { Fonts } from '@/constants/theme';
import { AQIData, DailyForecast } from '@/types/weather';
import { getAQIData } from '@/utils/mock-weather-data';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

interface DailyForecastViewProps {
  data: DailyForecast[];
  loading?: boolean;
}

interface DailyItemProps {
  item: DailyForecast;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DailyItem: React.FC<DailyItemProps> = ({ item, index, onPress, onLongPress }) => {
  const scale = useSharedValue(1);
  const textColor = '#ffffff';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      duration: TIMING.blurTransition,
      dampingRatio: 0.8,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      duration: TIMING.blurTransition,
      dampingRatio: 0.8,
    });
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onLongPress) {
      onLongPress();
    }
  };

  return (
    <>
      <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[
              styles.dailyItem,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            ]}
            onPress={onPress}
            onLongPress={handleLongPress}
            delayLongPress={400}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`${item.day_name} weather forecast. Long press for details.`}
            accessibilityHint="Long press to see detailed forecast"
          >
            {/* Day name - Takes available space */}
            <View style={styles.dayContainer}>
              <ThemedText
                style={[styles.dayText, { color: textColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {item.day_name}
              </ThemedText>
            </View>

            {/* Right side content: Icon | Precip | Temp */}
            <View style={styles.rightContent}>
              {/* Weather icon */}
              <View style={styles.iconContainer}>
                <WeatherIcon description={item.description} iconCode={item.icon} size={28} />
              </View>

              {/* Precipitation */}
              <View style={styles.precipContainer}>
                <MaterialCommunityIcons name="water-percent" size={14} color="#38bdf8" style={{ marginRight: 2 }} />
                <Text style={[styles.precipText, { color: '#38bdf8' }]}>
                  {item.pop}%
                </Text>
              </View>

              {/* Temperature range */}
              <View style={styles.tempContainer}>
                <ThemedText style={[styles.tempMaxText, { color: textColor }]}>
                  {Math.round(item.temp_max)}°
                </ThemedText>
                <ThemedText style={[styles.tempMinText, { color: '#cbd5e1' }]}>
                  {Math.round(item.temp_min)}°
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </>
  );
};

interface DetailModalProps {
  visible: boolean;
  item: DailyForecast | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ visible, item, onClose }) => {
  console.log('DetailModal rendering: visible=', visible, 'hasItem=', !!item);
  if (!item) return null;

  const aqiData: AQIData = getAQIData(item.aqi || 50);
  const uvIndexColor = item.uv_index <= 2 ? '#4ade80' :
    item.uv_index <= 5 ? '#facc15' :
      item.uv_index <= 7 ? '#f97316' :
        item.uv_index <= 10 ? '#ef4444' : '#ec4899';
  const textColor = '#ffffff';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          key={item.day_name}
          entering={FadeInUp.duration(300)}
          exiting={FadeOutDown.duration(250)}
          style={styles.modalContainer}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 80 : 0}
            tint="dark"
            style={styles.blurContainer}
          >
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']}
              style={styles.modalContent}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.headerContent}>
                    <WeatherIcon description={item.description} iconCode={item.icon} size={40} />
                    <View style={styles.modalHeaderText}>
                      <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                        {item.day_name}
                      </ThemedText>
                      <ThemedText style={[styles.modalSubtitle, { color: '#cbd5e1' }]}>
                        {item.description}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Text style={[styles.closeText, { color: textColor }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Temperature */}
                <View style={styles.tempSection}>
                  <Text style={[styles.tempLarge, { color: textColor }]}>
                    {Math.round(item.temp_max)}°C / {Math.round(item.temp_min)}°C
                  </Text>
                </View>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  {/* Wind Compass - Full width */}
                  <View style={styles.windCompassContainer}>
                    <ThemedText style={[styles.detailLabel, { color: '#cbd5e1', textAlign: 'center', marginBottom: 8 }]}>
                      Wind
                    </ThemedText>
                    <WindCompass
                      direction={item.wind_deg}
                      speed={item.wind_speed}
                      size={145}
                      unit="mph"
                    />
                  </View>

                  {/* UV Index */}
                  <View style={styles.detailItem}>
                    <View style={styles.labelIconRow}>
                      <MaterialCommunityIcons name="sun-wireless" size={16} color="#facc15" />
                      <ThemedText style={[styles.detailLabel, { color: '#cbd5e1' }]}>UV Index</ThemedText>
                    </View>
                    <Text style={[styles.detailValue, { color: uvIndexColor }]}>
                      {item.uv_index}
                    </Text>
                    <ThemedText style={[styles.detailSubValue, { color: '#cbd5e1' }]}>
                      {item.uv_index <= 2 ? 'Low' :
                        item.uv_index <= 5 ? 'Moderate' :
                          item.uv_index <= 7 ? 'High' :
                            item.uv_index <= 10 ? 'Very High' : 'Extreme'}
                    </ThemedText>
                  </View>

                  {/* AQI */}
                  <View style={styles.detailItem}>
                    <View style={styles.labelIconRow}>
                      <MaterialCommunityIcons name="molecule" size={16} color={aqiData.color} />
                      <ThemedText style={[styles.detailLabel, { color: '#cbd5e1' }]}>Air Quality</ThemedText>
                    </View>
                    <Text style={[styles.detailValue, { color: aqiData.color }]}>
                      {aqiData.value}
                    </Text>
                    <Text style={[styles.detailSubValue, { color: aqiData.color }]}>
                      {aqiData.level}
                    </Text>
                  </View>

                  {/* Sunrise/Sunset */}
                  <View style={styles.detailItem}>
                    <View style={styles.labelIconRow}>
                      <MaterialCommunityIcons name="weather-sunset-up" size={16} color="#fbbf24" />
                      <ThemedText style={[styles.detailLabel, { color: '#cbd5e1' }]}>Sun</ThemedText>
                    </View>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                      ↑ {item.sunrise}
                    </ThemedText>
                    <ThemedText style={[styles.detailSubValue, { color: '#cbd5e1' }]}>
                      ↓ {item.sunset}
                    </ThemedText>
                  </View>

                  {/* Humidity */}
                  <View style={styles.detailItem}>
                    <View style={styles.labelIconRow}>
                      <MaterialCommunityIcons name="water-percent" size={16} color="#38bdf8" />
                      <ThemedText style={[styles.detailLabel, { color: '#cbd5e1' }]}>Humidity</ThemedText>
                    </View>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                      {item.humidity}%
                    </ThemedText>
                  </View>

                  {/* Pressure */}
                  {/* <View style={styles.detailItem}> */}
                  {/* <View style={styles.labelIconRow}> */}
                  {/* <MaterialCommunityIcons name="gauge" size={16} color="#818cf8" /> */}
                  {/* <ThemedText style={[styles.detailLabel, { color: '#cbd5e1' }]}>Pressure</ThemedText> */}
                  {/* </View> */}
                  {/* <ThemedText style={[styles.detailValue, { color: textColor }]}> */}
                  {/* {item.pressure} hPa */}
                  {/* </ThemedText> */}
                  {/* </View> */}
                </View>
              </ScrollView>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/* --- PoP Info Modal --- */
const PoPInfoModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.popModalContainer}>
          <BlurView intensity={90} tint="dark" style={styles.popBlur}>
            <View style={styles.popHeader}>
              <MaterialCommunityIcons name="water-percent" size={24} color="#38bdf8" />
              <ThemedText style={styles.popTitle}>Precipitation Probability</ThemedText>
              <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={22} color="white" /></TouchableOpacity>
            </View>
            <ThemedText style={styles.popText}>
              • The likelihood of precipitation occurring at your location.
            </ThemedText>
            <ThemedText style={styles.popText}>
              • Percentage chance of measurable precipitation (≥0.01 inches).
            </ThemedText>
            <ThemedText style={styles.popText}>
              • Higher percentages indicate a greater confidence in rain or snow.
            </ThemedText>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

export const DailyForecastView: React.FC<DailyForecastViewProps> = ({
  data,
  loading = false,
}) => {
  const [selectedItem, setSelectedItem] = useState<DailyForecast | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [popInfoVisible, setPopInfoVisible] = useState(false);

  const handleItemPress = (item: DailyForecast) => {
    console.log('handleItemPress called for:', item.day_name);
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedItem(null), 250);
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText style={{ color: 'white' }}>Loading 7-day forecast...</ThemedText>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText style={{ color: 'white' }}>No daily forecast data available</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerText}>7-Day Forecast</ThemedText>
          <ThemedText style={styles.subtitleText}>
            Tap for detailed information
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setPopInfoVisible(true)}
          accessibilityLabel="Information about precipitation chance"
        >
          <MaterialCommunityIcons name="information-variant" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* Daily list */}
      <View style={styles.listContainer}>
        {data.map((item, index) => (
          <DailyItem
            key={item.date}
            item={item}
            index={index}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleItemPress(item)}
          />
        ))}
      </View>

      {/* Detail Modal */}
      <DetailModal
        visible={modalVisible}
        item={selectedItem}
        onClose={handleModalClose}
      />

      {/* PoP Info Modal */}
      <PoPInfoModal
        visible={popInfoVisible}
        onClose={() => setPopInfoVisible(false)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 42,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
      }
    }),
  },
  dayContainer: {
    flex: 1,
    paddingRight: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Fonts.sans,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  precipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 30,
    justifyContent: 'flex-end',
  },
  precipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },
  tempContainer: {
    alignItems: 'flex-end',
    minWidth: 20,
    paddingLeft: 4,
  },
  tempMaxText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },
  tempMinText: {
    fontSize: 14,
    opacity: 0.7,
    fontFamily: Fonts.rounded,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    minHeight: 600, // Ensure it has a base height
    maxHeight: SCREEN_HEIGHT * 0.85,
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1E293B', // Slate 800 - solid background for debugging
    zIndex: 1001,
  },
  blurContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 100, // Extra padding for the bottom
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: 16,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  modalSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 21, 21, 0.1)',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '500',
  },
  tempSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tempLarge: {
    fontSize: 36,
    fontWeight: '300',
    fontFamily: Fonts.sans,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailItem: {
    width: '48%',
    marginBottom: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  windCompassContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  labelIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Fonts.sans,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },
  detailSubValue: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
  },

  /* PoP Modal */
  popModalContainer: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  popBlur: {
    padding: 24,
  },
  popHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  popTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  popText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e2e8f0',
    marginBottom: 12,
  },
});

export default DailyForecastView;