import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from '../i18n/useTranslation';
import IconButton from '../components/IconButton';
import MirrorView from '../components/tools/MirrorView';
import ReadingPanel from '../components/tools/ReadingPanel';
import Recorder from '../components/tools/Recorder';
import ZeroCloudBadge from '../components/ZeroCloudBadge';
import { Colors, FontFamily, FontSize, Spacing } from '../theme/tokens';

/**
 * Dedicated Mirror Therapy Studio.
 * Allows people who stutter to observe their facial tension, lip pressing,
 * and shoulder posture in real-time while reading aloud with the pacing guide.
 */
export default function MirrorScreen() {
  const { t } = useTranslation();
  const [compactMirror, setCompactMirror] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={36}
          onPress={() => router.back()}
          accessibilityLabel={t('common.close')}
        />
        <View style={styles.titleWrap}>
          <Text style={styles.title} accessibilityRole="header">
            {t('mirror.title')}
          </Text>
          <Text style={styles.kicker}>{t('mirror.kicker')}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sub}>{t('mirror.sub')}</Text>

        {/* Live Mirror Preview */}
        <MirrorView
          compact={compactMirror}
          onToggleExpand={() => setCompactMirror((c) => !c)}
          style={compactMirror ? styles.mirrorCompact : styles.mirrorFull}
        />

        <ZeroCloudBadge style={{ marginVertical: 8 }} />

        {/* Reading Text & Pacer Guide */}
        <ReadingPanel initialLevel={2} />

        {/* Local Voice Recorder */}
        <Recorder exerciseId="reading" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  kicker: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta - 1,
    color: Colors.accent.main,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: 40,
    gap: 12,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  mirrorFull: {
    height: 310,
  },
  mirrorCompact: {
    height: 180,
  },
});
