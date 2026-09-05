import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { PixelRatio } from 'react-native';

type WeatherIconProps = {
  description?: string;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  // Nuance
  isNight?: boolean; // when true, use night variants where available
  iconCode?: string | number; // e.g., OpenWeather icon code like 01d/01n to infer night
  uvIndex?: number; // when provided, render UV icon instead of condition
  aqi?: number; // 1-5 scale; when provided, render AQI icon instead of condition
  imageSource?: string | { uri: string }; // Optional custom image source (e.g. WebP/PNG)
};

const mapDescriptionToIcon = (
  description: string,
  isNight?: boolean
): keyof typeof MaterialCommunityIcons.glyphMap => {
  const d = description.toLowerCase();
  if (isNight) {
    if (d.includes('clear')) return 'weather-night';
    if (d.includes('cloud')) return 'weather-night-partly-cloudy';
  }
  if (d.includes('thunder')) return 'weather-lightning-rainy';
  if (d.includes('storm')) return 'weather-lightning';
  if (d.includes('snow')) return 'weather-snowy-heavy';
  if (d.includes('sleet')) return 'weather-snowy-rainy';
  if (d.includes('hail')) return 'weather-hail';
  if (d.includes('drizzle')) return 'weather-partly-rainy';
  if (d.includes('rain')) return 'weather-rainy';
  if (d.includes('mist') || d.includes('fog') || d.includes('haze')) return 'weather-fog';
  if (d.includes('cloud') && d.includes('broken')) return 'weather-cloudy-alert';
  if (d.includes('cloud')) return 'weather-cloudy';
  if (d.includes('clear')) return 'weather-sunny';
  return 'weather-partly-cloudy';
};

const mapUvToIcon = (uv?: number): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (uv === undefined || uv === null) return 'white-balance-sunny';
  if (uv <= 2) return 'white-balance-sunny'; // Low
  if (uv <= 5) return 'weather-sunny'; // Moderate
  if (uv <= 7) return 'weather-sunny-alert'; // High
  if (uv <= 10) return 'weather-sunny-alert'; // Very high
  return 'weather-sunny-alert'; // Extreme
};

const mapAqiToIcon = (aqi?: number): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (!aqi || aqi <= 1) return 'leaf'; // Good
  if (aqi === 2) return 'weather-hazy'; // Fair
  if (aqi === 3) return 'weather-fog'; // Moderate
  if (aqi === 4) return 'smog'; // Poor
  return 'biohazard'; // Very poor
};

export default function WeatherIcon({
  description = '',
  size = 28,
  color,
  accessibilityLabel,
  isNight,
  iconCode,
  uvIndex,
  aqi,
  imageSource
}: WeatherIconProps) {
  const scheme = useColorScheme();
  const tint = Colors[scheme ?? 'light'].tint;
  const resolved = color ?? tint;
  const night = isNight ?? (typeof iconCode === 'string' && iconCode.includes('n'));

  // Scale vector icon size based on font scale for better accessibility
  const scaledSize = size * PixelRatio.getFontScale();

  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel={accessibilityLabel ?? description}
      />
    );
  }

  let iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  if (typeof uvIndex === 'number') {
    iconName = mapUvToIcon(uvIndex);
  } else if (typeof aqi === 'number') {
    iconName = mapAqiToIcon(aqi);
  } else {
    iconName = mapDescriptionToIcon(description, night);
  }
  return (
    <MaterialCommunityIcons
      name={iconName}
      size={scaledSize}
      color={resolved}
      accessibilityLabel={accessibilityLabel ?? description}
    />
  );
}

export { mapAqiToIcon, mapDescriptionToIcon, mapUvToIcon };

