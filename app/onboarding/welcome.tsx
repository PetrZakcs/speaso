import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Spacing } from '../../theme/tokens';

const POINTS = ['onboarding.welcome_point_1', 'onboarding.welcome_point_2', 'onboarding.welcome_point_3'];

export default function Welcome() {
  const { t, lang } = useTranslation();
  const setLanguage = useStore((s) => s.setLanguage);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Text style={styles.wordmark}>speasy</Text>
        <TouchableOpacity
          onPress={() => setLanguage(lang === 'cs' ? 'en' : 'cs')}
          accessibilityRole="button"
          hitSlop={12}
        >
          <Text style={styles.lang}>{lang === 'cs' ? 'English' : 'Čeština'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <Text style={styles.title} accessibilityRole="header">{t('onboarding.welcome_title')}</Text>
        <Text style={styles.sub}>{t('onboarding.welcome_sub')}</Text>

        <View style={styles.points}>
          {POINTS.map((key) => (
            <View key={key} style={styles.point}>
              <View style={styles.dot} />
              <Text style={styles.pointText}>{t(key)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('onboarding.welcome_cta')} onPress={() => router.push('/onboarding/name')} />
        <Text style={styles.note}>{t('onboarding.welcome_note')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  wordmark: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 18,
    color: Colors.accent.main,
    letterSpacing: -0.3,
  },
  lang: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  main: { flex: 1, justifyContent: 'center' },
  title: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 40,
    lineHeight: 46,
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 17,
    lineHeight: 25,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  points: { marginTop: 32, gap: 14 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent.main, marginTop: 8 },
  pointText: {
    flex: 1,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    lineHeight: 22,
    color: Colors.text.primary,
  },
  footer: { paddingBottom: 12, gap: 14 },
  note: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    lineHeight: 17,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
