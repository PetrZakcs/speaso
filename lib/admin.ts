import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useStore } from '../state/store';
import { buildAnswersRow } from './answers';
import { syncResearchCheckIn } from './research';
import { trackEvent } from './analytics';
import { syncReminderSchedule } from './reminders';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDateKey } from './dates';

export const SUPABASE_STUDIO_URL = 'https://supabase.com/dashboard/project/phmhpdwhyvvrsjrobyyp/editor';
export const ADMIN_SESSION_STORAGE_KEY = '@speaso_admin_session';

export interface AdminSession {
  isAuthenticated: boolean;
  email: string | null;
  token?: string | null;
  loggedInAt?: string | null;
}

export async function getStoredAdminSession(): Promise<AdminSession> {
  try {
    const raw = await AsyncStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, email: null };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.isAuthenticated && parsed.email) {
      return parsed;
    }
    return { isAuthenticated: false, email: null };
  } catch {
    return { isAuthenticated: false, email: null };
  }
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; session?: AdminSession }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return { ok: false, error: 'Chybí konfigurace Supabase v aplikaci.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return { ok: false, error: 'Vyplň prosím e-mail i heslo.' };
  }

  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: data.error_description || data.msg || 'Neplatný e-mail nebo heslo.',
      };
    }

    const data = await res.json();
    const session: AdminSession = {
      isAuthenticated: true,
      email: data.user?.email || cleanEmail,
      token: data.access_token || null,
      loggedInAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
    return { ok: true, session };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Chyba sítě při ověřování účtu.' };
  }
}

export async function adminLogout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getSupabaseCredentials() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export interface SupabaseHealth {
  ok: boolean;
  status: number;
  latencyMs: number;
  url: string;
  error?: string;
}

/**
 * Pings Supabase API using the public RPC endpoint to measure latency
 * and verify authentication.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return {
      ok: false,
      status: 0,
      latencyMs: 0,
      url,
      error: 'EXPO_PUBLIC_SUPABASE_URL or ANON_KEY is not defined',
    };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/rpc/redeem_vip_code`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_code: 'HEALTH_CHECK_PING', p_install_id: 'health-check' }),
    });

    const latencyMs = Date.now() - start;
    return {
      ok: res.status === 200,
      status: res.status,
      latencyMs,
      url,
      error: res.status === 200 ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - start,
      url,
      error: err?.message || 'Network error',
    };
  }
}

/**
 * Sends a real test row to `onboarding_answers` to verify that data
 * insertion works and returns the HTTP status.
 */
export async function sendTestOnboardingRow(): Promise<{ ok: boolean; status: number; error?: string }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return { ok: false, status: 0, error: 'Chybí konfigurace Supabase' };
  }

  try {
    const row = buildAnswersRow();
    const res = await fetch(`${url}/rest/v1/onboarding_answers`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        ...row,
        scenario_title: row.scenario_title || 'Testovací scénář (Admin)',
        scenario_phrase: row.scenario_phrase || 'Testovací věta z admin panelu',
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text || `HTTP ${res.status}` };
    }

    return { ok: true, status: res.status };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message || 'Network error' };
  }
}

/**
 * Sends a real test record to `research_balbuties_data` and returns the HTTP status.
 */
export async function sendTestResearchRecord(): Promise<{ ok: boolean; status: number; error?: string }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return { ok: false, status: 0, error: 'Chybí konfigurace Supabase' };
  }

  const { user, installId } = useStore.getState();
  const testRecord = {
    install_id: installId,
    age_group: user.ageGroup || 'adult',
    therapy_status: user.therapyStatus || 'past',
    stuttering_situations: user.situations.length > 0 ? user.situations : ['phone', 'ordering'],
    date: toDateKey(),
    speech_rating: 4,
    sleep_hours: 8,
    water_glasses: 6,
    weather: 'sunny',
    somatic_tags: ['body_relaxed'],
    has_journal_note: true,
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${url}/rest/v1/research_balbuties_data`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(testRecord),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text || `HTTP ${res.status}` };
    }

    return { ok: true, status: res.status };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message || 'Network error' };
  }
}

/**
 * Sends a real test event to `analytics_events` and returns the HTTP status.
 */
export async function sendTestAnalyticsEvent(): Promise<{ ok: boolean; status: number; error?: string }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return { ok: false, status: 0, error: 'Chybí konfigurace Supabase' };
  }

  const { installId } = useStore.getState();
  const payload = {
    install_id: installId,
    event: 'admin_test_ping',
    properties: {
      timestamp: Date.now(),
      triggered_by: 'admin_panel',
      device: Platform.OS,
    },
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${url}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text || `HTTP ${res.status}` };
    }

    return { ok: true, status: res.status };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message || 'Network error' };
  }
}

/**
 * Triggers a sync of the current notification schedule to `user_notification_schedules`.
 */
export async function syncTestNotificationSchedule(): Promise<{ ok: boolean }> {
  const { reminder } = useStore.getState();
  const ok = await syncReminderSchedule(reminder);
  return { ok };
}

// ============================================================
// Live Data Fetching & Telemetry Dashboard Engine
// ============================================================

export interface OnboardingAnswerRow {
  id: string;
  install_id: string;
  lang?: string;
  platform?: string;
  app_version?: string;
  situations?: string[];
  situations_other?: string;
  goal?: string;
  goal_other?: string;
  scenario_title?: string;
  scenario_phrase?: string;
  age_group?: string;
  therapy_status?: string;
  daily_minutes?: number;
  created_at: string;
}

export interface ResearchBalbutiesRow {
  id: string;
  install_id: string;
  age_group?: string;
  therapy_status?: string;
  stuttering_situations?: string[];
  date: string;
  speech_rating: number;
  sleep_hours?: number;
  water_glasses?: number;
  weather?: string;
  somatic_tags?: string[];
  has_journal_note?: boolean;
  platform?: string;
  app_version?: string;
  created_at: string;
}

export interface AnalyticsEventRow {
  id: string;
  install_id: string;
  event: string;
  properties?: Record<string, any>;
  platform?: string;
  app_version?: string;
  created_at: string;
}

export interface NotificationScheduleRow {
  install_id: string;
  timezone: string;
  utc_offset_hours?: number;
  language: string;
  practice_enabled: boolean;
  practice_hour: number;
  practice_minute: number;
  morning_enabled: boolean;
  morning_hour: number;
  morning_minute: number;
  streak_saver_enabled: boolean;
  streak_saver_hour: number;
  streak_saver_minute: number;
  platform?: string;
  app_version?: string;
  updated_at: string;
}

export interface VipPromoCodeRow {
  code: string;
  description?: string;
  duration_days?: number;
  max_redemptions?: number;
  times_redeemed: number;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface TherapistPatientRow {
  id: string;
  patient_code: string;
  patient_alias?: string | null;
  therapist_id?: string | null;
  therapist_name?: string | null;
  clinic_name?: string | null;
  status: string;
  assigned_exercises?: any;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTableSummary {
  onboardingCount: number;
  researchCount: number;
  analyticsCount: number;
  schedulesCount: number;
  vipCodesCount: number;
  therapistsCount: number;
}

export const RLS_ENABLE_SQL = `-- 1-Click RLS Read Access for Speaso Admin
DROP POLICY IF EXISTS "Admins can view onboarding answers" ON public.onboarding_answers;
CREATE POLICY "Admins can view onboarding answers" ON public.onboarding_answers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can view research balbuties data" ON public.research_balbuties_data;
CREATE POLICY "Admins can view research balbuties data" ON public.research_balbuties_data FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can view notification schedules" ON public.user_notification_schedules;
CREATE POLICY "Admins can view notification schedules" ON public.user_notification_schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can view vip promo codes" ON public.vip_promo_codes;
CREATE POLICY "Admins can view vip promo codes" ON public.vip_promo_codes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can view therapist patients" ON public.therapist_patients;
CREATE POLICY "Admins can view therapist patients" ON public.therapist_patients FOR SELECT TO authenticated USING (true);
`;

export async function fetchSupabaseTableData<T>(
  endpoint: string,
  token?: string | null
): Promise<{ data: T[]; count: number; error?: string }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return { data: [], count: 0, error: 'Chybí konfigurace Supabase' };

  const queryUrl = `${url}/rest/v1/${endpoint}`;
  const makeReq = async (auth: string) => {
    return fetch(queryUrl, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: auth,
        Prefer: 'count=exact',
      },
    });
  };

  try {
    let res = await makeReq(token ? `Bearer ${token}` : `Bearer ${key}`);
    // If token returned 401/403 or empty due to missing RLS policy, try anon key fallback
    if ((!res.ok || (res.status === 200 && res.headers.get('content-range') === '*/0')) && token) {
      const fallback = await makeReq(`Bearer ${key}`);
      if (fallback.ok && fallback.headers.get('content-range') !== '*/0') {
        res = fallback;
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: [], count: 0, error: body.message || `HTTP ${res.status}` };
    }

    const range = res.headers.get('content-range');
    let count = 0;
    if (range && range.includes('/')) {
      const parsed = parseInt(range.split('/')[1], 10);
      if (!isNaN(parsed)) count = parsed;
    }
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], count };
  } catch (err: any) {
    return { data: [], count: 0, error: err?.message || 'Chyba sítě' };
  }
}

export async function fetchAdminSummary(token?: string | null): Promise<AdminTableSummary> {
  const [onboarding, research, analytics, schedules, vip, therapists] = await Promise.all([
    fetchSupabaseTableData<OnboardingAnswerRow>('onboarding_answers?select=id&limit=1', token),
    fetchSupabaseTableData<ResearchBalbutiesRow>('research_balbuties_data?select=id&limit=1', token),
    fetchSupabaseTableData<AnalyticsEventRow>('analytics_events?select=id&limit=1', token),
    fetchSupabaseTableData<NotificationScheduleRow>('user_notification_schedules?select=install_id&limit=1', token),
    fetchSupabaseTableData<VipPromoCodeRow>('vip_promo_codes?select=code&limit=1', token),
    fetchSupabaseTableData<TherapistPatientRow>('therapist_patients?select=id&limit=1', token),
  ]);

  return {
    onboardingCount: onboarding.count,
    researchCount: research.count,
    analyticsCount: analytics.count,
    schedulesCount: schedules.count,
    vipCodesCount: vip.count,
    therapistsCount: therapists.count,
  };
}

export async function fetchOnboardingAnswers(token?: string | null, limit = 50) {
  return fetchSupabaseTableData<OnboardingAnswerRow>(
    `onboarding_answers?select=*&order=created_at.desc&limit=${limit}`,
    token
  );
}

export async function fetchResearchRecords(token?: string | null, limit = 50) {
  return fetchSupabaseTableData<ResearchBalbutiesRow>(
    `research_balbuties_data?select=*&order=created_at.desc&limit=${limit}`,
    token
  );
}

export async function fetchAnalyticsEvents(token?: string | null, limit = 50) {
  return fetchSupabaseTableData<AnalyticsEventRow>(
    `analytics_events?select=*&order=created_at.desc&limit=${limit}`,
    token
  );
}

export async function fetchNotificationSchedules(token?: string | null, limit = 50) {
  return fetchSupabaseTableData<NotificationScheduleRow>(
    `user_notification_schedules?select=*&order=updated_at.desc&limit=${limit}`,
    token
  );
}

export async function fetchVipPromoCodes(token?: string | null, limit = 50) {
  return fetchSupabaseTableData<VipPromoCodeRow>(
    `vip_promo_codes?select=*&order=created_at.desc&limit=${limit}`,
    token
  );
}

export async function fetchTherapistPatients(token?: string | null, limit = 50) {
  return fetchSupabaseTableData<TherapistPatientRow>(
    `therapist_patients?select=*&order=updated_at.desc&limit=${limit}`,
    token
  );
}

// ============================================================
// CSV Data Export Engine (Excel & Sheets UTF-8 compatible)
// ============================================================

export async function exportTableToCsv(
  tableName: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes(',')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // UTF-8 BOM so Microsoft Excel opens Czech characters properly without garbling
    const bom = '\uFEFF';
    const headerLine = headers.map(escapeCsv).join(';');
    const rowLines = rows.map((r) => r.map(escapeCsv).join(';')).join('\n');
    const csvContent = `${bom}${headerLine}\n${rowLines}`;

    const filename = `speaso-${tableName}-${toDateKey()}.csv`;
    const file = new File(Paths.document, filename);
    file.write(csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: `Export ${tableName}`,
        UTI: 'public.comma-separated-values-text',
      });
      return { ok: true };
    }
    return { ok: false, error: 'Sdílení není na tomto zařízení k dispozici' };
  } catch (err: any) {
    console.warn('[admin] exportTableToCsv failed:', err);
    return { ok: false, error: err?.message || 'Chyba při exportu CSV' };
  }
}

export async function exportOnboardingCsv(rows: OnboardingAnswerRow[]) {
  const headers = [
    'ID',
    'Install ID',
    'Datum vytvoření',
    'Jazyk',
    'Platforma',
    'Verze aplikace',
    'Hlavní cíl',
    'Cíl (vlastní)',
    'Spouštěcí situace',
    'Situace (vlastní)',
    'Věková skupina',
    'Logopedická péče',
    'Denní čas (min)',
    'První scénář',
    'První věta',
  ];

  const dataRows = rows.map((r) => [
    r.id,
    r.install_id,
    r.created_at,
    r.lang || '',
    r.platform || '',
    r.app_version || '',
    r.goal || '',
    r.goal_other || '',
    Array.isArray(r.situations) ? r.situations.join(', ') : '',
    r.situations_other || '',
    r.age_group || '',
    r.therapy_status || '',
    r.daily_minutes ?? '',
    r.scenario_title || '',
    r.scenario_phrase || '',
  ]);

  return exportTableToCsv('onboarding_answers', headers, dataRows);
}

export async function exportResearchCsv(rows: ResearchBalbutiesRow[]) {
  const headers = [
    'ID',
    'Install ID',
    'Datum záznamu',
    'Hodnocení řeči (1-5)',
    'Hodiny spánku',
    'Sklenice vody',
    'Počasí',
    'Somatické tagy (tenze)',
    'Má poznámku v deníku',
    'Platforma',
    'Verze aplikace',
    'Vytvořeno v DB',
  ];

  const dataRows = rows.map((r) => [
    r.id,
    r.install_id,
    r.date,
    r.speech_rating,
    r.sleep_hours ?? '',
    r.water_glasses ?? '',
    r.weather || '',
    Array.isArray(r.somatic_tags) ? r.somatic_tags.join(', ') : '',
    r.has_journal_note ? 'ANO' : 'NE',
    r.platform || '',
    r.app_version || '',
    r.created_at,
  ]);

  return exportTableToCsv('research_balbuties_data', headers, dataRows);
}

export async function exportAnalyticsCsv(rows: AnalyticsEventRow[]) {
  const headers = [
    'ID',
    'Install ID',
    'Název události',
    'Vlastnosti (JSON)',
    'Platforma',
    'Verze aplikace',
    'Časové razítko',
  ];

  const dataRows = rows.map((r) => [
    r.id,
    r.install_id,
    r.event,
    r.properties ? JSON.stringify(r.properties) : '',
    r.platform || '',
    r.app_version || '',
    r.created_at,
  ]);

  return exportTableToCsv('analytics_events', headers, dataRows);
}

export async function exportSchedulesCsv(rows: NotificationScheduleRow[]) {
  const headers = [
    'Install ID',
    'Časové pásmo',
    'UTC posun (hodiny)',
    'Jazyk',
    'Denní trénink aktivní',
    'Trénink hodina',
    'Trénink minuta',
    'Ranní check-in aktivní',
    'Ráno hodina',
    'Ráno minuta',
    'Streak saver aktivní',
    'Streak saver hodina',
    'Streak saver minuta',
    'Platforma',
    'Verze aplikace',
    'Poslední aktualizace',
  ];

  const dataRows = rows.map((r) => [
    r.install_id,
    r.timezone,
    r.utc_offset_hours ?? '',
    r.language,
    r.practice_enabled ? 'ANO' : 'NE',
    r.practice_hour,
    r.practice_minute,
    r.morning_enabled ? 'ANO' : 'NE',
    r.morning_hour,
    r.morning_minute,
    r.streak_saver_enabled ? 'ANO' : 'NE',
    r.streak_saver_hour,
    r.streak_saver_minute,
    r.platform || '',
    r.app_version || '',
    r.updated_at,
  ]);

  return exportTableToCsv('user_notification_schedules', headers, dataRows);
}

export async function exportVipCsv(rows: VipPromoCodeRow[]) {
  const headers = [
    'Kód',
    'Popis',
    'Doba trvání (dny)',
    'Max uplatnění',
    'Počet uplatnění',
    'Platnost do',
    'Aktivní',
    'Datum vytvoření',
  ];

  const dataRows = rows.map((r) => [
    r.code,
    r.description || '',
    r.duration_days ?? 'Doživotní',
    r.max_redemptions ?? 'Neomezeně',
    r.times_redeemed,
    r.valid_until || '',
    r.is_active ? 'ANO' : 'NE',
    r.created_at,
  ]);

  return exportTableToCsv('vip_promo_codes', headers, dataRows);
}

export async function exportTherapistPatientsCsv(rows: TherapistPatientRow[]) {
  const headers = [
    'ID',
    'Kód pacienta',
    'Jméno logopeda',
    'Klinika / Ordinace',
    'Alias pacienta',
    'Stav',
    'Poznámky',
    'Datum vytvoření',
    'Poslední aktualizace',
  ];

  const dataRows = rows.map((r) => [
    r.id,
    r.patient_code,
    r.therapist_name || '',
    r.clinic_name || '',
    r.patient_alias || '',
    r.status,
    r.notes || '',
    r.created_at,
    r.updated_at,
  ]);

  return exportTableToCsv('therapist_patients', headers, dataRows);
}

