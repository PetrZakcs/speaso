import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import Card from '../../components/Card';
import WeekDots from '../../components/WeekDots';
import { averageRating, currentStreak, weekActivity, weekMinutes } from '../../lib/streak';
import { addDays, mondayOf, weekdayIndex } from '../../lib/dates';
import { activityTitle, formatDate } from '../../lib/activities';
import { exportReport } from '../../lib/report';
import { RATING_EMOJI } from '../../components/session/RatingView';
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
  const { t, tn, lang } = useTranslation();
  const today = useToday();
  const [exporting, setExporting] = useState(false);
  const { isPremium, streak, sessions, panicUses, recordingsCount } = useStore(useShallow((s) => ({
    isPremium: s.subscription.isPremium,
    streak: s.streak,
    sessions: s.sessions,
    panicUses: s.panicUses,
    recordingsCount: s.recordings.length,
  })));

  const streakDays = currentStreak(streak, today);
  const activity = useMemo(() => weekActivity(sessions, today), [sessions, today]);
  const minutes = useMemo(() => weekMinutes(sessions, today), [sessions, today]);
  const journal = useMemo(() => sessions.filter((s) => s.rating).slice(-5).reverse(), [sessions]);
  const monday = mondayOf(today);
  const ratingThisWeek = averageRating(sessions, monday, today);
  const ratingLastWeek = averageRating(sessions, addDays(monday, -7), addDays(monday, -1));

  const handleExport = async () => {
    if (!isPremium) {
      router.push({ pathname: '/paywall', params: { context: 'pdf' } });
      return;
    }
    setExporting(true);
    try {
      await exportReport(lang);
    } catch {
      Alert.alert(t('report.title'), t('report.error'));
    } finally {
      setExporting(false);
    }
  };

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
          <>
            <WeekChart minutes={minutes} todayIdx={weekdayIndex(today)} />
            <Card>
              <Text style={styles.sectionTitle}>{t('progress.rating_title')}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.ratingCol}>
                  <Text style={styles.ratingVal}>{ratingThisWeek ? ratingThisWeek.toFixed(1) : '—'}</Text>
                  <Text style={styles.statLabel}>{t('progress.this_week')}</Text>
                </View>
                <View style={styles.ratingCol}>
                  <Text style={[styles.ratingVal, styles.ratingPrev]}>{ratingLastWeek ? ratingLastWeek.toFixed(1) : '—'}</Text>
                  <Text style={styles.statLabel}>{t('progress.last_week')}</Text>
                </View>
              </View>
              <Text style={styles.emptyText}>{t('progress.rating_explain')}</Text>
            </Card>
          </>
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

        {/* Journal */}
        <Card>
          <Text style={styles.sectionTitle}>{t('progress.journal_title')}</Text>
          {journal.length === 0 ? (
            <Text style={styles.emptyText}>{t('progress.journal_empty')}</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {journal.map((s) => (
                <View key={s.id} style={styles.journalRow}>
                  <Text style={styles.journalEmoji}>{s.rating ? RATING_EMOJI[s.rating] : ''}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.journalTitle}>
                      {activityTitle(s.exerciseId, lang)} · <Text style={styles.journalDate}>{formatDate(s.completedAt, lang)}</Text>
                    </Text>
                    {!!s.note && <Text style={styles.journalNote} numberOfLines={3}>{s.note}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <TouchableOpacity style={styles.linkCard} onPress={() => router.push('/recordings')} accessibilityRole="button">
          <Ionicons name="mic-outline" size={22} color={Colors.accent.cyan} />
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t('recordings.title')}</Text>
            <Text style={styles.linkSub}>{tn('recordings.count', recordingsCount)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={handleExport}
          disabled={exporting}
          accessibilityRole="button"
        >
          <Ionicons name="document-text-outline" size={22} color={Colors.accent.cyan} />
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t('report.cta')}</Text>
            <Text style={styles.linkSub}>{exporting ? t('report.generating') : t('report.cta_sub')}</Text>
          </View>
          {isPremium ? (
            <Ionicons name="share-outline" size={18} color={Colors.text.tertiary} />
          ) : (
            <Text>👑</Text>
          )}
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
  ratingRow: { flexDirection: 'row', marginBottom: 8 },
  ratingCol: { flex: 1, alignItems: 'center' },
  ratingVal: { fontFamily: FontFamily.soraBold, fontSize: 28, color: Colors.accent.cyan },
  ratingPrev: { color: Colors.text.secondary },
  journalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  journalEmoji: { fontSize: 22 },
  journalTitle: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.text.primary },
  journalDate: { fontFamily: FontFamily.dmSansRegular, color: Colors.text.tertiary },
  journalNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
  },
  linkTitle: { fontFamily: FontFamily.soraSemiBold, fontSize: FontSize.cardTitleSmall, color: Colors.text.primary },
  linkSub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.secondary, marginTop: 2 },
  unlockBtnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.premium.gold,
  },
});
