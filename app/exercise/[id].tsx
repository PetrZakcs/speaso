import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { getExercise } from '../../content/exercises';
import { canStartExercise, currentStreak } from '../../lib/streak';
import { toDateKey } from '../../lib/dates';
import IconButton from '../../components/IconButton';
import { Colors, FontFamily, FontSize, Gradients, Radius, Spacing } from '../../theme/tokens';

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Re-renders every second while `active`; the time itself comes from Date.now(). */
function useTicker(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function secondsSince(startedAt: number | null) {
  return startedAt ? (Date.now() - startedAt) / 1000 : 0;
}

type Result = { minutes: number; streak: number };

export default function ExercisePlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tn, tList } = useTranslation();
  const recordSession = useStore((s) => s.recordSession);
  const exercise = getExercise(id);

  // Evaluated once on open: finishing the 5th free exercise must not kick
  // the user out mid-session, but deep links can't bypass the limit either.
  const [allowed] = useState(() => {
    const { sessions, subscription } = useStore.getState();
    return canStartExercise(sessions, toDateKey(), subscription.isPremium);
  });
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const now = useTicker(startedAt !== null && !result);
  const stepOpacity = useSharedValue(1);
  const stepStyle = useAnimatedStyle(() => ({ opacity: stepOpacity.value }));

  if (!allowed) return <Redirect href={{ pathname: '/paywall', params: { context: 'limit' } }} />;

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.safe, styles.doneCenter]}>
        <Text style={styles.doneSub}>{t('exercises.not_found')}</Text>
        <IconButton icon="close" onPress={() => router.back()} accessibilityLabel={t('common.close')} />
      </SafeAreaView>
    );
  }

  const steps = tList(`exercises.steps.${exercise.id}`);
  const title = t(`exercises.${exercise.id}`);
  const elapsedSec = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const isLastStep = stepIdx === steps.length - 1;

  const goTo = (idx: number) => {
    stepOpacity.set(withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 300 })));
    setStepIdx(Math.max(0, Math.min(idx, steps.length - 1)));
  };

  const finish = () => {
    const durationSec = secondsSince(startedAt);
    recordSession(exercise.id, durationSec);
    const { streak } = useStore.getState();
    setResult({
      minutes: Math.max(1, Math.round(durationSec / 60)),
      streak: currentStreak(streak, toDateKey()),
    });
  };

  if (result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneCenter}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>{t('exercises.done_title')}</Text>
          <Text style={styles.doneSub}>{t('exercises.done_sub')} · {title}</Text>
          <View style={styles.doneStats}>
            <View style={styles.doneStat}>
              <Text style={styles.doneStatVal}>{result.streak}</Text>
              <Text style={styles.doneStatLabel}>{t('exercises.done_streak')}</Text>
            </View>
            <View style={styles.doneStatDiv} />
            <View style={styles.doneStat}>
              <Text style={styles.doneStatVal}>{result.minutes}</Text>
              <Text style={styles.doneStatLabel}>{t('exercises.done_minutes')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneCta} onPress={() => router.back()} accessibilityRole="button">
            <LinearGradient colors={Gradients.primary} style={styles.doneCtaGrad}>
              <Text style={styles.doneCtaText}>{t('exercises.done_cta')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="close" size={36} onPress={() => router.back()} accessibilityLabel={t('common.close')} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          {startedAt !== null && (
            <Text style={styles.timer}>
              {t('exercises.elapsed', { time: formatTime(elapsedSec), n: exercise.minutes })}
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${startedAt === null ? 0 : ((stepIdx + 1) / steps.length) * 100}%` },
          ]}
        />
      </View>

      {startedAt === null ? (
        <View style={styles.startCenter}>
          <Text style={styles.exIcon}>{exercise.emoji}</Text>
          <Text style={styles.startTitle}>{title}</Text>
          <Text style={styles.startSub}>{t(`exercises.${exercise.id}_sub`)}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>⏱ {exercise.minutes} {t('common.min_short')}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{tn('exercises.steps_count', steps.length)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setStartedAt(Date.now())} style={styles.startBtn} accessibilityRole="button">
            <LinearGradient colors={Gradients.primary} style={styles.startBtnGrad}>
              <Text style={styles.startBtnText}>{t('exercises.start')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sessionWrap}>
          <View style={styles.stepDots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[styles.stepDot, i === stepIdx && styles.stepDotActive, i < stepIdx && styles.stepDotDone]}
              />
            ))}
          </View>

          <Animated.View style={[styles.stepCard, stepStyle]} accessibilityLiveRegion="polite">
            <Text style={styles.stepNum}>{t('exercises.step_of', { n: stepIdx + 1, total: steps.length })}</Text>
            <Text style={styles.stepText}>{steps[stepIdx]}</Text>
          </Animated.View>

          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, stepIdx === 0 && styles.navBtnDisabled]}
              onPress={() => goTo(stepIdx - 1)}
              disabled={stepIdx === 0}
              accessibilityRole="button"
            >
              <Text style={styles.navBtnText}>{t('exercises.prev')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navBtnPrimary}
              onPress={isLastStep ? finish : () => goTo(stepIdx + 1)}
              accessibilityRole="button"
            >
              <Text style={styles.navBtnPrimaryText}>
                {isLastStep ? t('exercises.finish') : t('exercises.next')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  timer: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.cyan,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.hairline,
    marginHorizontal: Spacing.screenH,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary.blue,
    borderRadius: 2,
  },
  startCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    gap: 16,
  },
  exIcon: { fontSize: 72 },
  startTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: 26,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  startSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaChip: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  metaText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  startBtn: { width: '100%', borderRadius: Radius.pill, overflow: 'hidden', marginTop: 8 },
  startBtnGrad: {
    height: 56, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary.blue, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16,
  },
  startBtnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  sessionWrap: {
    flex: 1,
    paddingHorizontal: Spacing.screenH,
    paddingTop: 24,
    gap: 20,
  },
  stepDots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  stepDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.surface.card2,
  },
  stepDotActive: { backgroundColor: Colors.primary.blue, width: 20 },
  stepDotDone: { backgroundColor: Colors.success.green },
  stepCard: {
    flex: 1,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 28,
    justifyContent: 'center',
    gap: 16,
  },
  stepNum: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 10,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  stepText: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 22,
    color: Colors.text.primary,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 32,
  },
  navBtn: {
    flex: 1,
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  navBtnPrimary: {
    flex: 2,
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  navBtnPrimaryText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  doneCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    gap: 16,
  },
  doneEmoji: { fontSize: 80 },
  doneTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: 32,
    color: Colors.text.primary,
    letterSpacing: -0.6,
  },
  doneSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
  },
  doneStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 20,
    gap: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  doneStat: { alignItems: 'center', gap: 4, flex: 1 },
  doneStatVal: {
    fontFamily: FontFamily.soraBold,
    fontSize: 32,
    color: Colors.success.green,
  },
  doneStatLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  doneStatDiv: { width: 1, height: 40, backgroundColor: Colors.hairline },
  doneCta: { width: '100%', borderRadius: Radius.pill, overflow: 'hidden', marginTop: 8 },
  doneCtaGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
  doneCtaText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
});
