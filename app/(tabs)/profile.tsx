import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import { initials } from '../../lib/names';
import { manageSubscription, restorePurchases } from '../../lib/purchases';
import { PRIVACY_URL, TERMS_URL } from '../../lib/links';
import { REMINDER_TIMES, disableReminder, enableReminder, formatTime } from '../../lib/reminders';
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
  const { t } = useTranslation();
  const [restoring, setRestoring] = useState(false);
  const { name, subscription, language, setLanguage, reminder, setReminder } = useStore(useShallow((s) => ({
    name: s.user.name,
    subscription: s.subscription,
    language: s.language,
    setLanguage: s.setLanguage,
    reminder: s.reminder,
    setReminder: s.setReminder,
  })));

  const toggleReminder = async (on: boolean) => {
    if (!on) {
      disableReminder();
      return;
    }
    const ok = await enableReminder(reminder.hour, reminder.minute);
    if (!ok) {
      Alert.alert(t('reminders.denied_title'), t('reminders.denied_body'), [
        { text: t('common.close'), style: 'cancel' },
        { text: t('recorder.open_settings'), onPress: () => Linking.openSettings() },
      ]);
    }
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
                {t(subscription.isTrial ? 'settings.plan_trial' : 'settings.plan_premium')}
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

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('reminders.section')}</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <Ionicons name="notifications-outline" size={18} color={Colors.text.secondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{t('reminders.daily')}</Text>
              <Switch
                value={reminder.enabled}
                onValueChange={toggleReminder}
                trackColor={{ false: Colors.text.tertiary, true: Colors.accent.main }}
                thumbColor="#FFFFFF"
                accessibilityLabel={t('reminders.daily')}
              />
            </View>
            {reminder.enabled && (
              <>
                <View style={styles.divider} />
                <View style={styles.timeRow} accessibilityRole="radiogroup">
                  {REMINDER_TIMES.map((time) => {
                    const active = time.hour === reminder.hour && time.minute === reminder.minute;
                    return (
                      <TouchableOpacity
                        key={`${time.hour}:${time.minute}`}
                        onPress={() => setReminder({ ...reminder, ...time })}
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
                </View>
              </>
            )}
          </View>
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
              icon="refresh-outline"
              label={t('settings.restore')}
              value={restoring ? '…' : undefined}
              onPress={restoring ? undefined : handleRestore}
            />
          </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 20, paddingBottom: 40, gap: 16 },
  screenTitle: {
    fontFamily: FontFamily.soraSemiBold,
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
  avatarText: { fontFamily: FontFamily.soraSemiBold, fontSize: 22, color: Colors.accent.main },
  profileName: {
    fontFamily: FontFamily.soraSemiBold,
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
  rowValue: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  timeRow: { flexDirection: 'row', gap: 8, padding: 14, flexWrap: 'wrap' },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card2,
  },
  timeChipActive: { backgroundColor: Colors.accent.main },
  timeText: { fontFamily: FontFamily.dmSansBold, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  timeTextActive: { color: Colors.text.primary },
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
