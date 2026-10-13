import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { getSituation } from '../../content/situations';
import { useStore } from '../../state/store';
import GuidedPlayer from '../../components/session/GuidedPlayer';

/** A guided real-life situation (content/situations.ts). */
export default function SituationPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const situation = getSituation(id);
  const [locked] = React.useState(
    () => !!situation?.premium && !useStore.getState().subscription.isPremium,
  );
  const c = situation?.content[lang];

  return (
    <GuidedPlayer
      activityId={`situation:${situation?.id ?? 'unknown'}`}
      locked={locked}
      lockedContext="situation"
      content={situation && c ? {
        title: c.title,
        sub: c.sub,
        icon: situation.icon,
        tint: situation.tint,
        minutes: situation.minutes,
        chips: [
          `${situation.minutes} ${t('common.min_short')}`,
          t(`situations.level_${situation.difficulty}`),
        ],
        prep: c.prep,
        phrases: c.phrases,
        challenge: c.challenge,
      } : null}
    />
  );
}
