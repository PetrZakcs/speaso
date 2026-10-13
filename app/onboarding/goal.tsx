import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceTile, { TileGrid } from '../../components/onboarding/ChoiceTile';
import TextAnswer from '../../components/onboarding/TextAnswer';
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
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  // 'other' = typed answer; it isn't a plan goal, so `goal` stays null for it.
  const [selected, setSelected] = useState<Goal | 'other' | null>(
    asGoal(user.goal) ?? (user.goalOther ? 'other' : null),
  );
  const [other, setOther] = useState(user.goalOther);
  const ready = selected === 'other' ? !!other.trim() : !!selected;

  return (
    <OnboardingShell
      step={3}
      title={t('onboarding.goal_title')}
      subtitle={t('onboarding.goal_sub')}
      footer={
        <PillButton
          label={t('common.continue')}
          disabled={!ready}
          onPress={() => {
            setUser(selected === 'other'
              ? { goal: null, goalOther: other.trim() }
              : { goal: selected, goalOther: '' });
            router.push('/onboarding/scenario');
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
          <ChoiceTile
            icon="chatbubble-ellipses-outline"
            tint="lavender"
            title={t('onboarding.other')}
            detail={t('onboarding.other_detail')}
            selected={selected === 'other'}
            onPress={() => setSelected('other')}
          />
        </TileGrid>
      </View>
      {selected === 'other' && (
        <TextAnswer value={other} onChange={setOther} placeholder={t('onboarding.other_goal_ph')} autoFocus />
      )}
    </OnboardingShell>
  );
}
