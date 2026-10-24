import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { textsFor } from '../../content/texts';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';
import { hapticPress, hapticSelect, hapticSuccess, hapticTick } from '../../lib/haptics';
import CompanionAvatar from '../CompanionAvatar';
import MirrorView from './MirrorView';

const SPEEDS = [
  { wpm: 65, key: 'reading.pacer_calm' },
  { wpm: 95, key: 'reading.pacer_steady' },
  { wpm: 125, key: 'reading.pacer_flow' },
] as const;

/** A text from the library to read aloud, with difficulty, shuffle and interactive Pacing Guide. */
export default function ReadingPanel({ initialLevel = 1 }: { initialLevel?: 1 | 2 | 3 }) {
  const { t, lang } = useTranslation();
  const ageGroup = useStore((s) => s.user.ageGroup);
  const [level, setLevel] = useState<1 | 2 | 3>(initialLevel);
  const [index, setIndex] = useState(0);

  // Pacing Guide state
  const [pacingActive, setPacingActive] = useState(false);
  const [wpm, setWpm] = useState<number>(95);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mirrorActive, setMirrorActive] = useState(false);

  const texts = textsFor(ageGroup, level);
  const text = texts[index % texts.length];

  const words = useMemo(() => {
    if (!text) return [];
    return text.body[lang].split(/\s+/).filter(Boolean);
  }, [text, lang]);

  const selectLevel = (l: 1 | 2 | 3) => {
    setLevel(l);
    setIndex(0);
    setActiveWordIndex(0);
    setIsPlaying(false);
    setIsCompleted(false);
  };

  const nextText = () => {
    setIndex((i) => i + 1);
    setActiveWordIndex(0);
    setIsPlaying(false);
    setIsCompleted(false);
  };

  // Pacer timer loop
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pacingActive || !isPlaying || words.length === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const intervalMs = Math.round(60000 / wpm);

    const step = () => {
      setActiveWordIndex((prev) => {
        if (prev >= words.length - 1) {
          setIsPlaying(false);
          setIsCompleted(true);
          hapticSuccess();
          return prev;
        }
        hapticTick();
        return prev + 1;
      });
      timerRef.current = setTimeout(step, intervalMs);
    };

    timerRef.current = setTimeout(step, intervalMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pacingActive, isPlaying, wpm, words.length]);

  const togglePacing = () => {
    hapticPress();
    setPacingActive((prev) => {
      const next = !prev;
      if (!next) {
        setIsPlaying(false);
      }
      return next;
    });
  };

  const togglePlay = () => {
    hapticPress();
    if (isCompleted) {
      setActiveWordIndex(0);
      setIsCompleted(false);
    }
    setIsPlaying((p) => !p);
  };

  const resetPacer = () => {
    hapticPress();
    setIsPlaying(false);
    setActiveWordIndex(0);
    setIsCompleted(false);
  };

  const handleWordPress = (wordIdx: number) => {
    hapticSelect();
    setActiveWordIndex(wordIdx);
    setIsCompleted(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.levels} accessibilityRole="radiogroup">
          {([1, 2, 3] as const).map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => selectLevel(l)}
              style={[styles.level, level === l && styles.levelActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: level === l }}
              accessibilityLabel={t('exercises.level', { n: l })}
            >
              <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              hapticPress();
              setMirrorActive((m) => !m);
            }}
            style={[styles.pacerToggle, mirrorActive && styles.pacerToggleActive]}
            accessibilityRole="button"
            accessibilityLabel={t('mirror.toggle')}
          >
            <Ionicons
              name={mirrorActive ? 'videocam' : 'videocam-outline'}
              size={14}
              color={mirrorActive ? Colors.accent.on : Colors.accent.main}
            />
            <Text style={[styles.pacerToggleText, mirrorActive && styles.pacerToggleTextActive]}>
              {t('mirror.toggle')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePacing}
            style={[styles.pacerToggle, pacingActive && styles.pacerToggleActive]}
            accessibilityRole="button"
            accessibilityLabel={t('reading.pacer_toggle')}
          >
            <Ionicons
              name={pacingActive ? 'speedometer' : 'speedometer-outline'}
              size={14}
              color={pacingActive ? Colors.accent.on : Colors.accent.main}
            />
            <Text style={[styles.pacerToggleText, pacingActive && styles.pacerToggleTextActive]}>
              {t('reading.pacer_toggle')}
            </Text>
          </TouchableOpacity>

          {texts.length > 1 && (
            <TouchableOpacity
              onPress={nextText}
              style={styles.another}
              accessibilityRole="button"
            >
              <Ionicons name="shuffle" size={14} color={Colors.accent.main} />
              <Text style={styles.anotherText}>{t('reading.another')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pacing Guide Bar */}
      {pacingActive && (
        <View style={styles.pacerContainer}>
          <View style={styles.pacerTopRow}>
            <View style={styles.companionSlot}>
              <CompanionAvatar
                size={34}
                variant="capybara"
                mood={isPlaying ? 'listening' : isCompleted ? 'celebrate' : 'idle'}
              />
              <View>
                <Text style={styles.pacerKicker}>{t('reading.pacer_sub')}</Text>
                <Text style={styles.pacerCounter}>
                  {activeWordIndex + 1} / {words.length}
                </Text>
              </View>
            </View>

            <View style={styles.pacerControls}>
              {activeWordIndex > 0 && (
                <TouchableOpacity
                  onPress={resetPacer}
                  style={styles.pacerBtnSecondary}
                  accessibilityRole="button"
                  accessibilityLabel={t('reading.pacer_reset')}
                >
                  <Ionicons name="refresh" size={15} color={Colors.text.secondary} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={togglePlay}
                style={styles.pacerPlayBtn}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? t('reading.pacer_pause') : t('reading.pacer_start')}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={16}
                  color={Colors.accent.on}
                />
                <Text style={styles.pacerPlayText}>
                  {isPlaying ? t('reading.pacer_pause') : t('reading.pacer_start')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Speed Presets */}
          <View style={styles.speedRow}>
            {SPEEDS.map((s) => (
              <TouchableOpacity
                key={s.wpm}
                onPress={() => {
                  hapticSelect();
                  setWpm(s.wpm);
                }}
                style={[styles.speedChip, wpm === s.wpm && styles.speedChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: wpm === s.wpm }}
              >
                <Text style={[styles.speedText, wpm === s.wpm && styles.speedTextActive]}>
                  {t(s.key)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Celebratory Banner */}
          {isCompleted && (
            <View style={styles.doneBanner}>
              <Ionicons name="sparkles" size={16} color={Colors.accent.main} />
              <Text style={styles.doneText}>{t('reading.pacer_done')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Mirror Biofeedback Preview */}
      {mirrorActive && (
        <MirrorView
          compact
          onClose={() => setMirrorActive(false)}
        />
      )}

      {text && (
        <>
          <Text style={styles.title}>{text.title[lang]}</Text>

          {pacingActive ? (
            <View style={styles.wordsWrap}>
              {words.map((word, wIdx) => {
                const isActive = wIdx === activeWordIndex;
                const isPast = wIdx < activeWordIndex;
                return (
                  <TouchableOpacity
                    key={`${wIdx}-${word}`}
                    onPress={() => handleWordPress(wIdx)}
                    activeOpacity={0.7}
                    style={[
                      styles.wordItem,
                      isActive && styles.wordItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.wordText,
                        isActive && styles.wordTextActive,
                        isPast && styles.wordTextPast,
                      ]}
                    >
                      {word}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.body} selectable>
              {text.body[lang]}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  levels: { flexDirection: 'row', gap: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pacerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent.soft,
  },
  pacerToggleActive: {
    backgroundColor: Colors.accent.main,
  },
  pacerToggleText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  pacerToggleTextActive: {
    color: Colors.accent.on,
  },
  level: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelActive: { backgroundColor: Colors.accent.main },
  levelText: { fontFamily: FontFamily.dmSansBold, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  levelTextActive: { color: Colors.accent.on },
  another: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  anotherText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.cardTitle, color: Colors.text.primary },
  body: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 19,
    lineHeight: 30,
    color: Colors.text.primary,
  },
  // Pacer Container
  pacerContainer: {
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.card,
    padding: 12,
    gap: 10,
  },
  pacerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companionSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pacerKicker: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
  pacerCounter: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  pacerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pacerBtnSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pacerPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent.main,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  pacerPlayText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.meta,
    color: Colors.accent.on,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 6,
  },
  speedChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedChipActive: {
    backgroundColor: Colors.accent.main,
  },
  speedText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  speedTextActive: {
    fontFamily: FontFamily.dmSansBold,
    color: Colors.accent.on,
  },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.chip,
  },
  doneText: {
    flex: 1,
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  // Words flow
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: 4,
    rowGap: 6,
    columnGap: 4,
  },
  wordItem: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wordItemActive: {
    backgroundColor: Colors.accent.main,
    transform: [{ scale: 1.05 }],
  },
  wordText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 19,
    lineHeight: 28,
    color: Colors.text.primary,
  },
  wordTextActive: {
    fontFamily: FontFamily.dmSansBold,
    color: Colors.accent.on,
  },
  wordTextPast: {
    color: Colors.text.tertiary,
  },
});

