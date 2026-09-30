import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import Card from '../../components/Card';
import WeekDots from '../../components/WeekDots';
import { currentStreak, weekActivity, weekMinutes } from '../../lib/streak';
import { weekdayIndex } from '../../lib/dates';
import { useToday } from '../../lib/useToday';
import { Colors, FontFamily, FontSize, Gradients, Radius, Spacing } from '../../theme/tokens';

const CHART_HEIGHT = 80;

function WeekChart({ minutes, todayIdx }: { minutes: number[]; todayIdx: number }) {
  const { t, tList } = useTranslation();
  const labels = tList('common.weekdays_short');
  const max = Math.max(...minutes, 1);
  const empty = minutes.every((m) => m === 0);

  return (
    <Card>
      <Text style={styles.sectionTitle}>{t('progress.activity_week')}</Text>
      {empty ? (
        <Text style={styles.emptyText}>{t('progress.activity_empty')}</Text>
      ) : (
        <View style={styles.chart}>
          {minutes.map((val, i) => (
            <View
              key={i}
              style={styles.barCol}
              accessible
              accessibilityLabel={`${labels[i]}: ${val} ${t('common.min_short')}`}
            >
              <Text style={styles.barValue}>{val > 0 ? val : ''}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: (val / max) * CHART_HEIGHT,
                    backgroundColor: i === todayIdx ? Colors.accent.cyan : Colors.primary.blue,
                  },
                ]}
              />
              <Text style={[styles.barLabel, i === todayIdx && { color: Colors.accent.cyan }]}>
                {labels[i]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export default function ProgressScreen() {
  const { t, tn } = useTranslation();
  const today = useToday();
  const { isPremium, streak, sessions, panicUses } = useStore(useShallow((s) => ({
    isPremium: s.subscription.isPremium,
    streak: s.streak,
    sessions: s.sessions,
    panicUses: s.panicUses,
  })));

  const streakDays = currentStreak(streak, today);
  const activity = useMemo(() => weekActivity(sessions, today), [sessions, today]);
  const minutes = useMemo(() => weekMinutes(sessions, today), [sessions, today]);
  const totalMinutes = useMemo(
    () => Math.round(sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60),
    [sessions],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle} accessibilityRole="header">{t('progress.title')}</Text>

        {/* Streak hero */}
        <LinearGradient colors={Gradients.primary} style={styles.streakHero}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakVal}>{tn('progress.streak_value', streakDays)}</Text>
            <Text style={styles.streakLabel}>
              {t('progress.current_streak')} · {t('progress.streak_record', { n: streak.record })}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{sessions.length}</Text>
            <Text style={styles.statLabel}>{t('progress.stat_total')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>{t('progress.stat_minutes')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{panicUses}</Text>
            <Text style={styles.statLabel}>{t('progress.stat_panic')}</Text>
          </Card>
        </View>

        {/* This week */}
        <Card>
          <Text style={styles.sectionTitle}>{t('progress.this_week')}</Text>
          <WeekDots activity={activity} today={today} />
        </Card>

        {isPremium ? (
          <WeekChart minutes={minutes} todayIdx={weekdayIndex(today)} />
        ) : (
          <Card>
            <View style={styles.lockedContent}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>{t('progress.locked_title')}</Text>
              <Text style={styles.lockedSub}>{t('progress.locked_sub')}</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/paywall', params: { context: 'stats' } })}
                style={styles.unlockBtn}
                accessibilityRole="button"
              >
                <Text style={styles.unlockBtnText}>👑 {t('progress.unlock')} →</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
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
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
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
  emptyText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 40,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barValue: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 9,
    color: Colors.text.secondary,
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 9,
    color: Colors.text.tertiary,
  },
  lockedContent: { alignItems: 'center', paddingVertical: 16, gap: 10 },
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
});
