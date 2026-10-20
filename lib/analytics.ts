import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../state/store';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type AnalyticsEventName =
  | 'onboarding_start'
  | 'onboarding_step'
  | 'onboarding_complete'
  | 'paywall_view'
  | 'promo_code_redeem'
  | 'exercise_start'
  | 'exercise_finish'
  | 'panic_sos'
  | 'checkin_logged'
  | 'report_exported'
  | 'therapist_paired'
  | 'reminder_schedule_updated'
  | 'store_review_prompted';

export interface AnalyticsEvent {
  install_id: string;
  event: AnalyticsEventName;
  properties?: Record<string, any>;
  platform: string;
  app_version: string | null;
  created_at: string;
}

export function isAnalyticsConfigured(): boolean {
  return !!URL && !!KEY;
}

/**
 * Sends an anonymous product analytics event if the user opted in.
 * Guaranteed never to crash the app.
 */
export async function trackEvent(
  event: AnalyticsEventName,
  properties?: Record<string, any>
): Promise<boolean> {
  try {
    const { user, installId } = useStore.getState();
    if (!user.shareAnswers) return false;

    const payload: AnalyticsEvent = {
      install_id: installId,
      event,
      properties: properties ?? {},
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? null,
      created_at: new Date().toISOString(),
    };

    if (!isAnalyticsConfigured()) {
      if (__DEV__) {
        console.log('[analytics] (dev)', event, properties);
      }
      return true;
    }

    const res = await fetch(`${URL}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: KEY!,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (e) {
    if (__DEV__) {
      console.warn('[analytics] failed:', e);
    }
    return false;
  }
}
