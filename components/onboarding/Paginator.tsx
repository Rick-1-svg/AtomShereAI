import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface PaginatorProps {
  data: any[];
  currentIndex: number;
}

export const Paginator = ({ data, currentIndex }: PaginatorProps) => {
  return (
    <View style={styles.container}>
      {data.map((_, i) => {
        return <Dot key={i} index={i} currentIndex={currentIndex} />;
      })}
    </View>
  );
};

const Dot = ({ index, currentIndex }: { index: number; currentIndex: number }) => {
  // We'll use a simple prop-based animation for now since we aren't using a scrollview with a shared value for index 
  // (the screens are separate routes). 
  // We can just conditionally style based on currentIndex matching index.
  
  const isActive = index === currentIndex;

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: isActive ? 24 : 8,
          backgroundColor: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
