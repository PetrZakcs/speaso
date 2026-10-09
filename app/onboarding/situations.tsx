import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { SITUATIONS } from '../../content/situations';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceRow from '../../components/onboarding/ChoiceRow';
import PillButton from '../../components/PillButton';

/** Same ids as the guided situations, so home can recommend matching practice. */
export default function SituationsStep() {
  const { t, lang } = useTranslation();
  const saved = useStore((s) => s.user.situations);
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<string[]>(
    saved.filter((id) => SITUATIONS.some((s) => s.id === id)),
  );

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <OnboardingShell
      step={2}
      title={t('onboarding.situations_title')}
      subtitle={t('onboarding.situations_sub')}
      footer={
        <PillButton
          label={selected.length ? t('common.continue') : t('common.skip')}
          onPress={() => {
            setUser({ situations: selected });
            router.push('/onboarding/insight');
          }}
        />
      }
    >
      <View style={{ gap: 10 }}>
        {SITUATIONS.map((s) => (
          <ChoiceRow
            key={s.id}
            multi
            title={s.content[lang].title}
            detail={s.content[lang].sub}
            selected={selected.includes(s.id)}
            onPress={() => toggle(s.id)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
