import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { SITUATIONS } from '../../content/situations';
import PillButton from '../../components/PillButton';
import IconButton from '../../components/IconButton';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing, Tints } from '../../theme/tokens';

/**
 * Empathy beat between questions: you're not alone + why practising the
 * situations you picked helps. Only well-established facts, no promises.
 */
export default function Insight() {
  const { t, lang } = useTranslation();
  const picked = useStore((s) => s.user.situations);
  const titles = SITUATIONS.filter((s) => picked.includes(s.id)).map((s) => s.content[lang].title.toLowerCase());
  const situationsText = titles.length > 0 ? titles.join(', ') : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" size={36} onPress={() => router.back()} accessibilityLabel={t('common.back')} />
      </View>

      <View style={styles.main}>
        <View style={styles.badge}>
          <Ionicons name="people-outline" size={34} color={Tints.lavender.fg} />
        </View>
        <Text style={styles.title} accessibilityRole="header">{t('onboarding.insight_title')}</Text>
        <Text style={styles.body}>{t('onboarding.insight_body')}</Text>

        <View style={styles.card}>
          <Ionicons name="bulb-outline" size={20} color={Colors.accent.main} />
          <Text style={styles.cardText}>
            {situationsText
              ? t('onboarding.insight_situations', { situations: situationsText })
              : t('onboarding.insight_generic')}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('common.continue')} onPress={() => router.push('/onboarding/goal')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  header: { paddingTop: 8 },
  main: { flex: 1, justifyContent: 'center', gap: 16 },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: Tints.lavender.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  body: { fontFamily: FontFamily.dmSansRegular, fontSize: 17, lineHeight: 26, color: Colors.text.secondary },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 16,
    marginTop: 8,
    ...Shadow.card,
  },
  cardText: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, lineHeight: 22, color: Colors.text.primary },
  footer: { paddingBottom: 12 },
});
