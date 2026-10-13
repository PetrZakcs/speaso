import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { useActivitySession } from '../../lib/useActivitySession';
import { SCENARIO_MINUTES, isScenarioUnlocked, scenarioActivityId } from '../../lib/scenarios';
import {
  DoneView, IntroView, PracticeView, SessionHeader, StepsPager, formatTime, sessionStyles, useTicker,
} from '../../components/session/SessionParts';
import RatingView from '../../components/session/RatingView';
import Recorder from '../../components/tools/Recorder';
import Card from '../../components/Card';
import { Colors, FontFamily, FontSize } from '../../theme/tokens';

/**
 * The user's own scenario, played like a guided situation:
 * generic prep → their sentences out loud (optionally recorded) → challenge → rate.
 */
export default function ScenarioPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tn, tList } = useTranslation();
  const scenario = useStore((s) => s.scenarios.find((x) => x.id === id));
  const [locked] = React.useState(() => {
    const { scenarios, subscription } = useStore.getState();
    return !isScenarioUnlocked(id ?? '', scenarios, subscription.isPremium);
  });
  const activityId = scenarioActivityId(id ?? 'unknown');
  const session = useActivitySession(activityId, locked);
  const { stage, startedAt } = session;
  const [phase, setPhase] = React.useState<'phrases' | 'challenge'>('phrases');
  const now = useTicker(startedAt !== null && (stage === 'steps' || stage === 'practice'));

  if (session.gate === 'premium') {
    return <Redirect href={{ pathname: '/paywall', params: { context: 'scenario' } }} />;
  }
  if (session.gate === 'limit') {
    return <Redirect href={{ pathname: '/paywall', params: { context: 'limit' } }} />;
  }
  // Deleted while open (or a stale link): nothing to practise.
  if (!scenario && stage !== 'done') {
    return (
      <SafeAreaView style={sessionStyles.safe}>
        <SessionHeader title="" onClose={() => router.back()} />
      </SafeAreaView>
    );
  }

  const title = scenario?.title ?? '';
  const phrases = scenario?.phrases ?? [];
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const timer = startedAt !== null && (stage === 'steps' || stage === 'practice')
    ? t('exercises.elapsed', { time: formatTime(elapsed), n: SCENARIO_MINUTES })
    : undefined;
  const progress = stage === 'intro' ? 0 : stage === 'steps' ? 0.3 : stage === 'practice' ? (phase === 'phrases' ? 0.6 : 0.85) : 1;
  const afterPrep = () => {
    if (phrases.length) session.setStage('practice');
    else {
      setPhase('challenge');
      session.setStage('practice');
    }
  };

  return (
    <SafeAreaView style={sessionStyles.safe}>
      {stage !== 'done' && (
        <SessionHeader title={title} subtitle={timer} progress={progress} onClose={() => router.back()} />
      )}

      {stage === 'intro' && (
        <View style={{ flex: 1 }}>
          <IntroView
            icon="create-outline"
            tint="lavender"
            title={title}
            sub={t('scenarios.intro_sub')}
            chips={[
              `${SCENARIO_MINUTES} ${t('common.min_short')}`,
              tn('scenarios.phrases_count', phrases.length),
            ]}
            onStart={() => session.start('steps')}
          />
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/scenario/edit', params: { id } })}
            style={styles.editLink}
            accessibilityRole="button"
          >
            <Text style={styles.editText}>{t('scenarios.edit')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {stage === 'steps' && (
        <StepsPager
          items={tList('scenarios.prep')}
          stepLabelKey="situations.prep_of"
          finishLabel={phrases.length ? t('situations.to_phrases') : t('situations.to_challenge')}
          onFinish={afterPrep}
        />
      )}

      {stage === 'practice' && phase === 'phrases' && (
        <StepsPager
          items={phrases}
          stepLabelKey="situations.phrase_of"
          finishLabel={t('situations.to_challenge')}
          onFinish={() => setPhase('challenge')}
          renderExtra={() => (
            <View style={{ gap: 8 }}>
              <Text style={styles.hint}>{t('situations.phrase_hint')}</Text>
              <Recorder exerciseId={activityId} />
            </View>
          )}
        />
      )}

      {stage === 'practice' && phase === 'challenge' && (
        <PracticeView actionLabel={t('exercises.finish')} onAction={session.complete}>
          <Card style={{ gap: 10 }}>
            <Text style={styles.label}>{t('situations.challenge_title')}</Text>
            <Text style={styles.challenge}>{scenario?.challenge || t('scenarios.challenge_default')}</Text>
          </Card>
          <Text style={styles.hint}>{t('situations.challenge_hint')}</Text>
        </PracticeView>
      )}

      {stage === 'rate' && <RatingView onDone={session.rate} />}

      {stage === 'done' && session.result && (
        <DoneView
          subtitle={`${t('exercises.done_sub')} · ${title}`}
          streak={session.result.streak}
          minutes={session.result.minutes}
          onClose={() => router.back()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  editLink: { alignSelf: 'center', padding: 12, marginBottom: 12 },
  editText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.accent.main },
  hint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  label: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  challenge: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 20,
    lineHeight: 29,
    color: Colors.text.primary,
  },
});
