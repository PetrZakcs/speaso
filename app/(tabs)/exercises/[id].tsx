import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '../../../i18n/useTranslation';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, useShallow } from '../../../state/store';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../../theme/tokens';

const EXERCISES: Record<string, { icon: string; titleKey: string; subKey: string; mins: number; steps: string[] }> = {
  breathing: {
    icon: '🫁', titleKey: 'exercises.ex_breathing', subKey: 'exercises.ex_breathing_sub', mins: 8,
    steps: ['Uvolni ramena a zavři oči.', 'Polož ruku na břicho.', 'Nádech nosem 4 vteřiny — břicho jde ven.', 'Zadrž 2 vteřiny.', 'Výdech ústy 6 vteřin — pomalý, rovnoměrný.', 'Opakuj 5×. Pak zkus říct větu — klidně, bez spěchu.'],
  },
  reading: {
    icon: '📖', titleKey: 'exercises.ex_reading', subKey: 'exercises.ex_reading_sub', mins: 5,
    steps: ['Najdi klidné místo. Vezmi jakýkoli text.', 'Čti nahlas — pomalu, jako kdybys četl malému dítěti.', 'Každé slovo vyslov celé. Nespěchej.', 'Na tečce si vždy udělej pauzu — nádech.', 'Pokud se zasekneš: zastav, nádech, zkus znovu.', 'Cíl: 2 minuty plynulého čtení bez zastavení.'],
  },
  softstart: {
    icon: '🎙️', titleKey: 'exercises.ex_softstart', subKey: 'exercises.ex_softstart_sub', mins: 6,
    steps: ['Vyber 5 slov začínajících na různá písmena.', 'Každé slovo začni velmi jemně — jako šepot, který zesiluje.', 'Př: „...auto" → „auto" → „AUTO"', 'Zaměř se na první hlásku — nenásilně ji naseď.', 'Opakuj každé slovo 3×. Tempo si sám urči.', 'Pak zkus celou větu stejnou technikou.'],
  },
  aicall: {
    icon: '🎭', titleKey: 'exercises.ex_aicall', subKey: 'exercises.ex_aicall_sub', mins: 10,
    steps: ['AI ti zavolá jako recepční v ordinaci.', 'Tvůj úkol: objednat se na prohlídku.', 'Není co pokazit — AI je trpělivá a čeká.', 'Kdykoliv se zaseknete: AI zopakuje otázku.', 'Po hovoru dostaneš zpětnou vazbu.', 'Připravený? Stiskni Start.'],
  },
};

export default function ExercisePlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { incrementWeeklyExercises, incrementExercisesTotal, incrementStreak } = useStore(useShallow((s) => ({
    incrementWeeklyExercises: s.incrementWeeklyExercises,
    incrementExercisesTotal: s.incrementExercisesTotal,
    incrementStreak: s.incrementStreak,
  })));

  const ex = EXERCISES[id ?? 'breathing'] ?? EXERCISES.breathing;
  const [stepIdx, setStepIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const progress = useSharedValue(0);
  const stepOpacity = useSharedValue(1);

  useEffect(() => {
    if (!started || done) return;
    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        progress.value = withTiming(next / (ex.mins * 60), { duration: 1000 });
        if (next >= ex.mins * 60) {
          setDone(true);
          clearInterval(interval);
          incrementWeeklyExercises();
          incrementExercisesTotal();
          incrementStreak();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, done]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  const goNext = () => {
    stepOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withTiming(1, { duration: 300 }),
    );
    setStepIdx((i) => Math.min(i + 1, ex.steps.length - 1));
  };

  const goPrev = () => {
    stepOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withTiming(1, { duration: 300 }),
    );
    setStepIdx((i) => Math.max(i - 1, 0));
  };

  const stepStyle = useAnimatedStyle(() => ({ opacity: stepOpacity.value }));

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeLeft = ex.mins * 60 - elapsed;
  const minsLeft = Math.floor(timeLeft / 60);
  const secsLeft = timeLeft % 60;

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneCenter}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Výborně!</Text>
          <Text style={styles.doneSub}>Cvičení dokončeno · {ex.mins} {t('common.min_short')}</Text>
          <View style={styles.doneStats}>
            <View style={styles.doneStat}>
              <Text style={styles.doneStatVal}>+1</Text>
              <Text style={styles.doneStatLabel}>Série 🔥</Text>
            </View>
            <View style={styles.doneStatDiv} />
            <View style={styles.doneStat}>
              <Text style={styles.doneStatVal}>{ex.mins}</Text>
              <Text style={styles.doneStatLabel}>Minut</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.doneCta}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <LinearGradient colors={['#1741C4', '#2563EB']} style={styles.doneCtaGrad}>
              <Text style={styles.doneCtaText}>Zpět domů →</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t(ex.titleKey)}</Text>
          {started && (
            <Text style={styles.timer}>
              {minsLeft}:{secsLeft.toString().padStart(2, '0')} zbývá
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      {/* Main content */}
      {!started ? (
        <View style={styles.startCenter}>
          <Text style={styles.exIcon}>{ex.icon}</Text>
          <Text style={styles.startTitle}>{t(ex.titleKey)}</Text>
          <Text style={styles.startSub}>{t(ex.subKey)}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>⏱ {ex.mins} {t('common.min_short')}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{ex.steps.length} kroků</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setStarted(true)} style={styles.startBtn}>
            <LinearGradient colors={['#1741C4', '#2563EB']} style={styles.startBtnGrad}>
              <Text style={styles.startBtnText}>▶ Spustit cvičení</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sessionWrap}>
          {/* Step indicator */}
          <View style={styles.stepDots}>
            {ex.steps.map((_, i) => (
              <View
                key={i}
                style={[styles.stepDot, i === stepIdx && styles.stepDotActive, i < stepIdx && styles.stepDotDone]}
              />
            ))}
          </View>

          {/* Step content */}
          <Animated.View style={[styles.stepCard, stepStyle]}>
            <Text style={styles.stepNum}>Krok {stepIdx + 1}/{ex.steps.length}</Text>
            <Text style={styles.stepText}>{ex.steps[stepIdx]}</Text>
          </Animated.View>

          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, stepIdx === 0 && styles.navBtnDisabled]}
              onPress={goPrev}
              disabled={stepIdx === 0}
            >
              <Text style={styles.navBtnText}>← Zpět</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtnPrimary} onPress={goNext}>
              <Text style={styles.navBtnPrimaryText}>
                {stepIdx < ex.steps.length - 1 ? 'Další →' : 'Dokončit ✓'}
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
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface.card,
    borderWidth: 1, borderColor: Colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: Colors.text.primary, fontSize: 14 },
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
