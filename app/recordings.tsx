import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTranslation } from '../i18n/useTranslation';
import { FREE_RECORDINGS_LIMIT, useStore, useShallow, type Recording } from '../state/store';
import { recordingUri } from '../lib/recordings';
import { activityTitle, formatDate } from '../lib/activities';
import IconButton from '../components/IconButton';
import ZeroCloudBadge from '../components/ZeroCloudBadge';
import { formatTime } from '../components/session/SessionParts';
import { hapticSelect } from '../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow, Tints } from '../theme/tokens';

export default function RecordingsScreen() {
  const { t, lang } = useTranslation();
  const { recordings, removeRecording, isPremium } = useStore(useShallow((s) => ({
    recordings: s.recordings,
    removeRecording: s.removeRecording,
    isPremium: s.subscription.isPremium,
  })));
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.8 | 1.0>(1.0);
  const sorted = [...recordings].reverse();

  // First vs. latest take of the most recently recorded exercise.
  const latest = sorted[0];
  const sameExercise = latest ? recordings.filter((r) => r.exerciseId === latest.exerciseId) : [];
  const compare = sameExercise.length >= 2 ? { first: sameExercise[0], last: sameExercise[sameExercise.length - 1] } : null;

  const changeSpeed = (rate: 0.8 | 1.0) => {
    hapticSelect();
    setPlaybackSpeed(rate);
    try {
      player.playbackRate = rate;
    } catch (e) {
      console.warn('[recordings] playbackRate failed:', e);
    }
  };

  const toggle = (rec: Recording) => {
    if (currentId === rec.id) {
      if (status.playing) {
        player.pause();
      } else {
        if (status.duration > 0 && status.currentTime >= status.duration - 0.05) player.seekTo(0);
        try {
          player.playbackRate = playbackSpeed;
        } catch {}
        player.play();
      }
      return;
    }
    player.replace({ uri: recordingUri(rec.fileName) });
    try {
      player.playbackRate = playbackSpeed;
    } catch {}
    player.play();
    setCurrentId(rec.id);
  };

  const confirmDelete = (rec: Recording) => {
    Alert.alert(t('recordings.delete_title'), t('recordings.delete_body'), [
      { text: t('common.close'), style: 'cancel' },
      {
        text: t('recordings.delete'),
        style: 'destructive',
        onPress: () => {
          if (currentId === rec.id) {
            player.pause();
            setCurrentId(null);
          }
          removeRecording(rec.id);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <IconButton icon="close" size={36} onPress={() => router.back()} accessibilityLabel={t('common.close')} />
        <Text style={styles.title} accessibilityRole="header">{t('recordings.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ZeroCloudBadge style={{ marginHorizontal: Spacing.screenH, marginBottom: 12 }} />

      {!isPremium && (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => router.push({ pathname: '/paywall', params: { context: 'recordings' } })}
          accessibilityRole="button"
        >
          <Text style={styles.bannerText}>
            {t('recordings.free_limit', { n: FREE_RECORDINGS_LIMIT })} <Text style={styles.gold}>Premium →</Text>
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={sorted}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('recordings.empty')}</Text>}
        ListHeaderComponent={
          compare ? (
            <View style={styles.compare}>
              <Text style={styles.compareTitle}>{t('recordings.compare_title')}</Text>
              <Text style={styles.compareSub}>
                {t('recordings.compare_sub', { exercise: activityTitle(compare.last.exerciseId, lang) })}
              </Text>
              {([['first', compare.first], ['last', compare.last]] as const).map(([which, rec]) => {
                const playing = currentId === rec.id && status.playing;
                return (
                  <TouchableOpacity
                    key={which}
                    onPress={() => toggle(rec)}
                    style={styles.compareRow}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(`recordings.compare_${which}`)}, ${formatDate(rec.createdAt, lang)}`}
                  >
                    <View style={[styles.playBtn, playing && styles.playBtnActive]}>
                      <Ionicons name={playing ? 'pause' : 'play'} size={16} color={playing ? Colors.accent.on : Colors.text.primary} />
                    </View>
                    <Text style={styles.compareLabel}>{t(`recordings.compare_${which}`)}</Text>
                    <Text style={styles.rowSub}>{formatDate(rec.createdAt, lang)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const active = currentId === item.id;
          const playing = active && status.playing;
          return (
            <View style={[styles.cardRow, active && styles.cardRowActive]}>
              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => toggle(item)}
                  style={[styles.playBtn, playing && styles.playBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel={playing ? t('recorder.pause') : t('recorder.play')}
                >
                  <Ionicons name={playing ? 'pause' : 'play'} size={18} color={playing ? Colors.accent.on : Colors.text.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{activityTitle(item.exerciseId, lang)}</Text>
                  <Text style={styles.rowSub}>
                    {formatDate(item.createdAt, lang)} ·{' '}
                    {active && status.duration > 0
                      ? `${formatTime(status.currentTime)} / ${formatTime(status.duration)}`
                      : formatTime(item.durationSec)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(item)}
                  style={styles.deleteBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('recordings.delete')}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>

              {active && (
                <View style={styles.speedRow}>
                  <Text style={styles.speedLabel}>{t('recorder.cadence_calm')}:</Text>
                  <View style={styles.speedGroup}>
                    <TouchableOpacity
                      onPress={() => changeSpeed(1.0)}
                      style={[styles.speedBtn, playbackSpeed === 1.0 && styles.speedBtnActive]}
                    >
                      <Text style={[styles.speedBtnText, playbackSpeed === 1.0 && styles.speedBtnTextActive]}>
                        1.0x
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => changeSpeed(0.8)}
                      style={[styles.speedBtn, playbackSpeed === 0.8 && styles.speedBtnActive]}
                    >
                      <Text style={[styles.speedBtnText, playbackSpeed === 0.8 && styles.speedBtnTextActive]}>
                        0.8x
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.cardTitle, color: Colors.text.primary },
  banner: {
    marginHorizontal: Spacing.screenH,
    backgroundColor: Colors.premium.main + '18',
    borderColor: Colors.premium.main + '40',
    borderWidth: 1,
    borderRadius: Radius.cardSmall,
    padding: 12,
  },
  bannerText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.bodySmall, color: Colors.text.secondary },
  gold: { color: Colors.premium.main, fontFamily: FontFamily.dmSansBold },
  list: { padding: Spacing.screenH, gap: 10 },
  empty: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.cardSmall,
    padding: 12,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: Colors.accent.main },
  rowTitle: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.bodySmall, color: Colors.text.primary },
  rowSub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.tertiary, marginTop: 2 },
  deleteBtn: { padding: 8 },
  compare: {
    backgroundColor: Tints.lavender.bg,
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
    marginBottom: 6,
  },
  compareTitle: { fontFamily: FontFamily.heading, fontSize: 17, color: Colors.text.primary },
  compareSub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, lineHeight: 19, color: Colors.text.secondary, marginBottom: 4 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compareLabel: { flex: 1, fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  cardRow: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.cardSmall,
    padding: 12,
    gap: 8,
  },
  cardRowActive: {
    borderWidth: 1,
    borderColor: Colors.accent.soft,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.card2,
  },
  speedLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
  speedGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.pill,
    padding: 2,
    gap: 2,
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  speedBtnActive: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
  },
  speedBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
  speedBtnTextActive: {
    color: Colors.text.primary,
  },
});
