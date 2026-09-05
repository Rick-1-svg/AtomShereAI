import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

export interface SegmentedControlOption {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  style?: ViewStyle;
  segmentStyle?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
  disabled?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedKey,
  onSelectionChange,
  style,
  segmentStyle,
  textStyle,
  activeTextStyle,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const [containerWidth, setContainerWidth] = useState(0);

  // Find the index of the selected option
  const selectedIndex = options.findIndex(option => option.key === selectedKey);
  const translateX = useSharedValue(0);

  // Update animation when selection changes or width changes
  React.useEffect(() => {
    if (containerWidth > 0) {
      const padding = 4;
      const availableWidth = containerWidth - (padding * 2);
      const segmentWidth = availableWidth / options.length;
      const targetPos = segmentWidth * selectedIndex;

      translateX.value = withSpring(targetPos, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [selectedIndex, containerWidth, options.length]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const activeSegmentWidth = containerWidth > 0
    ? (containerWidth - 8) / options.length
    : 0;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: activeSegmentWidth,
    };
  });

  const handlePress = (option: SegmentedControlOption) => {
    if (!disabled && option.key !== selectedKey) {
      onSelectionChange(option.key);
    }
  };

  return (
    <View
      style={[
        styles.container,
        disabled && styles.disabledContainer,
        { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
        style
      ]}
      onLayout={handleLayout}
    >
      {/* Moving Indicator */}
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : '#ffffff',
            },
            animatedStyle
          ]}
        />
      )}

      {/* Text Segments Overlay */}
      <View style={styles.segmentsRow}>
        {options.map((option) => {
          const isActive = option.key === selectedKey;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.segment, segmentStyle]}
              onPress={() => handlePress(option)}
              activeOpacity={0.7}
              disabled={disabled}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={option.label}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colorScheme === 'dark' ? '#94a3b8' : '#64748b' },
                  textStyle,
                  isActive && {
                    color: colorScheme === 'dark' ? '#ffffff' : '#0f172a',
                    fontWeight: '600'
                  },
                  isActive && activeTextStyle,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: 10,
    padding: 4,
    justifyContent: 'center',
  },
  segmentsRow: {
    flexDirection: 'row',
    height: '100%',
    zIndex: 1, // Ensure text is above indicator
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    fontWeight: '500',
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
      },
    }),
  },
  disabledContainer: {
    opacity: 0.5,
  },
});

export default SegmentedControl;