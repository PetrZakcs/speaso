import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { MAX_SCENARIO_PHRASES, useStore } from '../../state/store';
import { canCreateScenario } from '../../lib/scenarios';
import IconButton from '../../components/IconButton';
import PillButton from '../../components/PillButton';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../theme/tokens';

/** Create (no `id`) or edit an own scenario: title, sentences, optional challenge. */
export default function ScenarioEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();
  const existing = useStore((s) => (id ? s.scenarios.find((x) => x.id === id) : undefined));
  const { addScenario, updateScenario, removeScenario } = useStore.getState();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [phrases, setPhrases] = useState<string[]>(existing?.phrases.length ? existing.phrases : ['', '']);
  const [challenge, setChallenge] = useState(existing?.challenge ?? '');

  const canSave = title.trim().length > 0 && phrases.some((p) => p.trim());
  const setPhrase = (i: number, v: string) => setPhrases((cur) => cur.map((p, j) => (j === i ? v : p)));

  const save = () => {
    const input = { title, phrases, challenge };
    if (existing) {
      updateScenario(existing.id, input);
      router.back();
      return;
    }
    // Deep links can't bypass the free limit.
    const { scenarios, subscription } = useStore.getState();
    if (!canCreateScenario(scenarios, subscription.isPremium)) {
      router.replace({ pathname: '/paywall', params: { context: 'scenario' } });
      return;
    }
    const newId = addScenario(input);
    router.replace({ pathname: '/scenario/[id]', params: { id: newId } });
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(t('scenarios.delete_confirm'), existing.title, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('scenarios.delete'),
        style: 'destructive',
        onPress: () => {
          removeScenario(existing.id);
          router.dismissAll();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => router.back()} accessibilityLabel={t('common.close')} />
        <Text style={styles.headerTitle}>{existing ? t('scenarios.edit_title') : t('scenarios.edit_title_new')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? undefined : 'padding'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.label}>{t('scenarios.field_title')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('scenarios.field_title_ph')}
            placeholderTextColor={Colors.text.tertiary}
            maxLength={80}
            autoFocus={!existing}
            returnKeyType="next"
            accessibilityLabel={t('scenarios.field_title')}
            testID="scenario-title"
          />

          <Text style={[styles.label, { marginTop: 24 }]}>{t('scenarios.field_phrases')}</Text>
          <Text style={styles.sub}>{t('scenarios.field_phrases_sub')}</Text>
          {phrases.map((p, i) => (
            <View key={i} style={styles.phraseRow}>
              <Text style={styles.phraseNum}>{i + 1}</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={p}
                onChangeText={(v) => setPhrase(i, v)}
                placeholder={t('scenarios.phrase_ph', { n: i + 1 })}
                placeholderTextColor={Colors.text.tertiary}
                maxLength={200}
                multiline
                submitBehavior="blurAndSubmit"
                returnKeyType="done"
                accessibilityLabel={t('scenarios.phrase_ph', { n: i + 1 })}
                testID={`scenario-phrase-${i}`}
              />
              {phrases.length > 1 && (
                <TouchableOpacity
                  onPress={() => setPhrases((cur) => cur.filter((_, j) => j !== i))}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t('scenarios.remove_phrase_a11y', { n: i + 1 })}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {phrases.length < MAX_SCENARIO_PHRASES && (
            <TouchableOpacity
              onPress={() => setPhrases((cur) => [...cur, ''])}
              style={styles.addRow}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={18} color={Colors.accent.main} />
              <Text style={styles.addText}>{t('scenarios.add_phrase')}</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.label, { marginTop: 24 }]}>{t('scenarios.field_challenge')}</Text>
          <TextInput
            style={[styles.input, styles.multi]}
            value={challenge}
            onChangeText={setChallenge}
            placeholder={t('scenarios.field_challenge_ph')}
            placeholderTextColor={Colors.text.tertiary}
            maxLength={200}
            multiline
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            accessibilityLabel={t('scenarios.field_challenge')}
          />

          {existing && (
            <TouchableOpacity onPress={remove} style={styles.deleteRow} accessibilityRole="button">
              <Text style={styles.deleteText}>{t('scenarios.delete')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PillButton label={t('scenarios.save')} onPress={save} disabled={!canSave} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenH,
    paddingTop: 8,
  },
  headerTitle: { fontFamily: FontFamily.soraBold, fontSize: 17, color: Colors.text.primary },
  scroll: { padding: Spacing.screenH, paddingTop: 24, paddingBottom: 40 },
  label: { fontFamily: FontFamily.soraBold, fontSize: 18, color: Colors.text.primary, marginBottom: 10 },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    lineHeight: 19,
    color: Colors.text.secondary,
    marginTop: -4,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    ...Shadow.card,
  },
  multi: { minHeight: 80, textAlignVertical: 'top' },
  phraseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  phraseNum: { width: 18, fontFamily: FontFamily.soraBold, fontSize: FontSize.bodySmall, color: Colors.accent.main },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingLeft: 28 },
  addText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.accent.main },
  deleteRow: { alignSelf: 'center', padding: 12, marginTop: 24 },
  deleteText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.danger.panic },
  footer: { paddingHorizontal: Spacing.screenH, paddingVertical: 10 },
});
