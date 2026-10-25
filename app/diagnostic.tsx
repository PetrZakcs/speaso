import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore, useShallow } from '../state/store';
import { calculateDiagnosticProfile } from '../lib/diagnostic';
import { exportReport } from '../lib/report';
import IconButton from '../components/IconButton';
import Card from '../components/Card';
import ProgressRing from '../components/ProgressRing';
import CompanionAvatar from '../components/CompanionAvatar';
import ZeroCloudBadge from '../components/ZeroCloudBadge';
import TherapistConnectModal from '../components/TherapistConnectModal';
import { hapticPress, hapticSuccess } from '../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow, Tints } from '../theme/tokens';

export default function DiagnosticScreen() {
  const { t, lang } = useTranslation();
  const { user, isPremium } = useStore(
    useShallow((s) => ({
      user: s.user,
      isPremium: s.subscription.isPremium,
    }))
  );

  const [exporting, setExporting] = useState(false);
  const [therapistModalVisible, setTherapistModalVisible] = useState(false);

  const profile = calculateDiagnosticProfile(user, lang);

  const handleExportPdf = async () => {
    if (!isPremium) {
      router.push({ pathname: '/paywall', params: { context: 'pdf' } });
      return;
    }
    setExporting(true);
    try {
      await exportReport(lang);
      hapticSuccess();
    } catch (e) {
      console.warn('[diagnostic] export failed:', e);
      Alert.alert(t('report.title'), t('report.error'));
    } finally {
      setExporting(false);
    }
  };

  const startRecommendedPractice = () => {
    hapticPress();
    router.push('/exercise/soft-onset');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="close" size={36} onPress={() => router.back()} accessibilityLabel={t('common.close')} />
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('diagnostic.screen_kicker')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title & Privacy Badge */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{t('diagnostic.screen_title')}</Text>
          <Text style={styles.sub}>{t('diagnostic.screen_sub')}</Text>
          <ZeroCloudBadge compact style={{ alignSelf: 'flex-start', marginTop: 6 }} />
        </View>

        {/* Mascot Message Card */}
        <Card style={styles.companionCard}>
          <CompanionAvatar size={48} variant="capybara" mood="wisdom" />
          <View style={{ flex: 1 }}>
            <Text style={styles.companionGreeting}>{t('diagnostic.companion_greeting')}</Text>
            <Text style={styles.companionNote}>
              {t('diagnostic.score_hint')}
            </Text>
          </View>
        </Card>

        {/* Somatic Tension Index Gauge */}
        <Card style={styles.gaugeCard}>
          <Text style={styles.sectionHeading}>{t('diagnostic.score_label')}</Text>
          <View style={styles.gaugeRow}>
            <ProgressRing
              size={112}
              stroke={10}
              progress={profile.tensionScore / 100}
              color={profile.tensionScore > 75 ? Colors.danger.panic : Colors.accent.main}
              track={Colors.surface.card2}
            >
              <Text style={styles.gaugeScore}>{profile.tensionScore}</Text>
              <Text style={styles.gaugeMax}>/ 100</Text>
            </ProgressRing>

            <View style={styles.gaugeInfo}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      profile.tensionScore > 75
                        ? Colors.danger.panic + '1A'
                        : Colors.accent.main + '1A',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        profile.tensionScore > 75 ? Colors.danger.panic : Colors.accent.main,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        profile.tensionScore > 75 ? Colors.danger.panic : Colors.accent.main,
                    },
                  ]}
                >
                  {t('diagnostic.score_level_elevated')}
                </Text>
              </View>
              <Text style={styles.gaugeDescription}>{t('diagnostic.score_hint')}</Text>
            </View>
          </View>
        </Card>

        {/* Vocal Friction Centers */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('diagnostic.friction_areas_title')}</Text>
          <View style={styles.frictionList}>
            {profile.vocalFrictionAreas.map((area) => (
              <View key={area.id} style={styles.frictionItem}>
                <View style={styles.frictionIconWrap}>
                  <Ionicons name={area.icon as any} size={22} color={Colors.accent.main} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.frictionTitle}>{t(area.titleKey)}</Text>
                  <Text style={styles.frictionDesc}>{t(area.descKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Top Triggers */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('diagnostic.triggers_title')}</Text>
          {profile.primaryTriggers.length > 0 ? (
            <View style={styles.triggersWrap}>
              {profile.primaryTriggers.map((trig) => (
                <View key={trig.id} style={styles.triggerChip}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.accent.main} />
                  <Text style={styles.triggerText}>{trig.title}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyTriggerText}>{t('diagnostic.triggers_empty')}</Text>
          )}
        </Card>

        {/* 30-Day Clinical Projection Timeline */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('diagnostic.projection_title')}</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{t('diagnostic.timeline_day1_label')}</Text>
                <Text style={styles.timelineBody}>{t('diagnostic.timeline_day1_desc')}</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{t('diagnostic.timeline_day14_label')}</Text>
                <Text style={styles.timelineBody}>{t('diagnostic.timeline_day14_desc')}</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotGoal]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: Colors.accent.main }]}>
                  {t('diagnostic.timeline_day30_label')}
                </Text>
                <Text style={styles.timelineBody}>
                  {t('diagnostic.timeline_day30_desc', { pct: profile.projectedBlockReductionPct })}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Clinical Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={startRecommendedPractice}
            accessibilityRole="button"
            accessibilityLabel={t('diagnostic.start_practice')}
          >
            <Ionicons name="play-circle" size={20} color={Colors.accent.on} />
            <Text style={styles.primaryBtnText}>{t('diagnostic.start_practice')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleExportPdf}
            disabled={exporting}
            accessibilityRole="button"
            accessibilityLabel={t('diagnostic.export_pdf')}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <Ionicons name="document-text-outline" size={18} color={Colors.text.primary} />
            )}
            <Text style={styles.secondaryBtnText}>{t('diagnostic.export_pdf')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              hapticPress();
              setTherapistModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('diagnostic.connect_therapist')}
          >
            <Ionicons name="people-outline" size={18} color={Colors.accent.main} />
            <Text style={styles.ghostBtnText}>{t('diagnostic.connect_therapist')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TherapistConnectModal
        visible={therapistModalVisible}
        onClose={() => setTherapistModalVisible(false)}
      />
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
  headerTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scroll: {
    padding: Spacing.screenH,
    paddingBottom: 48,
    gap: 16,
  },
  titleBlock: {
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 26,
    color: Colors.text.primary,
    lineHeight: 32,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  companionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Tints.sage.bg,
    borderColor: Colors.accent.main + '25',
    borderWidth: 1,
  },
  companionGreeting: {
    fontFamily: FontFamily.heading,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  companionNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  gaugeCard: {
    gap: 14,
  },
  sectionHeading: {
    fontFamily: FontFamily.heading,
    fontSize: 17,
    color: Colors.text.primary,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  gaugeScore: {
    fontFamily: FontFamily.heading,
    fontSize: 32,
    color: Colors.text.primary,
  },
  gaugeMax: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: -2,
  },
  gaugeInfo: {
    flex: 1,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.meta,
  },
  gaugeDescription: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  sectionCard: {
    gap: 12,
  },
  frictionList: {
    gap: 12,
  },
  frictionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface.card2,
    padding: 12,
    borderRadius: Radius.cardSmall,
  },
  frictionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  frictionTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  frictionDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  triggersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  triggerText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
  emptyTriggerText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  timeline: {
    gap: 4,
    paddingVertical: 6,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.accent.main,
    backgroundColor: Colors.surface.card,
    marginTop: 2,
  },
  timelineDotActive: {
    backgroundColor: Colors.accent.main,
  },
  timelineDotGoal: {
    backgroundColor: Colors.accent.main,
    borderColor: Colors.accent.main,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.surface.card2,
    marginLeft: 6,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  timelineBody: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.main,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  primaryBtnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.accent.on,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface.card,
    borderColor: Colors.surface.card2,
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  ghostBtnText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
});
