import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDateKey } from '../lib/dates';
import { detectDeviceLanguage, type SupportedLang } from '../lib/locale';
import { EMPTY_STREAK, registerActivity, type Session, type StreakData } from '../lib/streak';

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';
export type TherapyStatus = 'never' | 'past' | 'current' | 'self';
export type { SupportedLang };

const MAX_SESSIONS = 2000;

interface UserState {
  name: string;
  ageGroup: AgeGroup | null;
  situations: string[];
  goal: string | null;
  therapyStatus: TherapyStatus | null;
  dailyMinutes: 5 | 15 | 30;
  /** Free-text description from onboarding. Stays on the device. */
  note: string;
}

/**
 * Local cache of the RevenueCat entitlement. Written only by lib/purchases.ts
 * from CustomerInfo — never set it from UI code.
 */
export interface SubscriptionState {
  isPremium: boolean;
  isTrial: boolean;
  expiresAt: string | null;
}

interface AppState {
  onboardingDone: boolean;
  language: SupportedLang;
  remindersEnabled: boolean;

  user: UserState;
  subscription: SubscriptionState;
  streak: StreakData;
  sessions: Session[];
  panicUses: number;

  setOnboardingDone: (v: boolean) => void;
  setLanguage: (lang: SupportedLang) => void;
  setUser: (partial: Partial<UserState>) => void;
  setSubscription: (s: SubscriptionState) => void;
  recordSession: (exerciseId: string, durationSec: number) => void;
  incrementPanicUses: () => void;
}

const initialUser: UserState = {
  name: '',
  ageGroup: null,
  situations: [],
  goal: null,
  therapyStatus: null,
  dailyMinutes: 15,
  note: '',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingDone: false,
      language: detectDeviceLanguage(),
      remindersEnabled: false,

      user: initialUser,
      subscription: { isPremium: false, isTrial: false, expiresAt: null },
      streak: EMPTY_STREAK,
      sessions: [],
      panicUses: 0,

      setOnboardingDone: (v) => set({ onboardingDone: v }),
      setLanguage: (language) => set({ language }),
      setUser: (partial) => set((s) => ({ user: { ...s.user, ...partial } })),
      setSubscription: (subscription) => set({ subscription }),

      recordSession: (exerciseId, durationSec) =>
        set((s) => {
          const now = new Date();
          const today = toDateKey(now);
          const session: Session = {
            exerciseId,
            date: today,
            durationSec: Math.round(durationSec),
            completedAt: now.toISOString(),
          };
          return {
            sessions: [...s.sessions, session].slice(-MAX_SESSIONS),
            streak: registerActivity(s.streak, today),
          };
        }),

      incrementPanicUses: () => set((s) => ({ panicUses: s.panicUses + 1 })),
    }),
    {
      name: 'speasy-storage',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as any;
        if (version === 0) {
          // v0 was the prototype: fake progress numbers, per-exercise streak,
          // a premium flag that could be granted without paying. Keep only
          // what the user actually entered.
          return {
            onboardingDone: !!old.onboardingDone,
            language: old.language === 'en' ? 'en' : 'cs',
            remindersEnabled: false,
            user: { ...initialUser, ...(old.user ?? {}), note: '' },
            subscription: { isPremium: false, isTrial: false, expiresAt: null },
            streak: { ...EMPTY_STREAK, record: old.streak?.record ?? 0 },
            sessions: [],
            panicUses: old.progress?.panicUses ?? 0,
          };
        }
        return old;
      },
    },
  ),
);

function subscribeHydration(cb: () => void) {
  return useStore.persist.onFinishHydration(cb);
}

/** True once persisted state has been loaded from AsyncStorage. */
export function useStoreHydrated() {
  return useSyncExternalStore(subscribeHydration, () => useStore.persist.hasHydrated());
}

export const useIsPremium = () => useStore((s) => s.subscription.isPremium);

export { useShallow } from 'zustand/react/shallow';
