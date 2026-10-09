import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { useStore, useShallow } from '../state/store';
import { hapticSelect } from '../lib/haptics';
import type { Rating } from '../lib/streak';
import type { DateKey } from '../lib/dates';
import { Colors, FontFamily, FontSize, Radius, Shadow, Tints } from '../theme/tokens';

const SCALE: Rating[] = [1, 2, 3, 4, 5];

/** "How is speaking today?" — one tap a day; collapses once answered. */
export default function CheckInCard({ today }: { today: DateKey }) {
  const { t } = useTranslation();
  const { checkIn, setCheckIn } = useStore(useShallow((s) => ({
    checkIn: s.checkIns.find((c) => c.date === today),
    setCheckIn: s.setCheckIn,
  })));
  const [editing, setEditing] = useState(false);

  if (checkIn && !editing) {
    return (
      <View style={[styles.card, styles.compact]}>
        <View style={styles.moodBadge}>
          <Text style={styles.moodBadgeText}>{checkIn.mood}</Text>
        </View>
        <Text style={styles.compactText}>
          {t('checkin.today', { mood: t(`rating.level_${checkIn.mood}`).toLowerCase() })}
        </Text>
        <TouchableOpacity onPress={() => setEditing(true)} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.change}>{t('checkin.change')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('checkin.question')}</Text>
      <View style={styles.scale} accessibilityRole="radiogroup">
        {SCALE.map((m) => {
          const active = checkIn?.mood === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => {
                hapticSelect();
                setCheckIn(m);
                setEditing(false);
              }}
              style={[styles.dot, active && styles.dotActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={t(`rating.level_${m}`)}
            >
              <Text style={[styles.dotText, active && styles.dotTextActive]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.ends}>
        <Text style={styles.endText}>{t('rating.level_1')}</Text>
        <Text style={styles.endText}>{t('rating.level_5')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 12,
    ...Shadow.card,
  },
  title: { fontFamily: FontFamily.soraSemiBold, fontSize: 17, color: Colors.text.primary },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Tints.lavender.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: Tints.lavender.fg },
  dotText: { fontFamily: FontFamily.soraSemiBold, fontSize: 18, color: Tints.lavender.fg },
  dotTextActive: { color: '#FFFFFF' },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  endText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.tertiary },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  moodBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Tints.lavender.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadgeText: { fontFamily: FontFamily.soraSemiBold, fontSize: FontSize.body, color: Tints.lavender.fg },
  compactText: { flex: 1, fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.body, color: Colors.text.primary },
  change: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
});
