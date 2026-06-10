import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export default function LoadingSpinner() {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    borderTopColor: '#2563EB',
  },
});