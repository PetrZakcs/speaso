import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../state/store';
import { useToday } from '../lib/useToday';
import { hapticSuccess } from '../lib/haptics';
import type { Rating } from '../lib/streak';
import CalmBackground from '../components/calm/CalmBackground';
import MoodSlider, { MOOD_GRADIENT } from '../components/calm/MoodSlider';
import { Calm, FontFamily, FontSize, Radius, Spacing } from '../theme/tokens';

/** Full-screen daily check-in: one question, one slider. */
export default function CheckInScreen() {
  const { t } = useTranslation();
  const today = useToday();
  const existing = useStore((s) => s.checkIns.find((c) => c.date === today)?.mood);
  const setCheckIn = useStore((s) => s.setCheckIn);
  const [mood, setMood] = useState<Rating>(existing ?? 3);
  const label = t(`rating.level_${mood}`);

  const save = () => {
    hapticSuccess();
    setCheckIn(mood);
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CalmBackground />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Ionicons name="close" size={22} color={Calm.text} />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.kicker}>{t('checkin.kicker')}</Text>
          <Text style={styles.question} accessibilityRole="header">{t('checkin.question')}</Text>
          <Text style={styles.sub}>{t('checkin.screen_sub')}</Text>

          <View style={styles.valueWrap}>
            <View style={[styles.valueDot, { backgroundColor: MOOD_GRADIENT[mood - 1] }]}>
              <Text style={styles.valueNum}>{mood}</Text>
            </View>
            <Text style={styles.valueLabel}>{label}</Text>
          </View>

          <MoodSlider
            value={mood}
            onChange={setMood}
            accessibilityLabel={t('checkin.slider_a11y')}
            valueLabel={label}
          />
          <View style={styles.ends}>
            <Text style={styles.endText}>{t('rating.level_1')}</Text>
            <Text style={styles.endText}>{t('rating.level_5')}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={save} style={styles.save} accessibilityRole="button" testID="checkin-save">
          <Text style={styles.saveText}>{t('checkin.save')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Calm.bgTo },
  safe: { flex: 1, paddingHorizontal: Spacing.screenH },
  close: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  body: { flex: 1, justifyContent: 'center', gap: 12 },
  kicker: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.meta,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Calm.accent,
  },
  question: { fontFamily: FontFamily.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: Calm.text },
  sub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.body, lineHeight: 22, color: Calm.muted },
  valueWrap: { alignItems: 'center', gap: 12, marginTop: 36, marginBottom: 20 },
  valueDot: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  valueNum: { fontFamily: FontFamily.soraExtraBold, fontSize: 44, color: '#14241C' },
  valueLabel: { fontFamily: FontFamily.soraSemiBold, fontSize: 22, color: Calm.text },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  endText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Calm.muted },
  save: {
    backgroundColor: Calm.text,
    borderRadius: Radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveText: { fontFamily: FontFamily.dmSansBold, fontSize: FontSize.body, color: Calm.bgFrom },
});
