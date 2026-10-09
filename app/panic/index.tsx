import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import IconButton from '../../components/IconButton';
import BreathingBall from '../../components/BreathingBall';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow } from '../../theme/tokens';

export default function PanicScreen() {
  const { t, tList } = useTranslation();
  const incrementPanicUses = useStore((s) => s.incrementPanicUses);
  const affirmations = tList('panic.affirmations');
  const [affirmIdx, setAffirmIdx] = useState(0);
  const counted = useRef(false);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      incrementPanicUses();
    }
    glowOpacity.set(withRepeat(
      withSequence(withTiming(0.95, { duration: 4000 }), withTiming(0.5, { duration: 3000 })),
      -1,
    ));
    return () => cancelAnimation(glowOpacity);
  }, [incrementPanicUses, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value * 0.25 }));

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.glowTop, glowStyle]} pointerEvents="none">
        <LinearGradient colors={[Colors.accent.main, 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.header}>
        <IconButton icon="close" onPress={() => router.back()} accessibilityLabel={t('panic.close_a11y')} />
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title} accessibilityRole="header">{t('panic.title')}</Text>
        <Text style={styles.sub}>{t('panic.sub')}</Text>
      </View>

      <BreathingBall />

      {affirmations.length > 0 && (
        <View style={styles.affirmCard}>
          <Text style={styles.affirmText}>
            „{affirmations[affirmIdx % affirmations.length]}“
          </Text>
          <TouchableOpacity
            onPress={() => setAffirmIdx((a) => a + 1)}
            style={styles.affirmNext}
            accessibilityRole="button"
          >
            <Text style={styles.affirmNextText}>{t('panic.affirmation_next')} →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    zIndex: 1,
  },
  titleWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 20,
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.hero,
    color: Colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  affirmCard: {
    marginHorizontal: Spacing.screenH,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 12,
  },
  affirmText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  affirmNext: { alignSelf: 'flex-end' },
  affirmNextText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
});
