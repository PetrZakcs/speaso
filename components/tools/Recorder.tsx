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
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';
import { hapticPress } from '../../lib/haptics';

const MAX_SECONDS = 300;

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

/**
 * Record yourself, then listen back. Each take is saved to the recordings
 * list; recording again replaces the previous take from this session.
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
  const isRecording = recState.isRecording;
  const stopping = useRef(false);
  const recordingRef = useRef(false);

  useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  // Leaving the screen mid-recording: stop and restore the playback route.
  // useAudioRecorder may already have released its native object by the time
  // this cleanup runs, so never read recorder properties here — only call
  // stop() when we know a recording is running, and swallow a release race.
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
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={26} color={isRecording ? Colors.text.primary : Colors.accent.on} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {isRecording ? t('recorder.recording') : hasTake ? t('recorder.listen_back') : t('recorder.title')}
          </Text>
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
      {hasTake && <Text style={styles.again}>{t('recorder.again_hint')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  recBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBtnActive: { backgroundColor: Colors.danger.panic },
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
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  again: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
});
