import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { getSituation } from '../../content/situations';
import { useActivitySession } from '../../lib/useActivitySession';
import {
  DoneView, IntroView, PracticeView, SessionHeader, StepsPager, formatTime, sessionStyles, useTicker,
} from '../../components/session/SessionParts';
import RatingView from '../../components/session/RatingView';
import Recorder from '../../components/tools/Recorder';
import Card from '../../components/Card';
import { Colors, FontFamily, FontSize } from '../../theme/tokens';

/**
 * Guided situation: prepare (steps) → rehearse phrases out loud with an
 * optional recording (practice) → a real-world challenge → rate.
 * Stages map onto the shared session: steps = prep, practice = phrases.
 */
export default function SituationPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useTranslation();
  const situation = getSituation(id);
  const session = useActivitySession(`situation:${situation?.id ?? 'unknown'}`, situation?.premium ?? false);
  const { stage, startedAt } = session;
  const [phase, setPhase] = React.useState<'phrases' | 'challenge'>('phrases');
  const now = useTicker(startedAt !== null && (stage === 'steps' || stage === 'practice'));

  if (session.gate === 'premium') {
    return <Redirect href={{ pathname: '/paywall', params: { context: 'situation' } }} />;
  }
  if (session.gate === 'limit') {
    return <Redirect href={{ pathname: '/paywall', params: { context: 'limit' } }} />;
  }
  if (!situation) {
    return (
      <SafeAreaView style={sessionStyles.safe}>
        <SessionHeader title="" onClose={() => router.back()} />
      </SafeAreaView>
    );
  }

  const c = situation.content[lang];
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const timer = startedAt !== null && (stage === 'steps' || stage === 'practice')
    ? t('exercises.elapsed', { time: formatTime(elapsed), n: situation.minutes })
    : undefined;
  const progress = stage === 'intro' ? 0 : stage === 'steps' ? 0.3 : stage === 'practice' ? (phase === 'phrases' ? 0.6 : 0.85) : 1;

  return (
    <SafeAreaView style={sessionStyles.safe}>
      {stage !== 'done' && (
        <SessionHeader title={c.title} subtitle={timer} progress={progress} onClose={() => router.back()} />
      )}

      {stage === 'intro' && (
        <IntroView
          emoji={situation.emoji}
          title={c.title}
          sub={c.sub}
          chips={[
            `⏱ ${situation.minutes} ${t('common.min_short')}`,
            t(`situations.level_${situation.difficulty}`),
          ]}
          onStart={() => session.start('steps')}
        />
      )}

      {stage === 'steps' && (
        <StepsPager
          items={c.prep}
          stepLabelKey="situations.prep_of"
          finishLabel={t('situations.to_phrases')}
          onFinish={() => session.setStage('practice')}
        />
      )}

      {stage === 'practice' && phase === 'phrases' && (
        <StepsPager
          items={c.phrases}
          stepLabelKey="situations.phrase_of"
          finishLabel={t('situations.to_challenge')}
          onFinish={() => setPhase('challenge')}
          renderExtra={() => (
            <View style={{ gap: 8 }}>
              <Text style={styles.hint}>{t('situations.phrase_hint')}</Text>
              <Recorder exerciseId={`situation:${situation.id}`} />
            </View>
          )}
        />
      )}

      {stage === 'practice' && phase === 'challenge' && (
        <PracticeView actionLabel={t('exercises.finish')} onAction={session.complete}>
          <Card style={{ gap: 10 }}>
            <Text style={styles.label}>{t('situations.challenge_title')}</Text>
            <Text style={styles.challenge}>{c.challenge}</Text>
          </Card>
          <Text style={styles.hint}>{t('situations.challenge_hint')}</Text>
        </PracticeView>
      )}

      {stage === 'rate' && <RatingView onDone={session.rate} />}

      {stage === 'done' && session.result && (
        <DoneView
          subtitle={`${t('exercises.done_sub')} · ${c.title}`}
          streak={session.result.streak}
          minutes={session.result.minutes}
          onClose={() => router.back()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  label: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 10,
    color: Colors.accent.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  challenge: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 20,
    lineHeight: 29,
    color: Colors.text.primary,
  },
});
