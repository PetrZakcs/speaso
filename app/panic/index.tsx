import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

const { width } = Dimensions.get('window');
const BALL_SIZE = 148;

type Phase = 'inhale' | 'hold' | 'exhale';

const PHASE_DURATIONS: Record<Phase, number> = {
  inhale: 4000,
  hold: 4000,
  exhale: 6000,
};

const PHASES: Phase[] = ['inhale', 'hold', 'exhale'];

const AFFIRMATIONS = [
  'panic.affirmation_1',
  'panic.affirmation_2',
  'panic.affirmation_3',
];

export default function PanicScreen() {
  const { t } = useTranslation();
  const incrementPanicUses = useStore((s) => s.incrementPanicUses);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [round, setRound] = useState(0);
  const [affirmIdx, setAffirmIdx] = useState(0);
  const phaseRef = useRef<Phase>('inhale');
  const roundRef = useRef(0);

  const breathScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    incrementPanicUses();
    runBreathCycle();
  }, []);

  function runBreathCycle() {
    const runPhase = (p: Phase) => {
      phaseRef.current = p;
      setPhase(p);
      const dur = PHASE_DURATIONS[p];
      const targetScale = p === 'inhale' ? 1.12 : p === 'hold' ? 1.12 : 0.8;
      breathScale.value = withTiming(targetScale, { duration: dur, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (!finished) return;
        const nextIdx = (PHASES.indexOf(p) + 1) % PHASES.length;
        const nextPhase = PHASES[nextIdx];
        if (nextPhase === 'inhale') {
          roundRef.current += 1;
          runOnJS(setRound)(roundRef.current);
        }
        runOnJS(runPhase)(nextPhase);
      });
    };

    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.95, { duration: 4000 }), withTiming(0.5, { duration: 3000 })),
      -1,
    );

    runPhase('inhale');
  }

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const phaseLabels: Record<Phase, string> = {
    inhale: t('panic.phase_inhale'),
    hold: t('panic.phase_hold'),
    exhale: t('panic.phase_exhale'),
  };

  const phaseCounts: Record<Phase, number> = {
    inhale: 4,
    hold: 4,
    exhale: 6,
  };

  const affirmKey = AFFIRMATIONS[affirmIdx % AFFIRMATIONS.length];
  const affirmText = t(affirmKey, { defaultValue: 'Nespěchám. Mám právo si vzít čas, který potřebuju.' });

  const QUICK_ACTIONS = [
    { icon: '⚡', label: t('panic.action_quick') },
    { icon: '🎵', label: t('panic.action_sound') },
    { icon: '🎭', label: t('panic.action_prepare') },
    { icon: '📋', label: t('panic.action_journal') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Ambient glow */}
      <Animated.View style={[styles.glowTop, glowStyle]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{t('panic.title')}</Text>
        <Text style={styles.sub}>{t('panic.sub')}</Text>
      </View>

      {/* Breathing circle */}
      <View style={styles.ballWrap}>
        <Animated.View style={[styles.ball, ballStyle]}>
          <Text style={styles.phaseCount}>{phaseCounts[phase]}</Text>
          <Text style={styles.phaseLabel}>{phaseLabels[phase]}</Text>
        </Animated.View>
      </View>

      {/* Round dots */}
      <View style={styles.roundDots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.roundDot, i <= (round % 3) && styles.roundDotActive]}
          />
        ))}
      </View>

      {/* Affirmation */}
      <View style={styles.affirmCard}>
        <Text style={styles.affirmText}>💙 „{affirmText}"</Text>
        <TouchableOpacity
          onPress={() => setAffirmIdx((a) => a + 1)}
          style={styles.affirmNext}
        >
          <Text style={styles.affirmNextText}>{t('panic.affirmation_next')} →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionCard} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  glowTop: {
    position: 'absolute',
    top: -60,
    left: -40,
    right: -40,
    height: 280,
    backgroundColor: Colors.danger.panic,
    borderRadius: 999,
    opacity: 0.18,
    filter: undefined,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    zIndex: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.text.primary, fontSize: 16 },
  titleWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 20,
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  ballWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 12,
    gap: 4,
  },
  phaseCount: {
    fontFamily: FontFamily.soraBold,
    fontSize: 38,
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  phaseLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: 'rgba(240,246,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  roundDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  roundDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface.card2,
  },
  roundDotActive: { backgroundColor: Colors.primary.blue },
  affirmCard: {
    marginHorizontal: Spacing.screenH,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 18,
    gap: 12,
  },
  affirmText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  affirmNext: { alignSelf: 'flex-end' },
  affirmNextText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.primary.blue,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: Spacing.screenH,
    marginTop: 16,
  },
  actionCard: {
    width: (width - 50) / 2,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    flex: 1,
  },
});
