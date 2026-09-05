import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type Variant = 'primary' | 'secondary' | 'ghost' | 'blue';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export default function Button({ title, onPress, variant = 'primary', style, accessibilityLabel }: ButtonProps) {
  const scheme = useColorScheme();
  const palette = Colors[scheme ?? 'light'];
  const press = useSharedValue(0);
  const hover = useSharedValue(0);
  const baseBackground = variant === 'blue' ? '#1E88E5' : 
                      variant === 'primary' ? palette.tint : 
                      variant === 'secondary' ? (scheme === 'dark' ? '#262A2E' : '#F0F3F5') : 
                      'transparent';
  const baseBorder = variant === 'ghost' ? (scheme === 'dark' ? '#2F3438' : '#E3E7EA') : 'transparent';
  const baseText = variant === 'primary' ? '#fff' : palette.text;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.98]) }],
    opacity: interpolate(hover.value, [0, 1], [1, 0.97]),
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}> 
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPressIn={() => { press.value = withTiming(1, { duration: 80 }); }}
        onPressOut={() => { press.value = withSpring(0, { damping: 12 }); }}
        onHoverIn={() => { hover.value = withTiming(1, { duration: 120 }); }}
        onHoverOut={() => { hover.value = withTiming(0, { duration: 120 }); }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: baseBackground, borderColor: baseBorder },
          pressed && { opacity: 0.95 },
          variant === 'ghost' && styles.ghostPadding,
        ]}
      >
        <ThemedText style={[styles.title, { color: baseText }]}>{title}</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostPadding: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});


