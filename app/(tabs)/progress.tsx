import { ScrollView } from 'react-native-gesture-handler';
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, useShallow } from '../../state/store';
import Card from '../../components/Card';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 80;
const DAYS_DATA = [40, 60, 50, 75, 80, 55, 85];

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { subscription, streak, progress } = useStore(useShallow((s) => ({
    subscription: s.subscription,
    streak: s.streak,
    progress: s.progress,
  })));
  const isPremium = subscription.tier === 'premium';
  const todayIdx = (new Date().getDay() + 6) % 7;
  const days = t('common.weekdays_short') as unknown as string[];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>{t('progress.title')}</Text>

        {/* Streak hero */}
        <LinearGradient colors={['#1741C4', '#2563EB']} style={styles.streakHero}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakVal}>{streak.days} {t('progress.stat_total').includes('cv') ? 'dní' : 'days'}</Text>
            <Text style={styles.streakLabel}>{t('progress.current_streak')}</Text>
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{progress.exercisesTotal}</Text>
            <Text style={styles.statLabel}>{t('progress.stat_total')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{progress.panicUses}</Text>
            <Text style={styles.statLabel}>{t('progress.stat_panic')}</Text>
          </Card>
          {isPremium && (
            <Card style={styles.statCard}>
              <Text style={[styles.statNum, { color: Colors.success.green }]}>+24%</Text>
              <Text style={styles.statLabel}>{t('progress.stat_fluency')}</Text>
            </Card>
          )}
        </View>

        {/* Weekly streak dots */}
        <Card>
          <Text style={styles.sectionTitle}>{t('progress.this_week')}</Text>
          <View style={styles.dotRow}>
            {streak.weekMap.map((done, i) => (
              <View key={i} style={styles.dotCol}>
                <View
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    i === todayIdx && styles.dotToday,
                  ]}
                />
                <Text style={[styles.dotLabel, i === todayIdx && styles.dotLabelToday]}>
                  {Array.isArray(days) ? days[i] : ''}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Advanced stats — Premium only */}
        {isPremium ? (
          <>
            {/* Bar chart */}
            <Card>
              <Text style={styles.sectionTitle}>{t('progress.activity_week')}</Text>
              <View style={styles.chart}>
                {DAYS_DATA.map((val, i) => (
                  <View key={i} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (val / 100) * CHART_HEIGHT,
                          backgroundColor: i === todayIdx ? Colors.accent.cyan : Colors.primary.blue,
                          shadowColor: i === todayIdx ? Colors.accent.cyan : 'transparent',
                          shadowOpacity: 0.5,
                          shadowRadius: 8,
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, i === todayIdx && { color: Colors.accent.cyan }]}>
                      {Array.isArray(days) ? days[i] : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* AI insight */}
            <Card style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiDot}>✦</Text>
                <Text style={styles.aiLabel}>AI insight</Text>
              </View>
              <Text style={styles.aiText}>{t('progress.ai_insight')}</Text>
            </Card>
          </>
        ) : (
          /* Locked stats */
          <View style={styles.lockedWrap}>
            <Card style={styles.lockedBlur}>
              {/* blurred mock */}
              <View style={styles.blurOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockedTitle}>{t('progress.locked_title')}</Text>
                <Text style={styles.lockedSub}>{t('progress.locked_sub')}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/paywall/stats')}
                  style={styles.unlockBtn}
                >
                  <Text style={styles.unlockBtnText}>👑 {t('progress.unlock')} →</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* PDF report */}
        <TouchableOpacity
          style={[styles.pdfCard, !isPremium && styles.pdfCardLocked]}
          onPress={() => isPremium ? undefined : router.push('/paywall/premium')}
        >
          <Text style={styles.pdfIcon}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pdfTitle}>{t('progress.pdf_report')}</Text>
            <Text style={styles.pdfSub}>{t('progress.pdf_report_sub')}</Text>
          </View>
          {!isPremium && <Text style={{ color: Colors.premium.gold }}>👑</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 20, paddingBottom: 40, gap: 12 },
  screenTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  streakHero: {
    borderRadius: Radius.card,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakEmoji: { fontSize: 44 },
  streakVal: {
    fontFamily: FontFamily.soraBold,
    fontSize: 28,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  streakLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: 'rgba(240,246,255,0.7)',
    marginTop: 2,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statNum: {
    fontFamily: FontFamily.soraBold,
    fontSize: 26,
    color: Colors.text.primary,
  },
  statLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  dotRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dotCol: { alignItems: 'center', gap: 6 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface.card2,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  dotDone: { backgroundColor: Colors.primary.blue },
  dotToday: {
    backgroundColor: Colors.accent.cyan,
    shadowColor: Colors.accent.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  dotLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  dotLabelToday: { color: Colors.accent.cyan },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 24,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 4,
    backgroundColor: Colors.primary.blue,
  },
  barLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 9,
    color: Colors.text.tertiary,
  },
  aiCard: { gap: 10 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiDot: { color: Colors.accent.cyan, fontSize: 12 },
  aiLabel: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    color: Colors.accent.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  aiText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  lockedWrap: {},
  lockedBlur: { overflow: 'hidden' },
  blurOverlay: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  lockIcon: { fontSize: 32 },
  lockedTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  lockedSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  unlockBtn: {
    marginTop: 6,
    backgroundColor: Colors.premium.gold + '22',
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.premium.gold + '60',
  },
  unlockBtnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.premium.gold,
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 18,
  },
  pdfCardLocked: { opacity: 0.7 },
  pdfIcon: { fontSize: 28 },
  pdfTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  pdfSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
