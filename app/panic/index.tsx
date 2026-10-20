import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import BreathingBall from '../../components/BreathingBall';
import CalmBackground from '../../components/calm/CalmBackground';
import CompanionAvatar from '../../components/CompanionAvatar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calm, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';
import { trackEvent } from '../../lib/analytics';
import { hapticSelect, hapticSuccess, hapticSighPhase } from '../../lib/haptics';

type PanicMode = 'ball' | 'sigh' | 'body';

export default function PanicScreen() {
  const { t, tList } = useTranslation();
  const incrementPanicUses = useStore((s) => s.incrementPanicUses);
  const affirmations = tList('panic.affirmations');
  const [mode, setMode] = useState<PanicMode>('ball');
  const [affirmIdx, setAffirmIdx] = useState(0);
  const [showTriggerSurvey, setShowTriggerSurvey] = useState(false);
  const startTime = useRef(Date.now());
  const counted = useRef(false);

  // Physiological Sigh timer state
  const [sighPhase, setSighPhase] = useState<1 | 2 | 3>(1);
  const [sighCycle, setSighCycle] = useState(1);

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      incrementPanicUses();
    }
  }, [incrementPanicUses]);

  useEffect(() => {
    if (mode !== 'sigh') return;
    hapticSighPhase(sighPhase);
    let timer: ReturnType<typeof setTimeout>;
    if (sighPhase === 1) {
      timer = setTimeout(() => {
        setSighPhase(2);
      }, 2500);
    } else if (sighPhase === 2) {
      timer = setTimeout(() => {
        setSighPhase(3);
      }, 1500);
    } else {
      timer = setTimeout(() => {
        hapticSuccess();
        setSighPhase(1);
        setSighCycle((c) => (c >= 5 ? 1 : c + 1));
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [mode, sighPhase]);

  const handleClose = () => {
    const elapsedSec = Math.round((Date.now() - startTime.current) / 1000);
    if (elapsedSec >= 4 && !showTriggerSurvey) {
      hapticSelect();
      setShowTriggerSurvey(true);
      return;
    }
    router.back();
  };

  const handleSelectTrigger = (triggerKey: string) => {
    hapticSuccess();
    const elapsedSec = Math.round((Date.now() - startTime.current) / 1000);
    trackEvent('panic_sos', { trigger: triggerKey, mode, durationSec: elapsedSec });
    setShowTriggerSurvey(false);
    router.back();
  };

  const TRIGGERS = [
    { key: 'phone', label: t('panic.trigger_phone') },
    { key: 'people', label: t('panic.trigger_people') },
    { key: 'work', label: t('panic.trigger_work') },
    { key: 'chat', label: t('panic.trigger_chat') },
    { key: 'tension', label: t('panic.trigger_tension') },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CalmBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('panic.close_a11y')}
          >
            <Ionicons name="close" size={22} color={Calm.text} />
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => {
              hapticSelect();
              setMode('ball');
            }}
            style={[styles.modeBtn, mode === 'ball' && styles.modeBtnActive]}
          >
            <Ionicons
              name="radio-button-on"
              size={14}
              color={mode === 'ball' ? Calm.bgFrom : Calm.text}
            />
            <Text style={[styles.modeText, mode === 'ball' && styles.modeTextActive]}>
              {t('panic.mode_ball')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              hapticSelect();
              setMode('sigh');
            }}
            style={[styles.modeBtn, mode === 'sigh' && styles.modeBtnActive]}
          >
            <Ionicons
              name="leaf-outline"
              size={14}
              color={mode === 'sigh' ? Calm.bgFrom : Calm.text}
            />
            <Text style={[styles.modeText, mode === 'sigh' && styles.modeTextActive]}>
              {t('panic.mode_sigh')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              hapticSelect();
              setMode('body');
            }}
            style={[styles.modeBtn, mode === 'body' && styles.modeBtnActive]}
          >
            <Ionicons
              name="body-outline"
              size={14}
              color={mode === 'body' ? Calm.bgFrom : Calm.text}
            />
            <Text style={[styles.modeText, mode === 'body' && styles.modeTextActive]}>
              {t('panic.mode_body')}
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'ball' && (
          <>
            <View style={styles.titleWrap}>
              <Text style={styles.title} accessibilityRole="header">{t('panic.title')}</Text>
              <Text style={styles.sub}>{t('panic.sub')}</Text>
            </View>

            <View style={styles.center}>
              <BreathingBall tone="calm" />
            </View>

            {affirmations.length > 0 && (
              <View style={styles.affirmCard}>
                <Text style={styles.affirmText}>
                  „{affirmations[affirmIdx % affirmations.length]}“
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
          </>
        )}

        {mode === 'sigh' && (
          <View style={styles.sighContainer}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{t('panic.sigh_title')}</Text>
              <Text style={styles.sub}>{t('panic.sigh_sub')}</Text>
            </View>

            <View style={styles.sighCenter}>
              <CompanionAvatar
                size={92}
                mood="breathing"
                style={{ marginBottom: 12 }}
              />
              <View style={[styles.sighOrb, sighPhase === 3 ? styles.sighOrbExhale : styles.sighOrbInhale]}>
                <Ionicons
                  name={sighPhase === 3 ? 'arrow-down' : 'arrow-up'}
                  size={32}
                  color={Calm.accent}
                />
                <Text style={styles.sighPhaseText}>
                  {sighPhase === 1 && t('panic.sigh_phase_1')}
                  {sighPhase === 2 && t('panic.sigh_phase_2')}
                  {sighPhase === 3 && t('panic.sigh_phase_3')}
                </Text>
              </View>
              <Text style={styles.sighCycleLabel}>
                {t('panic.sigh_cycle', { n: sighCycle, total: 5 })}
              </Text>
            </View>
          </View>
        )}

        {mode === 'body' && (
          <View style={styles.bodyContainer}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{t('panic.body_title')}</Text>
              <Text style={styles.sub}>{t('panic.body_sub')}</Text>
            </View>

            <View style={styles.bodyStepsList}>
              <View style={styles.bodyStepCard}>
                <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>1</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.bodyStepTitle}>{t('panic.body_step1_title')}</Text>
                  <Text style={styles.bodyStepDesc}>{t('panic.body_step1_desc')}</Text>
                </View>
              </View>

              <View style={styles.bodyStepCard}>
                <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>2</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.bodyStepTitle}>{t('panic.body_step2_title')}</Text>
                  <Text style={styles.bodyStepDesc}>{t('panic.body_step2_desc')}</Text>
                </View>
              </View>

              <View style={styles.bodyStepCard}>
                <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>3</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.bodyStepTitle}>{t('panic.body_step3_title')}</Text>
                  <Text style={styles.bodyStepDesc}>{t('panic.body_step3_desc')}</Text>
                </View>
              </View>

              <View style={styles.bodyStepCard}>
                <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>4</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.bodyStepTitle}>{t('panic.body_step4_title')}</Text>
                  <Text style={styles.bodyStepDesc}>{t('panic.body_step4_desc')}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Trigger Survey Modal */}
        <Modal visible={showTriggerSurvey} transparent animationType="fade">
          <View style={styles.surveyBackdrop}>
            <View style={styles.surveyCard}>
              <View style={styles.surveyHeader}>
                <Ionicons name="pulse" size={20} color={Calm.accent} />
                <Text style={styles.surveyTitle}>{t('panic.trigger_title')}</Text>
              </View>
              <Text style={styles.surveySub}>{t('panic.trigger_sub')}</Text>

              <View style={styles.triggerChips}>
                {TRIGGERS.map((trig) => (
                  <TouchableOpacity
                    key={trig.key}
                    onPress={() => handleSelectTrigger(trig.key)}
                    style={styles.triggerChip}
                    accessibilityRole="button"
                  >
                    <Text style={styles.triggerChipText}>{trig.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setShowTriggerSurvey(false);
                  router.back();
                }}
                style={styles.skipBtn}
                accessibilityRole="button"
              >
                <Text style={styles.skipText}>{t('panic.trigger_skip')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Calm.bgTo },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 8,
    zIndex: 1,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.hero,
    color: Calm.text,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    lineHeight: 22,
    color: Calm.muted,
    textAlign: 'center',
  },
  affirmCard: {
    marginHorizontal: Spacing.screenH,
    marginBottom: 16,
    backgroundColor: Calm.card,
    borderRadius: Radius.card,
    padding: 20,
    gap: 12,
  },
  affirmText: {
    fontFamily: FontFamily.heading,
    fontSize: 17,
    color: Calm.text,
    lineHeight: 25,
  },
  affirmNext: { alignSelf: 'flex-end' },
  affirmNextText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Calm.accent,
  },
  surveyBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  surveyCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Calm.bgFrom,
    borderRadius: Radius.sheet,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  surveyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle + 2,
    color: Calm.text,
  },
  surveySub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Calm.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  triggerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  triggerChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Calm.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  triggerChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Calm.text,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Calm.muted,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: Spacing.screenH,
    marginTop: 8,
    marginBottom: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeBtnActive: {
    backgroundColor: Calm.accent,
    borderColor: Calm.accent,
  },
  modeText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: 12,
    color: Calm.text,
  },
  modeTextActive: {
    color: Calm.bgFrom,
  },
  sighContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  sighCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  sighOrb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    borderWidth: 2,
  },
  sighOrbInhale: {
    backgroundColor: 'rgba(154, 230, 180, 0.15)',
    borderColor: Calm.accent,
  },
  sighOrbExhale: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  sighPhaseText: {
    fontFamily: FontFamily.heading,
    fontSize: 18,
    color: Calm.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  sighCycleLabel: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Calm.accent,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.screenH,
    gap: 16,
  },
  bodyStepsList: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  bodyStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Calm.card,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(154, 230, 180, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 15,
    color: Calm.accent,
  },
  bodyStepTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.body,
    color: Calm.text,
  },
  bodyStepDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Calm.muted,
    lineHeight: 18,
  },
});
