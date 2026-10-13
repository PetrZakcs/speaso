import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { translate } from '../i18n';
import { useStore } from '../state/store';
import CalmBackground from './calm/CalmBackground';
import WaveGlyph from './brand/WaveGlyph';
import { Calm, Radius } from '../theme/tokens';

/**
 * Last line of defence: a calm screen with a retry instead of a crash or a
 * blank screen. No custom fonts on purpose — they may be what failed.
 */
export default function AppErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const lang = useStore.getState().language;
  useEffect(() => {
    console.error('[app] unhandled render error:', error);
  }, [error]);

  return (
    <View style={styles.root}>
      <CalmBackground />
      <View style={styles.body}>
        <WaveGlyph size={44} color={Calm.accent} />
        <Text style={styles.title} accessibilityRole="header">{translate(lang, 'errors.title')}</Text>
        <Text style={styles.sub}>{translate(lang, 'errors.sub')}</Text>
        {__DEV__ && <Text style={styles.dev}>{error.message}</Text>}
      </View>
      <TouchableOpacity onPress={retry} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>{translate(lang, 'errors.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Calm.bgTo, padding: 24, justifyContent: 'center' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: Calm.text, textAlign: 'center' },
  sub: { fontSize: 16, lineHeight: 23, color: Calm.muted, textAlign: 'center' },
  dev: { fontSize: 12, color: Calm.muted, textAlign: 'center', marginTop: 12 },
  button: { backgroundColor: Calm.text, borderRadius: Radius.pill, paddingVertical: 17, alignItems: 'center', marginBottom: 24 },
  buttonText: { fontSize: 16, fontWeight: '700', color: Calm.bgFrom },
});
