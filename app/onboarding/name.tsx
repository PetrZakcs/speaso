import React, { useState } from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { addressName } from '../../lib/names';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import CompanionAvatar from '../../components/CompanionAvatar';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';

export default function NameStep() {
  const { t, lang } = useTranslation();
  const savedName = useStore((s) => s.user.name);
  const setUser = useStore((s) => s.setUser);
  const [name, setName] = useState(savedName);
  const trimmed = name.trim();
  const greeting = addressName(trimmed, lang);

  const next = () => {
    setUser({ name: trimmed });
    router.push('/onboarding/situations');
  };

  return (
    <OnboardingShell
      step={1}
      title={t('onboarding.name_title')}
      subtitle={t('onboarding.name_sub')}
      footer={
        <PillButton label={trimmed ? t('common.continue') : t('common.skip')} onPress={next} />
      }
    >
      <CompanionAvatar
        size={72}
        mood={trimmed ? 'celebrate' : 'idle'}
        variant="duo"
        style={{ alignSelf: 'center', marginBottom: 16 }}
      />
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.name_placeholder')}
        placeholderTextColor={Colors.text.tertiary}
        autoFocus
        autoCapitalize="words"
        autoComplete="given-name"
        returnKeyType="next"
        maxLength={40}
        onSubmitEditing={next}
        accessibilityLabel={t('onboarding.name_title')}
      />
      {!!trimmed && lang === 'cs' && (
        <Text style={styles.preview}>{t('onboarding.name_preview', { name: greeting })}</Text>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.cardSmall,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 20,
    color: Colors.text.primary,
  },
  preview: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 12,
  },
});
