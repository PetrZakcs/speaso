import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Depth, Shadow } from '../theme/tokens';

interface Props {
  progress: number; // 0–1
  tone?: 'green' | 'apricot';
}

/** Chunky progress: a sunken well holding a raised fill with an inner ledge and a rim stripe. */
export default function ProgressBar({ progress, tone = 'green' }: Props) {
  const p = Math.max(0, Math.min(progress, 1));
  const fill = tone === 'apricot'
    ? { backgroundColor: Colors.brand.main, boxShadow: `inset 0px -${Depth.tile}px 0px ${Colors.brand.ledge}` }
    : { backgroundColor: Colors.accent.main, boxShadow: `inset 0px -${Depth.tile}px 0px ${Colors.accent.ledge}` };
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
    >
      {p > 0 && (
        <View style={[styles.fill, fill, { width: `${p * 100}%` }]}>
          <View style={styles.stripe} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 14,
    backgroundColor: Colors.surface.card2,
    borderRadius: 99,
    overflow: 'hidden',
    boxShadow: Shadow.well,
  },
  fill: {
    height: 14,
    minWidth: 14,
    borderRadius: 99,
  },
  stripe: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: Colors.highlight,
  },
});
