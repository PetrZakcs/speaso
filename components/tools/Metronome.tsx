import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useTranslation } from '../../i18n/useTranslation';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

const CLICK = require('../../assets/sounds/click.wav');
const MIN_BPM = 40;
const MAX_BPM = 140;
const PRESETS = [60, 80, 100];

/**
 * Speech metronome: say one syllable per beat. JS timer with drift
 * correction — precise enough for pacing speech (not for music).
 */
export default function Metronome() {
  const { t } = useTranslation();
  const [bpm, setBpm] = useState(70);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const players = useRef<AudioPlayer[]>([]);
  const soundRef = useRef(soundOn);
  const pulse = useSharedValue(1);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  // Two players alternate so a click is never cut off by the next one.
  useEffect(() => {
    players.current = [createAudioPlayer(CLICK), createAudioPlayer(CLICK)];
    return () => {
      players.current.forEach((p) => p.remove());
      players.current = [];
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = 60000 / bpm;
    let beat = 0;
    let expected = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      pulse.set(withSequence(withTiming(1.18, { duration: 60 }), withTiming(1, { duration: 220 })));
      if (soundRef.current) {
        const p = players.current[beat % players.current.length];
        if (p) {
          p.seekTo(0);
          p.play();
        }
      }
      beat += 1;
      expected += interval;
      timer = setTimeout(tick, Math.max(0, expected - Date.now()));
    };
    tick();
    return () => clearTimeout(timer);
  }, [running, bpm, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const changeBpm = (delta: number) => setBpm((b) => Math.min(MAX_BPM, Math.max(MIN_BPM, b + delta)));

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <TouchableOpacity
          onPress={() => changeBpm(-5)}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel={t('metronome.slower')}
        >
          <Ionicons name="remove" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRunning((r) => !r)}
          accessibilityRole="button"
          accessibilityLabel={running ? t('metronome.stop') : t('metronome.start')}
        >
          <Animated.View style={[styles.beat, running && styles.beatRunning, pulseStyle]}>
            <Text style={styles.bpm}>{bpm}</Text>
            <Text style={styles.bpmLabel}>{t('metronome.bpm')}</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => changeBpm(5)}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel={t('metronome.faster')}
        >
          <Ionicons name="add" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>{running ? t('metronome.hint_running') : t('metronome.hint')}</Text>

      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setBpm(p)}
            style={[styles.chip, bpm === p && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: bpm === p }}
          >
            <Text style={[styles.chipText, bpm === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => setSoundOn((s) => !s)}
          style={styles.chip}
          accessibilityRole="switch"
          accessibilityState={{ checked: soundOn }}
          accessibilityLabel={t('metronome.sound')}
        >
          <Ionicons
            name={soundOn ? 'volume-high' : 'volume-mute'}
            size={16}
            color={soundOn ? Colors.text.primary : Colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 18,
    gap: 14,
    alignItems: 'center',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beat: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.surface.card2,
    borderWidth: 2,
    borderColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beatRunning: { backgroundColor: Colors.primary.blue },
  bpm: { fontFamily: FontFamily.soraBold, fontSize: 34, color: Colors.text.primary },
  bpmLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.micro,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  presets: { flexDirection: 'row', gap: 8 },
  chip: {
    minWidth: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.primary.blue },
  chipText: { fontFamily: FontFamily.dmSansBold, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  chipTextActive: { color: Colors.text.primary },
});
