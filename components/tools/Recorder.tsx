import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync,
  useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { persistRecording, recordingUri } from '../../lib/recordings';
import ZeroCloudBadge from '../ZeroCloudBadge';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';
import { hapticPress, hapticSelect } from '../../lib/haptics';

const MAX_SECONDS = 300;

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

/**
 * Record yourself, then listen back. Each take is saved to the recordings
 * list; recording again replaces the previous take from this session.
 * Includes logopedic playback speed analysis (1.0x / 0.8x) and live pulse.
 */
export default function Recorder({ exerciseId }: { exerciseId: string }) {
  const { t } = useTranslation();
  const addRecording = useStore((s) => s.addRecording);
  const removeRecording = useStore((s) => s.removeRecording);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null);
  const playStatus = useAudioPlayerStatus(player);

  const [takeId, setTakeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.8 | 1.0>(1.0);
  const isRecording = recState.isRecording;
  const stopping = useRef(false);
  const recordingRef = useRef(false);

  useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  // Leaving the screen mid-recording: stop and restore the playback route.
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        try {
          recorder.stop().catch(() => {});
        } catch {
          // native recorder already released — nothing left to stop
        }
      }
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    };
  }, [recorder]);

  const start = async () => {
    setBusy(true);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('recorder.permission_title'), t('recorder.permission_body'), [
          { text: t('common.close'), style: 'cancel' },
          { text: t('recorder.open_settings'), onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      player.pause();
      hapticPress();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_SECONDS });
    } catch (e) {
      console.warn('[recorder] start failed:', e);
      Alert.alert(t('recorder.error'));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (stopping.current) return;
    stopping.current = true;
    hapticPress();
    setBusy(true);
    try {
      const durationSec = recState.durationMillis / 1000;
      await recorder.stop();
      // On iOS a recording session routes playback to the earpiece — switch back.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) throw new Error('no uri');
      const fileName = await persistRecording(recorder.uri);
      if (takeId) removeRecording(takeId);
      addRecording({ fileName, exerciseId, durationSec: Math.round(durationSec) });
      const saved = useStore.getState().recordings.at(-1);
      setTakeId(saved?.id ?? null);
      player.replace({ uri: recordingUri(fileName) });
    } catch (e) {
      console.warn('[recorder] stop failed:', e);
      Alert.alert(t('recorder.error'));
    } finally {
      stopping.current = false;
      setBusy(false);
    }
  };

  const togglePlay = () => {
    if (playStatus.playing) {
      player.pause();
      return;
    }
    if (playStatus.duration > 0 && playStatus.currentTime >= playStatus.duration - 0.05) {
      player.seekTo(0);
    }
    player.play();
  };

  const changeSpeed = (rate: 0.8 | 1.0) => {
    hapticSelect();
    setPlaybackSpeed(rate);
    try {
      player.setPlaybackRate(rate);
    } catch (e) {
      console.warn('[recorder] playbackRate failed:', e);
    }
  };

const WAVE_PATTERN = [
  0.25, 0.4, 0.65, 0.85, 0.5, 0.7, 0.95, 0.8,
  0.4, 0.3, 0.6, 0.9, 1.0, 0.75, 0.45, 0.35,
  0.55, 0.8, 0.9, 0.6, 0.4, 0.5, 0.35, 0.2
];

  const handleSeekWave = (index: number, total: number) => {
    if (playStatus.duration > 0) {
      hapticSelect();
      const targetSec = (index / total) * playStatus.duration;
      player.seekTo(targetSec);
    }
  };

  const hasTake = !!takeId && !isRecording;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={isRecording ? stop : start}
          disabled={busy}
          style={[styles.recBtn, isRecording && styles.recBtnActive]}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? t('recorder.stop') : t('recorder.record')}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={26}
            color={isRecording ? Colors.text.primary : Colors.accent.on}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {isRecording ? t('recorder.recording') : hasTake ? t('recorder.listen_back') : t('recorder.title')}
            </Text>
            {isRecording && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>REC</Text>
              </View>
            )}
          </View>
          <Text style={styles.sub}>
            {isRecording
              ? formatMs(recState.durationMillis)
              : hasTake
                ? `${formatMs(playStatus.currentTime * 1000)} / ${formatMs(playStatus.duration * 1000)}`
                : t('recorder.hint')}
          </Text>
        </View>
        {hasTake && (
          <TouchableOpacity
            onPress={togglePlay}
            style={styles.playBtn}
            accessibilityRole="button"
            accessibilityLabel={playStatus.playing ? t('recorder.pause') : t('recorder.play')}
          >
            <Ionicons name={playStatus.playing ? 'pause' : 'play'} size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Live Audio Activity Bars during recording */}
      {isRecording && (
        <View style={styles.meterContainer}>
          {[0.3, 0.5, 0.8, 1.0, 0.7, 0.9, 0.6, 0.4, 0.85, 0.6, 0.9, 0.5, 0.7, 0.4].map((h, i) => (
            <View
              key={i}
              style={[
                styles.meterBar,
                { height: 10 + h * 18 * ((recState.durationMillis % (350 + i * 40)) / 350) },
              ]}
            />
          ))}
        </View>
      )}

      {/* Visual Audio Waveform & Scrubber during playback */}
      {hasTake && (
        <View style={styles.waveformContainer}>
          <View style={styles.waveformBars}>
            {WAVE_PATTERN.map((heightPct, i) => {
              const played =
                playStatus.duration > 0 &&
                i / WAVE_PATTERN.length <= playStatus.currentTime / playStatus.duration;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => handleSeekWave(i, WAVE_PATTERN.length)}
                  style={[
                    styles.waveformBar,
                    { height: Math.max(6, Math.round(heightPct * 32)) },
                    played ? styles.waveformBarPlayed : styles.waveformBarPending,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Seek to ${Math.round((i / WAVE_PATTERN.length) * 100)}%`}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Logopedic Speech Cadence & Playback speed controls */}
      {hasTake && (
        <View style={styles.takeControls}>
          <View style={styles.cadenceRow}>
            <View style={styles.cadenceBadge}>
              <Ionicons name="sparkles" size={13} color={Colors.accent.main} />
              <Text style={styles.cadenceText}>{t('recorder.cadence_calm')}</Text>
            </View>
            <View style={styles.speedGroup}>
              <TouchableOpacity
                onPress={() => changeSpeed(1.0)}
                style={[styles.speedBtn, playbackSpeed === 1.0 && styles.speedBtnActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.speedBtnText, playbackSpeed === 1.0 && styles.speedBtnTextActive]}>
                  {t('recorder.speed_normal')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => changeSpeed(0.8)}
                style={[styles.speedBtn, playbackSpeed === 0.8 && styles.speedBtnActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.speedBtnText, playbackSpeed === 0.8 && styles.speedBtnTextActive]}>
                  {t('recorder.speed_slow')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {playbackSpeed === 0.8 && (
            <Text style={styles.cadenceHint}>{t('recorder.cadence_hint')}</Text>
          )}
          <Text style={styles.again}>{t('recorder.again_hint')}</Text>
        </View>
      )}

      <ZeroCloudBadge compact style={{ alignSelf: 'center', marginTop: 4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBtnActive: { backgroundColor: Colors.danger.panic },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger.panic,
  },
  liveText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: 10,
    color: Colors.danger.panic,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitleSmall,
    color: Colors.text.primary,
  },
  sub: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.chip,
    paddingHorizontal: 12,
  },
  meterBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.main,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  waveformBar: {
    flex: 1,
    marginHorizontal: 1.5,
    borderRadius: 2,
  },
  waveformBarPlayed: {
    backgroundColor: Colors.accent.main,
  },
  waveformBarPending: {
    backgroundColor: Colors.text.tertiary + '40',
  },
  takeControls: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.card2,
    paddingTop: 10,
  },
  cadenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cadenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  cadenceText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
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
    paddingVertical: 4,
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
  cadenceHint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  again: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
});

