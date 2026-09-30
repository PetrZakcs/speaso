import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toVocative } from '../lib/vocative';

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';
export type TherapyStatus = 'never' | 'past' | 'current' | 'self';
export type SubscriptionTier = 'free' | 'premium';
export type SupportedLang = 'cs' | 'en';

interface UserState {
  name: string;
  vocative: string;
  ageGroup: AgeGroup | null;
  situations: string[];
  goal: string | null;
  therapyStatus: TherapyStatus | null;
  dailyMinutes: 5 | 15 | 30;
}

interface SubscriptionState {
  tier: SubscriptionTier;
  trialActive: boolean;
  trialEndsAt: string | null;
}

interface UsageState {
  weeklyExercises: number;
  weekStartDate: string; // ISO Monday date
}

interface StreakState {
  days: number;
  record: number;
  weekMap: boolean[]; // [Mon..Sun]
}

interface ProgressState {
  fluency: number[];
  blocks: number[];
  exercisesTotal: number;
  panicUses: number;
}

interface TherapistState {
  name: string;
  connected: boolean;
  liveSharing: boolean;
}

interface AppState {
  onboardingDone: boolean;
  language: SupportedLang;
  remindersEnabled: boolean;
  soundsEnabled: boolean;
  panicLockscreen: boolean;

  user: UserState;
  subscription: SubscriptionState;
  usage: UsageState;
  streak: StreakState;
  progress: ProgressState;
  therapist: TherapistState | null;

  // Actions
  setOnboardingDone: (v: boolean) => void;
  setLanguage: (lang: SupportedLang) => void;
  setUser: (partial: Partial<UserState>) => void;
  setName: (name: string) => void;
  setSubscription: (partial: Partial<SubscriptionState>) => void;
  incrementWeeklyExercises: () => void;
  resetWeeklyIfNeeded: () => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  incrementPanicUses: () => void;
  incrementExercisesTotal: () => void;
  setTherapist: (t: TherapistState | null) => void;
  toggleReminders: () => void;
  toggleSounds: () => void;
  togglePanicLockscreen: () => void;
}

function getMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingDone: false,
      language: 'cs',
      remindersEnabled: true,
      soundsEnabled: true,
      panicLockscreen: false,

      user: {
        name: '',
        vocative: '',
        ageGroup: null,
        situations: [],
        goal: null,
        therapyStatus: null,
        dailyMinutes: 15,
      },

      subscription: {
        tier: 'free',
        trialActive: false,
        trialEndsAt: null,
      },

      usage: {
        weeklyExercises: 0,
        weekStartDate: getMondayISO(),
      },

      streak: {
        days: 0,
        record: 0,
        weekMap: [false, false, false, false, false, false, false],
      },

      progress: {
        fluency: [58, 62, 60, 65, 68, 66, 70],
        blocks: [30, 28, 27, 25, 22, 21, 19],
        exercisesTotal: 0,
        panicUses: 0,
      },

      therapist: null,

      setOnboardingDone: (v) => set({ onboardingDone: v }),
      setLanguage: (lang) => set({ language: lang }),

      setUser: (partial) =>
        set((s) => ({ user: { ...s.user, ...partial } })),

      setName: (name) =>
        set((s) => ({
          user: {
            ...s.user,
            name,
            vocative: s.language === 'cs' ? toVocative(name) : name,
          },
        })),

      setSubscription: (partial) =>
        set((s) => ({ subscription: { ...s.subscription, ...partial } })),

      incrementWeeklyExercises: () => {
        get().resetWeeklyIfNeeded();
        set((s) => ({
          usage: { ...s.usage, weeklyExercises: s.usage.weeklyExercises + 1 },
        }));
      },

      resetWeeklyIfNeeded: () => {
        const monday = getMondayISO();
        if (get().usage.weekStartDate !== monday) {
          set({ usage: { weeklyExercises: 0, weekStartDate: monday } });
        }
      },

      incrementStreak: () =>
        set((s) => {
          const newDays = s.streak.days + 1;
          const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon
          const weekMap = [...s.streak.weekMap] as boolean[];
          weekMap[todayIdx] = true;
          return {
            streak: {
              days: newDays,
              record: Math.max(newDays, s.streak.record),
              weekMap,
            },
          };
        }),

      resetStreak: () =>
        set((s) => ({
          streak: { ...s.streak, days: 0 },
        })),

      incrementPanicUses: () =>
        set((s) => ({
          progress: { ...s.progress, panicUses: s.progress.panicUses + 1 },
        })),

      incrementExercisesTotal: () =>
        set((s) => ({
          progress: {
            ...s.progress,
            exercisesTotal: s.progress.exercisesTotal + 1,
          },
        })),

      setTherapist: (t) => set({ therapist: t }),
      toggleReminders: () => set((s) => ({ remindersEnabled: !s.remindersEnabled })),
      toggleSounds: () => set((s) => ({ soundsEnabled: !s.soundsEnabled })),
      togglePanicLockscreen: () => set((s) => ({ panicLockscreen: !s.panicLockscreen })),
    }),
    {
      name: 'speasy-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { useShallow } from 'zustand/react/shallow';
