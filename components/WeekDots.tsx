import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { weekdayIndex, type DateKey } from '../lib/dates';
import { Colors, FontFamily } from '../theme/tokens';

/** Mon…Sun dots; filled = practised that day, outlined cyan = today. */
export default function WeekDots({ activity, today }: { activity: boolean[]; today: DateKey }) {
  const { tList } = useTranslation();
  const labels = tList('common.weekdays_short');
  const todayIdx = weekdayIndex(today);

  return (
    <View style={styles.row}>
      {activity.map((done, i) => (
        <View
          key={i}
          style={styles.day}
          accessible
          accessibilityLabel={`${labels[i]}: ${done ? '✓' : '—'}`}
        >
          <View style={[styles.dot, done && styles.dotDone, i === todayIdx && styles.dotToday]} />
          <Text style={[styles.label, i === todayIdx && styles.labelToday]}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  day: { alignItems: 'center', gap: 4 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface.card2,
  },
  dotDone: { backgroundColor: Colors.accent.main },
  dotToday: {
    borderWidth: 2,
    borderColor: Colors.accent.main,
  },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: 10, color: Colors.text.tertiary },
  labelToday: { color: Colors.accent.main },
});
