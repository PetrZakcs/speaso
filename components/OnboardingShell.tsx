import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ProgressBar from './ProgressBar';
import IconButton from './IconButton';
import { useTranslation } from '../i18n/useTranslation';
import { Colors, FontFamily, FontSize, Spacing } from '../theme/tokens';

interface Props {
  step: number; // 1–7
  total?: number;
  onBack?: () => void;
  children: React.ReactNode;
  hideProgress?: boolean;
}

export default function OnboardingShell({ step, total = 7, onBack, children, hideProgress }: Props) {
  const { t } = useTranslation();
  const handleBack = onBack ?? (() => router.back());

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        {!hideProgress && (
          <View style={styles.header}>
            <IconButton icon="arrow-back" onPress={handleBack} accessibilityLabel={t('common.back')} />
            <View style={styles.progressWrap}>
              <ProgressBar progress={step / total} />
            </View>
            <Text style={styles.stepLabel}>{step}/{total}</Text>
          </View>
        )}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  progressWrap: {
    flex: 1,
  },
  stepLabel: {
    color: Colors.text.tertiary,
    fontSize: FontSize.meta,
    fontFamily: FontFamily.dmSansMedium,
    minWidth: 28,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 40,
  },
});
