import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { submitAnswers } from '../../lib/answers';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import { initials } from '../../lib/names';
import { BETA_ALL_ACCESS } from '../../lib/beta';
import { manageSubscription, restorePurchases } from '../../lib/purchases';
import { PRIVACY_URL, TERMS_URL } from '../../lib/links';
import {
  REMINDER_TIMES,
  MORNING_REMINDER_TIMES,
  STREAK_REMINDER_TIMES,
  enableReminder,
  updateReminderSettings,
  formatTime,
} from '../../lib/reminders';
import PromoCodeModal from '../../components/paywall/PromoCodeModal';
import TherapistConnectModal from '../../components/TherapistConnectModal';
import ReminderTimeModal from '../../components/ReminderTimeModal';
import ReferralShareModal from '../../components/ReferralShareModal';
import ZeroCloudBadge from '../../components/ZeroCloudBadge';
import { authenticateWithBiometrics, checkBiometricsAvailability } from '../../lib/biometrics';
import { exportReport } from '../../lib/report';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow } from '../../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function SettingRow({
  icon, label, value, onPress,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <Ionicons name={icon} size={18} color={Colors.text.secondary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {!!value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t, lang } = useTranslation();
  const [restoring, setRestoring] = useState(false);
  const [promoVisible, setPromoVisible] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [therapistModalVisible, setTherapistModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState<'practice' | 'morning' | 'streak' | null>(null);
  const {
    name, subscription, language, setLanguage, reminder, shareAnswers, setUser, therapistName,
    biometricsEnabled, setBiometricsEnabled,
  } = useStore(useShallow((s) => ({
    name: s.user.name,
    subscription: s.subscription,
    language: s.language,
    setLanguage: s.setLanguage,
    reminder: s.reminder,
    shareAnswers: s.user.shareAnswers,
    setUser: s.setUser,
    therapistName: s.user.therapistName,
    biometricsEnabled: s.biometricsEnabled,
    setBiometricsEnabled: s.setBiometricsEnabled,
  })));

  const toggleBiometrics = async (on: boolean) => {
    if (on) {
      const avail = await checkBiometricsAvailability();
      if (!avail.hasHardware || !avail.isEnrolled) {
        Alert.alert(t('settings.biometrics_unavailable_title'), t('settings.biometrics_unavailable_body'));
        return;
      }
      const ok = await authenticateWithBiometrics(t('biometrics.enroll_prompt'));
      if (ok) {
        setBiometricsEnabled(true);
      }
    } else {
      const ok = await authenticateWithBiometrics(t('biometrics.disable_prompt'));
      if (ok) {
        setBiometricsEnabled(false);
      }
    }
  };

  const showPermissionAlert = () => {
    Alert.alert(t('reminders.denied_title'), t('reminders.denied_body'), [
      { text: t('common.close'), style: 'cancel' },
      { text: t('recorder.open_settings'), onPress: () => Linking.openSettings() },
    ]);
  };

  const togglePractice = async (on: boolean) => {
    if (!on) {
      updateReminderSettings({ enabled: false });
      return;
    }
    const ok = await enableReminder(reminder.hour, reminder.minute);
    if (!ok) showPermissionAlert();
  };

  const toggleMorning = async (on: boolean) => {
    if (!on) {
      updateReminderSettings({ morningEnabled: false });
      return;
    }
    const ok = await updateReminderSettings({
      morningEnabled: true,
      morningHour: reminder.morningHour ?? 8,
      morningMinute: reminder.morningMinute ?? 0,
    });
    if (!ok) showPermissionAlert();
  };

  const toggleStreak = async (on: boolean) => {
    if (!on) {
      updateReminderSettings({ streakSaverEnabled: false });
      return;
    }
    const ok = await updateReminderSettings({
      streakSaverEnabled: true,
      streakSaverHour: reminder.streakSaverHour ?? 20,
      streakSaverMinute: reminder.streakSaverMinute ?? 30,
    });
    if (!ok) showPermissionAlert();
  };
  const version = Constants.expoConfig?.version ?? '—';

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      Alert.alert(t('settings.restore'), t(restored ? 'premium.restore_success' : 'premium.restore_none'));
    } catch {
      Alert.alert(t('settings.restore'), t('premium.unavailable'));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle} accessibilityRole="header">{t('settings.title')}</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{name || t('settings.default_name')}</Text>
            {subscription.isPremium ? (
              <Text style={[styles.planLabel, { color: Colors.premium.main }]}>
                {BETA_ALL_ACCESS
                  ? t('settings.plan_beta')
                  : t(subscription.isTrial ? 'settings.plan_trial' : 'settings.plan_premium')}
              </Text>
            ) : (
              <TouchableOpacity onPress={() => router.push('/paywall')} accessibilityRole="button">
                <Text style={[styles.planLabel, { color: Colors.premium.main }]}>{t('settings.plan_free')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* App */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.section_app')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="globe-outline"
              label={t('settings.language')}
              value={language === 'cs' ? 'Čeština' : 'English'}
              onPress={() => setLanguage(language === 'cs' ? 'en' : 'cs')}
            />
          </View>
        </View>

        {/* Reminders & Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('reminders.section')}</Text>
          <View style={styles.sectionCard}>
            {/* 1. Daily Practice */}
            <View style={styles.slotBlock}>
              <View style={styles.slotHeader}>
                <Ionicons name="fitness-outline" size={18} color={Colors.accent.main} style={styles.rowIcon} />
                <View style={styles.slotTextGroup}>
                  <Text style={styles.rowLabel}>{t('reminders.daily')}</Text>
                  <Text style={styles.rowSubLabel}>{t('reminders.daily_sub')}</Text>
                </View>
                <Switch
                  value={reminder.enabled}
                  onValueChange={togglePractice}
                  trackColor={{ false: Colors.text.tertiary, true: Colors.accent.main }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={t('reminders.daily')}
                />
              </View>
              {reminder.enabled && (
                <View style={styles.timeRow} accessibilityRole="radiogroup">
                  {REMINDER_TIMES.map((time) => {
                    const active = time.hour === reminder.hour && time.minute === reminder.minute;
                    return (
                      <TouchableOpacity
                        key={`${time.hour}:${time.minute}`}
                        onPress={() => updateReminderSettings({ hour: time.hour, minute: time.minute })}
                        style={[styles.timeChip, active && styles.timeChipActive]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                      >
                        <Text style={[styles.timeText, active && styles.timeTextActive]}>
                          {formatTime(time.hour, time.minute)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setEditingSlot('practice')}
                    style={styles.customTimeChip}
                    accessibilityRole="button"
                  >
                    <Ionicons name="time-outline" size={14} color={Colors.accent.main} />
                    <Text style={styles.customTimeChipText}>
                      {formatTime(reminder.hour, reminder.minute)} ✏️
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* 2. Morning Check-in */}
            <View style={styles.slotBlock}>
              <View style={styles.slotHeader}>
                <Ionicons name="sunny-outline" size={18} color={Colors.brand.main} style={styles.rowIcon} />
                <View style={styles.slotTextGroup}>
                  <Text style={styles.rowLabel}>{t('reminders.morning')}</Text>
                  <Text style={styles.rowSubLabel}>{t('reminders.morning_sub')}</Text>
                </View>
                <Switch
                  value={reminder.morningEnabled ?? false}
                  onValueChange={toggleMorning}
                  trackColor={{ false: Colors.text.tertiary, true: Colors.accent.main }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={t('reminders.morning')}
                />
              </View>
              {reminder.morningEnabled && (
                <View style={styles.timeRow} accessibilityRole="radiogroup">
                  {MORNING_REMINDER_TIMES.map((time) => {
                    const active =
                      time.hour === (reminder.morningHour ?? 8) &&
                      time.minute === (reminder.morningMinute ?? 0);
                    return (
                      <TouchableOpacity
                        key={`${time.hour}:${time.minute}`}
                        onPress={() =>
                          updateReminderSettings({ morningHour: time.hour, morningMinute: time.minute })
                        }
                        style={[styles.timeChip, active && styles.timeChipActive]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                      >
                        <Text style={[styles.timeText, active && styles.timeTextActive]}>
                          {formatTime(time.hour, time.minute)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setEditingSlot('morning')}
                    style={styles.customTimeChip}
                    accessibilityRole="button"
                  >
                    <Ionicons name="time-outline" size={14} color={Colors.accent.main} />
                    <Text style={styles.customTimeChipText}>
                      {formatTime(reminder.morningHour ?? 8, reminder.morningMinute ?? 0)} ✏️
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* 3. Streak Saver */}
            <View style={styles.slotBlock}>
              <View style={styles.slotHeader}>
                <Ionicons name="flame-outline" size={18} color={Colors.danger.panic} style={styles.rowIcon} />
                <View style={styles.slotTextGroup}>
                  <Text style={styles.rowLabel}>{t('reminders.streak')}</Text>
                  <Text style={styles.rowSubLabel}>{t('reminders.streak_sub')}</Text>
                </View>
                <Switch
                  value={reminder.streakSaverEnabled ?? false}
                  onValueChange={toggleStreak}
                  trackColor={{ false: Colors.text.tertiary, true: Colors.accent.main }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={t('reminders.streak')}
                />
              </View>
              {reminder.streakSaverEnabled && (
                <View style={styles.timeRow} accessibilityRole="radiogroup">
                  {STREAK_REMINDER_TIMES.map((time) => {
                    const active =
                      time.hour === (reminder.streakSaverHour ?? 20) &&
                      time.minute === (reminder.streakSaverMinute ?? 30);
                    return (
                      <TouchableOpacity
                        key={`${time.hour}:${time.minute}`}
                        onPress={() =>
                          updateReminderSettings({
                            streakSaverHour: time.hour,
                            streakSaverMinute: time.minute,
                          })
                        }
                        style={[styles.timeChip, active && styles.timeChipActive]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                      >
                        <Text style={[styles.timeText, active && styles.timeTextActive]}>
                          {formatTime(time.hour, time.minute)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setEditingSlot('streak')}
                    style={styles.customTimeChip}
                    accessibilityRole="button"
                  >
                    <Ionicons name="time-outline" size={14} color={Colors.accent.main} />
                    <Text style={styles.customTimeChipText}>
                      {formatTime(reminder.streakSaverHour ?? 20, reminder.streakSaverMinute ?? 30)} ✏️
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.section_privacy')}</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <Ionicons name="scan-outline" size={18} color={Colors.text.secondary} style={styles.rowIcon} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowLabel}>{t('settings.biometrics_lock')}</Text>
                <Text style={styles.rowSubLabel}>{t('settings.biometrics_lock_sub')}</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={toggleBiometrics}
                trackColor={{ false: Colors.text.tertiary, true: Colors.accent.main }}
                thumbColor="#FFFFFF"
                accessibilityLabel={t('settings.biometrics_lock')}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Ionicons name="paper-plane-outline" size={18} color={Colors.text.secondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{t('settings.share_answers')}</Text>
              <Switch
                value={shareAnswers}
                onValueChange={(on) => {
                  setUser({ shareAnswers: on });
                  if (on) submitAnswers();
                  else useStore.getState().setAnswersPending(false);
                }}
                trackColor={{ false: Colors.text.tertiary, true: Colors.accent.main }}
                thumbColor="#FFFFFF"
                accessibilityLabel={t('settings.share_answers')}
              />
            </View>
          </View>
          <Text style={styles.sectionHint}>{t('settings.share_answers_hint')}</Text>

          <ZeroCloudBadge style={{ marginTop: 12 }} />
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.section_subscription')}</Text>
          <View style={styles.sectionCard}>
            {subscription.isPremium && (
              <>
                <SettingRow icon="card-outline" label={t('settings.manage_sub')} onPress={manageSubscription} />
                <View style={styles.divider} />
              </>
            )}
            <SettingRow
              icon="heart-outline"
              label={t('referral.gift_row')}
              value="30 dní zdarma"
              onPress={() => setReferralModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="gift-outline"
              label={t('settings.promo_code')}
              onPress={() => setPromoVisible(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="refresh-outline"
              label={t('settings.restore')}
              value={restoring ? '…' : undefined}
              onPress={restoring ? undefined : handleRestore}
            />
          </View>
        </View>

        {/* Speech Therapist Collaboration */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.section_therapist')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="link-outline"
              label={t('settings.therapist_pair_row')}
              value={therapistName || t('settings.therapist_not_linked')}
              onPress={() => setTherapistModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="medkit-outline"
              label={t('settings.therapist_export')}
              onPress={async () => {
                try {
                  await exportReport(lang);
                } catch (e) {
                  Alert.alert(t('common.close'), String(e));
                }
              }}
            />
          </View>
          <Text style={styles.sectionHint}>{t('settings.therapist_hint')}</Text>
        </View>

        {/* Companion Mascot Studio */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('companion_lab.title')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="color-palette-outline"
              label={t('settings.companion_lab')}
              value="Lab →"
              onPress={() => router.push('/companion-lab' as any)}
            />
          </View>
          <Text style={styles.sectionHint}>{t('settings.companion_lab_sub')}</Text>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.section_about')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="information-circle-outline" label={t('settings.version')} value={version} />
            <View style={styles.divider} />
            <SettingRow icon="lock-closed-outline" label={t('settings.privacy')} onPress={() => Linking.openURL(PRIVACY_URL)} />
            <View style={styles.divider} />
            <SettingRow icon="document-text-outline" label={t('settings.terms')} onPress={() => Linking.openURL(TERMS_URL)} />
          </View>
        </View>

        {/* Development builds only — lets testers walk through onboarding again. */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Dev</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="refresh-circle-outline"
                label={t('settings.dev_onboarding')}
                onPress={() => {
                  useStore.getState().setOnboardingDone(false);
                  router.replace('/onboarding/welcome');
                }}
              />
            </View>
          </View>
        )}

        <Text style={styles.disclaimer}>{t('settings.disclaimer')}</Text>
        <Text style={styles.footer}>{t('settings.footer_tagline')}</Text>

        <ReminderTimeModal
          visible={editingSlot !== null}
          title={
            editingSlot === 'morning'
              ? t('reminders.morning')
              : editingSlot === 'streak'
                ? t('reminders.streak')
                : t('reminders.daily')
          }
          subtitle={
            editingSlot === 'morning'
              ? t('reminders.morning_sub')
              : editingSlot === 'streak'
                ? t('reminders.streak_sub')
                : t('reminders.daily_sub')
          }
          initialHour={
            editingSlot === 'morning'
              ? (reminder.morningHour ?? 8)
              : editingSlot === 'streak'
                ? (reminder.streakSaverHour ?? 20)
                : reminder.hour
          }
          initialMinute={
            editingSlot === 'morning'
              ? (reminder.morningMinute ?? 0)
              : editingSlot === 'streak'
                ? (reminder.streakSaverMinute ?? 30)
                : reminder.minute
          }
          presets={
            editingSlot === 'morning'
              ? MORNING_REMINDER_TIMES
              : editingSlot === 'streak'
                ? STREAK_REMINDER_TIMES
                : REMINDER_TIMES
          }
          onSave={(h, m) => {
            if (editingSlot === 'morning') {
              updateReminderSettings({ morningHour: h, morningMinute: m });
            } else if (editingSlot === 'streak') {
              updateReminderSettings({ streakSaverHour: h, streakSaverMinute: m });
            } else {
              updateReminderSettings({ hour: h, minute: m });
            }
          }}
          onClose={() => setEditingSlot(null)}
        />

        <PromoCodeModal
          visible={promoVisible}
          onClose={() => setPromoVisible(false)}
        />

        <TherapistConnectModal
          visible={therapistModalVisible}
          onClose={() => setTherapistModalVisible(false)}
        />

        <ReferralShareModal
          visible={referralModalVisible}
          onClose={() => setReferralModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 20, paddingBottom: 40, gap: 16 },
  screenTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.heading, fontSize: 22, color: Colors.accent.main },
  profileName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  planLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  section: { gap: 8 },
  sectionHint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    lineHeight: 16,
    color: Colors.text.tertiary,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowIcon: { width: 24 },
  rowLabel: {
    flex: 1,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  rowSubLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  slotBlock: {
    paddingVertical: 4,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  slotTextGroup: {
    flex: 1,
  },
  timeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card2,
  },
  timeChipActive: { backgroundColor: Colors.accent.main },
  timeText: { fontFamily: FontFamily.dmSansBold, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  timeTextActive: { color: '#FFFFFF' },
  customTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent.soft,
    borderWidth: 1,
    borderColor: Colors.accent.main,
  },
  customTimeChipText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  divider: { height: 1, backgroundColor: Colors.hairline, marginHorizontal: 18 },
  disclaimer: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  footer: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
