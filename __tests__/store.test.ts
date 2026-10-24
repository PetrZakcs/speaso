jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));
const deleted: string[] = [];
jest.mock('../lib/recordings', () => ({
  deleteRecordingFile: (name: string) => deleted.push(name),
}));

import { useStore } from '../state/store';
import { toDateKey } from '../lib/dates';

describe('store', () => {
  it('defaults language to the device language', () => {
    expect(useStore.getState().language).toBe('en');
  });

  it('records a session and counts the day towards the streak', () => {
    useStore.getState().recordSession('breathing', 125.4);
    useStore.getState().recordSession('reading', 60);
    const { sessions, streak } = useStore.getState();
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toMatchObject({ exerciseId: 'breathing', durationSec: 125, date: toDateKey() });
    expect(streak.current).toBe(1);
  });

  it('migrates v0 prototype data without fake stats or free premium', () => {
    const migrate = useStore.persist.getOptions().migrate!;
    const v0 = {
      onboardingDone: true,
      language: 'cs',
      user: { name: 'Petr', vocative: 'Petře', ageGroup: 'adult', situations: [], goal: 'fluency', therapyStatus: 'self', dailyMinutes: 15 },
      subscription: { tier: 'premium', trialActive: true, trialEndsAt: null },
      streak: { days: 9, record: 12, weekMap: [true, true, true, true, true, true, true] },
      progress: { fluency: [58, 62], blocks: [30, 28], exercisesTotal: 4, panicUses: 3 },
    };
    const migrated = migrate(v0, 0) as any;
    expect(migrated.onboardingDone).toBe(true);
    expect(migrated.user.name).toBe('Petr');
    expect(migrated.user.note).toBe('');
    expect(migrated.subscription.isPremium).toBe(false);
    expect(migrated.streak).toEqual({ current: 0, record: 12, lastActiveDate: null });
    expect(migrated.panicUses).toBe(3);
    expect(migrated.progress).toBeUndefined();
    // v0 flows through the v1→v2 step as well
    expect(migrated.recordings).toEqual([]);
    expect(migrated.reminder).toEqual({
      enabled: false,
      hour: 18,
      minute: 0,
      morningEnabled: false,
      morningHour: 8,
      morningMinute: 0,
      streakSaverEnabled: false,
      streakSaverHour: 20,
      streakSaverMinute: 30,
    });
    expect(migrated.remindersEnabled).toBeUndefined();
  });

  it('migrates v4 to v5 with full reminder slots', () => {
    const migrate = useStore.persist.getOptions().migrate!;
    const v4 = {
      onboardingDone: true,
      reminder: { enabled: true, hour: 19, minute: 15 },
    };
    const migrated = migrate(v4, 4) as any;
    expect(migrated.reminder).toEqual({
      enabled: true,
      hour: 19,
      minute: 15,
      morningEnabled: false,
      morningHour: 8,
      morningMinute: 0,
      streakSaverEnabled: false,
      streakSaverHour: 20,
      streakSaverMinute: 30,
    });
  });

  it('migrates v1 sessions to have ids', () => {
    const migrate = useStore.persist.getOptions().migrate!;
    const v1 = {
      onboardingDone: true,
      remindersEnabled: false,
      sessions: [{ exerciseId: 'reading', date: '2026-09-29', durationSec: 60, completedAt: '2026-09-29T10:00:00.000Z' }],
    };
    const migrated = migrate(v1, 1) as any;
    expect(migrated.sessions[0].id).toBeTruthy();
    expect(migrated.recordings).toEqual([]);
  });

  it("marks sessions that belong to today's plan", () => {
    useStore.setState((s) => ({ user: { ...s.user, dailyMinutes: 15, situations: ['phone'] } }));
    const planId = useStore.getState().recordSession('situation:phone', 300);
    const extraId = useStore.getState().recordSession('reading', 300);
    const byId = (id: string) => useStore.getState().sessions.find((x) => x.id === id)!;
    expect(byId(planId).inPlan).toBe(true);
    expect(byId(extraId).inPlan).toBe(false);
  });

  it('keeps one check-in per day — the last answer wins', () => {
    useStore.getState().setCheckIn(2);
    useStore.getState().setCheckIn(4);
    const today = useStore.getState().checkIns.filter((c) => c.date === toDateKey());
    expect(today).toEqual([{ date: toDateKey(), mood: 4 }]);
  });

  it('migrates v2 to v3 with empty check-ins', () => {
    const migrate = useStore.persist.getOptions().migrate!;
    const migrated = migrate({ onboardingDone: true, sessions: [], recordings: [] }, 2) as any;
    expect(migrated.checkIns).toEqual([]);
  });

  it('rates a session by id', () => {
    const id = useStore.getState().recordSession('metronome', 300);
    useStore.getState().rateSession(id, 4, '  went ok  ');
    const s = useStore.getState().sessions.find((x) => x.id === id)!;
    expect(s.rating).toBe(4);
    expect(s.note).toBe('went ok');
  });

  it('keeps only the last 3 recordings for free users and deletes the files', () => {
    const { addRecording } = useStore.getState();
    for (let i = 1; i <= 4; i++) addRecording({ fileName: `${i}.m4a`, exerciseId: 'reading', durationSec: 10 });
    expect(useStore.getState().recordings.map((r) => r.fileName)).toEqual(['2.m4a', '3.m4a', '4.m4a']);
    expect(deleted).toContain('1.m4a');
  });

  it('keeps every recording for premium users', () => {
    useStore.setState({ recordings: [], subscription: { isPremium: true, isTrial: false, expiresAt: null } });
    const { addRecording } = useStore.getState();
    for (let i = 1; i <= 5; i++) addRecording({ fileName: `p${i}.m4a`, exerciseId: 'reading', durationSec: 10 });
    expect(useStore.getState().recordings).toHaveLength(5);
  });

  it('stores check-in with holistic somatic tags', () => {
    useStore.getState().setCheckIn({
      mood: 4,
      sleepHours: 8,
      waterGlasses: 7,
      weather: 'sunny',
      tags: ['throat_tension', 'fast_pace'],
      note: 'Felt relaxed after breathing',
    });
    const today = useStore.getState().checkIns.find((c) => c.date === toDateKey());
    expect(today?.tags).toEqual(['throat_tension', 'fast_pace']);
    expect(today?.sleepHours).toBe(8);
  });

  it('marks streak milestones as celebrated without duplicates', () => {
    const { markMilestoneCelebrated } = useStore.getState();
    markMilestoneCelebrated(3);
    markMilestoneCelebrated(7);
    markMilestoneCelebrated(3); // duplicate
    expect(useStore.getState().celebratedMilestones).toEqual([3, 7]);
  });

  it('manages biometric lock and app lock status', () => {
    const { setBiometricsEnabled, setAppLocked } = useStore.getState();
    expect(useStore.getState().biometricsEnabled).toBe(false);
    expect(useStore.getState().isAppLocked).toBe(false);

    setBiometricsEnabled(true);
    setAppLocked(true);
    expect(useStore.getState().biometricsEnabled).toBe(true);
    expect(useStore.getState().isAppLocked).toBe(true);

    setAppLocked(false);
    expect(useStore.getState().isAppLocked).toBe(false);
  });

  it('clearPracticeData resets sessions, checkIns, streak and panicUses', () => {
    useStore.setState({
      sessions: [{ id: '1', exerciseId: 'reading', date: toDateKey(), durationSec: 60, completedAt: new Date().toISOString() }],
      checkIns: [{ date: toDateKey(), mood: 5 }],
      recordings: [{ id: 'r1', fileName: 'test.m4a', exerciseId: 'reading', createdAt: new Date().toISOString(), durationSec: 10 }],
      streak: { current: 5, record: 10, lastActiveDate: toDateKey() },
      panicUses: 4,
      scenarios: [{ id: 's1', title: 'Test', phrases: ['Hi'], challenge: 'None', createdAt: new Date().toISOString() }],
      celebratedMilestones: [3],
    });

    useStore.getState().clearPracticeData();

    const state = useStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.checkIns).toEqual([]);
    expect(state.recordings).toEqual([]);
    expect(state.streak).toEqual({ current: 0, record: 0, lastActiveDate: null });
    expect(state.panicUses).toBe(0);
    expect(state.scenarios).toEqual([]);
    expect(state.celebratedMilestones).toEqual([]);
  });

  it('resetAllData resets onboardingDone and user to clean state', () => {
    useStore.setState({
      onboardingDone: true,
      user: { name: 'Test User', ageGroup: 'adult', situations: ['phone'], goal: 'calm', therapyStatus: 'self', dailyMinutes: 30, note: '', situationsOther: '', goalOther: '', shareAnswers: true, hasRedeemedReferral: false },
      biometricsEnabled: true,
    });

    useStore.getState().resetAllData();

    const state = useStore.getState();
    expect(state.onboardingDone).toBe(false);
    expect(state.user.name).toBe('');
    expect(state.biometricsEnabled).toBe(false);
    expect(state.sessions).toEqual([]);
  });
});

