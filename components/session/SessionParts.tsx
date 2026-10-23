import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { useTranslation } from '../../i18n/useTranslation';
import IconButton from '../IconButton';
import PillButton from '../PillButton';
import CompanionAvatar from '../CompanionAvatar';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow, type TintName } from '../../theme/tokens';
import { hapticSuccess } from '../../lib/haptics';

export function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function secondsSince(startedAt: number | null) {
  return startedAt ? (Date.now() - startedAt) / 1000 : 0;
}

/** Re-renders every second while `active`; the time itself comes from Date.now(). */
export function useTicker(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function SessionHeader({
  title, subtitle, progress, onClose,
}: {
  title: string;
  subtitle?: string;
  progress?: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.header}>
        <IconButton icon="close" size={36} onPress={onClose} accessibilityLabel={t('common.close')} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.timer}>{subtitle}</Text>}
        </View>
        <View style={{ width: 36 }} />
      </View>
      {progress !== undefined && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(1, Math.max(0, progress)) * 100}%` }]} />
        </View>
      )}
    </>
  );
}

export function IntroView({
  title, sub, chips, onStart,
}: {
  icon?: string;
  tint?: TintName;
  title: string;
  sub: string;
  chips: string[];
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.startCenter}>
      <CompanionAvatar size={104} variant="duo" mood="idle" />
      <Text style={styles.startTitle} accessibilityRole="header">{title}</Text>
      <Text style={styles.startSub}>{sub}</Text>
      <View style={styles.metaRow}>
        {chips.map((c) => (
          <View key={c} style={styles.metaChip}>
            <Text style={styles.metaText}>{c}</Text>
          </View>
        ))}
      </View>
      <PillButton label={t('exercises.start')} onPress={onStart} style={styles.startBtn} />
    </View>
  );
}

/**
 * One card at a time with back / next. `renderExtra` adds content under the
 * card (e.g. a recorder for rehearsing a phrase).
 */
export function StepsPager({
  items, stepLabelKey = 'exercises.step_of', finishLabel, onFinish, onIndexChange, renderExtra,
}: {
  items: string[];
  stepLabelKey?: string;
  finishLabel: string;
  onFinish: () => void;
  onIndexChange?: (idx: number) => void;
  renderExtra?: (idx: number) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const opacity = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const isLast = idx === items.length - 1;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, items.length - 1));
    opacity.set(withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 300 })));
    setIdx(clamped);
    onIndexChange?.(clamped);
  };

  const card = (
    <Animated.View
      style={[styles.stepCard, !renderExtra && { flex: 1 }, cardStyle]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.stepNum}>{t(stepLabelKey, { n: idx + 1, total: items.length })}</Text>
      <Text style={styles.stepText}>{items[idx]}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.sessionWrap}>
      <View style={styles.stepDots}>
        {items.map((_, i) => (
          <View key={i} style={[styles.stepDot, i === idx && styles.stepDotActive, i < idx && styles.stepDotDone]} />
        ))}
      </View>

      {renderExtra ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
          {card}
          {/* key resets per-step state (e.g. the recorder) when the step changes */}
          <View key={idx}>{renderExtra(idx)}</View>
        </ScrollView>
      ) : (
        card
      )}

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, idx === 0 && styles.navBtnDisabled]}
          onPress={() => goTo(idx - 1)}
          disabled={idx === 0}
          accessibilityRole="button"
        >
          <Text style={styles.navBtnText}>{t('exercises.prev')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navBtnPrimary}
          onPress={isLast ? onFinish : () => goTo(idx + 1)}
          accessibilityRole="button"
        >
          <Text style={styles.navBtnPrimaryText}>{isLast ? finishLabel : t('exercises.next')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Scrollable practice area with a single primary action at the bottom. */
export function PracticeView({
  children, actionLabel, onAction,
}: {
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.sessionWrap}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtnPrimary} onPress={onAction} accessibilityRole="button">
          <Text style={styles.navBtnPrimaryText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function DoneView({
  subtitle, streak, minutes, onClose,
}: {
  subtitle: string;
  streak: number;
  minutes: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    hapticSuccess();
  }, []);
  return (
    <View style={styles.doneCenter}>
      <CompanionAvatar size={96} mood="celebrate" variant="duo" style={{ marginBottom: 10 }} />
      <Text style={styles.doneTitle} accessibilityRole="header">{t('exercises.done_title')}</Text>
      <Text style={styles.doneSub}>{subtitle}</Text>
      <View style={styles.doneStats}>
        <View style={styles.doneStat}>
          <Text style={styles.doneStatVal}>{streak}</Text>
          <Text style={styles.doneStatLabel}>{t('exercises.done_streak')}</Text>
        </View>
        <View style={styles.doneStatDiv} />
        <View style={styles.doneStat}>
          <Text style={styles.doneStatVal}>{minutes}</Text>
          <Text style={styles.doneStatLabel}>{t('exercises.done_minutes')}</Text>
        </View>
      </View>
      <PillButton label={t('exercises.done_cta')} onPress={onClose} style={styles.doneCta} />
    </View>
  );
}

export const sessionStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  timer: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.hairline,
    marginHorizontal: Spacing.screenH,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent.main,
    borderRadius: 2,
  },
  startCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    gap: 16,
  },
  startTitle: {
    fontFamily: FontFamily.heading,
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
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  metaText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  startBtn: { alignSelf: 'stretch', marginTop: 8 },
  sessionWrap: {
    flex: 1,
    paddingHorizontal: Spacing.screenH,
    paddingTop: 24,
    gap: 20,
  },
  stepDots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surface.card2 },
  stepDotActive: { backgroundColor: Colors.accent.main, width: 20 },
  stepDotDone: { backgroundColor: Colors.accent.main },
  stepCard: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 28,
    justifyContent: 'center',
    gap: 16,
  },
  stepNum: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  stepText: {
    fontFamily: FontFamily.heading,
    fontSize: 22,
    color: Colors.text.primary,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  navRow: { flexDirection: 'row', gap: 10, paddingBottom: 32 },
  navBtn: {
    flex: 1,
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
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
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimaryText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.on,
  },
  doneCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    gap: 16,
  },
  doneMark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 32,
    color: Colors.text.primary,
    letterSpacing: -0.6,
  },
  doneSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  doneStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 20,
    gap: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  doneStat: { alignItems: 'center', gap: 4, flex: 1 },
  doneStatVal: { fontFamily: FontFamily.heading, fontSize: 30, color: Colors.text.primary },
  doneStatLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  doneStatDiv: { width: 1, height: 40, backgroundColor: Colors.hairline },
  doneCta: { alignSelf: 'stretch', marginTop: 8 },
});
