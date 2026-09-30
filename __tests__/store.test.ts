jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

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
  });
});
