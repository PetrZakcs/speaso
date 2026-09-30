import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { EXERCISES } from '../../content/exercises';
import { useStartExercise } from '../../lib/useStartExercise';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export default function ExercisesScreen() {
  const { t } = useTranslation();
  const startExercise = useStartExercise();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle} accessibilityRole="header">{t('exercises.title')}</Text>

        <View style={styles.list}>
          {EXERCISES.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={styles.exCard}
              onPress={() => startExercise(ex.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${t(`exercises.${ex.id}`)}, ${ex.minutes} ${t('common.min_short')}`}
            >
              <View style={styles.exIconWrap}>
                <Text style={styles.exIcon}>{ex.emoji}</Text>
              </View>
              <View style={styles.exInfo}>
                <Text style={styles.exTitle}>{t(`exercises.${ex.id}`)}</Text>
                <Text style={styles.exSub}>{t(`exercises.${ex.id}_sub`)}</Text>
                <View style={styles.levelDots}>
                  {[1, 2, 3].map((l) => (
                    <View key={l} style={[styles.levelDot, l <= ex.level && styles.levelDotActive]} />
                  ))}
                  <Text style={styles.minsText}>{ex.minutes} {t('common.min_short')}</Text>
                </View>
              </View>
              <View style={styles.playBtn}>
                <Ionicons name="play" size={16} color={Colors.text.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Situations are planned for phase 2 — shown as a teaser, not sold. */}
        <View style={styles.soonCard}>
          <View style={styles.soonBadge}>
            <Text style={styles.soonBadgeText}>{t('common.coming_soon')}</Text>
          </View>
          <Text style={styles.soonTitle}>{t('exercises.situations_title')}</Text>
          <Text style={styles.soonSub}>{t('exercises.situations_sub')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 20, paddingBottom: 40, gap: 14 },
  screenTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  list: { gap: 10 },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
  },
  exIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIcon: { fontSize: 26 },
  exInfo: { flex: 1 },
  exTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  exSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  levelDots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  levelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surface.card2 },
  levelDotActive: { backgroundColor: Colors.accent.cyan },
  minsText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.text.tertiary,
    marginLeft: 6,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.hairline,
    borderRadius: Radius.card,
    padding: 18,
    gap: 6,
  },
  soonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.cyan + '22',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  soonBadgeText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 11,
    color: Colors.accent.cyan,
  },
  soonTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  soonSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
});
