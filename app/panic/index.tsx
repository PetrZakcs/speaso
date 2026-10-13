import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import BreathingBall from '../../components/BreathingBall';
import CalmBackground from '../../components/calm/CalmBackground';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calm, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export default function PanicScreen() {
  const { t, tList } = useTranslation();
  const incrementPanicUses = useStore((s) => s.incrementPanicUses);
  const affirmations = tList('panic.affirmations');
  const [affirmIdx, setAffirmIdx] = useState(0);
  const counted = useRef(false);

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      incrementPanicUses();
    }
  }, [incrementPanicUses]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CalmBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('panic.close_a11y')}
          >
            <Ionicons name="close" size={22} color={Calm.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title} accessibilityRole="header">{t('panic.title')}</Text>
          <Text style={styles.sub}>{t('panic.sub')}</Text>
        </View>

        <View style={styles.center}>
          <BreathingBall tone="calm" />
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Calm.bgTo },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 8,
    zIndex: 1,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.hero,
    color: Calm.text,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    lineHeight: 22,
    color: Calm.muted,
    textAlign: 'center',
  },
  affirmCard: {
    marginHorizontal: Spacing.screenH,
    marginBottom: 16,
    backgroundColor: Calm.card,
    borderRadius: Radius.card,
    padding: 20,
    gap: 12,
  },
  affirmText: {
    fontFamily: FontFamily.heading,
    fontSize: 17,
    color: Calm.text,
    lineHeight: 25,
  },
  affirmNext: { alignSelf: 'flex-end' },
  affirmNextText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Calm.accent,
  },
});
