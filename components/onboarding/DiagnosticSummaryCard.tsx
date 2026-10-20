import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore, useShallow } from '../../state/store';
import { calculateDiagnosticProfile } from '../../lib/diagnostic';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';

export default function DiagnosticSummaryCard() {
  const { t, lang } = useTranslation();
  const user = useStore(useShallow((s) => s.user));
  const profile = calculateDiagnosticProfile(user, lang);

  return (
    <View style={[styles.card, Shadow.card]}>
      {/* Header: Tension Index Score */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNumber}>{profile.tensionScore}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>{t('diagnostic.score_label')}</Text>
          <Text style={styles.scoreLevel}>{t('diagnostic.score_level_elevated')}</Text>
        </View>
      </View>

      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${profile.tensionScore}%` }]} />
      </View>
      <Text style={styles.meterHint}>{t('diagnostic.score_hint')}</Text>

      <View style={styles.divider} />

      {/* Identified Vocal Friction Areas */}
      <Text style={styles.sectionTitle}>{t('diagnostic.friction_areas_title')}</Text>
      <View style={styles.areasList}>
        {profile.vocalFrictionAreas.map((area) => (
          <View key={area.id} style={styles.areaRow}>
            <View style={styles.areaIconWrap}>
              <Ionicons name={area.icon as any} size={18} color={Colors.accent.main} />
            </View>
            <View style={styles.areaText}>
              <Text style={styles.areaTitle}>{t(area.titleKey)}</Text>
              <Text style={styles.areaDesc}>{t(area.descKey)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* 30-Day Somatic Recovery Curve */}
      <Text style={styles.sectionTitle}>{t('diagnostic.projection_title')}</Text>
      <View style={styles.timeline}>
        <View style={styles.timelineStep}>
          <View style={[styles.timelineDot, styles.dotDay1]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDay}>{t('diagnostic.timeline_day1_label')}</Text>
            <Text style={styles.timelineText}>{t('diagnostic.timeline_day1_desc')}</Text>
          </View>
        </View>

        <View style={styles.timelineConnector} />

        <View style={styles.timelineStep}>
          <View style={[styles.timelineDot, styles.dotDay14]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDay}>{t('diagnostic.timeline_day14_label')}</Text>
            <Text style={styles.timelineText}>{t('diagnostic.timeline_day14_desc')}</Text>
          </View>
        </View>

        <View style={styles.timelineConnector} />

        <View style={styles.timelineStep}>
          <View style={[styles.timelineDot, styles.dotDay30]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDay}>{t('diagnostic.timeline_day30_label')}</Text>
            <Text style={styles.timelineText}>
              {t('diagnostic.timeline_day30_desc', { pct: profile.projectedBlockReductionPct })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Risk-Reversal Trust Row */}
      <View style={styles.trustBox}>
        <View style={styles.trustItem}>
          <Ionicons name="notifications-outline" size={16} color={Colors.accent.main} />
          <Text style={styles.trustText}>{t('diagnostic.guarantee_reminder')}</Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={Colors.accent.main} />
          <Text style={styles.trustText}>{t('diagnostic.guarantee_cancel')}</Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.accent.main} />
          <Text style={styles.trustText}>{t('diagnostic.guarantee_privacy')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.accent.soft,
    gap: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.cardSmall,
  },
  scoreNumber: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    color: Colors.accent.main,
  },
  scoreMax: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    marginLeft: 2,
  },
  scoreInfo: {
    flex: 1,
    gap: 2,
  },
  scoreLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  scoreLevel: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  meterTrack: {
    height: 8,
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: Colors.accent.main,
    borderRadius: Radius.pill,
  },
  meterHint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surface.card2,
  },
  sectionTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  areasList: {
    gap: 12,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  areaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  areaText: {
    flex: 1,
    gap: 2,
  },
  areaTitle: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  areaDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  timeline: {
    gap: 8,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  dotDay1: {
    backgroundColor: '#F87171',
  },
  dotDay14: {
    backgroundColor: '#FBBF24',
  },
  dotDay30: {
    backgroundColor: Colors.accent.main,
  },
  timelineConnector: {
    width: 2,
    height: 14,
    backgroundColor: Colors.surface.card2,
    marginLeft: 5,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineDay: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
  timelineText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
  trustBox: {
    backgroundColor: Colors.accent.soft,
    borderRadius: Radius.cardSmall,
    padding: 12,
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
});
