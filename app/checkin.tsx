import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore, type WeatherType } from '../state/store';
import { useToday } from '../lib/useToday';
import { hapticPress, hapticSuccess } from '../lib/haptics';
import { syncResearchCheckIn } from '../lib/research';
import { trackEvent } from '../lib/analytics';
import type { Rating } from '../lib/streak';
import CalmBackground from '../components/calm/CalmBackground';
import MoodSlider, { MOOD_GRADIENT } from '../components/calm/MoodSlider';
import { Calm, FontFamily, FontSize, Radius, Spacing } from '../theme/tokens';

const SLEEP_OPTIONS = [4, 5, 6, 7, 8, 9];
const WEATHER_OPTIONS: { id: WeatherType; icon: React.ComponentProps<typeof Ionicons>['name']; key: string }[] = [
  { id: 'sunny', icon: 'sunny-outline', key: 'checkin.weather_sunny' },
  { id: 'cloudy', icon: 'partly-sunny-outline', key: 'checkin.weather_cloudy' },
  { id: 'rain', icon: 'rainy-outline', key: 'checkin.weather_rain' },
  { id: 'storm', icon: 'thunderstorm-outline', key: 'checkin.weather_storm' },
  { id: 'cold', icon: 'snow-outline', key: 'checkin.weather_cold' },
];

const TAG_OPTIONS: { id: string; key: string; icon: React.ComponentProps<typeof Ionicons>['name']; isTension?: boolean }[] = [
  { id: 'throat_tension', key: 'checkin.tag_throat_tension', icon: 'mic-outline', isTension: true },
  { id: 'jaw_tension', key: 'checkin.tag_jaw_tension', icon: 'body-outline', isTension: true },
  { id: 'chest_tightness', key: 'checkin.tag_chest_tightness', icon: 'fitness-outline', isTension: true },
  { id: 'body_relaxed', key: 'checkin.tag_body_relaxed', icon: 'leaf-outline' },
  { id: 'speech_blocks', key: 'checkin.tag_speech_blocks', icon: 'pause-circle-outline', isTension: true },
  { id: 'fast_pace', key: 'checkin.tag_fast_pace', icon: 'speedometer-outline', isTension: true },
  { id: 'fluent_speech', key: 'checkin.tag_fluent_speech', icon: 'sparkles-outline' },
  { id: 'social_anxiety', key: 'checkin.tag_social_anxiety', icon: 'alert-circle-outline', isTension: true },
];

export default function CheckInScreen() {
  const { t } = useTranslation();
  const today = useToday();
  const existing = useStore((s) => s.checkIns.find((c) => c.date === today));
  const setCheckIn = useStore((s) => s.setCheckIn);

  const [mood, setMood] = useState<Rating>(existing?.mood ?? 3);
  const [sleepHours, setSleepHours] = useState<number | undefined>(existing?.sleepHours ?? 7);
  const [waterGlasses, setWaterGlasses] = useState<number>(existing?.waterGlasses ?? 6);
  const [weather, setWeather] = useState<WeatherType | undefined>(existing?.weather ?? 'sunny');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [note, setNote] = useState<string>(existing?.note ?? '');

  const label = t(`rating.level_${mood}`);
  const liters = (waterGlasses * 0.25).toFixed(1);
  const hasTension = tags.some((id) => TAG_OPTIONS.find((opt) => opt.id === id)?.isTension);

  const toggleTag = (id: string) => {
    hapticPress();
    setTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = () => {
    hapticSuccess();
    const entry = {
      date: today,
      mood,
      sleepHours,
      waterGlasses,
      weather,
      tags,
      note,
    };
    setCheckIn(entry);
    syncResearchCheckIn(entry);
    trackEvent('checkin_logged', { mood, sleep: sleepHours, water: waterGlasses, weather, tagsCount: tags.length });
    router.back();
  };

  const adjustWater = (delta: number) => {
    hapticPress();
    setWaterGlasses((prev) => Math.max(0, Math.min(20, prev + delta)));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CalmBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={22} color={Calm.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('checkin.kicker')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {/* Section 1: Mood */}
            <View style={styles.card}>
              <Text style={styles.cardTitle} accessibilityRole="header">{t('checkin.question')}</Text>
              <Text style={styles.sub}>{t('checkin.screen_sub')}</Text>

              <View style={styles.valueWrap}>
                <View style={[styles.valueDot, { backgroundColor: MOOD_GRADIENT[mood - 1] }]}>
                  <Text style={styles.valueNum}>{mood}</Text>
                </View>
                <Text style={styles.valueLabel}>{label}</Text>
              </View>

              <MoodSlider
                value={mood}
                onChange={setMood}
                accessibilityLabel={t('checkin.slider_a11y')}
                valueLabel={label}
              />
              <View style={styles.ends}>
                <Text style={styles.endText}>{t('rating.level_1')}</Text>
                <Text style={styles.endText}>{t('rating.level_5')}</Text>
              </View>
            </View>

            {/* Section 2: Somatic Tension & Speech Factors */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="body-outline" size={20} color={Calm.accent} />
                <Text style={styles.cardTitle}>{t('checkin.section_tags')}</Text>
              </View>
              <View style={styles.tagsGrid}>
                {TAG_OPTIONS.map((opt) => {
                  const active = tags.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => toggleTag(opt.id)}
                      style={[styles.tagChip, active && styles.tagChipActive]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={active ? Calm.bgFrom : Calm.accent}
                      />
                      <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                        {t(opt.key)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {hasTension && (
                <View style={styles.hintWrap}>
                  <Ionicons name="bulb-outline" size={16} color={Calm.accent} />
                  <Text style={styles.hintText}>{t('checkin.tag_hint_tension')}</Text>
                </View>
              )}
            </View>

            {/* Section 3: Sleep */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="moon-outline" size={20} color={Calm.accent} />
                <Text style={styles.cardTitle}>{t('checkin.section_sleep')}</Text>
              </View>
              <View style={styles.chipsRow} accessibilityRole="radiogroup">
                {SLEEP_OPTIONS.map((h) => {
                  const active = sleepHours === h;
                  const chipLabel = h === 9 ? '9h+' : `${h}h`;
                  return (
                    <TouchableOpacity
                      key={h}
                      onPress={() => {
                        hapticPress();
                        setSleepHours(h);
                      }}
                      style={[styles.chip, active && styles.chipActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{chipLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Hydration */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="water-outline" size={20} color={Calm.accent} />
                <Text style={styles.cardTitle}>{t('checkin.section_water')}</Text>
              </View>
              <Text style={styles.waterSub}>
                {t('checkin.water_glasses', { n: waterGlasses, liters })}
              </Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => adjustWater(-1)}
                  style={styles.stepBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Méně vody"
                >
                  <Ionicons name="remove" size={22} color={Calm.text} />
                </TouchableOpacity>
                <View style={styles.waterCountWrap}>
                  <Text style={styles.waterCountNum}>{waterGlasses}</Text>
                  <Ionicons name="water" size={16} color={Calm.accent} />
                </View>
                <TouchableOpacity
                  onPress={() => adjustWater(1)}
                  style={styles.stepBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Více vody"
                >
                  <Ionicons name="add" size={22} color={Calm.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 4: Weather */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="partly-sunny-outline" size={20} color={Calm.accent} />
                <Text style={styles.cardTitle}>{t('checkin.section_weather')}</Text>
              </View>
              <View style={styles.weatherRow} accessibilityRole="radiogroup">
                {WEATHER_OPTIONS.map((w) => {
                  const active = weather === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      onPress={() => {
                        hapticPress();
                        setWeather(w.id);
                      }}
                      style={[styles.weatherBtn, active && styles.weatherBtnActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                    >
                      <Ionicons
                        name={w.icon}
                        size={24}
                        color={active ? Calm.bgFrom : Calm.text}
                      />
                      <Text style={[styles.weatherText, active && styles.weatherTextActive]}>
                        {t(w.key)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 5: Journal Note */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="book-outline" size={20} color={Calm.accent} />
                <Text style={styles.cardTitle}>{t('checkin.section_note')}</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder={t('checkin.note_placeholder')}
                placeholderTextColor={Calm.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={save}
              style={styles.save}
              accessibilityRole="button"
              testID="checkin-save"
            >
              <Text style={styles.saveText}>{t('checkin.save')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Calm.bgTo },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: FontFamily.headingItalic,
    fontSize: 16,
    color: Calm.accent,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  card: {
    backgroundColor: Calm.card,
    borderRadius: Radius.card,
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 20,
    color: Calm.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    lineHeight: 20,
    color: Calm.muted,
  },
  valueWrap: { alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 8 },
  valueDot: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  valueNum: { fontFamily: FontFamily.headingBold, fontSize: 32, color: '#14241C' },
  valueLabel: { fontFamily: FontFamily.heading, fontSize: 20, color: Calm.text },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  endText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.meta, color: Calm.muted },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.cardSmall,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Calm.accent,
    borderColor: Calm.accent,
  },
  chipText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.body,
    color: Calm.text,
  },
  chipTextActive: {
    color: Calm.bgFrom,
  },
  waterSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Calm.muted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterCountNum: {
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    color: Calm.text,
  },
  weatherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  weatherBtn: {
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.cardSmall,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  weatherBtnActive: {
    backgroundColor: Calm.accent,
  },
  weatherText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Calm.text,
    textAlign: 'center',
  },
  weatherTextActive: {
    color: Calm.bgFrom,
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.cardSmall,
    padding: 14,
    color: Calm.text,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    minHeight: 80,
    lineHeight: 22,
  },
  save: {
    backgroundColor: Calm.text,
    borderRadius: Radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  saveText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Calm.bgFrom,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagChipActive: {
    backgroundColor: Calm.accent,
    borderColor: Calm.accent,
  },
  tagChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Calm.text,
  },
  tagChipTextActive: {
    color: Calm.bgFrom,
    fontFamily: FontFamily.dmSansBold,
  },
  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(154, 230, 180, 0.1)',
    borderRadius: Radius.cardSmall,
    padding: 10,
    marginTop: 6,
  },
  hintText: {
    flex: 1,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Calm.accent,
    lineHeight: 18,
  },
});
