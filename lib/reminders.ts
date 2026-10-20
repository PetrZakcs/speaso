import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { translate } from '../i18n';
import type { SupportedLang } from './locale';
import { useStore, useShallow, type ReminderSettings } from '../state/store';
import { dailyPlan, doneOn } from './plan';
import { reminderDates } from './reminderSchedule';
import { toDateKey } from './dates';
import { useToday } from './useToday';
import { trackEvent } from './analytics';

const CHANNEL_ID = 'reminders';
/** Legacy id of the old repeating reminder (cleaned up on sync). */
const LEGACY_DAILY_ID = 'daily-reminder';
const DAILY_PREFIX = 'daily-';
const MORNING_PREFIX = 'morning-';
const STREAK_PREFIX = 'streak-';
const TRIAL_ID = 'trial-reminder';
/** How long before the trial ends we remind the user. */
export const TRIAL_REMINDER_DAYS = 2;

type NotificationsModule = typeof import('expo-notifications');
let loaded: NotificationsModule | null | undefined;

/** Expo Go on Android no longer ships expo-notifications (SDK 53+). */
const UNSUPPORTED_RUNTIME =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * expo-notifications, loaded lazily: in Expo Go on Android merely importing
 * it throws asynchronously, which crashed the whole app at startup. There it
 * is never loaded and reminders are simply off; development and store builds
 * are unaffected.
 */
function notifications(): NotificationsModule | null {
  if (loaded === undefined) {
    if (UNSUPPORTED_RUNTIME) {
      loaded = null;
      return loaded;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      loaded = require('expo-notifications') as NotificationsModule;
      loaded.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch (e) {
      console.warn('[reminders] notifications unavailable in this runtime:', e);
      loaded = null;
    }
  }
  return loaded;
}

export function notificationsSupported() {
  return notifications() !== null;
}

export const REMINDER_TIMES = [
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 30 },
];

export const MORNING_REMINDER_TIMES = [
  { hour: 7, minute: 0 },
  { hour: 7, minute: 30 },
  { hour: 8, minute: 0 },
  { hour: 8, minute: 30 },
  { hour: 9, minute: 0 },
];

export const STREAK_REMINDER_TIMES = [
  { hour: 20, minute: 0 },
  { hour: 20, minute: 30 },
  { hour: 21, minute: 0 },
  { hour: 21, minute: 30 },
];

export function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/** Asks for permission if needed. Returns whether notifications are allowed. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = notifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureChannel(lang: SupportedLang) {
  const Notifications = notifications();
  if (!Notifications) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: translate(lang, 'reminders.channel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function cancelDailyReminders() {
  const Notifications = notifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (n) =>
          n.identifier.startsWith(DAILY_PREFIX) ||
          n.identifier.startsWith(MORNING_PREFIX) ||
          n.identifier.startsWith(STREAK_PREFIX) ||
          n.identifier === LEGACY_DAILY_ID,
      )
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Replaces daily and slot reminders with scheduled notifications on the given dates.
 */
export async function scheduleAllReminders(
  settings: ReminderSettings,
  planDoneToday: boolean,
  checkInDoneToday: boolean,
  lang: SupportedLang,
) {
  const Notifications = notifications();
  if (!Notifications) return;
  await ensureChannel(lang);
  await cancelDailyReminders();

  const now = new Date();

  // 1. Daily practice
  if (settings.enabled) {
    const dates = reminderDates(now, settings.hour, settings.minute, planDoneToday);
    for (const date of dates) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${DAILY_PREFIX}${toDateKey(date)}`,
        content: {
          title: translate(lang, 'reminders.title'),
          body: translate(lang, 'reminders.body'),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
      });
    }
  }

  // 2. Morning check-in
  if (settings.morningEnabled) {
    const mHour = settings.morningHour ?? 8;
    const mMinute = settings.morningMinute ?? 0;
    const dates = reminderDates(now, mHour, mMinute, checkInDoneToday);
    for (const date of dates) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${MORNING_PREFIX}${toDateKey(date)}`,
        content: {
          title: translate(lang, 'reminders.morning_title'),
          body: translate(lang, 'reminders.morning_body'),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
      });
    }
  }

  // 3. Streak saver
  if (settings.streakSaverEnabled) {
    const sHour = settings.streakSaverHour ?? 20;
    const sMinute = settings.streakSaverMinute ?? 30;
    const dates = reminderDates(now, sHour, sMinute, planDoneToday);
    for (const date of dates) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${STREAK_PREFIX}${toDateKey(date)}`,
        content: {
          title: translate(lang, 'reminders.streak_title'),
          body: translate(lang, 'reminders.streak_body'),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
      });
    }
  }
}

/**
 * Legacy single-slot scheduler for backward compatibility.
 */
export async function scheduleDailyReminders(dates: Date[], lang: SupportedLang) {
  const Notifications = notifications();
  if (!Notifications) return;
  await ensureChannel(lang);
  await cancelDailyReminders();
  for (const date of dates) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${DAILY_PREFIX}${toDateKey(date)}`,
      content: {
        title: translate(lang, 'reminders.title'),
        body: translate(lang, 'reminders.body'),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
    });
  }
}

/**
 * One-off reminder TRIAL_REMINDER_DAYS before a free trial ends — the paywall
 * promises it, so it is scheduled whenever a trial is active and allowed.
 */
export async function scheduleTrialReminder(expiresAt: string, lang: SupportedLang) {
  const Notifications = notifications();
  if (!Notifications) return;
  const when = new Date(expiresAt).getTime() - TRIAL_REMINDER_DAYS * 24 * 60 * 60 * 1000;
  await Notifications.cancelScheduledNotificationAsync(TRIAL_ID).catch(() => {});
  if (when <= Date.now() || !(await notificationsAllowed())) return;
  await ensureChannel(lang);
  await Notifications.scheduleNotificationAsync({
    identifier: TRIAL_ID,
    content: {
      title: translate(lang, 'reminders.trial_title'),
      body: translate(lang, 'reminders.trial_body', { n: TRIAL_REMINDER_DAYS }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
  });
}

export async function cancelTrialReminder() {
  const Notifications = notifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(TRIAL_ID).catch(() => {});
}

export async function cancelReminders() {
  await cancelDailyReminders();
}

export async function notificationsAllowed(): Promise<boolean> {
  const Notifications = notifications();
  if (!Notifications) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

/**
 * Syncs user notification schedule preferences to backend telemetry and Supabase.
 * Lets the team know peak delivery windows and when users prefer to be reminded.
 */
export async function syncReminderSchedule(settings: ReminderSettings): Promise<boolean> {
  const { user, installId, language } = useStore.getState();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const utcOffsetHours = -(new Date().getTimezoneOffset() / 60);

  // 1. Track via product analytics event
  trackEvent('reminder_schedule_updated', {
    practice_enabled: settings.enabled,
    practice_hour: settings.hour,
    practice_minute: settings.minute,
    morning_enabled: settings.morningEnabled ?? false,
    morning_hour: settings.morningHour ?? 8,
    morning_minute: settings.morningMinute ?? 0,
    streak_saver_enabled: settings.streakSaverEnabled ?? false,
    streak_saver_hour: settings.streakSaverHour ?? 20,
    streak_saver_minute: settings.streakSaverMinute ?? 30,
    timezone,
    utc_offset_hours: utcOffsetHours,
  });

  // 2. Upsert directly to user_notification_schedules table if opted in
  if (!user.shareAnswers) return false;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  const payload = {
    install_id: installId,
    timezone,
    utc_offset_hours: utcOffsetHours,
    language,
    practice_enabled: settings.enabled,
    practice_hour: settings.hour,
    practice_minute: settings.minute,
    morning_enabled: settings.morningEnabled ?? false,
    morning_hour: settings.morningHour ?? 8,
    morning_minute: settings.morningMinute ?? 0,
    streak_saver_enabled: settings.streakSaverEnabled ?? false,
    streak_saver_hour: settings.streakSaverHour ?? 20,
    streak_saver_minute: settings.streakSaverMinute ?? 30,
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${url}/rest/v1/user_notification_schedules`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    if (__DEV__) console.warn('[reminders] sync schedule failed:', e);
    return false;
  }
}

/** Turns the daily reminder on (asking for permission). Returns false if denied. */
export async function enableReminder(hour: number, minute: number): Promise<boolean> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;
  const current = useStore.getState().reminder;
  const next: ReminderSettings = { ...current, enabled: true, hour, minute };
  useStore.getState().setReminder(next);
  syncReminderSchedule(next).catch(() => {});
  return true;
}

/** Updates arbitrary reminder settings and syncs telemetry. */
export async function updateReminderSettings(partial: Partial<ReminderSettings>): Promise<boolean> {
  const current = useStore.getState().reminder;
  const next: ReminderSettings = { ...current, ...partial };
  const wantsAnyOn = next.enabled || next.morningEnabled || next.streakSaverEnabled;
  if (wantsAnyOn) {
    const allowed = await ensureNotificationPermission();
    if (!allowed) return false;
  }
  useStore.getState().setReminder(next);
  syncReminderSchedule(next).catch(() => {});
  return true;
}

export function disableReminder() {
  const { reminder, setReminder } = useStore.getState();
  const next: ReminderSettings = { ...reminder, enabled: false };
  setReminder(next);
  syncReminderSchedule(next).catch(() => {});
}

/**
 * Keeps the OS schedule in sync: the next 7 days for enabled slots, minus
 * today once the plan or check-in is done. Re-runs on changes.
 */
export function useReminderSync(active: boolean) {
  const today = useToday();
  const { reminder, language, planDoneToday, checkInDoneToday } = useStore(useShallow((s) => {
    const plan = dailyPlan(today, s.user.dailyMinutes, s.user.situations, s.subscription.isPremium);
    const done = doneOn(s.sessions, today);
    const checkInDone = s.checkIns.some((c) => c.date === today);
    return {
      reminder: s.reminder,
      language: s.language,
      planDoneToday: plan.every((i) => done.has(i.activityId)),
      checkInDoneToday: checkInDone,
    };
  }));

  useEffect(() => {
    // Before rehydration the store holds defaults — don't cancel a real schedule.
    if (!active) return;
    const sync = async () => {
      const anyEnabled = reminder.enabled || reminder.morningEnabled || reminder.streakSaverEnabled;
      if (!anyEnabled) {
        await cancelReminders();
        return;
      }
      // Permission revoked in system settings: keep the preference, skip scheduling.
      if (await notificationsAllowed()) {
        await scheduleAllReminders(reminder, planDoneToday, checkInDoneToday, language);
      }
    };
    sync().catch((e) => console.warn('[reminders] sync failed:', e));
  }, [active, reminder, language, planDoneToday, checkInDoneToday, today]);
}

