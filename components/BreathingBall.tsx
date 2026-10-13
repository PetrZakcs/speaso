import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation, useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { useTranslation } from '../i18n/useTranslation';
import { Calm, Colors, FontFamily, FontSize } from '../theme/tokens';
import { hapticTick } from '../lib/haptics';

const BALL_SIZE = 148;
/** Concentric halo rings, as a multiple of the ball size. */
const RINGS = [1.9, 1.55, 1.25];

type Phase = 'inhale' | 'hold' | 'exhale';

const PHASES: { phase: Phase; seconds: number; scale: number }[] = [
  { phase: 'inhale', seconds: 4, scale: 1.12 },
  { phase: 'hold', seconds: 4, scale: 1.12 },
  { phase: 'exhale', seconds: 6, scale: 0.8 },
];
export const CYCLE_SECONDS = PHASES.reduce((sum, p) => sum + p.seconds, 0);

/** Where in the 4-4-6 cycle we are, derived purely from elapsed time. */
export function breathState(elapsedSec: number) {
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

/**
 * Guided 4-4-6 breathing ball with round dots. Runs forever unless `rounds`
 * is given — then it stops and calls `onComplete` after that many cycles.
 */
export default function BreathingBall({
  rounds,
  onComplete,
  tone = 'light',
}: {
  rounds?: number;
  onComplete?: () => void;
  /** 'calm' for the dark green immersive screens. */
  tone?: 'light' | 'calm';
}) {
  const { t } = useTranslation();
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const breathScale = useSharedValue(0.8);
  const completed = useRef(false);

  const elapsed = (now - startedAt) / 1000;
  const finished = rounds !== undefined && elapsed >= rounds * CYCLE_SECONDS;
  const { round, phaseIdx, remaining } = breathState(finished ? rounds! * CYCLE_SECONDS - 0.01 : elapsed);
  const current = PHASES[phaseIdx];

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [finished]);

  useEffect(() => () => cancelAnimation(breathScale), [breathScale]);

  useEffect(() => {
    if (finished && !completed.current) {
      completed.current = true;
      onComplete?.();
    }
  }, [finished, onComplete]);

  // Each phase (of each round) animates the ball to its target over the phase length,
  // with a soft tick so the rhythm can be followed with eyes closed.
  useEffect(() => {
    if (finished) return;
    hapticTick();
    const p = PHASES[phaseIdx];
    breathScale.set(withTiming(p.scale, { duration: p.seconds * 1000, easing: Easing.inOut(Easing.ease) }));
  }, [phaseIdx, round, breathScale, finished]);

  const ballStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathScale.value }] }));
  // Halos breathe a bit further than the ball, so the rings visibly open and close.
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.7 + breathScale.value * 0.35 }] }));
  const calm = tone === 'calm';
  const ringColor = calm ? Calm.accent : Colors.accent.main;
  const dots = rounds ?? 3;

  return (
    <View style={styles.wrap}>
      <View style={styles.ballWrap}>
        {RINGS.map((k, i) => (
          <Animated.View
            key={k}
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: BALL_SIZE * k,
                height: BALL_SIZE * k,
                borderRadius: (BALL_SIZE * k) / 2,
                backgroundColor: ringColor,
                opacity: (calm ? 0.06 : 0.07) * (i + 1),
              },
              ringStyle,
            ]}
          />
        ))}
        <Animated.View
          style={[styles.ball, calm && styles.ballCalm, ballStyle]}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={t(`panic.phase_${current.phase}`)}
        >
          <Text style={[styles.phaseCount, calm && styles.onCalm]}>{remaining}</Text>
          <Text style={[styles.phaseLabel, calm && styles.onCalm]}>{t(`panic.phase_${current.phase}`)}</Text>
        </Animated.View>
      </View>
      <View style={styles.roundDots}>
        {Array.from({ length: dots }, (_, i) => (
          <View
            key={i}
            style={[styles.roundDot, calm && styles.roundDotCalm, (rounds ? i < Math.min(round + 1, rounds) : i <= round % dots) && (calm ? styles.roundDotActiveCalm : styles.roundDotActive)]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ballWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: BALL_SIZE * RINGS[0],
    marginVertical: 12,
  },
  ring: { position: 'absolute' },
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
  ballCalm: { backgroundColor: Calm.accent, shadowColor: Calm.accent },
  onCalm: { color: Calm.bgTo },
  phaseCount: { fontFamily: FontFamily.soraBold, fontSize: 40, color: Colors.accent.on, letterSpacing: -1 },
  phaseLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.accent.on },
  roundDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  roundDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surface.card2 },
  roundDotActive: { backgroundColor: Colors.accent.main },
  roundDotCalm: { backgroundColor: Calm.track },
  roundDotActiveCalm: { backgroundColor: Calm.accent },
});
