jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));

import {
  checkSupabaseHealth,
  sendTestOnboardingRow,
  sendTestResearchRecord,
  sendTestAnalyticsEvent,
  adminLogin,
  adminLogout,
  getStoredAdminSession,
  SUPABASE_STUDIO_URL,
} from '../lib/admin';
import { useStore } from '../state/store';

describe('Supabase Admin & Diagnostics', () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('exposes the direct Supabase Studio URL', () => {
    expect(SUPABASE_STUDIO_URL).toContain('supabase.com/dashboard/project/phmhpdwhyvvrsjrobyyp/editor');
  });

  it('performs live health check via RPC endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ success: false, error: 'invalid' }),
    } as any);

    const health = await checkSupabaseHealth();
    expect(health.ok).toBe(true);
    expect(health.status).toBe(200);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('sends test onboarding row and handles success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      text: async () => '',
    } as any);

    useStore.getState().setUser({
      situations: ['phone'],
      goal: 'calm',
    });

    const res = await sendTestOnboardingRow();
    expect(res.ok).toBe(true);
    expect(res.status).toBe(201);
  });

  it('sends test research record to balbuties dataset', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      text: async () => '',
    } as any);

    const res = await sendTestResearchRecord();
    expect(res.ok).toBe(true);
    expect(res.status).toBe(201);
  });

  it('sends test analytics event to analytics_events', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      text: async () => '',
    } as any);

    const res = await sendTestAnalyticsEvent();
    expect(res.ok).toBe(true);
    expect(res.status).toBe(201);
  });

  it('authenticates admin login with Supabase Auth credentials', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        access_token: 'fake-jwt-token',
        user: { email: 'admin@speaso.app', id: 'admin-123' },
      }),
    } as any);

    const res = await adminLogin('admin@speaso.app', 'SecretPass123');
    expect(res.ok).toBe(true);
    expect(res.session?.isAuthenticated).toBe(true);
    expect(res.session?.email).toBe('admin@speaso.app');

    const stored = await getStoredAdminSession();
    expect(stored.isAuthenticated).toBe(true);
    expect(stored.email).toBe('admin@speaso.app');

    await adminLogout();
    const afterLogout = await getStoredAdminSession();
    expect(afterLogout.isAuthenticated).toBe(false);
  });

  it('handles invalid admin login credentials', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 400,
      ok: false,
      json: async () => ({ msg: 'Invalid login credentials' }),
    } as any);

    const res = await adminLogin('wrong@speaso.app', 'badpassword');
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Invalid login credentials');
  });

  it('fetches admin summary counts across all tables', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-range' ? '0-0/5' : null),
      },
      json: async () => [{ id: '1' }],
    } as any);

    const { fetchAdminSummary } = require('../lib/admin');
    const summary = await fetchAdminSummary('test-token');
    expect(summary.onboardingCount).toBe(5);
    expect(summary.researchCount).toBe(5);
    expect(summary.analyticsCount).toBe(5);
    expect(summary.schedulesCount).toBe(5);
    expect(summary.vipCodesCount).toBe(5);
    expect(summary.therapistsCount).toBe(5);
  });

  it('fetches rows for onboarding, research, schedules, and therapists', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: {
        get: () => '0-1/2',
      },
      json: async () => [{ install_id: 'inst-1' }, { install_id: 'inst-2' }],
    } as any);

    const {
      fetchOnboardingAnswers,
      fetchResearchRecords,
      fetchAnalyticsEvents,
      fetchNotificationSchedules,
      fetchVipPromoCodes,
      fetchTherapistPatients,
    } = require('../lib/admin');

    const onb = await fetchOnboardingAnswers('token');
    expect(onb.data.length).toBe(2);
    expect(onb.count).toBe(2);

    const res = await fetchResearchRecords('token');
    expect(res.data.length).toBe(2);

    const ev = await fetchAnalyticsEvents('token');
    expect(ev.data.length).toBe(2);

    const sch = await fetchNotificationSchedules('token');
    expect(sch.data.length).toBe(2);

    const vip = await fetchVipPromoCodes('token');
    expect(vip.data.length).toBe(2);

    const ther = await fetchTherapistPatients('token');
    expect(ther.data.length).toBe(2);
  });

  it('syncs therapist patient pairing to Supabase', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      text: async () => '',
    } as any);

    const { syncTherapistPairing } = require('../lib/therapist');
    const res = await syncTherapistPairing({
      patientCode: 'SPE-8492',
      therapistName: 'Mgr. Lucie Novotná',
    });

    expect(res.ok).toBe(true);
    expect(res.status).toBe(201);
  });
});
