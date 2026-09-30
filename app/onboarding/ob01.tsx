import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, useShallow } from '../../state/store';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';
import type { SupportedLang } from '../../state/store';

export default function OB01() {
  const { t } = useTranslation();
  const { language, setLanguage } = useStore(useShallow((s) => ({ language: s.language, setLanguage: s.setLanguage })));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Lang switcher */}
      <View style={styles.langRow}>
        {(['cs', 'en'] as SupportedLang[]).map((lang) => (
          <TouchableOpacity
            key={lang}
            onPress={() => setLanguage(lang)}
            style={[styles.langChip, language === lang && styles.langChipActive]}
          >
            <Text style={[styles.langLabel, language === lang && styles.langLabelActive]}>
              {lang.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.center}>
        {/* Hero icon */}
        <LinearGradient
          colors={['#1741C4', '#2563EB']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroEmoji}>🗣️</Text>
        </LinearGradient>

        <Text style={styles.title}>{t('onboarding.welcome_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.welcome_sub')}</Text>

        {/* Privacy pill */}
        <View style={styles.privacyPill}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>{t('onboarding.welcome_privacy')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton
          label={t('onboarding.welcome_cta') + ' →'}
          onPress={() => router.push('/onboarding/ob02')}
        />
        <TouchableOpacity onPress={() => router.push('/onboarding/ob02')} style={styles.skipBtn}>
          <Text style={styles.skipLabel}>{t('onboarding.welcome_skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    gap: 6,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  langChipActive: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  langLabel: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.meta,
  },
  langLabelActive: { color: Colors.text.primary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 20,
  },
  heroCard: {
    width: 124,
    height: 124,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 16,
  },
  heroEmoji: { fontSize: 56 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  privacyIcon: { fontSize: 14 },
  privacyText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  footer: {
    paddingBottom: 32,
    gap: 12,
  },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
});
