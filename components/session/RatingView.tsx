import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from '../../i18n/useTranslation';
import PillButton from '../PillButton';
import type { Rating } from '../../lib/streak';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow } from '../../theme/tokens';
import { hapticSelect } from '../../lib/haptics';

/** "How did speaking feel?" — 1–5 plus an optional private note. */
export default function RatingView({ onDone }: { onDone: (rating?: Rating, note?: string) => void }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<Rating | null>(null);
  const [note, setNote] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  return (
    // iOS: the scroll view insets itself above the keyboard; Android (edge-to-edge) needs padding.
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? undefined : 'padding'}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.wrap}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.title} accessibilityRole="header">{t('rating.title')}</Text>
        <Text style={styles.sub}>{t('rating.sub')}</Text>

        <View style={styles.row} accessibilityRole="radiogroup">
          {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                hapticSelect();
                setRating(r);
              }}
              style={[styles.face, rating === r && styles.faceActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: rating === r }}
              accessibilityLabel={t(`rating.level_${r}`)}
            >
              <Text style={[styles.num, rating === r && styles.numActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.ends}>
          <Text style={styles.endText}>{t('rating.level_1')}</Text>
          <Text style={styles.endText}>{t('rating.level_5')}</Text>
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
          // Return closes the keyboard so the save button is reachable again.
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
        />
        <Text style={styles.privacy}>{t('rating.privacy')}</Text>

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
    fontFamily: FontFamily.soraSemiBold,
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
    ...Shadow.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceActive: { backgroundColor: Colors.accent.main },
  num: { fontFamily: FontFamily.soraSemiBold, fontSize: 20, color: Colors.text.secondary },
  numActive: { color: Colors.accent.on },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  endText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.tertiary },
  levelLabel: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
    textAlign: 'center',
  },
  note: {
    minHeight: 96,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.cardSmall,
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
