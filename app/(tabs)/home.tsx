import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import ProgressRing from '../../components/ProgressRing';
import WeekDots from '../../components/WeekDots';
import ActivityIcon from '../../components/ActivityIcon';
import CheckInCard from '../../components/CheckInCard';
import { addressName } from '../../lib/names';
import { dailyPlan, doneOn, type PlanItem } from '../../lib/plan';
import { fromDateKey } from '../../lib/dates';
import {
  FREE_WEEKLY_LIMIT, currentStreak, extraSessionsThisWeek, weekActivity,
} from '../../lib/streak';
import { useToday } from '../../lib/useToday';
import { useStartExercise, useStartSituation } from '../../lib/useStartExercise';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing, Tints } from '../../theme/tokens';

function greetingKey(hour: number) {
  if (hour < 11) return 'home.greeting_morning';
  if (hour < 18) return 'home.greeting_day';
  return 'home.greeting_evening';
}

const ROLE_KEYS = ['home.role_warmup', 'home.role_situation', 'home.role_practice'];

export default function HomeScreen() {
  const { t, tn, lang } = useTranslation();
  const today = useToday();
  const startExercise = useStartExercise();
  const startSituation = useStartSituation();
  const { user, isPremium, sessions, streak } = useStore(useShallow((s) => ({
    user: s.user,
    isPremium: s.subscription.isPremium,
    sessions: s.sessions,
    streak: s.streak,
  })));

  const name = addressName(user.name, lang);
  const greeting = t(greetingKey(new Date().getHours()));
  const initial = (user.name.trim()[0] ?? '').toUpperCase();
  const rawDate = fromDateKey(today).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const streakDays = currentStreak(streak, today);
  const activity = useMemo(() => weekActivity(sessions, today), [sessions, today]);
  const plan = useMemo(
    () => dailyPlan(today, user.dailyMinutes, user.situations, isPremium),
    [today, user.dailyMinutes, user.situations, isPremium],
  );
  const done = useMemo(() => doneOn(sessions, today), [sessions, today]);
  const doneCount = plan.filter((i) => done.has(i.activityId)).length;
  const allDone = doneCount === plan.length;
  const left = Math.max(0, FREE_WEEKLY_LIMIT - extraSessionsThisWeek(sessions, today));

  const start = (item: PlanItem) =>
    item.kind === 'exercise' ? startExercise(item.activityId) : startSituation(item.situation);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.date}>{dateLabel}</Text>
            <Text style={styles.hello} accessibilityRole="header">
              {name ? t('home.greeting_comma', { greeting }) : t('home.greeting_noname')}
            </Text>
            {!!name && <Text style={[styles.hello, styles.helloName]}>{name}</Text>}
          </View>
          <View style={styles.headerRight}>
            <View
              style={styles.streakPill}
              accessible
              accessibilityLabel={tn('home.streak_days', streakDays)}
            >
              <Ionicons name="flame" size={15} color={Tints.peach.fg} />
              <Text style={styles.streakNum}>{streakDays}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel={t('home.plan_progress', { done: doneCount, total: plan.length })}
            >
              <ProgressRing progress={doneCount / plan.length} size={52} stroke={3.5}>
                <View style={styles.avatar}>
                  {initial
                    ? <Text style={styles.avatarText}>{initial}</Text>
                    : <Ionicons name="person" size={20} color={Colors.accent.main} />}
                </View>
              </ProgressRing>
            </TouchableOpacity>
          </View>
        </View>

        <CheckInCard today={today} />

        {/* Today's plan — a vertical timeline */}
        <View style={styles.planHead}>
          <Text style={styles.sectionTitle}>{t('home.plan_title')}</Text>
          <Text style={styles.planCount}>
            {t('home.plan_progress', { done: doneCount, total: plan.length })}
          </Text>
        </View>

        <View>
          {plan.map((item, i) => {
            const isDone = done.has(item.activityId);
            const isNext = !isDone && plan.findIndex((p) => !done.has(p.activityId)) === i;
            const isLast = i === plan.length - 1;
            const title = item.kind === 'exercise'
              ? t(`exercises.${item.exercise.id}`)
              : item.situation.content[lang].title;
            const minutes = item.kind === 'exercise' ? item.exercise.minutes : item.situation.minutes;
            const icon = item.kind === 'exercise' ? item.exercise.icon : item.situation.icon;
            const tint = item.kind === 'exercise' ? item.exercise.tint : item.situation.tint;
            return (
              <View key={item.activityId} style={styles.tlRow}>
                <View style={styles.tlRail}>
                  <View style={[styles.node, isDone && styles.nodeDone, isNext && styles.nodeNext]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={14} color={Colors.accent.on} />
                      : <Text style={[styles.nodeText, isNext && styles.nodeTextNext]}>{i + 1}</Text>}
                  </View>
                  {!isLast && <View style={[styles.line, isDone && styles.lineDone]} />}
                </View>
                <TouchableOpacity
                  onPress={() => start(item)}
                  activeOpacity={0.8}
                  style={[styles.tlCard, isDone && styles.tlCardDone]}
                  accessibilityRole="button"
                  accessibilityState={{ checked: isDone }}
                  accessibilityLabel={`${title}, ${t(ROLE_KEYS[i])}, ${minutes} ${t('common.min_short')}${isDone ? `, ${t('home.plan_item_done')}` : ''}`}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.kicker}>{t(ROLE_KEYS[i])}</Text>
                    <Text style={[styles.tlTitle, isDone && styles.tlTitleDone]}>{title}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={13} color={Colors.text.secondary} />
                      <Text style={styles.rowMeta}>{minutes} {t('common.min_short')}</Text>
                    </View>
                  </View>
                  <ActivityIcon name={icon} tint={tint} size={60} muted={isDone} bg={isDone ? undefined : Colors.surface.card} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {allDone && (
          <View style={styles.doneBanner}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.accent.main} />
            <Text style={styles.doneText}>{t('home.plan_done')}</Text>
          </View>
        )}
        {!isPremium && (
          <Text style={styles.limit}>
            {t('home.plan_free')} {tn('home.left_this_week', left)}
          </Text>
        )}

        {/* This week */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{t('home.week_title')}</Text>
            <Text style={styles.cardMeta}>
              {streakDays > 0 ? tn('home.streak_days', streakDays) : t('home.streak_start')}
            </Text>
          </View>
          <WeekDots activity={activity} today={today} />
          <Text style={styles.grace}>{t('home.streak_grace')}</Text>
        </View>

        {/* Panic */}
        <TouchableOpacity
          onPress={() => router.push('/panic')}
          style={styles.panicRow}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <View style={styles.panicIcon}>
            <Ionicons name="pulse" size={22} color={Colors.danger.panic} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{t('home.panic_title')}</Text>
            <Text style={styles.rowMeta}>{t('home.panic_caption')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/exercises')}
          style={styles.moreLink}
          accessibilityRole="link"
        >
          <Text style={styles.moreText}>{t('home.all_exercises_link')}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.accent.main} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 12, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  date: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  hello: {
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.text.primary,
    letterSpacing: -0.8,
  },
  helloName: { color: Colors.accent.main },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    ...Shadow.card,
  },
  streakNum: { fontFamily: FontFamily.soraBold, fontSize: FontSize.body, color: Colors.text.primary },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.soraBold, fontSize: 17, color: Colors.accent.main },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 },
  sectionTitle: { fontFamily: FontFamily.display, fontSize: 22, color: Colors.text.primary, letterSpacing: -0.4 },
  planCount: { fontFamily: FontFamily.dmSansBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  tlRow: { flexDirection: 'row', gap: 12 },
  tlRail: { width: 28, alignItems: 'center' },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface.card,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 34,
  },
  nodeNext: { borderColor: Colors.accent.main, borderWidth: 2 },
  nodeDone: { backgroundColor: Colors.accent.main, borderColor: Colors.accent.main },
  nodeText: { fontFamily: FontFamily.soraBold, fontSize: FontSize.meta, color: Colors.text.tertiary },
  nodeTextNext: { color: Colors.accent.main },
  line: { flex: 1, width: 2, backgroundColor: Colors.hairline, marginTop: 4, marginBottom: -34 },
  lineDone: { backgroundColor: Colors.accent.main },
  tlCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface.mint,
    borderRadius: Radius.card,
    padding: 16,
    paddingLeft: 18,
    marginBottom: 12,
  },
  tlCardDone: { backgroundColor: Colors.surface.card },
  kicker: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.micro + 1,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.accent.main,
  },
  tlTitle: { fontFamily: FontFamily.soraBold, fontSize: 17, lineHeight: 22, color: Colors.text.primary, letterSpacing: -0.2 },
  tlTitleDone: { color: Colors.text.tertiary, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rowTitle: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  rowMeta: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent.soft,
    borderRadius: Radius.cardSmall,
    padding: 12,
  },
  doneText: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  limit: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 14,
    ...Shadow.card,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontFamily: FontFamily.soraBold, fontSize: 17, color: Colors.text.primary },
  cardMeta: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  grace: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.tertiary, marginTop: -6 },
  panicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
  },
  panicIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Colors.danger.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  moreText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.accent.main },
});
