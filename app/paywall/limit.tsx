import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export default function PaywallLimit() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>⚠️ {t('premium.paywall_limit_banner')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('premium.paywall_limit_title')}</Text>
        <Text style={styles.sub}>{t('premium.paywall_limit_sub')}</Text>

        {['paywall_benefit_1', 'paywall_benefit_2', 'paywall_benefit_3'].map((k) => (
          <View key={k} style={styles.benefitRow}>
            <Text style={styles.benefitCheck}>✓</Text>
            <Text style={styles.benefitText}>{t(`premium.${k}`)}</Text>
          </View>
        ))}

        <View style={styles.priceRow}>
          <Text style={styles.price}>179 Kč</Text>
          <Text style={styles.pricePer}>/ měsíc</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('premium.trial_cta')} onPress={() => router.replace('/paywall/premium')} />
        <TouchableOpacity onPress={() => router.back()} style={styles.stayFree}>
          <Text style={styles.stayFreeText}>{t('premium.stay_free')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  banner: {
    backgroundColor: Colors.premium.gold + '22',
    borderRadius: Radius.chip,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.premium.gold + '50',
  },
  bannerText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.premium.gold,
    textAlign: 'center',
  },
  content: { flex: 1, justifyContent: 'center', gap: 16 },
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
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  benefitCheck: {
    color: Colors.success.green,
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    width: 20,
    textAlign: 'center',
  },
  benefitText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    flex: 1,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, justifyContent: 'center', marginTop: 8 },
  price: { fontFamily: FontFamily.soraBold, fontSize: 36, color: Colors.text.primary },
  pricePer: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.secondary },
  footer: { paddingBottom: 32, gap: 12 },
  stayFree: { alignItems: 'center', paddingVertical: 12 },
  stayFreeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
});
