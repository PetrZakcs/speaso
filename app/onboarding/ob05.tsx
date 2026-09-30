import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

const DEFAULT_SITUATIONS = [
  'onboarding.sit_phone',
  'onboarding.sit_shop',
  'onboarding.sit_presentation',
  'onboarding.sit_meeting',
  'onboarding.sit_date',
  'onboarding.sit_work',
];

// Fallback labels if keys don't exist in strings
const FALLBACK_CS = ['Telefonát', 'V obchodě', 'Prezentace', 'Pracovní porada', 'Rande', 'Pracovní pohovor'];
const FALLBACK_EN = ['Phone call', 'In a shop', 'Presentation', 'Work meeting', 'Date', 'Job interview'];

export default function OB05() {
  const { t, i18n } = useTranslation();
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const fallbacks = i18n.language === 'cs' ? FALLBACK_CS : FALLBACK_EN;

  const toggle = (sit: string) => {
    if (selected.includes(sit)) {
      setSelected(selected.filter((s) => s !== sit));
    } else if (selected.length < 3) {
      setSelected([...selected, sit]);
    }
  };

  const addCustom = () => {
    if (customText.trim() && selected.length < 3) {
      setSelected([...selected, customText.trim()]);
      setCustomText('');
      setShowCustom(false);
    }
  };

  const handleContinue = () => {
    setUser({ situations: selected });
    router.push('/onboarding/ob06');
  };

  return (
    <OnboardingShell step={4} onBack={() => router.back()}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.situations_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.situations_pick')}</Text>

        <Text style={styles.counter}>
          {t('onboarding.situations_count').replace('{n}', String(selected.length))}
        </Text>

        <View style={styles.chips}>
          {fallbacks.map((label) => {
            const active = selected.includes(label);
            const disabled = !active && selected.length >= 3;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
                onPress={() => toggle(label)}
                disabled={disabled}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}

          {!showCustom ? (
            <TouchableOpacity
              style={styles.chipDashed}
              onPress={() => setShowCustom(true)}
              disabled={selected.length >= 3}
            >
              <Text style={styles.chipDashedText}>＋ {t('onboarding.situations_add')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customText}
                onChangeText={setCustomText}
                placeholder={t('onboarding.situations_add_ph')}
                placeholderTextColor={Colors.text.tertiary}
                autoFocus
                onSubmitEditing={addCustom}
              />
              <TouchableOpacity onPress={addCustom} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('common.continue')} onPress={handleContinue} disabled={selected.length === 0} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 40, gap: 14 },
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
  },
  counter: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.cyan,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  chipActive: {
    borderColor: Colors.primary.blue,
    backgroundColor: Colors.primary.blue + '22',
  },
  chipDisabled: { opacity: 0.4 },
  chipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  chipTextActive: { color: Colors.text.primary },
  chipDashed: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.chip,
    borderWidth: 1.5,
    borderColor: Colors.primary.blue,
    borderStyle: 'dashed',
  },
  chipDashedText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.primary.blue,
  },
  customRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.primary.blue,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: Colors.text.primary, fontSize: 22, lineHeight: 26 },
  footer: { paddingTop: 24 },
});
