import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';
import type { AgeGroup } from '../../state/store';

const AGE_OPTIONS: { id: AgeGroup; emoji: string; tagKey: string }[] = [
  { id: 'child', emoji: '👦', tagKey: 'onboarding.age_tag_play' },
  { id: 'teen', emoji: '🧑', tagKey: 'onboarding.age_tag_nopressure' },
  { id: 'adult', emoji: '👨', tagKey: 'onboarding.age_tag_pro' },
  { id: 'senior', emoji: '👴', tagKey: 'onboarding.age_tag_calm' },
];

export default function OB03() {
  const { t } = useTranslation();
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<AgeGroup | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setUser({ ageGroup: selected });
    router.push('/onboarding/ob04');
  };

  return (
    <OnboardingShell step={2}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.age_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.age_sub')}</Text>

        <View style={styles.grid}>
          {AGE_OPTIONS.map((opt) => {
            const active = selected === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(opt.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <Text style={[styles.label, active && styles.labelActive]}>
                  {t(`onboarding.age_${opt.id}`)}
                </Text>
                <View style={[styles.tag, active && styles.tagActive]}>
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {t(opt.tagKey)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('common.continue')} onPress={handleContinue} disabled={!selected} />
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
  grid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.surface.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  cardActive: {
    borderColor: Colors.primary.blue,
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  emoji: { fontSize: 36 },
  label: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  labelActive: { color: Colors.primary.blue },
  tag: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagActive: { backgroundColor: Colors.success.green + '22' },
  tagText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.micro,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagTextActive: { color: Colors.success.green },
  footer: { paddingTop: 24 },
});
