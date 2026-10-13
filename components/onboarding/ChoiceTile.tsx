import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ActivityIcon from '../ActivityIcon';
import { Colors, FontFamily, FontSize, Radius, Shadow, type TintName } from '../../theme/tokens';
import { hapticSelect } from '../../lib/haptics';

/** A half-width selectable tile for 2-column onboarding grids. */
export default function ChoiceTile({
  title, detail, icon, tint, selected, onPress, multi = false,
}: {
  title: string;
  detail?: string;
  icon: string;
  tint?: TintName;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      activeOpacity={0.8}
      style={[styles.tile, selected && styles.tileSelected]}
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
    >
      <View style={styles.top}>
        <ActivityIcon name={icon} tint={tint} size={48} />
        <View style={[styles.mark, multi && styles.markSquare, selected && styles.markOn]}>
          {selected && <Ionicons name="checkmark" size={14} color={Colors.accent.on} />}
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!detail && <Text style={styles.detail} numberOfLines={3}>{detail}</Text>}
    </TouchableOpacity>
  );
}

/** Lays tiles out two per row. */
export function TileGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48.4%',
    minHeight: 136,
    padding: 14,
    gap: 6,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileSelected: { borderColor: Colors.accent.main, backgroundColor: Colors.surface.mint },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.body, lineHeight: 20, color: Colors.text.primary },
  detail: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    lineHeight: 16,
    color: Colors.text.secondary,
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
