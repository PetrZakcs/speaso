import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import { dailyPlan } from '../../lib/plan';
import { asGoal } from '../../lib/goals';
import { addressName } from '../../lib/names';
import { formatTime } from '../../lib/reminders';
import { useToday } from '../../lib/useToday';
import ActivityIcon from '../../components/ActivityIcon';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../theme/tokens';

const ROLE_KEYS = ['home.role_warmup', 'home.role_situation', 'home.role_practice'];
type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Plan reveal: the user's real plan for today, built from their answers. */
export default function PlanReveal() {
  const { t, lang } = useTranslation();
  const today = useToday();
  const { user, reminder, isPremium } = useStore(useShallow((s) => ({
    user: s.user,
    reminder: s.reminder,
    isPremium: s.subscription.isPremium,
  })));
  const plan = useMemo(
    () => dailyPlan(today, user.dailyMinutes, user.situations, isPremium),
    [today, user.dailyMinutes, user.situations, isPremium],
  );
  const name = addressName(user.name, lang);
  const goal = asGoal(user.goal);

  const facts: { icon: IconName; text: string }[] = [
    { icon: 'calendar-outline', text: t('onboarding.plan_fact_daily', { n: user.dailyMinutes }) },
    ...(reminder.enabled
      ? [{ icon: 'notifications-outline' as IconName, text: t('onboarding.plan_fact_reminder', { time: formatTime(reminder.hour, reminder.minute) }) }]
      : []),
    { icon: 'heart-outline', text: t('home.plan_free') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>{t('onboarding.plan_kicker')}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {name ? t('onboarding.plan_title_name', { name }) : t('onboarding.plan_title')}
        </Text>
        {goal && <Text style={styles.goal}>{t(`onboarding.goal_${goal}`)}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('onboarding.plan_today')}</Text>
          {plan.map((item, i) => {
            const title = item.kind === 'exercise' ? t(`exercises.${item.exercise.id}`) : item.situation.content[lang].title;
            const minutes = item.kind === 'exercise' ? item.exercise.minutes : item.situation.minutes;
            const icon = item.kind === 'exercise' ? item.exercise.icon : item.situation.icon;
            const tint = item.kind === 'exercise' ? item.exercise.tint : item.situation.tint;
            return (
              <View key={item.activityId} style={styles.row} accessible accessibilityLabel={`${title}, ${t(ROLE_KEYS[i])}`}>
                <ActivityIcon name={icon} tint={tint} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{title}</Text>
                  <Text style={styles.rowMeta}>{t(ROLE_KEYS[i])} · {minutes} {t('common.min_short')}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.facts}>
          {facts.map((f) => (
            <View key={f.icon} style={styles.fact}>
              <Ionicons name={f.icon} size={18} color={Colors.accent.main} />
              <Text style={styles.factText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PillButton label={t('onboarding.plan_cta')} onPress={() => router.push('/onboarding/first-win')} />
        <TouchableOpacity onPress={() => router.push('/onboarding/offer')} style={styles.skip} accessibilityRole="button">
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 32, paddingBottom: 24, gap: 14 },
  kicker: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  goal: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.secondary, marginTop: -6 },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 14,
    marginTop: 8,
    ...Shadow.card,
  },
  cardTitle: { fontFamily: FontFamily.heading, fontSize: 17, color: Colors.text.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowTitle: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  rowMeta: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  facts: { gap: 12, marginTop: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  factText: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.primary },
  footer: { paddingHorizontal: Spacing.screenH, paddingBottom: 12, gap: 4 },
  skip: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.tertiary },
});
