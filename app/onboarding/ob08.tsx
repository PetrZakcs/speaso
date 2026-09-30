import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import OnboardingShell from '../../components/OnboardingShell';
import PillButton from '../../components/PillButton';
import { useStore } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

const FREQ_OPTIONS: { mins: 5 | 15 | 30; icon: string; titleKey: string; subKey: string; recommended?: boolean }[] = [
  { mins: 5, icon: '🌱', titleKey: 'onboarding.freq_5_title', subKey: 'onboarding.freq_5_sub' },
  { mins: 15, icon: '⭐', titleKey: 'onboarding.freq_15_title', subKey: 'onboarding.freq_15_sub', recommended: true },
  { mins: 30, icon: '🔥', titleKey: 'onboarding.freq_30_title', subKey: 'onboarding.freq_30_sub' },
];

export default function OB08() {
  const { t } = useTranslation();
  const setUser = useStore((s) => s.setUser);
  const [selected, setSelected] = useState<5 | 15 | 30>(15);

  const handleContinue = () => {
    setUser({ dailyMinutes: selected });
    router.push('/onboarding/done');
  };

  return (
    <OnboardingShell step={7}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('onboarding.freq_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.freq_sub')}</Text>

        <View style={styles.list}>
          {FREQ_OPTIONS.map((opt) => {
            const active = selected === opt.mins;
            return (
              <TouchableOpacity
                key={opt.mins}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(opt.mins)}
                activeOpacity={0.8}
              >
                <Text style={styles.icon}>{opt.icon}</Text>
                <View style={styles.cardText}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                      {opt.mins} {t('common.min_short')} · {t(opt.titleKey)}
                    </Text>
                    {opt.recommended && (
                      <View style={styles.recBadge}>
                        <Text style={styles.recText}>{t('onboarding.freq_15_title')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardSub}>{t(opt.subKey)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton
          label={t('onboarding.freq_cta')}
          onPress={handleContinue}
          variant="success"
        />
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
  },
  list: { gap: 10, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 18,
  },
  cardActive: {
    borderColor: Colors.primary.blue,
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  icon: { fontSize: 28 },
  cardText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  cardTitleActive: { color: Colors.primary.blue },
  cardSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  recBadge: {
    backgroundColor: Colors.success.green + '22',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    color: Colors.success.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  reminderIcon: { fontSize: 16 },
  reminderText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  footer: { paddingTop: 24 },
});
