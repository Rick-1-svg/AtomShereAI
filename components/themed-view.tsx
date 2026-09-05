import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  gradient?: { colors: string[]; start?: { x: number; y: number }; end?: { x: number; y: number } } | null;
};

export function ThemedView({ style, lightColor, darkColor, gradient = null, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  if (gradient && gradient.colors?.length) {
    return (
      <LinearGradient
        colors={gradient.colors as [string, string, ...string[]]}
        start={gradient.start ?? { x: 0, y: 0 }}
        end={gradient.end ?? { x: 1, y: 1 }}
        style={[{ backgroundColor }, style]}
      >
        <View style={{ flex: 1 }} {...otherProps} />
      </LinearGradient>
    );
  }
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
