import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { getExercise } from '../../content/exercises';
import { useActivitySession } from '../../lib/useActivitySession';
import {
  DoneView, IntroView, PracticeView, SessionHeader, StepsPager, formatTime, sessionStyles, useTicker,
} from '../../components/session/SessionParts';
import RatingView from '../../components/session/RatingView';
import Recorder from '../../components/tools/Recorder';
import Metronome from '../../components/tools/Metronome';
import PacingMeter from '../../components/tools/PacingMeter';
import ReadingPanel from '../../components/tools/ReadingPanel';
import { Colors } from '../../theme/tokens';

export default function ExercisePlayer() {
  const { id, stage: stageParam } = useLocalSearchParams<{ id: string; stage?: 'intro' | 'steps' | 'practice' | 'rate' | 'done' }>();
  const { t, tn, tList } = useTranslation();
  const exercise = getExercise(id);
  const session = useActivitySession(exercise?.id ?? 'unknown', false, stageParam ?? 'intro');
  const { stage, startedAt } = session;
  const now = useTicker(startedAt !== null && (stage === 'steps' || stage === 'practice'));

  if (session.gate === 'limit') {
    return <Redirect href={{ pathname: '/paywall', params: { context: 'limit' } }} />;
  }
  if (!exercise) {
    return (
      <SafeAreaView style={sessionStyles.safe}>
        <SessionHeader title="" onClose={() => router.back()} />
        <Text style={{ color: Colors.text.secondary, textAlign: 'center' }}>{t('exercises.not_found')}</Text>
      </SafeAreaView>
    );
  }

  const steps = tList(`exercises.steps.${exercise.id}`);
  const title = t(`exercises.${exercise.id}`);
  const hasPractice = exercise.kind !== 'steps';
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const timer = startedAt !== null && (stage === 'steps' || stage === 'practice')
    ? t('exercises.elapsed', { time: formatTime(elapsed), n: exercise.minutes })
    : undefined;
  const progress = stage === 'intro' ? 0 : stage === 'steps' ? 0.4 : stage === 'practice' ? 0.75 : 1;

  return (
    <SafeAreaView style={sessionStyles.safe}>
      {stage !== 'done' && (
        <SessionHeader title={title} subtitle={timer} progress={progress} onClose={() => router.back()} />
      )}

      {stage === 'intro' && (
        <IntroView
          icon={exercise.icon}
          tint={exercise.tint}
          title={title}
          sub={t(`exercises.${exercise.id}_sub`)}
          chips={[`${exercise.minutes} ${t('common.min_short')}`, tn('exercises.steps_count', steps.length)]}
          onStart={() => session.start('steps')}
        />
      )}

      {stage === 'steps' && (
        <StepsPager
          items={steps}
          finishLabel={hasPractice ? t('exercises.to_practice') : t('exercises.finish')}
          onFinish={hasPractice ? () => session.setStage('practice') : session.complete}
        />
      )}

      {stage === 'practice' && (
        <PracticeView actionLabel={t('exercises.finish')} onAction={session.complete}>
          {exercise.kind === 'metronome' && <Metronome />}
          {exercise.kind === 'metronome' && <PacingMeter />}
          <ReadingPanel initialLevel={exercise.kind === 'metronome' ? 1 : 2} />
          {exercise.kind === 'reading' && <Recorder exerciseId={exercise.id} />}
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
