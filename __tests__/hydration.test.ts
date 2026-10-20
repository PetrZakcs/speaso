jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'speaso-storage';

/** Loads a fresh copy of the store module against whatever is in storage. */
async function bootWith(raw: string | null) {
  await AsyncStorage.clear();
  if (raw !== null) await AsyncStorage.setItem(KEY, raw);
  let mod!: typeof import('../state/store');
  jest.isolateModules(() => {
    mod = require('../state/store');
  });
  // let the async hydration chain settle
  for (let i = 0; i < 20; i++) await new Promise<void>((r) => setImmediate(r));
  return mod;
}

const v0 = {
  version: 0,
  state: {
    onboardingDone: true,
    language: 'cs',
    user: { name: 'Petr', vocative: 'Petře', ageGroup: 'adult', situations: ['Telefonát'], goal: 'fluency', therapyStatus: 'self', dailyMinutes: 15 },
    subscription: { tier: 'premium', trialActive: true, trialEndsAt: null },
    usage: { weeklyExercises: 2, weekStartDate: '2026-06-15' },
    streak: { days: 3, record: 3, weekMap: [true, false, false, false, false, false, false] },
    progress: { fluency: [58], blocks: [30], exercisesTotal: 2, panicUses: 1 },
    therapist: null,
  },
};

describe('hydration on existing installs', () => {
  it('finishes hydrating from prototype (v0) data', async () => {
    const { useStore, isStoreReady } = await bootWith(JSON.stringify(v0));
    expect(isStoreReady()).toBe(true);
    expect(useStore.getState().onboardingDone).toBe(true);
    expect(useStore.getState().user.name).toBe('Petr');
  });

  it('finishes hydrating from phase-1 (v1) data', async () => {
    const v1 = {
      version: 1,
      state: {
        onboardingDone: true,
        language: 'en',
        remindersEnabled: false,
        user: { name: 'Anna', ageGroup: 'adult', situations: [], goal: null, therapyStatus: null, dailyMinutes: 5, note: '' },
        subscription: { isPremium: false, isTrial: false, expiresAt: null },
        streak: { current: 1, record: 1, lastActiveDate: '2026-09-30' },
        sessions: [{ exerciseId: 'breathing', date: '2026-09-30', durationSec: 60, completedAt: '2026-09-30T10:00:00.000Z' }],
        panicUses: 0,
      },
    };
    const { useStore, isStoreReady } = await bootWith(JSON.stringify(v1));
    expect(isStoreReady()).toBe(true);
    expect(useStore.getState().sessions[0].id).toBeTruthy();
  });

  it('still becomes ready (with defaults) when stored data is corrupted', async () => {
    const { useStore, isStoreReady } = await bootWith('{not json');
    expect(isStoreReady()).toBe(true);
    expect(useStore.getState().onboardingDone).toBe(false);
  });

  it('becomes ready on a fresh install', async () => {
    const { isStoreReady } = await bootWith(null);
    expect(isStoreReady()).toBe(true);
  });
});
