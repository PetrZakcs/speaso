import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import Card from '../../components/Card';
import MoodChart from '../../components/MoodChart';
import WeekDots from '../../components/WeekDots';
import ProgressRing from '../../components/ProgressRing';
import { averageRating, currentStreak, weekActivity, weekMinutes } from '../../lib/streak';
import { addDays, mondayOf, weekdayIndex } from '../../lib/dates';
import { activityTitle, formatDate } from '../../lib/activities';
import { exportReport } from '../../lib/report';
import PremiumTag from '../../components/PremiumTag';
import { useToday } from '../../lib/useToday';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow, Tints } from '../../theme/tokens';

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
                    backgroundColor: i === todayIdx ? Colors.accent.main : Colors.accent.main,
                  },
                ]}
              />
              <Text style={[styles.barLabel, i === todayIdx && { color: Colors.accent.main }]}>
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
  const { isPremium, streak, sessions, panicUses, recordingsCount, checkIns } = useStore(useShallow((s) => ({
    checkIns: s.checkIns,
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
        <View style={styles.streakHero}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.streakLabel}>{t('progress.current_streak')}</Text>
            <Text style={styles.streakVal}>{tn('progress.streak_value', streakDays)}</Text>
            <Text style={styles.streakLabel}>{t('progress.streak_record', { n: streak.record })}</Text>
          </View>
          {/* Gauge: how close the current streak is to the record. */}
          <ProgressRing
            progress={streak.record ? streakDays / streak.record : 0}
            size={76}
            stroke={7}
            track={Colors.surface.card2}
          >
            <Ionicons name="flame" size={26} color={streakDays ? Tints.peach.fg : Colors.text.tertiary} />
          </ProgressRing>
        </View>

        <MoodChart checkIns={checkIns} today={today} />

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
              <Ionicons name="lock-closed-outline" size={26} color={Colors.text.tertiary} />
              <Text style={styles.lockedTitle}>{t('progress.locked_title')}</Text>
              <Text style={styles.lockedSub}>{t('progress.locked_sub')}</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/paywall', params: { context: 'stats' } })}
                style={styles.unlockBtn}
                accessibilityRole="button"
              >
                <Text style={styles.unlockBtnText}>{t('progress.unlock')}</Text>
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
                  <View style={styles.ratingChip}>
                    <Text style={styles.ratingChipText}>{s.rating}/5</Text>
                  </View>
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
          <Ionicons name="mic-outline" size={22} color={Colors.accent.main} />
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
          <Ionicons name="document-text-outline" size={22} color={Colors.accent.main} />
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t('report.cta')}</Text>
            <Text style={styles.linkSub}>{exporting ? t('report.generating') : t('report.cta_sub')}</Text>
          </View>
          {isPremium ? (
            <Ionicons name="share-outline" size={18} color={Colors.text.tertiary} />
          ) : (
            <PremiumTag />
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
    fontFamily: FontFamily.heading,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  streakHero: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakVal: {
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  streakLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  statNum: {
    fontFamily: FontFamily.heading,
    fontSize: 26,
    color: Colors.text.primary,
  },
  statLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
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
    fontSize: 11,
    color: Colors.text.secondary,
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  lockedContent: { alignItems: 'center', paddingVertical: 16, gap: 10 },
  lockedTitle: {
    fontFamily: FontFamily.heading,
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
    backgroundColor: Colors.accent.main,
    borderRadius: Radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  ratingRow: { flexDirection: 'row', marginBottom: 8 },
  ratingCol: { flex: 1, alignItems: 'center' },
  ratingVal: { fontFamily: FontFamily.heading, fontSize: 28, color: Colors.accent.main },
  ratingPrev: { color: Colors.text.secondary },
  journalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ratingChip: {
    backgroundColor: Colors.accent.soft,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingChipText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.meta, color: Colors.accent.main },
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
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 16,
  },
  linkTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.cardTitleSmall, color: Colors.text.primary },
  linkSub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.secondary, marginTop: 2 },
  unlockBtnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.on,
  },
});
