import rawStrings from './strings.json';
import type { SupportedLang } from '../lib/locale';

export type { SupportedLang };

/**
 * strings.json maps every leaf key to `{ cs, en }`. A value is a string,
 * a string[] (e.g. weekdays, exercise steps) or a plural map
 * `{ one, few?, other }` where `#` is replaced by the count.
 */
type PluralMap = { one: string; few?: string; other: string };
type Value = string | string[] | PluralMap;
type Vars = Record<string, string | number>;

const resources: Record<SupportedLang, Record<string, Value>> = { cs: {}, en: {} };

function flatten(obj: Record<string, any>, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_meta') continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && 'cs' in v && 'en' in v) {
      resources.cs[key] = v.cs;
      resources.en[key] = v.en;
    } else if (v && typeof v === 'object') {
      flatten(v, key);
    }
  }
}
flatten(rawStrings);

function lookup(lang: SupportedLang, key: string): Value | undefined {
  const v = resources[lang][key] ?? resources.cs[key];
  if (v === undefined && __DEV__) console.warn(`[i18n] missing key: ${key}`);
  return v;
}

function interpolate(str: string, vars?: Vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

export function translate(lang: SupportedLang, key: string, vars?: Vars): string {
  const v = lookup(lang, key);
  return typeof v === 'string' ? interpolate(v, vars) : key;
}

export function translateList(lang: SupportedLang, key: string): string[] {
  const v = lookup(lang, key);
  return Array.isArray(v) ? v : [];
}

function pluralCategory(lang: SupportedLang, n: number): keyof PluralMap {
  if (n === 1) return 'one';
  if (lang === 'cs' && Number.isInteger(n) && n >= 2 && n <= 4) return 'few';
  return 'other';
}

export function translatePlural(lang: SupportedLang, key: string, n: number, vars?: Vars): string {
  const v = lookup(lang, key);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return key;
  const form = v[pluralCategory(lang, n)] ?? v.other;
  return interpolate(form.replace(/#/g, String(n)), vars);
}
