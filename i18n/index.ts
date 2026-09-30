import * as Localization from 'expo-localization';
import rawStrings from './strings.json';

const resources: Record<string, Record<string, string | string[]>> = { cs: {}, en: {} };

function flatten(obj: any, prefix = '') {
  for (const [k, v] of Object.entries(obj as Record<string, any>)) {
    if (k === '_meta') continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && 'cs' in v && 'en' in v) {
      resources.cs[key] = Array.isArray(v.cs) ? v.cs : String(v.cs);
      resources.en[key] = Array.isArray(v.en) ? v.en : String(v.en);
    } else if (v && typeof v === 'object') {
      flatten(v, key);
    }
  }
}
flatten(rawStrings);

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'cs';
let _lang: string = ['cs', 'en'].includes(deviceLang) ? deviceLang : 'cs';
const _listeners: Set<() => void> = new Set();

export function getLang() { return _lang; }

export function setLang(lang: string) {
  _lang = lang;
  _listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function t(key: string, vars?: Record<string, string>): any {
  const val = resources[_lang]?.[key] ?? resources['cs']?.[key] ?? key;
  if (Array.isArray(val)) return val;
  let str = String(val);
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  }
  return str;
}

export type SupportedLang = 'cs' | 'en';
