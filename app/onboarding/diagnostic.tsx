import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import CompanionAvatar from '../../components/CompanionAvatar';
import DiagnosticSummaryCard from '../../components/onboarding/DiagnosticSummaryCard';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Spacing } from '../../theme/tokens';

export default function DiagnosticScreen() {
  const { t } = useTranslation();
  const setOnboardingDone = useStore((s) => s.setOnboardingDone);

  const handleStartTrial = () => {
    router.push('/onboarding/offer');
  };

  const handleSkip = () => {
    setOnboardingDone(true);
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.companionHeader}>
          <CompanionAvatar
            size={76}
            mood="wisdom"
            message={t('diagnostic.companion_greeting')}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>{t('diagnostic.screen_kicker')}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {t('diagnostic.screen_title')}
          </Text>
          <Text style={styles.sub}>{t('diagnostic.screen_sub')}</Text>
        </View>

        <DiagnosticSummaryCard />
      </ScrollView>

      <View style={styles.footer}>
        <PillButton label={t('diagnostic.cta_start_trial')} onPress={handleStartTrial} />
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} accessibilityRole="button">
          <Text style={styles.skipText}>{t('onboarding.offer_continue_free')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  scroll: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  companionHeader: {
    alignItems: 'center',
    marginTop: 4,
  },
  titleBlock: {
    gap: 6,
  },
  kicker: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  footer: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.card2,
    backgroundColor: Colors.bg.base,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
});
