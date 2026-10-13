import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { SCENARIO_MINUTES, isScenarioUnlocked, scenarioActivityId } from '../../lib/scenarios';
import GuidedPlayer from '../../components/session/GuidedPlayer';
import { Colors, FontFamily, FontSize } from '../../theme/tokens';

/** The user's own scenario, played like a guided situation with generic prep. */
export default function ScenarioPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tn, tList } = useTranslation();
  const scenario = useStore((s) => s.scenarios.find((x) => x.id === id));
  const [locked] = React.useState(() => {
    const { scenarios, subscription } = useStore.getState();
    return !isScenarioUnlocked(id ?? '', scenarios, subscription.isPremium);
  });

  return (
    <GuidedPlayer
      activityId={scenarioActivityId(id ?? 'unknown')}
      locked={locked}
      lockedContext="scenario"
      content={scenario ? {
        title: scenario.title,
        sub: t('scenarios.intro_sub'),
        icon: 'create-outline',
        tint: 'lavender',
        minutes: SCENARIO_MINUTES,
        chips: [
          `${SCENARIO_MINUTES} ${t('common.min_short')}`,
          tn('scenarios.phrases_count', scenario.phrases.length),
        ],
        prep: tList('scenarios.prep'),
        phrases: scenario.phrases,
        challenge: scenario.challenge || t('scenarios.challenge_default'),
      } : null}
      introExtra={
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/scenario/edit', params: { id } })}
          style={styles.editLink}
          accessibilityRole="button"
        >
          <Text style={styles.editText}>{t('scenarios.edit')}</Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  editLink: { alignSelf: 'center', padding: 12, marginBottom: 12 },
  editText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.accent.main },
});
