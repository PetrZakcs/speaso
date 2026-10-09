import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { addDays, fromDateKey, type DateKey } from '../lib/dates';
import type { CheckIn } from '../state/store';
import Card from './Card';
import { Colors, FontFamily, FontSize, Tints } from '../theme/tokens';

const DAYS = 14;
const MAX_H = 72;

/** Daily check-ins over the last 14 days; empty days stay as a faint stub. */
export default function MoodChart({ checkIns, today }: { checkIns: CheckIn[]; today: DateKey }) {
  const { t, lang } = useTranslation();
  const days = useMemo(() => {
    const byDate = new Map(checkIns.map((c) => [c.date, c.mood]));
    return Array.from({ length: DAYS }, (_, i) => {
      const date = addDays(today, i - (DAYS - 1));
      return { date, mood: byDate.get(date) ?? null };
    });
  }, [checkIns, today]);
  const answered = days.filter((d) => d.mood !== null);
  const avg = answered.length
    ? answered.reduce((sum, d) => sum + (d.mood ?? 0), 0) / answered.length
    : null;

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.head}>
        <Text style={styles.title}>{t('checkin.chart_title')}</Text>
        {avg !== null && <Text style={styles.avg}>{t('checkin.chart_avg', { n: avg.toFixed(1) })}</Text>}
      </View>
      {answered.length === 0 ? (
        <Text style={styles.empty}>{t('checkin.chart_empty')}</Text>
      ) : (
        <>
          <View style={styles.chart}>
            {days.map((d) => (
              <View
                key={d.date}
                style={styles.col}
                accessible
                accessibilityLabel={`${fromDateKey(d.date).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB')}: ${d.mood ? `${d.mood}/5` : '—'}`}
              >
                <View
                  style={[
                    styles.bar,
                    d.mood
                      ? { height: (d.mood / 5) * MAX_H, backgroundColor: Tints.lavender.fg, opacity: d.date === today ? 1 : 0.45 }
                      : styles.barEmpty,
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.axis}>
            <Text style={styles.axisText}>{t('checkin.chart_from')}</Text>
            <Text style={styles.axisText}>{t('common.today')}</Text>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.cardTitle, color: Colors.text.primary },
  avg: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Tints.lavender.fg },
  empty: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, lineHeight: 20, color: Colors.text.secondary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: MAX_H, gap: 4 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: MAX_H },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barEmpty: { height: 4, backgroundColor: Colors.surface.card2 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.tertiary },
});
