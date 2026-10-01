import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Gradients, Spacing } from '../../theme/tokens';

const UNLOCKED = ['post_unlimited', 'post_situations', 'post_recordings', 'post_stats', 'post_pdf'];

export default function PostPurchase() {
  const { t } = useTranslation();
  const name = useStore((s) => s.user.name);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, [scale]);

  const crownStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Animated.View style={[styles.crownCircle, crownStyle]}>
          <LinearGradient colors={Gradients.gold} style={styles.crownGrad}>
            <Text style={styles.crownEmoji}>👑</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title} accessibilityRole="header">
          {name ? t('premium.post_title', { name }) : t('premium.post_title_noname')}
        </Text>
        <Text style={styles.sub}>{t('premium.post_sub')}</Text>

        <View style={styles.checklist}>
          {UNLOCKED.map((key) => (
            <View key={key} style={styles.checkRow}>
              <Text style={styles.checkMark}>✓</Text>
              <Text style={styles.checkText}>{t(`premium.${key}`)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton label={t('premium.post_cta')} onPress={() => router.back()} variant="gold" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base, paddingHorizontal: Spacing.screenH },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  crownCircle: {
    shadowColor: Colors.premium.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  crownGrad: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: { fontSize: 48 },
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
  },
  checklist: { gap: 10, alignSelf: 'stretch' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success.green + '22',
    color: Colors.success.green,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FontFamily.dmSansBold,
    fontSize: 12,
    overflow: 'hidden',
  },
  checkText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  footer: { paddingBottom: 32, gap: 10 },
});
