import { translate } from '../i18n';
import { getSituation } from '../content/situations';
import { useStore } from '../state/store';
import type { SupportedLang } from './locale';
import { SCENARIO_PREFIX } from './scenarios';

/** Display name of a session/recording activity id (`breathing`, `situation:phone`, …). */
export function activityTitle(activityId: string, lang: SupportedLang): string {
  if (activityId.startsWith(SCENARIO_PREFIX)) {
    const id = activityId.slice(SCENARIO_PREFIX.length);
    return useStore.getState().scenarios.find((s) => s.id === id)?.title ?? translate(lang, 'scenarios.deleted');
  }
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
