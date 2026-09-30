import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withDelay,
} from 'react-native-reanimated';
import { Colors } from '../theme/tokens';

interface Props {
  size?: number;
}

export default function PanicPulse({ size = 152 }: Props) {
  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);
  const opacity1 = useSharedValue(0.55);
  const opacity2 = useSharedValue(0.55);

  useEffect(() => {
    ring1.value = withRepeat(
      withSequence(withTiming(1.75, { duration: 2600 }), withTiming(1, { duration: 0 })),
      -1,
    );
    opacity1.value = withRepeat(
      withSequence(withTiming(0, { duration: 2600 }), withTiming(0.55, { duration: 0 })),
      -1,
    );
    ring2.value = withDelay(
      1300,
      withRepeat(
        withSequence(withTiming(1.75, { duration: 2600 }), withTiming(1, { duration: 0 })),
        -1,
      ),
    );
    opacity2.value = withDelay(
      1300,
      withRepeat(
        withSequence(withTiming(0, { duration: 2600 }), withTiming(0.55, { duration: 0 })),
        -1,
      ),
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: opacity1.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: opacity2.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, ring1Style]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, ring2Style]} />
      <View style={[styles.core, { width: size, height: size, borderRadius: size / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    backgroundColor: Colors.danger.panic,
    opacity: 0.3,
  },
  core: {
    backgroundColor: Colors.danger.panic,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
