import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

const GOALS = [
  { id: 'fluency', icon: '🎯', metric: '+24%' },
  { id: 'confidence', icon: '💪', metric: '↑↑' },
  { id: 'situations', icon: '📞', metric: '15+' },
  { id: 'accept', icon: '🫶', metric: '∞' },
];

export default function OB06() {
  const { t } = useTranslation();
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setUser({ goal: selected });
    router.push('/onboarding/ob07');
  };

  return (
    <OnboardingShell step={5}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.goal_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.goal_sub')}</Text>

        <View style={styles.list}>
          {GOALS.map((goal) => {
            const active = selected === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(goal.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.icon}>{goal.icon}</Text>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                    {t(`onboarding.goal_${goal.id}`)}
                  </Text>
                  <Text style={styles.cardSub}>{t(`onboarding.goal_${goal.id}_sub`)}</Text>
                </View>
                <Text style={[styles.metric, active && styles.metricActive]}>{goal.metric}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('common.continue')} onPress={handleContinue} disabled={!selected} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 40, gap: 16 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
  },
  list: { gap: 10, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 18,
  },
  cardActive: {
    borderColor: Colors.primary.blue,
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  icon: { fontSize: 28 },
  cardText: { flex: 1 },
  cardTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  cardTitleActive: { color: Colors.primary.blue },
  cardSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  metric: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.tertiary,
  },
  metricActive: { color: Colors.success.green },
  footer: { paddingTop: 24 },
});
