import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer, type AudioStatus } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import { useTranslation } from '../i18n/useTranslation';
import { FREE_RECORDINGS_LIMIT, useStore, useShallow, type Recording } from '../state/store';
import { recordingUri } from '../lib/recordings';
import { activityTitle, formatDate } from '../lib/activities';
import IconButton from '../components/IconButton';
import ZeroCloudBadge from '../components/ZeroCloudBadge';
import { formatTime } from '../components/session/SessionParts';
import { hapticSelect, hapticTick } from '../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow, Tints } from '../theme/tokens';
import type { SupportedLang } from '../lib/locale';

const WAVEFORM_HEIGHTS = [8, 14, 20, 16, 26, 32, 28, 18, 12, 24, 30, 26, 18, 12, 22, 28, 30, 24, 16, 22, 16, 12, 18, 10];

interface RecordingCardProps {
  item: Recording;
  active: boolean;
  playing: boolean;
  status: AudioStatus;
  player: AudioPlayer;
  playbackSpeed: 0.8 | 1.0;
  onChangeSpeed: (speed: 0.8 | 1.0) => void;
  onToggle: () => void;
  onShare: () => void;
  onDelete: () => void;
  t: (key: string, options?: any) => string;
  lang: SupportedLang;
}

function RecordingCard({
  item,
  active,
  playing,
  status,
  player,
  playbackSpeed,
  onChangeSpeed,
  onToggle,
  onShare,
  onDelete,
  t,
  lang,
}: RecordingCardProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const duration = (active && status.duration > 0) ? status.duration : (item.durationSec || 1);
  const currentTime = active ? status.currentTime : 0;
  const progress = Math.max(0, Math.min(1, currentTime / duration));

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    hapticTick();
    player.seekTo(clamped);
  };

  const jump = (deltaSeconds: number) => {
    seekTo(currentTime + deltaSeconds);
  };

  const handleTrackPress = (locationX: number) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    seekTo(ratio * duration);
  };

  return (
    <View style={[styles.cardRow, active && styles.cardRowActive]}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onToggle}
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
          onPress={onShare}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={t('recordings.share')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-outline" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={t('recordings.delete')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {active && (
        <View style={styles.activePlayerSection}>
          {/* Reactive Acoustic Waveform */}
          <View
            style={styles.waveformContainer}
            accessibilityLabel={t('recordings.waveform')}
            accessibilityRole="image"
          >
            {WAVEFORM_HEIGHTS.map((h, i) => {
              const barRatio = (i + 0.5) / WAVEFORM_HEIGHTS.length;
              const isPast = barRatio <= progress;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { height: h },
                    isPast && styles.waveformBarActive,
                    isPast && playing && styles.waveformBarPlaying,
                  ]}
                />
              );
            })}
          </View>

          {/* Interactive Audio Scrubber Bar */}
          <TouchableOpacity
            activeOpacity={0.9}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            onPress={(e) => handleTrackPress(e.nativeEvent.locationX)}
            style={styles.scrubberTouchable}
            accessibilityRole="adjustable"
            accessibilityLabel={`${t('recordings.scrubber')}: ${Math.round(progress * 100)}%`}
          >
            <View style={styles.scrubberRail}>
              <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
            </View>
            <View
              style={[
                styles.scrubberThumb,
                { left: `${Math.max(0, Math.min(97, progress * 100))}%` },
              ]}
            />
          </TouchableOpacity>

          {/* Player Controls Bar */}
          <View style={styles.playerControlsRow}>
            {/* Timestamps */}
            <Text style={styles.timeLabel}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>

            {/* Jump Buttons */}
            <View style={styles.jumpGroup}>
              <TouchableOpacity
                onPress={() => jump(-5)}
                style={styles.jumpBtn}
                accessibilityRole="button"
                accessibilityLabel={t('recordings.replay_5s')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="arrow-undo" size={13} color={Colors.text.secondary} />
                <Text style={styles.jumpText}>{t('recordings.replay_5s')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => jump(5)}
                style={styles.jumpBtn}
                accessibilityRole="button"
                accessibilityLabel={t('recordings.forward_5s')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="arrow-redo" size={13} color={Colors.text.secondary} />
                <Text style={styles.jumpText}>{t('recordings.forward_5s')}</Text>
              </TouchableOpacity>
            </View>

            {/* Playback Speed Toggles */}
            <View style={styles.speedGroup}>
              <TouchableOpacity
                onPress={() => onChangeSpeed(1.0)}
                style={[styles.speedBtn, playbackSpeed === 1.0 && styles.speedBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: playbackSpeed === 1.0 }}
              >
                <Text style={[styles.speedBtnText, playbackSpeed === 1.0 && styles.speedBtnTextActive]}>
                  1.0x
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onChangeSpeed(0.8)}
                style={[styles.speedBtn, playbackSpeed === 0.8 && styles.speedBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: playbackSpeed === 0.8 }}
              >
                <Text style={[styles.speedBtnText, playbackSpeed === 0.8 && styles.speedBtnTextActive]}>
                  0.8x
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

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
      player.setPlaybackRate(rate);
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
          player.setPlaybackRate(playbackSpeed);
        } catch {}
        player.play();
      }
      return;
    }
    player.replace({ uri: recordingUri(rec.fileName) });
    try {
      player.setPlaybackRate(playbackSpeed);
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

  const shareRecording = async (rec: Recording) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('common.error'), t('recordings.share_unavailable'));
        return;
      }
      await Sharing.shareAsync(recordingUri(rec.fileName), {
        dialogTitle: t('recordings.share_title'),
        mimeType: 'audio/m4a',
        UTI: 'public.audio',
      });
    } catch (e) {
      console.warn('[recordings] share failed:', e);
    }
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
        renderItem={({ item }) => (
          <RecordingCard
            item={item}
            active={currentId === item.id}
            playing={currentId === item.id && status.playing}
            status={status}
            player={player}
            playbackSpeed={playbackSpeed}
            onChangeSpeed={changeSpeed}
            onToggle={() => toggle(item)}
            onShare={() => shareRecording(item)}
            onDelete={() => confirmDelete(item)}
            t={t}
            lang={lang}
          />
        )}
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
  actionBtn: { padding: 6 },
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
    padding: 14,
    gap: 10,
  },
  cardRowActive: {
    borderWidth: 1.5,
    borderColor: Colors.accent.main,
    backgroundColor: Colors.surface.card,
  },
  activePlayerSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.card2,
    gap: 10,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: Colors.surface.card2,
  },
  waveformBarActive: {
    backgroundColor: Colors.accent.soft,
  },
  waveformBarPlaying: {
    backgroundColor: Colors.accent.main,
  },
  scrubberTouchable: {
    height: 22,
    justifyContent: 'center',
    position: 'relative',
  },
  scrubberRail: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.surface.card2,
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: Colors.accent.main,
  },
  scrubberThumb: {
    position: 'absolute',
    top: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.accent.main,
    ...Shadow.card,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  jumpGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  jumpText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.micro,
    color: Colors.text.secondary,
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
