import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

export default function OB04() {
  const { t } = useTranslation();
  const note = useStore((s) => s.user.note);
  const setUser = useStore((s) => s.setUser);
  const [text, setText] = useState(note);

  const handleContinue = () => {
    setUser({ note: text.trim() });
    router.push('/onboarding/ob05');
  };

  return (
    <OnboardingShell step={3}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.note_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.note_sub')}</Text>

        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={6}
          placeholder={t('onboarding.note_placeholder')}
          maxLength={1000}
          placeholderTextColor={Colors.text.tertiary}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <View style={styles.privacyRow}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>{t('onboarding.note_privacy')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={text.trim() ? t('common.continue') : t('common.skip')} onPress={handleContinue} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 40, gap: 16 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  textarea: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    minHeight: 140,
    lineHeight: 22,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  analyzingText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.cyan,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  privacyIcon: { fontSize: 14 },
  privacyText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  footer: { paddingTop: 24 },
});
