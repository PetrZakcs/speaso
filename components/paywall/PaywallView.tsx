import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useTranslation } from '../../i18n/useTranslation';
import { FREE_RECORDINGS_LIMIT, FREE_SCENARIOS_LIMIT, useStore, useIsPremium } from '../../state/store';
import { FREE_SITUATIONS, SITUATIONS } from '../../content/situations';
import PillButton from '../../components/PillButton';
import Card from '../../components/Card';
import IconButton from '../../components/IconButton';
import PromoCodeModal from './PromoCodeModal';
import {
  getCurrentOffering, getTrialEligibility, purchase, restorePurchases,
} from '../../lib/purchases';
import { FREE_WEEKLY_LIMIT, extraSessionsThisWeek } from '../../lib/streak';
import { toDateKey } from '../../lib/dates';
import { PRIVACY_URL, TERMS_URL } from '../../lib/links';
import { TRIAL_REMINDER_DAYS } from '../../lib/reminders';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow } from '../../theme/tokens';

export type PaywallContext =
  | 'limit' | 'stats' | 'situation' | 'scenario' | 'recordings' | 'pdf' | 'onboarding' | undefined;
type LoadState = 'loading' | 'ready' | 'unavailable';

const COMPARISON_ROWS = [
  { key: 'panic', free: '✓', premium: '✓' },
  { key: 'plan', free: '✓', premium: '✓' },
  { key: 'scenarios', free: String(FREE_SCENARIOS_LIMIT), premium: '∞' },
  { key: 'weekly', free: String(FREE_WEEKLY_LIMIT), premium: '∞' },
  { key: 'situations', free: String(FREE_SITUATIONS), premium: String(SITUATIONS.length) },
  { key: 'recordings', free: String(FREE_RECORDINGS_LIMIT), premium: '∞' },
  { key: 'stats', free: '—', premium: '✓' },
  { key: 'pdf', free: '—', premium: '✓' },
];

function periodKey(pkg: PurchasesPackage) {
  switch (pkg.packageType) {
    case 'ANNUAL': return 'premium.per_year';
    case 'WEEKLY': return 'premium.per_week';
    default: return 'premium.per_month';
  }
}

async function loadOffer() {
  try {
    const offering = await getCurrentOffering();
    const packages = offering?.availablePackages ?? [];
    if (!offering || packages.length === 0) return null;
    const trialEligible = await getTrialEligibility(packages).catch(() => new Set<string>());
    const defaultPackage = offering.annual ?? offering.monthly ?? packages[0];
    return { offering, defaultPackage, trialEligible };
  } catch {
    return null;
  }
}

function introDays(unit: string, n: number) {
  switch (unit) {
    case 'DAY': return n;
    case 'WEEK': return 7 * n;
    case 'MONTH': return 30 * n;
    default: return 365 * n;
  }
}

/** Free-trial timeline: today → reminder → first charge (the reminder is really scheduled). */
function TrialTimeline({ days, price }: { days: number; price: string }) {
  const { t, tn } = useTranslation();
  const reminderDay = Math.max(1, days - TRIAL_REMINDER_DAYS);
  const steps = [
    { icon: 'lock-open-outline', when: t('premium.tl_today'), what: t('premium.tl_today_what') },
    { icon: 'notifications-outline', when: tn('premium.tl_in_days', reminderDay), what: t('premium.tl_reminder_what') },
    { icon: 'card-outline', when: tn('premium.tl_in_days', days), what: t('premium.tl_charge_what', { price }) },
  ] as const;
  return (
    <View style={styles.timeline}>
      {steps.map((s, i) => (
        <View key={s.icon} style={styles.tlRow}>
          <View style={styles.tlRail}>
            <View style={[styles.tlIcon, i === 0 && styles.tlIconActive]}>
              <Ionicons name={s.icon} size={16} color={i === 0 ? Colors.accent.on : Colors.accent.main} />
            </View>
            {i < steps.length - 1 && <View style={styles.tlLine} />}
          </View>
          <View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? 14 : 0 }}>
            <Text style={styles.tlWhen}>{s.when}</Text>
            <Text style={styles.tlWhat}>{s.what}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

interface Props {
  context?: PaywallContext;
  /** Close / "stay free" — the caller decides where to go. */
  onClose: () => void;
  /** Purchase or restore unlocked Premium. */
  onUnlocked: () => void;
  title?: string;
  tagline?: string;
  /** Text of the bottom "stay free" link. */
  closeLabel?: string;
}

export default function PaywallView({ context, onClose, onUnlocked, title, tagline, closeLabel }: Props) {
  const { t, tn } = useTranslation();
  const isPremium = useIsPremium();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [trialEligible, setTrialEligible] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [promoVisible, setPromoVisible] = useState(false);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadOffer().then((offer) => {
      if (!alive) return;
      if (!offer) {
        setLoadState('unavailable');
        return;
      }
      setOffering(offer.offering);
      setSelected(offer.defaultPackage);
      setTrialEligible(offer.trialEligible);
      setLoadState('ready');
    });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const plans = offering
    ? [offering.annual, offering.monthly].filter((p): p is PurchasesPackage => !!p)
    : [];
  if (offering && plans.length === 0) plans.push(...offering.availablePackages);

  const intro = selected?.product.introPrice;
  const hasTrial = !!selected && !!intro && intro.price === 0 && trialEligible.has(selected.product.identifier);
  const trialLabel = hasTrial && intro
    ? tn(`premium.unit_${intro.periodUnit.toLowerCase()}`, intro.periodNumberOfUnits)
    : '';

  const handlePurchase = async () => {
    if (!selected) return;
    setBusy('purchase');
    try {
      const outcome = await purchase(selected);
      if (outcome === 'success') onUnlocked();
      else if (outcome === 'pending') Alert.alert(t('premium.title'), t('premium.pending'));
    } catch {
      Alert.alert(t('premium.title'), t('premium.error'));
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    setBusy('restore');
    try {
      const restored = await restorePurchases();
      if (restored) onUnlocked();
      else Alert.alert(t('premium.restore'), t('premium.restore_none'));
    } catch {
      Alert.alert(t('premium.restore'), t('premium.unavailable'));
    } finally {
      setBusy(null);
    }
  };

  const contextText =
    context === 'limit'
      ? t('premium.context_limit', { n: extraSessionsThisWeek(useStore.getState().sessions, toDateKey()) })
      : context && context !== 'onboarding'
        ? t(`premium.context_${context}`, { n: FREE_RECORDINGS_LIMIT })
        : null;
  const trialDays = hasTrial && intro ? introDays(intro.periodUnit, intro.periodNumberOfUnits) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <IconButton icon="close" size={36} onPress={onClose} accessibilityLabel={t('common.close')} />

        <Text style={styles.title} accessibilityRole="header">{title ?? t('premium.title')}</Text>
        <Text style={styles.tagline}>{tagline ?? t('premium.tagline')}</Text>

        {contextText && (
          <View style={styles.contextBanner}>
            <Text style={styles.contextText}>{contextText}</Text>
          </View>
        )}

        {/* Free vs Premium */}
        <Card>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{t('premium.table_feature')}</Text>
            <Text style={[styles.tableCellCenter, styles.freeCol]}>{t('premium.table_free')}</Text>
            <Text style={[styles.tableCellCenter, styles.premiumCol]}>{t('common.premium')}</Text>
          </View>
          {COMPARISON_ROWS.map((row, i) => (
            <View key={row.key} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>{t(`premium.feat_${row.key}`)}</Text>
              <Text style={[styles.tableCellCenter, styles.freeCol]}>{row.free}</Text>
              <Text style={[styles.tableCellCenter, styles.premiumCol, styles.premiumVal]}>{row.premium}</Text>
            </View>
          ))}
        </Card>

        {isPremium ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{t('premium.already_premium')}</Text>
          </View>
        ) : loadState === 'loading' ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Colors.text.primary} />
            <Text style={styles.stateText}>{t('premium.loading')}</Text>
          </View>
        ) : loadState === 'unavailable' ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{t('premium.unavailable')}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoadState('loading');
                setAttempt((a) => a + 1);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>{t('premium.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Research Support Mission Banner */}
            <View style={styles.patronCard}>
              <View style={styles.patronBadge}>
                <Ionicons name="sparkles" size={15} color={Colors.premium.main} />
                <Text style={styles.patronBadgeText}>{t('premium.patron_badge')}</Text>
              </View>
              <Text style={styles.patronDesc}>{t('premium.patron_desc')}</Text>
            </View>

            {/* Plans — the billed amount is always the most prominent price. */}
            <View style={styles.plans} accessibilityRole="radiogroup">
              {plans.map((pkg) => {
                const active = selected?.identifier === pkg.identifier;
                const isAnnual = pkg.packageType === 'ANNUAL';
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[styles.plan, active && styles.planActive]}
                    onPress={() => setSelected(pkg)}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>
                        {t(isAnnual ? 'premium.plan_yearly' : 'premium.plan_monthly')}
                      </Text>
                      {isAnnual && pkg.product.pricePerMonthString && (
                        <Text style={styles.planEquiv}>
                          {t('premium.equiv_month', { price: pkg.product.pricePerMonthString })}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.planPrice}>
                      {pkg.product.priceString}
                      <Text style={styles.planPer}> / {t(periodKey(pkg))}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {hasTrial && selected && <TrialTimeline days={trialDays} price={selected.product.priceString} />}

            <PillButton
              label={hasTrial ? t('premium.trial_cta', { trial: trialLabel }) : t('premium.subscribe_cta')}
              onPress={handlePurchase}
              loading={busy === 'purchase'}
              disabled={!selected || busy !== null}
            />
            {selected && (
              <Text style={styles.finePrint}>
                {t(hasTrial ? 'premium.fine_trial' : 'premium.fine', {
                  trial: trialLabel,
                  price: selected.product.priceString,
                  period: t(periodKey(selected)),
                })}
              </Text>
            )}
          </>
        )}

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => setPromoVisible(true)} accessibilityRole="button">
            <Text style={styles.link}>{t('promo.redeem_cta')}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity onPress={handleRestore} disabled={busy !== null} accessibilityRole="button">
            <Text style={styles.link}>{busy === 'restore' ? '…' : t('premium.restore')}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link">
            <Text style={styles.link}>{t('premium.terms')}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link">
            <Text style={styles.link}>{t('premium.privacy')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>{t('settings.disclaimer')}</Text>

        {!isPremium && (
          <TouchableOpacity onPress={onClose} style={styles.stayFree} accessibilityRole="button">
            <Text style={styles.stayFreeText}>{closeLabel ?? t('premium.stay_free')}</Text>
          </TouchableOpacity>
        )}

        <PromoCodeModal
          visible={promoVisible}
          onClose={() => setPromoVisible(false)}
          onSuccess={onUnlocked}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 48, gap: 16 },
  title: {
    fontFamily: FontFamily.heading,
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
  contextBanner: {
    backgroundColor: Colors.premium.main + '18',
    borderColor: Colors.premium.main + '40',
    borderWidth: 1,
    borderRadius: Radius.cardSmall,
    padding: 14,
  },
  contextText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 19,
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
  premiumCol: { color: Colors.premium.main },
  premiumVal: { fontFamily: FontFamily.dmSansBold },
  stateBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  stateText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  patronCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 119, 31, 0.25)',
    gap: 4,
  },
  patronBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patronBadgeText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.premium.main,
  },
  patronDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  plans: { gap: 10 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    padding: 16,
  },
  planActive: { borderColor: Colors.accent.main, backgroundColor: Colors.surface.card2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.accent.main },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent.main },
  planName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  planEquiv: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  planPrice: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  planPer: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  finePrint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  link: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  dot: { color: Colors.text.tertiary },
  timeline: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 18,
  },
  tlRow: { flexDirection: 'row', gap: 14 },
  tlRail: { alignItems: 'center', width: 32 },
  tlIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlIconActive: { backgroundColor: Colors.accent.main },
  tlLine: { flex: 1, width: 2, backgroundColor: Colors.accent.soft, marginVertical: 2 },
  tlWhen: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  tlWhat: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, lineHeight: 19, color: Colors.text.secondary, marginTop: 2 },
  stayFree: { alignItems: 'center', paddingVertical: 4 },
  stayFreeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  disclaimer: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
