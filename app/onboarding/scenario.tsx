import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import OnboardingShell from '../../components/OnboardingShell';
import TextAnswer from '../../components/onboarding/TextAnswer';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';

/**
 * Open question that becomes the user's first own scenario — the most
 * personal part of the app, shown again in the plan reveal and the offer.
 */
export default function ScenarioStep() {
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const first = useStore((s) => s.scenarios[0]);
  const setUser = useStore((s) => s.setUser);
  const [title, setTitle] = useState(first?.title ?? user.situationsOther.split(/[,\n]/)[0]?.trim() ?? '');
  const [phrase, setPhrase] = useState(first?.phrases[0] ?? '');
  const [share, setShare] = useState(user.shareAnswers);
  const filled = !!title.trim();

  const next = () => {
    if (filled) {
      const { addScenario, updateScenario } = useStore.getState();
      const input = { title, phrases: phrase.trim() ? [phrase] : [], challenge: '' };
      // Going back and forth must not create duplicates.
      if (first) updateScenario(first.id, { ...input, phrases: [phrase, ...first.phrases.slice(1)] });
      else addScenario(input);
    }
    setUser({ shareAnswers: share });
    router.push('/onboarding/who');
  };

  return (
    <OnboardingShell
      step={4}
      title={t('onboarding.scenario_title')}
      subtitle={t('onboarding.scenario_sub')}
      footer={<PillButton label={filled ? t('common.continue') : t('common.skip')} onPress={next} />}
    >
      <TextAnswer
        label={t('onboarding.scenario_field')}
        value={title}
        onChange={setTitle}
        placeholder={t('onboarding.scenario_field_ph')}
        maxLength={80}
        testID="onboarding-scenario-title"
      />
      <TextAnswer
        label={t('onboarding.scenario_phrase')}
        value={phrase}
        onChange={setPhrase}
        placeholder={t('onboarding.scenario_phrase_ph')}
        testID="onboarding-scenario-phrase"
      />

      <View style={styles.share}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.shareTitle}>{t('onboarding.share_title')}</Text>
          <Text style={styles.shareDetail}>{t('onboarding.share_detail')}</Text>
        </View>
        <Switch
          value={share}
          onValueChange={setShare}
          trackColor={{ true: Colors.accent.main, false: Colors.surface.card2 }}
          accessibilityLabel={t('onboarding.share_title')}
          testID="share-answers"
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.cardSmall,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    marginTop: 8,
  },
  shareTitle: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.text.primary },
  shareDetail: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, lineHeight: 16, color: Colors.text.secondary },
});
