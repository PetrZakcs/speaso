import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import CompanionAvatar, { CompanionMood } from '../components/CompanionAvatar';
import { hasCustomMascot } from '../components/companion/companionAsset';
import { useTranslation } from '../i18n/useTranslation';
import { hapticPress, hapticSelect, hapticSuccess } from '../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow } from '../theme/tokens';

type MoodItem = {
  key: CompanionMood;
  labelKey: string;
  icon: string;
};

const MOODS: MoodItem[] = [
  { key: 'idle', labelKey: 'companion_lab.mood_idle', icon: 'leaf-outline' },
  { key: 'breathing', labelKey: 'companion_lab.mood_breathing', icon: 'pulse-outline' },
  { key: 'celebrate', labelKey: 'companion_lab.mood_celebrate', icon: 'sparkles-outline' },
  { key: 'wisdom', labelKey: 'companion_lab.mood_wisdom', icon: 'bulb-outline' },
  { key: 'listening', labelKey: 'companion_lab.mood_listening', icon: 'mic-outline' },
  { key: 'sleeping', labelKey: 'companion_lab.mood_sleeping', icon: 'moon-outline' },
];

const SIZES = [
  { key: 'small', labelKey: 'companion_lab.size_small', px: 64 },
  { key: 'sos', labelKey: 'companion_lab.size_sos', px: 92 },
  { key: 'medium', labelKey: 'companion_lab.size_medium', px: 130 },
  { key: 'hero', labelKey: 'companion_lab.size_hero', px: 190 },
];

export default function CompanionLabScreen() {
  const { t } = useTranslation();
  const [mood, setMood] = useState<CompanionMood>('idle');
  const [variant, setVariant] = useState<'duo' | 'capybara'>('duo');
  const [sizePx, setSizePx] = useState<number>(130);
  const [showBubble, setShowBubble] = useState<boolean>(true);
  const [sampleIdx, setSampleIdx] = useState<number>(0);

  const bubbleSamples = [
    t('companion_lab.bubble_sample1'),
    t('companion_lab.bubble_sample2'),
    t('companion_lab.bubble_sample3'),
  ];

  const handleMascotTap = () => {
    hapticSuccess();
    if (mood !== 'celebrate') {
      setMood('celebrate');
      setTimeout(() => {
        setMood('idle');
      }, 2400);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{t('companion_lab.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('companion_lab.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stage Card */}
        <View style={styles.stageCard}>
          <View style={styles.stageStatusBadge}>
            <Ionicons
              name={hasCustomMascot ? 'image-outline' : 'sparkles-outline'}
              size={14}
              color={Colors.accent.main}
            />
            <Text style={styles.stageStatusBadgeText}>
              {hasCustomMascot
                ? t('companion_lab.status_custom')
                : t('companion_lab.status_procedural')}
            </Text>
          </View>

          <View style={[styles.avatarWrapper, { minHeight: sizePx + (showBubble ? 60 : 30) }]}>
            <CompanionAvatar
              size={sizePx}
              mood={mood}
              variant={variant}
              message={showBubble ? bubbleSamples[sampleIdx % bubbleSamples.length] : undefined}
              onPress={handleMascotTap}
            />
          </View>

          <Text style={styles.stageHint}>{t('companion_lab.stage_hint')}</Text>
        </View>

        {/* Mascot Asset Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <Ionicons
              name={hasCustomMascot ? 'checkmark-circle' : 'information-circle-outline'}
              size={20}
              color={hasCustomMascot ? Colors.accent.main : Colors.brand.main}
            />
            <Text style={styles.statusTitle}>
              {hasCustomMascot
                ? t('companion_lab.status_custom')
                : t('companion_lab.status_procedural')}
            </Text>
          </View>
          <Text style={styles.statusDesc}>
            {hasCustomMascot
              ? t('companion_lab.status_custom_desc')
              : t('companion_lab.status_procedural_desc')}
          </Text>
        </View>

        {/* Mascot Variant Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POSTAVIČKA / MASCOT</Text>
          <View style={styles.chipsWrap}>
            <TouchableOpacity
              style={[styles.moodChip, variant === 'duo' && styles.moodChipActive]}
              onPress={() => {
                hapticSelect();
                setVariant('duo');
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={variant === 'duo' ? Colors.surface.card : Colors.text.primary}
              />
              <Text style={[styles.moodChipText, variant === 'duo' && styles.moodChipTextActive]}>
                Duo (Postava + Kapybara)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moodChip, variant === 'capybara' && styles.moodChipActive]}
              onPress={() => {
                hapticSelect();
                setVariant('capybara');
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="paw-outline"
                size={16}
                color={variant === 'capybara' ? Colors.surface.card : Colors.text.primary}
              />
              <Text style={[styles.moodChipText, variant === 'capybara' && styles.moodChipTextActive]}>
                Kapybara (Samotná)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mood Selector Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('companion_lab.moods_title')}</Text>
          <View style={styles.chipsWrap}>
            {MOODS.map((m) => {
              const active = mood === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodChip, active && styles.moodChipActive]}
                  onPress={() => {
                    hapticSelect();
                    setMood(m.key);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={m.icon as any}
                    size={16}
                    color={active ? Colors.surface.card : Colors.text.primary}
                  />
                  <Text style={[styles.moodChipText, active && styles.moodChipTextActive]}>
                    {t(m.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Size Selector Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('companion_lab.size_title')}</Text>
          <View style={styles.chipsWrap}>
            {SIZES.map((s) => {
              const active = sizePx === s.px;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sizeChip, active && styles.sizeChipActive]}
                  onPress={() => {
                    hapticSelect();
                    setSizePx(s.px);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                    {t(s.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Speech Bubble Tester */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('companion_lab.bubble_title')}</Text>
            <View style={styles.switchWrap}>
              <Text style={styles.switchLabel}>{t('companion_lab.bubble_toggle')}</Text>
              <Switch
                value={showBubble}
                onValueChange={(val) => {
                  hapticPress();
                  setShowBubble(val);
                }}
                trackColor={{ false: Colors.hairline, true: Colors.accent.soft }}
                thumbColor={showBubble ? Colors.accent.main : Colors.surface.card}
              />
            </View>
          </View>

          {showBubble && (
            <View style={styles.samplePhrasesWrap}>
              {bubbleSamples.map((phrase, idx) => {
                const active = sampleIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.samplePhraseChip, active && styles.samplePhraseChipActive]}
                    onPress={() => {
                      hapticSelect();
                      setSampleIdx(idx);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.samplePhraseText,
                        active && styles.samplePhraseTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {phrase}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Guide Card */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Ionicons name="bulb-outline" size={18} color={Colors.accent.main} />
            <Text style={styles.guideTitle}>{t('companion_lab.guide_title')}</Text>
          </View>
          <Text style={styles.guideStep}>{t('companion_lab.guide_step1')}</Text>
          <Text style={styles.guideStep}>{t('companion_lab.guide_step2')}</Text>
        </View>
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
    paddingHorizontal: Spacing.screenH,
    paddingVertical: 14,
    gap: Spacing.gap,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.surface.card,
  },
  backButton: {
    padding: 4,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  scroll: {
    padding: Spacing.screenH,
    gap: Spacing.sectionGap,
    paddingBottom: 40,
  },
  stageCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: Spacing.cardPadLarge,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  stageStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 6,
    marginBottom: 10,
  },
  stageStatusBadgeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  avatarWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  stageHint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.micro,
    color: Colors.text.tertiary,
    marginTop: 10,
  },
  statusCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    padding: Spacing.cardPad,
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: 6,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.cardTitleSmall,
    color: Colors.text.primary,
  },
  statusDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  moodChipActive: {
    backgroundColor: Colors.accent.main,
    borderColor: Colors.accent.main,
  },
  moodChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  moodChipTextActive: {
    color: Colors.surface.card,
  },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  sizeChipActive: {
    backgroundColor: Colors.accent.main,
    borderColor: Colors.accent.main,
  },
  sizeChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  sizeChipTextActive: {
    color: Colors.surface.card,
  },
  samplePhrasesWrap: {
    gap: 6,
    marginTop: 4,
  },
  samplePhraseChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  samplePhraseChipActive: {
    backgroundColor: Colors.accent.soft,
    borderColor: Colors.accent.main,
  },
  samplePhraseText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  samplePhraseTextActive: {
    color: Colors.accent.main,
    fontFamily: FontFamily.dmSansMedium,
  },
  guideCard: {
    backgroundColor: Colors.surface.mint,
    borderRadius: Radius.cardSmall,
    padding: Spacing.cardPad,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guideTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
    textTransform: 'uppercase',
  },
  guideStep: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
