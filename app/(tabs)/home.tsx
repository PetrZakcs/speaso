import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import ProgressBar from '../../components/ProgressBar';
import WeekDots from '../../components/WeekDots';
import ActivityIcon from '../../components/ActivityIcon';
import PillButton from '../../components/PillButton';
import { EXERCISES, getExercise } from '../../content/exercises';
import { addressName } from '../../lib/names';
import { recommend } from '../../lib/recommend';
import {
  FREE_WEEKLY_LIMIT, currentStreak, sessionsThisWeek, weekActivity,
} from '../../lib/streak';
import { useToday } from '../../lib/useToday';
import { useStartExercise, useStartSituation } from '../../lib/useStartExercise';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

function greetingKey(hour: number) {
  if (hour < 11) return 'home.greeting_morning';
  if (hour < 18) return 'home.greeting_day';
  return 'home.greeting_evening';
}

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
  const weekCount = sessionsThisWeek(sessions, today);
  const left = Math.max(0, FREE_WEEKLY_LIMIT - weekCount);
  const streakDays = currentStreak(streak, today);
  const activity = useMemo(() => weekActivity(sessions, today), [sessions, today]);
  const minutesToday = useMemo(
    () => Math.round(sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.durationSec, 0) / 60),
    [sessions, today],
  );
  const pick = useMemo(
    () => recommend(sessions, user.situations, today, isPremium),
    [sessions, user.situations, today, isPremium],
  );

  const next = pick.kind === 'exercise'
    ? (() => {
        const ex = getExercise(pick.id)!;
        return {
          icon: ex.icon,
          title: t(`exercises.${ex.id}`),
          sub: t(`exercises.${ex.id}_sub`),
          minutes: ex.minutes,
          start: () => startExercise(ex.id),
        };
      })()
    : {
        icon: pick.situation.icon,
        title: pick.situation.content[lang].title,
        sub: pick.situation.content[lang].sub,
        minutes: pick.situation.minutes,
        start: () => startSituation(pick.situation),
      };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t(greetingKey(new Date().getHours()))}</Text>
          <Text style={styles.name} accessibilityRole="header">
            {name ? t('home.greeting_name', { name }) : t('home.greeting_noname')}
          </Text>
        </View>

        {/* What now */}
        <View style={styles.nextCard}>
          <Text style={styles.label}>{sessions.length === 0 ? t('home.first_label') : t('home.next_label')}</Text>
          <View style={styles.nextRow}>
            <ActivityIcon name={next.icon} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nextTitle}>{next.title}</Text>
              <Text style={styles.nextSub}>
                {next.sub} · {next.minutes} {t('common.min_short')}
              </Text>
            </View>
          </View>
          <PillButton label={t('home.start')} onPress={next.start} />
          {!isPremium && (
            <Text style={styles.limit}>
              {tn('home.left_this_week', left)}
            </Text>
          )}
        </View>

        {/* This week */}
        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.blockTitle}>{t('home.week_title')}</Text>
            <Text style={styles.blockMeta}>
              {streakDays > 0 ? tn('home.streak_days', streakDays) : t('home.streak_start')}
            </Text>
          </View>
          <WeekDots activity={activity} today={today} />
          <View style={styles.today}>
            <Text style={styles.todayText}>
              {minutesToday >= user.dailyMinutes
                ? t('home.today_done')
                : t('home.today_progress', { done: minutesToday, goal: user.dailyMinutes })}
            </Text>
            <ProgressBar progress={minutesToday / user.dailyMinutes} />
          </View>
        </View>

        {/* Panic */}
        <TouchableOpacity
          onPress={() => router.push('/panic')}
          style={styles.panicRow}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <View style={styles.panicIcon}>
            <Ionicons name="pulse" size={20} color={Colors.danger.panic} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.panicTitle}>{t('home.panic_title')}</Text>
            <Text style={styles.panicSub}>{t('home.panic_caption')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>

        {/* All exercises */}
        <Text style={styles.sectionTitle}>{t('home.all_exercises')}</Text>
        <View style={styles.list}>
          {EXERCISES.map((ex, i) => (
            <TouchableOpacity
              key={ex.id}
              onPress={() => startExercise(ex.id)}
              activeOpacity={0.7}
              style={[styles.listRow, i > 0 && styles.listRowBorder]}
              accessibilityRole="button"
            >
              <ActivityIcon name={ex.icon} size={36} />
              <Text style={styles.listTitle}>{t(`exercises.${ex.id}`)}</Text>
              <Text style={styles.listMeta}>{ex.minutes} {t('common.min_short')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 12, paddingBottom: 40, gap: 20 },
  header: { gap: 2, marginBottom: 4 },
  greeting: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.secondary },
  name: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text.primary,
    letterSpacing: -0.6,
  },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  nextCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 16,
  },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nextTitle: { fontFamily: FontFamily.soraSemiBold, fontSize: 19, color: Colors.text.primary },
  nextSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  limit: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: -6,
  },
  block: { gap: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  blockTitle: { fontFamily: FontFamily.soraSemiBold, fontSize: 17, color: Colors.text.primary },
  blockMeta: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  today: { gap: 8 },
  todayText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  panicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.danger.soft,
  },
  panicIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.danger.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicTitle: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  panicSub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  sectionTitle: { fontFamily: FontFamily.soraSemiBold, fontSize: 17, color: Colors.text.primary, marginBottom: -8 },
  list: { backgroundColor: Colors.surface.card, borderRadius: Radius.card, paddingHorizontal: 14 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  listRowBorder: { borderTopWidth: 1, borderTopColor: Colors.hairline },
  listTitle: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.primary },
  listMeta: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, color: Colors.text.tertiary },
});
