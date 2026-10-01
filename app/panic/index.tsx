import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation, useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import IconButton from '../../components/IconButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

const BALL_SIZE = 148;

type Phase = 'inhale' | 'hold' | 'exhale';

const PHASES: { phase: Phase; seconds: number; scale: number }[] = [
  { phase: 'inhale', seconds: 4, scale: 1.12 },
  { phase: 'hold', seconds: 4, scale: 1.12 },
  { phase: 'exhale', seconds: 6, scale: 0.8 },
];
const CYCLE_SECONDS = PHASES.reduce((sum, p) => sum + p.seconds, 0);

/** Where in the 4-4-6 cycle we are, derived purely from elapsed time. */
function breathState(elapsedSec: number) {
  const round = Math.floor(elapsedSec / CYCLE_SECONDS);
  let pos = elapsedSec % CYCLE_SECONDS;
  for (let i = 0; i < PHASES.length; i++) {
    if (pos < PHASES[i].seconds) {
      return { round, phaseIdx: i, remaining: Math.ceil(PHASES[i].seconds - pos) };
    }
    pos -= PHASES[i].seconds;
  }
  return { round, phaseIdx: 0, remaining: PHASES[0].seconds };
}

export default function PanicScreen() {
  const { t, tList } = useTranslation();
  const incrementPanicUses = useStore((s) => s.incrementPanicUses);
  const affirmations = tList('panic.affirmations');
  const [affirmIdx, setAffirmIdx] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const counted = useRef(false);

  const breathScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.5);

  const { round, phaseIdx, remaining } = breathState((now - startedAt) / 1000);
  const current = PHASES[phaseIdx];

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      incrementPanicUses();
    }
    const id = setInterval(() => setNow(Date.now()), 250);
    glowOpacity.set(withRepeat(
      withSequence(withTiming(0.95, { duration: 4000 }), withTiming(0.5, { duration: 3000 })),
      -1,
    ));
    return () => {
      clearInterval(id);
      cancelAnimation(glowOpacity);
      cancelAnimation(breathScale);
    };
  }, [incrementPanicUses, glowOpacity, breathScale]);

  // Each phase (of each round) animates the ball to its target over the phase length.
  useEffect(() => {
    const p = PHASES[phaseIdx];
    breathScale.set(withTiming(p.scale, {
      duration: p.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
    }));
  }, [phaseIdx, round, breathScale]);

  const ballStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathScale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value * 0.25 }));

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.glowTop, glowStyle]} pointerEvents="none">
        <LinearGradient colors={[Colors.accent.main, 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.header}>
        <IconButton icon="close" onPress={() => router.back()} accessibilityLabel={t('panic.close_a11y')} />
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title} accessibilityRole="header">{t('panic.title')}</Text>
        <Text style={styles.sub}>{t('panic.sub')}</Text>
      </View>

      <View style={styles.ballWrap}>
        <Animated.View
          style={[styles.ball, ballStyle]}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={t(`panic.phase_${current.phase}`)}
        >
          <Text style={styles.phaseCount}>{remaining}</Text>
          <Text style={styles.phaseLabel}>{t(`panic.phase_${current.phase}`)}</Text>
        </Animated.View>
      </View>

      <View style={styles.roundDots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.roundDot, i <= round % 3 && styles.roundDotActive]} />
        ))}
      </View>

      {affirmations.length > 0 && (
        <View style={styles.affirmCard}>
          <Text style={styles.affirmText}>
            💙 „{affirmations[affirmIdx % affirmations.length]}“
          </Text>
          <TouchableOpacity
            onPress={() => setAffirmIdx((a) => a + 1)}
            style={styles.affirmNext}
            accessibilityRole="button"
          >
            <Text style={styles.affirmNextText}>{t('panic.affirmation_next')} →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    zIndex: 1,
  },
  titleWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 20,
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.soraSemiBold,
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
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 12,
    gap: 4,
  },
  phaseCount: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 38,
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  phaseLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: 'rgba(240,246,255,0.75)',
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
  roundDotActive: { backgroundColor: Colors.accent.main },
  affirmCard: {
    marginHorizontal: Spacing.screenH,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
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
    color: Colors.accent.main,
  },
});
