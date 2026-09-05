import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type TabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

const TabItem = ({ label, iconName, isFocused, onPress, palette }: { label: string; iconName: string; isFocused: boolean; onPress: () => void; palette: typeof Colors.light }) => {
  const press = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.97]) }],
  }));

  return (
    <Animated.View style={[styles.tabItemWrapper, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPressIn={() => { press.value = withTiming(1, { duration: 70 }); }}
        onPressOut={() => { press.value = withTiming(0, { duration: 120 }); }}
        onPress={onPress}
        style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.9 }]}
        hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
      >
        <View style={[styles.iconBadge, isFocused && { backgroundColor: palette.tint }]}>
          <IconSymbol size={22} name={iconName as any} color={isFocused ? '#fff' : palette.icon} />
        </View>
        <Animated.Text style={[styles.tabLabel, { color: isFocused ? palette.text : palette.icon }]}>{label}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
};

export default function ResponsiveTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const innerBackground = colorScheme === 'dark' ? 'rgba(21,23,24,0.92)' : 'rgba(255,255,255,0.9)';

  return (
    <View style={[styles.container, isWide ? styles.containerTop : styles.containerBottom]}> 
      <View style={[styles.inner, isWide ? styles.innerTop : styles.innerBottom, { backgroundColor: innerBackground }]}> 
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const iconName = options?.tabBarIconName ?? (route.name === 'index' ? 'house.fill' : 'paperplane.fill');

          return (
            <TabItem
              key={route.key}
              label={label}
              iconName={iconName}
              isFocused={isFocused}
              onPress={onPress}
              palette={palette}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.12)' as any },
    }),
  },
  containerBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
  },
  containerTop: {
    position: 'relative',
    paddingTop: 6,
    paddingHorizontal: 12,
  },
  inner: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  innerBottom: {
  },
  innerTop: {
    marginTop: 8,
  },
  tabItemWrapper: {
    flex: 1,
  },
  tabItem: {
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBadgeActive: {
    backgroundColor: Colors.light.tint,
  },
  tabLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  tabLabelActive: {
    fontWeight: '600',
  },
});



