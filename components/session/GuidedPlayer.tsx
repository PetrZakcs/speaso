import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useActivitySession } from '../../lib/useActivitySession';
import type { PaywallContext } from '../paywall/PaywallView';
import {
  DoneView, IntroView, PracticeView, SessionHeader, StepsPager, formatTime, sessionStyles, useTicker,
} from './SessionParts';
import RatingView from './RatingView';
import Recorder from '../tools/Recorder';
import Card from '../Card';
import { Colors, FontFamily, FontSize, type TintName } from '../../theme/tokens';

export interface GuidedContent {
  title: string;
  sub: string;
  icon: string;
  tint: TintName;
  minutes: number;
  chips: string[];
  prep: string[];
  phrases: string[];
  challenge: string;
}

/**
 * Shared player for guided situations and own scenarios:
 * prepare (steps) → rehearse phrases out loud, optionally recorded →
 * a real-world challenge → rate. `content` is null when the activity
 * doesn't exist (stale link, deleted scenario).
 */
export default function GuidedPlayer({
  activityId, locked, lockedContext, content, introExtra,
}: {
  activityId: string;
  /** Requires Premium the user doesn't have — evaluated once on open. */
  locked: boolean;
  lockedContext: Exclude<PaywallContext, undefined>;
  content: GuidedContent | null;
  /** Rendered under the intro (e.g. an "Edit" link). */
  introExtra?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const session = useActivitySession(activityId, locked);
  const { stage, startedAt } = session;
  const [phase, setPhase] = React.useState<'phrases' | 'challenge'>('phrases');
  // Frozen on start: editing or deleting a scenario mid-session doesn't pull the rug.
  const [frozen, setFrozen] = React.useState<GuidedContent | null>(null);
  const c = frozen ?? content;
  const now = useTicker(startedAt !== null && (stage === 'steps' || stage === 'practice'));

  if (session.gate === 'premium') {
    return <Redirect href={{ pathname: '/paywall', params: { context: lockedContext } }} />;
  }
  if (session.gate === 'limit') {
    return <Redirect href={{ pathname: '/paywall', params: { context: 'limit' } }} />;
  }
  if (!c) {
    return (
      <SafeAreaView style={sessionStyles.safe}>
        <SessionHeader title="" onClose={() => router.back()} />
      </SafeAreaView>
    );
  }

  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const timer = startedAt !== null && (stage === 'steps' || stage === 'practice')
    ? t('exercises.elapsed', { time: formatTime(elapsed), n: c.minutes })
    : undefined;
  const progress = stage === 'intro' ? 0 : stage === 'steps' ? 0.3 : stage === 'practice' ? (phase === 'phrases' ? 0.6 : 0.85) : 1;
  const toPractice = () => {
    if (!c.phrases.length) setPhase('challenge');
    session.setStage('practice');
  };

  return (
    <SafeAreaView style={sessionStyles.safe}>
      {stage !== 'done' && (
        <SessionHeader title={c.title} subtitle={timer} progress={progress} onClose={() => router.back()} />
      )}

      {stage === 'intro' && (
        <View style={{ flex: 1 }}>
          <IntroView
            icon={c.icon}
            tint={c.tint}
            title={c.title}
            sub={c.sub}
            chips={c.chips}
            onStart={() => {
              setFrozen(c);
              session.start('steps');
            }}
          />
          {introExtra}
        </View>
      )}

      {stage === 'steps' && (
        <StepsPager
          items={c.prep}
          stepLabelKey="situations.prep_of"
          finishLabel={c.phrases.length ? t('situations.to_phrases') : t('situations.to_challenge')}
          onFinish={toPractice}
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
              <Recorder exerciseId={activityId} />
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
    fontFamily: FontFamily.headingItalic,
    fontSize: FontSize.body,
    color: Colors.accent.main,
  },
  challenge: {
    fontFamily: FontFamily.heading,
    fontSize: 21,
    lineHeight: 29,
    color: Colors.text.primary,
  },
});
