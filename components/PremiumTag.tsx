import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, Radius } from '../theme/tokens';

/** Small text marker for Premium-only content (replaces the crown emoji). */
export default function PremiumTag() {
  return (
    <View style={styles.tag}>
      <Text style={styles.text}>Premium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: Colors.premium.soft,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  text: { fontFamily: FontFamily.dmSansSemiBold, fontSize: 11, color: Colors.premium.main },
});
