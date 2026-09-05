import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import WeatherIcon from './WeatherIcon';

interface WeatherDisplayProps {
  condition: string;
  temperature: number;
  icon: string; // URL or local asset name for the weather icon
  city: string;
  feelsLike: number;
  humidity: number;
  pressure: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  windSpeed: number;
  windDirection: number;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  condition,
  temperature,
  icon,
  city,
  feelsLike,
  humidity,
  pressure,
  visibility,
  sunrise,
  sunset,
  windSpeed,
  windDirection,
}) => {
  // Helper to format time from Unix timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const textColor = '#ffffff';

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <WeatherIcon description={condition} size={22} />
        <ThemedText style={[styles.condition, { color: textColor }]}>{condition}</ThemedText>
      </View>

      <View style={styles.detailsContainer}>
        {/* Feels like with thermometer icon */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="thermometer"
            size={18}
            color={textColor}
            style={styles.metricIcon}
          />
          <ThemedText style={{ color: '#cbd5e1' }}>Feels like: <ThemedText style={{ color: textColor }}>{feelsLike}°C</ThemedText></ThemedText>
        </View>

        {/* Humidity with water percent icon */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="water-percent"
            size={18}
            color={textColor}
            style={styles.metricIcon}
          />
          <ThemedText style={{ color: '#cbd5e1' }}>Humidity: <ThemedText style={{ color: textColor }}>{humidity}%</ThemedText></ThemedText>
        </View>

        {/* Pressure with gauge icon */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="gauge"
            size={18}
            color={textColor}
            style={styles.metricIcon}
          />
          <ThemedText style={{ color: '#cbd5e1' }}>Pressure: <ThemedText style={{ color: textColor }}>{pressure} hPa</ThemedText></ThemedText>
        </View>

        {/* Visibility with eye icon */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="eye"
            size={18}
            color={textColor}
            style={styles.metricIcon}
          />
          <ThemedText style={{ color: '#cbd5e1' }}>Visibility: <ThemedText style={{ color: textColor }}>{visibility / 1000} km</ThemedText></ThemedText>
        </View>

        {/* Sunrise with weather-sunset-up icon */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="weather-sunset-up"
            size={18}
            color={textColor}
            style={styles.metricIcon}
          />
          <ThemedText style={{ color: '#cbd5e1' }}>Sunrise: <ThemedText style={{ color: textColor }}>{formatTime(sunrise)}</ThemedText></ThemedText>
        </View>

        {/* Sunset with weather-sunset-down icon */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="weather-sunset-down"
            size={18}
            color={textColor}
            style={styles.metricIcon}
          />
          <ThemedText style={{ color: '#cbd5e1' }}>Sunset: <ThemedText style={{ color: textColor }}>{formatTime(sunset)}</ThemedText></ThemedText>
        </View>

        {/* Wind with navigation-variant icon */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="navigation-variant"
            size={18}
            color={textColor}
            style={[styles.metricIcon, { transform: [{ rotate: `${windDirection}deg` }] }]}
          />
          <ThemedText style={{ color: '#cbd5e1' }}>Wind: <ThemedText style={{ color: textColor }}>{windSpeed} m/s</ThemedText> at {windDirection}°</ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 10,
    width: '100%',
    backgroundColor: 'transparent',
  },
  weatherIcon: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  condition: {
    fontSize: 18,
    marginTop: 0,
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
    width: '100%',
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    opacity: 0.8,
    minWidth: 20,
  },
});

export default WeatherDisplay;