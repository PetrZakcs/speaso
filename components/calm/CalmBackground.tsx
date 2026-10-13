import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calm } from '../../theme/tokens';

/** Deep green gradient behind immersive screens (check-in, breathing, panic). */
export default function CalmBackground() {
  return (
    <LinearGradient
      colors={[Calm.bgFrom, Calm.bgTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
