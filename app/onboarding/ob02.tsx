import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore, useShallow } from '../../state/store';
import { toVocative } from '../../lib/vocative';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export default function OB02() {
  const { t } = useTranslation();
  const { setName, language } = useStore(useShallow((s) => ({ setName: s.setName, language: s.language })));
  const [name, setLocalName] = useState('');
  const caretOpacity = useSharedValue(1);

  useEffect(() => {
    caretOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 550 }), withTiming(1, { duration: 0 })),
      -1,
    );
  }, []);

  const caretStyle = useAnimatedStyle(() => ({ opacity: caretOpacity.value }));

  const vocative = language === 'cs' && name ? toVocative(name) : name;

  const handleContinue = () => {
    if (!name.trim()) return;
    setName(name.trim());
    router.push('/onboarding/ob03');
  };

  return (
    <OnboardingShell step={1} onBack={() => router.back()}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.name_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.name_sub')}</Text>

        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder={t('onboarding.name_placeholder')}
            placeholderTextColor={Colors.text.tertiary}
            value={name}
            onChangeText={setLocalName}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={handleContinue}
          />
          {name.length === 0 && (
            <Animated.View style={[styles.caret, caretStyle]} />
          )}
        </View>

        {name.length > 0 && language === 'cs' && (
          <View style={styles.declNote}>
            <Text style={styles.declText}>
              {name} → <Text style={styles.declHighlight}>{vocative}</Text> 🙂
            </Text>
          </View>
        )}
        {name.length > 0 && language === 'en' && (
          <View style={styles.declNote}>
            <Text style={styles.declText}>{t('onboarding.name_declension')}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <PillButton
          label={t('common.continue')}
          onPress={handleContinue}
          disabled={!name.trim()}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 40, gap: 16 },
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
  inputBox: {
    marginTop: 12,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
    borderColor: Colors.primary.blue,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 22,
    color: Colors.text.primary,
    padding: 0,
  },
  caret: {
    width: 2,
    height: 26,
    backgroundColor: Colors.primary.blue,
    borderRadius: 1,
    marginLeft: 2,
  },
  declNote: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignSelf: 'flex-start',
  },
  declText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  declHighlight: { color: Colors.accent.cyan, fontFamily: FontFamily.dmSansBold },
  footer: { paddingTop: 24 },
});
