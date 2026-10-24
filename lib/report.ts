import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { translate, translatePlural } from '../i18n';
import { useStore, patientPairingCode, type Recording, type CheckIn } from '../state/store';
import { activityTitle, formatDate } from './activities';
import { addDays, toDateKey } from './dates';
import { currentStreak, type Session } from './streak';
import type { SupportedLang } from './locale';
import { calculateDiagnosticProfile } from './diagnostic';

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
  patientCode?: string;
  therapistName?: string;
  from: string;
  to: string;
  sessions: Session[];
  streak: number;
  panicUses: number;
  /** Average daily check-in (1–5) in the period, if any. */
  checkInAvg?: number | null;
  /** Daily check-in records in the period. */
  checkIns?: CheckIn[];
  recordings?: Recording[];
  diagnosticTensionScore?: number | null;
  diagnosticTriggers?: string[];
  diagnosticFrictionAreas?: string[];
}

/** Pure HTML builder — exported for tests and clinical PDF generation. */
export function buildReportHtml(data: ReportData, lang: SupportedLang): string {
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const { sessions, checkIns = [], recordings = [] } = data;
  const minutes = Math.round(sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);
  const activeDays = new Set(sessions.map((s) => s.date)).size;
  const rated = sessions.filter((s) => s.rating);
  const avgRating = rated.length
    ? (rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length).toFixed(1)
    : '—';

  // Activity breakdown
  const byActivity = new Map<string, { count: number; minutes: number }>();
  for (const s of sessions) {
    const row = byActivity.get(s.exerciseId) ?? { count: 0, minutes: 0 };
    row.count += 1;
    row.minutes += s.durationSec / 60;
    byActivity.set(s.exerciseId, row);
  }

  const activityRows = [...byActivity.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, row]) => `<tr><td>${esc(activityTitle(id, lang))}</td><td>${row.count}</td><td>${Math.round(row.minutes)} min</td></tr>`)
    .join('');

  // Journal entries
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

  // Lifestyle / Somatic correlations
  const sleepRecords = checkIns.filter((c) => c.sleepHours !== undefined);
  const goodSleep = sleepRecords.filter((c) => (c.sleepHours ?? 0) >= 7);
  const lowSleep = sleepRecords.filter((c) => (c.sleepHours ?? 0) < 7);
  const avgGoodSleep = goodSleep.length
    ? (goodSleep.reduce((acc, c) => acc + c.mood, 0) / goodSleep.length).toFixed(1)
    : null;
  const avgLowSleep = lowSleep.length
    ? (lowSleep.reduce((acc, c) => acc + c.mood, 0) / lowSleep.length).toFixed(1)
    : null;

  // Somatic tension tags frequency
  const tagCounts = new Map<string, number>();
  for (const c of checkIns) {
    if (c.tags) {
      for (const tag of c.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag, count]) => {
      const pct = checkIns.length ? Math.round((count / checkIns.length) * 100) : 0;
      return `<span class="tag-pill">${esc(t(`checkin.tag_${tag}`))} (${pct}&nbsp;%)</span>`;
    })
    .join(' ');

  // Audio Recordings Rows
  const recordingRows = [...recordings]
    .reverse()
    .slice(0, 15)
    .map((r) => `<tr>
      <td>${esc(formatDate(r.createdAt, lang))}</td>
      <td>${esc(activityTitle(r.exerciseId, lang))}</td>
      <td>${r.durationSec} s</td>
    </tr>`)
    .join('');

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
  <title>${esc(t('report.title'))}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #14241C;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.5;
    }
    .header-box {
      border-bottom: 2px solid #2E7D57;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-kicker {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #2E7D57;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    h1 {
      font-size: 20px;
      margin: 0 0 4px;
      color: #14241C;
      letter-spacing: -0.3px;
    }
    .patient-card {
      background: #F4F8F5;
      border: 1px solid #D8E7DD;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 10px;
      min-width: 220px;
    }
    .patient-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .patient-row b { color: #14241C; }
    .muted { color: #5B6F63; }
    h2 {
      font-size: 13px;
      color: #14241C;
      margin: 20px 0 8px;
      border-bottom: 1px solid #E5EFE8;
      padding-bottom: 4px;
      letter-spacing: -0.2px;
    }
    .stats {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      margin-bottom: 12px;
    }
    .stat {
      flex: 1;
      border: 1px solid #D8E7DD;
      background: #FAFCFA;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .stat b {
      display: block;
      font-size: 18px;
      color: #2E7D57;
      margin-bottom: 2px;
    }
    .stat-label {
      font-size: 10px;
      color: #5B6F63;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .info-bar {
      background: #F4F8F5;
      border-left: 3px solid #2E7D57;
      padding: 8px 12px;
      font-size: 11px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 12px;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #E8F0EA; vertical-align: middle; }
    th { font-size: 9.5px; color: #5B6F63; text-transform: uppercase; letter-spacing: 0.5px; background: #FAFDFB; }
    .tag-pill {
      display: inline-block;
      background: #E8F4EC;
      color: #1F5C3E;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 9.5px;
      font-weight: 600;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    /* Clinical Plan Sheet for Therapist */
    .clinical-sheet {
      page-break-inside: avoid;
      background: #FFFFFF;
      border: 1.5px dashed #2E7D57;
      border-radius: 8px;
      padding: 14px;
      margin-top: 24px;
    }
    .clinical-title {
      font-size: 12px;
      font-weight: 700;
      color: #2E7D57;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .form-grid {
      display: flex;
      gap: 16px;
      margin-bottom: 10px;
    }
    .form-col { flex: 1; font-size: 10px; }
    .form-col b { display: block; margin-bottom: 4px; color: #14241C; }
    .checkbox-row { display: flex; gap: 10px; color: #333; }
    .dotted-lines {
      border-bottom: 1px dotted #A3C2B1;
      height: 22px;
      width: 100%;
      margin-top: 4px;
    }
    .sign-row {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      padding-top: 10px;
      font-size: 10px;
      color: #555;
    }
    .footer {
      margin-top: 22px;
      border-top: 1px solid #E5EFE8;
      padding-top: 8px;
      font-size: 9px;
      color: #889A90;
      display: flex;
      justify-content: space-between;
    }
  </style>
  </head><body>

    <div class="header-box">
      <div>
        <div class="brand-kicker">Speaso · Clinical Fluency Care</div>
        <h1>${esc(t('report.title'))}</h1>
        <div class="muted">${esc(data.from)} – ${esc(data.to)}</div>
      </div>
      <div class="patient-card">
        <div class="patient-row"><span class="muted">${esc(t('report.patient_code'))}:</span> <b>${esc(data.patientCode || 'SPE-0000')}</b></div>
        <div class="patient-row"><span class="muted">${esc(t('report.patient_name'))}:</span> <b>${esc(data.name || t('settings.default_name'))}</b></div>
        ${data.therapistName ? `<div class="patient-row"><span class="muted">${esc(t('report.therapist'))}:</span> <b>${esc(data.therapistName)}</b></div>` : ''}
      </div>
    </div>

    <!-- Executive Summary KPIs -->
    <div class="stats">
      <div class="stat"><b>${sessions.length}</b><span class="stat-label">${esc(t('report.sessions'))}</span></div>
      <div class="stat"><b>${minutes}</b><span class="stat-label">${esc(t('report.minutes'))}</span></div>
      <div class="stat"><b>${activeDays}</b><span class="stat-label">${esc(t('report.active_days'))}</span></div>
      <div class="stat"><b>${avgRating}</b><span class="stat-label">${esc(t('report.avg_rating'))}</span></div>
    </div>

    <div class="info-bar">
      <b>${esc(t('report.streak'))}:</b> ${esc(translatePlural(lang, 'progress.streak_value', data.streak))} &nbsp;·&nbsp;
      <b>${esc(t('report.panic'))}:</b> ${data.panicUses} ${esc(t('report.sessions'))}${
        data.checkInAvg ? ` &nbsp;·&nbsp; <b>${esc(t('report.checkin_avg'))}: ${data.checkInAvg.toFixed(1)}/5</b>` : ''
      }
    </div>

    <!-- Tension & Diagnostic Profile -->
    ${data.diagnosticTensionScore !== undefined && data.diagnosticTensionScore !== null ? `
      <h2>${esc(t('report.tension_title'))}</h2>
      <div class="stats">
        <div class="stat"><b>${data.diagnosticTensionScore}/100</b><span class="stat-label">${esc(t('report.tension_score'))}</span></div>
        ${data.diagnosticTriggers && data.diagnosticTriggers.length > 0 ? `<div class="stat"><b>${data.diagnosticTriggers.length}</b><span class="stat-label">${esc(t('report.primary_triggers'))}</span></div>` : ''}
      </div>
      ${data.diagnosticTriggers && data.diagnosticTriggers.length > 0 ? `<p class="muted" style="margin: 4px 0;">${esc(t('report.primary_triggers'))}: <b>${esc(data.diagnosticTriggers.join(', '))}</b></p>` : ''}
      ${data.diagnosticFrictionAreas && data.diagnosticFrictionAreas.length > 0 ? `<p class="muted" style="margin: 4px 0;">${esc(t('report.friction_centers'))}: <b>${esc(data.diagnosticFrictionAreas.join(', '))}</b></p>` : ''}
    ` : ''}

    <!-- Lifestyle & Somatic Correlations -->
    ${checkIns.length > 0 ? `
      <h2>${esc(t('report.lifestyle_impact'))}</h2>
      <div style="margin-bottom: 6px;">
        ${avgGoodSleep && avgLowSleep ? `
          <p style="margin: 3px 0;">🌙 <b>${esc(t('report.sleep_impact_good', { n: avgGoodSleep }))}</b> vs. <b>${esc(t('report.sleep_impact_low', { n: avgLowSleep }))}</b></p>
        ` : ''}
        ${topTags ? `<p style="margin: 4px 0 2px;"><b>${esc(t('report.tags_col'))}:</b> ${topTags}</p>` : ''}
      </div>
    ` : ''}

    <!-- Audio Takes & Practice Archive -->
    ${recordings.length > 0 ? `
      <h2>${esc(t('report.recordings_title'))} (${recordings.length} ${esc(t('report.recordings_count'))})</h2>
      <p class="muted" style="font-size: 10px; margin: 2px 0 6px;">${esc(t('report.recordings_hint'))}</p>
      <table>
        <tr><th>${esc(t('report.date'))}</th><th>${esc(t('report.activity'))}</th><th>${esc(t('report.duration'))}</th></tr>
        ${recordingRows}
      </table>
    ` : ''}

    <!-- Practice Breakdown by Activity -->
    <h2>${esc(t('report.by_activity'))}</h2>
    ${activityRows
      ? `<table><tr><th>${esc(t('report.activity'))}</th><th>${esc(t('report.count'))}</th><th>${esc(t('report.minutes'))}</th></tr>${activityRows}</table>`
      : `<p class="muted">${esc(t('report.empty'))}</p>`}

    <!-- Journal & Practice Feedback -->
    <h2>${esc(t('report.journal'))}</h2>
    ${journalRows
      ? `<table><tr><th>${esc(t('report.date'))}</th><th>${esc(t('report.activity'))}</th><th>${esc(t('report.min'))}</th><th>${esc(t('report.rating'))}</th><th>${esc(t('report.note'))}</th></tr>${journalRows}</table>`
      : `<p class="muted">${esc(t('report.empty'))}</p>`}

    <!-- Daily Check-ins Table -->
    ${checkIns.length > 0 ? `
      <h2>${esc(t('report.checkins_title'))}</h2>
      <table>
        <tr>
          <th>${esc(t('report.date'))}</th>
          <th>${esc(t('report.mood_col'))}</th>
          <th>${esc(t('report.tags_col'))}</th>
          <th>${esc(t('report.sleep_col'))}</th>
          <th>${esc(t('report.water_col'))}</th>
          <th>${esc(t('report.weather_col'))}</th>
          <th>${esc(t('report.note'))}</th>
        </tr>
        ${checkIns.map((c) => `<tr>
          <td>${esc(formatDate(`${c.date}T12:00:00`, lang))}</td>
          <td><b>${c.mood}/5</b></td>
          <td>${c.tags && c.tags.length ? esc(c.tags.map((id) => t(`checkin.tag_${id}`)).join(', ')) : '—'}</td>
          <td>${c.sleepHours !== undefined ? `${c.sleepHours}h` : '—'}</td>
          <td>${c.waterGlasses !== undefined ? `${c.waterGlasses} skl.` : '—'}</td>
          <td>${c.weather ? esc(t(`checkin.weather_${c.weather}`)) : '—'}</td>
          <td>${c.note ? esc(c.note) : ''}</td>
        </tr>`).join('')}
      </table>
    ` : ''}

    <p class="muted" style="margin-top: 14px; font-size: 9.5px;">${esc(t('report.rating_explain'))}</p>

    <!-- Clinical Therapist Worksheet -->
    <div class="clinical-sheet">
      <div class="clinical-title">📋 ${esc(t('report.clinical_plan_title'))}</div>
      <div class="form-grid">
        <div class="form-col">
          <b>${esc(t('report.clinical_frequency'))}:</b>
          <div class="checkbox-row">
            <span>[ &nbsp; ] 5 min/den</span>
            <span>[ &nbsp; ] 15 min/den</span>
            <span>[ &nbsp; ] 30 min/den</span>
          </div>
        </div>
        <div class="form-col">
          <b>${esc(t('report.clinical_target_wpm'))}:</b>
          <div class="checkbox-row">
            <span>[ &nbsp; ] 65 WPM (Klidné)</span>
            <span>[ &nbsp; ] 95 WPM (Plynulé)</span>
            <span>[ &nbsp; ] 125 WPM (Běžné)</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 8px;">
        <b style="font-size: 10px; color: #14241C;">${esc(t('report.clinical_focus'))} &amp; ${esc(t('report.note'))}:</b>
        <div class="dotted-lines"></div>
        <div class="dotted-lines"></div>
        <div class="dotted-lines"></div>
      </div>

      <div class="sign-row">
        <div><b>${esc(t('report.clinical_next_visit'))}:</b> _________________________</div>
        <div><b>${esc(t('report.clinical_signature'))}:</b> _________________________</div>
      </div>
    </div>

    <div class="footer">
      <span>${esc(t('report.footer'))}</span>
      <span>Speaso Clinical v1.0 · ${esc(data.from)} – ${esc(data.to)}</span>
    </div>

  </body></html>`;
}

/** Builds the last-30-days report as a PDF and opens the system share sheet. */
export async function exportReport(lang: SupportedLang) {
  const { user, sessions, streak, panicUses, checkIns, recordings, installId } = useStore.getState();
  const today = toDateKey();
  const from = addDays(today, -(REPORT_DAYS - 1));
  const diag = user.situations?.length ? calculateDiagnosticProfile(user, lang) : null;
  const data: ReportData = {
    name: user.name,
    patientCode: patientPairingCode(installId),
    therapistName: user.therapistName,
    from: formatDate(`${from}T12:00:00`, lang),
    to: formatDate(`${today}T12:00:00`, lang),
    sessions: sessions.filter((s) => s.date >= from && s.date <= today),
    streak: currentStreak(streak, today),
    panicUses,
    checkInAvg: (() => {
      const inRange = checkIns.filter((c) => c.date >= from && c.date <= today);
      return inRange.length ? inRange.reduce((sum, c) => sum + c.mood, 0) / inRange.length : null;
    })(),
    checkIns: checkIns.filter((c) => c.date >= from && c.date <= today).sort((a, b) => b.date.localeCompare(a.date)),
    recordings: recordings.filter((r) => {
      const d = r.createdAt.slice(0, 10);
      return d >= from && d <= today;
    }),
    diagnosticTensionScore: diag?.tensionScore ?? null,
    diagnosticTriggers: diag?.primaryTriggers.map((pt) => pt.title) ?? [],
    diagnosticFrictionAreas: diag?.vocalFrictionAreas.map((fa) => translate(lang, fa.titleKey)) ?? [],
  };
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(data, lang) });
  if (!(await Sharing.isAvailableAsync())) throw new Error('SHARING_UNAVAILABLE');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: translate(lang, 'report.title'),
  });
}

