import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDateKey } from '../lib/dates';
import { detectDeviceLanguage, type SupportedLang } from '../lib/locale';
import {
  EMPTY_STREAK, registerActivity, type Rating, type Session, type StreakData,
} from '../lib/streak';
import { deleteRecordingFile } from '../lib/recordings';
import { isInPlan } from '../lib/plan';

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';
export type TherapyStatus = 'never' | 'past' | 'current' | 'self';
export type { SupportedLang };

const MAX_SESSIONS = 2000;
/** Free users keep their most recent recordings only. */
export const FREE_RECORDINGS_LIMIT = 3;

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

export interface Recording {
  id: string;
  /** File name inside <documents>/recordings — resolve with recordingUri(). */
  fileName: string;
  /** Exercise id, or `situation:<id>`. */
  exerciseId: string;
  createdAt: string;
  durationSec: number;
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

interface AppState {
  onboardingDone: boolean;
  language: SupportedLang;
  reminder: ReminderSettings;

  user: UserState;
  subscription: SubscriptionState;
  streak: StreakData;
  sessions: Session[];
  panicUses: number;
  recordings: Recording[];

  setOnboardingDone: (v: boolean) => void;
  setLanguage: (lang: SupportedLang) => void;
  setUser: (partial: Partial<UserState>) => void;
  setSubscription: (s: SubscriptionState) => void;
  /** Saves a finished session and returns its id (for rating it afterwards). */
  recordSession: (exerciseId: string, durationSec: number) => string;
  rateSession: (id: string, rating: Rating, note?: string) => void;
  incrementPanicUses: () => void;
  addRecording: (recording: Omit<Recording, 'id' | 'createdAt'>) => void;
  removeRecording: (id: string) => void;
  setReminder: (reminder: ReminderSettings) => void;
}

const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 18, minute: 0 };

function newId(now: Date) {
  return `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
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

/*
 * Readiness is tracked separately from zustand's hasHydrated(): that flag
 * never flips when hydration throws (corrupted JSON, a failing migration or
 * write), which left the app rendering nothing forever. onRehydrateStorage's
 * callback runs on success *and* on error, so the app always starts.
 */
let storeReady = false;
const readyListeners = new Set<() => void>();

function markStoreReady() {
  storeReady = true;
  readyListeners.forEach((cb) => cb());
}

export function isStoreReady() {
  return storeReady;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingDone: false,
      language: detectDeviceLanguage(),
      reminder: DEFAULT_REMINDER,

      user: initialUser,
      subscription: { isPremium: false, isTrial: false, expiresAt: null },
      streak: EMPTY_STREAK,
      sessions: [],
      panicUses: 0,
      recordings: [],

      setOnboardingDone: (v) => set({ onboardingDone: v }),
      setLanguage: (language) => set({ language }),
      setUser: (partial) => set((s) => ({ user: { ...s.user, ...partial } })),
      setSubscription: (subscription) => set({ subscription }),

      recordSession: (exerciseId, durationSec) => {
        const now = new Date();
        const today = toDateKey(now);
        const { user, subscription } = get();
        const session: Session = {
          id: newId(now),
          exerciseId,
          date: today,
          durationSec: Math.round(durationSec),
          completedAt: now.toISOString(),
          inPlan: isInPlan(exerciseId, today, user.dailyMinutes, user.situations, subscription.isPremium),
        };
        set((s) => ({
          sessions: [...s.sessions, session].slice(-MAX_SESSIONS),
          streak: registerActivity(s.streak, today),
        }));
        return session.id;
      },

      rateSession: (id, rating, note) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, rating, note: note?.trim() || undefined } : x,
          ),
        })),

      incrementPanicUses: () => set((s) => ({ panicUses: s.panicUses + 1 })),

      addRecording: (rec) => {
        const now = new Date();
        const recording: Recording = { ...rec, id: newId(now), createdAt: now.toISOString() };
        let recordings = [...get().recordings, recording];
        if (!get().subscription.isPremium && recordings.length > FREE_RECORDINGS_LIMIT) {
          const dropped = recordings.slice(0, recordings.length - FREE_RECORDINGS_LIMIT);
          dropped.forEach((r) => deleteRecordingFile(r.fileName));
          recordings = recordings.slice(-FREE_RECORDINGS_LIMIT);
        }
        set({ recordings });
      },

      removeRecording: (id) => {
        const rec = get().recordings.find((r) => r.id === id);
        if (rec) deleteRecordingFile(rec.fileName);
        set((s) => ({ recordings: s.recordings.filter((r) => r.id !== id) }));
      },

      setReminder: (reminder) => set({ reminder }),
    }),
    {
      name: 'speasy-storage',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('[store] rehydration failed, starting with defaults:', error);
        markStoreReady();
      },
      migrate: (persisted, version) => {
        let old = (persisted ?? {}) as any;
        if (version === 0) {
          // v0 was the prototype: fake progress numbers, per-exercise streak,
          // a premium flag that could be granted without paying. Keep only
          // what the user actually entered.
          old = {
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
        if (version <= 1) {
          // v2: sessions get ids, recordings and reminder settings.
          const { remindersEnabled: _unused, ...rest } = old;
          old = {
            ...rest,
            sessions: (old.sessions ?? []).map((x: Session, i: number) => ({
              ...x,
              id: x.id ?? `${x.completedAt}-${i}`,
            })),
            recordings: [],
            reminder: DEFAULT_REMINDER,
          };
        }
        return old;
      },
    },
  ),
);

function subscribeReady(cb: () => void) {
  readyListeners.add(cb);
  return () => {
    readyListeners.delete(cb);
  };
}

/** True once persisted state has been loaded (or loading failed and defaults are used). */
export function useStoreHydrated() {
  return useSyncExternalStore(subscribeReady, isStoreReady);
}

export const useIsPremium = () => useStore((s) => s.subscription.isPremium);

export { useShallow } from 'zustand/react/shallow';
