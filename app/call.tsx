import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore, useShallow } from '../state/store';
import { CALL_SCENARIOS, type CallScenario, formatTurnResponse } from '../content/callScenarios';
import { speakCallerTurn, stopCallerTurn } from '../lib/callSpeech';
import IconButton from '../components/IconButton';
import Card from '../components/Card';
import CompanionAvatar from '../components/CompanionAvatar';
import ZeroCloudBadge from '../components/ZeroCloudBadge';
import { hapticPress, hapticSuccess, hapticTick } from '../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow, Tints } from '../theme/tokens';
import { formatTime } from '../components/session/SessionParts';

type CallStage = 'select' | 'ringing' | 'active' | 'done';

export default function CallScreen() {
  const { t, lang } = useTranslation();
  const { user, recordSession, rateSession } = useStore(
    useShallow((s) => ({
      user: s.user,
      recordSession: s.recordSession,
      rateSession: s.rateSession,
    }))
  );

  const [selectedScenario, setSelectedScenario] = useState<CallScenario>(CALL_SCENARIOS[0]);
  const [stage, setStage] = useState<CallStage>('select');
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callerSpeaking, setCallerSpeaking] = useState(false);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number | null>(null);

  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTurn = selectedScenario.turns[currentTurnIdx];

  // Stop any active speech on unmount
  useEffect(() => {
    return () => {
      stopCallerTurn();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    };
  }, []);

  // Call timer tick
  useEffect(() => {
    if (stage === 'active') {
      callTimerRef.current = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [stage]);

  const startCall = (scenario: CallScenario) => {
    hapticPress();
    setSelectedScenario(scenario);
    setCurrentTurnIdx(0);
    setCallSeconds(0);
    setStage('ringing');

    // Simulate 2 seconds of ringing before caller picks up
    setTimeout(() => {
      hapticSuccess();
      setStage('active');
      triggerCallerTurn(scenario, 0);
    }, 2000);
  };

  const triggerCallerTurn = (scenario: CallScenario, turnIdx: number) => {
    const turn = scenario.turns[turnIdx];
    if (!turn) return;

    setCallerSpeaking(true);
    setPrepSecondsLeft(null);

    const promptText = turn.callerPrompt[lang];

    speakCallerTurn(
      promptText,
      lang,
      () => {
        // Caller finished speaking -> start physiological breathing prep window
        setCallerSpeaking(false);
        startPrepWindow(turn.prepSeconds);
      },
      () => {
        setCallerSpeaking(false);
        startPrepWindow(turn.prepSeconds);
      }
    );
  };

  const startPrepWindow = (seconds: number) => {
    setPrepSecondsLeft(seconds);
    hapticTick();

    if (prepTimerRef.current) clearInterval(prepTimerRef.current);

    prepTimerRef.current = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (prepTimerRef.current) clearInterval(prepTimerRef.current);
          hapticSuccess();
          return null; // Ready to speak
        }
        hapticTick();
        return prev - 1;
      });
    }, 1000);
  };

  const nextTurn = () => {
    hapticPress();
    stopCallerTurn();
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);

    if (currentTurnIdx + 1 < selectedScenario.turns.length) {
      const nextIdx = currentTurnIdx + 1;
      setCurrentTurnIdx(nextIdx);
      triggerCallerTurn(selectedScenario, nextIdx);
    } else {
      finishCall();
    }
  };

  const finishCall = () => {
    stopCallerTurn();
    hapticSuccess();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);

    // Save Rehearsal Session
    const sid = recordSession(`call:${selectedScenario.id}`, Math.max(10, callSeconds));
    rateSession(sid, 5);

    setStage('done');
  };

  const hangUp = () => {
    hapticPress();
    stopCallerTurn();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setStage('select');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* SELECT SCENARIO STAGE */}
      {stage === 'select' && (
        <>
          <View style={styles.header}>
            <IconButton icon="close" size={36} onPress={() => router.back()} accessibilityLabel={t('common.close')} />
            <Text style={styles.headerTitle} accessibilityRole="header">
              {t('call.kicker')}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{t('call.title')}</Text>
              <Text style={styles.sub}>{t('call.sub')}</Text>
              <ZeroCloudBadge compact style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            </View>

            <Text style={styles.sectionHeading}>{t('call.select_scenario')}</Text>

            <View style={styles.scenarioList}>
              {CALL_SCENARIOS.map((sc) => (
                <Card key={sc.id} style={styles.scenarioCard}>
                  <View style={styles.scenarioTop}>
                    <View style={styles.callIconWrap}>
                      <Ionicons name="call" size={20} color={Colors.accent.main} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.callerName}>{sc.callerName[lang]}</Text>
                      <Text style={styles.callerRole}>
                        {sc.callerRole[lang]} · {sc.callerNumber}
                      </Text>
                    </View>
                    <View style={styles.diffBadge}>
                      <Text style={styles.diffText}>
                        {t(`call.level_${sc.difficulty}`)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.focusText}>{sc.clinicalFocus[lang]}</Text>

                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => startCall(sc)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('call.btn_call')} ${sc.callerName[lang]}`}
                  >
                    <Ionicons name="call" size={16} color={Colors.accent.on} />
                    <Text style={styles.callButtonText}>{t('call.btn_call')}</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* RINGING STAGE */}
      {stage === 'ringing' && (
        <View style={styles.callScreen}>
          <View style={styles.callTop}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.ringingName}>{selectedScenario.callerName[lang]}</Text>
            <Text style={styles.ringingStatus}>{t('call.calling')}</Text>
          </View>

          <View style={styles.callBottom}>
            <TouchableOpacity
              style={styles.hangUpBtn}
              onPress={hangUp}
              accessibilityRole="button"
              accessibilityLabel={t('call.end_call')}
            >
              <Ionicons name="call" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ACTIVE CALL STAGE */}
      {stage === 'active' && currentTurn && (
        <View style={styles.callScreen}>
          {/* Call Header */}
          <View style={styles.activeTopBar}>
            <View style={styles.activeHeaderInfo}>
              <Text style={styles.activeCallerName}>{selectedScenario.callerName[lang]}</Text>
              <Text style={styles.activeTimer}>
                {t('call.connected')} · {formatTime(callSeconds)}
              </Text>
            </View>
            <ZeroCloudBadge compact />
          </View>

          {/* Caller Turn & Animated Speech Wave */}
          <View style={styles.callerBubble}>
            <View style={styles.callerLabelRow}>
              <Ionicons
                name={callerSpeaking ? 'volume-high' : 'volume-medium'}
                size={16}
                color={Colors.accent.main}
              />
              <Text style={styles.callerLabel}>
                {selectedScenario.callerRole[lang]} {callerSpeaking ? `(${t('call.caller_speaking')})` : ''}
              </Text>
            </View>
            <Text style={styles.callerText}>{currentTurn.callerPrompt[lang]}</Text>
          </View>

          {/* Physiological Breath Prep Window */}
          {prepSecondsLeft !== null ? (
            <View style={styles.prepCard}>
              <View style={styles.prepCountdownCircle}>
                <Text style={styles.prepCountdownText}>{prepSecondsLeft}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.prepTitle}>{t('call.breath_prep')}</Text>
                <Text style={styles.prepSub}>1. Klidný nádech · 2. Uvolni čelist · 3. Mluv pomalu</Text>
              </View>
            </View>
          ) : (
            /* User Speaking Turn Card */
            <View style={styles.userResponseCard}>
              <View style={styles.userTurnHeader}>
                <Ionicons name="mic" size={16} color={Colors.accent.main} />
                <Text style={styles.userTurnTitle}>{t('call.your_turn')}</Text>
              </View>

              <Text style={styles.userResponseText}>
                {`„${formatTurnResponse(currentTurn.suggestedResponse[lang], user.name, lang)}“`}
              </Text>

              <View style={styles.tipBox}>
                <Ionicons name="leaf" size={14} color={Colors.accent.main} />
                <Text style={styles.tipText}>{currentTurn.clinicalTip[lang]}</Text>
              </View>
            </View>
          )}

          {/* Turn Progress & Action Controls */}
          <View style={styles.callControlsWrap}>
            <View style={styles.turnIndicator}>
              <Text style={styles.turnIndicatorText}>
                Replika {currentTurnIdx + 1} z {selectedScenario.turns.length}
              </Text>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.hangUpBtnSmall}
                onPress={hangUp}
                accessibilityRole="button"
                accessibilityLabel={t('call.end_call')}
              >
                <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextTurnBtn}
                onPress={nextTurn}
                accessibilityRole="button"
                accessibilityLabel={t('call.next_turn')}
              >
                <Text style={styles.nextTurnText}>{t('call.next_turn')}</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.accent.on} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* CALL DEBRIEF STAGE */}
      {stage === 'done' && (
        <ScrollView contentContainerStyle={styles.doneScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.doneIconWrap}>
            <CompanionAvatar size={64} variant="capybara" mood="celebrate" />
          </View>

          <Text style={styles.doneTitle}>{t('call.done_title')}</Text>
          <Text style={styles.doneSub}>{t('call.done_sub')}</Text>

          {/* Debrief stats card */}
          <Card style={styles.debriefCard}>
            <View style={styles.debriefRow}>
              <View style={styles.debriefCol}>
                <Text style={styles.debriefVal}>{selectedScenario.turns.length}</Text>
                <Text style={styles.debriefLabel}>{t('call.debrief_turns')}</Text>
              </View>
              <View style={styles.debriefCol}>
                <Text style={styles.debriefVal}>{formatTime(callSeconds)}</Text>
                <Text style={styles.debriefLabel}>{t('call.debrief_time')}</Text>
              </View>
            </View>

            <View style={styles.debriefDivider} />

            <View style={styles.debriefTipRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent.main} />
              <Text style={styles.debriefTipText}>{selectedScenario.clinicalFocus[lang]}</Text>
            </View>
          </Card>

          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('call.done_cta')}
          >
            <Text style={styles.finishBtnText}>{t('call.done_cta')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scroll: {
    padding: Spacing.screenH,
    paddingBottom: 48,
    gap: 16,
  },
  titleBlock: {
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 26,
    color: Colors.text.primary,
    lineHeight: 32,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  sectionHeading: {
    fontFamily: FontFamily.heading,
    fontSize: 17,
    color: Colors.text.primary,
    marginTop: 4,
  },
  scenarioList: {
    gap: 14,
  },
  scenarioCard: {
    gap: 12,
    padding: Spacing.cardPad,
  },
  scenarioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  callerRole: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  diffBadge: {
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  diffText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.micro,
    color: Colors.text.secondary,
  },
  focusText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.main,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  callButtonText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.on,
  },

  // Ringing Call Screen
  callScreen: {
    flex: 1,
    backgroundColor: '#0F1A14',
    padding: Spacing.screenH,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  callTop: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringingName: {
    fontFamily: FontFamily.heading,
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ringingStatus: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  callBottom: {
    alignItems: 'center',
  },
  hangUpBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },

  // Active Call Screen
  activeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  activeHeaderInfo: {
    gap: 2,
  },
  activeCallerName: {
    fontFamily: FontFamily.heading,
    fontSize: 20,
    color: '#FFFFFF',
  },
  activeTimer: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  callerBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
    marginTop: 20,
  },
  callerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callerLabel: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.micro,
    color: Colors.accent.main,
    letterSpacing: 0.3,
  },
  callerText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 18,
    lineHeight: 26,
    color: '#FFFFFF',
  },
  prepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.accent.soft,
    borderRadius: Radius.card,
    padding: 16,
    ...Shadow.card,
  },
  prepCountdownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepCountdownText: {
    fontFamily: FontFamily.heading,
    fontSize: 22,
    color: Colors.accent.on,
  },
  prepTitle: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  prepSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  userResponseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.card,
    padding: 18,
    gap: 10,
    ...Shadow.card,
  },
  userTurnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userTurnTitle: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.micro,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  userResponseText: {
    fontFamily: FontFamily.heading,
    fontSize: 19,
    lineHeight: 28,
    color: Colors.text.primary,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Tints.sage.bg,
    padding: 10,
    borderRadius: Radius.chip,
  },
  tipText: {
    flex: 1,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  callControlsWrap: {
    gap: 12,
  },
  turnIndicator: {
    alignItems: 'center',
  },
  turnIndicatorText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hangUpBtnSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTurnBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.main,
    paddingVertical: 15,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  nextTurnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.accent.on,
  },

  // Debrief Screen
  doneScroll: {
    padding: Spacing.screenH,
    paddingTop: 40,
    alignItems: 'center',
    gap: 16,
  },
  doneIconWrap: {
    marginBottom: 8,
  },
  doneTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 26,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  doneSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  debriefCard: {
    width: '100%',
    padding: 18,
    gap: 14,
    marginTop: 8,
  },
  debriefRow: {
    flexDirection: 'row',
  },
  debriefCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  debriefVal: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    color: Colors.text.primary,
  },
  debriefLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
  debriefDivider: {
    height: 1,
    backgroundColor: Colors.surface.card2,
  },
  debriefTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  debriefTipText: {
    flex: 1,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  finishBtn: {
    width: '100%',
    backgroundColor: Colors.accent.main,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    alignItems: 'center',
    marginTop: 12,
    ...Shadow.card,
  },
  finishBtnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.accent.on,
  },
});
