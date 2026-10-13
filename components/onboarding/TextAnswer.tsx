import React from 'react';
import { Text, TextInput, StyleSheet, View } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';
import { ShellScrollContext } from '../OnboardingShell';

/** Free-text answer field used across onboarding ("something else", own scenario). */
export default function TextAnswer({
  label, value, onChange, placeholder, autoFocus, maxLength = 200, testID,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  maxLength?: number;
  testID?: string;
}) {
  const scrollIntoView = React.useContext(ShellScrollContext);
  return (
    <View style={{ gap: 8 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        autoFocus={autoFocus}
        maxLength={maxLength}
        multiline
        submitBehavior="blurAndSubmit"
        returnKeyType="done"
        accessibilityLabel={label ?? placeholder}
        testID={testID}
        onFocus={scrollIntoView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: FontFamily.soraBold, fontSize: FontSize.body, color: Colors.text.primary },
  input: {
    minHeight: 56,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.cardSmall,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    lineHeight: 21,
    color: Colors.text.primary,
    textAlignVertical: 'top',
  },
});
