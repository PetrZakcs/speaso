import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceTile, { TileGrid } from '../../components/onboarding/ChoiceTile';
import PillButton from '../../components/PillButton';
import { GOALS, asGoal, type Goal } from '../../lib/goals';
import type { TintName } from '../../theme/tokens';

const GOAL_LOOK: Record<Goal, { icon: string; tint: TintName }> = {
  calm: { icon: 'leaf-outline', tint: 'sage' },
  confidence: { icon: 'sunny-outline', tint: 'butter' },
  situations: { icon: 'chatbubbles-outline', tint: 'sky' },
  accept: { icon: 'heart-outline', tint: 'peach' },
};

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
      <View accessibilityRole="radiogroup">
        <TileGrid>
          {GOALS.map((g) => (
            <ChoiceTile
              key={g}
              icon={GOAL_LOOK[g].icon}
              tint={GOAL_LOOK[g].tint}
              title={t(`onboarding.goal_${g}`)}
              detail={t(`onboarding.goal_${g}_detail`)}
              selected={selected === g}
              onPress={() => setSelected(g)}
            />
          ))}
        </TileGrid>
      </View>
    </OnboardingShell>
  );
}
