import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

type NextButtonProps = {
  label?: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
  minWidth?: number;
};

export function NextButton({
  label = 'Next',
  onPress,
  accessibilityLabel,
  disabled,
  style,
  minWidth = 140,
}: NextButtonProps) {
  const hover = useSharedValue(0);
  const press = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(press.value, [0, 1], [1, 0.98]);
    const elevation = interpolate(hover.value, [0, 1], [4, 8]);
    const bg = interpolateColor(
      hover.value,
      [0, 1],
      ['#007AFF', '#0A84FF']
    );
    return {
      transform: [{ scale }],
      backgroundColor: bg,
      shadowOpacity: 0.25,
      shadowRadius: elevation,
      shadowOffset: { width: 0, height: elevation / 2 },
      elevation,
      opacity: disabled ? 0.6 : 1,
      minWidth,
    } as ViewStyle;
  });

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        disabled={disabled}
        onPressIn={() => { press.value = withTiming(1, { duration: 80 }); }}
        onPressOut={() => { press.value = withSpring(0, { damping: 12 }); }}
        onHoverIn={() => { hover.value = withTiming(1, { duration: 140 }); }}
        onHoverOut={() => { hover.value = withTiming(0, { duration: 140 }); }}
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.95 }]}
      >
        <ThemedText style={styles.label}>{label}</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
  },
  pressable: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default NextButton;


