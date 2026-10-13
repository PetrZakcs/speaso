import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../state/store';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function answersConfigured() {
  return !!URL && !!KEY;
}

/** Row for public.onboarding_answers — no name, only what was asked in onboarding. */
export function buildAnswersRow() {
  const { user, scenarios, installId, language } = useStore.getState();
  const first = [...scenarios].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  return {
    install_id: installId,
    lang: language,
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
    situations: user.situations,
    situations_other: user.situationsOther || null,
    goal: user.goal,
    goal_other: user.goalOther || null,
    scenario_title: first?.title ?? null,
    scenario_phrase: first?.phrases[0] ?? null,
    age_group: user.ageGroup,
    daily_minutes: user.dailyMinutes,
  };
}

/**
 * Sends the onboarding answers if the user opted in. On failure (offline,
 * not configured yet) they stay pending and are retried on the next start.
 */
export async function submitAnswers(): Promise<boolean> {
  const { user, setAnswersPending } = useStore.getState();
  if (!user.shareAnswers) {
    setAnswersPending(false);
    return false;
  }
  setAnswersPending(true);
  if (!answersConfigured()) return false;
  try {
    const res = await fetch(`${URL}/rest/v1/onboarding_answers`, {
      method: 'POST',
      headers: {
        apikey: KEY!,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(buildAnswersRow()),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setAnswersPending(false);
    return true;
  } catch (e) {
    console.warn('[answers] send failed, will retry:', e);
    return false;
  }
}

/** Retries a pending submission (call once the store is ready). */
export function retryPendingAnswers() {
  if (useStore.getState().answersPending) submitAnswers();
}
