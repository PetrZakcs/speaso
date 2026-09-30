import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

type Billing = 'monthly' | 'yearly';

export default function LockedExercise() {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<Billing>('yearly');

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.icon}>🎭</Text>
        <Text style={styles.title}>{t('exercises.ex_aicall')}</Text>
        <Text style={styles.sub}>{t('premium.paywall_locked_ex_sub')}</Text>

        <View style={styles.toggle}>
          {(['monthly', 'yearly'] as Billing[]).map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.toggleChip, billing === b && styles.toggleChipActive]}
              onPress={() => setBilling(b)}
            >
              <Text style={[styles.toggleText, billing === b && styles.toggleTextActive]}>
                {t(`premium.billing_${b}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {['paywall_benefit_1', 'paywall_benefit_2', 'paywall_benefit_3'].map((k) => (
          <View key={k} style={styles.benefit}>
            <Text style={styles.benefitCheck}>✓</Text>
            <Text style={styles.benefitText}>{t(`premium.${k}`)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <PillButton label={t('premium.trial_cta')} onPress={() => router.replace('/paywall/premium')} />
        <Text style={styles.cancelText}>{t('premium.cancel_anytime')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.stayFree}>{t('premium.stay_free')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  closeBtn: {
    alignSelf: 'flex-start',
    marginTop: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.text.primary, fontSize: 14 },
  content: { flex: 1, justifyContent: 'center', gap: 16, alignItems: 'center' },
  icon: { fontSize: 64 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
    alignSelf: 'stretch',
  },
  toggleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  toggleChipActive: { backgroundColor: Colors.primary.blue },
  toggleText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  toggleTextActive: { color: Colors.text.primary },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  benefitCheck: { color: Colors.success.green, fontFamily: FontFamily.dmSansBold, fontSize: FontSize.body },
  benefitText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    flex: 1,
  },
  footer: { paddingBottom: 32, gap: 10, alignItems: 'center' },
  cancelText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  stayFree: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
    paddingVertical: 8,
  },
});
