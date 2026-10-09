import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceRow from '../../components/onboarding/ChoiceRow';
import PillButton from '../../components/PillButton';
import { GOALS, asGoal } from '../../lib/goals';

export default function GoalStep() {
  const { t } = useTranslation();
  const saved = useStore((s) => s.user.goal);
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<string | null>(asGoal(saved));

  return (
    <OnboardingShell
      step={3}
      title={t('onboarding.goal_title')}
      subtitle={t('onboarding.goal_sub')}
      footer={
        <PillButton
          label={t('common.continue')}
          disabled={!selected}
          onPress={() => {
            setUser({ goal: selected });
            router.push('/onboarding/who');
          }}
        />
      }
    >
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {GOALS.map((g) => (
          <ChoiceRow
            key={g}
            title={t(`onboarding.goal_${g}`)}
            detail={t(`onboarding.goal_${g}_detail`)}
            selected={selected === g}
            onPress={() => setSelected(g)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
