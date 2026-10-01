import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { translate, translatePlural } from '../i18n';
import { useStore } from '../state/store';
import { activityTitle, formatDate } from './activities';
import { addDays, toDateKey } from './dates';
import { currentStreak, type Session } from './streak';
import type { SupportedLang } from './locale';

export const REPORT_DAYS = 30;

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ReportData {
  name: string;
  from: string;
  to: string;
  sessions: Session[];
  streak: number;
  panicUses: number;
}

/** Pure HTML builder — exported for tests. */
export function buildReportHtml(data: ReportData, lang: SupportedLang): string {
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const { sessions } = data;
  const minutes = Math.round(sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);
  const activeDays = new Set(sessions.map((s) => s.date)).size;
  const rated = sessions.filter((s) => s.rating);
  const avgRating = rated.length
    ? (rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length).toFixed(1)
    : '—';

  const byActivity = new Map<string, { count: number; minutes: number }>();
  for (const s of sessions) {
    const row = byActivity.get(s.exerciseId) ?? { count: 0, minutes: 0 };
    row.count += 1;
    row.minutes += s.durationSec / 60;
    byActivity.set(s.exerciseId, row);
  }

  const activityRows = [...byActivity.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, row]) => `<tr><td>${esc(activityTitle(id, lang))}</td><td>${row.count}</td><td>${Math.round(row.minutes)}</td></tr>`)
    .join('');

  const journalRows = [...sessions]
    .reverse()
    .map((s) => `<tr>
      <td>${esc(formatDate(s.completedAt, lang))}</td>
      <td>${esc(activityTitle(s.exerciseId, lang))}</td>
      <td>${Math.max(1, Math.round(s.durationSec / 60))}</td>
      <td>${s.rating ? `${s.rating}/5` : '—'}</td>
      <td>${s.note ? esc(s.note) : ''}</td>
    </tr>`)
    .join('');

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 32px; font-size: 12px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 24px 0 8px; }
    .muted { color: #666; }
    .stats { display: flex; gap: 12px; margin-top: 16px; }
    .stat { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
    .stat b { display: block; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    th { font-size: 11px; color: #666; }
    .footer { margin-top: 28px; font-size: 10px; color: #888; }
  </style></head><body>
    <h1>${esc(t('report.title'))}</h1>
    <div class="muted">${esc(data.name || t('settings.default_name'))} · ${esc(data.from)} – ${esc(data.to)}</div>

    <div class="stats">
      <div class="stat"><b>${sessions.length}</b>${esc(t('report.sessions'))}</div>
      <div class="stat"><b>${minutes}</b>${esc(t('report.minutes'))}</div>
      <div class="stat"><b>${activeDays}</b>${esc(t('report.active_days'))}</div>
      <div class="stat"><b>${avgRating}</b>${esc(t('report.avg_rating'))}</div>
    </div>
    <p class="muted">${esc(t('report.streak'))}: ${esc(translatePlural(lang, 'progress.streak_value', data.streak))} ·
      ${esc(t('report.panic'))}: ${data.panicUses}</p>

    <h2>${esc(t('report.by_activity'))}</h2>
    ${activityRows
      ? `<table><tr><th>${esc(t('report.activity'))}</th><th>${esc(t('report.count'))}</th><th>${esc(t('report.minutes'))}</th></tr>${activityRows}</table>`
      : `<p class="muted">${esc(t('report.empty'))}</p>`}

    <h2>${esc(t('report.journal'))}</h2>
    ${journalRows
      ? `<table><tr><th>${esc(t('report.date'))}</th><th>${esc(t('report.activity'))}</th><th>${esc(t('report.min'))}</th><th>${esc(t('report.rating'))}</th><th>${esc(t('report.note'))}</th></tr>${journalRows}</table>`
      : `<p class="muted">${esc(t('report.empty'))}</p>`}

    <p class="muted">${esc(t('report.rating_explain'))}</p>
    <div class="footer">${esc(t('report.footer'))}</div>
  </body></html>`;
}

/** Builds the last-30-days report as a PDF and opens the system share sheet. */
export async function exportReport(lang: SupportedLang) {
  const { user, sessions, streak, panicUses } = useStore.getState();
  const today = toDateKey();
  const from = addDays(today, -(REPORT_DAYS - 1));
  const data: ReportData = {
    name: user.name,
    from: formatDate(`${from}T12:00:00`, lang),
    to: formatDate(`${today}T12:00:00`, lang),
    sessions: sessions.filter((s) => s.date >= from && s.date <= today),
    streak: currentStreak(streak, today),
    panicUses,
  };
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(data, lang) });
  if (!(await Sharing.isAvailableAsync())) throw new Error('SHARING_UNAVAILABLE');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: translate(lang, 'report.title'),
  });
}
