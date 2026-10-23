import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import VoiceWave from '../../components/brand/VoiceWave';
import { waveCalm, waveCaptionKey } from '../../lib/wave';
import WeekDots from '../../components/WeekDots';
import ActivityIcon from '../../components/ActivityIcon';
import Card from '../../components/Card';
import { PressableRaised } from '../../components/depth/Raised';
import CheckInCard from '../../components/CheckInCard';
import DailyWisdomCard from '../../components/DailyWisdomCard';
import MilestoneModal, { MILESTONE_DAYS } from '../../components/MilestoneModal';
import CommunityPulse from '../../components/CommunityPulse';
import CompanionAvatar from '../../components/CompanionAvatar';
import { addressName } from '../../lib/names';
import { dailyPlan, doneOn, type PlanItem } from '../../lib/plan';
import { fromDateKey } from '../../lib/dates';
import {
  FREE_WEEKLY_LIMIT, currentStreak, extraSessionsThisWeek, weekActivity,
} from '../../lib/streak';
import { useToday } from '../../lib/useToday';
import { useStartExercise, useStartSituation } from '../../lib/useStartExercise';
import { hapticSelect } from '../../lib/haptics';
import { Colors, Depth, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../theme/tokens';

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
  const { user, isPremium, sessions, streak, celebratedMilestones, markMilestoneCelebrated, checkIn } = useStore(useShallow((s) => ({
    user: s.user,
    isPremium: s.subscription.isPremium,
    sessions: s.sessions,
    streak: s.streak,
    celebratedMilestones: s.celebratedMilestones ?? [],
    markMilestoneCelebrated: s.markMilestoneCelebrated,
    checkIn: s.checkIns.find((c) => c.date === today),
  })));

  const name = addressName(user.name, lang);
  const greeting = t(greetingKey(new Date().getHours()));
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
  const calm = waveCalm(streakDays, doneCount / plan.length);
  const left = Math.max(0, FREE_WEEKLY_LIMIT - extraSessionsThisWeek(sessions, today));
  const activeMilestone = MILESTONE_DAYS.find((d) => streakDays >= d && !celebratedMilestones.includes(d));

  const remainingMinutes = useMemo(
    () => plan.filter((i) => !done.has(i.activityId)).reduce((sum, item) => sum + (item.kind === 'exercise' ? item.exercise.minutes : item.situation.minutes), 0),
    [plan, done],
  );

  const start = (item: PlanItem) => {
    hapticSelect();
    if (item.kind === 'exercise') {
      startExercise(item.activityId);
    } else {
      startSituation(item.situation);
    }
  };

  const handlePanic = () => {
    hapticSelect();
    router.push('/panic');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header with Greeting, Streak & Synchronized Companion */}
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.metaBadgeRow}>
              <Text style={styles.date}>{dateLabel}</Text>
              {streakDays > 0 ? (
                <View style={styles.streakPill}>
                  <Text style={styles.streakPillText}>🔥 {tn('home.streak_days', streakDays)}</Text>
                </View>
              ) : (
                <View style={styles.calmPill}>
                  <Text style={styles.calmPillText}>{t('home.calm_today_badge')}</Text>
                </View>
              )}
              {!!checkIn && (
                <View style={styles.moodPill}>
                  <Text style={styles.moodPillText}>🌿 {t(`rating.level_${checkIn.mood}`).toLowerCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.hello} accessibilityRole="header">
              {name ? t('home.greeting_comma', { greeting }) : t('home.greeting_noname')}
            </Text>
            {!!name && <Text style={styles.helloName}>{name}</Text>}
          </View>
          <CompanionAvatar
            size={60}
            mood={allDone ? 'celebrate' : 'idle'}
            onPress={() => router.push('/checkin')}
          />
        </View>

        {/* Motivational Streak Safeguard (VOS style recovery if streak lapsed) */}
        {streakDays === 0 && streak.record > 0 && (
          <View style={styles.streakBrokenCard}>
            <Ionicons name="heart" size={20} color={Colors.accent.main} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.streakBrokenTitle}>{t('home.streak_broken_title')}</Text>
              <Text style={styles.streakBrokenSub}>{t('home.streak_broken_sub')}</Text>
            </View>
          </View>
        )}

        {/* 1. HERO: Dnešní 3-krokový plán plynulosti (Today's Fluency Micro-Plan) */}
        <View style={styles.planSection}>
          <View style={styles.planHead}>
            <View>
              <Text style={styles.sectionTitle}>{t('home.plan_title')}</Text>
              <Text style={styles.planMeta}>
                {allDone
                  ? t('home.today_done')
                  : t('home.today_progress', { done: doneCount * 2, goal: user.dailyMinutes })}
              </Text>
            </View>
            <View style={[styles.progressBadge, allDone && styles.progressBadgeDone]}>
              <Ionicons
                name={allDone ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={allDone ? Colors.accent.main : Colors.text.secondary}
              />
              <Text style={[styles.progressBadgeText, allDone && styles.progressBadgeTextDone]}>
                {allDone ? t('common.done') : t('home.plan_progress', { done: doneCount, total: plan.length })}
                {!allDone && remainingMinutes > 0 ? ` · ${remainingMinutes} ${t('common.min_short')}` : ''}
              </Text>
            </View>
          </View>

          {/* Timeline Cards */}
          <View style={styles.timelineList}>
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
                  {/* Timeline Rail & Step Node */}
                  <View style={styles.tlRail}>
                    <View style={[styles.node, isDone && styles.nodeDone, isNext && styles.nodeNext]}>
                      {isDone ? (
                        <Ionicons name="checkmark" size={14} color={Colors.accent.on} />
                      ) : (
                        <Text style={[styles.nodeText, isNext && styles.nodeTextNext]}>{i + 1}</Text>
                      )}
                    </View>
                    {!isLast && <View style={[styles.line, isDone && styles.lineDone]} />}
                  </View>

                  {/* Tactile Plan Step Card */}
                  <PressableRaised
                    onPress={() => start(item)}
                    style={styles.tlPressable}
                    depth={isDone ? Depth.fill : Depth.tile}
                    ledgeColor={isNext ? '#CBE5D6' : Colors.surface.ledge}
                    radius={Radius.card}
                    faceStyle={[
                      styles.tlCardFace,
                      isNext && styles.tlCardFaceNext,
                      isDone && styles.tlCardFaceDone,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ checked: isDone }}
                    accessibilityLabel={`${title}, ${t(ROLE_KEYS[i])}, ${minutes} ${t('common.min_short')}${isDone ? `, ${t('home.plan_item_done')}` : ''}`}
                  >
                    <View style={styles.tlCardContent}>
                      <View style={styles.stepKickerRow}>
                        <Text style={[styles.kicker, isDone && styles.kickerDone]}>
                          {t('home.step_number', { step: i + 1, role: t(ROLE_KEYS[i]) })}
                        </Text>
                        {isNext && (
                          <View style={styles.nextBadge}>
                            <Text style={styles.nextBadgeText}>{t('home.next_label')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.tlTitle, isDone && styles.tlTitleDone]}>{title}</Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={13} color={Colors.text.secondary} />
                        <Text style={styles.rowMeta}>{minutes} {t('common.min_short')}</Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.rowMeta}>
                          {item.kind === 'exercise' ? t('home.all_exercises') : t('home.role_situation')}
                        </Text>
                      </View>
                    </View>

                    <ActivityIcon
                      name={icon}
                      tint={tint}
                      size={54}
                      muted={isDone}
                      bg={isDone ? undefined : Colors.surface.card}
                    />
                  </PressableRaised>
                </View>
              );
            })}
          </View>

          {allDone && (
            <View style={styles.doneBanner}>
              <Ionicons name="sparkles" size={20} color={Colors.accent.main} />
              <Text style={styles.doneText}>{t('home.plan_done')}</Text>
            </View>
          )}

          {!isPremium && (
            <Text style={styles.limit}>
              {t('home.plan_free')} {tn('home.left_this_week', left)}
            </Text>
          )}
        </View>

        {/* 2. REWARD & EMPATHY: Denní moudro & Somatická výzva (Capybara Mascot) */}
        <DailyWisdomCard today={today} />

        {/* 3. AWARENESS: Denní check-in napětí & hlasové pohody */}
        <CheckInCard today={today} />

        {/* 4. PRE-CALL BOOSTER: Rychlé zklidnění hlasivek & dechu */}
        <PressableRaised
          onPress={handlePanic}
          depth={Depth.card}
          ledgeColor={Colors.brand.soft}
          radius={Radius.card}
          faceStyle={styles.sosFace}
          accessibilityRole="button"
          accessibilityLabel={`${t('home.sos_quick')}. ${t('home.sos_quick_sub')}`}
        >
          <View style={styles.sosCardInner}>
            <View style={styles.sosTopRow}>
              <View style={styles.sosTagRow}>
                <Ionicons name="sparkles" size={13} color={Colors.brand.main} />
                <Text style={styles.sosKicker}>{t('home.sos_kicker')}</Text>
              </View>
              <View style={styles.freeChip}>
                <Text style={styles.freeChipText}>{t('common.free_badge')}</Text>
              </View>
            </View>

            <View style={styles.sosMainRow}>
              <View style={styles.sosIconWrap}>
                <Ionicons name="pulse" size={22} color={Colors.brand.main} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.sosTitle}>{t('home.sos_quick')}</Text>
                <Text style={styles.sosSub}>{t('home.sos_quick_sub')}</Text>
              </View>
            </View>

            <View style={styles.sosBottomRow}>
              <View style={styles.sosActionPill}>
                <Ionicons name="play" size={12} color="#FFFFFF" />
                <Text style={styles.sosActionText}>{t('home.sos_action')}</Text>
              </View>
            </View>
          </View>
        </PressableRaised>

        {/* 5. CONTINUITY: Hlasová stabilita & Týdenní pokrok (Voice Wave + Consistency) */}
        <Card
          style={styles.stabilityCard}
          accessible
          accessibilityLabel={`${t('home.stability_title')}. ${tn('home.streak_days', streakDays)}. ${t(waveCaptionKey(calm))}`}
        >
          <View style={styles.stabilityHead}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.stabilityTitle}>{t('home.stability_title')}</Text>
              <Text style={styles.stabilityCaption}>{t(waveCaptionKey(calm))}</Text>
            </View>
            <View style={styles.waveStreakBadge}>
              <Ionicons name="trending-up" size={14} color={Colors.brand.main} />
              <Text style={styles.waveStreakText}>
                {streakDays > 0 ? tn('home.streak_days', streakDays) : t('home.streak_start')}
              </Text>
            </View>
          </View>

          <VoiceWave calm={calm} height={68} style={{ marginVertical: 6 }} />

          <View style={styles.divider} />

          <View style={styles.weekSection}>
            <View style={styles.weekHead}>
              <Text style={styles.weekTitle}>{t('home.week_title')}</Text>
              <Text style={styles.grace}>{t('home.streak_grace')}</Text>
            </View>
            <WeekDots activity={activity} today={today} />
          </View>
        </Card>

        {/* 6. COMMUNITY & EXPLORE: Sounáležitost a knihovna */}
        <CommunityPulse />

        {/* Explore all exercises link */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/exercises')}
          style={styles.moreLink}
          accessibilityRole="link"
        >
          <Text style={styles.moreText}>{t('home.all_exercises_link')}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.accent.main} />
        </TouchableOpacity>
      </ScrollView>

      {!!activeMilestone && (
        <MilestoneModal
          visible={true}
          days={activeMilestone}
          onDismiss={() => markMilestoneCelebrated(activeMilestone)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 10, paddingBottom: 100, gap: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 2 },
  metaBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  date: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  streakPill: {
    backgroundColor: Colors.brand.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  streakPillText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.micro,
    color: Colors.brand.on,
  },
  calmPill: {
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  calmPillText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.micro,
    color: Colors.accent.main,
  },
  moodPill: {
    backgroundColor: 'rgba(44, 86, 65, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  moodPillText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.micro,
    color: Colors.accent.main,
  },
  hello: {
    fontFamily: FontFamily.heading,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  helloName: {
    fontFamily: FontFamily.headingSemiBoldItalic,
    fontSize: 34,
    lineHeight: 40,
    color: Colors.accent.main,
    letterSpacing: -0.5,
  },

  // STĚŽEJNÍ BOD 4: Pre-Call Booster / Quick Vocal Relief Card
  sosFace: {
    backgroundColor: '#FFFBF7',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 79, 0.18)',
    boxShadow: Shadow.rim,
    padding: 16,
  },
  sosCardInner: {
    gap: 10,
  },
  sosTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sosPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.main,
  },
  sosKicker: {
    fontFamily: FontFamily.headingItalic,
    fontSize: 13,
    color: Colors.brand.main,
  },
  freeChip: {
    backgroundColor: 'rgba(224, 122, 79, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  freeChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 11,
    color: Colors.brand.main,
  },
  sosMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sosIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDE4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 18,
    lineHeight: 22,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sosSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  sosBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  sosActionPill: {
    backgroundColor: Colors.brand.main,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sosActionText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Plan Section
  planSection: { gap: 12 },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FontFamily.heading, fontSize: 22, color: Colors.text.primary, letterSpacing: -0.4 },
  planMeta: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, color: Colors.text.tertiary, marginTop: 1 },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  progressBadgeDone: {
    backgroundColor: Colors.accent.soft,
    borderColor: 'rgba(46, 125, 87, 0.25)',
  },
  progressBadgeText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.meta, color: Colors.text.secondary },
  progressBadgeTextDone: { color: Colors.accent.main },

  // Timeline list & cards
  timelineList: { gap: 10 },
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
    marginTop: 26,
  },
  nodeNext: {
    borderColor: Colors.accent.main,
    borderWidth: 2,
    backgroundColor: Colors.accent.soft,
  },
  nodeDone: {
    backgroundColor: Colors.accent.main,
    borderColor: Colors.accent.main,
  },
  nodeText: { fontFamily: FontFamily.heading, fontSize: FontSize.meta, color: Colors.text.tertiary },
  nodeTextNext: { color: Colors.accent.main, fontFamily: FontFamily.headingBold },
  line: { flex: 1, width: 2, backgroundColor: Colors.hairline, marginTop: 4, marginBottom: -26 },
  lineDone: { backgroundColor: Colors.accent.main },

  tlPressable: {
    flex: 1,
  },
  tlCardFace: {
    backgroundColor: Colors.surface.card,
    boxShadow: Shadow.rim,
    padding: 16,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tlCardContent: {
    flex: 1,
    gap: 4,
  },
  tlCardFaceNext: {
    backgroundColor: '#EDF7F1',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 87, 0.20)',
  },
  tlCardFaceDone: {
    backgroundColor: '#F8FAF9',
  },
  stepKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    fontFamily: FontFamily.headingItalic,
    fontSize: 13,
    color: Colors.accent.main,
  },
  kickerDone: {
    color: Colors.text.tertiary,
  },
  nextBadge: {
    backgroundColor: Colors.accent.main,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  nextBadgeText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tlTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 17,
    lineHeight: 22,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  tlTitleDone: {
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  rowMeta: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.meta, color: Colors.text.secondary },
  metaDot: { color: Colors.text.tertiary, fontSize: FontSize.meta },

  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.accent.soft,
    borderRadius: Radius.cardSmall,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 87, 0.2)',
  },
  doneText: {
    flex: 1,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
    lineHeight: 18,
  },
  limit: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },

  // STĚŽEJNÍ BOD 4: Unified Stability & Consistency Card
  stabilityCard: {
    padding: 18,
    gap: 12,
  },
  stabilityHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  stabilityTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 18,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  stabilityCaption: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  waveStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  waveStreakText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.brand.on,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.hairline,
    marginVertical: 2,
  },
  weekSection: { gap: 10 },
  weekHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  weekTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 16,
    color: Colors.text.primary,
  },
  grace: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },

  // Misc
  moreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  moreText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.body,
    color: Colors.accent.main,
  },
  streakBrokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(237, 137, 54, 0.08)',
    borderColor: 'rgba(237, 137, 54, 0.25)',
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 14,
  },
  streakBrokenTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  streakBrokenSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
