import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { enableReminder, formatTime } from '../../lib/reminders';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceRow from '../../components/onboarding/ChoiceRow';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';

const MINUTES = [5, 15, 30] as const;

export default function RoutineStep() {
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const reminder = useStore((s) => s.reminder);
  const setUser = useStore((s) => s.setUser);
  const [minutes, setMinutes] = useState<5 | 15 | 30>(user.dailyMinutes);
  const [remind, setRemind] = useState(true);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    setUser({ dailyMinutes: minutes });
    // The system permission prompt appears right after the user opted in.
    if (remind) await enableReminder(reminder.hour, reminder.minute).catch(() => false);
    setBusy(false);
    router.push('/onboarding/building');
  };

  return (
    <OnboardingShell
      step={5}
      title={t('onboarding.routine_title')}
      subtitle={t('onboarding.routine_sub')}
      footer={<PillButton label={t('onboarding.routine_cta')} onPress={finish} loading={busy} />}
    >
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {MINUTES.map((m) => (
          <ChoiceRow
            key={m}
            title={t('onboarding.routine_minutes', { n: m })}
            detail={t(`onboarding.routine_${m}`)}
            selected={minutes === m}
            onPress={() => setMinutes(m)}
          />
        ))}
      </View>

      <View style={styles.reminder}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>
            {t('onboarding.routine_reminder', { time: formatTime(reminder.hour, reminder.minute) })}
          </Text>
          <Text style={styles.reminderDetail}>{t('onboarding.routine_reminder_detail')}</Text>
        </View>
        <Switch
          value={remind}
          onValueChange={setRemind}
          trackColor={{ false: Colors.text.tertiary, true: Colors.accent.main }}
          thumbColor="#FFFFFF"
          accessibilityLabel={t('onboarding.routine_reminder', { time: formatTime(reminder.hour, reminder.minute) })}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  reminder: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: Radius.cardSmall,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
  },
  reminderTitle: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  reminderDetail: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 3,
  },
});
