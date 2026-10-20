import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, type AgeGroup, type TherapyStatus } from '../../state/store';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceRow from '../../components/onboarding/ChoiceRow';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize } from '../../theme/tokens';

const OPTIONS: { id: AgeGroup; key: string }[] = [
  { id: 'adult', key: 'self' },
  { id: 'child', key: 'child' },
];

const THERAPY_OPTIONS: { id: TherapyStatus; titleKey: string; detailKey: string }[] = [
  { id: 'never', titleKey: 'onboarding.therapy_never', detailKey: 'onboarding.therapy_never_detail' },
  { id: 'past', titleKey: 'onboarding.therapy_past', detailKey: 'onboarding.therapy_past_detail' },
  { id: 'current', titleKey: 'onboarding.therapy_current', detailKey: 'onboarding.therapy_current_detail' },
  { id: 'self', titleKey: 'onboarding.therapy_self', detailKey: 'onboarding.therapy_self_detail' },
];

export default function WhoStep() {
  const { t } = useTranslation();
  const { user, setUser } = useStore();
  const [selected, setSelected] = useState<AgeGroup | null>(user.ageGroup === 'child' ? 'child' : user.ageGroup ? 'adult' : null);
  const [therapy, setTherapy] = useState<TherapyStatus | null>(user.therapyStatus ?? null);

  return (
    <OnboardingShell
      step={5}
      title={t('onboarding.who_title')}
      subtitle={t('onboarding.who_sub')}
      footer={
        <PillButton
          label={t('common.continue')}
          disabled={!selected}
          onPress={() => {
            setUser({ ageGroup: selected, therapyStatus: therapy });
            router.push('/onboarding/routine');
          }}
        />
      }
    >
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {OPTIONS.map((o) => (
          <ChoiceRow
            key={o.id}
            title={t(`onboarding.who_${o.key}`)}
            detail={t(`onboarding.who_${o.key}_detail`)}
            selected={selected === o.id}
            onPress={() => setSelected(o.id)}
          />
        ))}
      </View>

      <View style={styles.therapySection}>
        <Text style={styles.therapyTitle}>{t('onboarding.therapy_section_title')}</Text>
        <View style={{ gap: 8 }} accessibilityRole="radiogroup">
          {THERAPY_OPTIONS.map((to) => (
            <ChoiceRow
              key={to.id}
              title={t(to.titleKey)}
              detail={t(to.detailKey)}
              selected={therapy === to.id}
              onPress={() => setTherapy(to.id)}
            />
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  therapySection: {
    marginTop: 20,
    gap: 10,
  },
  therapyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
});
