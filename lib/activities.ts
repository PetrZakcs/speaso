import { translate } from '../i18n';
import { getSituation } from '../content/situations';
import type { SupportedLang } from './locale';

/** Display name of a session/recording activity id (`breathing`, `situation:phone`, …). */
export function activityTitle(activityId: string, lang: SupportedLang): string {
  if (activityId.startsWith('situation:')) {
    const situation = getSituation(activityId.slice('situation:'.length));
    return situation ? situation.content[lang].title : activityId;
  }
  return translate(lang, `exercises.${activityId}`);
}

export function formatDate(iso: string, lang: SupportedLang): string {
  return new Date(iso).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}
