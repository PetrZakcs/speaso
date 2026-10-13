import React, { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticSelect } from '../../lib/haptics';
import type { Rating } from '../../lib/streak';

const THUMB = 34;
/** Hard → great, matching the 1–5 check-in scale. */
export const MOOD_GRADIENT = ['#E0604F', '#E8A55A', '#E9D27A', '#A9D88F', '#74C69A'] as const;

/**
 * Drag or tap along a gradient track; snaps to 1–5 on release.
 * Exposed to screen readers as an adjustable control.
 */
export default function MoodSlider({
  value, onChange, accessibilityLabel, valueLabel,
}: {
  value: Rating;
  onChange: (v: Rating) => void;
  accessibilityLabel: string;
  valueLabel: string;
}) {
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const usable = Math.max(1, width - THUMB);

  const toRating = (x: number): Rating =>
    (Math.round(Math.max(0, Math.min(1, (x - THUMB / 2) / usable)) * 4) + 1) as Rating;
  const update = (x: number, final: boolean) => {
    const r = toRating(x);
    if (r !== value) {
      hapticSelect();
      onChange(r);
    }
    setDrag(final ? null : Math.max(0, Math.min(usable, x - THUMB / 2)));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => update(e.x, false))
    .onUpdate((e) => update(e.x, false))
    .onFinalize((e) => update(e.x, true));

  const left = drag ?? ((value - 1) / 4) * usable;

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.wrap}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 1, max: 5, now: value, text: valueLabel }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const next = value + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
          if (next >= 1 && next <= 5) onChange(next as Rating);
        }}
        testID="mood-slider"
      >
        <LinearGradient
          colors={MOOD_GRADIENT}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.track}
        />
        <View style={styles.ticks} pointerEvents="none">
          {[1, 2, 3, 4, 5].map((i) => <View key={i} style={styles.tick} />)}
        </View>
        <View style={[styles.thumb, { left }]} pointerEvents="none" />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { height: THUMB + 16, justifyContent: 'center' },
  track: { height: 12, borderRadius: 6, marginHorizontal: THUMB / 2 - 6 },
  ticks: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tick: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', marginLeft: -2 },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
