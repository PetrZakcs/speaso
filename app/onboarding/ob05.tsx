import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

// Stored as ids; custom situations are stored as the user's own text.
const SITUATION_IDS = ['phone', 'shop', 'presentation', 'meeting', 'date', 'interview'];

export default function OB05() {
  const { t } = useTranslation();
  const setUser = useStore((s) => s.setUser);
  const saved = useStore((s) => s.user.situations);
  const [selected, setSelected] = useState<string[]>(saved);
  const custom = selected.filter((s) => !SITUATION_IDS.includes(s));
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const toggle = (sit: string) => {
    if (selected.includes(sit)) {
      setSelected(selected.filter((s) => s !== sit));
    } else if (selected.length < 3) {
      setSelected([...selected, sit]);
    }
  };

  const addCustom = () => {
    const text = customText.trim();
    if (text && selected.length < 3 && !selected.includes(text)) {
      setSelected([...selected, text]);
      setCustomText('');
      setShowCustom(false);
    }
  };

  const handleContinue = () => {
    setUser({ situations: selected });
    router.push('/onboarding/ob06');
  };

  return (
    <OnboardingShell step={4}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.situations_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.situations_pick')}</Text>

        <Text style={styles.counter}>
          {t('onboarding.situations_count', { n: selected.length })}
        </Text>

        <View style={styles.chips}>
          {[...SITUATION_IDS, ...custom].map((id) => {
            const label = SITUATION_IDS.includes(id) ? t(`onboarding.sit_${id}`) : id;
            const active = selected.includes(id);
            const disabled = !active && selected.length >= 3;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
                onPress={() => toggle(id)}
                disabled={disabled}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active, disabled }}
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
