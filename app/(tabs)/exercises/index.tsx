import { ScrollView } from 'react-native-gesture-handler';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../../i18n/useTranslation';
import { useStore, useShallow } from '../../../state/store';
import Card from '../../../components/Card';
import AiDots from '../../../components/AiDots';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../../theme/tokens';

const { width } = Dimensions.get('window');

type Tab = 'exercises' | 'situations';

const EXERCISES = [
  { id: 'breathing', icon: '🫁', mins: 8, level: 1, locked: false },
  { id: 'reading', icon: '📖', mins: 5, level: 2, locked: false },
  { id: 'softstart', icon: '🎙️', mins: 6, level: 2, locked: false },
  { id: 'aicall', icon: '🎭', mins: 10, level: 3, locked: true },
];

const SITUATIONS = [
  { id: 'phone', icon: '📞', diff: 'medium', locked: false },
  { id: 'shop', icon: '🛒', diff: 'easy', locked: false },
  { id: 'presentation', icon: '🎤', diff: 'hard', locked: true },
  { id: 'meeting', icon: '💼', diff: 'hard', locked: true },
];

const DIFF_COLORS: Record<string, string> = {
  easy: Colors.success.green,
  medium: Colors.premium.gold,
  hard: Colors.danger.panic,
};

export default function ExercisesScreen() {
  const { t } = useTranslation();
  const { subscription, usage } = useStore(useShallow((s) => ({
    subscription: s.subscription,
    usage: s.usage,
  })));
  const isPremium = subscription.tier === 'premium';
  const [activeTab, setActiveTab] = useState<Tab>('exercises');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const handleExTap = (ex: typeof EXERCISES[0]) => {
    if (ex.locked && !isPremium) {
      router.push('/paywall/locked-exercise');
      return;
    }
    if (!isPremium && usage.weeklyExercises >= 5) {
      router.push('/paywall/limit');
      return;
    }
    router.push(`/(tabs)/exercises/${ex.id}`);
  };

  const handleSitTap = (sit: typeof SITUATIONS[0]) => {
    if (sit.locked && !isPremium) {
      router.push('/paywall/locked-exercise');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>{t('exercises.title')}</Text>

        {/* Segmented tab */}
        <View style={styles.segmented}>
          {(['exercises', 'situations'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.segment, activeTab === tab && styles.segmentActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>
                {t(`exercises.tab_${tab}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'exercises' && (
          <>
            {/* AI strip */}
            <Card style={styles.aiStrip}>
              <View style={styles.aiRow}>
                <AiDots />
                <Text style={styles.aiLabel}>{t('exercises.ai_recommended')}</Text>
              </View>
              <Text style={styles.aiText}>{t('exercises.ai_reco_text')}</Text>
            </Card>

            <View style={styles.list}>
              {EXERCISES.map((ex) => {
                const locked = ex.locked && !isPremium;
                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={[styles.exCard, locked && styles.exCardLocked]}
                    onPress={() => handleExTap(ex)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.exIconWrap}>
                      <Text style={styles.exIcon}>{ex.icon}</Text>
                    </View>
                    <View style={styles.exInfo}>
                      <Text style={[styles.exTitle, locked && styles.textLocked]}>
                        {t(`exercises.ex_${ex.id}`)}
                      </Text>
                      <Text style={styles.exSub}>{t(`exercises.ex_${ex.id}_sub`)}</Text>
                      <View style={styles.levelDots}>
                        {[1, 2, 3].map((l) => (
                          <View
                            key={l}
                            style={[
                              styles.levelDot,
                              l <= ex.level && (l === 3 ? styles.levelDotHard : styles.levelDotActive),
                            ]}
                          />
                        ))}
                        <Text style={styles.minsText}>{ex.mins} {t('common.min_short')}</Text>
                      </View>
                    </View>
                    {locked ? (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockEmoji}>👑</Text>
                      </View>
                    ) : (
                      <View style={styles.playBtn}>
                        <Text style={styles.playText}>▶</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 'situations' && (
          <>
            <Text style={styles.sitIntro}>{t('exercises.sit_intro')}</Text>

            <View style={styles.sitGrid}>
              {SITUATIONS.map((sit) => {
                const locked = sit.locked && !isPremium;
                return (
                  <TouchableOpacity
                    key={sit.id}
                    style={[styles.sitCard, locked && styles.sitCardLocked]}
                    onPress={() => handleSitTap(sit)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sitIcon}>{sit.icon}</Text>
                    <Text style={[styles.sitTitle, locked && styles.textLocked]}>
                      {t(`exercises.sit_${sit.id}`)}
                    </Text>
                    <Text style={styles.sitSub}>{t(`exercises.sit_${sit.id}_sub`)}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: DIFF_COLORS[sit.diff] + '22' }]}>
                      <Text style={[styles.diffText, { color: DIFF_COLORS[sit.diff] }]}>
                        {t(`exercises.level_${sit.diff}`)}
                      </Text>
                    </View>
                    {locked && (
                      <View style={styles.sitLock}>
                        <Text>👑</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Custom situation */}
              <TouchableOpacity
                style={styles.sitCustom}
                onPress={() => isPremium ? setShowCustomModal(true) : router.push('/paywall/premium')}
              >
                <Text style={styles.sitCustomText}>＋ {t('exercises.sit_custom')}</Text>
                {!isPremium && <Text style={{ fontSize: 14 }}>👑</Text>}
              </TouchableOpacity>
            </View>

            {!isPremium && (
              <TouchableOpacity
                style={styles.upsellBar}
                onPress={() => router.push('/paywall/premium')}
              >
                <Text style={styles.upsellText}>👑 {t('exercises.unlock_all')}</Text>
                <Text style={styles.upsellSub}>{t('exercises.unlock_all_sub')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 20, paddingBottom: 40, gap: 14 },
  screenTitle: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: Colors.surface.card2 },
  segmentText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
  },
  segmentTextActive: { color: Colors.text.primary },
  aiStrip: { gap: 6 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLabel: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    color: Colors.accent.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  aiText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  list: { gap: 10 },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
  },
  exCardLocked: { opacity: 0.75 },
  exIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIcon: { fontSize: 26 },
  exInfo: { flex: 1 },
  exTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  textLocked: { color: Colors.text.tertiary },
  exSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  levelDots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface.card2,
  },
  levelDotActive: { backgroundColor: Colors.accent.cyan },
  levelDotHard: { backgroundColor: Colors.premium.gold },
  minsText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.text.tertiary,
    marginLeft: 6,
  },
  lockBadge: {
    backgroundColor: Colors.premium.gold + '22',
    borderRadius: Radius.chip,
    padding: 8,
  },
  lockEmoji: { fontSize: 16 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: { color: Colors.text.primary, fontSize: 14, marginLeft: 2 },
  sitIntro: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  sitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sitCard: {
    width: (width - 50) / 2,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 16,
    gap: 6,
  },
  sitCardLocked: { opacity: 0.7 },
  sitIcon: { fontSize: 32 },
  sitTitle: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  sitSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  diffText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sitLock: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  sitCustom: {
    width: (width - 50) / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.premium.gold + '80',
    borderRadius: Radius.card,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    gap: 6,
  },
  sitCustomText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.premium.gold,
    textAlign: 'center',
  },
  upsellBar: {
    backgroundColor: Colors.premium.gold + '18',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.premium.gold + '40',
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  upsellText: {
    fontFamily: FontFamily.soraSemiBold,
    fontSize: FontSize.cardTitle,
    color: Colors.premium.gold,
  },
  upsellSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
});
