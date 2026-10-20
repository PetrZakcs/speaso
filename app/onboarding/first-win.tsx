import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import BreathingBall from '../../components/BreathingBall';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Spacing } from '../../theme/tokens';
import { hapticSuccess } from '../../lib/haptics';

const ROUNDS = 3;

/**
 * The "small win" before any paywall: three calm 4-4-6 breaths (~40 s), so
 * the first thing the app does is help — not ask for money.
 */
export default function FirstWin() {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const next = () => router.push('/onboarding/offer');

  return (
    <SafeAreaView style={styles.safe}>
      {!done ? (
        <>
          <View style={styles.top}>
            <TouchableOpacity onPress={next} accessibilityRole="button" hitSlop={12}>
              <Text style={styles.skip}>{t('common.skip')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.main}>
            <Text style={styles.title} accessibilityRole="header">{t('onboarding.win_title')}</Text>
            <Text style={styles.sub}>{t('onboarding.win_sub', { n: ROUNDS })}</Text>
            <BreathingBall
              rounds={ROUNDS}
              onComplete={() => {
                hapticSuccess();
                setDone(true);
              }}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.main}>
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={44} color={Colors.accent.main} />
            </View>
            <Text style={[styles.title, styles.center]} accessibilityRole="header">{t('onboarding.win_done_title')}</Text>
            <Text style={[styles.sub, styles.center]}>{t('onboarding.win_done_sub')}</Text>

            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color={Colors.accent.main} />
              <Text style={styles.tipText}>{t('onboarding.win_insight_tip')}</Text>
            </View>
          </View>
          <View style={styles.footer}>
            <PillButton label={t('onboarding.win_cta')} onPress={next} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  top: { alignItems: 'flex-end', paddingTop: 12 },
  skip: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.tertiary },
  main: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    lineHeight: 22,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  center: { textAlign: 'center' },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.accent.soft,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    marginHorizontal: 8,
  },
  tipText: {
    flex: 1,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    lineHeight: 20,
    color: Colors.text.primary,
  },
  footer: { paddingBottom: 12 },
});
