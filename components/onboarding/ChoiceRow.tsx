import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, FontFamily, FontSize, Radius } from '../../theme/tokens';

/** A selectable row: title, optional detail, and a check when selected. */
export default function ChoiceRow({
  title, detail, selected, onPress, multi = false,
}: {
  title: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.row, selected && styles.rowSelected]}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!detail && <Text style={styles.detail}>{detail}</Text>}
      </View>
      <View style={[styles.mark, multi && styles.markSquare, selected && styles.markOn]}>
        {selected && <Ionicons name="checkmark" size={14} color={Colors.accent.on} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: Radius.cardSmall,
    backgroundColor: Colors.surface.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowSelected: { borderColor: Colors.accent.main },
  title: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  detail: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    lineHeight: 18,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSquare: { borderRadius: 6 },
  markOn: { backgroundColor: Colors.accent.main, borderColor: Colors.accent.main },
});
