import React, { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { SITUATIONS } from '../../content/situations';
import OnboardingShell from '../../components/OnboardingShell';
import ChoiceTile, { TileGrid } from '../../components/onboarding/ChoiceTile';
import TextAnswer from '../../components/onboarding/TextAnswer';
import PillButton from '../../components/PillButton';

/** Same ids as the guided situations, so home can recommend matching practice. */
export default function SituationsStep() {
  const { t, lang } = useTranslation();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<string[]>(
    user.situations.filter((id) => SITUATIONS.some((s) => s.id === id)),
  );
  const [otherOn, setOtherOn] = useState(!!user.situationsOther);
  const [other, setOther] = useState(user.situationsOther);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const answered = selected.length > 0 || (otherOn && !!other.trim());

  return (
    <OnboardingShell
      step={2}
      title={t('onboarding.situations_title')}
      subtitle={t('onboarding.situations_sub')}
      footer={
        <PillButton
          label={t('common.continue')}
          disabled={!answered}
          onPress={() => {
            setUser({ situations: selected, situationsOther: otherOn ? other.trim() : '' });
            router.push('/onboarding/insight');
          }}
        />
      }
    >
      <TileGrid>
        {SITUATIONS.map((s) => (
          <ChoiceTile
            key={s.id}
            multi
            icon={s.icon}
            tint={s.tint}
            title={s.content[lang].title}
            detail={s.content[lang].sub}
            selected={selected.includes(s.id)}
            onPress={() => toggle(s.id)}
          />
        ))}
        <ChoiceTile
          multi
          icon="chatbubble-ellipses-outline"
          tint="butter"
          title={t('onboarding.other')}
          detail={t('onboarding.other_detail')}
          selected={otherOn}
          onPress={() => setOtherOn((v) => !v)}
        />
      </TileGrid>
      {otherOn && (
        <TextAnswer
          value={other}
          onChange={setOther}
          placeholder={t('onboarding.other_situations_ph')}
          autoFocus
          testID="situations-other"
        />
      )}
    </OnboardingShell>
  );
}
