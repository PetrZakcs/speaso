import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTranslation } from '../i18n/useTranslation';
import { addDays, type DateKey } from '../lib/dates';
import type { CheckIn } from '../state/store';
import Card from './Card';
import { Colors, FontFamily, FontSize } from '../theme/tokens';

const DAYS = 14;
const H = 96;
const PAD = 8;

type Pt = { x: number; y: number };

/** Smooth curve through the points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(pts: Pt[]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
}

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Daily check-ins over the last 14 days as a smooth line, with the week-on-week change. */
export default function MoodChart({ checkIns, today }: { checkIns: CheckIn[]; today: DateKey }) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const days = useMemo(() => {
    const byDate = new Map(checkIns.map((c) => [c.date, c.mood]));
    return Array.from({ length: DAYS }, (_, i) => {
      const date = addDays(today, i - (DAYS - 1));
      return { date, mood: byDate.get(date) ?? null };
    });
  }, [checkIns, today]);

  const moods = (from: number, to: number) =>
    days.slice(from, to).flatMap((d) => (d.mood === null ? [] : [d.mood]));
  const avg = average(moods(0, DAYS));
  const thisWeek = average(moods(7, DAYS));
  const lastWeek = average(moods(0, 7));
  const delta = thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null;

  const pts: Pt[] = width
    ? days.flatMap((d, i) => (d.mood === null ? [] : [{
        x: PAD + (i / (DAYS - 1)) * (width - PAD * 2),
        y: PAD + (1 - (d.mood - 1) / 4) * (H - PAD * 2),
      }]))
    : [];
  const line = smoothPath(pts);
  const area = line && `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const last = pts[pts.length - 1];

  const deltaText = delta === null
    ? null
    : Math.abs(delta) < 0.05
      ? t('checkin.chart_change_same')
      : t(delta > 0 ? 'checkin.chart_change_up' : 'checkin.chart_change_down', { n: Math.abs(delta).toFixed(1) });

  return (
    <Card style={{ gap: 12 }}>
      <Text style={styles.title}>{t('checkin.chart_title')}</Text>
      {avg === null ? (
        <Text style={styles.empty}>{t('checkin.chart_empty')}</Text>
      ) : (
        <>
          <View style={styles.head} accessible accessibilityLabel={`${t('checkin.chart_avg', { n: avg.toFixed(1) })}${deltaText ? `, ${deltaText}` : ''}`}>
            <Text style={styles.big}>
              {avg.toFixed(1)}
              <Text style={styles.bigUnit}> / 5</Text>
            </Text>
            {deltaText && (
              <Text style={[styles.delta, delta !== null && delta < -0.05 && styles.deltaDown]}>
                {delta !== null && delta > 0.05 ? '↑ ' : delta !== null && delta < -0.05 ? '↓ ' : ''}
                {deltaText}
              </Text>
            )}
          </View>
          <View style={{ height: H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {width > 0 && (
              <Svg width={width} height={H}>
                <Defs>
                  <LinearGradient id="moodArea" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={Colors.accent.main} stopOpacity={0.22} />
                    <Stop offset="1" stopColor={Colors.accent.main} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {[1, 3, 5].map((m) => {
                  const y = PAD + (1 - (m - 1) / 4) * (H - PAD * 2);
                  return <Path key={m} d={`M0,${y} H${width}`} stroke={Colors.hairline} strokeWidth={1} strokeDasharray="3 5" />;
                })}
                {area ? <Path d={area} fill="url(#moodArea)" /> : null}
                {line ? <Path d={line} stroke={Colors.accent.main} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
                {pts.map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r={p === last ? 6 : 3} fill={p === last ? Colors.surface.card : Colors.accent.main} stroke={Colors.accent.main} strokeWidth={p === last ? 3 : 0} />
                ))}
              </Svg>
            )}
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
  title: { fontFamily: FontFamily.soraBold, fontSize: FontSize.cardTitle, color: Colors.text.primary },
  head: { gap: 2 },
  big: { fontFamily: FontFamily.soraExtraBold, fontSize: 34, letterSpacing: -1, color: Colors.text.primary },
  bigUnit: { fontFamily: FontFamily.soraSemiBold, fontSize: 16, letterSpacing: 0, color: Colors.text.tertiary },
  delta: { fontFamily: FontFamily.dmSansBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  deltaDown: { color: Colors.premium.main },
  empty: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, lineHeight: 20, color: Colors.text.secondary },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.tertiary },
});
