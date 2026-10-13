import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconButton from './IconButton';
import { useTranslation } from '../i18n/useTranslation';
import { Colors, FontFamily, FontSize, Spacing } from '../theme/tokens';

export const ONBOARDING_STEPS = 5;

interface Props {
  /** 1-based step after the welcome screen. */
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pinned to the bottom (primary action). */
  footer: React.ReactNode;
}

/** Shared layout: back button, segmented progress, left-aligned title, pinned footer. */
export default function OnboardingShell({ step, title, subtitle, children, footer }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.header}>
          <IconButton icon="chevron-back" size={36} onPress={() => router.back()} accessibilityLabel={t('common.back')} />
          <View
            style={styles.segments}
            accessible
            accessibilityLabel={t('onboarding.step_of', { n: step, total: ONBOARDING_STEPS })}
          >
            {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
              <View key={i} style={[styles.segment, i < step && styles.segmentDone]} />
            ))}
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 8,
    gap: 16,
  },
  segments: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.surface.card2 },
  segmentDone: { backgroundColor: Colors.accent.main },
  content: { paddingHorizontal: Spacing.screenH, paddingTop: 36, paddingBottom: 24 },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.text.primary,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    lineHeight: 22,
    color: Colors.text.secondary,
    marginTop: 10,
  },
  body: { marginTop: 28 },
  footer: { paddingHorizontal: Spacing.screenH, paddingBottom: 12, paddingTop: 8, gap: 4 },
});
