import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { translate } from '../i18n';
import type { SupportedLang } from './locale';
import { useStore, useShallow } from '../state/store';

const CHANNEL_ID = 'reminders';
const DAILY_ID = 'daily-reminder';
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

/**
 * Replaces the daily reminder with one at hour:minute (other notifications,
 * like the trial reminder, are left alone).
 * Doesn't prompt for permission — call ensureNotificationPermission() first.
 */
export async function scheduleDailyReminder(hour: number, minute: number, lang: SupportedLang) {
  await ensureChannel(lang);
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: translate(lang, 'reminders.title'),
      body: translate(lang, 'reminders.body'),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
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
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
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
 * Keeps the OS schedule in sync with the stored setting — reschedules when
 * the time or the language changes. Mounted once in the root layout.
 */
export function useReminderSync(active: boolean) {
  const { enabled, hour, minute, language } = useStore(useShallow((s) => ({
    enabled: s.reminder.enabled,
    hour: s.reminder.hour,
    minute: s.reminder.minute,
    language: s.language,
  })));

  useEffect(() => {
    // Before rehydration the store holds defaults — don't cancel a real schedule.
    if (!active) return;
    const sync = async () => {
      if (!enabled) {
        await cancelReminders();
        return;
      }
      // Permission revoked in system settings: keep the preference, skip scheduling.
      if (await notificationsAllowed()) await scheduleDailyReminder(hour, minute, language);
    };
    sync().catch((e) => console.warn('[reminders] sync failed:', e));
  }, [active, enabled, hour, minute, language]);
}
