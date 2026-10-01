import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { textsFor } from '../../content/texts';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

/** A text from the library to read aloud, with difficulty and "another text". */
export default function ReadingPanel({ initialLevel = 1 }: { initialLevel?: 1 | 2 | 3 }) {
  const { t, lang } = useTranslation();
  const ageGroup = useStore((s) => s.user.ageGroup);
  const [level, setLevel] = useState<1 | 2 | 3>(initialLevel);
  const [index, setIndex] = useState(0);

  const texts = textsFor(ageGroup, level);
  const text = texts[index % texts.length];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.levels} accessibilityRole="radiogroup">
          {([1, 2, 3] as const).map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => {
                setLevel(l);
                setIndex(0);
              }}
              style={[styles.level, level === l && styles.levelActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: level === l }}
              accessibilityLabel={t('exercises.level', { n: l })}
            >
              <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {texts.length > 1 && (
          <TouchableOpacity
            onPress={() => setIndex((i) => i + 1)}
            style={styles.another}
            accessibilityRole="button"
          >
            <Ionicons name="shuffle" size={14} color={Colors.accent.main} />
            <Text style={styles.anotherText}>{t('reading.another')}</Text>
          </TouchableOpacity>
        )}
      </View>
      {text && (
        <>
          <Text style={styles.title}>{text.title[lang]}</Text>
          <Text style={styles.body} selectable>{text.body[lang]}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levels: { flexDirection: 'row', gap: 6 },
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
  levelTextActive: { color: Colors.bg.base },
  another: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  anotherText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  title: { fontFamily: FontFamily.soraSemiBold, fontSize: FontSize.cardTitle, color: Colors.text.primary },
  body: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 19,
    lineHeight: 30,
    color: Colors.text.primary,
  },
});
