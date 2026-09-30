import { ScrollView } from 'react-native-gesture-handler';
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, 
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, useShallow } from '../../state/store';
import PillButton from '../../components/PillButton';
import Card from '../../components/Card';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

const REPORT_ROWS = [
  { labelKey: 'therapist.report_fluent', value: '68%', color: Colors.success.green },
  { labelKey: 'therapist.report_blocks', value: '19%', color: Colors.danger.panic },
  { labelKey: 'therapist.report_repeats', value: '13%', color: Colors.premium.gold },
  { labelKey: 'therapist.report_completed', value: '12', color: Colors.primary.blue },
];

const SHARE_ACTIONS = [
  { icon: '📄', labelKey: 'therapist.share_pdf' },
  { icon: '🔗', labelKey: 'therapist.share_link' },
  { icon: '✉️', labelKey: 'therapist.share_email' },
  { icon: '🎙️', labelKey: 'therapist.share_rec' },
];

export default function TherapistScreen() {
  const { t } = useTranslation();
  const { subscription, therapist } = useStore(useShallow((s) => ({
    subscription: s.subscription,
    therapist: s.therapist,
  })));
  const isPremium = subscription.tier === 'premium';

  // Free → paywall
  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.glowPurple} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.paywallCenter}>
          <Text style={styles.paywallIcon}>🩺</Text>
          <Text style={styles.paywallTitle}>{t('therapist.paywall_title')}</Text>
          <Text style={styles.paywallSub}>{t('therapist.paywall_sub')}</Text>

          {['feat_pdf', 'feat_live', 'feat_rec'].map((k) => (
            <View key={k} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <View>
                <Text style={styles.featureTitle}>{t(`therapist.${k}`)}</Text>
                <Text style={styles.featureSub}>{t(`therapist.${k}_sub`)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <PillButton
            label={t('therapist.unlock_cta') + ' · 299 Kč/měs'}
            onPress={() => router.push('/paywall/premium')}
            variant="purple"
          />
          <Text style={styles.trialNote}>7 {t('premium.post_trial_note').split('7')[1] ?? 'dní zdarma'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Premium — connected or connect
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Portal header */}
        <LinearGradient colors={['#8B5CF6', '#6d28d9']} style={styles.portalHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWhite}>
            <Text style={styles.backTextWhite}>←</Text>
          </TouchableOpacity>
          <Text style={styles.portalTitle}>{t('therapist.portal_title')}</Text>
          <Text style={styles.portalSub}>{t('therapist.portal_sub')}</Text>
        </LinearGradient>

        {/* Connected card */}
        <Card style={styles.connectedCard}>
          <View style={styles.connectedRow}>
            <LinearGradient colors={['#8B5CF6', '#6d28d9']} style={styles.therapistAvatar}>
              <Text style={styles.therapistAvatarText}>JN</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.therapistName}>{therapist?.name ?? 'Mgr. Jana Nováková'}</Text>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('home.therapist_live')}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Report */}
        <Card>
          <View style={styles.reportHeader}>
            <Text style={styles.sectionTitle}>{t('therapist.report_title')}</Text>
            <View style={styles.previewBadge}>
              <Text style={styles.previewText}>{t('therapist.report_preview')}</Text>
            </View>
          </View>
          {REPORT_ROWS.map((row) => (
            <View key={row.labelKey} style={styles.reportRow}>
              <Text style={styles.reportLabel}>{t(row.labelKey)}</Text>
              <View style={styles.reportBar}>
                <View
                  style={[
                    styles.reportBarFill,
                    {
                      width: (row.value.includes('%') ? row.value : '50%') as `${number}%`,
                      backgroundColor: row.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.reportVal, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </Card>

        {/* Share actions */}
        <Text style={styles.shareTitle}>{t('therapist.share_title')}</Text>
        <View style={styles.shareGrid}>
          {SHARE_ACTIONS.map((a) => (
            <TouchableOpacity key={a.labelKey} style={styles.shareCard} activeOpacity={0.8}>
              <Text style={styles.shareIcon}>{a.icon}</Text>
              <Text style={styles.shareLabel}>{t(a.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingBottom: 40, gap: 14 },
  glowPurple: {
    position: 'absolute',
    top: -80,
    left: -40,
    right: -40,
    height: 300,
    backgroundColor: Colors.therapist.purple,
    borderRadius: 999,
    opacity: 0.12,
  },
  backBtn: { paddingHorizontal: Spacing.screenH, paddingTop: 20, paddingBottom: 8 },
  backText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  paywallCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    gap: 16,
  },
  paywallIcon: { fontSize: 80 },
  paywallTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: 22,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  paywallSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    alignSelf: 'stretch',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 14,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.therapist.purple,
    marginTop: 4,
  },
  featureTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  featureSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 32,
    gap: 10,
    alignItems: 'center',
  },
  trialNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  portalHeader: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 8,
  },
  backBtnWhite: { marginBottom: 8 },
  backTextWhite: { color: 'rgba(255,255,255,0.7)', fontSize: 18 },
  portalTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  portalSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: 'rgba(240,246,255,0.7)',
  },
  connectedCard: { gap: 0 },
  connectedRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  therapistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  therapistAvatarText: {
    fontFamily: FontFamily.soraBold,
    fontSize: 18,
    color: Colors.text.primary,
  },
  therapistName: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success.green,
  },
  liveText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.success.green,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  previewBadge: {
    backgroundColor: Colors.therapist.purple + '22',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    color: Colors.therapist.purple,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  reportLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    width: 120,
  },
  reportBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface.card2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  reportBarFill: { height: 6, borderRadius: 3 },
  reportVal: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    width: 36,
    textAlign: 'right',
  },
  shareTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginTop: 4,
  },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shareCard: {
    width: '47%',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareIcon: { fontSize: 24 },
  shareLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    flex: 1,
  },
});
