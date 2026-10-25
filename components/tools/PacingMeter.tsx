import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import CompanionAvatar from '../CompanionAvatar';
import { hapticTick, hapticSelect, hapticSuccess } from '../../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing, Tints } from '../../theme/tokens';

import { classifyWpm, calculateWpm, type PaceZone } from '../../lib/pacing';

export { classifyWpm, calculateWpm, type PaceZone };

export default function PacingMeter() {
  const { t } = useTranslation();
  const [taps, setTaps] = useState<number[]>([]);
  const [wpm, setWpm] = useState<number>(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zone = wpm > 0 ? classifyWpm(wpm) : 'calm';

  const handleTap = () => {
    hapticTick();
    const now = Date.now();
    setTaps((prev) => {
      // If last tap was more than 3 seconds ago, start a fresh burst
      const fresh = prev.length > 0 && now - prev[prev.length - 1] > 3000 ? [now] : [...prev, now];
      const newWpm = calculateWpm(fresh);
      setWpm(newWpm);
      if (newWpm >= 100 && newWpm <= 135 && fresh.length >= 4) {
        hapticSuccess();
      }
      return fresh;
    });

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    // After 5s of no taps, gently decay WPM to 0
    resetTimerRef.current = setTimeout(() => {
      setWpm(0);
      setTaps([]);
    }, 5000);
  };

  const handleReset = () => {
    hapticSelect();
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setTaps([]);
    setWpm(0);
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const getZoneColor = (z: PaceZone) => {
    switch (z) {
      case 'slow':
        return Tints.lavender.fg;
      case 'calm':
        return Colors.accent.main;
      case 'elevated':
        return Tints.peach.fg;
      case 'fast':
        return Colors.danger.panic;
    }
  };

  const getZoneBg = (z: PaceZone) => {
    switch (z) {
      case 'slow':
        return Tints.lavender.bg;
      case 'calm':
        return Colors.accent.soft;
      case 'elevated':
        return Tints.peach.bg;
      case 'fast':
        return Colors.danger.panic + '1F';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('pacing.title')}</Text>
          <Text style={styles.sub}>{t('pacing.sub')}</Text>
        </View>
        <CompanionAvatar
          size={42}
          variant="capybara"
          mood={zone === 'calm' && wpm > 0 ? 'listening' : zone === 'fast' ? 'breathing' : 'idle'}
        />
      </View>

      {/* Cadence Metric Gauge */}
      <View style={[styles.gaugeContainer, { backgroundColor: getZoneBg(zone) }]}>
        <Text style={[styles.wpmNumber, { color: getZoneColor(zone) }]}>
          {wpm > 0 ? wpm : '—'}
        </Text>
        <Text style={styles.wpmUnit}>{t('pacing.wpm_label')}</Text>

        <View style={[styles.zoneBadge, { backgroundColor: getZoneColor(zone) }]}>
          <Text style={styles.zoneBadgeText}>
            {wpm > 0 ? t(`pacing.zone_${zone}`) : t('pacing.zone_calm')}
          </Text>
        </View>
      </View>

      {/* Clinical Spectrum Bar */}
      <View style={styles.spectrumWrap}>
        <View style={styles.spectrumBar}>
          <View style={[styles.spectrumSegment, { backgroundColor: Tints.lavender.fg, flex: 1 }]} />
          <View style={[styles.spectrumSegment, { backgroundColor: Colors.accent.main, flex: 1.5 }]} />
          <View style={[styles.spectrumSegment, { backgroundColor: Tints.peach.fg, flex: 1 }]} />
          <View style={[styles.spectrumSegment, { backgroundColor: Colors.danger.panic, flex: 1 }]} />
        </View>
        <View style={styles.spectrumLabels}>
          <Text style={styles.spectrumText}>&lt; 100</Text>
          <Text style={[styles.spectrumText, { color: Colors.accent.main, fontFamily: FontFamily.dmSansBold }]}>
            100–135 ★
          </Text>
          <Text style={styles.spectrumText}>136–155</Text>
          <Text style={styles.spectrumText}>&gt; 155</Text>
        </View>
      </View>

      {/* Interactive Tap Cadence Button */}
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.8}
        style={[styles.tapButton, { borderColor: getZoneColor(zone) }]}
        accessibilityRole="button"
        accessibilityLabel={`${t('pacing.tap_instruction')}. Aktuální tempo: ${wpm} WPM`}
      >
        <Ionicons name="finger-print" size={28} color={getZoneColor(zone)} />
        <Text style={styles.tapButtonTitle}>{t('pacing.tap_instruction')}</Text>
        <Text style={styles.tapButtonSub}>
          {taps.length > 0 ? `${taps.length} ${taps.length === 1 ? 'úder' : 'úderů'}` : 'Začni klepat'}
        </Text>
      </TouchableOpacity>

      {/* Reset button */}
      {taps.length > 0 && (
        <TouchableOpacity
          onPress={handleReset}
          style={styles.resetBtn}
          accessibilityRole="button"
          accessibilityLabel={t('pacing.reset')}
        >
          <Ionicons name="refresh-outline" size={14} color={Colors.text.tertiary} />
          <Text style={styles.resetText}>{t('pacing.reset')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: Spacing.cardPad,
    gap: 14,
    ...Shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: Radius.cardSmall,
    gap: 4,
  },
  wpmNumber: {
    fontFamily: FontFamily.heading,
    fontSize: 48,
    lineHeight: 52,
  },
  wpmUnit: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  zoneBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  zoneBadgeText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.micro,
    color: '#FFFFFF',
  },
  spectrumWrap: {
    gap: 6,
  },
  spectrumBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  spectrumSegment: {
    height: '100%',
    borderRadius: 3,
  },
  spectrumLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  spectrumText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  tapButton: {
    backgroundColor: Colors.surface.card2,
    borderWidth: 2,
    borderRadius: Radius.cardSmall,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
  },
  tapButtonTitle: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  tapButtonSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.micro,
    color: Colors.text.tertiary,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
});
