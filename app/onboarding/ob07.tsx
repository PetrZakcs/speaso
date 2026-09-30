import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';
import type { TherapyStatus } from '../../state/store';

const OPTIONS: TherapyStatus[] = ['never', 'past', 'current', 'self'];

export default function OB07() {
  const { t } = useTranslation();
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<TherapyStatus | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setUser({ therapyStatus: selected });
    router.push('/onboarding/ob08');
  };

  return (
    <OnboardingShell step={6}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.therapy_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.therapy_sub')}</Text>

        <View style={styles.list}>
          {OPTIONS.map((opt) => {
            const active = selected === opt;
            const isCurrent = opt === 'current';
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.card, active && styles.cardActive, active && isCurrent && styles.cardPurple]}
                onPress={() => setSelected(opt)}
                activeOpacity={0.8}
              >
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, active && isCurrent && styles.cardTitlePurple]}>
                    {t(`onboarding.therapy_${opt}`)}
                  </Text>
                  <Text style={styles.cardSub}>{t(`onboarding.therapy_${opt}_sub`)}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive, active && isCurrent && styles.radioPurple]}>
                  {active && <View style={styles.radioDot} />}
                </View>
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
  cardActive: { borderColor: Colors.primary.blue },
  cardPurple: {
    borderColor: Colors.therapist.purple,
    backgroundColor: Colors.therapist.purple + '15',
    shadowColor: Colors.therapist.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  cardTitlePurple: { color: Colors.therapist.purple },
  cardSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary.blue },
  radioPurple: { borderColor: Colors.therapist.purple },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.blue,
  },
  footer: { paddingTop: 24 },
});
