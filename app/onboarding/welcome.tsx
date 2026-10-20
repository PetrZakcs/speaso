import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { useReducedMotion } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import PillButton from '../../components/PillButton';
import VoiceWave from '../../components/brand/VoiceWave';
import { trackEvent } from '../../lib/analytics';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

const SETTLE_MS = 3600;
const SETTLE_STEPS = 36;

/** The whole idea in one image: a tense wave that settles into an even one. */
function useSettlingCalm() {
  const reduceMotion = useReducedMotion();
  const [calm, setCalm] = useState(reduceMotion ? 1 : 0.02);
  useEffect(() => {
    if (reduceMotion) return;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      // Ease-out: most of the calming happens early, then it glides.
      const t = step / SETTLE_STEPS;
      setCalm(0.02 + 0.98 * (1 - Math.pow(1 - t, 3)));
      if (step >= SETTLE_STEPS) clearInterval(id);
    }, SETTLE_MS / SETTLE_STEPS);
    return () => clearInterval(id);
  }, [reduceMotion]);
  return calm;
}

export default function Welcome() {
  const { t, lang } = useTranslation();
  const setLanguage = useStore((s) => s.setLanguage);
  const calm = useSettlingCalm();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Text style={styles.wordmark}>speaso</Text>
        <TouchableOpacity
          onPress={() => setLanguage(lang === 'cs' ? 'en' : 'cs')}
          accessibilityRole="button"
          hitSlop={12}
        >
          <Text style={styles.lang}>{lang === 'cs' ? 'English' : 'Čeština'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <VoiceWave calm={calm} height={140} style={styles.wave} />
        <View style={styles.socialProofBadge}>
          <Text style={styles.socialProofText}>{t('onboarding.welcome_social_proof')}</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {t('onboarding.welcome_title_a')}{' '}
          <Text style={styles.titleAccent}>{t('onboarding.welcome_title_b')}</Text>
        </Text>
        <Text style={styles.sub}>{t('onboarding.welcome_sub')}</Text>

        <View style={styles.pillars}>
          <View style={styles.pillarRow}>
            <View style={styles.pillarIcon}>
              <Ionicons name="leaf-outline" size={16} color={Colors.accent.main} />
            </View>
            <Text style={styles.pillarText}>{t('onboarding.welcome_pillar_breath')}</Text>
          </View>
          <View style={styles.pillarRow}>
            <View style={styles.pillarIcon}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.accent.main} />
            </View>
            <Text style={styles.pillarText}>{t('onboarding.welcome_pillar_safety')}</Text>
          </View>
          <View style={styles.pillarRow}>
            <View style={styles.pillarIcon}>
              <Ionicons name="flask-outline" size={16} color={Colors.accent.main} />
            </View>
            <Text style={styles.pillarText}>{t('onboarding.welcome_pillar_research')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton
          label={t('onboarding.welcome_cta')}
          onPress={() => {
            trackEvent('onboarding_start');
            router.push('/onboarding/name');
          }}
        />
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
    fontFamily: FontFamily.heading,
    fontSize: 18,
    color: Colors.accent.main,
    letterSpacing: -0.3,
  },
  lang: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  main: { flex: 1, justifyContent: 'center' },
  wave: { marginHorizontal: -Spacing.screenH, marginBottom: 28 },
  socialProofBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginBottom: 16,
  },
  socialProofText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 44,
    lineHeight: 50,
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  titleAccent: { fontFamily: FontFamily.headingSemiBoldItalic, color: Colors.accent.main },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 16,
    lineHeight: 23,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  pillars: {
    marginTop: 18,
    gap: 10,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
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
