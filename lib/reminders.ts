import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { translate } from '../i18n';
import type { SupportedLang } from './locale';
import { useStore, useShallow } from '../state/store';
import { dailyPlan, doneOn } from './plan';
import { reminderDates } from './reminderSchedule';
import { toDateKey } from './dates';
import { useToday } from './useToday';

const CHANNEL_ID = 'reminders';
/** Legacy id of the old repeating reminder (cleaned up on sync). */
const LEGACY_DAILY_ID = 'daily-reminder';
const DAILY_PREFIX = 'daily-';
const TRIAL_ID = 'trial-reminder';
/** How long before the trial ends we remind the user. */
export const TRIAL_REMINDER_DAYS = 2;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const REMINDER_TIMES = [
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 30 },
];

export function formatTime(hour: number, minute: number) {
  return `${hour}:${minute.toString().padStart(2, '0')}`;
}

/** Asks for permission if needed. Returns whether notifications are allowed. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureChannel(lang: SupportedLang) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: translate(lang, 'reminders.channel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function cancelDailyReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(DAILY_PREFIX) || n.identifier === LEGACY_DAILY_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Replaces the daily reminders with one-off notifications on the given
 * dates (see reminderDates — today is skipped once the plan is done).
 * Doesn't prompt for permission — call ensureNotificationPermission() first.
 */
export async function scheduleDailyReminders(dates: Date[], lang: SupportedLang) {
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
  await Notifications.cancelScheduledNotificationAsync(TRIAL_ID).catch(() => {});
}

export async function cancelReminders() {
  await cancelDailyReminders();
}

export async function notificationsAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Turns the daily reminder on (asking for permission). Returns false if denied. */
export async function enableReminder(hour: number, minute: number): Promise<boolean> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;
  useStore.getState().setReminder({ enabled: true, hour, minute });
  return true;
}

export function disableReminder() {
  const { reminder, setReminder } = useStore.getState();
  setReminder({ ...reminder, enabled: false });
}

/**
 * Keeps the OS schedule in sync: the next 7 days at the chosen time, minus
 * today once the plan is done. Re-runs when the time, language, plan state
 * or the day changes. Mounted once in the root layout.
 */
export function useReminderSync(active: boolean) {
  const today = useToday();
  const { enabled, hour, minute, language, planDoneToday } = useStore(useShallow((s) => {
    const plan = dailyPlan(today, s.user.dailyMinutes, s.user.situations, s.subscription.isPremium);
    const done = doneOn(s.sessions, today);
    return {
      enabled: s.reminder.enabled,
      hour: s.reminder.hour,
      minute: s.reminder.minute,
      language: s.language,
      planDoneToday: plan.every((i) => done.has(i.activityId)),
    };
  }));

  useEffect(() => {
    // Before rehydration the store holds defaults — don't cancel a real schedule.
    if (!active) return;
    const sync = async () => {
      if (!enabled) {
        await cancelReminders();
        return;
      }
      // Permission revoked in system settings: keep the preference, skip scheduling.
      if (await notificationsAllowed()) {
        await scheduleDailyReminders(reminderDates(new Date(), hour, minute, planDoneToday), language);
      }
    };
    sync().catch((e) => console.warn('[reminders] sync failed:', e));
  }, [active, enabled, hour, minute, language, planDoneToday, today]);
}
