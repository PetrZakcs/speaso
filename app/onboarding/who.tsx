import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, type AgeGroup } from '../../state/store';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceRow from '../../components/onboarding/ChoiceRow';
import PillButton from '../../components/PillButton';

/** Only "child" changes the app (reading texts), so that's the one question we ask. */
const OPTIONS: { id: AgeGroup; key: string }[] = [
  { id: 'adult', key: 'self' },
  { id: 'child', key: 'child' },
];

export default function WhoStep() {
  const { t } = useTranslation();
  const saved = useStore((s) => s.user.ageGroup);
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<AgeGroup | null>(saved === 'child' ? 'child' : saved ? 'adult' : null);

  return (
    <OnboardingShell
      step={4}
      title={t('onboarding.who_title')}
      subtitle={t('onboarding.who_sub')}
      footer={
        <PillButton
          label={t('common.continue')}
          disabled={!selected}
          onPress={() => {
            setUser({ ageGroup: selected });
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
    </OnboardingShell>
  );
}
