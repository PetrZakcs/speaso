import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import { SITUATIONS } from '../../content/situations';
import { formatTime } from '../../lib/reminders';
import { Colors, FontFamily, FontSize, Spacing } from '../../theme/tokens';

const STEP_MS = 650;

/**
 * "Building your plan": a short beat that lists what was actually set up
 * from the answers (nothing invented), then reveals the plan.
 */
export default function Building() {
  const { t, lang } = useTranslation();
  const { user, reminder } = useStore(useShallow((s) => ({ user: s.user, reminder: s.reminder })));
  const [shown, setShown] = useState(0);

  const situations = SITUATIONS.filter((s) => user.situations.includes(s.id))
    .map((s) => s.content[lang].title)
    .join(', ');
  const steps = [
    t('onboarding.building_warmups'),
    situations ? t('onboarding.building_situations', { situations }) : t('onboarding.building_situations_any'),
    t('onboarding.building_minutes', { n: user.dailyMinutes }),
    user.ageGroup === 'child' ? t('onboarding.building_texts_child') : t('onboarding.building_texts'),
    ...(reminder.enabled
      ? [t('onboarding.building_reminder', { time: formatTime(reminder.hour, reminder.minute) })]
      : []),
  ];

  useEffect(() => {
    if (shown >= steps.length) {
      const id = setTimeout(() => router.replace('/onboarding/plan'), STEP_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [shown, steps.length]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.main}>
        <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
          {t('onboarding.building_title')}
        </Text>
        <View style={styles.list}>
          {steps.map((label, i) => {
            const done = i < shown;
            const active = i === shown;
            return (
              <View key={label} style={[styles.row, !done && !active && styles.rowPending]}>
                <View style={[styles.mark, done && styles.markDone]}>
                  {done ? (
                    <Ionicons name="checkmark" size={14} color={Colors.accent.on} />
                  ) : active ? (
                    <ActivityIndicator size="small" color={Colors.accent.main} />
                  ) : null}
                </View>
                <Text style={styles.rowText}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  main: { flex: 1, justifyContent: 'center', gap: 28 },
  title: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  list: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowPending: { opacity: 0.35 },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDone: { backgroundColor: Colors.accent.main },
  rowText: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, lineHeight: 21, color: Colors.text.primary },
});
