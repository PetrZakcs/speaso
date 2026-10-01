import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { EXERCISES } from '../../content/exercises';
import { SITUATIONS } from '../../content/situations';
import { useStartExercise, useStartSituation } from '../../lib/useStartExercise';
import { useIsPremium } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

const DIFF_COLORS = {
  easy: Colors.success.green,
  medium: Colors.premium.gold,
  hard: Colors.danger.panic,
} as const;

export default function ExercisesScreen() {
  const { t, lang } = useTranslation();
  const startExercise = useStartExercise();
  const startSituation = useStartSituation();
  const isPremium = useIsPremium();

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

        <Text style={styles.sectionTitle} accessibilityRole="header">{t('situations.title')}</Text>
        <Text style={styles.sectionSub}>{t('situations.intro')}</Text>
        <View style={styles.list}>
          {SITUATIONS.map((sit) => {
            const locked = sit.premium && !isPremium;
            const c = sit.content[lang];
            return (
              <TouchableOpacity
                key={sit.id}
                style={[styles.exCard, locked && styles.locked]}
                onPress={() => startSituation(sit)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${c.title}, ${t(`situations.level_${sit.difficulty}`)}${locked ? `, ${t('common.premium')}` : ''}`}
              >
                <View style={styles.exIconWrap}>
                  <Text style={styles.exIcon}>{sit.emoji}</Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exTitle}>{c.title}</Text>
                  <Text style={styles.exSub}>{c.sub}</Text>
                  <View style={styles.levelDots}>
                    <View style={[styles.diffBadge, { backgroundColor: DIFF_COLORS[sit.difficulty] + '22' }]}>
                      <Text style={[styles.diffText, { color: DIFF_COLORS[sit.difficulty] }]}>
                        {t(`situations.level_${sit.difficulty}`)}
                      </Text>
                    </View>
                    <Text style={styles.minsText}>{sit.minutes} {t('common.min_short')}</Text>
                  </View>
                </View>
                {locked ? (
                  <Text style={styles.crown}>👑</Text>
                ) : (
                  <View style={styles.playBtn}>
                    <Ionicons name="play" size={16} color={Colors.text.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
  sectionTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginTop: 8,
  },
  sectionSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginTop: -6,
  },
  locked: { opacity: 0.75 },
  crown: { fontSize: 18 },
  diffBadge: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  diffText: { fontFamily: FontFamily.dmSansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
