import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import type { CheckIn } from '../state/store';
import Card from './Card';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../theme/tokens';

function avgMood(items: CheckIn[]) {
  if (items.length === 0) return null;
  return items.reduce((sum, c) => sum + c.mood, 0) / items.length;
}

export default function SpeechFactorsCard({ checkIns }: { checkIns: CheckIn[] }) {
  const { t } = useTranslation();

  const insights = useMemo(() => {
    const withSleep = checkIns.filter((c) => c.sleepHours !== undefined);
    const withWater = checkIns.filter((c) => c.waterGlasses !== undefined);

    const sleepGoodAvg = avgMood(withSleep.filter((c) => (c.sleepHours ?? 0) >= 7));
    const sleepPoorAvg = avgMood(withSleep.filter((c) => (c.sleepHours ?? 0) < 6));

    const waterGoodAvg = avgMood(withWater.filter((c) => (c.waterGlasses ?? 0) >= 6));
    const waterPoorAvg = avgMood(withWater.filter((c) => (c.waterGlasses ?? 0) < 4));

    const totalTracked = checkIns.filter(
      (c) => c.sleepHours !== undefined || c.waterGlasses !== undefined,
    ).length;

    return {
      totalTracked,
      sleepGoodAvg,
      sleepPoorAvg,
      waterGoodAvg,
      waterPoorAvg,
    };
  }, [checkIns]);

  return (
    <Card>
      <View style={styles.header}>
        <Ionicons name="analytics-outline" size={20} color={Colors.accent.main} />
        <Text style={styles.title}>{t('progress.factors_title')}</Text>
      </View>
      <Text style={styles.sub}>{t('progress.factors_sub')}</Text>

      {insights.totalTracked >= 3 ? (
        <View style={styles.factorsList}>
          {/* Sleep Factor */}
          {(insights.sleepGoodAvg !== null || insights.sleepPoorAvg !== null) && (
            <View style={styles.factorBlock}>
              <View style={styles.factorTop}>
                <Ionicons name="moon-outline" size={16} color={Colors.accent.main} />
                <Text style={styles.factorName}>{t('checkin.section_sleep')}</Text>
              </View>
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Text style={styles.compareLabel}>{t('progress.factor_sleep_good')}</Text>
                  <Text style={[styles.compareVal, styles.valGood]}>
                    {insights.sleepGoodAvg ? `${insights.sleepGoodAvg.toFixed(1)} / 5` : '—'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.compareItem}>
                  <Text style={styles.compareLabel}>{t('progress.factor_sleep_poor')}</Text>
                  <Text style={[styles.compareVal, styles.valPoor]}>
                    {insights.sleepPoorAvg ? `${insights.sleepPoorAvg.toFixed(1)} / 5` : '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Hydration Factor */}
          {(insights.waterGoodAvg !== null || insights.waterPoorAvg !== null) && (
            <View style={styles.factorBlock}>
              <View style={styles.factorTop}>
                <Ionicons name="water-outline" size={16} color={Colors.accent.main} />
                <Text style={styles.factorName}>{t('checkin.section_water')}</Text>
              </View>
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Text style={styles.compareLabel}>{t('progress.factor_water_good')}</Text>
                  <Text style={[styles.compareVal, styles.valGood]}>
                    {insights.waterGoodAvg ? `${insights.waterGoodAvg.toFixed(1)} / 5` : '—'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.compareItem}>
                  <Text style={styles.compareLabel}>{t('progress.factor_water_poor')}</Text>
                  <Text style={[styles.compareVal, styles.valPoor]}>
                    {insights.waterPoorAvg ? `${insights.waterPoorAvg.toFixed(1)} / 5` : '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.text.tertiary} />
          <Text style={styles.infoText}>{t('progress.factors_hint')}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginTop: 4,
  },
  factorsList: {
    gap: 14,
    marginTop: 12,
  },
  factorBlock: {
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    padding: 12,
    gap: 8,
  },
  factorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factorName: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareItem: {
    flex: 1,
    gap: 2,
  },
  compareLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.micro,
    color: Colors.text.tertiary,
  },
  compareVal: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.body,
  },
  valGood: {
    color: Colors.accent.main,
  },
  valPoor: {
    color: Colors.danger.panic,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.hairline,
    marginHorizontal: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface.card2,
    padding: 12,
    borderRadius: Radius.cardSmall,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
});
