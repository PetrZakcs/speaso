import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import Animated, {
  useSharedValue, withTiming, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import PillButton from '../../components/PillButton';
import Card from '../../components/Card';
import { useStore, useShallow } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export default function OBDone() {
  const { t } = useTranslation();
  const { user, setOnboardingDone } = useStore(useShallow((s) => ({
    user: s.user,
    setOnboardingDone: s.setOnboardingDone,
  })));

  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleOpen = () => {
    setOnboardingDone(true);
    router.replace('/(tabs)/home');
  };

  const GOAL_LABELS: Record<string, string> = {
    fluency: t('onboarding.goal_fluency'),
    confidence: t('onboarding.goal_confidence'),
    situations: t('onboarding.goal_situations'),
    accept: t('onboarding.goal_accept'),
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Animated.View style={[styles.checkWrap, checkStyle]}>
          <Text style={styles.checkEmoji}>✅</Text>
        </Animated.View>

        <Text style={styles.title}>
          {t('onboarding.done_title').replace('{name}', user.name)}
        </Text>
        <Text style={styles.sub}>{t('onboarding.done_sub')}</Text>

        <Card style={styles.summaryCard}>
          {[
            {
              label: t('onboarding.done_goal'),
              value: GOAL_LABELS[user.goal ?? ''] ?? '—',
              icon: '🎯',
            },
            {
              label: t('onboarding.done_daily'),
              value: `${user.dailyMinutes} ${t('common.min_short')}`,
              icon: '⏱️',
            },
            {
              label: t('onboarding.done_therapist'),
              value: t('onboarding.done_therapist_val'),
              icon: '🩺',
            },
            {
              label: t('onboarding.done_panic'),
              value: t('onboarding.done_panic_val'),
              icon: '🆘',
            },
          ].map((row, i) => (
            <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowIcon}>{row.icon}</Text>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('onboarding.done_cta') + ' →'} onPress={handleOpen} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.base,
    paddingHorizontal: Spacing.screenH,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 20,
  },
  checkWrap: {
    shadowColor: Colors.success.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  checkEmoji: { fontSize: 104 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  summaryCard: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  rowIcon: { fontSize: 18, width: 28 },
  rowLabel: {
    flex: 1,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  rowValue: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  footer: { paddingBottom: 32 },
});
