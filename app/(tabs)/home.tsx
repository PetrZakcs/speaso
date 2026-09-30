import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import Card from '../../components/Card';
import PanicPulse from '../../components/PanicPulse';
import ProgressBar from '../../components/ProgressBar';
import WeekDots from '../../components/WeekDots';
import { EXERCISES } from '../../content/exercises';
import { addressName, initials } from '../../lib/names';
import {
  FREE_WEEKLY_LIMIT, currentStreak, sessionsThisWeek, weekActivity,
} from '../../lib/streak';
import { useToday } from '../../lib/useToday';
import { useStartExercise } from '../../lib/useStartExercise';
import { Colors, FontFamily, FontSize, Gradients, Radius, Spacing } from '../../theme/tokens';

function greetingKey(hour: number) {
  if (hour < 11) return 'home.greeting_morning';
  if (hour < 18) return 'home.greeting_day';
  return 'home.greeting_evening';
}

function Avatar({ letter, premium }: { letter: string; premium: boolean }) {
  return (
    <View>
      <LinearGradient colors={Gradients.primary} style={styles.avatar}>
        <Text style={styles.avatarText}>{letter}</Text>
      </LinearGradient>
      {premium && (
        <View style={styles.crownBadge}>
          <Text style={{ fontSize: 10 }}>👑</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { t, tn, lang } = useTranslation();
  const today = useToday();
  const startExercise = useStartExercise();
  const { user, isPremium, sessions, streak } = useStore(useShallow((s) => ({
    user: s.user,
    isPremium: s.subscription.isPremium,
    sessions: s.sessions,
    streak: s.streak,
  })));

  const name = addressName(user.name, lang);
  const weekCount = sessionsThisWeek(sessions, today);
  const streakDays = currentStreak(streak, today);
  const activity = useMemo(() => weekActivity(sessions, today), [sessions, today]);
  const minutesToday = useMemo(
    () => Math.round(sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.durationSec, 0) / 60),
    [sessions, today],
  );
  const goalReached = minutesToday >= user.dailyMinutes;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t(greetingKey(new Date().getHours()))}</Text>
            <Text style={styles.greetingName}>
              {name ? t('home.greeting_name', { name }) : t('home.greeting_noname')}
            </Text>
          </View>
          <Avatar letter={initials(user.name)} premium={isPremium} />
        </View>

        {/* Today's goal */}
        <Card style={styles.goalCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{t('home.today_title')}</Text>
            <Text style={styles.goalValue}>
              {goalReached
                ? t('home.today_done')
                : t('home.today_progress', { done: minutesToday, goal: user.dailyMinutes })}
            </Text>
          </View>
          <ProgressBar progress={minutesToday / user.dailyMinutes} />
        </Card>

        {/* Panic hero */}
        <TouchableOpacity
          onPress={() => router.push('/panic')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`${t('home.panic_label')}. ${t('home.panic_caption')}`}
        >
          <LinearGradient colors={[Colors.bg.elevated, Colors.surface.card]} style={styles.panicCard}>
            <View style={styles.panicContent}>
              <Text style={styles.panicTitle}>{t('home.panic_label')}</Text>
              <Text style={styles.panicCaption}>{t('home.panic_caption')}</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>✓ {t('common.free_badge')}</Text>
              </View>
            </View>
            <PanicPulse size={80} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Weekly limit (free only) */}
        {!isPremium && (
          <Card style={styles.weeklyCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{t('home.weekly_title')}</Text>
              <TouchableOpacity onPress={() => router.push('/paywall')} accessibilityRole="button">
                <Text style={styles.goldUpgrade}>👑 Premium</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weeklyBarBg}>
              <View
                style={[
                  styles.weeklyBarFill,
                  { width: `${Math.min(weekCount / FREE_WEEKLY_LIMIT, 1) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.weeklyCount}>
              {Math.min(weekCount, FREE_WEEKLY_LIMIT)}/{FREE_WEEKLY_LIMIT} ·{' '}
              <Text style={styles.weeklyReset}>{t('home.weekly_reset')}</Text>
            </Text>
          </Card>
        )}

        {/* Streak */}
        <Card>
          <Text style={[styles.cardTitle, { marginBottom: 12 }]}>{t('home.streak_title')}</Text>
          <WeekDots activity={activity} today={today} />
          <Text style={styles.streakDays}>
            {streakDays > 0 ? tn('home.streak_days', streakDays) : t('home.streak_start')}
          </Text>
        </Card>

        {/* Exercises */}
        <Text style={styles.sectionHeading}>{t('home.today_exercises')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.exercisesScroll}
          contentContainerStyle={styles.exercisesContent}
        >
          {EXERCISES.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              onPress={() => startExercise(ex.id)}
              activeOpacity={0.8}
              style={styles.exCard}
              accessibilityRole="button"
            >
              <Text style={styles.exIcon}>{ex.emoji}</Text>
              <Text style={styles.exTitle}>{t(`exercises.${ex.id}`)}</Text>
              <Text style={styles.exSub}>{t(`exercises.${ex.id}_sub`)}</Text>
              <Text style={styles.exMins}>{ex.minutes} {t('common.min_short')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 32, gap: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  greeting: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  greetingName: {
    fontFamily: FontFamily.soraBold,
    fontSize: 26,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.soraBold, fontSize: 18, color: Colors.text.primary },
  crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.premium.gold,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  goalCard: { gap: 10 },
  goalValue: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.cyan,
    flexShrink: 1,
    textAlign: 'right',
  },
  panicCard: {
    borderRadius: Radius.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.danger.panic + '40',
    overflow: 'hidden',
  },
  panicContent: { flex: 1, gap: 4 },
  panicTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: 22,
    color: Colors.danger.panic,
    letterSpacing: -0.3,
  },
  panicCaption: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 18,
    maxWidth: 180,
  },
  freeBadge: {
    marginTop: 8,
    backgroundColor: Colors.success.green + '22',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freeBadgeText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 11,
    color: Colors.success.green,
  },
  weeklyCard: { gap: 10 },
  goldUpgrade: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.premium.gold,
  },
  weeklyBarBg: {
    height: 6,
    backgroundColor: Colors.hairline,
    borderRadius: 99,
    overflow: 'hidden',
  },
  weeklyBarFill: {
    height: 6,
    backgroundColor: Colors.premium.gold,
    borderRadius: 99,
  },
  weeklyCount: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  weeklyReset: { color: Colors.text.tertiary },
  sectionHeading: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginTop: 4,
  },
  streakDays: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  exercisesScroll: { marginHorizontal: -Spacing.screenH },
  exercisesContent: { paddingHorizontal: Spacing.screenH, gap: 12 },
  exCard: {
    width: 160,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
    gap: 6,
  },
  exIcon: { fontSize: 36 },
  exTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitleSmall,
    color: Colors.text.primary,
    marginTop: 6,
  },
  exSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  exMins: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
});
