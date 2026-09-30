import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export default function PaywallStats() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.icon}>📊</Text>
        <Text style={styles.title}>{t('progress.locked_title')}</Text>
        <Text style={styles.sub}>{t('progress.locked_sub')}</Text>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('premium.trial_cta')} onPress={() => router.replace('/paywall/premium')} />
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface.card,
    borderWidth: 1, borderColor: Colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: Colors.text.primary, fontSize: 14 },
  content: { flex: 1, justifyContent: 'center', gap: 16, alignItems: 'center' },
  icon: { fontSize: 64 },
  title: { fontFamily: FontFamily.soraBold, fontSize: FontSize.hero, color: Colors.text.primary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  footer: { paddingBottom: 32, gap: 12, alignItems: 'center' },
  stayFree: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.tertiary, paddingVertical: 8 },
});
