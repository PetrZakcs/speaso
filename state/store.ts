import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDateKey, type DateKey } from '../lib/dates';
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
const MAX_CHECKINS = 730;
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
  /** "Something else" answers typed during onboarding. */
  situationsOther: string;
  goalOther: string;
  /** Opt-in to send onboarding answers (anonymously) to the Speasy team. */
  shareAnswers: boolean;
}

/** A practice scenario the user wrote themselves. */
export interface CustomScenario {
  id: string;
  title: string;
  phrases: string[];
  /** Optional real-world challenge; a generic one is used when empty. */
  challenge: string;
  createdAt: string;
}

/** Free users can practise one own scenario; more need Premium. */
export const FREE_SCENARIOS_LIMIT = 1;
export const MAX_SCENARIO_PHRASES = 8;

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

/** Daily "how is speaking today?" check-in (one per day, last one wins). */
export interface CheckIn {
  date: DateKey;
  mood: Rating;
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
  checkIns: CheckIn[];
  scenarios: CustomScenario[];
  /** Anonymous random id, only used to de-duplicate submitted answers. */
  installId: string;
  /** Onboarding answers are waiting to be sent (offline at the time). */
  answersPending: boolean;

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
  setCheckIn: (mood: Rating) => void;
  /** Saves a new scenario and returns its id. */
  addScenario: (s: Pick<CustomScenario, 'title' | 'phrases' | 'challenge'>) => string;
  updateScenario: (id: string, s: Pick<CustomScenario, 'title' | 'phrases' | 'challenge'>) => void;
  removeScenario: (id: string) => void;
  setAnswersPending: (v: boolean) => void;
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
  situationsOther: '',
  goalOther: '',
  shareAnswers: false,
};

/** Trims text and drops empty phrases so stored scenarios are always clean. */
function cleanScenario(s: Pick<CustomScenario, 'title' | 'phrases' | 'challenge'>) {
  return {
    title: s.title.trim(),
    phrases: s.phrases.map((p) => p.trim()).filter(Boolean).slice(0, MAX_SCENARIO_PHRASES),
    challenge: s.challenge.trim(),
  };
}

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
      checkIns: [],
      scenarios: [],
      installId: newId(new Date()),
      answersPending: false,

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

      setCheckIn: (mood) =>
        set((s) => {
          const date = toDateKey();
          const rest = s.checkIns.filter((c) => c.date !== date);
          return { checkIns: [...rest, { date, mood }].slice(-MAX_CHECKINS) };
        }),

      addScenario: (input) => {
        const now = new Date();
        const scenario: CustomScenario = { ...cleanScenario(input), id: newId(now), createdAt: now.toISOString() };
        set((s) => ({ scenarios: [...s.scenarios, scenario] }));
        return scenario.id;
      },

      updateScenario: (id, input) =>
        set((s) => ({
          scenarios: s.scenarios.map((x) => (x.id === id ? { ...x, ...cleanScenario(input) } : x)),
        })),

      removeScenario: (id) => set((s) => ({ scenarios: s.scenarios.filter((x) => x.id !== id) })),

      setAnswersPending: (answersPending) => set({ answersPending }),
    }),
    {
      name: 'speasy-storage',
      version: 4,
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
        if (version <= 2) {
          // v3: daily check-ins.
          old = { ...old, checkIns: old.checkIns ?? [] };
        }
        if (version <= 3) {
          // v4: own scenarios, typed onboarding answers, opt-in answer sharing.
          old = {
            ...old,
            user: { ...initialUser, ...(old.user ?? {}) },
            scenarios: old.scenarios ?? [],
            installId: old.installId ?? newId(new Date()),
            answersPending: false,
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
