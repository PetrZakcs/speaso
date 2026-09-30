import { ScrollView } from 'react-native-gesture-handler';
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, useShallow } from '../../state/store';
import Card from '../../components/Card';
import PanicPulse from '../../components/PanicPulse';
import AiDots from '../../components/AiDots';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

function Avatar({ initials, premium }: { initials: string; premium: boolean }) {
  return (
    <View style={styles.avatarWrap}>
      <LinearGradient colors={['#1741C4', '#2563EB']} style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </LinearGradient>
      {premium && (
        <View style={styles.crownBadge}>
          <Text style={{ fontSize: 10 }}>👑</Text>
        </View>
      )}
    </View>
  );
}

function StreakDots({ weekMap }: { weekMap: boolean[] }) {
  const { t } = useTranslation();
  const days = t('common.weekdays_short') as unknown as string[];
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <View style={styles.streakRow}>
      {weekMap.map((done, i) => (
        <View key={i} style={styles.streakDay}>
          <View
            style={[
              styles.streakDot,
              done && styles.streakDotDone,
              i === todayIdx && styles.streakDotToday,
            ]}
          />
          <Text style={[styles.streakLabel, i === todayIdx && styles.streakLabelToday]}>
            {Array.isArray(days) ? days[i] : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, subscription, usage, streak, progress } = useStore(useShallow((s) => ({
    user: s.user,
    subscription: s.subscription,
    usage: s.usage,
    streak: s.streak,
    progress: s.progress,
  })));

  const isPremium = subscription.tier === 'premium';
  const initials = user.name ? user.name[0].toUpperCase() : 'S';
  const displayName = user.vocative || user.name || 'tě';

  const EXERCISES = [
    { id: 'breathing', icon: '🫁', title: t('exercises.ex_breathing'), sub: t('exercises.ex_breathing_sub'), mins: 8, level: 1, locked: false },
    { id: 'reading', icon: '📖', title: t('exercises.ex_reading'), sub: t('exercises.ex_reading_sub'), mins: 5, level: 2, locked: false },
    { id: 'softstart', icon: '🎙️', title: t('exercises.ex_softstart'), sub: t('exercises.ex_softstart_sub'), mins: 6, level: 2, locked: false },
    { id: 'aicall', icon: '🎭', title: t('exercises.ex_aicall'), sub: t('exercises.ex_aicall_sub'), mins: 10, level: 3, locked: !isPremium },
  ];

  const handleExerciseTap = (ex: typeof EXERCISES[0]) => {
    if (ex.locked) {
      router.push('/paywall/locked-exercise');
      return;
    }
    if (!isPremium && usage.weeklyExercises >= 5) {
      router.push('/paywall/limit');
      return;
    }
    router.push(`/(tabs)/exercises/${ex.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t('home.greeting_morning')}
            </Text>
            <Text style={styles.greetingName}>
              {t('home.greeting_name').replace('{name}', displayName)}
            </Text>
          </View>
          <Avatar initials={initials} premium={isPremium} />
        </View>

        {/* AI Strip */}
        <Card style={styles.aiCard}>
          <View style={styles.aiRow}>
            <AiDots />
            <Text style={styles.aiBadge}>{t('home.ai_badge')}</Text>
          </View>
          <Text style={styles.aiText}>
            {isPremium ? t('home.ai_summary_premium') : t('home.ai_summary_free')}
          </Text>
        </Card>

        {/* Panic Hero */}
        <TouchableOpacity
          onPress={() => router.push('/panic')}
          activeOpacity={0.9}
          accessibilityLabel="Panic button"
        >
          <LinearGradient
            colors={['#0A1628', '#132040']}
            style={styles.panicCard}
          >
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

        {/* Stats / Weekly limit */}
        {isPremium ? (
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statVal}>{streak.days}</Text>
              <Text style={styles.statLabel}>{t('home.stats_streak')}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statVal, { color: Colors.success.green }]}>+24%</Text>
              <Text style={styles.statLabel}>{t('home.stats_fluency')}</Text>
            </Card>
          </View>
        ) : (
          <Card style={styles.weeklyCard}>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyTitle}>{t('home.weekly_title')}</Text>
              <TouchableOpacity onPress={() => router.push('/paywall/premium')}>
                <Text style={styles.goldUpgrade}>👑 Premium</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weeklyBarBg}>
              <View style={[styles.weeklyBarFill, { width: `${(usage.weeklyExercises / 5) * 100}%` }]} />
            </View>
            <Text style={styles.weeklyCount}>
              {usage.weeklyExercises}/5 · <Text style={styles.weeklyReset}>{t('home.weekly_reset')}</Text>
            </Text>
          </Card>
        )}

        {/* Streak */}
        <Card>
          <Text style={styles.sectionTitle}>{t('home.streak_title')}</Text>
          <StreakDots weekMap={streak.weekMap} />
          <Text style={styles.streakDays}>
            {streak.days} dní v řadě
          </Text>
        </Card>

        {/* Exercises */}
        <Text style={styles.sectionHeading}>{t('home.today_exercises')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exercisesScroll}>
          {EXERCISES.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              onPress={() => handleExerciseTap(ex)}
              activeOpacity={0.8}
              style={styles.exCard}
            >
              <View style={styles.exTop}>
                <Text style={styles.exIcon}>{ex.icon}</Text>
                {ex.locked && (
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>👑</Text>
                  </View>
                )}
              </View>
              <Text style={styles.exTitle}>{ex.title}</Text>
              <Text style={styles.exSub}>{ex.sub}</Text>
              <Text style={styles.exMins}>{ex.mins} {t('common.min_short')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Therapist */}
        {isPremium ? (
          <TouchableOpacity onPress={() => router.push('/therapist')} activeOpacity={0.85}>
            <LinearGradient colors={['#8B5CF6', '#6d28d9']} style={styles.therapistCard}>
              <Text style={styles.therapistEmoji}>🩺</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.therapistName}>Mgr. Jana Nováková</Text>
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.therapistLive}>{t('home.therapist_live')}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/paywall/premium')}
            style={styles.therapistLocked}
          >
            <Text style={styles.therapistLockedEmoji}>🩺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.therapistLockedTitle}>{t('home.therapist_locked')}</Text>
              <Text style={styles.therapistLockedSub}>{t('home.therapist_locked_sub')}</Text>
            </View>
            <Text style={styles.goldUpgrade}>👑</Text>
          </TouchableOpacity>
        )}
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
  avatarWrap: { position: 'relative' },
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
  aiCard: { gap: 8 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBadge: {
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
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal: {
    fontFamily: FontFamily.soraBold,
    fontSize: 28,
    color: Colors.text.primary,
  },
  statLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  weeklyCard: { gap: 10 },
  weeklyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
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
  sectionTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginTop: 4,
  },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  streakDay: { alignItems: 'center', gap: 4 },
  streakDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface.card2,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  streakDotDone: { backgroundColor: Colors.primary.blue },
  streakDotToday: {
    backgroundColor: Colors.accent.cyan,
    shadowColor: Colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  streakLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  streakLabelToday: { color: Colors.accent.cyan },
  streakDays: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  exercisesScroll: { marginHorizontal: -Spacing.screenH, paddingLeft: Spacing.screenH },
  exCard: {
    width: 160,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
    marginRight: 12,
    gap: 6,
  },
  exTop: { flexDirection: 'row', justifyContent: 'space-between' },
  exIcon: { fontSize: 36 },
  lockedBadge: {
    backgroundColor: Colors.premium.gold + '22',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadgeText: { fontSize: 12 },
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
  therapistCard: {
    borderRadius: Radius.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  therapistEmoji: { fontSize: 28 },
  therapistName: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success.green,
  },
  therapistLive: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.success.green,
  },
  therapistLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.premium.gold + '60',
    padding: 18,
  },
  therapistLockedEmoji: { fontSize: 28 },
  therapistLockedTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  therapistLockedSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
