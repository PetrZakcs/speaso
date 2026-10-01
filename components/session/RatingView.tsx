import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from '../../i18n/useTranslation';
import PillButton from '../PillButton';
import type { Rating } from '../../lib/streak';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export const RATING_EMOJI: Record<Rating, string> = { 1: '😣', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

/** "How did speaking feel?" — 1–5 plus an optional private note. */
export default function RatingView({ onDone }: { onDone: (rating?: Rating, note?: string) => void }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<Rating | null>(null);
  const [note, setNote] = useState('');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">{t('rating.title')}</Text>
        <Text style={styles.sub}>{t('rating.sub')}</Text>

        <View style={styles.row} accessibilityRole="radiogroup">
          {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRating(r)}
              style={[styles.face, rating === r && styles.faceActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: rating === r }}
              accessibilityLabel={t(`rating.level_${r}`)}
            >
              <Text style={styles.emoji}>{RATING_EMOJI[r]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.levelLabel}>{rating ? t(`rating.level_${rating}`) : ' '}</Text>

        <TextInput
          style={styles.note}
          value={note}
          onChangeText={setNote}
          placeholder={t('rating.note_placeholder')}
          placeholderTextColor={Colors.text.tertiary}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.privacy}>🔒 {t('rating.privacy')}</Text>

        <PillButton label={t('rating.save')} onPress={() => onDone(rating ?? undefined, note)} disabled={!rating} />
        <TouchableOpacity onPress={() => onDone()} style={styles.skip} accessibilityRole="button">
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.screenH, paddingTop: 32, paddingBottom: 40, gap: 14 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  face: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceActive: { borderColor: Colors.accent.cyan, backgroundColor: Colors.surface.card2 },
  emoji: { fontSize: 28 },
  levelLabel: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.cyan,
    textAlign: 'center',
  },
  note: {
    minHeight: 96,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 14,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  privacy: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
  skip: { alignItems: 'center', paddingVertical: 6 },
  skipText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.tertiary },
});
