import { ScrollView } from 'react-native-gesture-handler';
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, useShallow } from '../../state/store';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';
import type { SupportedLang } from '../../state/store';

function SettingRow({
  icon, label, value, onPress, toggle, toggleValue, onToggle, premium,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  premium?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !toggle}
      activeOpacity={0.75}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      {premium && !toggle && <Text style={styles.premiumBadge}>👑</Text>}
      {value && <Text style={styles.rowValue}>{value} ›</Text>}
      {toggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.surface.card2, true: Colors.primary.blue }}
          thumbColor={Colors.text.primary}
        />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const {
    user, subscription, therapist, language, setLanguage,
    remindersEnabled, soundsEnabled, panicLockscreen,
    toggleReminders, toggleSounds, togglePanicLockscreen,
  } = useStore(useShallow((s) => ({
    user: s.user,
    subscription: s.subscription,
    therapist: s.therapist,
    language: s.language,
    setLanguage: s.setLanguage,
    remindersEnabled: s.remindersEnabled,
    soundsEnabled: s.soundsEnabled,
    panicLockscreen: s.panicLockscreen,
    toggleReminders: s.toggleReminders,
    toggleSounds: s.toggleSounds,
    togglePanicLockscreen: s.togglePanicLockscreen,
  })));

  const isPremium = subscription.tier === 'premium';
  const initials = user.name ? user.name[0].toUpperCase() : 'S';

  const handleLangSwitch = () => {
    const next: SupportedLang = language === 'cs' ? 'en' : 'cs';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>{t('settings.title')}</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <LinearGradient colors={['#1741C4', '#2563EB']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user.name || 'Speasy User'}</Text>
            <View style={styles.planRow}>
              {isPremium ? (
                <>
                  <Text style={{ fontSize: 12 }}>👑</Text>
                  <Text style={styles.planLabel}>{t('settings.plan_premium')}</Text>
                </>
              ) : (
                <TouchableOpacity onPress={() => router.push('/paywall/premium')}>
                  <Text style={[styles.planLabel, { color: Colors.premium.gold }]}>Free · Upgradovat →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Therapist row */}
        {isPremium && (
          <TouchableOpacity style={styles.therapistRow} onPress={() => router.push('/therapist')}>
            <Text style={{ fontSize: 20 }}>🩺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.therapistLabel}>{t('settings.therapist_connected')}</Text>
              <Text style={styles.therapistName}>
                {therapist?.name ?? 'Připojit logopeda →'}
              </Text>
            </View>
            <Text style={styles.therapistArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* App section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.section_app')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="🔔"
              label={t('settings.reminders')}
              toggle
              toggleValue={remindersEnabled}
              onToggle={toggleReminders}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="🔊"
              label={t('settings.sounds')}
              toggle
              toggleValue={soundsEnabled}
              onToggle={toggleSounds}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="📱"
              label={t('settings.panic_lockscreen')}
              toggle
              toggleValue={panicLockscreen}
              onToggle={isPremium ? togglePanicLockscreen : () => router.push('/paywall/premium')}
              premium={!isPremium}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="🌍"
              label={t('settings.language')}
              value={language === 'cs' ? 'Čeština' : 'English'}
              onPress={handleLangSwitch}
            />
          </View>
        </View>

        {/* Premium section */}
        {isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.section_premium')}</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="📄"
                label={t('settings.export_report')}
                onPress={() => {}}
                value=""
              />
              <View style={styles.divider} />
              <SettingRow
                icon="🩺"
                label={t('settings.therapist_portal')}
                onPress={() => router.push('/therapist')}
                value=""
              />
              <View style={styles.divider} />
              <SettingRow
                icon="💳"
                label={t('settings.manage_sub')}
                onPress={() => {}}
                value=""
              />
            </View>
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.section_about')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="ℹ️" label={t('settings.version')} value="1.0.0" />
            <View style={styles.divider} />
            <SettingRow icon="🔒" label={t('settings.privacy')} onPress={() => {}} value="" />
          </View>
        </View>

        <Text style={styles.footer}>{t('settings.footer_tagline')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 20, paddingBottom: 40, gap: 16 },
  screenTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.soraBold, fontSize: 22, color: Colors.text.primary },
  profileName: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  planLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  therapistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.therapist.purple + '18',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.therapist.purple + '40',
    padding: 16,
  },
  therapistLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.therapist.purple,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  therapistName: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginTop: 2,
  },
  therapistArrow: { color: Colors.text.tertiary, fontSize: 20 },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowIcon: { fontSize: 18, width: 24 },
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
  premiumBadge: { fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.hairline, marginHorizontal: 18 },
  footer: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
  },
});
