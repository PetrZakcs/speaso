import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/tokens';

interface Props {
  progress: number; // 0–1
}

export default function ProgressBar({ progress }: Props) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 5,
    backgroundColor: Colors.hairline,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: 5,
    backgroundColor: Colors.primary.blue,
    borderRadius: 99,
  },
});
