import { ScrollView } from 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, 
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, useShallow } from '../../state/store';
import PillButton from '../../components/PillButton';
import Card from '../../components/Card';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';
import { getOfferings, purchasePackage } from '../../lib/purchases';
import type { PurchasesOffering } from 'react-native-purchases';

type Billing = 'monthly' | 'yearly';

const COMPARISON_ROWS = [
  { key: 'panic', free: '✓', premium: '✓' },
  { key: 'weekly', free: '5', premium: '∞' },
  { key: 'ai_sit', free: '—', premium: '✓' },
  { key: 'stats', free: '—', premium: '✓' },
  { key: 'therapist', free: '—', premium: '✓' },
  { key: 'lockscreen', free: '—', premium: '✓' },
];

export default function PremiumScreen() {
  const { t } = useTranslation();
  const { setSubscription, user } = useStore(useShallow((s) => ({
    setSubscription: s.setSubscription,
    user: s.user,
  })));
  const [billing, setBilling] = useState<Billing>('yearly');
  const [loading, setLoading] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    getOfferings().then(setOffering).catch(() => {});
  }, []);

  const crownY = useSharedValue(0);
  useEffect(() => {
    crownY.value = withRepeat(
      withSequence(withTiming(-7, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
    );
  }, []);
  const crownStyle = useAnimatedStyle(() => ({ transform: [{ translateY: crownY.value }] }));

  const price = billing === 'monthly' ? '299 Kč' : '179 Kč';
  const originalPrice = '299 Kč';

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      // Najdi správný package (monthly / annual)
      const packages = offering?.availablePackages ?? [];
      const pkg = packages.find((p) =>
        billing === 'yearly'
          ? p.packageType === 'ANNUAL'
          : p.packageType === 'MONTHLY',
      ) ?? packages[0];

      if (pkg) {
        const info = await purchasePackage(pkg);
        const active = info.entitlements.active['premium'];
        if (active) {
          setSubscription({ tier: 'premium', trialActive: active.periodType === 'TRIAL' });
          router.replace('/paywall/post-purchase');
          return;
        }
      }
      // Fallback (sandbox / no products yet)
      setSubscription({ tier: 'premium', trialActive: true });
      router.replace('/paywall/post-purchase');
    } catch (e: any) {
      // Uživatel zrušil nákup — tiše ignoruj
      if (e?.userCancelled) { setLoading(false); return; }
      // V sandbox/dev módu fallback na mock
      setSubscription({ tier: 'premium', trialActive: true });
      router.replace('/paywall/post-purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Close */}
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Crown */}
        <View style={styles.crownWrap}>
          <Animated.Text style={[styles.crownEmoji, crownStyle]}>👑</Animated.Text>
        </View>

        <Text style={styles.title}>{t('premium.title')}</Text>
        <Text style={styles.tagline}>{t('premium.tagline')}</Text>

        {/* Billing toggle */}
        <View style={styles.billingToggle}>
          {(['monthly', 'yearly'] as Billing[]).map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.billingChip, billing === b && styles.billingChipActive]}
              onPress={() => setBilling(b)}
            >
              <Text style={[styles.billingText, billing === b && styles.billingTextActive]}>
                {t(`premium.billing_${b}`)}
              </Text>
              {b === 'yearly' && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{t('premium.save_badge')}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Price card */}
        <LinearGradient colors={['#1741C4', '#2563EB']} style={styles.priceCard}>
          <View style={styles.priceRow}>
            {billing === 'yearly' && (
              <Text style={styles.originalPrice}>{originalPrice}</Text>
            )}
            <Text style={styles.price}>{price}</Text>
            <Text style={styles.pricePer}>{t('premium.per_month')}</Text>
          </View>
          {billing === 'yearly' && (
            <Text style={styles.saveYear}>{t('premium.save_year')}</Text>
          )}
        </LinearGradient>

        {/* Comparison table */}
        <Card>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{t('premium.table_feature')}</Text>
            <Text style={[styles.tableCellCenter, styles.freeCol]}>{t('premium.table_free')}</Text>
            <Text style={[styles.tableCellCenter, styles.premiumCol]}>{t('common.premium')}</Text>
          </View>
          {COMPARISON_ROWS.map((row, i) => (
            <View key={row.key} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>{t(`premium.feat_${row.key}`)}</Text>
              <Text style={[styles.tableCellCenter, styles.freeCol, styles.freeVal]}>{row.free}</Text>
              <Text style={[styles.tableCellCenter, styles.premiumCol, styles.premiumVal]}>{row.premium}</Text>
            </View>
          ))}
        </Card>

        {/* Guarantee */}
        <View style={styles.guaranteeRow}>
          <Text style={styles.guaranteeIcon}>🛡️</Text>
          <View>
            <Text style={styles.guaranteeTitle}>{t('premium.guarantee')}</Text>
            <Text style={styles.guaranteeSub}>{t('premium.guarantee_sub')}</Text>
          </View>
        </View>

        {/* Testimonial */}
        <Card style={styles.testimonial}>
          <Text style={styles.testimonialText}>„{t('premium.testimonial')}"</Text>
          <Text style={styles.testimonialAuthor}>{t('premium.testimonial_author')}</Text>
        </Card>

        {/* CTA */}
        <PillButton
          label={t('premium.trial_cta')}
          onPress={handleStartTrial}
          loading={loading}
        />
        <Text style={styles.finePrint}>
          {t('premium.trial_fine').replace('{price}', price)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 48, gap: 16 },
  closeBtn: {
    alignSelf: 'flex-start',
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
  crownWrap: { alignItems: 'center', marginVertical: 8 },
  crownEmoji: { fontSize: 64 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
  },
  billingChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  billingChipActive: { backgroundColor: Colors.primary.blue },
  billingText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  billingTextActive: { color: Colors.text.primary },
  saveBadge: {
    backgroundColor: Colors.success.green,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    color: Colors.text.primary,
  },
  priceCard: {
    borderRadius: Radius.card,
    padding: 22,
    alignItems: 'center',
    gap: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  originalPrice: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    color: 'rgba(240,246,255,0.5)',
    textDecorationLine: 'line-through',
  },
  price: {
    fontFamily: FontFamily.soraBold,
    fontSize: 38,
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  pricePer: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: 'rgba(240,246,255,0.7)',
  },
  saveYear: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.success.green,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    marginBottom: 4,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: Colors.hairline },
  tableCell: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  tableCellCenter: {
    width: 60,
    textAlign: 'center',
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
  },
  freeCol: { color: Colors.text.tertiary },
  premiumCol: { color: Colors.premium.gold },
  freeVal: {},
  premiumVal: { fontFamily: FontFamily.dmSansBold },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
  },
  guaranteeIcon: { fontSize: 28 },
  guaranteeTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  guaranteeSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  testimonial: { gap: 8 },
  testimonialText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  finePrint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
