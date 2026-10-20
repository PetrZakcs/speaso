import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useStore, type CheckIn } from '../state/store';
import { toDateKey } from './dates';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface BalbutiesResearchRecord {
  install_id: string;
  age_group: string | null;
  therapy_status: string | null;
  stuttering_situations: string[];
  date: string;
  speech_rating: number; // 1 (hard) - 5 (easy)
  sleep_hours?: number;
  water_glasses?: number;
  weather?: string;
  somatic_tags?: string[];
  has_journal_note: boolean;
  platform: string;
  app_version: string | null;
  created_at: string;
}

/**
 * Syncs an anonymized check-in record to the scientific research database.
 * Completely strips all names, raw journal text, and identifying metadata.
 */
export async function syncResearchCheckIn(checkIn: CheckIn): Promise<boolean> {
  const { user, installId } = useStore.getState();
  if (!user.shareAnswers) return false;
  if (!URL || !KEY) return false;

  const record: BalbutiesResearchRecord = {
    install_id: installId,
    age_group: user.ageGroup,
    therapy_status: user.therapyStatus,
    stuttering_situations: user.situations,
    date: checkIn.date,
    speech_rating: checkIn.mood,
    sleep_hours: checkIn.sleepHours,
    water_glasses: checkIn.waterGlasses,
    weather: checkIn.weather,
    somatic_tags: checkIn.tags ?? [],
    has_journal_note: !!checkIn.note?.trim(),
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${URL}/rest/v1/research_balbuties_data`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch (e) {
    if (__DEV__) {
      console.warn('[research] sync failed:', e);
    }
    return false;
  }
}

/**
 * Exports user's own raw data as JSON so they can provide it to their doctor
 * or inspect what they are contributing to research.
 */
export async function exportResearchDataJson(): Promise<void> {
  const { checkIns, sessions, user, streak } = useStore.getState();
  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      ageGroup: user.ageGroup,
      therapyStatus: user.therapyStatus,
      situations: user.situations,
      dailyMinutes: user.dailyMinutes,
    },
    streakRecord: streak.record,
    totalSessions: sessions.length,
    checkIns: checkIns.map((c) => ({
      date: c.date,
      rating: c.mood,
      sleepHours: c.sleepHours,
      waterGlasses: c.waterGlasses,
      weather: c.weather,
      tags: c.tags,
      hasNote: !!c.note,
    })),
    sessions: sessions.map((s) => ({
      date: s.date,
      exerciseId: s.exerciseId,
      durationSec: s.durationSec,
      rating: s.rating,
    })),
  };

  try {
    const file = new File(Paths.document, `speaso-balbuties-data-${toDateKey()}.json`);
    file.write(JSON.stringify(payload, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Speaso Balbuties Research Data',
      });
    }
  } catch (e) {
    console.warn('[research] export failed:', e);
  }
}
