import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../state/store';
import type { DateKey } from '../lib/dates';
import { MOOD_GRADIENT } from './calm/MoodSlider';
import { Calm, Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';

/** "How is speaking today?" — opens the full-screen check-in; collapses once answered. */
export default function CheckInCard({ today }: { today: DateKey }) {
  const { t } = useTranslation();
  const checkIn = useStore((s) => s.checkIns.find((c) => c.date === today));
  const open = () => router.push('/checkin');

  if (checkIn) {
    return (
      <View style={[styles.compact, Shadow.card]}>
        <View style={[styles.moodBadge, { backgroundColor: MOOD_GRADIENT[checkIn.mood - 1] }]}>
          <Text style={styles.moodBadgeText}>{checkIn.mood}</Text>
        </View>
        <Text style={styles.compactText}>
          {t('checkin.today', { mood: t(`rating.level_${checkIn.mood}`).toLowerCase() })}
        </Text>
        <TouchableOpacity onPress={open} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.change}>{t('checkin.change')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={open} activeOpacity={0.85} accessibilityRole="button" testID="checkin-open">
      <LinearGradient
        colors={[Calm.bgFrom, '#2C5641']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.prompt}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.kicker}>{t('checkin.kicker')}</Text>
          <Text style={styles.title}>{t('checkin.question')}</Text>
          <Text style={styles.sub}>{t('checkin.prompt_sub')}</Text>
        </View>
        <View style={styles.go}>
          <Ionicons name="arrow-forward" size={20} color={Calm.bgFrom} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  prompt: {
    borderRadius: Radius.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  kicker: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.micro + 1,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Calm.accent,
  },
  title: { fontFamily: FontFamily.soraBold, fontSize: 19, color: Calm.text, letterSpacing: -0.3 },
  sub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, color: Calm.muted },
  go: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Calm.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 18,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface.card,
  },
  moodBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moodBadgeText: { fontFamily: FontFamily.soraBold, fontSize: FontSize.body, color: '#14241C' },
  compactText: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.primary },
  change: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
});
