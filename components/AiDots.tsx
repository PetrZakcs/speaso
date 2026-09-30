import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Colors } from '../theme/tokens';

export default function AiDots() {
  const dots = [useSharedValue(0.3), useSharedValue(0.3), useSharedValue(0.3)];

  useEffect(() => {
    [0, 200, 400].forEach((delay, i) => {
      dots[i].value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 700 }),
            withTiming(0.3, { duration: 700 }),
          ),
          -1,
          false,
        ),
      );
    });
  }, []);

  return (
    <View style={styles.row}>
      {dots.map((dot, i) => {
        const anim = useAnimatedStyle(() => ({
          opacity: dot.value,
          transform: [{ translateY: (1 - dot.value) * -3 }],
        }));
        return <Animated.View key={i} style={[styles.dot, anim]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: Colors.accent.cyan,
  },
});
