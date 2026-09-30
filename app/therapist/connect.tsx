import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../state/store';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme/tokens';

export default function ConnectTherapist() {
  const { t } = useTranslation();
  const setTherapist = useStore((s) => s.setTherapist);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (code.trim().length < 4) {
      setError('Kód musí mít alespoň 4 znaky.');
      return;
    }
    setLoading(true);
    setError('');
    // Mock pairing — v produkci Supabase lookup
    setTimeout(() => {
      setTherapist({ name: 'Mgr. Jana Nováková', connected: true, liveSharing: true });
      setLoading(false);
      router.replace('/therapist');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Zpět</Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <LinearGradient colors={['#8B5CF6', '#6d28d9']} style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🩺</Text>
          </LinearGradient>

          <Text style={styles.title}>Propojit logopeda</Text>
          <Text style={styles.sub}>
            Požádej svého logopeda o párovací kód. Zadej ho níže — začne okamžitě vidět tvůj pokrok.
          </Text>

          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={code}
              onChangeText={(v) => { setCode(v.toUpperCase()); setError(''); }}
              placeholder="Př. JANA-2024"
              placeholderTextColor={Colors.text.tertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              returnKeyType="done"
              onSubmitEditing={handleConnect}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Kód dostaneš od logopeda — buď SMS, e-mailem nebo přímo na sezení.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <PillButton
            label={loading ? '…' : 'Propojit →'}
            onPress={handleConnect}
            loading={loading}
            variant="purple"
            disabled={code.trim().length < 4}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
            <Text style={styles.skipText}>Přeskočit zatím</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  backBtn: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 8 },
  backText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    gap: 18,
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.therapist.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 30,
  },
  iconEmoji: { fontSize: 42 },
  title: {
    fontFamily: FontFamily.soraBold,
    fontSize: 26,
    color: Colors.text.primary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputWrap: { width: '100%', gap: 6 },
  input: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
    borderColor: Colors.therapist.purple,
    padding: 18,
    fontFamily: FontFamily.soraSemiBold,
    fontSize: 22,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: 4,
  },
  inputError: { borderColor: Colors.danger.panic },
  errorText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.danger.panic,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    width: '100%',
  },
  infoIcon: { fontSize: 16 },
  infoText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  footer: { paddingHorizontal: Spacing.screenH, paddingBottom: 32, gap: 10 },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.tertiary },
});
