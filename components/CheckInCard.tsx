import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../state/store';
import type { DateKey } from '../lib/dates';
import Card from './Card';
import { PressableRaised } from './depth/Raised';
import { MOOD_GRADIENT } from './calm/MoodSlider';
import { Calm, Colors, Depth, FontFamily, FontSize, Radius } from '../theme/tokens';

/** "How is speaking today?" — opens the full-screen check-in; collapses once answered. */
export default function CheckInCard({ today }: { today: DateKey }) {
  const { t, q } = useTranslation();
  const checkIn = useStore((s) => s.checkIns.find((c) => c.date === today));
  const open = () => router.push('/checkin');

  if (checkIn) {
    const hasFactors = checkIn.sleepHours !== undefined || checkIn.waterGlasses !== undefined || checkIn.weather !== undefined || (checkIn.tags && checkIn.tags.length > 0);
    return (
      <Card style={styles.compact}>
        <View style={styles.compactMain}>
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

        {hasFactors && (
          <View style={styles.factorsRow}>
            {checkIn.tags?.slice(0, 2).map((tagId) => (
              <View key={tagId} style={styles.somaticChip}>
                <Ionicons name="sparkles" size={11} color={Colors.accent.main} />
                <Text style={styles.somaticText}>{t(`checkin.tag_${tagId}`)}</Text>
              </View>
            ))}
            {checkIn.sleepHours !== undefined && (
              <View style={styles.factorChip}>
                <Ionicons name="moon-outline" size={13} color={Colors.accent.main} />
                <Text style={styles.factorText}>{checkIn.sleepHours}h</Text>
              </View>
            )}
            {checkIn.waterGlasses !== undefined && (
              <View style={styles.factorChip}>
                <Ionicons name="water-outline" size={13} color={Colors.accent.main} />
                <Text style={styles.factorText}>{t('checkin.badge_water', { n: checkIn.waterGlasses })}</Text>
              </View>
            )}
            {checkIn.weather && (
              <View style={styles.factorChip}>
                <Ionicons
                  name={
                    checkIn.weather === 'sunny'
                      ? 'sunny-outline'
                      : checkIn.weather === 'rain'
                      ? 'rainy-outline'
                      : checkIn.weather === 'storm'
                      ? 'thunderstorm-outline'
                      : checkIn.weather === 'cold'
                      ? 'snow-outline'
                      : 'partly-sunny-outline'
                  }
                  size={13}
                  color={Colors.accent.main}
                />
                <Text style={styles.factorText}>{t(`checkin.weather_${checkIn.weather}`)}</Text>
              </View>
            )}
          </View>
        )}

        {!!checkIn.note && (
          <Text style={styles.noteSnippet} numberOfLines={2}>
            {q(checkIn.note)}
          </Text>
        )}
      </Card>
    );
  }

  return (
    <PressableRaised
      onPress={open}
      depth={Depth.card}
      ledgeColor={Colors.accent.ledge}
      radius={Radius.card}
      faceStyle={styles.promptFace}
      accessibilityRole="button"
      testID="checkin-open"
    >
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
    </PressableRaised>
  );
}

const styles = StyleSheet.create({
  promptFace: {
    overflow: 'hidden',
  },
  prompt: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  kicker: {
    fontFamily: FontFamily.headingItalic,
    fontSize: 14,
    color: Calm.accent,
  },
  title: { fontFamily: FontFamily.heading, fontSize: 19, color: Calm.text, letterSpacing: -0.3 },
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
    padding: 16,
    paddingHorizontal: 18,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface.card,
    gap: 10,
  },
  compactMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moodBadgeText: { fontFamily: FontFamily.heading, fontSize: FontSize.body, color: '#14241C' },
  compactText: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.primary },
  change: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  factorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  factorText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  somaticChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(44, 86, 65, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(44, 86, 65, 0.25)',
  },
  somaticText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  noteSnippet: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
