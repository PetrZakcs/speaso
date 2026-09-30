import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import ProgressBar from './ProgressBar';
import { Colors, FontFamily, FontSize, Spacing } from '../theme/tokens';

interface Props {
  step: number; // 1–8
  total?: number;
  onBack?: () => void;
  children: React.ReactNode;
  hideProgress?: boolean;
}

export default function OnboardingShell({ step, total = 8, onBack, children, hideProgress }: Props) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        {!hideProgress && (
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityLabel="Zpět">
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: Colors.text.primary,
    fontSize: 18,
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
